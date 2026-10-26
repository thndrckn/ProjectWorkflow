---
name: merge-change
description: Last step, run by Jason after /code-change. Checks the records and the lock, catches the branch up with the default branch, merges it with --no-ff, pushes, removes the worktree and branch, and reports. Only whole change numbers reach the default branch; a large change needs every ticket done first. Never writes the change's records.
disable-model-invocation: true
---

# Merge a change

Last step: design → plan → code → **merge**. The default branch and checks come from CLAUDE.md. Typing `/merge-change` is Jason's go-ahead. Stop only where a step says STOP.

## 1. Safety checks
Steps 1 to 4 run in the change's worktree (a large change: the integration branch's); step 5 steps back out.
- Be on a working branch with commits the default branch lacks. On the default branch, use the number Jason gave, or the only worktree in flight, else ask. Enter it: load `EnterWorktree,ExitWorktree` with `ToolSearch`, call `EnterWorktree` with the path, check `git branch --show-current`. STOP on any failure. Only a whole change number is merged; a ticket number is refused.
- No uncommitted changes. Fetch; the default branch must match `origin/<default>`.
- Run CLAUDE.md's trunk-lock status command. If the lock is off, STOP and tell Jason to switch it on as CLAUDE.md says (his step).

## 2. Records and gate
- The plan exists, a review record with the same file name exists, and `CHANGELOG.md` has an entry for the number. The plan is unchanged since `docs(<NUMBER>): approved plan` (`git diff <that commit> -- <plan>` is empty; find it with `git log --grep`).
- Run the checker's `gate <NUMBER>` (the same code the lock applies). Its failures are the failures. For a **large change** the gate also needs every ticket's record to have passed and the change's own record (the spec's list of carried findings) to have no open finding: each one fixed, explained, accepted by Jason, or moved to `docs/BACKLOG.md`.
- On any failure STOP and list each in one plain line. Tell Jason that `/code-change` on this branch continues the change. Write nothing.

## 3. Announce
One line: "Checking in <NUMBER>, per the plan." If the change is in a worktree, say it is deleted with everything inside, including anything entered in the app there. STOP and ask first if Jason said he wants something kept.

## 4. Catch up
Skip if the default branch has no commits the branch lacks (`git log HEAD..<default> --oneline`). Otherwise merge it in (never rebase): `git merge <default> -m "chore(<NUMBER>): catch up with <default>"`. Every merge or correction commit carries the number, or the lock refuses it.
- **Conflicts** (`git diff --name-only --diff-filter=U`):
  - Only `CHANGELOG.md`, and this change adds nothing there but its own entry: take the default branch's file (`git checkout --theirs`), add this change's entry (from `git show HEAD:CHANGELOG.md`) at the top of Unreleased, stage, finish with the same message, and tell Jason in one line.
  - Anything else: read the hunks and work out your resolution, then `git merge --abort`, STOP, and show Jason each file with the resolution you propose and why. Apply nothing until he answers; then redo the merge as he says. If it conflicts differently, abort again with a fresh proposal.
- Run every check in CLAUDE.md again on the combined code; STOP if any fails. The plan must still be unchanged.
- If a conflict resolution changed code, review it and add a "Merge conflict resolution" section to the record (files, decision, why, result), committed as `docs(<NUMBER>): record merge conflict resolution`.

## 5. Merge and publish
- Leave the worktree with `ExitWorktree` (`keep`). If the chat can't, STOP and tell Jason to type `/merge-change` from a chat in the main folder.
- In the main folder, check the lock status again (STOP if off), then on the default branch: `git merge --no-ff <branch>` with the plan's commit message. On a conflict, `git merge --abort` and STOP.
- Push the default branch. If rejected, STOP; do not force-push, and say the local branch is ahead of GitHub.
- Only after the push succeeds: `git worktree remove <path>` (never forced), then `git branch -d <branch>` (never `-D`; for a large change also its ticket branches). If a file is locked, say what is left for Jason to close or delete, and delete the branch only if the worktree is gone.

## 6. Report
In plain English: the number and title checked in; that the default branch is on GitHub and the worktree and branch are gone (or what is left); anything Jason still does by hand (a migration, after CLAUDE.md's backup step). Last, only if the plan has "Original request (set aside)": a one-line lead-in saying it is still waiting, then a fenced block holding `/design-change ` plus the request exactly as recorded, ready to paste. Nothing after it.

## Never
- Merge without steps 1 to 4, or a change whose gate fails, or a ticket number.
- Write or change the plan, the review record or the changelog entry (except the conflict section and the changelog merge above).
- Rebase; commit without the change number; push any branch but the default; force-push; force-remove a worktree.
- Turn the lock off or set `core.hooksPath`. If the lock refuses, STOP and tell Jason what it said; the cause goes back through `/code-change`.
- Run anything against the data folder, or leave the default branch ahead of GitHub.
