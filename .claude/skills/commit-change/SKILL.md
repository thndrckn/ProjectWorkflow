---
name: commit-change
description: Last step of the workflow, run by the user after /code-change. Verifies the records, catches the branch up with the default branch, merges the branch into the default branch, pushes, deletes the branch, and reports. Never writes the change records itself, except for review notes on code changed while resolving a merge conflict.
disable-model-invocation: true
---

# Check in a change

This is the last step of the workflow: plan → code → review → **check in**.
The work is on a working branch, and `/code-change` has already built, tested, reviewed, and documented it.
The default branch and the checks come from the Workflow section of CLAUDE.md. Wherever this skill says "the default branch", use the one named there.

The user typing `/commit-change` is their go-ahead. Follow these steps in order, and only stop where a step says STOP.

## 1. Safety checks
- Confirm you are on a working branch, not the default branch. If you are on the default branch, STOP and tell the user there is nothing to check in.
- Confirm the branch has commits that the default branch doesn't (`git log <default>..HEAD --oneline`). If not, STOP.
- Confirm there are no uncommitted changes. If there are, show them and STOP.
- Fetch from GitHub and confirm the default branch matches `origin/<default>`. If it doesn't, STOP and tell the user in plain English.

## 2. Confirm the records are in place
Find the plan for this branch in `docs/plans/` (its change number is in the branch name). Then check:
- A review record exists at `docs/reviews/` with the same file name as the plan.
- `CHANGELOG.md` has an entry for this change number.
- The plan is untouched since it was approved: `git diff <approved-plan commit> -- <plan file>` shows no changes. The approved-plan commit is the one whose message is `docs(<NUMBER>): approved plan` (find it with `git log --grep`); never use "the first commit on the branch", which is ambiguous once the default branch has been merged in.

If anything is missing or the plan changed, STOP and tell the user exactly what's wrong. Do not write or fix the records yourself; that is `/code-change`'s job.

## 3. Read the decisions from the plan
The plan's Check-in section already settled these. Do NOT ask the user again:
- **Type**
- **Commit message**, for example `feat(ABC-085): feedback when park-hours fetch finds nothing`

Tell the user in one line what's about to happen, for example:
> "Checking in ABC-085, per the plan."

## 4. Catch up with the default branch
Only needed if the default branch has commits the working branch doesn't (`git log HEAD..<default> --oneline` is not empty). If it is empty, skip this step.
- Bring the branch up to date by merging the default branch into it (`git merge <default>`). Never rebase: the approved-plan commit must keep its hash.
- If the merge reports any conflict, run `git merge --abort`, STOP, and tell the user in plain English which files conflict. Ask how they want to proceed. Do not guess a resolution.
- After the merge, run every check under "Checks (all must pass)" in CLAUDE.md again on the combined code, plus every check under "Checks (only when relevant)" whose condition applies. Run each as its own command, and never leave the shell in a different directory afterwards. If any check fails, STOP and report in plain English.
- Run `git diff <approved-plan commit> -- <plan file>` again. It must still show no changes.
- If resolving a conflict changed code (only possible after the user told you how to resolve it), review those changes and record them in the change's review record: add a "Merge conflict resolution" section to `docs/reviews/<plan file name>.md` that lists the files, what was decided and why, and the review result, then commit it on the branch as `docs(<NUMBER>): record merge conflict resolution`. A merge with no conflicts changes no records.

## 5. Merge and publish
- Switch to the default branch and merge with `git merge --no-ff <branch>`, using the plan's commit message for the merge commit. If the merge reports a conflict, run `git merge --abort`, STOP, and tell the user in plain English. Do not push or delete anything.
- Push the default branch to GitHub. If the push is rejected, STOP and tell the user in plain English. Do not delete the branch, and do not force-push; say that the local default branch is ahead of GitHub.
- Only after the push succeeds, delete the working branch with `git branch -d <branch>` (never `-D`).

## 6. Report
Tell the user in plain English:
- The change number and title that were checked in.
- That the default branch is on GitHub.
- Anything they still need to do by hand, such as running a new migration: Export All and back up the database file first.

## Never
- Merge without completing steps 1–4.
- Write or change the plan, the review record, or the CHANGELOG entry. The one exception is the merge-conflict section in step 4. If anything else is wrong, STOP and say so.
- Rebase.
- Push any branch other than the default branch, or force-push anything.
- Run anything against files in `data/`.
- Leave the default branch ahead of GitHub.
