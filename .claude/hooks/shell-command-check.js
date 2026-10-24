// Decides whether a Bash/PowerShell command may run while on master/main.
// Called by block-main-edits.sh with the PreToolUse JSON on stdin and the
// project directory (lowercase, forward slashes, e.g. /d/projects/foo) as argv[2].
// Prints "allow" or "block: <reason>".
//
// This is best-effort pattern matching, not a sandbox. It does not look inside
// scripts or interpreters (node -e, python -c, ...), find -exec/-delete, xargs,
// or anything built from variables. A path it cannot resolve counts as inside the
// project, so it is blocked.

const proj = normPath(process.argv[2] || '');

const GIT_PLAIN = new Set([
  'status', 'log', 'diff', 'show', 'fetch', 'merge', 'tag', 'switch', 'branch',
  'rev-parse', 'ls-files',
]);
const CONFIG_READ = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '--list', '-l']);
const CONFIG_WRITE = new Set([
  '--unset', '--unset-all', '--add', '--replace-all', '-e', '--edit',
  '--rename-section', '--remove-section',
]);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'pwsh', 'powershell']);
const SHELL_CMD_FLAGS = new Set(['-c', '-command', '-c:', '/c']);

// Commands that write; value = how to find the destination paths among the args.
//   all: every non-option arg   last: final non-option arg   sed: sed -i files
//   first/first2: first one / two positional args (or the named -Path style params)
const WRITERS = {
  tee: 'all', touch: 'all', mkdir: 'all', truncate: 'all', rm: 'all', rmdir: 'all',
  del: 'all', erase: 'all', rd: 'all', ri: 'all', 'remove-item': 'all', mv: 'all',
  cp: 'last', install: 'last', ln: 'last', sed: 'sed',
  'set-content': 'first', sc: 'first', 'add-content': 'first', ac: 'first',
  'out-file': 'first', 'new-item': 'first', ni: 'first', 'clear-content': 'first',
  'copy-item': 'first2', copy: 'first2', 'move-item': 'first2', move: 'first2',
  'rename-item': 'first2', ren: 'first2', rni: 'first2',
};
const PS_NAMED = new Set(['-path', '-filepath', '-literalpath', '-destination', '-newname']);

function normPath(p) {
  let s = p.replace(/\\/g, '/').toLowerCase();
  const m = s.match(/^([a-z]):\/(.*)$/);
  if (m) s = '/' + m[1] + '/' + m[2];
  return s;
}

function unquote(w) {
  if (w.length >= 2 && (w[0] === '"' || w[0] === "'") && w[w.length - 1] === w[0]) return w.slice(1, -1);
  return w;
}

function isPlanFile(n) {
  if (n.includes('..')) return false;
  if (n.startsWith(proj + '/docs/plans/')) return true;
  return !n.startsWith('/') && n.replace(/^\.\//, '').startsWith('docs/plans/');
}

// True when writing to this path is allowed on master.
function destOk(raw) {
  const w = unquote(raw);
  if (w === '' ) return false;
  const low = w.toLowerCase();
  if (low === '/dev/null' || low === '$null' || low === 'nul') return true;
  if (/[$%`]/.test(w)) return false; // variable: cannot resolve, so treat as inside
  if (w[0] === '~') return true;
  const n = normPath(w);
  if (isPlanFile(n)) return true;
  if (n.startsWith('/')) return !(n === proj || n.startsWith(proj + '/'));
  return false; // relative: inside the project
}

// Splits into command segments (arrays of raw words), at ; && || | & newline ( ) ` and $( .
function segments(cmd) {
  const segs = [];
  let cur = [], word = '', quote = '', has = false;
  const endWord = () => { if (has) cur.push(word); word = ''; has = false; };
  const endSeg = () => { endWord(); if (cur.length) segs.push(cur); cur = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      word += c;
      if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'") { quote = c; word += c; has = true; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); continue; }
    if (c === '\n' || c === ';' || c === '|' || c === '(' || c === ')' || c === '`') { endSeg(); continue; }
    if (c === '&') {
      // &> and >& are redirects, not separators
      if (cmd[i + 1] === '>' ) { word += c; has = true; continue; }
      if (word.endsWith('>') ) { word += c; has = true; continue; }
      endSeg();
      continue;
    }
    word += c; has = true;
  }
  endSeg();
  return segs;
}

// Pulls redirects out of a segment. Returns { words, targets }.
function splitRedirects(words) {
  const out = [], targets = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    let m = w.match(/^(?:\d+|\*|&)?>>?\|?(.*)$/);
    if (!m) { out.push(w); continue; }
    let rest = m[1];
    if (/^&\d*-?$/.test(rest)) continue; // 2>&1 and similar: not a file
    if (rest === '') { rest = words[++i] || ''; }
    targets.push(rest);
  }
  return { words: out, targets };
}

function gitCheck(args) {
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    const a = args[i];
    if (a === '-C' || a === '-c' || a === '--git-dir' || a === '--work-tree') i += 2;
    else i += 1;
  }
  const sub = unquote(args[i] || '');
  const rest = args.slice(i + 1).map(unquote);
  if (sub === '') return null;
  if (rest.some((a) => a.startsWith('--output'))) return `git ${sub} --output writes a file`;
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
    default:
      return `git ${sub} is not allowed`;
  }
}

function destinations(kind, name, args) {
  const nonOpt = args.filter((a) => !a.startsWith('-'));
  if (kind === 'all') return nonOpt;
  if (kind === 'last') {
    const ti = args.findIndex((a) => a === '-t' || a === '--target-directory');
    if (ti >= 0 && args[ti + 1]) return [args[ti + 1]];
    return nonOpt.slice(-1);
  }
  if (kind === 'sed') {
    const inPlace = args.some((a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a));
    if (!inPlace) return [];
    const hasScriptFlag = args.some((a) => a === '-e' || a === '-f' || a === '--expression' || a === '--file');
    return hasScriptFlag ? nonOpt : nonOpt.slice(1);
  }
  // PowerShell-style cmdlets: named path params win over positional
  const named = [];
  for (let i = 0; i < args.length - 1; i++) {
    if (PS_NAMED.has(args[i].toLowerCase())) named.push(args[i + 1]);
  }
  if (named.length) return named;
  return kind === 'first2' ? nonOpt.slice(0, 2) : nonOpt.slice(0, 1);
}

function segmentCheck(words, depth) {
  const { words: ws, targets } = splitRedirects(words);
  for (const t of targets) {
    if (!destOk(t)) return `redirect to ${unquote(t)}`;
  }
  let i = 0;
  while (i < ws.length && (/^\w+=/.test(ws[i]) || ['sudo', 'command', 'env', 'time', 'nohup', 'exec', '&'].includes(ws[i]))) i++;
  if (i >= ws.length) return null;
  const raw = unquote(ws[i]);
  const name = raw.replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
  const args = ws.slice(i + 1);

  if (name === 'git') return gitCheck(args);

  if (SHELLS.has(name) || name === 'cmd') {
    const fi = args.findIndex((a) => SHELL_CMD_FLAGS.has(a.toLowerCase()));
    if (fi >= 0 && args[fi + 1] && depth < 3) {
      const inner = analyze(unquote(args.slice(fi + 1).join(' ')), depth + 1);
      if (inner) return inner;
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
    for (const d of destinations(kind, name, args)) {
      if (!destOk(d)) return `${name} writes to ${unquote(d)}`;
    }
  }
  return null;
}

function analyze(cmd, depth) {
  for (const seg of segments(cmd)) {
    const reason = segmentCheck(seg, depth);
    if (reason) return reason;
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
