// The trunk lock's checker. One script, three modes, so the git hook and /merge-change
// apply exactly the same rules:
//   hook <state>            run by githooks/reference-transaction on every ref update;
//                           exits non-zero to refuse an update of the default branch.
//   gate <number> [--rev R] the review-record gate for one change or ticket (the record in the
//                           working tree, or in revision R); exit 1 if it fails.
//   status                  is the lock switched on in this copy of the project?
//
// Nothing project-specific lives here: the default branch, change prefix, version files and the
// first checked change number come from CLAUDE.md (see readConfig). The gate reads a record's
// labelled lines exactly (the format is written in /code-change). It checks a record is complete;
// it cannot prove Jason made a decision, and his approval of the review is that proof.
// Numbers are NNN for a change and NNN.N for a ticket of a large change. Only a whole number is a
// check-in: a ticket's commits may reach the default branch only inside their change's check-in.
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
// The lock was called the "master lock" before the default branch was renamed. CLAUDE.md's lock
// lines are read under either name (the new one first), so the user can relabel them by hand,
// with the lock off, before or after this checker lands without the lock losing its settings.
function lockLineValue(text, suffix) {
  const found = lineValue(text, `Trunk lock${suffix}`);
  return found !== null ? found : lineValue(text, `Master lock${suffix}`);
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
  const startRaw = firstWord(lockLineValue(claudeMd, ' starts at'));
  let start = null;
  if (!startRaw) problems.push('CLAUDE.md has no "Trunk lock starts at" line (or the older "Master lock starts at")');
  else if (prefix) {
    const m = startRaw.match(new RegExp(`^${esc(prefix)}-(\\d{3,})$`));
    if (!m) problems.push(`"Trunk lock starts at" (the older "Master lock starts at") (${startRaw}) is not a change number with the prefix ${prefix}`);
    else start = parseInt(m[1], 10);
  }
  return { ok: problems.length === 0, problems, defaultBranch, prefix, versionFiles, start, startRaw };
}

// ---------------------------------------------------------------- the review gate
// One record format (see /code-change). The gate checks that a record is complete and consistent;
// it cannot prove Jason made a decision. His approval of the review is that proof.

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
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue;
      if (!/^\s+\S/.test(lines[j])) break;
      block.push(...lines.slice(i + 1, j + 1));
      i = j;
    }
    const text = block.join('\n');
    // A bullet is a finding if it has the severity form or a finding's own labelled line, so one
    // written without the severity form is refused, not skipped.
    if (/^- \*{0,2}\[(?:High|Medium|Low|Nit|Informational)\]/.test(text) || /\*\*(?:Caused by this change|Outcome):\*\*/.test(text)) blocks.push(text);
  }
  return blocks;
}

const DECIDED = /\*\*Decided by:\*\*\s*\**\s*Jason\b/i;

function judgeFinding(block) {
  const title = block.split('\n')[0].replace(/^- /, '').slice(0, 90);
  const sev = block.match(/^- \*\*\[([^\]]*)\]\*\*/);
  const severity = sev && SEVERITIES.includes(sev[1]) ? sev[1] : null;
  const labelMatch = block.match(/\*\*Caused by this change:\*\*\s*\**\s*(yes|no)\b/i);
  const label = labelMatch ? labelMatch[1].toLowerCase() : null;
  const outMatch = block.match(/\*\*Outcome:\*\*\s*\**\s*(fixed|explained|accepted by Jason|moved to backlog)\b/i);
  const outcome = outMatch ? outMatch[1].toLowerCase() : null;
  const verdicts = [...block.matchAll(/\*\*Re-review:\*\*\s*\**\s*(accepted|rejected)\b/gi)].map((m) => m[1].toLowerCase());
  const decided = DECIDED.test(block);
  const failures = [];
  if (!severity) failures.push(`A finding has no severity: "${title}".`);
  if (!label) failures.push(`A finding has no "Caused by this change: yes/no" line: "${title}".`);
  if (!outcome) failures.push(`A finding has no outcome (fixed, explained, accepted by Jason or moved to backlog): "${title}".`);
  if (label === 'yes' && outcome === 'moved to backlog') {
    failures.push(`A finding this change caused was moved to the backlog instead of fixed, explained or accepted by Jason: "${title}".`);
  }
  if (outcome === 'accepted by jason' && !decided) failures.push(`A finding accepted by Jason does not say "Decided by: Jason": "${title}".`);
  if (outcome === 'fixed' || outcome === 'explained') {
    if (verdicts.length === 0) failures.push(`A ${outcome} finding has no "Re-review: accepted/rejected" line: "${title}".`);
    else if (verdicts[verdicts.length - 1] === 'rejected' && !decided) {
      failures.push(`The re-review rejected the outcome of a finding and the record does not say "Decided by: Jason": "${title}".`);
    }
  }
  return failures;
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

// The Findings section holds only "None" and well-formed findings: a line starting `- **[Severity]**`,
// followed by indented lines (labels or plain text, never a bullet or heading). Any other line is
// refused, so a finding written in some other form cannot be silently skipped by the gate.
const FINDING_START = /^- \*\*\[(?:High|Medium|Low|Nit|Informational)\]\*\*/;
function unreadableFindingLines(body) {
  const bad = [];
  let inFinding = false;
  for (const line of body.split('\n')) {
    if (line.trim() === '') continue;
    if (/^(?:- )?none\.?\s*$/i.test(line.trim()) && !/^\s/.test(line)) { inFinding = false; continue; }
    if (FINDING_START.test(line)) { inFinding = true; continue; }
    const indented = /^\s+\S/.test(line);
    const bulletOrHeading = /^\s*(?:[-*+]\s|\d+[.)]\s|#)/.test(line);
    if (inFinding && indented && !bulletOrHeading) continue;
    bad.push(line.trim().slice(0, 60));
    inFinding = false;
  }
  return bad;
}

// Returns { failures } for one record's text.
function evaluateRecord(raw) {
  const text = raw.replace(/\r\n/g, '\n');
  const sections = splitSections(text);
  const failures = [];
  if (!/^- \*\*Level:\*\*\s*(Light|Full)\b/m.test(text)) failures.push('The record header has no "Level: Light" or "Level: Full" line.');

  const findingsBody = sectionStarting(sections, 'findings');
  if (findingsBody === null) failures.push('The record has no Findings section (write "None" if there are none).');
  for (const l of unreadableFindingLines(findingsBody ?? '')) {
    failures.push(`A line in Findings is neither "None" nor a well-formed finding ("- **[Severity]** …"), so it is not understood: "${l}".`);
  }
  for (const b of findingBlocks(findingsBody ?? '')) failures.push(...judgeFinding(b));

  const reBody = sectionStarting(sections, 're-review');
  const clean = reBody === null ? null : reBody.match(/\*\*Re-review clean:\*\*\s*\**\s*(yes|no)\b/i);
  if (!clean) failures.push('The record has no "Re-review clean: yes/no" line under a Re-review heading.');
  else if (clean[1].toLowerCase() === 'no' && !DECIDED.test(reBody)) {
    failures.push('The re-review was not clean and the record does not say "Decided by: Jason" about what was left.');
  }

  const trace = traceRows(sectionStarting(sections, 'requirements trace') ?? '');
  if (trace.length === 0) failures.push('The record has no requirements trace.');
  for (const r of trace) {
    if (/^fail/i.test(r.result)) failures.push(`Requirement ${r.id} failed its test.`);
    else if (!/^pass/i.test(r.result)) failures.push(`Requirement ${r.id} has no passing result (it reads "${r.result}").`);
  }
  return { failures };
}

// Every file under a directory (recursive), in a git revision or (rev === null) the working tree.
function listFiles(dir, rev) {
  if (rev) return (gitTry(['ls-tree', '-r', '--name-only', rev, `${dir}/`]) ?? '').split('\n').filter(Boolean);
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) walk(p); else out.push(p);
    }
  };
  walk(dir);
  return out;
}

function readFileAt(file, rev) {
  return rev ? git(['show', `${rev}:${file}`]) : fs.readFileSync(file, 'utf8');
}

// Finds a change's (or ticket's) review record: docs/reviews/<number>-*.md, not a before-copy. When
// more than one matches, the one with the same file name as the plan is the record.
function findRecord(number, files, rev) {
  const found = files.filter((f) => f.startsWith(`${RECORDS_DIR}/${number}-`) && f.endsWith('.md') && !f.endsWith('-before.md') && !f.slice(RECORDS_DIR.length + 1).includes('/'));
  if (found.length === 0) return { missing: true };
  let pick = found;
  if (found.length > 1) {
    const plans = listFiles('docs/plans', rev).map((f) => f.slice('docs/plans/'.length));
    pick = found.filter((f) => plans.includes(f.slice(RECORDS_DIR.length + 1)));
    if (pick.length !== 1) return { ambiguous: found.map((f) => f.slice(RECORDS_DIR.length + 1)) };
  }
  return { file: pick[0], text: readFileAt(pick[0], rev) };
}

function recordFailures(number, files, rev) {
  const rec = findRecord(number, files, rev);
  if (rec.missing) return [`${number} has no review record in ${RECORDS_DIR}/.`];
  if (rec.ambiguous) return [`${number} has more than one review record (${rec.ambiguous.join(', ')}) and none matches its plan.`];
  return evaluateRecord(rec.text).failures;
}

// The gate for one change: its own record, plus the record of every ticket its plan folder holds
// (docs/plans/<number>-<title>/<number>.<n>-*.md) and of any ticket named in `extraTickets`.
// A ticket number gates only that ticket.
function gateFor(number, rev, extraTickets = []) {
  const files = listFiles(RECORDS_DIR, rev);
  const failures = recordFailures(number, files, rev);
  if (/\.\d+$/.test(number)) return { failures };
  const tickets = new Set(extraTickets);
  const re = new RegExp(`^docs/plans/${esc(number)}-[^/]+/(${esc(number)}\\.\\d+)-`);
  for (const f of listFiles('docs/plans', rev)) {
    const m = f.match(re);
    if (m) tickets.add(m[1]);
  }
  for (const t of [...tickets].sort()) {
    for (const f of recordFailures(t, files, rev)) failures.push(`Ticket ${t}: ${f}`);
  }
  return { failures };
}

// ---------------------------------------------------------------- hook mode

function refuse(branch, problems) {
  const lines = [
    `The trunk lock refused this update to '${branch}'. ${problems.length === 1 ? 'Problem' : 'Problems'}:`,
    ...problems.map((p) => `  - ${p}`),
    '',
    'A change only reaches the default branch through /merge-change, once its review record passes the gate.',
    'To continue a change that failed the gate, run /code-change on its branch. If the lock itself is broken,',
    'CLAUDE.md explains how the user can turn it off by hand.',
  ];
  process.stderr.write(lines.join('\n') + '\n');
}

function checkRange(oldTip, newTip, cfg) {
  const problems = [];
  const raw = git(['log', '--topo-order', '--format=%H%x1f%P%x1f%s%x1e', `${oldTip}..${newTip}`]);
  const commits = raw.split('\x1e').map((s) => s.replace(/^\n/, '')).filter(Boolean).map((s) => {
    const [hash, parents, subject] = s.split('\x1f');
    return { hash, parents: parents.split(' ').filter(Boolean), subject: subject ?? '' };
  });
  const releaseRe = /^chore\(release\): v\d+\.\d+\.\d+$/;
  const numberRe = new RegExp(`^[a-z]+\\(${esc(cfg.prefix)}-(\\d{3,})(?:\\.(\\d+))?\\)!?: `);
  const allowed = new Set([...cfg.versionFiles, 'CHANGELOG.md']);
  const numbers = new Set();
  const tickets = new Map(); // whole number -> the ticket numbers seen under it
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
    const whole = parseInt(m[1], 10);
    if (m[2] !== undefined) {
      // Only a whole number is a check-in: the update may not end on a ticket's own commit.
      if (c === commits[0]) problems.push(`The update ends with a commit for ticket ${cfg.prefix}-${m[1]}.${m[2]}; only a whole change number is checked in.`);
      if (!tickets.has(whole)) tickets.set(whole, new Set());
      tickets.get(whole).add(`${cfg.prefix}-${m[1]}.${m[2]}`);
    }
    numbers.add(whole);
  }
  for (const n of [...numbers].sort((a, b) => a - b)) {
    if (n < cfg.start) continue;
    const id = `${cfg.prefix}-${String(n).padStart(3, '0')}`;
    const result = gateFor(id, newTip, [...(tickets.get(n) ?? [])]);
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
  // A checker that lives outside the project (adopt.sh points git at the plugin's release/ folder)
  // was switched on on purpose, so the lock counts as present: its fail-closed checks apply.
  if (path.isAbsolute(ownRel) || ownRel === '..' || ownRel.startsWith('../')) return true;
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
          problems.push(`A check-in cannot loosen or change the lock's settings in CLAUDE.md (${changed.join('; ')}); the user does that by hand, see CLAUDE.md, "Trunk lock".`);
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
  // The prefix comes from CLAUDE.md in the same revision (or the working tree) as the record, and
  // the gate fails closed when the settings are unreadable.
  const claudeMd = rev ? gitTry(['show', `${rev}:CLAUDE.md`]) : (fs.existsSync('CLAUDE.md') ? fs.readFileSync('CLAUDE.md', 'utf8') : null);
  const cfg = readConfig(claudeMd);
  if (!cfg.ok) {
    process.stdout.write(`Review gate for ${number}: FAILED\n${cfg.problems.map((p) => `  - The lock's settings are incomplete: ${p}.`).join('\n')}\n`);
    return 1;
  }
  if (!new RegExp(`^${esc(cfg.prefix)}-\\d{3,}(?:\\.\\d+)?$`).test(number)) {
    process.stdout.write(`Review gate for ${number}: FAILED\n  - ${number} is not a change or ticket number with the prefix ${cfg.prefix}.\n`);
    return 1;
  }
  const result = gateFor(number, rev);
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
    process.stdout.write('Trunk lock: ON.\n');
    return 0;
  }
  process.stdout.write(`Trunk lock: OFF. ${reasons.join('; ')}.\nTo switch it on, run: bash ${rel}/install-trunk-lock.sh\n`);
  return 1;
}

// ---------------------------------------------------------------- main

try {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'hook') process.exitCode = hookMode(args[0]);
  else if (mode === 'gate') process.exitCode = gateMode(args);
  else if (mode === 'status') process.exitCode = statusMode();
  else throw new Error('usage: trunk-lock-check.mjs hook <state> | gate <change number> [--rev R] | status');
} catch (e) {
  process.stderr.write(`The trunk lock could not finish its check (${e && e.message ? e.message : e}), so it refuses.\n`);
  process.exitCode = 2;
}
