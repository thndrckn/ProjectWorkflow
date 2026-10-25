# Review: PWF-019 — Convention checks

- **Change:** PWF-019
- **Review format:** accountability
- **Plan:** docs/plans/PWF-019-convention-checks.md (approved in commit 0db5943)
- **Branch:** chore/PWF-019-convention-checks
- **Reviewer:** Independent Standards, Spec and Correctness reviewers (fresh sub-agents), then two fresh re-reviewers (rounds 1 and 2)
- **Scope:** diff of chore/PWF-019-convention-checks against master — 6 files (eslint.config.js, scripts/check-conventions.mjs, tests/conventions.mjs, package.json, CLAUDE.md, the plan), about 750 lines

## Findings
Severity and caused label are the reviewer's, never changed by the author.

### Standards reviewer
- **[Low]** The list of Rust-only structs is written out twice (script and test) — scripts/check-conventions.mjs, tests/conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (the test imports `RUST_ONLY_STRUCTS`)
- **[Low]** The one-argument `new Date(x)` rule also flags non-string arguments and has no comment saying so — eslint.config.js
  **Caused by this change:** yes
  **Disposition:** fixed (comment explaining the deliberate over-match)
- **[Low]** Non-obvious choices lacking "why" comments: raw-string handling, the CSP regex, an empty `TS_ONLY_INTERFACES` — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed for the raw-string/char-literal handling and the CSP regex (comments added); explained for `TS_ONLY_INTERFACES`: the plan's R10 calls for allow-lists for deliberate differences in both directions, and the empty list keeps a place for a deliberate TypeScript-only type, with stale-entry checking, without editing the logic.
- **[Nit]** Rule labels R1–R6 appear only in the tests, not in eslint.config.js — eslint.config.js, tests/conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (R-number comments added)
- **[Nit]** Any `http(s)://` in Rust outside `external/` is flagged with no comment explaining the choice — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (comment added)
- **[Informational]** Long one-line `found.push(...)` calls — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** explained (no JS formatter exists in the repo and no documented standard is breached)

### Spec reviewer
- **[Medium]** R8 checks dependencies against a deny-list, not the allow-list of the current set that the plan describes — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (`KNOWN_DEPENDENCIES` allow-list: a new dependency fails until added; the network-crate deny-list stays; a Cargo parser covers `[dependencies.x]`, build, dev and target tables and `package =` renames)
- **[Low]** The `http` crate was missing from the code scan — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (`\bhttp::` added)
- **[Low]** R12 catches hex colours only, and could flag an id selector such as `#add` — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed for the false positives (only declaration blocks scanned, `url()` removed). Explained for `rgba()`: the plan's play-back and CLAUDE.md's palette are hex tokens, App.css has 6 existing `rgba()` overlays and the plan says existing code is not rewritten, so flagging them needs CSS changes outside the plan.
- **[Nit]** No test for a conditional api.ts entry — tests/conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (test added)
- **[Informational]** Struct-level `rename_all` is reported, not honoured — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** explained (the plan allows reporting an exception rather than guessing; the real models pass)

### Correctness reviewer
- **[Low]** The Rust comment stripper mishandled the `'"'` char literal and nested block comments — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (char literals and a nesting depth counter, with tests)
- **[Low]** A `///` doc comment between `#[tauri::command]` and `fn` hid the command from the registered-and-wrapped check — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (comments stripped first; tests)
- **[Low]** Network-crate detection missed some Cargo.toml forms — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (with the allow-list fix above)
- **[Low]** Migration regex edge cases: `CREATE TABLE  IF NOT EXISTS` false positive; migrations below 018 skip the stamp check — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed for the double-space false positive (test added). Explained for the stamp: the plan scopes the R11 table and stamp rules to 018 onward; 001–009 have no stamp and earlier files are not rewritten.
- **[Low]** R12 colour check is hex-only, over-matches id selectors and exempts only the first `:root` block — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (id selectors, `url(#id)`, every `:root` block); `rgba()` explained as above.
- **[Low]** Coverage gaps: SQL keywords, loader scope, R10 parser edge cases, `.js`/`.jsx` not linted — scripts/check-conventions.mjs, eslint.config.js
  **Caused by this change:** yes
  **Disposition:** fixed for `REPLACE INTO`, `VACUUM`, `ATTACH`/`DETACH DATABASE` and the `.js`/`.jsx` lint scope. Explained for the rest: the R10 parser edge cases (multi-line serde attributes, raw identifiers, quoted TypeScript keys, other indentation) and the extra folders (`src-tauri/tests`, `build.rs`) do not occur in the repo, and the R10 edge cases fail loudly (a field mismatch is reported) rather than passing silently. `WITH` was not added: a common word, and a CTE needs `SELECT` anyway.
- **[Low]** Negative lint cases could pass on a parse error — tests/conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (fatal messages are kept in the filter)
- **[Informational]** Proof tests were not found to pass vacuously — tests/conventions.mjs
  **Caused by this change:** yes
  **Disposition:** explained (observation, no action)

### Raised by re-review
- **[Nit]** (round 1) The Cargo parser counted any `key =` line, so an indented continuation line of a multi-line inline table would be reported as a new dependency — scripts/check-conventions.mjs
  **Caused by this change:** yes
  **Disposition:** fixed (column-0 keys only, with a comment and a test)

## Re-review

### Round 1
Triggered by the fixes and explanations above. A fresh re-reviewer was given the plan, the standards, the diff of the fixes and each finding with its outcome and reasoning. It accepted every fix and every explanation (including the empty `TS_ONLY_INTERFACES`, the `rgba()` scope, the pre-018 stamp, and the R10 parser edge cases) and spot-checked the char-literal handling, nested comments, the Cargo parser, the CREATE TABLE regex and the CSS block scan. It raised one new finding (the Nit above), so the round was not clean.

### Round 2
A new fresh re-reviewer checked the fix to the round 1 Nit: accepted, with the lint, convention and proof commands run (82/82 cases). No new findings. Clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | tests/conventions.mjs: invoke() and Tauri import in a component fail; the same in api.ts and a component using api pass | Pass |
| R2 | tests/conventions.mjs: block body, `.then`, conditional, transformed argument, nested call and non-function entry fail; default parameter passes | Pass |
| R3 | tests/conventions.mjs: `new Date(str)` and `Date.parse` fail; `new Date(y, m, d)` and `new Date()` pass | Pass |
| R4 | tests/conventions.mjs: `window.confirm`, `confirm`, `alert`, `prompt` fail; a parameter named confirm passes | Pass |
| R5 | tests/conventions.mjs: inline `style` fails; `className` passes | Pass |
| R6 | tests/conventions.mjs: `fetch`, WebSocket, XMLHttpRequest, sendBeacon and a non-lucide icon import fail; lucide-react passes | Pass |
| R7 | tests/conventions.mjs: SQL and rusqlite outside the provider fail; the provider and comments pass | Pass |
| R8 | tests/conventions.mjs: ureq/URL outside external/, network and unknown dependencies in every Cargo form, widened CSP and network permission fail; the current set passes | Pass |
| R9 | tests/conventions.mjs: command missing from lib.rs or api.ts, orphan wrapper and orphan registration fail | Pass |
| R10 | tests/conventions.mjs: missing field, extra field, struct with no interface, interface with no struct and rename fail; matching pair and skipped field pass | Pass |
| R11 | tests/conventions.mjs: bare CREATE TABLE, rename without drop, wrong or missing stamp, numbering gap and version mismatch fail; correct set and pre-018 files pass | Pass |
| R12 | tests/conventions.mjs: hex outside :root, prefers-color-scheme and a Tailwind dependency fail; tokens, id selectors and comments pass | Pass |
| R13 | `npm run test:conventions` (82 cases, each rule with a failing and a passing case) | Pass |
| R14 | `npm run lint` and `npm run check:conventions` on the real tree; CLAUDE.md Checks lines read | Pass (checked by Claude) |

## Deviations from the plan
- The ESLint scope was widened from `.ts`/`.tsx` to `.js`/`.jsx` files in `src` as well (a Correctness finding), a small addition inside R1–R6.
- The tests import the script's exported lists rather than repeating them.
## Summary
The change adds the planned convention checks: ESLint selectors for the TypeScript rules (R1–R6), `scripts/check-conventions.mjs` for the Rust, CSS, migration and cross-file rules (R7–R12), and `tests/conventions.mjs` proving each rule fails on a deliberate violation (R13). CLAUDE.md's Checks list names the new commands (R14). All checks pass on today's code (384 Rust tests, clippy, fmt, lint, convention check, Vite build). Three independent reviewers raised 19 findings, none High; every one was fixed or explained, and two re-review rounds ended clean.
