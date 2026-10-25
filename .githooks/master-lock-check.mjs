// The master lock's checker. One script, three modes, so the git hook and /commit-change
// apply exactly the same rules:
//   hook <state>            run by .githooks/reference-transaction on every ref update;
//                           exits non-zero to refuse an update of the default branch.
//   gate <number> [--rev R] the review-record gate for one change (the record in the
//                           working tree, or in revision R); exit 1 if it fails.
//   status                  is the lock switched on in this copy of the project?
//
// Nothing project-specific lives here: the default branch, change prefix, version files
// and the first checked change number come from CLAUDE.md (see readConfig). The written
// rules this implements are the "Review gate" in /commit-change and the policy's peer
// review section; they stay the specification. The records are free prose, so the gate reads
// their labelled lines exactly but the re-review rounds only by keyword (a rejection, "clean",
// a verdict word such as accepted/resolved); it cannot check item by item that each outcome was
// accepted. /commit-change reads the record itself as well and stops if the two disagree.
//
// Every unexpected problem refuses (exit 2): the lock fails closed.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ownDir = path.dirname(fileURLToPath(import.meta.url));
const ZERO = /^0+$/;
const RECORDS_DIR = 'docs/reviews';
const SEVERITIES = ['High', 'Medium', 'Low', 'Nit', 'Informational'];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}
function gitTry(args) {
  try { return git(args); } catch { return null; }
}
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------------------------------------------------------------- settings from CLAUDE.md

function lineValue(text, label) {
  const m = text.match(new RegExp(`^[ \\t]*[-*]?[ \\t]*\\*\\*${esc(label)}:\\*\\*(.*)$`, 'mi'));
  return m ? m[1].trim() : null;
}
function firstWord(value) {
  if (value === null) return null;
  const tick = value.match(/`([^`]+)`/);
  const w = (tick ? tick[1] : value).trim();
  return w || null;
}

// The default branch alone, so an update of any other branch can be waved through
// without needing the rest of the settings to be complete.
function defaultBranchOf(claudeMd) {
  return firstWord(lineValue(claudeMd, 'Default branch'));
}

function readConfig(claudeMd) {
  const problems = [];
  if (claudeMd === null) return { ok: false, problems: ['CLAUDE.md cannot be read'] };
  const defaultBranch = defaultBranchOf(claudeMd);
  if (!defaultBranch) problems.push('CLAUDE.md has no "Default branch" line');
  const prefix = firstWord(lineValue(claudeMd, 'Change prefix'));
  if (!prefix) problems.push('CLAUDE.md has no "Change prefix" line');
  const vf = lineValue(claudeMd, 'Version files');
  const versionFiles = vf === null ? [] : [...vf.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (versionFiles.length === 0) problems.push('CLAUDE.md has no "Version files" line naming files');
  const startRaw = firstWord(lineValue(claudeMd, 'Master lock starts at'));
  let start = null;
  if (!startRaw) problems.push('CLAUDE.md has no "Master lock starts at" line');
  else if (prefix) {
    const m = startRaw.match(new RegExp(`^${esc(prefix)}-(\\d{3,})$`));
    if (!m) problems.push(`"Master lock starts at" (${startRaw}) is not a change number with the prefix ${prefix}`);
    else start = parseInt(m[1], 10);
  }
  return { ok: problems.length === 0, problems, defaultBranch, prefix, versionFiles, start, startRaw };
}

// ---------------------------------------------------------------- the review gate

function splitSections(text) {
  const sections = {};
  let name = null;
  for (const line of text.split('\n')) {
    const h = line.match(/^## (.+?)\s*$/);
    if (h) { name = h[1].toLowerCase(); sections[name] = []; continue; }
    if (name !== null) sections[name].push(line);
  }
  const out = {};
  for (const [k, v] of Object.entries(sections)) out[k] = v.join('\n');
  return out;
}
function sectionStarting(sections, prefix) {
  const key = Object.keys(sections).find((k) => k.startsWith(prefix));
  return key === undefined ? null : sections[key];
}

function findingBlocks(body) {
  const lines = body.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^- /.test(lines[i])) continue;
    const block = [lines[i]];
    // The block runs over indented lines, and over blank lines that are followed by more indented text.
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue;
      if (!/^\s+\S/.test(lines[j])) break;
      block.push(...lines.slice(i + 1, j + 1));
      i = j;
    }
    const text = block.join('\n');
    // A bullet is a finding if it has the severity form, or carries a finding's own labelled lines
    // (so a finding written without the severity form is caught and refused, not skipped).
    if (/^- \*\*\[[^\]]*\]\*\*/.test(text) || /\*\*(?:Caused by this change|Disposition):\*\*/.test(text)) blocks.push(text);
  }
  return blocks;
}

function judgeFinding(block) {
  const title = block.split('\n')[0].replace(/^- /, '').slice(0, 90);
  const sev = block.match(/^- \*\*\[([^\]]*)\]\*\*/);
  let severity = sev && SEVERITIES.includes(sev[1]) ? sev[1] : null;
  const labelMatch = block.match(/\*\*Caused by this change:\*\*\s*\**\s*(yes|no)\b/i);
  let label = labelMatch ? labelMatch[1].toLowerCase() : null;
  const dispMatch = block.match(/\*\*Disposition:\*\*\s*\**\s*([A-Za-z]+)/);
  let disposition = null;
  if (dispMatch) disposition = ['fixed', 'explained', 'logged'].includes(dispMatch[1].toLowerCase()) ? dispMatch[1].toLowerCase() : 'other';

  // The gate reads a finding as corrected by its latest "Correction (round N)" line.
  const corrections = block.split(/\*\*Correction \(round \d+\):\*\*/).slice(1);
  if (corrections.length > 0) {
    const c = corrections[corrections.length - 1];
    const cl = c.match(/caused(?: by this change)?:?\s*\**\s*(yes|no)\b/i);
    if (cl) label = cl[1].toLowerCase();
    const cs = c.match(/\[(High|Medium|Low|Nit|Informational)\]/);
    if (cs) severity = cs[1];
    const cd = c.match(/Disposition (?:is now|now reads|:)\s*\**\s*(fixed|explained|logged)/i) || c.match(/^\s*\**\s*(fixed|explained|logged)\b/i);
    if (cd) disposition = cd[1].toLowerCase();
  }
  const settled = /Settled by the user:/.test(block);
  const failures = [];
  if (!severity) failures.push(`A finding has no severity: "${title}".`);
  if (!label) failures.push(`A finding has no "Caused by this change: yes/no" label: "${title}".`);
  if (!disposition) failures.push(`A finding has no disposition: "${title}".`);
  else if (disposition === 'other') failures.push(`A finding is left open or accepted as is, not fixed, explained or logged: "${title}".`);
  if (label === 'yes' && disposition === 'logged' && !settled) {
    failures.push(`A finding this change caused was logged instead of fixed or explained: "${title}".`);
  }
  return failures;
}

function splitRounds(body) {
  const rounds = [];
  const parts = body.split(/^### Round (\d+)([^\n]*)$/m);
  for (let i = 1; i < parts.length; i += 3) rounds.push({ n: parseInt(parts[i], 10), heading: parts[i + 1], text: parts[i + 2] });
  return rounds;
}
function hasRejection(text) {
  const t = text
    .replace(/\b(?:no|none|nothing|zero|without any)\s+(?:\w+\s+){0,3}(?:rejections?|rejected)\b/gi, '')
    .replace(/\b(?:not|never)\s+rejected\b/gi, '')
    .replace(/\brejections?:\s*(?:none|no)\b/gi, '')
    .replace(/\brejected\s+(?:nothing|none)\b/gi, '');
  return /\b(?:rejected|rejects|rejection|did not accept|does not accept|not accepted)\b/i.test(t);
}
function saysNotClean(text) {
  return /not clean|clean:\s*\**\s*no\b|isn'?t clean|wasn'?t clean|was not clean/i.test(text);
}
// A round that says in so many words that it was clean cannot be holding a standing rejection:
// "clean" means every outcome was accepted. So a rejection mentioned in passing (an earlier
// outcome that was then fixed and accepted) does not fail such a round.
function statesCleanRound(text) {
  return !saysNotClean(text) && /round clean:\s*\**\s*yes\b|\b(?:round|it) (?:was|is) \**clean\b/i.test(text);
}
function isCleanRound(text) {
  return !saysNotClean(text) && /\bclean\b/i.test(text);
}

function traceRows(body) {
  const rows = [];
  for (const line of body.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.length < 2 || /^-+$/.test(cells[0].replace(/[:\s]/g, '')) || /^requirement$/i.test(cells[0])) continue;
    rows.push({ id: cells[0], result: cells[cells.length - 1].replace(/\*/g, '').trim() });
  }
  return rows;
}

// Returns { exempt, failures }. Old-format records are exempt.
function evaluateRecord(raw) {
  const text = raw.replace(/\r\n/g, '\n');
  const newFormat = /^- \*\*Review format:\*\* accountability/m.test(text) || /^\s*\*\*Caused by this change:\*\*/m.test(text);
  if (!newFormat) return { exempt: true, failures: [] };
  const sections = splitSections(text);
  const failures = [];

  const findingsBody = sectionStarting(sections, 'findings') ?? '';
  const blocks = findingBlocks(findingsBody);
  for (const b of blocks) failures.push(...judgeFinding(b));

  const trace = traceRows(sectionStarting(sections, 'requirements trace') ?? '');
  for (const r of trace) if (/^fail/i.test(r.result)) failures.push(`Requirement ${r.id} failed its test.`);
  const fixedFail = trace.some((r) => /fixed after fail/i.test(r.result));

  const reBody = sectionStarting(sections, 're-review');
  const rounds = reBody === null ? [] : splitRounds(reBody);
  if ((blocks.length > 0 || fixedFail) && rounds.length === 0) {
    failures.push('There are findings (or a fixed failed requirement) but no re-review round is recorded.');
  }
  if (rounds.length > 0) {
    const last = rounds[rounds.length - 1];
    const lastSettled = /Settled by the user:/.test(last.text);
    if (hasRejection(last.text) && !lastSettled && !statesCleanRound(last.text)) {
      failures.push(`The last re-review round (round ${last.n}) records a rejection that no later round resolves.`);
    }
    if (!isCleanRound(last.text) && !lastSettled) {
      failures.push(`The re-review loop did not finish: the last round (round ${last.n}) is not clean and is not settled by the user.`);
    }
    rounds.forEach((r, idx) => {
      const settled = /Settled by the user:/.test(r.text);
      if (idx >= 3 && !settled) {
        failures.push(`Round ${r.n} is beyond the third and does not carry "Settled by the user:" authorising it.`);
      }
      // The re-reviewer's verdict on the outcomes it checked has to be written down in every round.
      // (The records word the verdict in several ways: accepted, resolved, confirmed, verified.)
      if (!settled && !/\b(?:accept\w*|resolved|confirm\w*|verified)\b/i.test(r.text)) {
        failures.push(`Round ${r.n} does not say whether the re-reviewer accepted the outcomes it checked.`);
      }
    });
  }
  return { exempt: false, failures };
}

// Finds a change's review record: in a git revision, or (rev === null) in the working tree.
function findRecord(number, rev) {
  const isRecord = (name) => name.startsWith(`${number}-`) && name.endsWith('.md') && !name.endsWith('-before.md');
  let names;
  if (rev) {
    const out = git(['ls-tree', '--name-only', rev, `${RECORDS_DIR}/`]);
    names = out.split('\n').filter(Boolean).map((p) => p.slice(RECORDS_DIR.length + 1));
  } else {
    names = fs.existsSync(RECORDS_DIR) ? fs.readdirSync(RECORDS_DIR) : [];
  }
  const found = names.filter(isRecord);
  if (found.length === 0) return { missing: true };
  if (found.length > 1) {
    const plans = rev
      ? git(['ls-tree', '--name-only', rev, 'docs/plans/']).split('\n').filter(Boolean).map((p) => p.slice('docs/plans/'.length))
      : (fs.existsSync('docs/plans') ? fs.readdirSync('docs/plans') : []);
    const match = found.filter((n) => plans.includes(n));
    if (match.length !== 1) return { ambiguous: found };
    found.splice(0, found.length, match[0]);
  }
  const file = `${RECORDS_DIR}/${found[0]}`;
  if (rev && git(['cat-file', '-t', `${rev}:${file}`]).trim() !== 'blob') throw new Error(`${file} is not a readable file`);
  const text = rev ? git(['show', `${rev}:${file}`]) : fs.readFileSync(file, 'utf8');
  return { file, text };
}

function gateFor(number, rev) {
  const rec = findRecord(number, rev);
  if (rec.missing) return { exempt: false, failures: [`${number} has no review record in ${RECORDS_DIR}/.`] };
  if (rec.ambiguous) return { exempt: false, failures: [`${number} has more than one review record (${rec.ambiguous.join(', ')}) and none matches its plan.`] };
  return evaluateRecord(rec.text);
}

// ---------------------------------------------------------------- hook mode

function refuse(branch, problems) {
  const lines = [
    `The master lock refused this update to '${branch}'. ${problems.length === 1 ? 'Problem' : 'Problems'}:`,
    ...problems.map((p) => `  - ${p}`),
    '',
    'A change only reaches the default branch through /commit-change, once its review record passes the gate.',
    'To continue a change that failed the gate, run /code-change on its branch. If the lock itself is broken,',
    'CLAUDE.md explains how the user can turn it off by hand.',
  ];
  process.stderr.write(lines.join('\n') + '\n');
}

function checkRange(oldTip, newTip, cfg) {
  const problems = [];
  const raw = git(['log', '--format=%H%x1f%P%x1f%s%x1e', `${oldTip}..${newTip}`]);
  const commits = raw.split('\x1e').map((s) => s.replace(/^\n/, '')).filter(Boolean).map((s) => {
    const [hash, parents, subject] = s.split('\x1f');
    return { hash, parents: parents.split(' ').filter(Boolean), subject: subject ?? '' };
  });
  const releaseRe = /^chore\(release\): v\d+\.\d+\.\d+$/;
  const numberRe = new RegExp(`^[a-z]+\\(${esc(cfg.prefix)}-(\\d{3,})\\)!?: `);
  const allowed = new Set([...cfg.versionFiles, 'CHANGELOG.md']);
  const numbers = new Set();
  for (const c of commits) {
    const short = c.hash.slice(0, 7);
    if (releaseRe.test(c.subject) && c.parents.length > 0) {
      const files = git(['diff', '--name-only', c.parents[0], c.hash]).split('\n').filter(Boolean);
      const extra = files.filter((f) => !allowed.has(f));
      if (extra.length > 0) problems.push(`Commit ${short} ("${c.subject}") is worded like a release commit but also changes ${extra.join(', ')}.`);
      continue;
    }
    const m = c.subject.match(numberRe);
    if (!m) {
      problems.push(`Commit ${short} ("${c.subject}") carries no ${cfg.prefix} change number and is not a release commit.`);
      continue;
    }
    numbers.add(parseInt(m[1], 10));
  }
  for (const n of [...numbers].sort((a, b) => a - b)) {
    if (n < cfg.start) continue;
    const id = `${cfg.prefix}-${String(n).padStart(3, '0')}`;
    const result = gateFor(id, newTip);
    for (const f of result.failures) problems.push(`${id}: ${f}`);
  }
  return problems;
}

// Is the lock itself (this checker) part of the given commit? A branch that does not hold it yet
// is the one the change introducing the lock is merged into: nothing to enforce there, even though
// git, once the merge has checked its files out, already finds the hook.
let ownRel = null;
function lockPresentAt(tip) {
  if (ownRel === null) {
    ownRel = path.relative(git(['rev-parse', '--show-toplevel']).trim(), fileURLToPath(import.meta.url)).replace(/\\/g, '/');
  }
  return gitTry(['cat-file', '-e', `${tip}:${ownRel}`]) !== null;
}

// The default branch as git itself knows it: where the remote's HEAD points, and init.defaultBranch.
function gitDefaultBranchHints() {
  const hints = [];
  const head = gitTry(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  if (head && head.trim().includes('/')) hints.push(head.trim().slice(head.trim().indexOf('/') + 1));
  const init = gitTry(['config', '--get', 'init.defaultBranch']);
  if (init && init.trim()) hints.push(init.trim());
  return hints;
}

// A check-in may not loosen or change the lock's own settings: raising the starting number,
// adding version files (they widen what a release commit may touch), or changing the prefix
// or default branch. Changing them is the user's step, with the lock off by hand.
function loosenedSettings(before, after) {
  const changed = [];
  if (after.defaultBranch !== before.defaultBranch) changed.push('the default branch');
  if (after.prefix !== before.prefix) changed.push('the change prefix');
  if (after.start > before.start) changed.push('the starting number (raised)');
  const added = after.versionFiles.filter((f) => !before.versionFiles.includes(f));
  if (added.length > 0) changed.push(`the version files (added ${added.join(', ')})`);
  return changed;
}

function hookMode(state) {
  const input = fs.readFileSync(0, 'utf8');
  if (state !== 'prepared') return 0;
  const problemsByBranch = [];
  for (const line of input.split('\n').filter(Boolean)) {
    const m = line.match(/^(\S+) (\S+) (\S+)$/);
    if (!m) throw new Error(`could not read the line git passed to the hook: "${line}"`);
    const [, oldV, newV, ref] = m;
    if (!ref.startsWith('refs/heads/')) continue; // remote-tracking refs, tags, anything else
    // git passes all zeros as the old value when the caller did not state it (a bare
    // update-ref, for example), so look up what the branch really points at now.
    let oldTip = oldV;
    if (ZERO.test(oldV) || oldV.startsWith('ref:')) {
      const cur = gitTry(['rev-parse', '--verify', '-q', `${ref}^{commit}`]);
      if (cur === null) continue; // the branch does not exist yet: nothing to compare
      oldTip = cur.trim();
    }
    const claudeOld = gitTry(['show', `${oldTip}:CLAUDE.md`]);
    const defaultName = claudeOld === null ? null : defaultBranchOf(claudeOld);
    if (!defaultName) {
      // Without CLAUDE.md's "Default branch" line the branch cannot be recognised that way, so
      // fall back on what git itself says the default branch is, and refuse if this is it.
      const short = ref.slice('refs/heads/'.length);
      if (lockPresentAt(oldTip) && gitDefaultBranchHints().includes(short)) {
        problemsByBranch.push({
          branch: short,
          problems: ['The lock\'s settings cannot be read: CLAUDE.md is missing, or has no "Default branch" line, at the current tip of this branch.'],
        });
      }
      continue;
    }
    if (ref !== `refs/heads/${defaultName}`) continue; // not the default branch
    const cfg = readConfig(claudeOld);
    if (!cfg.ok && !lockPresentAt(oldTip)) continue; // the lock is not on this branch yet (see lockPresentAt)
    const problems = [];
    if (!cfg.ok) {
      problems.push(...cfg.problems.map((p) => `The lock's settings are incomplete: ${p}.`));
    } else if (ZERO.test(newV)) {
      problems.push('The default branch cannot be deleted.');
    } else if (newV.startsWith('ref:')) {
      problems.push('The default branch cannot be turned into a pointer to another branch.');
    } else {
      problems.push(...checkRange(oldTip, newV, cfg));
      const claudeNew = gitTry(['show', `${newV}:CLAUDE.md`]);
      const cfgNew = readConfig(claudeNew);
      if (!cfgNew.ok) problems.push(...cfgNew.problems.map((p) => `The update would leave the lock without its settings: ${p}.`));
      else {
        const changed = loosenedSettings(cfg, cfgNew);
        if (changed.length > 0) {
          problems.push(`A check-in cannot loosen or change the lock's settings in CLAUDE.md (${changed.join('; ')}); the user does that by hand, see CLAUDE.md, "Master lock".`);
        }
      }
    }
    if (problems.length > 0) problemsByBranch.push({ branch: defaultName, problems });
  }
  for (const { branch, problems } of problemsByBranch) refuse(branch, problems);
  return problemsByBranch.length > 0 ? 1 : 0;
}

// ---------------------------------------------------------------- gate and status modes

function gateMode(args) {
  const number = args[0];
  if (!number) throw new Error('usage: gate <change number> [--rev <revision>]');
  const ri = args.indexOf('--rev');
  const rev = ri >= 0 ? args[ri + 1] : null;
  const result = gateFor(number, rev);
  if (result.exempt) {
    process.stdout.write(`Review gate for ${number}: the record is in the old format, so the gate does not apply.\n`);
    return 0;
  }
  if (result.failures.length === 0) {
    process.stdout.write(`Review gate for ${number}: passed.\n`);
    return 0;
  }
  process.stdout.write(`Review gate for ${number}: FAILED\n${result.failures.map((f) => `  - ${f}`).join('\n')}\n`);
  return 1;
}

function samePath(a, b) {
  const norm = (p) => {
    let r;
    try { r = fs.realpathSync(p); } catch { r = path.resolve(p); }
    return process.platform === 'win32' ? r.toLowerCase() : r;
  };
  return norm(a) === norm(b);
}

function statusMode() {
  const top = git(['rev-parse', '--show-toplevel']).trim();
  const rel = path.relative(top, ownDir).replace(/\\/g, '/');
  const reasons = [];
  const hp = (gitTry(['config', '--get', 'core.hooksPath']) ?? '').trim();
  if (!hp) reasons.push('git is not pointed at the hook folder (core.hooksPath is not set)');
  else if (!samePath(path.resolve(top, hp), ownDir)) reasons.push(`git's hook folder is "${hp}", not this project's ${rel}`);
  const wrapper = path.join(ownDir, 'reference-transaction');
  if (!fs.existsSync(wrapper)) reasons.push('the hook file reference-transaction is missing');
  else {
    const staged = gitTry(['ls-files', '-s', '--', wrapper]);
    if (staged && staged.trim() && !staged.startsWith('100755')) reasons.push('the hook file is not marked executable');
    try { fs.accessSync(wrapper, fs.constants.X_OK); } catch { reasons.push('the hook file is not executable'); }
  }
  const claudePath = path.join(top, 'CLAUDE.md');
  const cfg = readConfig(fs.existsSync(claudePath) ? fs.readFileSync(claudePath, 'utf8') : null);
  if (!cfg.ok) reasons.push(...cfg.problems);
  if (reasons.length === 0) {
    process.stdout.write('Master lock: ON.\n');
    return 0;
  }
  process.stdout.write(`Master lock: OFF. ${reasons.join('; ')}.\nTo switch it on, run: bash ${rel}/install-master-lock.sh\n`);
  return 1;
}

// ---------------------------------------------------------------- main

try {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'hook') process.exitCode = hookMode(args[0]);
  else if (mode === 'gate') process.exitCode = gateMode(args);
  else if (mode === 'status') process.exitCode = statusMode();
  else throw new Error('usage: master-lock-check.mjs hook <state> | gate <change number> [--rev R] | status');
} catch (e) {
  process.stderr.write(`The master lock could not finish its check (${e && e.message ? e.message : e}), so it refuses.\n`);
  process.exitCode = 2;
}
