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
Every project is run like a professional software shop. Every change goes through four steps, in order, and nothing reaches the default branch without all four. The design is `docs/workflow-v2.md`.

1. **Design and plan** (`/design-change`, or `/plan-small-change` / `/plan-large-change` typed directly): the change gets its number, the user is shown the project backlog once, the change is thought through by interview, and the user approves a written plan. A change that fits in one session is a small change; a bigger one gets a spec and numbered tickets (`NNN.1`, `NNN.2`, ...).
2. **Code** (`/code-change`, started only by the user): the work happens in a worktree on the change's own branch, test-first, never on the default branch. A large change is coded one ticket at a time.
3. **Review** (part of `/code-change`): reviewers independent of the author check the work (Light: Standards and Spec; Full: also Correctness). The author fixes or explains each finding, then one fresh reviewer checks only those outcomes. Anything still disputed goes to the user, who decides.
4. **Check in** (`/merge-change`, started only by the user): the trunk lock checks the review record, and the branch is merged into the default branch only if it passes.

A version is made later by `/build-changes` (started only by the user).

Finish one change through check-in before starting the next, so every new branch starts from up-to-date work. The exception is a project whose CLAUDE.md sets up worktrees: there each change is coded in its own worktree, so several can be in flight at once, and each catches up with the default branch at check-in.

Each project's CLAUDE.md names its default branch and change prefix. The step-by-step detail lives in the project's skills.

Process improvement ideas go in `PROCESS_BACKLOG.md`, next to this file.

This file and `PROCESS_BACKLOG.md` live in `docs/` of the ProjectWorkflow repo. They are changed through normal changes like any other file: planned, approved by the user in the plan, coded on a branch and reviewed.

---

## Rules for plans and skills
1. Tests never use a made-up change or a test-only decision; a check that needs a live run uses the next real change.
2. Workflow and tooling changes are type chore.
3. Shared skills and hooks never contain anything project-specific (numbers, file names, app features); project facts come from CLAUDE.md. The shared workflow's own paths (plans, reviews, changelog, backlog, decisions) are not project-specific.

---

## Change numbers
Every change gets a number, like a ticket: the project's prefix plus three digits, for example `ABC-085`. Each project's CLAUDE.md sets its prefix.

- The number is assigned when planning starts (`/design-change`, or `/plan-small-change` / `/plan-large-change`): the next one after the highest number in the CHANGELOG, the plans folder or the local branch names, claimed at once with a placeholder plan file so two planning chats never take the same number. Numbers are never reused or changed. A large change's tickets are numbered NNN.1, NNN.2, ... under the change's number.
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
- A change is **checked in** when `/merge-change` merges its branch into the default branch (`--no-ff`), pushes the default branch, and removes the worktree and branch. If the push is rejected it stops; it never force-pushes.
- Manual edits (for example, changing CLAUDE.md directly) are checked in the same way: plan them as a change, and `/code-change` carries them onto a branch.

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

Every commit message includes the change number as its scope, for example `feat(ABC-085): show feedback when no hours are found`.

`CHANGELOG.md` has one short entry per change number, newest first. New entries wait under "Unreleased" until a build turns them into a version. It's the timeline; the full detail of each change lives in its plan and review record.

### Versioning
- Check-ins never create versions or tags.
- A version is created only by a build (`/build-changes`): it moves everything under "Unreleased" into a new version heading, sets the version in every file that tracks it, tags the default branch, and builds the app.
- The version bump follows the changes in it: minor if any is a `feat:`, otherwise patch.

---

## Peer review
**When:** every change is reviewed before it's checked in, as part of `/code-change`.

**Scope:** the change's branch compared against the default branch. A full-codebase review happens instead when meaningful change has built up since the last one. That's a judgment call, and either the user or Claude can flag that one feels due.

**Depth**, by merge danger (the definition in Matt's `pr` skill: the door, one-way or two-way, and the blast radius), chosen by the user from the planner's recommendation when the plan is written, not by change type:
- **Light** (a two-way door and a small blast radius): Matt's `code-review`, a Standards reviewer and a Spec reviewer.
- **Full** (a one-way door or a wide blast radius; when unsure, Full; changes to the lock or guard are always Full): the same two plus a Correctness reviewer.

**Reviewers:** fresh reviewers that see only the diff, the approved plan and the project's standards, never the author's reasoning. The author does not review its own code and does not have the last word on a finding. Each finding gets a severity (Informational, Nit, Low, Medium or High) and a "caused by this change: yes/no" label from the reviewer; the author may not change either, and disagrees by saying so in the record.

**Settling findings:** the author fixes each finding, explains why it is not a problem, or logs it in `docs/BACKLOG.md`. Each finding is written up in the user's format: severity, "caused by this change", a plain-English description and a recommendation. A finding this change caused must be fixed or explained, never logged. A failed requirement test is not a reviewer finding; it can only be fixed.

**Where a "why" is written down:** a by-design reason that belongs to one spot in the code goes in a comment at that spot, and the author adds that comment as part of settling the finding; it gets no entry in the project's decisions file (`docs/DECISIONS.md`) and is recorded in the review record only. A reason that applies project-wide goes in the decisions file. Reviewers check that code the change adds or alters, when it is non-obvious (a hidden constraint, a workaround, a surprising choice), has a "why" comment; a missing one is a Low standards finding. Obvious code needs no comment and old code is not flagged.

**Re-review:** one round. A fresh reviewer is given only the findings and the code changed to address them. It confirms each fix and checks each finding that was explained instead of fixed. Anything it still disputes goes to the user with both sides in plain English, and the user decides. `/code-change` run again on an existing branch continues the change; earlier findings are never rewritten.

**When to stop and ask the user:** only when (1) a fix would go against the approved plan, (2) a fix would touch the user's data, whatever the finding's severity (migrations, delete behaviour, import/export/backup code, or the data directory), or (3) the re-reviewer rejects an outcome the author still stands by. The plan wins over any finding.

**Record:** each change (and each ticket) gets a review record at `docs/reviews/<number>-<title>.md` with the level, the findings and their outcomes, who decided any dispute, and a trace table (requirement, test, result), then any deviations from the plan, and it ends with a short summary. Every finding is recorded, whatever its disposition; the record shows what was checked and decided, not just what was changed. The trunk lock checks the record is complete before the default branch moves. It cannot prove the user made a decision; the user's approval of the review is that proof.

---

## Before starting any task
**No code is written until a plan has been approved.** Every change starts with `/design-change`, `/plan-small-change` or `/plan-large-change`.

- If anything about the task is unclear, ask. Don't assume. Ask one question at a time, with a recommended answer, and wait for the reply.
- The plan is saved at `docs/plans/<change number>-<title>.md`. It opens with a plain-English summary for the user (what will change, what could go wrong or get lost, what's not included, how to check it, and the check-in decisions), followed by the technical detail: files, layers (Rust or frontend) and why, existing code to reuse, and any known debt the change touches.
- Every plan has a Requirements section: numbered Given / When / Then cases (R1, R2, …) in plain English, signed off at play-back. The technical detail names a planned test for each requirement, automated wherever one can exist. "How you'll check it" is the user's manual test procedure, as numbered tests that each name the requirements they cover.
- Approval means the user explicitly says so. Silence is not approval.
- **Document control:** once a plan is approved, it's never edited. Anything built differently is recorded as a deviation in the change's review record.
