# PWF-015 — Worktrees for parallel changes

- **Change:** PWF-015
- **Date:** 2026-10-24

## What you'll see change
You can code more than one change at the same time, each in its own chat, without the chats touching each other's files. Planning still happens in the main folder on master, and you still start every step by typing the same commands.

- `/code-change` now creates a separate folder for the change (a worktree) with the change's own branch, and works there.
- A worktree's app starts with an empty database and runs on its own port, so it can run next to your real master app. Your real data folder is never opened or changed. A plan can ask for a one-off read-only copy of your real database, for example to test a migration.
- `/commit-change` is typed in the same chat that coded the change. It checks the review, catches up with master, steps back out to the main folder, merges into master, pushes, and then removes the worktree, the branch and the worktree's big build folder.
- `/plan-change` claims its change number and its migration number straight away, so two planning chats can never pick the same ones.
- When two changes were coded in parallel, the second check-in no longer stops just because both changed the changelog. It keeps both entries and tells you. Any other conflict still stops and asks you.
- `/code-change` no longer asks about other branches every time. It lists the other open changes and asks only if their plans touch the same files.
- `/build-changes` no longer refuses to run while other changes are still open. It builds what is merged and lists the open changes as not part of the version.
- The guard that protects master keeps working from every folder, and no longer blocks work inside a worktree.

## Requirements
- **R1.** Given two planning chats open at the same time, when both start `/plan-change`, then they get different change numbers, and any migration numbers they name differ too.
- **R2.** Given an approved plan, when `/code-change` starts, then it works in its own worktree on the branch named in the plan, and master's folder is not edited.
- **R3.** Given two changes being coded at the same time in separate chats, when both write code, then neither chat's files appear in the other's folder.
- **R4.** Given a worktree, when its app is run with `npm run dev`, then it uses an empty database inside the worktree and its own port, and the real data folder is untouched. Given a plan that asks for a copy of the real database, then the worktree gets a read-only copy and the real database is unchanged.
- **R5.** Given master is checked out in the main folder, when Claude tries to edit or write into that folder from any chat, including a chat inside a worktree, then the guard blocks it. Given a chat inside a worktree on a change branch, when it edits that worktree's own files, then the guard allows it.
- **R6.** Given a finished change that passes the review gate, when `/commit-change` runs in the coding chat, then the change is merged into master and pushed, and the worktree and branch are removed. Given a failed review gate, then nothing is merged, pushed or removed.
- **R7.** Given a catch-up merge where `CHANGELOG.md` is the only conflicting file, then both changes' entries are kept and the user is told. Given any other conflict, then the merge is aborted and the user is asked. Given two migration files with the same number, or the schema version bumped by both changes, then the skill stops and asks.
- **R8.** Given other changes still open, when `/build-changes` runs, then it builds what is already merged and lists the open changes as not included. A leftover `build/` branch still stops the build.
- **R9.** Given a change that is checked in, when `/commit-change` removes its worktree, then the worktree's own build folder, installed packages and database go with it, and master's build folder and the real data folder are untouched. If the removal cannot finish, the skill says plainly what is left.
- **R10.** Given master is checked out, when `/commit-change` runs from the main folder, then the guard allows removing a worktree (without force) and the other worktree commands the skills need, and still blocks forced removal and every other write.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog | Empty, nothing to put to you. |
| Should `/code-change` create the worktree itself (Claude Code's own worktree tool), so you just open a new chat and type `/code-change`? | Yes, `/code-change` creates it. |
| Should a worktree start with an empty database, never touching the real data folder? | Empty by default, but a plan can ask for a one-off read-only copy. |
| Should a worktree's dev app get its own port so it runs next to the real master app (which holds 5173)? | Yes, own port per worktree. |
| Should `/plan-change` claim the change number at once with a placeholder plan file, and count changes already on branches, accepting gaps for abandoned plans? | Yes. |
| Should `/commit-change` be typed in the coding chat and step out to the main folder itself to merge, push and clean up? | Yes (it can also be run from a fresh master chat that names the change). |
| Should worktrees share master's Rust build folder to compile faster? | Share it. |
| Because cargo cannot overwrite a running exe on Windows, share for the checks but use a separate build folder only for `npm run dev`? | Yes, share for checks, separate for running the app. |
| Should `/commit-change` keep both entries itself when `CHANGELOG.md` is the only conflict (replacing the PWF-002 stop-and-ask)? | Yes. |
| Should `/plan-change` claim migration numbers and `/commit-change` stop on a migration clash? | Yes, claim at planning and check at catch-up. |
| Should `/code-change` inform about other in-flight changes and ask only on file overlap? | Yes. |
| Should `/build-changes` build what is merged and list open changes, instead of stopping on other branches? | Yes. |
| Review of the written plan | Tests T1, T2 and T6 use the next two real changes (the master lock and comments vs DECISIONS), planned and coded in parallel; T3 waits for the first real change that needs a database copy; T7 waits for the next real build. The skills must not name the database file: CLAUDE.md lists the files to copy, and the copy includes the `-wal` and `-shm` files when present. Otherwise approved. |
| Second review of the written plan | The skills must not name the migrations folder or the schema version setting. CLAUDE.md gets a "Migrations" line giving both; the plan-change number claim and the commit-change clash check read it. A project with no such line skips the migration steps and the skill says so. Otherwise approved. |
| First play-back | Added: the worktree's separate build folder is deleted with it (R9). |
| Second play-back | R9 accepted. Confirm the guard allows worktree cleanup from master and add a hook test for it (R10). The "things I settled myself" items accepted. |

## What could go wrong / what gets lost
- Nothing in your data. The real data folder is never opened by a worktree, and no migration is run or changed by this change.
- Removing a worktree deletes everything in its folder, including any uncommitted work there. `/commit-change` removes it only after the merge and push succeed, and refuses if the worktree has uncommitted files.
- On Windows a running app or an open editor can lock files, so a removal might leave a half-deleted folder. The skill reports this plainly instead of claiming success.
- Changing the guard hook is a protection change. If the new rule were wrong, master could be edited from a worktree chat. The hook tests cover both directions and must pass.
- A worktree's first `npm run dev` does a full Rust compile into its own build folder (several GB, slow once). The folder is removed with the worktree.
- Changes coded in parallel still meet at check-in. Real conflicts, and clashes in migration numbers, stop and ask you.

## Not included
- Discarding an abandoned change (its worktree, branch and placeholder plan). Done by hand for now.
- Renumbering a clashing migration automatically.
- Any change to the app itself, apart from letting the dev port be chosen per worktree.
- Resolving CHANGELOG conflicts that are not simple added entries.

## How you'll check it
**T1 — Two numbers at once. Covers R1.**

This test uses your next two real changes: the master lock and the comments-vs-DECISIONS change. No made-up change is used.

1. Open two chats in the main project folder. Start `/plan-change` for the master lock in one and for comments vs DECISIONS in the other, one right after the other, without finishing either.

Expected: the two chats announce different change numbers, and a placeholder plan file exists for each.

**T2 — Code in a worktree. Covers R2, R3, R4.**

Uses the same two real changes, planned in T1 and coded in parallel.

1. When both plans are approved, open a fresh chat for each and type `/code-change` in both.
2. In each, look at what the chat reports about where it works. In the main folder, run `git status`.
3. Run `npm run dev` in one worktree, with your real master app already running.

Expected: each chat reports its own worktree folder and branch. Master's folder shows no edits from either chat. The worktree app opens with no trips (empty database) on a different port, and your real app keeps working.

**T3 — Database copy on request. Covers R4.**

Waits for the first real change whose plan needs a copy of the database (for example one that tests a migration). It is checked when that change is coded, not before.

1. Code that change with `/code-change`.

Expected: the worktree app shows your real trips, and your real database files are unchanged (same size and modified time).

**T4 — Guard from every folder. Covers R5, R10.**

1. Run `bash .claude/hooks/test-block-main-edits.sh`.
2. In a worktree chat, ask Claude to edit a file in the main folder, and to edit a file in the worktree.

Expected: the test script passes, including the new worktree cases. The main-folder edit is refused, the worktree edit goes through.

**T5 — Check in and clean up. Covers R6, R9.**

Uses the first of the two real changes from T2 to be finished.

1. In that change's coding chat, type `/commit-change`.
2. Look at the main folder, `git worktree list`, `git branch`, and the disk space of the removed worktree folder.

Expected: the change is on master and on GitHub, the worktree folder, the branch and its build folder are gone, and master's build folder and the data folder are untouched.

**T6 — Second check-in with a changelog clash. Covers R7.**

Uses the second of the two real changes from T2.

1. In its coding chat, type `/commit-change`.

Expected: the catch-up merge keeps both changelog entries, tells you it did, re-runs the checks and carries on. Any other conflict would have stopped and asked.

**T7 — Build with something open. Covers R8.**

Waits for your next real build, run while some real change is still open in a worktree.

1. Type `/build-changes` at that time.

Expected: the build proceeds and lists the open change as not included in the version.

## Check-in
- Type: chore
- Branch: chore/PWF-015-worktrees-for-parallel-changes
- Commit message: chore(PWF-015): run each change in its own worktree so changes can be coded in parallel

---

## Technical detail (for Claude)

**How Claude Code supports worktrees (looked up, so we reuse it):** `claude --worktree <name>` and the `EnterWorktree` tool create `.claude/worktrees/<name>/`, default branch `worktree-<name>` from `origin/<default>`. `EnterWorktree` with `path` enters an existing worktree that appears in `git worktree list` (and `ExitWorktree` with `keep` leaves it; it will not remove a worktree entered by path). While a session is isolated in a worktree, Claude Code blocks Edit/Write into the main checkout, shell commands whose working directory is the main checkout, and git redirected into it (`git -C`, `cd`, `GIT_DIR`). It does not stop `cp` or redirects into the main checkout. `.claude/worktrees/` is already ignored because `.claude/*` is ignored in `.gitignore`. Hook scripts keep `${CLAUDE_PROJECT_DIR}` at the main checkout, and the hook input JSON carries `cwd`, which follows the worktree. `.worktreeinclude` copies gitignored files (not needed here; the database must not be copied by default).

**Skill flow, `/code-change`:**
- Create the worktree with `git worktree add .claude/worktrees/<NUMBER> -b <branch from the plan> master`, then `EnterWorktree` with `path`. This gives the exact branch name from the plan, which the default `worktree-<name>` would not.
- Copy the plan file into the worktree and commit it as `docs(<NUMBER>): approved plan`; delete the untracked copy in the main folder's `docs/plans/` (allowed on master) so the later merge does not hit an untracked-file collision.
- Step 2 becomes informational: list other branches and worktrees, compare their plans' file lists with this plan's, and stop only on overlap. Step 3's "uncommitted changes other than the new plan file" becomes "other than plan files", since several waiting plans can sit untracked on master.
- Run `npm install` in the worktree. If the plan asks for a database copy, copy the database files that CLAUDE.md lists (see below) into the worktree's data folder, including the `-wal` and `-shm` files when they exist, so the copy is consistent. The source is only read, never written. The skill never names a database file itself; if CLAUDE.md has no such line, the skill says so and asks the user which files to copy.
- CLAUDE.md gets a new Workflow line, "Database files to copy into a worktree", listing the live database and its `-wal` and `-shm` files (the actual names live only there).
- Continue mode: when the current folder is a worktree, behave as today. When on master and a worktree already exists for the change named by the user, `EnterWorktree` into it.
- The dev port is derived from the change number (for example 5173 + the number's last digits, kept out of 5173). `vite.config.ts` reads an env var for the port (default 5173, `strictPort` stays), and the dev command overrides Tauri's `devUrl` with `--config` JSON. Master's setup is unchanged.
- The worktree's `npm run dev` builds into the worktree's own default `src-tauri/target`. The checks (`cargo test`, `clippy`, `fmt`, and the build checks) run with `CARGO_TARGET_DIR` pointing at master's `src-tauri/target`.

**Skill flow, `/commit-change`:**
- Steps 1–4 run in the worktree: branch check, gate, catch-up merge (`git merge master`), checks, plan-untouched check. Safety check on the default branch matching `origin/<default>` uses `git fetch` from the worktree, which is allowed.
- Catch-up conflicts: if `CHANGELOG.md` is the only conflicted file, keep master's text and re-add this change's entries at the top of `## [Unreleased]`, stage, say so, continue. Otherwise abort and ask as today. Add a check for two migration files with the same number and for the schema version bumped by both sides, and stop on either. The skill finds the migrations folder and where the schema version is set from CLAUDE.md's new "Migrations" line and never names them itself. If CLAUDE.md has no such line, the skill skips the check and says so.
- Then `ExitWorktree` with `keep`, in the main folder: `git merge --no-ff`, push, then `git worktree remove <path>` (no `--force`), then `git branch -d`. If the worktree has uncommitted files, stop before the merge. If removal fails (locked file), report what remains.
- Add an optional change-number argument so `/commit-change` can be run from a fresh master chat for a change whose coding chat is gone.
- Update the "Never write ... CHANGELOG entry" rule: the one exception becomes the changelog catch-up resolution and the existing merge-conflict section.
- `docs/DECISIONS.md`: update the PWF-002 entry to say changelog-only conflicts are now resolved automatically (as of PWF-015).

**Skill flow, `/plan-change`:** at step 2, take the highest number across `CHANGELOG.md`, `docs/plans/` and local branch names (`git branch --list`), write a placeholder `docs/plans/<NUMBER>-claimed.md` immediately, and replace it with the real plan at step 6 (delete the placeholder). The plan names its migration number (next free after the highest in the migrations folder, in-flight plans and branches). The folder comes from CLAUDE.md's "Migrations" line; if CLAUDE.md has no such line, the migration-number steps are skipped and the skill says so.

- CLAUDE.md gets a new Workflow line, "Migrations", giving the migrations folder and where the schema version is set (the actual names live only there). `/plan-change`'s number claim and `/commit-change`'s clash check read it.

**Skill flow, `/build-changes`:** step 1 stops only for a `build/*` branch; other branches and worktrees are listed as not part of the version. Step 6 is unchanged because the build runs on master in the main folder.

**Guard hook (`.claude/hooks/`):**
- `block-main-edits.sh`: work out the branch from the folder being acted on (the edited file's directory for edit tools, the hook input `cwd` for shell tools) instead of always from `${CLAUDE_PROJECT_DIR}`. Plan-file allowance stays tied to the main project's `docs/plans/`.
- Shell commands run from a non-master folder are still checked against the main checkout when it is on master, so `cp`/redirects into it are blocked. Commands whose target is the worktree itself are allowed.
- `shell-command-check.js`: allow `git worktree add`, `list` and `remove` (without `--force`/`-f`), `git branch -d` stays allowed. Forced removal and `prune` stay blocked on master.
- `test-block-main-edits.sh`: add cases for edits and shell writes from a worktree folder (allowed in the worktree, blocked into master's folder), `git worktree add/list/remove` on master (allowed), `git worktree remove --force` (blocked), and worktree cleanup run from master after the merge (R10).

**Files:** `.claude/skills/plan-change/SKILL.md`, `code-change/SKILL.md`, `commit-change/SKILL.md`, `build-changes/SKILL.md`, `.claude/hooks/block-main-edits.sh`, `shell-command-check.js`, `test-block-main-edits.sh`, `vite.config.ts`, `package.json` (dev port script), `CLAUDE.md` (Workflow section: worktree notes, dev port, check build folder), `docs/DECISIONS.md`, and the shared `POLICY.md` only if its workflow text needs the worktree wording (no project-specific facts there). Shared skills stay free of project specifics; the port rule, build folder paths and data folder come from CLAUDE.md.

**Planned tests**
- R1 — Manual: two simultaneous planning chats get different numbers. It needs two live chats, so it needs the user. A helper step that computes the next number from files and branch names is exercised by a scripted check Claude runs itself (a temporary repo with a placeholder plan and a branch).
- R2 — Manual: needs a live `/code-change` run. Claude checks the resulting worktree list, branch name and `git status` of the main folder itself afterwards.
- R3 — Manual: needs two live chats; Claude can check afterwards that neither worktree contains the other's files.
- R4 — Manual: the empty database and own port need the user at the app. Claude checks by command that the worktree's database is a separate file and that the real database file's size and modified time are unchanged.
- R5 — Automated: the hook test script, cases for edits and shell writes from a worktree folder and into master's folder.
- R6 — Manual: needs a live `/commit-change` run. Claude verifies master, the push, and the removed worktree and branch by command afterwards.
- R7 — Automated where possible: a scripted temporary-repo test of the changelog-only resolution and the migration-number clash check; the conflict stop is exercised in the live run (T6).
- R8 — Manual: needs a live `/build-changes` run with an open change; the build stops before packaging if checked, so Claude verifies the listing text by reading the skill and the run output.
- R9 — Manual: Claude checks by command that the worktree folder, its build folder and `node_modules` are gone and master's build folder and `data/` are intact.
- R10 — Automated: the hook test script, cleanup-from-master cases (`worktree remove` allowed, `--force` blocked).
