# PWF-025 — Rename the default branch from master to trunk

- **Change:** PWF-025
- **Date:** 2026-10-25

## What you'll see change
The default branch becomes `trunk`, locally and on GitHub. This is done in two parts, because the master lock refuses any check-in that edits its own settings in CLAUDE.md, and the guard stops Claude from running a branch rename.

**Part 1 — a normal checked-in change (Claude does it).**
- The guard that stops Claude editing on the default branch protects `trunk`, `master` and `main`.
- The master lock is renamed to the "trunk lock" in its files, scripts, tests, hooks, skills and wording.
- The lock's checker and the skills accept both the old ("Master lock") and the new ("Trunk lock") labels in CLAUDE.md, so nothing breaks between Part 1 and Part 2.
- The living documents and code comments say "the default branch" (or "main folder") wherever that is true under either name.
- Old records (changelog, past plans, review records, the archive) are left exactly as written.
- The shared POLICY.md needs no change: the whole shared conventions folder was searched for "master" and "trunk" (ignoring case) and has no matches. There is no hand edit for it.

**Part 2 — by-hand steps for you.** A checklist (in the technical detail below) you run once after Part 1 is checked in: lock off, rename on GitHub and locally, edit three labels and the branch name in CLAUDE.md, commit, lock on. Nothing happens in the app itself.

## Requirements
- **R1.** Given the guard hooks after Part 1, when Claude tries to edit a file or run a writing shell command while the main folder is on `trunk`, `master` or `main`, then it is blocked exactly as `master` is blocked today.
- **R2.** Given Part 1 is checked in and CLAUDE.md still has the old "Master lock" lines, when `/commit-change`, `/build-changes` or the lock reads the lock settings, then everything works as before.
- **R3.** Given CLAUDE.md has the new "Trunk lock" lines, when the lock reads its settings, then it reads them the same.
- **R4.** Given Part 1, when you look at the lock's files, scripts, tests, hooks and skills, then they use "trunk lock" naming and their tests pass.
- **R5.** Given Part 1, when you read the living documents and comments, then branch references say "the default branch" (or "main folder") rather than naming `master`, except the CLAUDE.md "Default branch" line, which you edit by hand.
- **R6.** Given the old records, when Part 1 is checked in, then the changelog, past plans, review records and the archive are unchanged.
- **R7.** Given the plan's by-hand checklist, when you follow it from a clean state, then afterwards the local branch, GitHub's default branch and the remote's HEAD pointer are all `trunk`, nothing is left on `master`, and the lock's status command says the lock is ON.
- **R8.** Given the checklist's precondition, when a worktree is still open or another chat is working, then the checklist tells you to stop before touching anything.
- **R9.** Given the shared POLICY.md, when the plan is written, then it states that the file has no "master" or "master lock" wording and needs no hand edit.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog 1: "Master guard: an absolute path into another worktree is allowed, the same path written relatively is blocked" | Keep it queued |
| Backlog 2: "dev.mjs tells a worktree user to run npm install when node_modules is missing" | Keep it queued |
| Split into a prepare change plus by-hand steps? | Yes, prepare then hand steps |
| Rename the "master lock"? | Yes, rename it, accepting both labels in the checker and skills during the switch |
| Old records (changelog, plans, reviews, archive) | Leave as history; reword living files only |
| Guard names after the rename | trunk, master and main |
| Open work before renaming | Everything checked in first (PWF-022 and any other), no worktrees, no other chat working |
| Play-back 1 | "Yes, with one addition": check the shared POLICY.md for "master" / "master lock" and say in the plan (done: none found, no hand edit) |
| Play-back 2 (with R9) | Yes |

## What could go wrong / what gets lost
- **Branch rename is outward-facing.** Renaming on GitHub redirects old links but breaks any other clone, CI or bookmark that names `master`. The repository has no GitHub Actions folder, and the only remote is `origin` on GitHub.
- **A half-finished rename leaves the lock refusing things.** If the lock is on while the local branch is renamed, it refuses (it will not let the default branch be deleted). The checklist therefore turns it off first and verifies it is on at the end. While it is off, nothing is checked, so do the steps in one sitting.
- **Open worktrees.** A worktree branched from `master` keeps old settings until it catches up; hence the precondition that none are open.
- **Data.** No database or migration is touched. Nothing in `data/` changes.
- **Lock tests are rewritten.** The lock and guard test scripts are renamed and extended; a mistake there could hide a real hole, so the review checks that every old case still runs.

## Not included
- No rename of old records (changelog, past plans, review records, the archive).
- No change to the shared POLICY.md (it has nothing to change).
- No change to the backlog items put to you (both stay queued).
- No change to what the guard reads from CLAUDE.md: the guard's protected names stay a fixed list (now `trunk`, `master`, `main`); making it read the "Default branch" line is a separate change.
- No change to the app, its data, or the dev-server port rules (comments only).

## How you'll check it
**T1 — Guard blocks edits on trunk. Covers R1.**

1. Claude runs the guard's test script, which includes new cases for a main folder on `trunk`, `master` and `main`.

Expected: every case passes, including edits and shell writes being blocked on `trunk`, and a change-branch worktree still allowed.

**T2 — Lock works with the old and the new labels. Covers R2, R3, R4.**

1. Claude runs the lock's test script (now renamed). It covers a CLAUDE.md with the old "Master lock" labels and one with the new "Trunk lock" labels.
2. Claude runs the lock's status command.

Expected: all cases pass for both label sets, and status says the lock is ON.

**T3 — Wording and history. Covers R4, R5, R6, R9.**

1. Claude searches the living files for the word `master` and lists what is left, and shows that the old records have no changes in the change's diff.
2. You read the plan's statement about POLICY.md.

Expected: the only remaining mentions of `master` in living files are the intentional ones (the guard's protected list, the "accepts the old label" code, the "Default branch" line you will edit by hand); old records unchanged; the plan says POLICY.md needs no edit.

**T4 — The standard checks. Covers R4.**

1. Claude runs all checks from CLAUDE.md, plus `npm run test:conventions` (the convention scripts change).

Expected: all pass.

**T5 — The by-hand rename. Covers R7, R8.**

1. After Part 1 is checked in, confirm the precondition in the checklist (nothing open). If anything is open, stop.
2. Follow the checklist in the technical detail, in order, in your own terminal.
3. Afterwards, run the verification commands at the end of the checklist.

Expected: local branch, GitHub default branch and remote HEAD are all `trunk`; no `master` branch is left locally or on the remote; the lock status says ON; a following `/plan-change` and `/code-change` work as usual.

## Check-in
- Type: chore
- Branch: chore/PWF-025-rename-default-branch-to-trunk
- Commit message: chore(PWF-025): prepare the workflow for a trunk default branch and rename the master lock to the trunk lock

---

## Technical detail (for Claude)

**Findings from looking.** The default branch is read from CLAUDE.md's "Default branch" line by `.githooks/master-lock-check.mjs` (`defaultBranchOf`); the checker is generic. The settings it compares between old and new CLAUDE.md are: default branch, change prefix, version files, "Master lock starts at", and "Review format 2 required from"; a check-in changing any is refused (`lineValue(claudeMd, 'Master lock starts at')` at about line 72). Prose elsewhere on those lines can change. Hardcoded `master` appears in: `.claude/hooks/block-main-edits.sh` (the `guarded()` function and the line 127 check), `.claude/hooks/shell-command-check.js` (`DEFAULT_BRANCHES`, line 333, plus comments and the `'master'`/`'worktree'` mode word), their tests, `.githooks/test-master-lock.sh`, comments in `scripts/dev.mjs` and `vite.config.ts`, the two skills (the `Master lock` line lookup and the catch-up merge example), CLAUDE.md prose, `docs/DECISIONS.md`, `docs/BACKLOG.md`, `.gitattributes`. `sqlite_master` in `sqlite_provider.rs` is SQLite's own table and must not be touched. `.claude/settings.local.json` and the shared policy folder have no hits.

**Part 1 changes (all inside the change branch, worktree):**
1. Guard: add `trunk` and `refs/heads/trunk` to `guarded()`, the line 127 check and `DEFAULT_BRANCHES`; keep `master` and `main`. The internal mode word `master` in `shell-command-check.js` (argv[3]) is renamed to a neutral word (for example `main-folder`) in both files, together, with the test updated.
2. Rename with `git mv`: `.githooks/master-lock-check.mjs` → `trunk-lock-check.mjs`, `install-master-lock.sh` → `install-trunk-lock.sh`, `test-master-lock.sh` → `test-trunk-lock.sh`. Update `reference-transaction` (it calls the checker by name), every internal reference, messages ("The trunk lock refused…", "Trunk lock: ON/OFF"), and the CLAUDE.md paths and commands that name these files. Keep `core.hooksPath` as `.githooks`.
3. Checker: read each lock label from either name: "Trunk lock starts at" or "Master lock starts at" (new name first). The checker's own refusal text points to CLAUDE.md "Trunk lock" (accept either heading).
4. Skills (`commit-change`, `build-changes`): look for a "Trunk lock" line, or the older "Master lock" line; keep wording project-neutral. Example text in the catch-up merge keeps `<default>`.
5. Guard comments, `scripts/dev.mjs`, `vite.config.ts`, `.gitattributes`: say "main folder" / "default branch" / "trunk lock". Rename `MASTER_PORT` to `MAIN_PORT`.
6. CLAUDE.md: reword prose to "the default branch" and update file paths/commands; leave these three things exactly as they are, because they are the by-hand edits: the value in the "Default branch" line, the label "Master lock:" of the lock bullet, and the label "Master lock starts at:" (and the section heading). Do not touch the "Review format 2 required from" line. `docs/DECISIONS.md` and `docs/BACKLOG.md` reworded to say "trunk lock" / "default branch" (no BACKLOG title is needed by number; keep both entries). Add a DECISIONS entry: the lock labels are read under both names, so a hand edit of the labels is safe in either order.
7. Do not touch `docs/reviews`, `docs/plans` (other than this plan), `docs/archive`, `CHANGELOG.md` entries other than adding this change's entry under Unreleased.

**Tests to extend/add** (in the renamed lock test script and the guard test script): see Planned tests.

### By-hand rename checklist (for the user, run after Part 1 is checked in)

*Step 0 — stop conditions (R8).* Run `git worktree list`: only the main folder may appear. PWF-022 (and any other change) must be checked in and its worktree removed. No other Claude chat is coding or checking in. If any of this is false, stop.

*Step 1 — back up.* `git status` must be clean. Note the current tip: `git rev-parse master`.

*Step 2 — lock off.* In the project folder: `git config --unset core.hooksPath`.

*Step 3 — rename on GitHub.* Repository Settings → General → Default branch → rename `master` to `trunk` (GitHub's rename also moves the default and redirects old links). (No `gh` CLI is installed here.)

*Step 4 — rename locally.*
```
git branch -m master trunk
git fetch origin --prune
git branch -u origin/trunk trunk
git remote set-head origin -a
```

*Step 5 — edit CLAUDE.md on `trunk`* (hand edit; exact old → new text):
- `- **Default branch:** \`master\`` → `- **Default branch:** \`trunk\``
- `- **Master lock:**` → `- **Trunk lock:**`
- `- **Master lock starts at:**` → `- **Trunk lock starts at:**`
- `### Master lock — turning it off by hand (for the user only)` → `### Trunk lock — turning it off by hand (for the user only)`
- the quoted pointer text `"Master lock — turning it off by hand"` (in the lock bullet) → `"Trunk lock — turning it off by hand"`

Commit with a change number, for example: `git commit -am "chore(PWF-025): rename the default branch to trunk in CLAUDE.md"`, then `git push`.

*Step 6 — lock on.* `bash .githooks/install-trunk-lock.sh` (PowerShell: `& "C:\Program Files\Git\bin\bash.exe" .githooks/install-trunk-lock.sh`), then `node .githooks/trunk-lock-check.mjs status` must say `Trunk lock: ON`.

*Step 7 — verify.* `git branch -a` shows only `trunk` and `remotes/origin/trunk` (plus `origin/HEAD -> origin/trunk`); `git ls-remote --heads origin` lists only `trunk`. Any other clone of this repo: `git branch -m master trunk`, `git fetch`, `git branch -u origin/trunk trunk`.

**Planned tests**
- R1 — Automated: extend `.claude/hooks/test-block-main-edits.sh` with cases for the main folder on `trunk` (edit blocked, shell write blocked, plan files allowed, change-branch worktree still free), and keep the `master`/`main` cases.
- R2 — Automated: in `.githooks/test-trunk-lock.sh`, a CLAUDE.md using the old "Master lock starts at" label reads the same start as before; gate and hook modes still pass; refusal of lock-setting changes still works.
- R3 — Automated: same script with the "Trunk lock starts at" label; plus a case where a check-in that only relabels (old→new) with the same values is not treated as a changed setting.
- R4 — Automated: both renamed test scripts run green; `npm run check:conventions`, `npm run lint` and `npm run test:conventions` pass; Claude runs the lock status command.
- R5 — Manual (Claude can run it itself): search living files for `master` and review each remaining hit against the intended list. Not automated because the intended list is a judgement.
- R6 — Manual (Claude can run it itself): `git diff --stat` against the default branch shows no changes under `docs/reviews`, `docs/archive`, other plans, or old CHANGELOG entries.
- R7 — Manual (needs the user at a terminal and GitHub): the by-hand checklist; it cannot be automated because the lock and the guard forbid Claude running it and GitHub's setting is a web step.
- R8 — Manual (user reads): the checklist's step 0 is the first item and says to stop.
- R9 — Manual (user reads): the plan states POLICY.md was searched and needs no edit.
