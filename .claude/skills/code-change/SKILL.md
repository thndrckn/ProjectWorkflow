---
name: code-change
description: Second step of the workflow, run by the user after a plan is approved. Creates the change's branch in a worktree of its own (so several changes can be coded at once, each in its own chat), writes the code and tests, runs checks, gets an independent code review whose findings are labelled caused-by-this-change yes/no, settles every finding itself (stopping to ask only for a plan conflict, data risk, an explanation the re-reviewer rejects, or a re-review that is still not clean after its last permitted round, or that needs a round only the user can authorise), re-runs checks, writes the documentation, and hands off for /commit-change. Run on an existing working branch it continues that change instead. Never merges to the default branch.
disable-model-invocation: true
---

# Code a change

This is the second step of the workflow: plan → **code** (including review) → check in.
The default branch, change prefix, checks, build command and version files come from the Workflow section of CLAUDE.md. Wherever this skill says "the default branch", use the one named there.

Follow these steps in order. Stop where a step says STOP.

**Document control:** once the plan is committed in step 3, the plan file is an approved document and is never edited again. Anything that differs from the plan is recorded in the review record (step 9), not in the plan.

## Continue mode
Run `git branch --show-current` on its own as a separate command first. The change number is the one in the branch name (`<type>/<NUMBER>-<title>`); if the current branch is not the default branch and its name has no change number, STOP and ask the user. If the current branch is not the default branch and `git log --grep "^docs(<NUMBER>): approved plan"` finds that commit, you are **continuing an existing change**, for example after `/commit-change` stopped on a failed review gate or after a stop case was answered. Say so in one line, then:
- Skip steps 2 and 3. Do not create or switch branches, and do not touch the plan file. Run `git status` on its own; if there are uncommitted changes, show them and STOP.
- Read the plan and the existing review record (`docs/reviews/<same file name as the plan>.md`) so you know what is open: failed gate items, unsettled findings, or whatever the user asked you to fix. If the branch has no review record yet, there is nothing to append to: carry on as for a new change from step 4 and write the record in step 9. If the record is in the old format (no `Review format` line and no "Caused by this change" lines), keep that format: append in the same style, do not add the marker, and the gate stays exempt. A record marked `Review format: accountability` (without the 2) keeps its keyword-read rounds the same way. A record marked `accountability 2` gets the fixed lines of step 9 added to it, appended and never rewritten; the lock refuses an old-format record for any change numbered at or above CLAUDE.md's "Review format 2 required from" line, so if this change is at or above it and its record is old-format, STOP and ask the user.
- A gate failure about a record's own content (a missing label, severity or disposition, or a "caused: yes" finding marked logged) is fixed by **adding a correction line** under that finding, never by deleting or rewriting it: `**Correction (round N):** <what is now true>`. A missing label or severity is supplied by a fresh reviewer, never by you. The gate reads each finding as corrected by its latest correction line.
- Do step 4 for those fixes only, then step 5.
- Run the re-review loop in step 7 on the open items and the new fixes (the re-reviewer gets the diff of the new commits). Run the step 6 review as well whenever the new work includes anything beyond the smallest edit that fixes an open item (new code, new text, or a changed rule); when in doubt, run it. Give those reviewers the whole branch diff as usual.
- Re-review rounds count across the whole change, not per run. A round whose open items carry "Settled by the user" counts as closed. If the record already shows three rounds and the last one wasn't clean and isn't closed that way, STOP and ask the user instead of starting another, and settle the open items according to their answer (see stop case 4 in step 7). If the record already shows three rounds and the last was clean but a gate failure needs a further fix, that fix's check is a round beyond the limit. The same applies if three rounds ended as "Settled by the user", or if an earlier extra round was already used and another fix is needed. A round beyond the third is never your decision: STOP, tell the user why it is needed, and run it only if they authorise it, recording their answer as "Settled by the user: <answer>" under that round. If an extra round isn't clean either, stop case 4 applies to it exactly as to a third round.
- Do step 8, then in step 9 **append** to the existing review record: add a new round, and never rewrite or delete earlier rounds or findings. Do not add a second CHANGELOG entry; edit the existing one only if what the change does has changed. Then step 10.

If the current branch is the default branch and the user names a change that already has a worktree (`git worktree list` shows one for its branch), you are also continuing: enter that worktree exactly as step 3's "Enter the worktree" bullet says (load the tools, enter with `EnterWorktree` and its `path`, check the folder and branch, and STOP if anything fails), say so in one line, and carry on as above from the worktree.

If the current branch is the default branch, or has no approved-plan commit, continue with step 1 as normal.

## 1. Find the plan
- Use the plan written by `/plan-change` in this session.
- If there isn't one (the usual case, since each change is coded in a fresh chat), or it's unclear which plan file in `docs/plans/` to use, find the plans that are not being coded yet: the plan files with no `docs(<NUMBER>): approved plan` commit on any branch (`git log --all --grep`). Ignore the placeholder files that `/plan-change` leaves for numbers it has only claimed. Ask the user which one, in the question box if there are several. STOP until they answer.
- Read the plan, including its change number (for example `ABC-085`) and its Check-in section (type, branch name, commit message).

## 2. Check for other changes in flight
Several changes can be coded at once, each in its own worktree, so other branches are normal.
- Run `git branch` and `git worktree list`, each on its own as a separate command, before anything else in this step. Never combine them with creating or switching a branch.
- If the current branch is not the default branch, say so and STOP: a new change is started from the default branch.
- If other working branches or worktrees exist, list them in one line each in plain English. They stay as they are; the new change starts from the default branch, so it won't include their work, and theirs won't include this one until they catch up at check-in.
- For each of them, read its plan (`docs/plans/`, on the branch or waiting on the default branch) and compare the files its "Technical detail" names with the files this plan names. If any file appears in both, name the files and the other change, say that the second check-in to land will meet conflicts there, and ask whether to continue. STOP until they answer. If there is no overlap, say nothing more and go on.

## 3. Make the working copy
If CLAUDE.md has no "Worktree folder" line, say so, and use the single-folder flow at the end of this step instead.
- Run `git status` on its own, as a separate command, before creating any branch or worktree. Never combine it with anything else. Check for uncommitted changes, other than plan files (other planning chats may have plans waiting).
  - If the plan says this change is the user's own existing edits, those edits are expected, but a worktree cannot carry them: use the single-folder flow at the end of this step and say why.
  - Any other uncommitted changes: show them and STOP until the user answers.
- Update the default branch from GitHub with `git pull --ff-only`. If it can't fast-forward, STOP and tell the user in plain English.
- Create the worktree in the folder CLAUDE.md's "Worktree folder" line gives, on the branch named in the plan's Check-in section, from the default branch: `git worktree add <folder> -b <branch> <default branch>`.
- Copy the plan file into the worktree's `docs/plans/`, check the copy is byte-for-byte identical to the original (`cmp`), and only then delete the original from the default branch's folder, so the later merge doesn't meet an untracked copy there. If the copy differs, STOP. Do all of this before entering the worktree: once inside it, the main folder can't be touched. Until the plan is committed in the worktree (below), the copy there is the only one; if the chat is interrupted in that window, the file is still in the worktree folder, so commit it as the approved plan from there.
- If the plan asks for a copy of the database, copy the files CLAUDE.md's "Database files to copy into a worktree" line lists into the worktree's data folder (CLAUDE.md's "Data folder" line), including the `-wal` and `-shm` files when they exist. Only read the originals; never write to them. If CLAUDE.md has no such line, say so and ask the user which files to copy. Otherwise do not copy anything: the worktree starts with an empty data folder, and the app creates its own database there. Never point the worktree at the main folder's data.
- Enter the worktree. `EnterWorktree` and `ExitWorktree` can be deferred tools that cannot be called until loaded, so first load both with one `ToolSearch` call (`select:EnterWorktree,ExitWorktree`), then call `EnterWorktree` with the worktree's `path`. Then check, as two separate commands, that `git rev-parse --show-toplevel` is the worktree folder (the same folder, whatever the slash direction or drive-letter case) and `git branch --show-current` is the plan's branch. A chat that never entered the worktree cannot leave it later, so `/commit-change` could not step out. If the tools can't be loaded, the call fails, or either check differs, STOP and tell the user in plain English where the worktree is and that the plan file now exists only there (it was already removed from the default branch's folder); write no code, and do not carry on from the default branch's folder. From here on every command and edit happens in the worktree.
- Run the command CLAUDE.md's "Worktree setup" line gives, in the worktree (if CLAUDE.md has no such line, say so and ask the user what to run).
- Commit the plan file as the first commit on the branch, with the message `docs(<NUMBER>): approved plan`. From here on, the plan file is frozen.

**Single-folder flow** (no "Worktree folder" line, or the plan is the user's own existing edits): switch to the default branch if needed, run `git pull --ff-only` (STOP if it can't fast-forward), create the branch named in the plan's Check-in section from the default branch (this carries the user's edits onto it), and commit the plan file as the first commit on the branch, with the message `docs(<NUMBER>): approved plan`. `/commit-change` works the same way for such a branch, with nothing to remove.

## 4. Write the code
- Build exactly what the plan describes. If something in the plan turns out to be wrong or impossible, STOP and explain. Do not improvise around it.
- Follow CLAUDE.md and the shared policy it imports. Follow the project's architecture and feature cycle as CLAUDE.md describes them.
- Write tests as you go that prove the change works. Use /tdd where it fits: write a failing test first, then make it pass.
- Build the plan's "Planned tests" for its requirements. A test built differently from the plan is a deviation (step 9).
- When the change edits a file outside the repository (so git can't show the edit), before editing it save a copy of the original on the branch as `docs/reviews/<NUMBER>-<file name>-before.md`, unchanged, and commit it with the records in step 9.
- **Policy edits:** the shared conventions folder (CLAUDE.md's "Shared conventions folder" line) is edited by the user by hand only, and the guard blocks Claude there; never try another route. If the plan has a "Policy edits for you to make by hand" section, do this once the code is written, before step 5:
  1. Save a before-copy of each file the section names, unchanged, as `docs/reviews/<NUMBER>-<file name>-before.md`, and commit it at once with the message `docs(<NUMBER>): before-copy of <file name>`.
  2. Show the user each edit exactly as the plan gives it (file, old text, new text) and STOP until they say they have made them. Nothing about the wording is yours to decide: if an old text is not found exactly once, or anything looks wrong, say so and STOP.
  3. Read each file and check it equals its before-copy with exactly the plan's replacements applied, and nothing else changed. If not, show the difference and STOP.
  4. Treat each such file as a file outside the repository in steps 6 and 9 (reviewers get the before-copy and the file's path; the review record's Scope line names it, and the record says the user made the edit by hand).
- Commit work in progress on the branch as you go, with messages that start with the plan's type and number, for example `feat(ABC-085): add status table`. Nothing goes to the default branch in this step.
- **Backlog items:** if the plan has a "Backlog items fixed" line, remove each named entry from `docs/BACKLOG.md` as part of the fix (the change's own records keep the history). If it has a "Backlog items accepted" section, add each item to `docs/DECISIONS.md` as an entry with this change's number, today's date and the user's reason from the plan, then remove it from `docs/BACKLOG.md`. These edits are part of the diff, so the Spec reviewer checks them.
- Write migration scripts when the plan calls for them, but never run anything against files in the data folder (CLAUDE.md's "Data folder" line; if it has none, ask the user which files hold their data), a worktree's own data folder included, unless the user's current message explicitly asks. If they do, take the steps in CLAUDE.md's "Backup before a migration" line first (if CLAUDE.md has no such line, say so and ask the user how to back up).

## 5. Run the checks
All of the checks listed under "Checks (all must pass)" in CLAUDE.md must pass before review, plus every check under "Checks (only when relevant)" whose condition applies to this change. Run each one as its own command, and never leave the shell in a different directory afterwards (use a subshell or a manifest/path flag for anything that has to run from a subfolder). In a worktree, set the environment CLAUDE.md's "Worktree check environment" line gives for the checks it names (if CLAUDE.md has no such line, run them as they are).

If something fails, fix it and re-run. If you can't fix it, STOP and report in plain English.

## 6. Review
The review is done by reviewers independent of you. You wrote the code, so you do not rate it.

- Launch three fresh sub-agents in parallel with the Agent tool (general-purpose), and tell each one to read and report only, never edit. They are the reviewers; nothing in this step is a review you do yourself.
  - **Standards:** does the diff follow the documented standards? Give it every file that documents how code is written (CLAUDE.md, the shared policy it imports, `docs/DECISIONS.md` if it exists, and `CODING_STANDARDS.md` or `CONTRIBUTING.md` if they exist), plus the smell baseline below pasted in full. A documented standard breach can be a hard violation. Baseline smells are always judgement calls, and a documented standard overrides the baseline. It also checks that code the diff adds or alters, when non-obvious (a hidden constraint, a workaround, a surprising choice), has a "why" comment; a missing one is a `[Low]` standards finding. Obvious code needs no comment, and old code the diff doesn't touch is not flagged. Skip anything the checks already enforce.
  - **Spec:** does the diff match the approved plan? Give it the plan file. It reports requirements that are missing or only partly done, behaviour that wasn't asked for, and requirements that look done but look wrong, quoting the plan line for each. If the plan names backlog items fixed or accepted, it also confirms each is gone from `docs/BACKLOG.md` (and each accepted one is in `docs/DECISIONS.md` with its reason).
  - **Correctness:** is the code right? Depth by change type: `feat:` two angles, general correctness plus the most relevant second one (data integrity for schema changes, security for external input, and so on); `fix:` confirm the root cause was fixed and look for the same bug pattern elsewhere in the touched files; `refactor:` confirm behaviour didn't change.
- Give each reviewer only the inputs for its own job, from this list: the diff command (`git diff <default branch>...HEAD`) and commit list, the plan file (Spec and Correctness), the standards files, including `docs/DECISIONS.md` (Standards), and the saved before-copy plus the file's path if the change edited a file outside the repository (they compare the two). Do not pass your own summary, reasoning or opinion of the code. The one exception is a re-reviewer in step 7: its job is to check your outcomes, so it is given each finding with your outcome and your reasoning for it.
- Each reviewer's brief requires every finding to have a severity, a "Caused by this change: yes/no" label, a one-line plain-English description, and the files involved. Severities: `[High]` data loss or corruption, a security hole, a crash, or a requirement plainly not met; `[Medium]` a real bug or a requirement only partly met in realistic use; `[Low]` a minor bug, an edge case, or a standards breach; `[Nit]` style or wording; `[Informational]` an observation that needs no action. "Caused" means the problem is in what this change added or altered, or in behaviour it changed ("yes"); a problem that was already there and that this change neither added, altered nor changed the behaviour of is "no". A requirement of the plan that is missing, only partly done or wrongly built is always "yes"; tell the Spec reviewer so. Ask for under 400 words each.
- Tell every reviewer that the review record and the CHANGELOG entry are written after the review (step 9), so they must not flag them as missing.
- Collect the findings. Do not merge, rerank or re-rate them: the severity and the caused label are the reviewer's, and the three lists stay separate.

**Smell baseline** (Fowler; each is a labelled heuristic, never a hard violation): Mysterious Name; Duplicated Code; Feature Envy; Data Clumps; Primitive Obsession; Repeated Switches (the same switch or if-cascade on one type in several places); Shotgun Surgery (one change forces scattered edits); Divergent Change (one file edited for several unrelated reasons); Speculative Generality (abstraction for needs the plan doesn't have); Message Chains; Middle Man; Refused Bequest.

## 7. Settle the findings, check again, re-review
Settle every finding yourself. Do not stop to ask the user which to fix. Stop only in these four cases, each described below: (1) a fix would go against the approved plan, (2) a fix would touch the user's data, (3) the re-reviewer rejects an explanation and you still disagree, (4) the last permitted re-review round (the third, or an extra round the user authorised) is still not clean, or a further round beyond the third is needed, which only the user can authorise.

You never have the last word on your own findings: every outcome, including every fix, is checked by a fresh reviewer below.

- Every finding ends in one of three places: **fixed**, **explained** ("not a real problem": wrong, by design, or a pure observation, with the reason), or **logged** in `docs/BACKLOG.md`. Nothing is left unaccounted for. What is allowed depends on the reviewer's "Caused by this change" label:
  - **Caused: yes** — can only be fixed, or explained with a reason the re-reviewer accepts. It can never be logged, and never accepted as is.
  - **Caused: no** — can be fixed, explained, or logged, at any severity. The re-reviewer confirms that "no" is true.
- Never change a reviewer's severity or caused label. If you think either is wrong, say so in the finding's disposition and keep it as given. The only way to move a "yes" to "no" is to dispute it with an explanation, which counts as an explained outcome the re-reviewer must accept; until it accepts, the label stays "yes".
- **Stop case 1, plan conflict:** if a fix would go against the approved plan, quote the plan's exact words, STOP and ask the user before acting.
- **Stop case 2, data risk:** if a fix would edit a migration script, delete behaviour, import/export/backup code, or anything in the data folder (CLAUDE.md's "Data folder" line), STOP and ask the user before acting, even if the fix matches the plan and whatever the finding's severity. If a finding that must be fixed (a "caused: yes" one) can't be fixed without hitting a stop case, the same applies.
- When a stop case applies, record the question and the user's answer in the finding's disposition in the review record, with the answer written as "Settled by the user: <answer>" (the gate looks for that phrase).
- Work out each requirement's result for the trace table in step 9:
  - Automated test: run it and record Pass or Fail.
  - Manual check Claude can run itself (reading a file, running a command): run it and record Pass or Fail with "(checked by Claude)".
  - Manual check that needs the user at the app: record "Manual".
  - A Fail is not a reviewer finding and carries no severity. It is always "caused: yes": it can only be fixed, never explained away or logged, with the same stop cases. A fixed Fail triggers a re-review like any non-plain outcome.
- Run every check from step 5 again. All must pass. Re-run any requirement test that failed.
- **Re-review (a loop, at most three rounds):** after the first review is settled, if there is any outcome at all (any fix, explanation, logged item or disputed label, or a fixed requirement Fail), at any severity, launch one fresh reviewer (same rules as step 6, a new one each round). Give it the plan, the standards, the diff of the fixes, and for each finding its label, your outcome and your reasoning. It must:
  - check every explanation and say whether it accepts it,
  - check every logged item and confirm the "caused: no" label is true,
  - check every fix (including fixed Fails) and say whether it really resolves the finding without breaking anything,
  - label every new finding it raises "caused: yes/no" and give it a severity, like step 6.
  - Its brief says it must answer in a fixed form, because the author copies the answers into the review record as fixed lines the lock reads exactly (step 9): for every outcome you gave it (each finding, whatever its disposition, and each fixed requirement Fail) one word, `accepted` or `rejected`, with a reason for a rejection; the new findings it raised, each with severity and caused label; and whether the round is clean (every outcome accepted and no new finding at all). Do not give it the record's line formats; it never writes the record.
  - Settle its findings and any rejections the same way as above, with the same stop cases, and run the checks again if you fixed anything.
  - **A rejection** (of an explanation, of a "caused: no" label on a logged item, or of a fix): fix the problem properly. If it was a rejected "no" label, the finding is "caused: yes" from then on and can only be fixed or explained. A rejected explanation of a finding this change didn't cause may instead be logged, if the re-reviewer confirms the "no" label. If you still disagree after that, **stop case 3**: STOP and ask the user, quoting the reviewer's rejection and your reason.
  - **Another round:** a round is clean only when every outcome in it is accepted by the re-reviewer and it raised **no new finding at all**. A new finding, even one you then fix at once, makes the round not clean, so that fix is checked by the next round. If a round isn't clean, run the next round with a new fresh reviewer, which checks everything from that round's fixes, explanations and logged items. Keep going until a round is clean.
  - **Stop case 4:** if the last permitted re-review round (the third, or an extra round the user authorised) is still not clean, STOP and show the user every item that is still open. Settle each open item according to the user's answer and record, under that item, the question and the answer as "Settled by the user: <answer>". The user's answer is the final word on those items, the gate accepts it in place of a clean round, and no further round is run unless the user asks for one.
- **By-design decisions:** when a finding is explained as by design and the reason belongs to one spot in the code, add a "why" comment at that spot instead, in the same change, matching the surrounding comments in style and density. It gets no entry in `docs/DECISIONS.md`; it is explained in the review record only, and the comment is a fix the re-reviewer checks like any other. If that spot cannot hold a comment (a data file, a lockfile, generated code), put the comment in the nearest file that can, such as the code that reads it; if there is none, or the reason spans several spots or you are unsure whether it is one spot, treat it as project-wide. A comment in a place stop case 2 covers (a migration script, import/export/backup code, the data folder) needs the user's answer first, like any other fix there; if the user declines the comment, treat the reason as project-wide. When the reason applies project-wide, add the decision and its reason to `docs/DECISIONS.md` as an entry with this change's number and today's date, unless the same decision is already there (if the file doesn't exist, create it with a `# Design decisions` title, one line saying what the file is for, and the entry format: a heading with the decision, then Change, Date and Reason lines). If the re-reviewer later rejects the explanation, revise or remove the entry, or revise the comment, according to the user's answer. An observation that isn't a decision is explained in the review record only, never in `docs/DECISIONS.md`. Commit any entry with the records in step 9.
- Note each finding with its reviewer-assigned severity and caused label, where it ended up (fixed and how; explained and why; or logged in docs/BACKLOG.md), and what the re-reviewer said about it, and anything that now differs from the plan. These go in the review record in step 9. Add an entry to `docs/BACKLOG.md` for every finding you log, in its format (a `## <title>` heading, then Found in, Severity, Files and What's wrong lines); if the file doesn't exist, create it with that format described at its top.

## 8. Confirm the plan is untouched
- Run `git diff <approved-plan commit> -- <plan file>` (the commit whose message is `docs(<NUMBER>): approved plan`). It must show no changes.
- If it shows any change, STOP, show the user exactly what changed, and do not continue until they decide what to do.

## 9. Write the documentation
Update only what this change affects, then commit on the branch with the message `docs(<NUMBER>): records`.

If the plan itself is a documentation change (for example rewriting, moving, archiving, or retiring documents), the plan's instructions for those documents take priority over the defaults below.

**Review record (always):** create `docs/reviews/<same file name as the plan>.md` in this format:

```
# Review: <NUMBER> — <plan title>

- **Change:** <NUMBER>
- **Review format:** accountability 2
- **Plan:** docs/plans/<plan file name> (approved in commit <short hash of the plan commit>)
- **Branch:** <branch name>
- **Reviewer:** <the independent reviewers (Standards, Spec, Correctness) and whether a re-review ran>
- **Scope:** diff of <branch> against <default branch> — <files changed>, about <N> lines (plus any file outside the repository that the change edited, with its saved copy)

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author). Findings raised by a re-review are listed here too, marked with the round that raised them.

- **[Severity]** <one-line description> — <files>
  **Caused by this change:** yes | no
  **Disposition:** fixed (how) | explained (why) | logged in docs/BACKLOG.md
  <If a finding was raised by a re-review round, add the line `**Raised in round:** N` (the round number).>
  <If a stop case applied, add the question asked and the user's answer.>
  <If the author disagreed with the severity or the label, add a line saying so and why. The severity and label above stay as given.>
  **Re-review (round N):** accepted | rejected
  <One such line for each round that checked this finding; a finding with no re-review line fails the gate. The latest round's line counts, so a rejection followed by a later accepted is fine. Add a line per round, never rewrite one. A finding carrying "Settled by the user:" needs none.>

## Re-review
<Only if any ran. One subsection per round, in order: "### Round 1", "### Round 2", "### Round 3", and "### Round 4 (extra)", "### Round 5 (extra)" and so on for any round the user authorised beyond the third. Each says what triggered it, what the re-reviewer checked, whether it accepted each explanation, confirmed each logged item's "caused: no" label and accepted each fix, its new findings (with severity and caused label) and how they were settled. For a requirement fixed after a Fail, the round that checked it carries the line `**Re-review (round N):** R<id> accepted` (or `rejected`), with the requirement's id as in the trace table. Every round ends with exactly one line, `**Round N clean:** yes` or `**Round N clean:** no`, where N is the round's number; yes only when every outcome in it was accepted and it raised no new finding (a round marked yes that holds a rejection, or in which a finding was raised, fails the gate). Later runs append rounds and never rewrite earlier ones. Leave this section out if no re-review ran.>

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | <the test, as in the plan or as built> | Pass \| Fail \| Pass (checked by Claude) \| Fail (checked by Claude) \| Manual |

A requirement whose test failed and was then fixed is recorded as "Pass (fixed after Fail)" (or "Pass (checked by Claude, fixed after Fail)"), so the gate can see a re-review was required.

## Deviations from the plan
<Anything built differently from the approved plan, and why. "None" if none.>

## Summary
<A short paragraph on the state of the change.>
```

**CHANGELOG.md (always):** one entry for this change, added at the top of `## [Unreleased]` (newest first). Never create a version heading; Unreleased grows until a future `/build-changes` turns it into a version. Use this format:

```
- <NUMBER> (<type>) <what changed, in one plain line>
  <optional second line: a fix that rode along, or "Migration NNN required.">
```

Always call out a new migration. Don't repeat the review findings; the review record holds those.

**Only if this change affects them:**
- **CLAUDE.md**: something Claude needs to know next time (a new module, table, rule, or convention).
- **README.md**: something a user would notice (a new feature, a new setup or run step).
- **docs/BACKLOG.md**: every finding logged there in step 7, so it isn't forgotten.
- **docs/DECISIONS.md**: every by-design decision recorded in step 7. Commit it with these records.

Do not add new entries to `docs/archive/PEER_REVIEW.md`; it is the archive of older reviews.

## 10. Hand off
Tell the user in plain English:
- The change number and what was built.
- The review findings, first: one plain-English line for every finding, giving its severity, whether this change caused it, what was found, and what was done (fixed; explained and why; or logged), including findings from every re-review round and whether the re-reviewer accepted each outcome. Never give counts or groups in place of the list. Then say how many re-review rounds ran, any time you stopped to ask the user and what they answered. If the re-reviewer or anything else left something open, say so plainly.
- Which documents you created or changed, and why, so they can read them before checking in.
- What to test by hand, after the review summary: list every numbered test (T1, T2, …) from the plan's "How you'll check it", in full, and next to each one show the trace-table results of the requirements it covers, so the user can see which ones Claude already checked.
- Where the change lives: the worktree folder and branch, if it was coded in one, and that the app runs there with the project's normal run command, with its own data folder (empty unless the plan asked for a copy). Say plainly that anything entered in the app there lives only in the worktree and is deleted with it at check-in.
- Whether there is a new migration. If so, remind them to take the steps in CLAUDE.md's "Backup before a migration" line before running it (if CLAUDE.md has no such line, say so and ask them how to back up), and that the app won't start against the database until it's run.
- That when they're satisfied, they type `/commit-change` in this same chat; it steps out of the worktree itself.

Do NOT merge or push. That is `/commit-change`'s job.
