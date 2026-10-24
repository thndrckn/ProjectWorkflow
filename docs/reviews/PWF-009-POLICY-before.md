# Shared Engineering Policy

This file is the single source of truth for house rules shared across
all local-first Tauri + React + SQLite apps. It is imported into each
project's own `CLAUDE.md` via `@path/to/POLICY.md` — do not copy this
content into any project's `CLAUDE.md` directly. If a policy decision
changes, edit it here, once. Everything below applies to every project
that imports this file. Anything specific to one app — schema, file
layout, domain formulas, colors, known debt — lives in that project's
own `CLAUDE.md`, not here.

---

## The one rule that overrides everything else
**Business logic lives in Rust. The frontend renders. That's the boundary. Do not cross it.**

If you are about to write data manipulation, calculation, filtering, date math, or validation logic in JavaScript/TypeScript — stop. That belongs in the Rust backend. The JS layer calls `api.ts`, receives a result, and renders it. Nothing more.

---

## Standards apply unconditionally
Do not qualify problems with "acceptable for a single-user app," "fine for this scope," "it's just a prototype," or any similar framing. The audience size or release status does not lower the bar. Hold everything to the same standard regardless.

This applies to engineering practices too — version numbers, changelogs, and commit conventions are maintained from day one. The app not being publicly released is not a reason to skip them. Good habits don't start at release.

---

## Workflow model
Every project is run like a professional software shop. Every change goes through four steps, in order, and nothing reaches the default branch without all four:

1. **Plan** (`/plan-change`): the user is interviewed one question at a time until the change is understood, then approves a written plan. The plan assigns the change number and settles the type, branch, and commit message.
2. **Code** (`/code-change`, started only by the user): the work happens on its own branch, created from the default branch. Code is never edited on the default branch.
3. **Review** (part of `/code-change`): reviewers independent of the author check the work and rate every finding, including whether this change caused it; the author never rates its own code and never has the last word on its own findings. The author settles each finding itself (fix, explain, or log, within the rules below) and records it, and a fresh reviewer checks every outcome, including every fix. It stops and asks the user only in four cases: a fix would go against the approved plan, a fix would touch the user's data, the re-reviewer rejects an explanation the author still stands by, or the re-review is still not clean after its last permitted round, or needs a round only the user can authorise.
4. **Check in** (`/commit-change`, started only by the user): the review record is checked against the review rules, and the branch is merged into the default branch and pushed only if it passes. A failed check goes back through `/code-change`, which continues the change on its existing branch.

Finish one change through check-in before starting the next, so every new branch starts from up-to-date work.

Each project's CLAUDE.md names its default branch and change prefix. The step-by-step detail lives in the project's skills.

Process improvement ideas go in `PROCESS_BACKLOG.md`, next to this file.

---

## Change numbers
Every change gets a number, like a ticket: the project's prefix plus three digits, for example `DTP-085`. Each project's CLAUDE.md sets its prefix.

- The number is assigned when planning starts (`/plan-change`): the next one after the highest number in the CHANGELOG or the plans folder. Numbers are never reused or changed.
- The number appears everywhere the change does: the plan file, the branch, every commit message, the review record, and the CHANGELOG entry. Any one of them leads to all the others.
- Every change gets a number, including documentation-only changes.

---

## Dependencies and network calls
Prefer a well-established, actively maintained library over hand-rolling non-trivial logic — date/time handling, UUID generation, and similarly well-trodden problems are exactly the kind of thing a mature package has already solved and had scrutinized by far more usage than any one project can replicate. Hand-rolling this instead usually means more code to maintain long-term and more surface for subtle bugs, not less risk. Reaching for the standard library for the job doesn't need to be a stop-and-ask event — just note it happened (commit message is enough).

Exercise judgment on anything that isn't a clear win: an obscure, narrowly-maintained, or unmaintained package; a dependency that exists to wrap something that's genuinely a few lines of code; or anything that meaningfully expands the app's attack surface or install footprint for marginal benefit — those are worth a quick check with the user before adding, not a silent decision either way.

Do not add network calls without explicit instruction. If a project has an existing, deliberate exception to a local-only posture, that exception must be stated explicitly in that project's own `CLAUDE.md` — an existing exception is never a license to add more without asking.

Do not introduce a connection pool or additional async DB patterns beyond a single locked connection without explicit instruction.

---

## Lookup tables vs. free text
Any value that is categorical and repeated — one where the same value gets stored across many rows — must be stored as an integer foreign key into a lookup table, never as raw repeated text. Renaming or correcting a value should mean editing one row, not a find-and-replace across every table that references it.

Free text that is inherently one-off per row stays free text. There is nothing shared to normalize. Do not create a lookup table for a value that will never be reused verbatim across rows.

When in doubt: would this value ever need to be renamed everywhere at once? If yes, lookup table. If no, free text.

---

## Database migrations
Schema changes to existing tables are handled via standalone SQL migration scripts in a `migrations/` directory, from day one — pre-release included, with no separate pre-release/post-release split for schema changes themselves. Scripts are numbered sequentially (001, 002, ...) and run manually against the live database before launching the updated app.

**Never write in-app migration routines** (no `PRAGMA table_info` checks, no `ALTER TABLE` in the table-creation function, no column-existence detection). The app assumes the migration has already been run. For fresh databases, table creation uses `CREATE TABLE IF NOT EXISTS` with the current target schema — no migration needed.

Until a product is released, backup/restore import and export functions support only the current schema format. When a migration changes the schema, update import/export to match the new format only — do not add legacy format branches or backwards-compatibility code. There are no users with old backups to protect pre-release. Legacy format handling is dead code and will be removed. Once a product is released this policy changes — migrations must then maintain backwards compatibility for existing user backups.

---

## No compile-time verification across the IPC boundary
The Rust backend serializes structs to JSON. TypeScript consumes them by field name with no compile-time check. `types.ts` is the manual contract mirroring the Rust structs in `database/models.rs` — keep it in sync. When renaming or restructuring a Rust struct field, update `types.ts` immediately. Breakage from a mismatch is silent until runtime.

---

## Datetime handling — this will cause bugs if ignored
All datetimes are stored as `"YYYY-MM-DDTHH:MM:SS"` strings — local time, no timezone info, no timezone suffix. Ever.

**Rust:** parse and format through dedicated helpers — do not hand-roll date parsing elsewhere. Each project's own `CLAUDE.md` names its specific helper functions.

**JavaScript:** always use a dedicated parse helper. Never use `new Date(isoString)` directly on these strings — it treats timezone-less strings as UTC in some runtimes, producing silent off-by-one-day bugs.

---

## Subcomponent size threshold
Small helper components under ~30 lines with 3 or fewer props are defined inline at the bottom of the file that uses them. Larger subcomponents with their own logic or more than 5 props get their own file in `src/components/`. Data hooks that own shared fetch state for a view get extracted to `src/hooks/` where that pattern exists.

Do not extract subcomponents to separate files unless they meet the above threshold or unless explicitly asked.

---

## Component patterns

### Data fetching
```ts
useEffect(() => {
  api.getSomething().then(setSomething).catch(err => setError(String(err)))
}, [refreshTick])
```
`refreshTick` is a counter bumped by any write operation — calling it re-fetches dependent views. There is no global state, no context, no data cache.

### Error handling
Each view accepts an `onError: (message: string) => void` prop and calls it from `.catch()`/try-catch around every API call; the callback chain bubbles up to a single owner (typically the top-level app component) that renders one shared error modal/dialog. New views and API calls must surface failures visibly through this chain — unhandled promise rejections are not acceptable, and a view must never swallow an error into local-only state that the shared surface never sees.

### Loading states
```tsx
if (!data) return <div className="loading">Loading…</div>
```
No skeletons, no spinners on individual operations, no optimistic updates.

### Confirm dialogs
Use a shared `showConfirm()` dialog component, never `window.confirm()`, with no exceptions. Confirming a destructive operation from inside a Rust command isn't feasible — the confirmation belongs in the frontend behind the shared component.

---

## CSS — named classes only
All styles live in the project's stylesheet via named class selectors. Do not use inline `style=` attributes. Do not use Tailwind, even if it's present as a listed dependency. If it needs styling, it gets a named class.

---

## Data protection — non-negotiable
The `data/` directory is off-limits. Do not delete, move, rename, overwrite, or modify any file in it under any circumstances — this includes the live database and any other files stored there. Each project's own `CLAUDE.md` lists its specific protected files.

Do not perform any "cleanup," "reorganization," or file removal anywhere in the project without explicitly listing every file that will be deleted and receiving approval. When in doubt, do not delete anything.

---

## Committing
- Work is committed on its own branch as it's built. Branch commits stay on your computer; they aren't pushed.
- Nothing is ever committed directly to the default branch. Code edits there are blocked by a hook.
- A change is **checked in** when `/commit-change` merges its branch into the default branch, pushes it to GitHub, and deletes the branch. The default branch is never left ahead of GitHub.
- Manual edits (for example, editing CLAUDE.md by hand) are checked in the same way: plan them as a change, and `/code-change` carries them onto a branch.

---

## Commit message convention
This project uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must start with a type prefix:

| Prefix | When to use |
|---|---|
| `feat:` | New user-visible feature or Tauri command |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring with no behavior change |
| `test:` | Adding or updating tests only |
| `perf:` | Performance improvement |
| `style:` | CSS/visual-only changes |
| `docs:` | Documentation only (CLAUDE.md, CHANGELOG.md) |
| `chore:` | Tooling, config, dependencies |

Every commit message includes the change number as its scope, for example `feat(DTP-085): show feedback when no hours are found`.

`CHANGELOG.md` has one short entry per change number, newest first. New entries wait under "Unreleased" until a build turns them into a version. It's the timeline; the full detail of each change lives in its plan and review record.

### Versioning
- Check-ins never create versions or tags.
- A version is created only by a build (`/build-changes`): it moves everything under "Unreleased" into a new version heading, sets the version in every file that tracks it, tags the default branch, and builds the app.
- The version bump follows the changes in it: minor if any is a `feat:`, otherwise patch.

---

## Peer review
**When:** every change is reviewed before it's checked in, as part of `/code-change`.

**Scope:** the change's branch compared against the default branch. A full-codebase review happens instead when meaningful change has built up since the last one. That's a judgment call, and either the user or Claude can flag that one feels due.

**Depth**, by change type:
- `feat:`: at least two passes, general correctness plus the most relevant second angle (data integrity for schema changes, security for external input, and so on).
- `fix:`: one thorough pass: confirm the root cause was fixed, and check for the same bug pattern elsewhere in the touched files.
- `refactor:`: one pass, checking that behavior didn't change.

**Reviewers:** the review is done by fresh reviewers that see only the diff, the approved plan and the project's standards, never the author's reasoning (a re-reviewer, whose job is to check the author's outcomes, is also given each outcome and the reason for it). Each finding gets a severity (Informational, Nit, Low, Medium or High) and a label, "caused by this change: yes/no", from the reviewer. Caused means the problem is in what this change added or altered, or in behaviour it changed. The author never changes either; if it disagrees, it says so in the record and the value stays. It can move a "yes" to "no" only by explaining why, and the re-reviewer must accept the explanation.

**Settling findings:** the author settles every finding itself, without waiting for approval: fixed, explained (not a real problem, with the reason), or logged in the project's known-issues file. A finding this change caused must end as fixed, or as explained with a reason the re-reviewer accepts; it can never be logged or accepted as is. A finding this change did not cause may be fixed, explained or logged, at any severity, and the re-reviewer confirms it wasn't caused here. A failed requirement test is not a reviewer finding; it is always caused and can only be fixed.

**Re-review:** whenever there is any outcome at all (any fix, explanation or logged item, or a fixed failed requirement), at every severity, a fresh reviewer re-checks every explanation, every logged item and every fix, and labels any new finding. A round is clean only when the re-reviewer accepts everything and raises no new finding at all, so a fix to a re-reviewer's own finding is always checked by the next round. It repeats with a new fresh reviewer after any round that isn't clean, until a round is clean, up to three rounds in total for the change, plus any further round only if the user authorises it (for example to check a fix made after a failed check-in gate), recorded in the review record as "Settled by the user: <answer>" under that round (the check-in gate looks for that phrase). If the third is still not clean, the author stops and shows the user what's still open, and the user's recorded answer settles those items. If the re-reviewer rejects an explanation, a "not caused" label or a fix, the author fixes the problem properly (a rejected "not caused" label means the finding counts as caused), or logs it if this change didn't cause it; if it still disagrees, it stops and asks the user.

**When to stop and ask the user:** only in four cases. (1) A fix would go against the approved plan. (2) A fix would touch the user's data, whatever the finding's severity: migrations, delete behaviour, import/export/backup code, or the data directory. (3) The re-reviewer rejects an explanation, label or fix and the author still disagrees after fixing or logging as above. (4) The last permitted re-review round (the third, or an extra round the user authorised) is still not clean, or a further round beyond the third is needed, which only the user can authorise. The plan wins over any finding.

**Continuing a change:** `/code-change` run on an existing working branch continues that change: it fixes, re-runs the checks, re-reviews and appends a new round to the review record without touching the plan. A review record that fails the check-in gate goes back through it. Earlier findings and rounds are never rewritten; a record problem is fixed by adding a round-numbered correction line, and a missing label or severity is supplied by a fresh reviewer, never by the author.

**Record:** each change gets its own review record at `docs/reviews/<change number>-<title>.md`, citing the approved plan, with every finding, its reviewer-assigned severity and caused label and its disposition (fixed, explained with the reason, or logged), each re-review round, any deviations from the plan, and a summary. A record in the new format carries a `Review format: accountability` line. At check-in, `/commit-change` checks a new-format record against these rules (every finding labelled; no caused finding logged; every explanation, logged item and fix accepted by a re-reviewer; the loop finished clean within three rounds; no failed requirement) and stops with a plain-English list of what failed. Records in the old format are exempt. Every finding is recorded, whatever its disposition; the record shows what was checked and decided, not just what was changed. The record also has a trace table with one row per requirement: the requirement, its test, and the result. The hand-off gives the user a short plain-English summary of what was found and done.

The old single-file log (`PEER_REVIEW.md`) is kept as an archive of earlier reviews.

---

## Before starting any task
**No code is written until a plan has been approved.** Every change starts with `/plan-change`.

- If anything about the task is unclear, ask. Don't assume. Ask one question at a time, with a recommended answer, and wait for the reply.
- The plan is saved at `docs/plans/<change number>-<title>.md`. It opens with a plain-English summary for the user (what will change, what could go wrong or get lost, what's not included, how to check it, and the check-in decisions), followed by the technical detail: files, layers (Rust or frontend) and why, existing code to reuse, and any known debt the change touches.
- Every plan has a Requirements section: numbered Given / When / Then cases (R1, R2, …) in plain English, signed off at play-back. The technical detail names a planned test for each requirement, automated wherever one can exist. "How you'll check it" is the user's manual test procedure, as numbered tests that each name the requirements they cover.
- Approval means the user explicitly says so. Silence is not approval.
- **Document control:** once a plan is approved, it's never edited. Anything built differently is recorded as a deviation in the change's review record.
