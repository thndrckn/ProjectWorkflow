// Decides whether a Bash/PowerShell command may run while on the default branch (trunk, master or main).
// Called by block-main-edits.sh with the PreToolUse JSON on stdin and, as arguments:
//   argv[2]  the main folder (e.g. /d/projects/foo or D:\Projects\Foo)
//   argv[3]  'main-folder' or 'worktree' (see worktreeMode below)
//   argv[4]  the main folder in a form git itself understands (for git check-ignore)
//   argv[5+] the paths of the repository's other worktrees, which are not guarded
// Prints "allow" or "block: <reason>".
//
// Shared-only pass: called with argv[2] = the shared conventions folder (unix form),
// argv[3] = 'shared', argv[4] = the same folder in Windows form (a command may spell it
// either way) and argv[5] = the command's working directory. Only writes into that folder
// (and cd into it) are judged; everything else is allowed, on any branch, and so is a
// path that can't be placed from the text (a variable, ~, or a relative path after a cd
// the checker can't follow). The user edits that folder by hand, so Claude never does.
//
// This is best-effort pattern matching, not a sandbox. It does not look inside
// scripts or interpreters (node -e, python -c, ...), find -exec/-delete, or
// anything built from variables. A path it cannot resolve counts as inside the
// project, so it is blocked.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const proj = normPath(process.argv[2] || '');
const projForGit = process.argv[4] || '';
const otherWorktrees = process.argv.slice(5).map(normPath);
// 'worktree' when the command runs inside a worktree of this project while the main
// folder (proj) is on the default branch: the worktree's own files are free to change, and only the
// main folder is protected. Anything else is 'main-folder': proj is the folder being guarded.
const worktreeMode = process.argv[3] === 'worktree';
// Shared-only pass (see the header): proj is then the shared folder, not the project.
const sharedOnly = process.argv[3] === 'shared';
const sharedAlt = sharedOnly ? normPath(process.argv[4] || '') : '';
// The directory relative paths resolve against in the shared-only pass; null once a cd
// target can't be resolved from the text.
let sharedCwd = sharedOnly ? normPath(process.argv[5] || '') : null;

// Git subcommands allowed as a whole, apart from the flags in destructiveGitFlag()
// (tag -d, switch -f, branch -D) and --output (which writes a file).
const GIT_PLAIN = new Set([
  'status', 'log', 'diff', 'show', 'fetch', 'merge', 'tag', 'switch', 'branch',
  'rev-parse', 'ls-files',
]);
const CONFIG_READ = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '--list', '-l']);
const CONFIG_WRITE = new Set([
  '--unset', '--unset-all', '--add', '--replace-all', '-e', '--edit',
  '--rename-section', '--remove-section',
]);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'pwsh', 'powershell', 'cmd']);
// -c, -lc, -ec (clustered), -Command, cmd /c, /k
const SHELL_CMD_FLAG = /^(-[a-z]*c|-command|\/c|\/k)$/;
// Commands that run another command: skip them (and their options) to find the real one.
const WRAPPERS = new Set(['sudo', 'command', 'env', 'time', 'nohup', 'exec', 'timeout', 'nice', 'xargs', 'stdbuf', 'builtin']);
const WRAPPER_OPTS_WITH_VALUE = new Set(['-u', '-s', '-n', '-I', '-P', '-S', '-C', '-k']);

// Commands that write, and how to find the files they write to.
//   every-arg       every non-option argument
//   last-arg        the final non-option argument (or the one after -t)
//   sed-in-place    the files of sed -i (nothing without -i)
//   first-path      the first path (or the named -Path style parameter)
//   first-two-paths the first two paths (source and destination)
//   download        the value of -o/-O/-OutFile style options
const WRITERS = {
  tee: 'every-arg', touch: 'every-arg', mkdir: 'every-arg', truncate: 'every-arg', rm: 'every-arg',
  rmdir: 'every-arg', del: 'every-arg', erase: 'every-arg', rd: 'every-arg', ri: 'every-arg',
  'remove-item': 'every-arg', mv: 'every-arg',
  cp: 'last-arg', install: 'last-arg', ln: 'last-arg', sed: 'sed-in-place',
  'set-content': 'first-path', sc: 'first-path', 'add-content': 'first-path', ac: 'first-path',
  'out-file': 'first-path', 'new-item': 'first-path', ni: 'first-path', 'clear-content': 'first-path',
  'tee-object': 'first-path', 'export-csv': 'first-path', 'export-clixml': 'first-path',
  'copy-item': 'first-two-paths', copy: 'first-two-paths', 'move-item': 'first-two-paths',
  move: 'first-two-paths', 'rename-item': 'first-two-paths', ren: 'first-two-paths', rni: 'first-two-paths',
  curl: 'download', wget: 'download', 'invoke-webrequest': 'download', iwr: 'download',
  'invoke-restmethod': 'download', irm: 'download',
};
const PS_NAMED = new Set(['-path', '-filepath', '-literalpath', '-destination', '-newname']);
const DOWNLOAD_OPTS = new Set(['-o', '-O', '--output', '--output-document', '-outfile']);

function normPath(p) {
  let s = p.replace(/\\/g, '/').toLowerCase();
  const m = s.match(/^([a-z]):\/(.*)$/);
  if (m) s = '/' + m[1] + '/' + m[2];
  return s;
}

// Removes the outer quotes of a word, if it has a matching pair.
function unquote(w) {
  if (w.length >= 2 && (w[0] === '"' || w[0] === "'") && w[w.length - 1] === w[0]) return w.slice(1, -1);
  return w;
}

// Removes every quote character, so g""it and 'commit' read as git and commit.
function stripQuotes(w) {
  return w.replace(/["']/g, '');
}

function isPlanFile(n) {
  if (n.includes('..')) return false;
  if (n.startsWith(proj + '/docs/plans/')) return true;
  return !n.startsWith('/') && n.replace(/^\.\//, '').startsWith('docs/plans/');
}

// True when an absolute, normalised path is inside the guarded main folder. The
// repository's other worktrees (which may sit inside it) are judged by their own branch,
// so they don't count.
function inMain(n) {
  if (n !== proj && !n.startsWith(proj + '/')) return false;
  return !otherWorktrees.some((w) => n === w || n.startsWith(w + '/'));
}

// In a worktree, true when a path points at the main folder or at something that can't be
// resolved from the text (a variable, or a '..' that might climb into it).
function pointsIntoMain(raw) {
  const w = stripQuotes(raw);
  if (w === '') return false;
  if (/[$%`]/.test(w) || w.includes('..')) return true;
  const n = normPath(w);
  return n.startsWith('/') && inMain(path.posix.normalize(n));
}

// True when git ignores this path inside the main folder (so a checkout there can't land
// in the tracked tree). Any failure counts as not ignored.
function ignoredInMain(rel) {
  if (!projForGit) return false;
  try {
    execFileSync('git', ['check-ignore', '-q', '--', rel], { cwd: projForGit, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Shared-only pass: an absolute normalised path, or a relative one resolved against the
// working directory; null when it can't be placed.
function sharedResolve(n) {
  if (n.startsWith('/')) return path.posix.normalize(n);
  return sharedCwd === null || !sharedCwd.startsWith('/') ? null : path.posix.normalize(sharedCwd + '/' + n);
}

function inShared(abs) {
  return [proj, sharedAlt].some((d) => d !== '' && (abs === d || abs.startsWith(d + '/')));
}

// True when writing to this path is allowed on the default branch.
function destOk(raw) {
  const w = stripQuotes(raw);
  if (sharedOnly) {
    if (w === '' || /[$%`]/.test(w) || w[0] === '~') return true;
    const abs = sharedResolve(normPath(w));
    return abs === null || !inShared(abs);
  }
  if (w === '') return false;
  const low = w.toLowerCase();
  if (low === '/dev/null' || low === '$null' || low === 'nul') return true;
  if (/[$%`]/.test(w)) return false; // variable: cannot resolve, so treat as inside
  if (w[0] === '~') return true;
  let n = normPath(w);
  if (n.startsWith('/')) n = path.posix.normalize(n); // collapse any .. before comparing
  if (isPlanFile(n)) return true;
  if (n.startsWith('/')) return !inMain(n);
  // Relative: inside the project on the default branch. In a worktree it lands in the worktree itself,
  // unless it climbs out with '..' (which could reach the main folder).
  return worktreeMode && !n.includes('..');
}

// Finds the end of a $( ... ) or ` ... ` substitution starting at i; returns the index of its closer.
function closer(cmd, i, kind) {
  if (kind === '`') {
    const j = cmd.indexOf('`', i + 1);
    return j < 0 ? cmd.length : j;
  }
  let depth = 0;
  for (let j = i; j < cmd.length; j++) {
    if (cmd[j] === '(') depth++;
    else if (cmd[j] === ')' && --depth === 0) return j;
  }
  return cmd.length;
}

// Splits into command segments (arrays of raw words) at ; && || | & newline ( ) ` and $( .
// Redirect operators (>, >>, >|, >&, 2>, &>) become their own words. Substitutions inside
// double quotes are returned in subs, to be analysed as commands of their own.
function segments(cmd) {
  const segs = [], subs = [];
  let cur = [], word = '', quote = '', has = false;
  const endWord = () => { if (has) cur.push(word); word = ''; has = false; };
  const endSeg = () => { endWord(); if (cur.length) segs.push(cur); cur = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      if (quote === '"' && (c === '`' || (c === '$' && cmd[i + 1] === '('))) {
        const start = c === '`' ? i + 1 : i + 2;
        const end = closer(cmd, c === '`' ? i : i + 1, c === '`' ? '`' : '(');
        subs.push(cmd.slice(start, end));
        word += cmd.slice(i, end + 1);
        i = end;
        continue;
      }
      word += c;
      if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'") { quote = c; word += c; has = true; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); continue; }
    if (c === '\n' || c === ';' || c === '(' || c === ')' || c === '`') { endSeg(); continue; }
    if (c === '|' || c === '&') {
      if (c === '&' && cmd[i + 1] === '>') { endWord(); word = '&'; has = true; continue; } // &> and &>>
      endSeg();
      if (cmd[i + 1] === c) i++; // && and ||
      continue;
    }
    if (c === '>') {
      if (has && !/^(\d+|\*|&)$/.test(word)) endWord(); // echo hi>f: split before >, keep a 2 in 2>f
      word += '>';
      has = true;
      if (cmd[i + 1] === '>') { word += '>'; i++; }
      if (cmd[i + 1] === '|') { word += '|'; i++; }
      else if (cmd[i + 1] === '&') {
        word += '&'; i++;
        while (/[\d-]/.test(cmd[i + 1] || '')) { word += cmd[i + 1]; i++; }
      }
      endWord(); // the target is the next word
      continue;
    }
    word += c; has = true;
  }
  endSeg();
  return { segs, subs };
}

// Pulls redirects out of a segment. Returns { words, targets }.
function splitRedirects(words) {
  const out = [], targets = [];
  for (let i = 0; i < words.length; i++) {
    const m = words[i].match(/^(?:\d+|\*|&)?>>?([|&]?)(.*)$/);
    if (!m) { out.push(words[i]); continue; }
    if (m[1] === '&' && m[2] !== '') continue; // 2>&1, >&2: duplicates a descriptor, no file
    targets.push(words[++i] || '');
  }
  return { words: out, targets };
}

// Names the flag that makes an allowed subcommand destructive, or null.
//   tag -d / --delete; switch -f / --force / --discard-changes;
//   branch -D, or --delete / -d together with --force / -f.
// Short flags may be clustered (-df), so a cluster is checked letter by letter.
function destructiveGitFlag(sub, rest) {
  // In a short-flag cluster, the rest of the token after a value-taking letter is that
  // flag's value (-ukeyid), so only the letters before it count.
  const valueLetters = { tag: 'umF', switch: 'cC', branch: 'u' }[sub] || '';
  const valueLongs = sub === 'tag' ? ['--message', '--local-user', '--file'] : [];
  // Collect the flags, leaving out the separate-token value of a value-taking flag
  // (git tag -m -d: "-d" is the message) and everything after "--".
  const flags = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') break;
    if (!a.startsWith('-')) continue;
    flags.push(a);
    const letters = /^-[a-zA-Z]+$/.test(a) ? a.slice(1) : '';
    const firstValue = [...letters].findIndex((ch) => valueLetters.includes(ch));
    if ((firstValue >= 0 && firstValue === letters.length - 1) || valueLongs.includes(a)) i++;
  }
  // Git accepts any unambiguous prefix of a long option (--del for --delete).
  const long = (full) => flags.some((a) => {
    const name = a.split('=')[0];
    return name.length > 2 && name.startsWith('--') && full.startsWith(name);
  });
  const cluster = (letter) => flags.some((a) => {
    if (!/^-[a-zA-Z]+$/.test(a)) return false;
    for (const ch of a.slice(1)) {
      if (ch === letter) return true;
      if (valueLetters.includes(ch)) return false;
    }
    return false;
  });
  if (sub === 'tag' && (long('--delete') || cluster('d'))) return 'tag -d';
  if (sub === 'switch' && (long('--force') || long('--discard-changes') || cluster('f'))) return 'switch -f';
  if (sub === 'branch') {
    const del = long('--delete') || cluster('d');
    const force = long('--force') || cluster('f');
    if (cluster('D') || (del && force)) return 'branch -D';
  }
  return null;
}

// True when a new worktree may be created at this path.
function worktreeDestOk(raw) {
  const w = stripQuotes(raw);
  if (w === '' || /[$%`]/.test(w)) return false;
  let n = normPath(w);
  if (n.startsWith('/')) {
    n = path.posix.normalize(n);
    if (n !== proj && !n.startsWith(proj + '/')) return true; // outside the project
    return n !== proj && ignoredInMain(n.slice(proj.length + 1));
  }
  if (w.includes('..')) return false;
  // Relative: inside the main folder on the default branch, and inside the worktree in a worktree.
  return worktreeMode || ignoredInMain(path.posix.normalize(n));
}

// git's global options (before the subcommand). Those that take a value, and those that
// don't; git matches these names exactly, so there are no abbreviations to allow for.
const GLOBAL_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env', '--attr-source']);
const GLOBAL_FLAGS = new Set([
  '-v', '--version', '-h', '--help', '-p', '--paginate', '-P', '--no-pager', '--no-replace-objects',
  '--no-lazy-fetch', '--no-optional-locks', '--no-advice', '--bare', '--literal-pathspecs',
  '--glob-pathspecs', '--noglob-pathspecs', '--icase-pathspecs', '--exec-path', '--html-path',
  '--man-path', '--info-path', '--list-cmds',
]);

// Splits the leading global options off a git command. Returns the options as
// [name, value] pairs, whether any option wasn't recognised, and where the subcommand is.
// Attached forms (-C/path, -ckey=value, --git-dir=path) are split the same way.
function parseGlobals(args) {
  const opts = [];
  let unknown = false;
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    const a = args[i];
    const eq = a.startsWith('--') ? a.indexOf('=') : -1;
    const name = eq > 0 ? a.slice(0, eq) : a;
    if (GLOBAL_WITH_VALUE.has(name)) {
      if (eq > 0) { opts.push([name, a.slice(eq + 1)]); i += 1; }
      else { opts.push([name, args[i + 1] || '']); i += 2; }
    } else if (/^-C./.test(a)) {
      opts.push(['-C', a.slice(2)]); i += 1;
    } else if (/^-c./.test(a)) {
      opts.push(['-c', a.slice(2)]); i += 1;
    } else {
      if (!GLOBAL_FLAGS.has(name)) unknown = true;
      i += 1;
    }
  }
  return { opts, unknown, next: i };
}

// In a worktree, true when a git global option points git at the main folder (-C,
// --git-dir, --work-tree) or could move its working tree (-c / --config-env on
// core.worktree or core.bare), at something that can't be resolved, or isn't recognised,
// so the default-branch rules apply to the command.
function redirectsIntoMain({ opts, unknown }) {
  if (unknown) return true;
  for (const [name, value] of opts) {
    const v = stripQuotes(value);
    if ((name === '-c' || name === '--config-env') && /^core\.(worktree|bare)\b/i.test(v)) return true;
    if ((name === '-C' || name === '--git-dir' || name === '--work-tree') && pointsIntoMain(v)) return true;
  }
  return false;
}

// Git accepts any unambiguous prefix of a long option (--forc for --force).
function isLong(a, full) {
  const name = a.split('=')[0];
  return name.length > 2 && name.startsWith('--') && full.startsWith(name);
}

function isForce(rest) {
  return rest.some((a) => isLong(a, '--force') || (/^-[a-zA-Z]+$/.test(a) && a.includes('f')));
}

const DEFAULT_BRANCHES = ['trunk', 'master', 'main', 'refs/heads/trunk', 'refs/heads/master', 'refs/heads/main'];

// In a worktree, the commands that could still reach the default branch, whose work
// lives in the main folder, even though git itself runs inside the worktree.
function worktreeRefRule(sub, rest) {
  const nonOpt = rest.filter((a) => !a.startsWith('-'));
  if (sub === 'update-ref') return 'git update-ref could move the default branch from a worktree';
  if (sub === 'branch') {
    const changes = rest.some((a) => isLong(a, '--force') || isLong(a, '--move') || isLong(a, '--delete')
      || isLong(a, '--copy') || /^-[a-zA-Z]*[fMmDdCc]/.test(a));
    if (changes && nonOpt.some((a) => DEFAULT_BRANCHES.includes(a))) return 'git branch changing the default branch from a worktree';
  }
  if (sub === 'push') {
    if (rest.some((a) => isLong(a, '--mirror'))) return 'git push --mirror from a worktree';
    for (const r of nonOpt.slice(1)) {
      const dst = r.replace(/^\+/, '').split(':').pop();
      if (DEFAULT_BRANCHES.includes(dst)) return 'git push to the default branch from a worktree';
    }
  }
  if (sub === 'fetch') {
    // fetch <remote> <src>:<dst> updates a local branch; with -u/--update-head-ok that can
    // be the checked-out default branch. Plain `fetch origin trunk` only updates origin/trunk.
    for (const r of nonOpt.slice(1)) {
      if (!r.includes(':')) continue;
      if (DEFAULT_BRANCHES.includes(r.replace(/^\+/, '').split(':').pop())) return 'git fetch into the default branch from a worktree';
    }
  }
  if (sub === 'config') {
    // Any non-option word may be the key (a leading `set`, or the value of --type, can sit
    // in front of it), and -f/--file names the config file being written.
    let file = null;
    const words = [];
    for (let k = 0; k < rest.length; k++) {
      const a = rest[k];
      if (a === '-f' || (isLong(a, '--file') && !a.includes('='))) file = rest[++k] || '';
      else if (isLong(a, '--file')) file = a.slice(a.indexOf('=') + 1);
      else if (/^-f./.test(a)) file = a.slice(2); // attached: -f<path>
      else if (!a.startsWith('-')) words.push(a);
    }
    if (words.length >= 2 && words.some((w) => /^core\.(worktree|bare)$/i.test(w))) {
      return 'git config core.worktree / core.bare could redirect git for every worktree';
    }
    if (file !== null && words.length >= 1 && pointsIntoMain(file)) return 'git config writing the main folder\'s config file';
  }
  return null;
}

// The trunk lock (the project's tracked hooks folder) is switched on by git's
// core.hooksPath, so changing that setting switches the lock off. That is a step only the
// user takes, in their own terminal (see CLAUDE.md, "Trunk lock"), so it is blocked in
// every mode: git -c / --config-env, and git config writes. Reading it stays allowed.
const HOOKS_PATH = /^core\.hookspath\b/i;
const GIT_CONFIG_ENV = /^(?:\$env:)?GIT_CONFIG_(?:COUNT|PARAMETERS|KEY_\d+|VALUE_\d+|GLOBAL|SYSTEM|NOSYSTEM)(?:=|$)/i;
function trunkLockRule({ opts }, sub, rest) {
  for (const [name, value] of opts) {
    if ((name === '-c' || name === '--config-env') && HOOKS_PATH.test(stripQuotes(value))) return 'git -c core.hooksPath would switch the trunk lock off';
  }
  if (sub === 'config' && rest.some((a) => /^core\.hookspath$/i.test(a))) {
    const words = rest.filter((a) => !a.startsWith('-'));
    const isRead = rest.some((a) => CONFIG_READ.has(a)) || words[0] === 'get';
    if (!isRead && (rest.some((a) => CONFIG_WRITE.has(a)) || words.length >= 2)) return 'git config core.hooksPath would switch the trunk lock off';
  }
  return null;
}

function gitCheck(args) {
  const globals = parseGlobals(args);
  const i = globals.next;
  const sub = stripQuotes(args[i] || '');
  const rest = args.slice(i + 1).map(stripQuotes);
  const lockOff = trunkLockRule(globals, sub, rest);
  if (lockOff) return lockOff;
  if (worktreeMode && !redirectsIntoMain(globals)) {
    // Git inside the worktree is free, apart from the few commands that reach the default
    // branch or other worktrees; those get the extra rules above, and worktree its own below.
    const why = worktreeRefRule(sub, rest);
    if (why) return why;
    if (sub !== 'worktree') return null;
  }
  if (sub === '') return null;
  if (rest.some((a) => a.startsWith('--output'))) return `git ${sub} --output writes a file`;
  const destructive = destructiveGitFlag(sub, rest);
  if (destructive) return `git ${destructive} is not allowed`;
  if (GIT_PLAIN.has(sub)) return null;
  const nonOpt = rest.filter((a) => !a.startsWith('-'));
  switch (sub) {
    case 'pull':
      return rest.includes('--ff-only') ? null : 'git pull is only allowed with --ff-only';
    case 'push':
      if (rest.some((a) => a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || a === '--force-if-includes'
        || (/^-[a-z]+$/.test(a) && a.includes('f')) || a.startsWith('+'))) return 'forced git push';
      return null;
    case 'remote':
      if (nonOpt.length === 0) return null;
      return ['show', 'get-url'].includes(nonOpt[0]) ? null : `git remote ${nonOpt[0]} changes the repository`;
    case 'config': {
      if (rest.some((a) => CONFIG_WRITE.has(a))) return 'git config write';
      if (rest.some((a) => CONFIG_READ.has(a))) return null;
      return nonOpt.length <= 1 ? null : 'git config write';
    }
    case 'checkout':
      return rest[0] === '-b' && rest.length >= 2 ? null : 'git checkout is only allowed as checkout -b';
    case 'worktree': {
      // add, list and a plain remove only. Force (-f, -ff, --force) would let a branch be
      // checked out twice or a dirty worktree be thrown away; -B resets an existing branch.
      const verb = nonOpt[0];
      if (verb === 'list') return null;
      const force = isForce(rest);
      if (verb === 'remove') return force ? 'forced git worktree remove' : null;
      if (verb === 'add') {
        if (force || rest.some((a) => /^-[a-zA-Z]*B/.test(a))) return 'forced git worktree add';
        // The new checkout may not land in the project's tracked tree: inside the main
        // folder it has to be a path git ignores.
        let dest = null;
        const args2 = rest.slice(rest.indexOf('add') + 1);
        for (let k = 0; k < args2.length; k++) {
          if (args2[k] === '-b') { k++; continue; }
          if (!args2[k].startsWith('-')) { dest = args2[k]; break; }
        }
        if (dest === null) return 'git worktree add without a path is not allowed';
        return worktreeDestOk(dest) ? null : `git worktree add ${dest} would put a checkout inside the project`;
      }
      return verb ? `git worktree ${verb} is not allowed` : 'git worktree without a subcommand is not allowed';
    }
    default:
      return `git ${sub} is not allowed`;
  }
}

// Splits PowerShell "-Path:value" into "-Path", "value".
function splitColonParams(args) {
  const out = [];
  for (const a of args) {
    const m = a.match(/^(-[A-Za-z]+):(.+)$/);
    if (m) out.push(m[1], m[2]); else out.push(a);
  }
  return out;
}

function destinations(kind, rawArgs) {
  const args = splitColonParams(rawArgs);
  const nonOpt = args.filter((a) => !a.startsWith('-'));
  if (kind === 'every-arg') return nonOpt;
  if (kind === 'last-arg') {
    const ti = args.findIndex((a) => a === '-t' || a === '--target-directory');
    if (ti >= 0 && args[ti + 1]) return [args[ti + 1]];
    return nonOpt.slice(-1);
  }
  if (kind === 'sed-in-place') {
    const inPlace = args.some((a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a));
    if (!inPlace) return [];
    const hasScriptFlag = args.some((a) => a === '-e' || a === '-f' || a === '--expression' || a === '--file');
    return hasScriptFlag ? nonOpt : nonOpt.slice(1);
  }
  if (kind === 'download') {
    const out = [];
    for (let i = 0; i < args.length - 1; i++) {
      if (DOWNLOAD_OPTS.has(args[i]) || DOWNLOAD_OPTS.has(args[i].toLowerCase())) out.push(args[i + 1]);
    }
    return out;
  }
  // PowerShell-style cmdlets: named path params win over positional ones
  const named = [];
  for (let i = 0; i < args.length - 1; i++) {
    if (PS_NAMED.has(args[i].toLowerCase())) named.push(args[i + 1]);
  }
  if (named.length) return named;
  return kind === 'first-two-paths' ? nonOpt.slice(0, 2) : nonOpt.slice(0, 1);
}

// Index of the real command in a segment, after env assignments and wrappers (and their options).
function commandIndex(ws) {
  let i = 0;
  for (;;) {
    while (i < ws.length && /^\w+=/.test(stripQuotes(ws[i]))) i++;
    const name = stripQuotes(ws[i] || '').toLowerCase();
    if (!WRAPPERS.has(name)) return i;
    i++;
    while (i < ws.length && ws[i].startsWith('-')) i += WRAPPER_OPTS_WITH_VALUE.has(ws[i]) ? 2 : 1;
    if ((name === 'timeout') && /^\d/.test(ws[i] || '')) i++;
  }
}

// Commands that change the shell's directory. This checker doesn't follow the directory,
// so in a worktree they may not point into the main folder: relative writes after one
// would land there.
const CD_COMMANDS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl', 'push-location']);

// In a worktree, a word that points git at the main folder through the environment
// (GIT_DIR=..., GIT_WORK_TREE=..., export GIT_DIR=..., $env:GIT_DIR = '...').
function gitEnvIntoMain(ws) {
  for (let k = 0; k < ws.length; k++) {
    const w = stripQuotes(ws[k]);
    const m = w.match(/^(?:\$env:)?GIT_(?:DIR|WORK_TREE)=(.*)$/i);
    if (m && pointsIntoMain(m[1])) return true;
    if (/^\$env:GIT_(?:DIR|WORK_TREE)$/i.test(w) && pointsIntoMain(ws[k + 2] || '')) return true;
  }
  return false;
}

function segmentCheck(words, depth) {
  const { words: ws, targets } = splitRedirects(words);
  for (const t of targets) {
    if (!destOk(t)) return `redirect to ${stripQuotes(t)}`;
  }
  // The shared-only pass judges writers and cd only; git is left to the normal pass.
  if (!sharedOnly && worktreeMode && gitEnvIntoMain(ws)) return 'git pointed at the main folder through the environment';
  if (!sharedOnly && ws.some((w) => GIT_CONFIG_ENV.test(stripQuotes(w)))) return 'git settings given through the environment could switch the trunk lock off';
  const i = commandIndex(ws);
  if (i >= ws.length) return null;
  const name = stripQuotes(ws[i]).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
  const args = ws.slice(i + 1);

  if (sharedOnly && CD_COMMANDS.has(name)) {
    const d = stripQuotes(destinations('first-path', args)[0] || '');
    // No target, a variable, ~ and "cd -" (the previous directory) can't be followed.
    if (d === '' || d === '-' || /[$%`]/.test(d) || d[0] === '~') { sharedCwd = null; return null; }
    const abs = sharedResolve(normPath(d));
    if (abs !== null && inShared(abs)) return `${name} into the shared conventions folder`;
    sharedCwd = abs;
    return null;
  }

  if (worktreeMode && CD_COMMANDS.has(name)) {
    for (const d of destinations('first-path', args)) {
      if (pointsIntoMain(d)) return `${name} into the main folder`;
    }
    return null;
  }

  if (name === 'git') return sharedOnly ? null : gitCheck(args);

  if (SHELLS.has(name)) {
    const fi = args.findIndex((a) => SHELL_CMD_FLAG.test(a.toLowerCase()));
    if (fi >= 0 && args[fi + 1] && depth < 3) {
      return analyze(unquote(args.slice(fi + 1).join(' ')), depth + 1);
    }
    return null;
  }

  if (name === 'dd') {
    const of = args.find((a) => a.startsWith('of='));
    if (of && !destOk(of.slice(3))) return `dd writes to ${of.slice(3)}`;
    return null;
  }

  const kind = WRITERS[name];
  if (kind) {
    for (const d of destinations(kind, args)) {
      if (!destOk(d)) return `${name} writes to ${stripQuotes(d)}`;
    }
  }
  return null;
}

function analyze(cmd, depth) {
  const { segs, subs } = segments(cmd);
  for (const seg of segs) {
    const reason = segmentCheck(seg, depth);
    if (reason) return reason;
  }
  if (depth < 3) {
    for (const sub of subs) {
      const reason = analyze(sub, depth + 1);
      if (reason) return reason;
    }
  }
  return null;
}

let s = '';
process.stdin.on('data', (d) => (s += d)).on('end', () => {
  let command = '';
  try {
    command = String((JSON.parse(s).tool_input || {}).command || '');
  } catch (e) {
    // Unparseable input on the default branch: fail closed.
    process.stdout.write('block: could not read the command');
    return;
  }
  const reason = analyze(command, 0);
  process.stdout.write(reason ? `block: ${reason}` : 'allow');
});
