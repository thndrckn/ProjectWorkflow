---
name: code-change
description: Second step of the workflow, run by the user after a plan is approved. Creates the branch, writes the code and tests, runs checks, gets an independent code review, settles every finding itself (stopping to ask only for a plan conflict, data risk, or an explanation the re-reviewer rejects), re-runs checks, writes the documentation, and hands off for /commit-change. Never merges to the default branch.
disable-model-invocation: true
---

# Code a change

This is the second step of the workflow: plan → **code** (including review) → check in.
The default branch, change prefix, checks, build command and version files come from the Workflow section of CLAUDE.md. Wherever this skill says "the default branch", use the one named there.

Follow these steps in order. Stop where a step says STOP.

**Document control:** once the plan is committed in step 3, the plan file is an approved document and is never edited again. Anything that differs from the plan is recorded in the review record (step 9), not in the plan.

## 1. Find the plan
- Use the plan written by `/plan-change` in this session.
- If there isn't one, or it's unclear which plan file in `docs/plans/` to use, ask the user which one. STOP until they answer.
- Read the plan, including its change number (for example `ABC-085`) and its Check-in section (type, branch name, commit message).

## 2. Check for other branches
- Run `git branch` on its own, as a separate command, before anything else in this step. Never combine it with creating or switching a branch.
- If any branch other than the default branch exists, list them in plain English and explain that the new branch will start from the default branch, so it won't include any work on those branches. `/code-change` is meant to be run from the default branch; if the current branch is not the default branch, say so as part of the list.
- Ask whether to continue, or to deal with one of those branches first. STOP until they answer.

## 3. Make the working copy
- Run `git status` on its own, as a separate command, before switching or creating any branch. Never combine it with anything else. Check for uncommitted changes, other than the new plan file.
  - If the plan says this change is the user's own existing edits, those edits are expected. Leave them in place; creating the branch below carries them onto it.
  - Any other uncommitted changes: show them and STOP until the user answers.
- Switch to the default branch and update it from GitHub with `git pull --ff-only`. If it can't fast-forward, STOP and tell the user in plain English.
- From the default branch, create the branch named in the plan's Check-in section.
- Commit the plan file as the first commit on the branch, with the message `docs(<NUMBER>): approved plan`. From here on, the plan file is frozen.

## 4. Write the code
- Build exactly what the plan describes. If something in the plan turns out to be wrong or impossible, STOP and explain. Do not improvise around it.
- Follow CLAUDE.md and the shared policy it imports. Follow the project's architecture and feature cycle as CLAUDE.md describes them.
- Write tests as you go that prove the change works. Use /tdd where it fits: write a failing test first, then make it pass.
- Build the plan's "Planned tests" for its requirements. A test built differently from the plan is a deviation (step 9).
- When the change edits a file outside the repository (so git can't show the edit), before editing it save a copy of the original on the branch as `docs/reviews/<NUMBER>-<file name>-before.md`, unchanged, and commit it with the records in step 9.
- Commit work in progress on the branch as you go, with messages that start with the plan's type and number, for example `feat(ABC-085): add status table`. Nothing goes to the default branch in this step.
- Write migration scripts when the plan calls for them, but never run anything against files in `data/` unless the user's current message explicitly asks. If they do, back up the database first.

## 5. Run the checks
All of the checks listed under "Checks (all must pass)" in CLAUDE.md must pass before review, plus every check under "Checks (only when relevant)" whose condition applies to this change. Run each one as its own command, and never leave the shell in a different directory afterwards (use a subshell or a manifest/path flag for anything that has to run from a subfolder).

If something fails, fix it and re-run. If you can't fix it, STOP and report in plain English.

## 6. Review
The review is done by reviewers independent of you. You wrote the code, so you do not rate it.

- Launch three fresh sub-agents in parallel with the Agent tool (general-purpose), and tell each one to read and report only, never edit. They are the reviewers; nothing in this step is a review you do yourself.
  - **Standards:** does the diff follow the documented standards? Give it every file that documents how code is written (CLAUDE.md, the shared policy it imports, and `CODING_STANDARDS.md` or `CONTRIBUTING.md` if they exist), plus the smell baseline below pasted in full. A documented standard breach can be a hard violation. Baseline smells are always judgement calls, and a documented standard overrides the baseline. Skip anything the checks already enforce.
  - **Spec:** does the diff match the approved plan? Give it the plan file. It reports requirements that are missing or only partly done, behaviour that wasn't asked for, and requirements that look done but look wrong, quoting the plan line for each.
  - **Correctness:** is the code right? Depth by change type: `feat:` two angles, general correctness plus the most relevant second one (data integrity for schema changes, security for external input, and so on); `fix:` confirm the root cause was fixed and look for the same bug pattern elsewhere in the touched files; `refactor:` confirm behaviour didn't change.
- Give each reviewer only the inputs for its own job, from this list: the diff command (`git diff <default branch>...HEAD`) and commit list, the plan file (Spec and Correctness), the standards files (Standards), and the saved before-copy plus the file's path if the change edited a file outside the repository (they compare the two). Do not pass your own summary, reasoning or opinion of the code.
- Each reviewer's brief requires every finding to have a severity, a one-line plain-English description, and the files involved. Severities: `[High]` data loss or corruption, a security hole, a crash, or a requirement plainly not met; `[Medium]` a real bug or a requirement only partly met in realistic use; `[Low]` a minor bug, an edge case, or a standards breach; `[Nit]` style or wording; `[Informational]` an observation that needs no action. Ask for under 400 words each.
- Collect the findings. Do not merge, rerank or re-rate them: the severity is the reviewer's, and the three lists stay separate.

**Smell baseline** (Fowler; each is a labelled heuristic, never a hard violation): Mysterious Name; Duplicated Code; Feature Envy; Data Clumps; Primitive Obsession; Repeated Switches (the same switch or if-cascade on one type in several places); Shotgun Surgery (one change forces scattered edits); Divergent Change (one file edited for several unrelated reasons); Speculative Generality (abstraction for needs the plan doesn't have); Message Chains; Middle Man; Refused Bequest.

## 7. Settle the findings, check again, re-review
Settle every finding yourself. Do not stop to ask the user which to fix. Stop only in these three cases, each described below: (1) a fix would go against the approved plan, (2) a fix would touch the user's data, (3) the re-reviewer rejects an explanation.

- Every finding ends in one of three places: **fixed**, **explained** (wrong, by design, or a pure observation, with the reason), or **logged** in KNOWN_ISSUES.md. A `[Medium]` or `[High]` finding can only be fixed or explained, never logged. Nothing is left unaccounted for.
- Never change a reviewer's severity. If you think it's wrong, say so in the finding's disposition and keep the severity.
- **Stop case 1, plan conflict:** if a fix would go against the approved plan, quote the plan's exact words, STOP and ask the user before acting.
- **Stop case 2, data risk:** if a fix would edit a migration script, delete behaviour, import/export/backup code, or anything in `data/`, STOP and ask the user before acting, even if the fix matches the plan and whatever the finding's severity. If a `[Medium]` or `[High]` finding can't be fixed without hitting a stop case, the same applies.
- When a stop case applies, record the question and the user's answer in the finding's disposition in the review record.
- Work out each requirement's result for the trace table in step 9:
  - Automated test: run it and record Pass or Fail.
  - Manual check Claude can run itself (reading a file, running a command): run it and record Pass or Fail with "(checked by Claude)".
  - Manual check that needs the user at the app: record "Manual".
  - A Fail is not a reviewer finding and carries no severity. It is settled like a `[High]` finding: it can only be fixed, never explained away or logged, with the same stop cases. A fixed Fail counts as a fixed `[High]` for the re-review below.
- Run every check from step 5 again. All must pass. Re-run any requirement test that failed.
- **Re-review (once):** if any `[Medium]` or `[High]` finding was raised (each is fixed or explained), or a Fail was fixed, launch one fresh reviewer (same rules as step 6) and give it the plan, the standards, the diff of the fixes, and your explanations. It checks the fixes and says whether it accepts each explanation.
  - **Stop case 3:** if it doesn't accept an explanation, STOP and ask the user.
  - Settle its other findings the same way as above, with the same stop cases, and run the checks again if you fixed anything. There is no second re-review, so say in the hand-off that those fixes and explanations were not re-checked by a reviewer.
- Note each finding with its reviewer-assigned severity and where it ended up (fixed and how; explained and why; or logged in KNOWN_ISSUES.md), and anything that now differs from the plan. These go in the review record in step 9. Add an entry to KNOWN_ISSUES.md for every finding you log.

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
- **Plan:** docs/plans/<plan file name> (approved in commit <short hash of the plan commit>)
- **Branch:** <branch name>
- **Reviewer:** <the independent reviewers (Standards, Spec, Correctness) and whether a re-review ran>
- **Scope:** diff of <branch> against <default branch> — <files changed>, about <N> lines (plus any file outside the repository that the change edited, with its saved copy)

## Findings
Every finding is listed, with the severity the reviewer assigned (never changed by the author).

- **[Severity]** <one-line description> — <files>
  **Disposition:** fixed (how) | explained (why) | logged in KNOWN_ISSUES.md
  <If a stop case applied, add the question asked and the user's answer.>
  <If the author disagreed with the severity, add a line saying so and why. The severity above stays as given.>

## Re-review
<Only if one ran: which findings triggered it, what the re-reviewer found, whether it accepted each explanation, and how its findings were settled. Leave this section out if no re-review ran.>

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | <the test, as in the plan or as built> | Pass \| Fail \| Pass (checked by Claude) \| Fail (checked by Claude) \| Manual |

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
- **KNOWN_ISSUES.md**: every finding logged there in step 7, so it isn't forgotten.

Do not add new entries to `docs/archive/PEER_REVIEW.md`; it is the archive of older reviews.

## 10. Hand off
Tell the user in plain English:
- The change number and what was built.
- A short plain-English review summary, first: how many findings the reviewers raised by severity, what was fixed, what was explained and why, what was logged, and any time you stopped to ask the user and what they answered. If the re-reviewer or anything else left something open, say so plainly.
- Which documents you created or changed, and why, so they can read them before checking in.
- What to test by hand, after the review summary: list every numbered test (T1, T2, …) from the plan's "How you'll check it", in full, and next to each one show the trace-table results of the requirements it covers, so the user can see which ones Claude already checked.
- Whether there is a new migration. If so, remind them to Export All (and back up the database file) before running it, and that the app won't start against the database until it's run.
- That when they're satisfied, they type `/commit-change`.

Do NOT merge or push. That is `/commit-change`'s job.
