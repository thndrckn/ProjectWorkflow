---
name: commit-change
description: Last step of the workflow, run by the user after /code-change. Verifies the records, merges the branch into master, pushes, deletes the branch, and reports. Never writes the change records itself.
disable-model-invocation: true
---

# Check in a change

This is the last step of the workflow: plan → code → review → **check in**.
The work is on a working branch, and `/code-change` has already built, tested, reviewed, and documented it.
This repo's default branch is `master`.

The user typing `/commit-change` is their go-ahead. Follow these steps in order, and only stop where a step says STOP.

## 1. Safety checks
- Confirm you are on a working branch, not `master`. If you are on `master`, STOP and tell the user there is nothing to check in.
- Confirm the branch has commits that `master` doesn't (`git log master..HEAD --oneline`). If not, STOP.
- Confirm there are no uncommitted changes. If there are, show them and STOP.
- Fetch from GitHub and confirm `master` matches `origin/master`. If it doesn't, STOP and tell the user in plain English.

## 2. Confirm the records are in place
Find the plan for this branch in `docs/plans/` (its change number is in the branch name). Then check:
- A review record exists at `docs/reviews/` with the same file name as the plan.
- `CHANGELOG.md` has an entry for this change number.
- The plan is untouched since it was approved: `git diff <first commit on this branch> -- <plan file>` shows no changes.

If anything is missing or the plan changed, STOP and tell the user exactly what's wrong. Do not write or fix the records yourself; that is `/code-change`'s job.

## 3. Read the decisions from the plan
The plan's Check-in section already settled these. Do NOT ask the user again:
- **Type**
- **Commit message**, for example `feat(DTP-085): feedback when park-hours fetch finds nothing`

Tell the user in one line what's about to happen, for example:
> "Checking in DTP-085, per the plan."

## 4. Merge and publish
- Switch to `master` and merge with `git merge --no-ff <branch>`, using the plan's commit message for the merge commit. If the merge reports a conflict, run `git merge --abort`, STOP, and tell the user in plain English. Do not push or delete anything.
- Push `master` to GitHub. If the push is rejected, STOP and tell the user in plain English. Do not delete the branch, and do not force-push; say that local `master` is ahead of GitHub.
- Only after the push succeeds, delete the working branch with `git branch -d <branch>` (never `-D`).

## 5. Report
Tell the user in plain English:
- The change number and title that were checked in.
- That `master` is on GitHub.
- Anything they still need to do by hand, such as running a new migration: Export All and back up the database file first.

## Never
- Merge without completing steps 1–3.
- Write or change the plan, the review record, or the CHANGELOG entry. If they're wrong, STOP and say so.
- Push any branch other than `master`, or force-push anything.
- Run anything against files in `data/`.
- Leave `master` ahead of GitHub.
