---
name: commit-change
description: Last step of the workflow, run by the user after /code-change. Verifies the records (checking a new-format review record against the review-accountability gate and stopping with a plain-English list of failures), catches the branch up with the default branch, merges the branch into the default branch, pushes, removes the change's worktree and deletes the branch, and reports. Never writes the change records itself, except for review notes on code changed while resolving a merge conflict.
disable-model-invocation: true
---

# Check in a change

This is the last step of the workflow: plan → code → review → **check in**.
The work is on a working branch, and `/code-change` has already built, tested, reviewed, and documented it.
The default branch and the checks come from the Workflow section of CLAUDE.md. Wherever this skill says "the default branch", use the one named there.

The user typing `/commit-change` is their go-ahead. Follow these steps in order, and only stop where a step says STOP.

## 1. Safety checks
A change is normally coded in its own worktree, and `/commit-change` is typed in the same chat. Steps 1 to 4 run inside the worktree; step 5 steps back out to the default branch's folder.
- Confirm you are on a working branch, not the default branch. If you are on the default branch, look for the change to check in: if the user gave a change number as an argument (for example `/commit-change ABC-085`) or otherwise named one, or exactly one worktree is in flight (`git worktree list`), enter that worktree with `EnterWorktree` and its `path` and carry on; if there are several and none was named, ask which, in the question box. If there is none, STOP and tell the user there is nothing to check in.
- Confirm the branch has commits that the default branch doesn't (`git log <default>..HEAD --oneline`). If not, STOP.
- Confirm there are no uncommitted changes. If there are, show them and STOP.
- Fetch from GitHub and confirm the default branch matches `origin/<default>`. If it doesn't, STOP and tell the user in plain English.
- If CLAUDE.md has a "Master lock" line, run the status command it names, in the folder you are in. If it says the lock is off, STOP and tell the user in plain English to switch it on as CLAUDE.md says (a step for them to take). If CLAUDE.md has no such line, skip this.

## 2. Confirm the records are in place
Find the plan for this branch in `docs/plans/` (its change number is in the branch name). Then check:
- A review record exists at `docs/reviews/` with the same file name as the plan.
- `CHANGELOG.md` has an entry for this change number.
- The plan is untouched since it was approved: `git diff <approved-plan commit> -- <plan file>` shows no changes. The approved-plan commit is the one whose message is `docs(<NUMBER>): approved plan` (find it with `git log --grep`); never use "the first commit on the branch", which is ambiguous once the default branch has been merged in.

If anything is missing or the plan changed, STOP and tell the user exactly what's wrong. Do not write or fix the records yourself; that is `/code-change`'s job.

### Review gate
If CLAUDE.md has a "Master lock" line, first run the checker's gate command it names for this change number (`gate <NUMBER>`; it is the same code the lock applies when the branch reaches the default branch, so the two cannot disagree). Its failures are failures of the rules below. Still read the record yourself against the rules, which stay the specification; if your reading and the checker disagree, STOP, say so in plain English and let the user decide, because the lock would refuse the same merge.

Read the review record. The gate applies only to a record in the new format: one with a line that starts `- **Review format:** accountability` in its header, or with any line that starts (after any leading spaces) `**Caused by this change:**` (so deleting the marker doesn't dodge the gate). Prose that merely mentions the phrase mid-line doesn't count. A record with neither is in the old format and is exempt; say so in one line and go on to step 3.

For a new-format record, check every rule below. Read each finding as corrected by its latest `**Correction (round N):**` line, if it has one. Collect all failures before stopping, not just the first.
1. **Labels:** every finding has a severity, a "Caused by this change: yes/no" line, and a disposition.
2. **Caused findings:** no finding labelled "yes" has a disposition that starts with "logged" (in docs/BACKLOG.md, or in an older record, the former known-issues file), and none is left open or "accepted as is". Each is "fixed" or "explained". The one exception is an item that carries "Settled by the user: <answer>": the user's own recorded answer overrides this rule for that item.
3. **Re-review happened:** if the record has any finding at all (whatever its disposition: fixed, explained or logged), or any requirement Fail was fixed (its trace result reads "Pass (fixed after Fail)" or "Pass (checked by Claude, fixed after Fail)"), the record has a Re-review section with at least one round. Only a record with no findings and no fixed Fail needs no Re-review section, and then rules 4 and 5 are met.
4. **Everything was checked:** in every re-review round, each explanation, logged item (its "caused: no" label) and fix it covered is marked accepted by the re-reviewer. A rejection is a failure unless the record shows it was resolved in a later round (fixed, or logged with the label confirmed) or carries "Settled by the user: <answer>".
5. **The loop finished:** if there are re-review rounds, the last round is marked clean, or every item still open carries "Settled by the user: <answer>". There are no more than three rounds, plus any extra rounds, each of which carries "Settled by the user: <answer>" authorising it (a round beyond the third without that is a failure). A finding with no disposition is a failure.
6. **Failed requirements:** no row in the requirements trace has a result that starts with Fail (so "Fail (checked by Claude)" counts too).

If any rule fails, STOP and list every failure in plain English, one line each, naming the finding or requirement. Tell the user that running `/code-change` on this branch will continue the change (fix, re-run the checks, re-review and append to the record). Do not merge, push or write anything.

## 3. Read the decisions from the plan
The plan's Check-in section already settled these. Do NOT ask the user again:
- **Type**
- **Commit message**, for example `feat(ABC-085): feedback when park-hours fetch finds nothing`

Tell the user in one line what's about to happen, for example:
> "Checking in ABC-085, per the plan."

If the change is in a worktree, add that the worktree is deleted at the end with everything inside it (its own installed packages, build folder and data folder), so anything entered in the app running there is gone. Typing `/commit-change` is their go-ahead, so say it as a plain heads-up. If the user has said anywhere in the chat that they want something kept from that app's data, STOP and ask before going on.

## 4. Catch up with the default branch
Only needed if the default branch has commits the working branch doesn't (`git log HEAD..<default> --oneline` is not empty). If it is empty, skip this step.
- Bring the branch up to date by merging the default branch into it with a message that carries the change number: `git merge <default> -m "chore(<NUMBER>): catch up with <default>"`. Never rebase: the approved-plan commit must keep its hash. Every merge or correction commit made on the branch carries the change number like this, because a commit with no number is refused when the branch reaches the default branch (the master lock, if CLAUDE.md has a "Master lock" line).
- If the merge reports any conflict, list the conflicted files (`git diff --name-only --diff-filter=U`).
  - **Only `CHANGELOG.md` conflicts**, and this change's own diff to it adds nothing but this change's entry (`git diff <merge-base> HEAD -- CHANGELOG.md` shows only added lines belonging to this change number): changes in flight at the same time all add their line at the top of Unreleased, so this is expected. Resolve it yourself: take the default branch's version of the file (`git checkout --theirs CHANGELOG.md`), add this change's entry (taken from `git show HEAD:CHANGELOG.md`, exactly as written) at the top of its `## [Unreleased]` list, and stage it. Then check that `git diff <default> -- CHANGELOG.md` shows only this change's entry as added, and finish the merge commit with the same message, `chore(<NUMBER>): catch up with <default>`. Tell the user in one plain line that you kept both entries.
  - **Anything else** (another file as well, or a CHANGELOG change that is more than this change's entry): run `git merge --abort`, STOP, and tell the user in plain English which files conflict. Ask how they want to proceed. Do not guess a resolution.
- **Migration clash:** if CLAUDE.md has a "Migrations" line, then after the merge (conflict or not) check the migrations folder it names: no two migration files may share a number, and the schema version it says is set in a named place must still match the highest migration number, as the line describes (two changes can each bump it to the same value and merge cleanly). On either failure, STOP and tell the user in plain English which files clash. Do not renumber anything: the fix goes through `/code-change` on this branch. If CLAUDE.md has no "Migrations" line, skip this check and say so.
- After the merge, run every check under "Checks (all must pass)" in CLAUDE.md again on the combined code, plus every check under "Checks (only when relevant)" whose condition applies. Run each as its own command, and never leave the shell in a different directory afterwards. In a worktree, set the environment CLAUDE.md's "Worktree check environment" line gives for the checks it names (if CLAUDE.md has no such line, run them as they are). If any check fails, STOP and report in plain English.
- Run `git diff <approved-plan commit> -- <plan file>` again. It must still show no changes.
- If resolving a conflict changed code (only possible after the user told you how to resolve it), review those changes and record them in the change's review record: add a "Merge conflict resolution" section to `docs/reviews/<plan file name>.md` that lists the files, what was decided and why, and the review result, then commit it on the branch as `docs(<NUMBER>): record merge conflict resolution`. A merge with no conflicts changes no records.

## 5. Merge and publish
- If the work is in a worktree: the default branch can only be merged in the main folder, and a chat inside a worktree can't touch it. Note the worktree's path, then leave it with `ExitWorktree` (`keep`), which returns the chat to the main folder. If the chat can't leave the worktree that way (for example it was resumed), STOP and tell the user to type `/commit-change` from a chat in the main folder, naming the change.
- In the main folder, if the default branch's CLAUDE.md has a "Master lock" line, run its status command there too and STOP if it says the lock is off, exactly as in step 1. If it has no such line, skip this.
- In the main folder, make sure the default branch is the one checked out and merge with `git merge --no-ff <branch>`, using the plan's commit message for the merge commit. If the merge reports a conflict, run `git merge --abort`, STOP, and tell the user in plain English. Do not push or delete anything.
- Push the default branch to GitHub. If the push is rejected, STOP and tell the user in plain English. Do not delete the branch or the worktree, and do not force-push; say that the local default branch is ahead of GitHub.
- Only after the push succeeds, remove the worktree, if there is one, with `git worktree remove <path>` (never forced), then delete the working branch with `git branch -d <branch>` (never `-D`). The removal deletes everything inside the worktree folder, including its own installed packages, build folder and database, and nothing outside it. If it can't finish (for example a file is locked because the worktree's app or an editor is still open), do not force it: say plainly what is left and what the user must close or delete by hand, and still delete the branch only if the worktree is gone.

## 6. Report
Tell the user in plain English:
- The change number and title that were checked in.
- That the default branch is on GitHub, and, for a change coded in a worktree, that the worktree and branch are gone (or exactly what is left).
- Anything they still need to do by hand, such as running a new migration: the steps in CLAUDE.md's "Backup before a migration" line first (if CLAUDE.md has no such line, say so and ask them how to back up).
- Last of all, only if the plan has an "Original request (set aside)" section: end the report with a one-line lead-in saying the original request is still waiting, then a fenced code block holding `/plan-change ` followed on the same line by the recorded request exactly as written in the plan (any further lines unchanged, nothing trimmed or rewrapped), ready to paste. Use a fence longer than any run of backticks inside the request (or a `~~~` fence, longer than any run of tildes inside it). Nothing comes after it. If the plan has no such section, add nothing.

## Never
- Merge without completing steps 1–4.
- Merge a new-format change whose review record fails the review gate in step 2.
- Write or change the plan, the review record, or the CHANGELOG entry. The exceptions are the merge-conflict section in step 4 and keeping both entries when only `CHANGELOG.md` conflicts in the catch-up merge. If anything else is wrong, STOP and say so.
- Rebase.
- Make a merge or correction commit on the branch whose message has no change number.
- Turn the master lock off, or set `core.hooksPath` in any way. If the lock refuses the merge, STOP and tell the user in plain English what it said; the cause goes back through `/code-change`.
- Push any branch other than the default branch, or force-push anything.
- Force-remove a worktree, or delete anything outside the worktree's own folder.
- Run anything against files in the data folder (CLAUDE.md's "Data folder" line).
- Leave the default branch ahead of GitHub.
