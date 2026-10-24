// Decides whether a Bash/PowerShell command may run while on master/main.
// Called by block-main-edits.sh with the PreToolUse JSON on stdin and the
// project directory (e.g. /d/projects/foo or D:\Projects\Foo) as argv[2].
// Prints "allow" or "block: <reason>".
//
// This is best-effort pattern matching, not a sandbox. It does not look inside
// scripts or interpreters (node -e, python -c, ...), find -exec/-delete, or
// anything built from variables. A path it cannot resolve counts as inside the
// project, so it is blocked.

import path from 'node:path';

const proj = normPath(process.argv[2] || '');
// 'worktree' when the command runs inside a worktree of this project while the main
// folder (proj) is on master: the worktree's own files are free to change, and only the
// main folder is protected. Anything else is 'master': proj is the folder being guarded.
const worktreeMode = process.argv[3] === 'worktree';

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

// True when an absolute, normalised path is inside the guarded main folder. Worktrees live
// under its .claude/worktrees/ and are judged by their own branch, so they don't count.
function inMain(n) {
  if (n !== proj && !n.startsWith(proj + '/')) return false;
  return !n.startsWith(proj + '/.claude/worktrees/');
}

// True when writing to this path is allowed on master.
function destOk(raw) {
  const w = stripQuotes(raw);
  if (w === '') return false;
  const low = w.toLowerCase();
  if (low === '/dev/null' || low === '$null' || low === 'nul') return true;
  if (/[$%`]/.test(w)) return false; // variable: cannot resolve, so treat as inside
  if (w[0] === '~') return true;
  let n = normPath(w);
  if (n.startsWith('/')) n = path.posix.normalize(n); // collapse any .. before comparing
  if (isPlanFile(n)) return true;
  if (n.startsWith('/')) return !inMain(n);
  // Relative: inside the project on master. In a worktree it lands in the worktree itself,
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

// In a worktree, true when a git global option (-C, --git-dir, --work-tree) points at the
// main folder, or at something that can't be resolved, so the master rules apply to it.
function redirectsIntoMain(opts) {
  for (let i = 0; i < opts.length; i++) {
    const a = opts[i];
    let v = null;
    if (a === '-C' || a === '--git-dir' || a === '--work-tree') v = opts[i + 1];
    else if (a.startsWith('--git-dir=') || a.startsWith('--work-tree=')) v = a.slice(a.indexOf('=') + 1);
    if (v === null || v === undefined) continue;
    const w = stripQuotes(v);
    if (/[$%`]/.test(w) || w.includes('..')) return true;
    const n = normPath(w);
    if (n.startsWith('/') && inMain(path.posix.normalize(n))) return true;
  }
  return false;
}

function gitCheck(args) {
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    const a = args[i];
    if (a === '-C' || a === '-c' || a === '--git-dir' || a === '--work-tree') i += 2;
    else i += 1;
  }
  if (worktreeMode && !redirectsIntoMain(args.slice(0, i))) return null; // git inside the worktree is free
  const sub = stripQuotes(args[i] || '');
  const rest = args.slice(i + 1).map(stripQuotes);
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
      const force = rest.some((a) => a === '--force' || (/^-[a-zA-Z]+$/.test(a) && a.includes('f')));
      if (verb === 'remove') return force ? 'forced git worktree remove' : null;
      if (verb === 'add') {
        return force || rest.some((a) => /^-[a-zA-Z]*B/.test(a)) ? 'forced git worktree add' : null;
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

function segmentCheck(words, depth) {
  const { words: ws, targets } = splitRedirects(words);
  for (const t of targets) {
    if (!destOk(t)) return `redirect to ${stripQuotes(t)}`;
  }
  const i = commandIndex(ws);
  if (i >= ws.length) return null;
  const name = stripQuotes(ws[i]).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
  const args = ws.slice(i + 1);

  if (name === 'git') return gitCheck(args);

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
    // Unparseable input on master: fail closed.
    process.stdout.write('block: could not read the command');
    return;
  }
  const reason = analyze(command, 0);
  process.stdout.write(reason ? `block: ${reason}` : 'allow');
});
