# PWF-017 — The master lock

- **Change:** PWF-017
- **Date:** 2026-10-24

## What you'll see change
Git itself will now refuse to move the default branch (master) to a commit that isn't a proper check-in, no matter how the commit gets there: a merge, a fast-forward, a plain commit, a cherry-pick, a pull, or a command run with the "skip hooks" flag. A commit is proper only when every change it carries from PWF-016 on has a review record that passes the same gate `/commit-change` applies today. The refusal is a plain-English message naming the change and each rule it failed.

- A release commit from `/build-changes` still goes through, as long as it changes only the version files and the changelog.
- Any other commit with no change number is refused.
- Old changes (below the starting number) and old-format review records are not checked.
- Work branches, remote-tracking branches (what a fetch updates) and tags are never affected.
- `/commit-change` now runs one shared checker for its review-gate step, the same one the lock uses, so the two can't disagree.
- `/commit-change`'s catch-up merge (and any other merge or correction commit the skills make on a branch) now carries the change number in its message, for example "chore(PWF-017): catch up with master", so the lock accepts it. A catch-up merge without a number would be refused.
- `/commit-change` and `/build-changes` stop with a plain message if the lock isn't switched on in this copy of the project.
- The lock needs a one-time setup command per copy of the project. CLAUDE.md gets a new section that names the command, the starting number, and a step for you alone to turn the lock off by hand if the hook itself ever breaks. There is no override and no bypass setting.

## Requirements
- **R1.** Given the lock is on, when a commit or merge reaches master by any route (merge, fast-forward, plain commit, cherry-pick, pull, or with the skip-hooks flag) and every change number it carries has a passing review record, then it is allowed.
- **R2.** Given a change number at or above the starting number with no review record, when it would reach master, then git refuses and names the change.
- **R3.** Given a new-format review record that breaks any gate rule, when its change would reach master, then git refuses and lists each failed rule in plain English.
- **R4.** Given a commit with no change number that is not a release commit, when it would reach master, then git refuses.
- **R5.** Given a release commit whose message is the release message and that changes only the version files and the changelog, when it reaches master, then it is allowed; given one that touches anything else, then it is refused.
- **R6.** Given a change number below the starting number, or an old-format review record, when it reaches master, then it is not checked.
- **R7.** Given a work branch, when commits are made on it or master is merged into it, then the lock does nothing.
- **R8.** Given the lock is not switched on in this copy of the project, when `/commit-change` or `/build-changes` starts, then it stops and says how to switch it on.
- **R9.** Given the lock is on and the records pass, when `/commit-change` or `/build-changes` runs, then neither is blocked.
- **R10.** Given the hook cannot read what it needs, or crashes, when anything would reach master, then it refuses.
- **R11.** Given the project's CLAUDE.md, when the lock runs, then the change prefix, the default branch, the version files and the starting number all come from CLAUDE.md lines, and nothing project-specific is written into the hook or the checker.
- **R12.** Given any update to something other than the local default branch (a remote-tracking branch from a fetch, a tag, or any other branch), when it happens, then the lock never blocks it.
- **R13.** Given CLAUDE.md, when you read its master lock section, then it says how to turn the lock off by hand and back on, marks those steps as for you only, and tells Claude never to run them.
- **R14.** Given a branch that has caught up with master through a merge commit whose message carries the change number, when the branch is merged into master, then the lock allows it; given the same catch-up merge with a message that has no change number, then the lock refuses it.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog entries | None, nothing asked |
| Which kind of git hook? | The hook that fires on every update of a branch (covers fast-forward and the skip-hooks flag) |
| How to treat the release commit from `/build-changes`? | Allowed if the message matches and only the version files and changelog change |
| Where do the gate rules live? | One shared checker script, used by both the hook and `/commit-change` |
| Which changes are checked? | PWF-016 onward; older numbers are waved through |
| Emergency override? | None |
| How is the lock installed? | Hook in a tracked folder, one-time setup per copy, `/commit-change` and `/build-changes` verify it is on |
| Plan review: catch-up merge message | Must carry the change number, for example `chore(<NUMBER>): catch up with master`, for that merge and any other merge or correction commit the skills make on a branch (R14, with a lock test case) |
| Plan review: T2 step 3 | Uses only the checker's status mode, no scratch `/commit-change` |
| Play-back: is it right? | Yes, with three additions: the prefix and starting number come from CLAUDE.md, not the hook (R11); only the local default branch is guarded, never remote-tracking branches or tags, with tests for both (R12); CLAUDE.md documents the by-hand turn-off for you only (R13) |

## What could go wrong / what gets lost
- Nothing in your data or the database is touched, and there is no migration.
- If the lock wrongly refuses a good check-in, you can turn it off by hand (R13). That is deliberate, and Claude's own guard blocks Claude from doing it.
- The lock is only as good as its setup. A copy of the project where the setup was never run has no lock; `/commit-change` and `/build-changes` refuse to run there.
- This change's own check-in is not guarded by the lock: git only finds the hook once the change is merged. The first real guarded check-in is the next change.
- A hook cannot stop a push to GitHub from another machine.

## Not included
- GitHub-side branch protection.
- Any emergency override or bypass setting.
- Changes to the shared policy file (it sits outside this project's repository; a one-line mention there can be its own change).
- Checking that a record's claims are true (for example that a fix really fixes the bug). The lock enforces the same written gate rules `/commit-change` uses, nothing more.

## How you'll check it
**T1 — The lock's own test suite passes. Covers R1–R7, R10, R11, R12, R14.**

1. Ask Claude to run the lock's test script, or run it yourself from the command named in CLAUDE.md.

Expected: every case passes, including refusals, release commits, old numbers, work branches, remote-tracking branches and tags.

**T2 — Setup works and the status check notices when it is off. Covers R8.**

1. In the change's folder, run the one-time setup command named in CLAUDE.md.
2. Check the lock is reported as on.
3. Turn it off by hand using CLAUDE.md's steps, then run the checker's status mode again (or ask Claude to). Turn it back on with the setup command.

Expected: with the lock off, status says it is off and how to switch it on; with it on, status says it is on. The skills' own stop-and-say-how wording is read in T4 and in the skill text, not run here.

**T3 — A real commit straight onto master is refused. Covers R2, R4.**

1. With the lock on, in the main folder on master, make a harmless local commit on a copy of the project (a throwaway clone, not your real folder), using plain `git commit --allow-empty`.

Expected: git refuses with a plain message. Master is unchanged.

**T4 — The next real change checks in normally. Covers R1, R9.**

1. With the lock on, finish the next real change (after this one is merged and the setup has been run) with `/commit-change`.
2. Later run `/build-changes` for the waiting entries.

Expected: neither is blocked, and both report the lock as on. (This is the live run; per the plan rules it uses the next real change, not a made-up one.)

**T5 — CLAUDE.md documents the turn-off. Covers R13.**

1. Open the new master lock section in CLAUDE.md.

Expected: it names the setup command and the starting number, has a by-hand turn-off and turn-on step marked for you only, and tells Claude never to run it.

## Check-in
- Type: chore
- Branch: chore/PWF-017-master-lock
- Commit message: chore(PWF-017): add the master lock, a git hook that refuses commits to master without a passing review record

---

## Technical detail (for Claude)

**Mechanism.** A `reference-transaction` hook. Git runs it with the state as argument 1 (`prepared`, `committed`, `aborted`) and one `<old> <new> <ref>` line per ref on stdin. Act only in `prepared` (the only state that can abort). Act only on `refs/heads/<default branch>`; every other ref (other heads, `refs/remotes/*`, `refs/tags/*`, `refs/stash`, and so on) exits 0 at once (R7, R12). A deletion (new is all zeros) is not a commit arriving and is passed through. Any unexpected error, missing file or unreadable input exits non-zero (fail closed, R10). It is unaffected by `--no-verify`.

**Files (all new, under a tracked `.githooks/` folder; project-neutral per the plan rules)**
- `.githooks/reference-transaction` — thin shell wrapper that runs the checker with node (already required by the existing guard hook) and passes stdin through.
- `.githooks/master-lock-check.js` — the single checker, with these modes: `hook` (the above), `gate <change number>` (review-gate result for one record, used by `/commit-change`), `status` (is the lock switched on: `core.hooksPath` resolves to the tracked folder, the wrapper exists and is executable, and the config line parses; used by both skills).
- `.githooks/install-master-lock.sh` — the one-time setup: sets `core.hooksPath` for the repository (shared by all worktrees) and makes the wrapper executable, then runs `status`. Idempotent. A matching off step is documented, not scripted.
- `.githooks/test-master-lock.sh` — automated tests, in the style of `.claude/hooks/test-block-main-edits.sh`: builds throwaway repos in a temp folder and drives real git commands.
- Edited: `CLAUDE.md` (new "Master lock" Workflow line plus a short section), `.claude/skills/commit-change/SKILL.md` (step 1 verifies `status`; step 2's review-gate rules are applied by running `gate` and showing its failures; the prose rules stay as the specification; step 4's catch-up merge becomes `git merge <default> -m "chore(<NUMBER>): catch up with <default>"`, and the merge commit finished by hand after a changelog-only conflict uses the same message; the existing conflict-resolution record commit is already numbered), a sweep of every skill for any other `git merge` or `git commit` that could put an unnumbered commit on a branch (a grep found only the catch-up merge; every `/code-change` commit already carries the number; `/build-changes` commits are release commits), `.claude/skills/build-changes/SKILL.md` (step 1 verifies `status`), `CHANGELOG.md` (entry at the top of Unreleased, written by `/code-change`).

**Config from CLAUDE.md (R11).** The checker reads these Workflow lines: `Default branch`, `Change prefix`, `Version files` (every backticked file name on that line, and `CHANGELOG.md`, form the release allow-list), and a new line `Master lock starts at:` holding the first checked change number (PWF-016). If any is missing or unparseable, fail closed with a plain message (R10, R11). Read CLAUDE.md from the commit master currently points to (the old tip), not from the incoming one, so a change can't weaken the lock in the same commit that introduces it. Exception: when the old tip has no master lock line (the bootstrap), pass; this is why this change's own merge is unguarded, and it is stated in the plan.

**Decision logic for `hook` mode.** For the incoming range `old..new` (`git rev-list old..new`; when old is all zeros, only `new`'s own commits not reachable from any other ref):
1. Collect each commit's change number from its Conventional Commit scope (`type(PREFIX-NNN): …`). A merge commit's own message counts too.
2. A release commit is a commit whose subject matches `chore(release): vX.Y.Z` and whose diff against its first parent touches only the allow-listed files. Allowed (R5). If it matches the message but touches anything else, refused with the offending file names.
3. A commit with no change number and not a release commit is refused (R4).
4. For each distinct number below the starting number: waved through (R6).
5. For each number at or above it: find `docs/reviews/<number>-*.md` in the incoming tip's tree. Missing: refused, naming the change (R2). Present: run the gate (see below).
6. All problems are collected and printed in plain English, one line each, then exit non-zero.

**The gate (R3, R6).** Port the six rules from `/commit-change`'s "Review gate" exactly, working on the record text from the incoming tree. Old format (no `- **Review format:** accountability` header line and no line starting `**Caused by this change:**`) is exempt. New format: (1) every finding has severity, caused label and disposition; (2) no caused-yes finding is logged or left open, unless it carries "Settled by the user:"; (3) any finding or fixed Fail requires a Re-review section with at least one round; (4) every explanation, logged item and fix in a round is accepted, or resolved in a later round, or settled by the user; (5) last round is clean or settled by the user, at most three rounds plus rounds that carry "Settled by the user:"; (6) no trace row starts with Fail. Read each finding as corrected by its latest `**Correction (round N):**` line. Mine the exact line conventions from existing new-format records in `docs/reviews/` (PWF-008 onward) and the skills' templates; the checker's tests use copies of those as fixtures.

**CLAUDE.md section.** Under Workflow, add `Master lock:` (what it does, the setup command, the starting number line, `status` check) and a short subsection "Turning the master lock off by hand (for the user only)". It gives the off step (`git config --unset core.hooksPath`) and the on step (re-run the setup command), says they are for the user typing in their own terminal, and says Claude never runs them, never edits the hook files to loosen the lock outside a planned change, and never sets `core.hooksPath`. Confirm the existing guard hook blocks `git config` writes (PWF-015 commits suggest it does); if a `core.hooksPath` change isn't covered, extend `shell-command-check.js` and its test script, and note it in the plan's deviations only if the plan didn't mention it (it does, here).

**Feature-cycle steps.** None of the Rust, `api.ts` or `types.ts` steps apply: no app code, no schema, no migration, no data folder access. Checks: the required project checks still run, plus the new test script; `npm run test:pdf` is not relevant.

**Planned tests**
- R1 — Automated: in a throwaway repo with the hook on, a `--no-ff` merge, a fast-forward merge, a plain commit, a cherry-pick and a `--no-verify` commit of changes with passing fixture records all succeed.
- R2 — Automated: a change at or above the starting number with no record is refused and the message names it; master does not move.
- R3 — Automated: fixtures that each break one gate rule (missing label, caused-yes logged, no re-review, unaccepted fix, unclean last round, a fourth round without settled-by-user, a Fail row) are each refused with that rule in the message; a settled-by-user fixture passes.
- R4 — Automated: an unnumbered commit and a commit with a malformed scope are refused.
- R5 — Automated: a release commit touching only the version files and changelog passes; the same message plus a source file, and a release-looking commit with a wrong message format, are refused.
- R6 — Automated: a number below the starting number with no record passes; an old-format record at or above it passes.
- R7 — Automated: commits on a work branch, and merging master into a work branch, succeed with a failing record present.
- R8 — Automated for `status` (hooksPath unset, wrong path, wrapper missing or not executable each report off); Manual for the skills' wording: it needs a `/commit-change` run, so Claude cannot run it itself; it is checked on the next real change's run (T4) and by reading the skill text.
- R9 — Manual: needs a real `/commit-change` and `/build-changes` run. Per the plan rules it uses the next real change (T4), not a made-up one. Claude can additionally run the checker's `gate` mode on every existing new-format record in `docs/reviews/` and confirm it agrees with each record's earlier `/commit-change` outcome.
- R10 — Automated: a missing CLAUDE.md, a CLAUDE.md missing the master lock line, an unreadable record and a bad stdin line each exit non-zero.
- R11 — Automated: the test script runs the hook against a throwaway repo whose CLAUDE.md uses a different prefix (for example `ABC`), a different default branch name and a different starting number, and sees the lock follow them; plus a grep check that the hook folder contains none of this project's prefix, branch or file names except in the test fixtures.
- R12 — Automated: with the hook on, `git fetch` updating `refs/remotes/origin/<default>` (from a bare local remote carrying a commit with no record), creating and moving a tag, and updating other branches all succeed with the lock refusing nothing; and a direct `git update-ref` of `refs/remotes/...` and `refs/tags/...` to an unrecorded commit passes while the same on `refs/heads/<default>` is refused.
- R14 — Automated: in a throwaway repo, a branch is made, master gets another commit, and the branch merges master in with the message `chore(<number>): catch up with master`; merging that branch into master passes. Repeat with the default message ("Merge branch 'master' into …"): the merge into master is refused under the no-number rule, and the message names the unnumbered commit. Manual for the skill wording: reading `/commit-change` step 4 (T4 also exercises it if master has moved).
- R13 — Manual: it is a reading check on CLAUDE.md's wording (T5); Claude can read the file and confirm the section names the commands and the for-you-only wording.
