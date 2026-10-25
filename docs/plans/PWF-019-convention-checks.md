# PWF-019 — Convention checks

- **Change:** PWF-019
- **Date:** 2026-10-25

## What you'll see change
Every rule in CLAUDE.md and the shared policy that a program can check is now checked by a program, on every change, instead of relying on a reviewer to notice. Today's code already obeys all of them, so nothing in the app changes and no existing code needs rewriting.

Two kinds of check are added:

- **Code-style checks inside the existing lint step** (so editors show them as you type): no talking to the backend except through the one API file; that API file may only hold plain one-line wrappers; no building a date straight from a stored text value; no browser pop-up confirm/alert/prompt; no inline styling; no network calls from the screen code; no icon library other than the one already used.
- **A new convention check** that looks at everything lint can't see: SQL and database access staying inside the database file; network code staying inside the park-hours fetcher; every backend command being registered and wrapped; the TypeScript data shapes matching the Rust ones; the rules for database migration scripts; the dark-only colour rules.

A second new command proves each check really fails when someone breaks its rule, so a check can't quietly stop working.

### Which rules became checks, and which didn't

| Rule (source) | Result | Why |
|---|---|---|
| No invoke() outside api.ts (CLAUDE.md) | Check (lint) | Exact, visible in the code |
| api.ts is one line per command, no logic (CLAUDE.md) | Check (lint) | Each entry must be a single direct invoke() call |
| Never `new Date(text)` on stored datetimes (POLICY, CLAUDE.md) | Check (lint) | Banned for a single argument and for Date.parse; building a date from numbers and `new Date()` for "now" stay allowed |
| No window.confirm (POLICY) | Check (lint) | Exact; alert and prompt banned with it |
| No inline styles (POLICY) | Check (lint) | Exact |
| No network calls beyond the park-hours fetch (CLAUDE.md, POLICY) | Check (lint + script) | Screen code can't use fetch and friends; Rust network code only in the fetcher; no new HTTP library or plugin; the security policy's allowed connections unchanged |
| Icons come from lucide-react only (CLAUDE.md) | Check (lint) | Other icon libraries banned |
| No SQL in commands.rs, and none outside the SQLite provider (CLAUDE.md) | Check (script) | Database library and SQL text allowed only in the provider; also covers lib.rs, engine and external |
| New commands are registered and wrapped (CLAUDE.md feature cycle, steps 5–7) | Check (script) | A missed step fails silently at runtime today |
| types.ts mirrors the Rust structs (POLICY) | Check (script), field names only | Catches add/rename/remove drift; field types and serde renames stay with the reviewer |
| Migration rules: numbering, `IF NOT EXISTS`, drop-before-rename, version stamp matches (CLAUDE.md) | Check (script) | Applied from migration 018, where the table rules began; 001–017 predate them and are not rewritten |
| Dark mode only, fixed palette, no Tailwind (CLAUDE.md, POLICY) | Check (script) | Colours only as named tokens in index.css; no light-mode media query; no Tailwind dependency |
| Business logic lives in Rust; commands.rs is thin; no engine logic in JS | Reviewer | Needs judgement about what counts as logic |
| Feature cycle order, Storage Trait boundary design | Reviewer | Design judgement |
| Subcomponent size threshold, loading-state and error-handling patterns, `onError` chain | Reviewer | Thresholds and "surfaced visibly" are judgement calls |
| Unhandled promise rejections | Reviewer (follow-up candidate) | Needs slower type-aware linting and may flag existing code; you chose to leave it out of this change |
| Lookup tables vs free text; whether a "why" comment is needed | Reviewer | Judgement |
| Datetime parsing helpers in Rust | Reviewer | No reliable pattern to match |
| Commit message format, change numbers, changelog entries, plan/review records | Workflow (skills) | Already enforced by the workflow's own steps, not by code checks |
| Data folder off-limits, no deleting files without listing | Guard hook | Already enforced by the existing hook |

## Requirements
- **R1.** Given code outside the API file that calls the backend directly or imports from the Tauri API, when lint runs, then it fails and names the rule.
- **R2.** Given an entry in the API file that is anything other than a single direct backend call (extra logic, chained steps), when lint runs, then it fails.
- **R3.** Given code that builds a date from a single value or uses Date.parse, when lint runs, then it fails; given a date built from separate numbers, or the current moment, then it passes.
- **R4.** Given code that calls the browser's confirm, alert or prompt, when lint runs, then it fails.
- **R5.** Given an inline style on a screen element, when lint runs, then it fails.
- **R6.** Given screen code that makes a network call, or imports an icon library other than the one in use, when lint runs, then it fails.
- **R7.** Given SQL text or database-library code anywhere in the backend except the SQLite provider, when the convention check runs, then it fails and names the file.
- **R8.** Given network code outside the park-hours fetcher, a new HTTP library or plugin, or a widened allowed-connections policy, when the convention check runs, then it fails.
- **R9.** Given a backend command that is not registered, or not wrapped in the API file (or a wrapper or registration with no command), when the convention check runs, then it fails and names the command.
- **R10.** Given a field present in a Rust data shape but missing from, or extra in, its TypeScript twin, when the convention check runs, then it fails and names the field.
- **R11.** Given a migration from 018 on that breaks the table rules, doesn't end with its own version stamp, leaves a gap in numbering, or doesn't match the app's stated schema version, when the convention check runs, then it fails.
- **R12.** Given a hard-coded colour outside the token list, a light-mode media query, or a Tailwind dependency, when the convention check runs, then it fails.
- **R13.** Given each rule above, when the proof command runs, then every rule is shown failing on a deliberate violation and passing on correct code.
- **R14.** Given today's code, when every check in the Checks list runs, then all pass; and the Checks list in CLAUDE.md names the convention check (always) and the proof command (only when relevant).

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog | Empty; no questions |
| Put TypeScript rules in ESLint and everything else in one Node script (`check:conventions`)? | Yes, ESLint plus one script |
| Include a best-effort check that TypeScript field names match the Rust structs? | Yes, field names only |
| Proofs in a separate `test:conventions`, run only when the rules change? | Yes, separate test, only when relevant |
| Enforce that every api.ts entry is a single direct invoke() call? | Yes |
| Leave unhandled-promise checking with the Standards reviewer? | Yes, leave it with the reviewer |
| Play-back: is the summary and the requirements list right? | Yes |

## What could go wrong / what gets lost
- Nothing in the app or the data changes; no migration.
- A check could flag something legitimate in a future change. The fix is a named, commented exception in the check's own list, never switching the rule off.
- The field-name check is best-effort: a deliberate difference between Rust and TypeScript needs a commented entry in a small allow-list.
- The lint step becomes slightly stricter, so any change in flight on another branch that breaks a rule will fail lint when it catches up.

## Not included
- Rules that need judgement (see the table); they stay with the Standards reviewer.
- Type-aware linting for unhandled promises (possible follow-up change).
- Rewriting migrations 001–017 or any existing code.
- A commit-message hook or any change to the workflow skills.

## How you'll check it
**T1 — Everything passes on today's code. Covers R14.**

1. In the main folder on the change branch, run the whole Checks list from CLAUDE.md, including `npm run check:conventions`.

Expected: every check passes and CLAUDE.md lists the two new commands.

**T2 — Each rule catches a violation. Covers R1–R13.**

1. Run `npm run test:conventions`.

Expected: one line per rule, each reporting that the deliberate violation was caught and the correct code passed; the command ends with a pass.

**T3 — Seeing one fail by hand. Covers R1, R7.**

1. Temporarily add `invoke('x')` to any component and run `npm run lint`.
2. Undo it, then temporarily put a `SELECT 1` string into commands.rs and run `npm run check:conventions`.
3. Undo it.

Expected: lint names the invoke rule; the convention check names commands.rs; both pass again after undoing.

## Check-in
- Type: chore
- Branch: chore/PWF-019-convention-checks
- Commit message: chore(PWF-019): add mechanical convention checks to lint and a new check script

---

## Technical detail (for Claude)

**Layers:** tooling only (ESLint config, one Node script, one Node test, `package.json` scripts, `CLAUDE.md`). No Rust, frontend source, migration, or `StorageProvider` change; the feature cycle does not apply.

**ESLint (`eslint.config.js`)** — keep the existing block; add rules via `no-restricted-syntax`, `no-restricted-imports`, `no-restricted-globals`/`no-restricted-properties`, scoped with `files`/`ignores` so `src/api.ts` is the only exempt file for R1:
- R1: restrict imports from `@tauri-apps/*` and calls to `invoke` in every `src/**` file except `src/api.ts`.
- R2: for `src/api.ts` only, selectors on the `api` object's properties: value must be an `ArrowFunctionExpression` whose body is a `CallExpression` to `invoke` (default parameter values allowed; no block body, `.then`, conditionals).
- R3: `NewExpression[callee.name='Date'][arguments.length=1]` and `CallExpression[callee.object.name='Date'][callee.property.name='parse']`. Existing uses in `utils.ts` pass the numeric form, and `new Date()` stays allowed.
- R4: restrict `confirm`, `alert`, `prompt` globals and their `window.` forms.
- R5: `JSXAttribute[name.name='style']`. `src/itineraryPdf.ts` has `style:` object keys for pdfmake, not JSX, and is unaffected.
- R6: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`; restricted imports for other icon packages (`react-icons`, `@fortawesome/*`, `@heroicons/*`, `@phosphor-icons/*`, `@tabler/icons*`, `@mui/icons-material`). The `http://www.w3.org/2000/svg` strings in `itineraryPdf.ts` are plain strings and unaffected.
- Existing `eslint-disable-next-line react-hooks/exhaustive-deps` comments are untouched.

**`scripts/check-conventions.mjs`** — dependency-free, resolves the repo root from its own location (works in a worktree), prints one line per violation as `rule: file[:line]: message`, exits non-zero if any. Structured as small named rule functions over an injected file-reader so `tests/conventions.mjs` can run them against fixtures:
- R7: SQL keywords in string literals or `rusqlite` / `Connection` use in any `src-tauri/src/**/*.rs` except `database/sqlite_provider.rs` (and `database/mod.rs` / `traits.rs` re-exports if present; confirm against current code). Comments are stripped first.
- R8: `ureq`/`reqwest`/`hyper`/`http`/`TcpStream` references only under `external/`; `Cargo.toml` dependency names checked against an allow-list of the current set (new HTTP crate or `tauri-plugin-http`/`-shell`/`-websocket` fails); `src-tauri/tauri.conf.json` CSP `connect-src` must equal the current value.
- R9: collect `#[tauri::command]` function names from `commands.rs`, names inside `generate_handler![…]` in `lib.rs`, and `invoke('…')` command names in `api.ts`; the three sets must be equal. (`save_itinerary_pdf` and `get_app_info` are included like the rest.)
- R10: parse `pub struct` field names in `database/models.rs` (skipping `#[serde(skip)]`, honouring `#[serde(rename = …)]` and `rename_all` where used) and `interface` field names in `types.ts`, matched by struct/interface name; structs with no TS twin and interfaces with no Rust twin are listed in a commented allow-list. Needs a first pass over the real files to build the allow-list; if a pairing proves unreliable, the check reports it as an exception rather than guessing.
- R11: for `migrations/NNN_*.sql` with NNN ≥ 018: every `CREATE TABLE` has `IF NOT EXISTS`; any `ALTER TABLE … RENAME TO x` is preceded by `DROP TABLE IF EXISTS x`; the last statement is `PRAGMA user_version = NNN;`. For all files: numbers contiguous from 001; highest equals `CURRENT_SCHEMA_VERSION` in `sqlite_provider.rs`. 001–017 are exempt (they predate the rules; 007 has already run and must not be edited).
- R12: hex colours in `src/*.css` only inside the `:root` token block of `src/index.css`; no `prefers-color-scheme` in `src/**/*.css`; no `tailwind*` in `package.json` dependencies.

**`tests/conventions.mjs`** — same style as `tests/itinerary-pdf.mjs`. For ESLint rules, use the `ESLint` class with `overrideConfigFile` and in-memory `lintText` (with a fake `filePath` such as `src/components/X.tsx` or `src/api.ts`) on good and bad snippets. For script rules, import the rule functions and feed them fixture strings. One output line per rule; exit non-zero on any miss.

**`package.json`** — add `"check:conventions": "node scripts/check-conventions.mjs"` and `"test:conventions": "node tests/conventions.mjs"`.

**`CLAUDE.md`** — under Checks (all must pass) add `npm run check:conventions`; under Checks (only when relevant) add `npm run test:conventions` when `eslint.config.js`, `scripts/check-conventions.mjs` or `tests/conventions.mjs` changed. Add one line under "What not to do" noting these rules are enforced by lint and `check:conventions`, and exceptions go in the check's commented allow-list. No change to the shared POLICY.md or the skills.

**Known debt touched:** none. The `set-state-in-effect` rule stays disabled as before.

**Planned tests**
- R1 — Automated: `tests/conventions.mjs` lints a component snippet with `invoke(...)` and a `@tauri-apps` import (fails) and the same text as `src/api.ts` (passes).
- R2 — Automated: api.ts snippets with a `.then()`, a block body, and a conditional (each fails) versus a one-line wrapper with a default parameter (passes).
- R3 — Automated: `new Date(str)`, `new Date(x)`, `Date.parse(s)` fail; `new Date(y, m, d)` and `new Date()` pass.
- R4 — Automated: `window.confirm(...)`, `confirm(...)`, `alert(...)`, `prompt(...)` fail.
- R5 — Automated: `<div style={{}} />` fails; `<div className="x" />` passes.
- R6 — Automated: `fetch(...)`, `new WebSocket(...)`, and an import from a non-lucide icon package fail; a `lucide-react` import passes.
- R7 — Automated: fixture `commands.rs` text with `SELECT * FROM trips` and with a `rusqlite` import fail; the same text under `sqlite_provider.rs` passes.
- R8 — Automated: a `ureq` call in `commands.rs`, a new `reqwest` dependency line, and a changed CSP string each fail; the current files pass.
- R9 — Automated: fixtures with one command missing from `lib.rs`, one missing from `api.ts`, and one orphan wrapper fail; matching sets pass.
- R10 — Automated: a struct/interface pair with one missing field and one extra field fail; matching pair passes; an allow-listed pair is skipped.
- R11 — Automated: fixture migrations 018+ with a bare `CREATE TABLE`, a rename without the preceding drop, a wrong or missing `user_version`, a numbering gap, and a version/constant mismatch each fail; a correct one passes; a bare `CREATE TABLE` in 013 is ignored.
- R12 — Automated: a hex colour in `App.css`, a `prefers-color-scheme` rule, and a `tailwindcss` dependency fail; the token block in `index.css` passes.
- R13 — Automated: `npm run test:conventions` itself; every rule above has a failing and a passing case, and the run fails if any rule's bad case isn't caught.
- R14 — Automated: run `npm run check:conventions` and `npm run lint` against the real tree (both must pass); the CLAUDE.md wording is Manual (read the file, Claude can verify by reading it).
