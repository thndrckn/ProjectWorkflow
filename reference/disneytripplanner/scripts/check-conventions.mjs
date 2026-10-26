// Convention checks (DTP-104): the rules in CLAUDE.md and the shared policy
// that a program can check and ESLint cannot see (Rust, CSS, migrations,
// cross-file). The TypeScript-only rules live in eslint.config.js. A rule that
// needs judgement is not here; it stays with the Standards reviewer.
//
// Every rule is a function from `repo` (a plain object mapping a repo-relative
// path with forward slashes to the file's text) to a list of violations, so
// tests/conventions.mjs can feed it fixtures instead of the real tree.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const violation = (rule, file, message) => ({ rule, file, message })
const paths = (repo, test) => Object.keys(repo).filter(test)

/** Rust source with comments removed and string contents kept, so a URL inside a string survives. */
export function stripRustComments(text) {
  let out = ''
  for (let i = 0; i < text.length;) {
    const rest = text.slice(i)
    // Raw strings (r#"..."#) hold SQL in this codebase and may contain a bare quote or `//`.
    const raw = /^b?r(#*)"/.exec(rest)
    // A char literal such as '"' must not be read as the start of a string.
    const char = /^'(?:\\.[^']*|[^\\'])'/.exec(rest)
    if (char) {
      out += char[0]
      i += char[0].length
    } else if (raw) {
      const end = text.indexOf(`"${raw[1]}`, i + raw[0].length)
      const stop = end === -1 ? text.length : end + 1 + raw[1].length
      out += text.slice(i, stop)
      i = stop
    } else if (text[i] === '"') {
      let j = i + 1
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1
      out += text.slice(i, j + 1)
      i = j + 1
    } else if (rest.startsWith('//')) {
      while (i < text.length && text[i] !== '\n') i++
    } else if (rest.startsWith('/*')) {
      // Rust block comments nest.
      let depth = 1
      i += 2
      while (i < text.length && depth > 0) {
        if (text.startsWith('/*', i)) { depth++; i += 2 }
        else if (text.startsWith('*/', i)) { depth--; i += 2 }
        else i++
      }
    } else {
      out += text[i++]
    }
  }
  return out
}

const stripSqlComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '')
const stripCssComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '')

// ── R7: SQL and database access only in the SQLite provider ───────────────

const SQL_TEXT =
  /\b(SELECT\s[\s\S]*?\sFROM|INSERT\s+(?:OR\s+\w+\s+)?INTO|UPDATE\s+\w+\s+SET|REPLACE\s+INTO|DELETE\s+FROM|CREATE\s+(?:TABLE|INDEX)|ALTER\s+TABLE|DROP\s+TABLE|PRAGMA|VACUUM|ATTACH\s+DATABASE|DETACH\s+DATABASE)\b/i
const PROVIDER = 'src-tauri/src/database/sqlite_provider.rs'

export function sqlOnlyInProvider(repo) {
  const found = []
  for (const file of paths(repo, (p) => /^src-tauri\/src\/.*\.rs$/.test(p) && p !== PROVIDER)) {
    const code = stripRustComments(repo[file])
    if (/\brusqlite\b/.test(code)) found.push(violation('sql-only-in-provider', file, 'uses rusqlite; database access belongs in sqlite_provider.rs'))
    const sql = SQL_TEXT.exec(code)
    if (sql) found.push(violation('sql-only-in-provider', file, `contains SQL ("${sql[1].replace(/\s+/g, ' ').slice(0, 30)}"); SQL belongs in sqlite_provider.rs`))
  }
  return found
}

// ── R8: no network code beyond the park-hours fetcher ─────────────────────

// Any URL in Rust code outside external/ is flagged too, not only calls: the
// only legitimate URL in this app's backend is the themeparks.wiki one, so a
// second one is worth a look and the allow-list is the way to say it is fine.
const NETWORK_IN_CODE = /\b(ureq|reqwest|hyper|isahc|surf|attohttpc|TcpStream|TcpListener|UdpSocket)\b|\bhttp::|https?:\/\//
// Every dependency the backend has today. A new one fails until it is added
// here, which is the prompt to confirm it makes no network calls (the shared
// policy asks for that judgement on any new dependency).
export const KNOWN_DEPENDENCIES = [
  'tauri-build', 'serde_json', 'serde', 'log', 'tauri', 'tauri-plugin-log', 'rusqlite', 'async-trait',
  'tauri-plugin-window-state', 'tauri-plugin-dialog', 'ureq',
]
// Crates that exist to talk to the network or run processes. Never allow-listed.
const NETWORK_CRATES = [
  'reqwest', 'hyper', 'isahc', 'surf', 'attohttpc', 'curl', 'minreq', 'tungstenite', 'tokio-tungstenite',
  'tauri-plugin-http', 'tauri-plugin-websocket', 'tauri-plugin-shell', 'tauri-plugin-upload', 'tauri-plugin-updater',
]

/** Dependency names in a Cargo.toml: every dependencies table form, with `package = "x"` renames resolved. */
export function cargoDependencyNames(cargo) {
  const names = new Set()
  let table = null // { sub: name of a [dependencies.x] table, or null for a plain table }
  for (const line of cargo.split('\n')) {
    const header = /^\s*\[([^\]]+)\]\s*$/.exec(line)
    if (header) {
      const path = /(?:^|\.)(?:dev-|build-)?dependencies(?:\.([\w-]+))?$/.exec(header[1].replace(/"[^"]*"|'[^']*'/g, ''))
      table = path ? { sub: path[1] ?? null } : null
      if (table?.sub) names.add(table.sub)
      continue
    }
    if (!table) continue
    const renamed = /\bpackage\s*=\s*"([\w-]+)"/.exec(line)
    if (renamed) names.add(renamed[1])
    // Column 0 only: the continuation lines of a multi-line inline table are indented and are not dependencies.
    const entry = !table.sub && /^([\w-]+)\s*=/.exec(line)
    if (entry) names.add(entry[1])
  }
  return names
}
const NETWORK_PERMISSIONS = /^(http|websocket|shell|upload|updater):/
// The CSP's connect-src is what lets the webview talk to anything but the Rust side.
export const EXPECTED_CONNECT_SRC = "connect-src 'self' ipc: http://ipc.localhost"

export function networkOnlyInFetcher(repo) {
  const found = []
  for (const file of paths(repo, (p) => /^src-tauri\/src\/.*\.rs$/.test(p) && !p.startsWith('src-tauri/src/external/'))) {
    const hit = NETWORK_IN_CODE.exec(stripRustComments(repo[file]))
    if (hit) found.push(violation('network-only-in-fetcher', file, `network code ("${hit[0]}") outside external/`))
  }
  const cargo = repo['src-tauri/Cargo.toml']
  if (cargo !== undefined) {
    for (const name of cargoDependencyNames(cargo)) {
      if (NETWORK_CRATES.includes(name)) found.push(violation('network-only-in-fetcher', 'src-tauri/Cargo.toml', `dependency "${name}" can make network calls`))
      else if (!KNOWN_DEPENDENCIES.includes(name)) {
        found.push(violation('network-only-in-fetcher', 'src-tauri/Cargo.toml', `new dependency "${name}": confirm it makes no network calls, then add it to KNOWN_DEPENDENCIES in scripts/check-conventions.mjs`))
      }
    }
  }
  const conf = repo['src-tauri/tauri.conf.json']
  if (conf !== undefined) {
    // The CSP is one JSON string of `;`-separated directives, so the directive ends at `;` or the closing quote.
    const connect = /connect-src[^;"]*/.exec(conf)
    if (!connect || connect[0].trim() !== EXPECTED_CONNECT_SRC) {
      found.push(violation('network-only-in-fetcher', 'src-tauri/tauri.conf.json', `the CSP connect-src must stay "${EXPECTED_CONNECT_SRC}"`))
    }
  }
  for (const file of paths(repo, (p) => /^src-tauri\/capabilities\/.*\.json$/.test(p))) {
    for (const [, permission] of repo[file].matchAll(/"([a-z-]+:[^"]*)"/g)) {
      if (NETWORK_PERMISSIONS.test(permission)) found.push(violation('network-only-in-fetcher', file, `permission "${permission}" grants network or process access`))
    }
  }
  return found
}

// ── R9: every command is registered in lib.rs and wrapped in api.ts ───────

export function commandsRegisteredAndWrapped(repo) {
  const commands = new Set(
    [...stripRustComments(repo['src-tauri/src/commands.rs'] ?? '').matchAll(/#\[tauri::command\]\s*(?:#\[[^\]]*\]\s*)*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/g)].map((m) => m[1]),
  )
  const handler = /generate_handler!\s*\[([\s\S]*?)\]/.exec(stripRustComments(repo['src-tauri/src/lib.rs'] ?? ''))
  const registered = new Set((handler?.[1] ?? '').split(',').map((s) => s.trim().split('::').pop()).filter(Boolean))
  const wrapped = new Set([...(repo['src/api.ts'] ?? '').matchAll(/\binvoke\s*(?:<[^'(]*>)?\s*\(\s*'(\w+)'/g)].map((m) => m[1]))
  const found = []
  const compare = (name, have, file, what) => {
    for (const command of have) if (!commands.has(command)) found.push(violation('command-registered-and-wrapped', file, `${what} "${command}" has no #[tauri::command] in commands.rs`))
    for (const command of commands) if (!have.has(command)) found.push(violation('command-registered-and-wrapped', file, `command "${command}" is not ${name}`))
  }
  compare('registered in generate_handler! in lib.rs', registered, 'src-tauri/src/lib.rs', 'registration for')
  compare('wrapped in api.ts', wrapped, 'src/api.ts', 'wrapper for')
  return found
}

// ── R10: types.ts mirrors the Rust structs (field names only) ─────────────

// Rust structs with no TypeScript twin (never sent to the screen as a whole,
// or sent only inside another struct), and interfaces with no Rust twin.
// Entries here are checked: one that stops being true is itself a violation.
export const RUST_ONLY_STRUCTS = ['TripSummary', 'TripSectionCounts', 'BackfillResult', 'FetchedParkHours', 'TripExport', 'DatabaseExport']
export const TS_ONLY_INTERFACES = []

export function rustStructFields(text) {
  const structs = new Map()
  const problems = []
  for (const m of text.matchAll(/((?:^[ \t]*(?:\/\/\/[^\n]*|#\[[^\n]*\])\n)*)^pub struct (\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const [, head, name, body] = m
    if (/#\[serde\([^)]*rename_all/.test(head)) problems.push(`${name}: struct-level serde rename_all is not understood by this check`)
    const fields = []
    let pending = []
    for (const line of body.split('\n')) {
      const attr = /^\s*#\[(.*)\]\s*$/.exec(line)
      if (attr) { pending.push(attr[1]); continue }
      const field = /^\s*pub\s+(\w+)\s*:/.exec(line)
      if (!field) continue
      const serde = pending.filter((a) => a.startsWith('serde')).join(' ')
      pending = []
      if (/\bflatten\b/.test(serde)) { problems.push(`${name}.${field[1]}: serde flatten is not understood by this check`); continue }
      if (/\bskip(_serializing)?\b/.test(serde) && !/skip_serializing_if/.test(serde)) continue
      fields.push(/rename\s*=\s*"(\w+)"/.exec(serde)?.[1] ?? field[1])
    }
    structs.set(name, fields)
  }
  return { structs, problems }
}

export function tsInterfaceFields(text) {
  const interfaces = new Map()
  for (const m of text.matchAll(/^export interface (\w+)\s*\{([\s\S]*?)^\}/gm)) {
    interfaces.set(m[1], [...m[2].matchAll(/^ {2}(?:readonly\s+)?(\w+)\??\s*:/gm)].map((f) => f[1]))
  }
  return interfaces
}

export function typesMatchModels(repo) {
  const models = repo['src-tauri/src/database/models.rs']
  const types = repo['src/types.ts']
  if (models === undefined || types === undefined) return []
  const { structs, problems } = rustStructFields(models)
  const interfaces = tsInterfaceFields(types)
  const found = problems.map((p) => violation('types-match-models', 'src-tauri/src/database/models.rs', p))
  const diff = (name, from, to, fromWhere, toWhere, file) => {
    for (const field of from) if (!to.includes(field)) found.push(violation('types-match-models', file, `${name}.${field} exists in ${fromWhere} but not in ${toWhere}`))
  }
  for (const [name, fields] of structs) {
    const twin = interfaces.get(name)
    if (!twin) {
      if (!RUST_ONLY_STRUCTS.includes(name)) found.push(violation('types-match-models', 'src/types.ts', `Rust struct ${name} has no interface in types.ts (add one, or list it in RUST_ONLY_STRUCTS with a reason)`))
      continue
    }
    if (RUST_ONLY_STRUCTS.includes(name)) found.push(violation('types-match-models', 'scripts/check-conventions.mjs', `${name} is in RUST_ONLY_STRUCTS but now has an interface; remove the entry`))
    diff(name, fields, twin, 'the Rust struct', 'types.ts', 'src/types.ts')
    diff(name, twin, fields, 'types.ts', 'the Rust struct', 'src/types.ts')
  }
  for (const name of interfaces.keys()) {
    if (structs.has(name)) continue
    if (!TS_ONLY_INTERFACES.includes(name)) found.push(violation('types-match-models', 'src/types.ts', `interface ${name} has no Rust struct in models.rs (list it in TS_ONLY_INTERFACES with a reason if deliberate)`))
  }
  for (const name of RUST_ONLY_STRUCTS) if (!structs.has(name)) found.push(violation('types-match-models', 'scripts/check-conventions.mjs', `${name} is in RUST_ONLY_STRUCTS but no such struct exists; remove the entry`))
  for (const name of TS_ONLY_INTERFACES) if (!interfaces.has(name)) found.push(violation('types-match-models', 'scripts/check-conventions.mjs', `${name} is in TS_ONLY_INTERFACES but no such interface exists; remove the entry`))
  return found
}

// ── R11: migration rules ───────────────────────────────────────────────────

// The IF NOT EXISTS / drop-before-rename rules were written down with
// migration 018; 001-017 predate them and are not rewritten (007 has already
// run against the live database and must not be edited).
export const TABLE_RULES_START = 18

export function migrationsFollowRules(repo) {
  const found = []
  const files = paths(repo, (p) => /^migrations\/\d{3}_.*\.sql$/.test(p)).sort()
  const numbers = files.map((f) => Number(/^migrations\/(\d{3})_/.exec(f)[1]))
  numbers.forEach((n, i) => {
    if (n !== i + 1) found.push(violation('migrations', files[i], `migration numbers must run 001, 002, ... without gaps or repeats (expected ${String(i + 1).padStart(3, '0')})`))
  })
  const declared = /const\s+CURRENT_SCHEMA_VERSION\s*:\s*i64\s*=\s*(\d+)/.exec(repo[PROVIDER] ?? '')
  if (!declared) found.push(violation('migrations', PROVIDER, 'CURRENT_SCHEMA_VERSION not found'))
  else if (numbers.length && Number(declared[1]) !== Math.max(...numbers)) {
    found.push(violation('migrations', PROVIDER, `CURRENT_SCHEMA_VERSION is ${declared[1]} but the highest migration is ${Math.max(...numbers)}`))
  }
  files.forEach((file, i) => {
    const number = numbers[i]
    if (number < TABLE_RULES_START) return
    const sql = stripSqlComments(repo[file])
    if (/CREATE\s+TABLE(?!\s+IF\s+NOT\s+EXISTS\b)/i.test(sql)) found.push(violation('migrations', file, 'CREATE TABLE must be CREATE TABLE IF NOT EXISTS'))
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+\S+\s+RENAME\s+TO\s+(\w+)/gi)) {
      const before = sql.slice(0, m.index)
      if (!new RegExp(`DROP\\s+TABLE\\s+IF\\s+EXISTS\\s+${m[1]}\\b`, 'i').test(before)) {
        found.push(violation('migrations', file, `a rename to ${m[1]} must be preceded by DROP TABLE IF EXISTS ${m[1]}`))
      }
    }
    const last = sql.split(';').map((s) => s.trim()).filter(Boolean).pop() ?? ''
    const stamp = /^PRAGMA\s+user_version\s*=\s*(\d+)$/i.exec(last)
    if (!stamp || Number(stamp[1]) !== number) found.push(violation('migrations', file, `must end with PRAGMA user_version = ${number};`))
  })
  return found
}

// ── R12: dark-only palette, tokens only, no Tailwind ──────────────────────

// The black shadows and backdrops App.css already had when this check was added (DTP-104), by file, with how many
// times each appears. Entries are checked: one that no longer matches the file is itself a violation. A new colour
// belongs in a token in src/index.css, not here.
export const COLOUR_FUNCTION_ALLOWLIST = {
  'src/App.css': { 'rgba(0, 0, 0, 0.4)': 3, 'rgba(0, 0, 0, 0.5)': 1, 'rgba(0, 0, 0, 0.55)': 2 },
}

export function paletteAndStyling(repo) {
  const found = []
  for (const file of paths(repo, (p) => /^src\/.*\.css$/.test(p))) {
    let css = stripCssComments(repo[file])
    if (/prefers-color-scheme/.test(css)) found.push(violation('palette', file, 'prefers-color-scheme: the app is dark mode only'))
    if (file === 'src/index.css') css = css.replace(/:root\s*\{[^}]*\}/g, '')
    // Look only at declaration blocks (and outside url(...)), so an id selector like #add or url(#abc) is not
    // mistaken for a colour.
    const blocks = [...css.replace(/url\([^)]*\)/g, '').matchAll(/\{([^{}]*)\}/g)].map((b) => b[1]).join(';')
    const hex = /#[0-9a-fA-F]{3,8}\b/.exec(blocks)
    if (hex) found.push(violation('palette', file, `hard-coded colour ${hex[0]}: use a token from the :root block in src/index.css`))
    // Colour functions (rgba() and friends) are held to the same rule; the shadows and overlays that already
    // exist are listed in COLOUR_FUNCTION_ALLOWLIST, so a new one fails while old ones are not rewritten.
    const used = new Map()
    for (const [call] of blocks.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\([^)]*\)/g)) {
      const value = call.replace(/\s+/g, ' ')
      used.set(value, (used.get(value) ?? 0) + 1)
    }
    const allowed = new Map(Object.entries(COLOUR_FUNCTION_ALLOWLIST[file] ?? {}))
    for (const [value, count] of used) {
      if (count > (allowed.get(value) ?? 0)) {
        found.push(violation('palette', file, `hard-coded colour ${value}: use a token from the :root block in src/index.css (or, for a deliberate exception, COLOUR_FUNCTION_ALLOWLIST in scripts/check-conventions.mjs)`))
      }
    }
    for (const [value, count] of allowed) {
      if ((used.get(value) ?? 0) < count) found.push(violation('palette', file, `COLOUR_FUNCTION_ALLOWLIST lists ${count}x ${value} but the file has fewer; update the entry`))
    }
  }
  if (repo['package.json'] !== undefined) {
    const pkg = JSON.parse(repo['package.json'])
    for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
      if (/tailwind/i.test(name)) found.push(violation('palette', 'package.json', `${name}: no Tailwind, styles are named classes`))
    }
  }
  return found
}

export const rules = [sqlOnlyInProvider, networkOnlyInFetcher, commandsRegisteredAndWrapped, typesMatchModels, migrationsFollowRules, paletteAndStyling]

const FILE_PATTERNS = [
  /^src-tauri\/src\/.*\.rs$/, /^src-tauri\/(Cargo\.toml|tauri\.conf\.json)$/, /^src-tauri\/capabilities\/.*\.json$/,
  /^src\/(api\.ts|types\.ts|.*\.css)$/, /^migrations\/.*\.sql$/, /^package\.json$/,
]

export function loadRepo(root) {
  const repo = {}
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (name === 'node_modules' || name === 'target' || name === 'dist' || name === '.git') continue
      if (statSync(full).isDirectory()) walk(full)
      else {
        const rel = relative(root, full).split('\\').join('/')
        if (FILE_PATTERNS.some((p) => p.test(rel))) repo[rel] = readFileSync(full, 'utf8')
      }
    }
  }
  for (const top of ['src-tauri', 'src', 'migrations', 'package.json']) {
    const full = join(root, top)
    if (statSync(full).isDirectory()) walk(full)
    else repo[top] = readFileSync(full, 'utf8')
  }
  return repo
}

export const runAll = (repo) => rules.flatMap((rule) => rule(repo))

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const found = runAll(loadRepo(root))
  for (const v of found) console.error(`${v.rule}: ${v.file}: ${v.message}`)
  if (found.length) {
    console.error(`\n${found.length} convention violation(s). Fix the code; an exception goes in the rule's commented allow-list in scripts/check-conventions.mjs.`)
    process.exit(1)
  }
  console.log('Conventions OK')
}
