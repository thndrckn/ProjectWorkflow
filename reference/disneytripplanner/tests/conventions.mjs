import assert from 'node:assert/strict'
import { ESLint } from 'eslint'
import {
  COLOUR_FUNCTION_ALLOWLIST, RUST_ONLY_STRUCTS, cargoDependencyNames, commandsRegisteredAndWrapped, migrationsFollowRules, networkOnlyInFetcher,
  paletteAndStyling, sqlOnlyInProvider, stripRustComments, typesMatchModels,
} from '../scripts/check-conventions.mjs'

// Proves each convention check (eslint.config.js and scripts/check-conventions.mjs)
// fails on a deliberate violation and passes on correct code. Run it when the
// ESLint config, the check script or this file changes.
const results = []
const run = (rule, label, ok, detail = '') => {
  results.push({ rule, label, ok })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${rule} ${label}${ok ? '' : ` -- ${detail}`}`)
}

// ── ESLint rules ──────────────────────────────────────────────────────────
const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' })
const COMPONENT = 'src/components/Example.tsx'
const API = 'src/api.ts'
const lint = async (file, code) => {
  const [result] = await eslint.lintText(code, { filePath: file })
  // A parse error has no ruleId; keeping it here stops an "allowed" snippet that fails to parse from passing by accident.
  return result.messages.filter((m) => m.fatal || m.ruleId === 'no-restricted-syntax' || m.ruleId === 'no-restricted-imports')
}
const lintCases = [
  // [rule, label, file, code, expected to fail, fragment of the message]
  ['R1', 'invoke() in a component', COMPONENT, "export const f = () => invoke('x')", true, 'invoke()'],
  ['R1', 'Tauri import in a component', COMPONENT, "import { invoke } from '@tauri-apps/api/core'\nexport const f = 1", true, 'Tauri'],
  ['R1', 'invoke() in api.ts is allowed', API, "import { invoke } from '@tauri-apps/api/core'\nexport const api = { a: (): Promise<void> => invoke<void>('a') }", false],
  ['R1', 'a component calling api is allowed', COMPONENT, "import { api } from '../api'\nexport const f = () => api.a()", false],
  ['R2', 'api entry with a block body', API, "export const api = { a: () => { return invoke('a') } }", true, 'single direct invoke()'],
  ['R2', 'api entry chaining .then', API, "export const api = { a: () => invoke('a').then((x) => x) }", true, 'directly'],
  ['R2', 'api entry transforming an argument', API, "export const api = { a: (id: number) => invoke('a', { id: id + 1 }) }", true, 'No logic'],
  ['R2', 'api entry with a nested call', API, "export const api = { a: (id: string) => invoke('a', { id: id.trim() }) }", true, 'No logic'],
  ['R2', 'api entry with a conditional body', API, "export const api = { a: (x: boolean) => (x ? invoke('a') : invoke('b')) }", true, 'single direct invoke()'],
  ['R2', 'api entry that is not a function', API, "export const api = { a: invoke }", true, 'arrow function'],
  ['R2', 'api entry with a default parameter is allowed', API, "export const api = { a: (x = false): Promise<void> => invoke<void>('a', { x }) }", false],
  ['R3', 'new Date(text)', COMPONENT, 'export const d = (s: string) => new Date(s)', true, 'Datetime'],
  ['R3', 'Date.parse', COMPONENT, 'export const d = (s: string) => Date.parse(s)', true, 'Datetime'],
  ['R3', 'new Date from numbers is allowed', COMPONENT, 'export const d = new Date(2026, 9, 1)', false],
  ['R3', 'new Date() for now is allowed', COMPONENT, 'export const d = new Date()', false],
  ['R4', 'window.confirm', COMPONENT, "export const f = () => window.confirm('sure?')", true, 'dialogs'],
  ['R4', 'bare confirm', COMPONENT, "export const f = () => confirm('sure?')", true, 'dialogs'],
  ['R4', 'alert', COMPONENT, "export const f = () => alert('hi')", true, 'dialogs'],
  ['R4', 'prompt', COMPONENT, "export const f = () => prompt('name?')", true, 'dialogs'],
  ['R4', 'a parameter named confirm is allowed', COMPONENT, 'export const f = (confirm = false) => confirm', false],
  ['R5', 'inline style', COMPONENT, "export const C = () => <div style={{ color: 'red' }} />", true, 'inline style'],
  ['R5', 'a class name is allowed', COMPONENT, "export const C = () => <div className=\"x\" />", false],
  ['R6', 'fetch()', COMPONENT, "export const f = () => fetch('https://example.com')", true, 'network'],
  ['R6', 'new WebSocket', COMPONENT, "export const f = () => new WebSocket('wss://example.com')", true, 'network'],
  ['R6', 'new XMLHttpRequest', COMPONENT, 'export const f = () => new XMLHttpRequest()', true, 'network'],
  ['R6', 'navigator.sendBeacon', COMPONENT, "export const f = () => navigator.sendBeacon('/x')", true, 'network'],
  ['R6', 'another icon library', COMPONENT, "import { FaBeer } from 'react-icons/fa'\nexport const f = FaBeer", true, 'lucide-react'],
  ['R6', 'lucide-react is allowed', COMPONENT, "import { Plane } from 'lucide-react'\nexport const f = Plane", false],
]
for (const [rule, label, file, code, shouldFail, fragment] of lintCases) {
  const messages = await lint(file, code)
  const caught = messages.some((m) => !fragment || m.message.includes(fragment))
  run(rule, `lint: ${label}`, shouldFail ? caught : messages.length === 0, JSON.stringify(messages.map((m) => m.message)))
}

// ── Script rules ──────────────────────────────────────────────────────────
const expectViolation = (rule, label, found, fragment) =>
  run(rule, label, found.length > 0 && found.some((v) => v.message.includes(fragment)), JSON.stringify(found))
const expectClean = (rule, label, found) => run(rule, label, found.length === 0, JSON.stringify(found))

// R7
expectViolation('R7', 'SQL in commands.rs', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': 'let q = "SELECT * FROM trips";' }), 'SQL')
expectViolation('R7', 'raw-string SQL in lib.rs', sqlOnlyInProvider({ 'src-tauri/src/lib.rs': 'let q = r#"DELETE FROM trips"#;' }), 'SQL')
expectViolation('R7', 'rusqlite in the engine', sqlOnlyInProvider({ 'src-tauri/src/engine/x.rs': 'use rusqlite::Connection;' }), 'rusqlite')
expectClean('R7', 'SQL in the provider is allowed', sqlOnlyInProvider({ 'src-tauri/src/database/sqlite_provider.rs': 'use rusqlite::Connection; let q = "SELECT * FROM trips";' }))
expectClean('R7', 'SQL words in comments are allowed', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': '/// SELECT the rows FROM trips\n// INSERT INTO nothing\nfn f() {}' }))
expectViolation('R7', 'REPLACE INTO is SQL too', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': 'let q = "REPLACE INTO trips VALUES (1)";' }), 'SQL')
expectViolation('R7', 'a quote char literal does not hide a later string', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': `let q = '"'; let s = "DELETE FROM trips";` }), 'SQL')
expectClean('R7', 'a comment after a quote char literal is still a comment', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': `let q = '"'; // DELETE FROM trips` }))
expectClean('R7', 'nested block comments are skipped', sqlOnlyInProvider({ 'src-tauri/src/commands.rs': '/* a /* DELETE FROM x */ DELETE FROM y */ fn f() {}' }))
run('R7', 'comment stripper keeps // inside a string', stripRustComments('let u = "http://x"; // gone').includes('http://x') && !stripRustComments('let u = "a"; // gone').includes('gone'))

// R8
expectViolation('R8', 'ureq in commands.rs', networkOnlyInFetcher({ 'src-tauri/src/commands.rs': 'let r = ureq::get(u);' }), 'outside external/')
expectViolation('R8', 'a URL in the engine', networkOnlyInFetcher({ 'src-tauri/src/engine/x.rs': 'let u = "https://example.com";' }), 'outside external/')
expectViolation('R8', 'reqwest dependency', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': '[dependencies]\nserde = "1"\nreqwest = "0.12"\n' }), 'reqwest')
expectViolation('R8', 'reqwest as its own table', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': '[dependencies]\nserde = "1"\n\n[dependencies.reqwest]\nversion = "0.12"\n' }), 'reqwest')
expectViolation('R8', 'reqwest renamed with package =', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': '[dependencies]\nfoo = { package = "reqwest", version = "0.12" }\n' }), 'reqwest')
expectViolation('R8', 'reqwest in a target-specific table', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': "[target.'cfg(windows)'.dependencies]\nreqwest = \"0.12\"\n" }), 'reqwest')
expectViolation('R8', 'a dependency not on the known list', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': '[dependencies]\nsomething-new = "1"\n' }), 'new dependency "something-new"')
expectViolation('R8', 'the http crate in the engine', networkOnlyInFetcher({ 'src-tauri/src/engine/x.rs': 'use http::Request;' }), 'outside external/')
expectClean('R8', 'a multi-line inline dependency table is one dependency', networkOnlyInFetcher({ 'src-tauri/Cargo.toml': '[dependencies]\nserde = {\n  version = "1",\n  features = ["derive"],\n}\n' }))
run('R8', 'dependency parser reads build tables and ignores other tables', (() => {
  const names = cargoDependencyNames('[package]\nname = "app"\n\n[build-dependencies]\ntauri-build = "2"\n\n[features]\ndefault = []\n')
  return names.has('tauri-build') && !names.has('name') && !names.has('default')
})())
expectViolation('R8', 'widened CSP connect-src', networkOnlyInFetcher({ 'src-tauri/tauri.conf.json': `"csp": "default-src 'self'; connect-src 'self' https://example.com"` }), 'connect-src')
expectViolation('R8', 'network permission', networkOnlyInFetcher({ 'src-tauri/capabilities/default.json': '{"permissions": ["core:default", "http:default"]}' }), 'http:default')
expectClean('R8', 'ureq in external/ and the current CSP are allowed', networkOnlyInFetcher({
  'src-tauri/src/external/park_hours_fetcher.rs': 'let r = ureq::get("https://api.themeparks.wiki");',
  'src-tauri/Cargo.toml': '[dependencies]\nureq = "2"\n',
  'src-tauri/tauri.conf.json': `"csp": "default-src 'self'; connect-src 'self' ipc: http://ipc.localhost; img-src 'self'"`,
  'src-tauri/capabilities/default.json': '{"permissions": ["core:default", "dialog:default"]}',
}))

// R9
const commandsRs = '#[tauri::command]\npub async fn alpha() {}\n\n#[tauri::command]\npub fn beta() {}\n'
const libRs = (names) => `tauri::generate_handler![\n${names.map((n) => `        ${n},`).join('\n')}\n    ]`
const apiTs = (names) => `export const api = {\n${names.map((n) => `  ${n}: (): Promise<void> => invoke<void>('${n}'),`).join('\n')}\n}`
const wired = (over = {}) => ({
  'src-tauri/src/commands.rs': commandsRs, 'src-tauri/src/lib.rs': libRs(['alpha', 'beta']), 'src/api.ts': apiTs(['alpha', 'beta']), ...over,
})
expectClean('R9', 'every command registered and wrapped', commandsRegisteredAndWrapped(wired()))
expectViolation('R9', 'command missing from lib.rs', commandsRegisteredAndWrapped(wired({ 'src-tauri/src/lib.rs': libRs(['alpha']) })), '"beta" is not registered')
expectViolation('R9', 'command missing from api.ts', commandsRegisteredAndWrapped(wired({ 'src/api.ts': apiTs(['alpha']) })), '"beta" is not wrapped')
expectClean('R9', 'a doc comment between the attribute and fn is still a command', commandsRegisteredAndWrapped(wired({ 'src-tauri/src/commands.rs': commandsRs + '#[tauri::command]\n/// doc\npub fn gamma() {}\n', 'src-tauri/src/lib.rs': libRs(['alpha', 'beta', 'gamma']), 'src/api.ts': apiTs(['alpha', 'beta', 'gamma']) })))
expectViolation('R9', 'a command behind a doc comment is still checked', commandsRegisteredAndWrapped(wired({ 'src-tauri/src/commands.rs': commandsRs + '#[tauri::command]\n/// doc\npub fn gamma() {}\n' })), '"gamma" is not registered')
expectViolation('R9', 'wrapper with no command', commandsRegisteredAndWrapped(wired({ 'src/api.ts': apiTs(['alpha', 'beta', 'ghost']) })), 'ghost')
expectViolation('R9', 'registration with no command', commandsRegisteredAndWrapped(wired({ 'src-tauri/src/lib.rs': libRs(['alpha', 'beta', 'ghost']) })), 'ghost')

// R10
const models = (fields) => `/// doc\n#[derive(Debug)]\npub struct Foo {\n${fields.map((f) => `    pub ${f}: i64,`).join('\n')}\n}\n`
const types = (fields) => `export interface Foo {\n${fields.map((f) => `  ${f}: number;`).join('\n')}\n}\n`
const typed = (m, t) => ({ 'src-tauri/src/database/models.rs': m, 'src/types.ts': t })
const withLookupOnly = (m) => m + RUST_ONLY_STRUCTS.map((n) => `pub struct ${n} {\n    pub id: i64,\n}\n`).join('')
expectClean('R10', 'matching struct and interface', typesMatchModels(typed(withLookupOnly(models(['id', 'name'])), types(['id', 'name']))))
expectViolation('R10', 'field missing from types.ts', typesMatchModels(typed(withLookupOnly(models(['id', 'name'])), types(['id']))), 'Foo.name exists in the Rust struct but not in types.ts')
expectViolation('R10', 'extra field in types.ts', typesMatchModels(typed(withLookupOnly(models(['id'])), types(['id', 'extra']))), 'Foo.extra exists in types.ts but not in the Rust struct')
expectViolation('R10', 'struct with no interface', typesMatchModels(typed(withLookupOnly(models(['id'])), '')), 'no interface')
expectViolation('R10', 'interface with no struct', typesMatchModels(typed(withLookupOnly(models(['id'])), types(['id']) + types(['id']).replace('Foo', 'Bar'))), 'no Rust struct')
expectViolation('R10', 'rename honoured', typesMatchModels(typed(withLookupOnly('pub struct Foo {\n    #[serde(rename = "other")]\n    pub id: i64,\n}\n'), types(['id']))), 'Foo.other')
expectClean('R10', 'skipped field ignored', typesMatchModels(typed(withLookupOnly('pub struct Foo {\n    pub id: i64,\n    #[serde(skip)]\n    pub hidden: i64,\n}\n'), types(['id']))))

// R11
const migration = (n, body = '') => `-- migration ${n}\n${body}\nPRAGMA user_version = ${n};\n`
const migrations = (over = {}, count = 19) => {
  const files = {}
  for (let n = 1; n <= count; n++) files[`migrations/${String(n).padStart(3, '0')}_m.sql`] = migration(n)
  files['migrations/018_m.sql'] = migration(18, 'CREATE TABLE IF NOT EXISTS a (id INTEGER);\nDROP TABLE IF EXISTS b;\nALTER TABLE a RENAME TO b;')
  return { 'src-tauri/src/database/sqlite_provider.rs': `const CURRENT_SCHEMA_VERSION: i64 = ${count};`, ...files, ...over }
}
expectClean('R11', 'a correct set of migrations', migrationsFollowRules(migrations()))
expectViolation('R11', 'bare CREATE TABLE from 018 on', migrationsFollowRules(migrations({ 'migrations/019_m.sql': migration(19, 'CREATE TABLE c (id INTEGER);') })), 'IF NOT EXISTS')
expectClean('R11', 'bare CREATE TABLE before 018 is ignored', migrationsFollowRules(migrations({ 'migrations/013_m.sql': migration(13, 'CREATE TABLE c (id INTEGER);') })))
expectClean('R11', 'CREATE TABLE  IF NOT EXISTS with extra spaces', migrationsFollowRules(migrations({ 'migrations/019_m.sql': migration(19, 'CREATE TABLE   IF  NOT EXISTS c (id INTEGER);') })))
expectViolation('R11', 'rename without the drop', migrationsFollowRules(migrations({ 'migrations/019_m.sql': migration(19, 'ALTER TABLE a RENAME TO b2;') })), 'DROP TABLE IF EXISTS b2')
expectViolation('R11', 'wrong version stamp', migrationsFollowRules(migrations({ 'migrations/019_m.sql': '-- m\nPRAGMA user_version = 18;\n' })), 'PRAGMA user_version = 19')
expectViolation('R11', 'missing version stamp', migrationsFollowRules(migrations({ 'migrations/019_m.sql': 'SELECT 1;\n' })), 'PRAGMA user_version = 19')
expectViolation('R11', 'numbering gap', migrationsFollowRules(migrations({ 'migrations/021_m.sql': migration(21) })), 'without gaps')
expectViolation('R11', 'CURRENT_SCHEMA_VERSION behind', migrationsFollowRules(migrations({ 'src-tauri/src/database/sqlite_provider.rs': 'const CURRENT_SCHEMA_VERSION: i64 = 18;' })), 'CURRENT_SCHEMA_VERSION')

// R12
const palette = (css, extra = {}) => ({ 'src/index.css': ':root {\n  --bg: #1a1a1a;\n}\n' + css, ...extra })
expectClean('R12', 'colour tokens in :root are allowed', paletteAndStyling(palette('.x { color: var(--bg); }')))
expectViolation('R12', 'hex colour outside :root', paletteAndStyling(palette('', { 'src/App.css': '.x { color: #fff; }' })), 'hard-coded colour')
expectViolation('R12', 'hex colour in index.css outside :root', paletteAndStyling(palette('.x { color: #123456; }')), 'hard-coded colour')
expectViolation('R12', 'prefers-color-scheme', paletteAndStyling(palette('@media (prefers-color-scheme: light) { .x { color: red; } }')), 'dark mode only')
expectViolation('R12', 'Tailwind dependency', paletteAndStyling(palette('', { 'package.json': '{"devDependencies": {"tailwindcss": "4"}}' })), 'Tailwind')
const allowedCss = Object.entries(COLOUR_FUNCTION_ALLOWLIST['src/App.css'])
  .flatMap(([value, count]) => Array.from({ length: count }, (_, i) => `.a${i}${value.length} { box-shadow: 0 0 4px ${value}; }`)).join('\n')
expectClean('R12', 'the existing rgba() overlays on the allow-list are allowed', paletteAndStyling(palette('', { 'src/App.css': allowedCss })))
expectViolation('R12', 'one more rgba() than the allow-list', paletteAndStyling(palette('', { 'src/App.css': allowedCss + '\n.extra { box-shadow: 0 0 4px rgba(0, 0, 0, 0.4); }' })), 'hard-coded colour rgba(0, 0, 0, 0.4)')
expectViolation('R12', 'a new rgba() value', paletteAndStyling(palette('', { 'src/App.css': allowedCss + '\n.extra { background: rgba(255, 0, 0, 0.3); }' })), 'rgba(255, 0, 0, 0.3)')
expectViolation('R12', 'rgba() in another file', paletteAndStyling(palette('', { 'src/Other.css': '.x { background: rgba(0, 0, 0, 0.4); }' })), 'hard-coded colour')
expectViolation('R12', 'hsl() outside the allow-list', paletteAndStyling(palette('.x { color: hsl(10 20% 30%); }')), 'hsl(10 20% 30%)')
expectViolation('R12', 'a stale allow-list entry', paletteAndStyling(palette('', { 'src/App.css': '.x { color: var(--bg); }' })), 'COLOUR_FUNCTION_ALLOWLIST lists')
expectClean('R12', 'rgba() as a token inside :root is allowed', paletteAndStyling({ 'src/index.css': ':root {\n  --dim: rgba(26, 111, 196, 0.15);\n}\n' }))
expectClean('R12', 'id selectors and url(#id) are not colours', paletteAndStyling(palette('#add .x { background: url(#abc); }')))
expectClean('R12', 'a second :root block in index.css is allowed', paletteAndStyling(palette(':root {\n  --more: #fff;\n}\n')))
expectClean('R12', 'a colour in a comment is allowed', paletteAndStyling(palette('/* was #fff */ .x { color: var(--bg); }', { 'package.json': '{"dependencies": {"react": "19"}}' })))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} cases behaved as expected`)
assert.equal(failed.length, 0, `${failed.length} convention-check case(s) failed`)
