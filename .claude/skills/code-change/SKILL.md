---
name: code-change
description: Second step of the workflow, run by the user after a plan is approved. Creates the branch, writes the code and tests, runs checks, gets a code review, waits for the user to choose fixes, re-runs checks, writes the documentation, and hands off for /commit-change. Never merges to the default branch.
disable-model-invocation: true
---

# Code a change

This is the second step of the workflow: plan → **code** → review → check in.
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
- Commit work in progress on the branch as you go, with messages that start with the plan's type and number, for example `feat(ABC-085): add status table`. Nothing goes to the default branch in this step.
- Write migration scripts when the plan calls for them, but never run anything against files in `data/` unless the user's current message explicitly asks. If they do, back up the database first.

## 5. Run the checks
All of the checks listed under "Checks (all must pass)" in CLAUDE.md must pass before review, plus every check under "Checks (only when relevant)" whose condition applies to this change. Run each one as its own command, and never leave the shell in a different directory afterwards (use a subshell or a manifest/path flag for anything that has to run from a subfolder).

If something fails, fix it and re-run. If you can't fix it, STOP and report in plain English.

## 6. Review
- Run /code-review on the diff between this branch and the default branch.
- Present EVERY finding: severity (`[Informational]`, `[Nit]`, `[Low]`, `[Medium]`, `[High]`), a one-line plain-English description, and the files involved.
- Every finding ends in one of three places: fixed, explained (wrong, by design, or a pure observation, with the reason), or logged in KNOWN_ISSUES.md. Nothing is left unaccounted for.
- If a proposed fix would go against the approved plan, mark it in the findings list with the plan's exact words before the user decides, and never act against the plan without asking.
- STOP. Do not fix anything. Wait for the user to say which findings to fix.

## 7. Fix what the user approved, then check again
- Fix only the findings the user approved.
- Run every check from step 5 again. All must pass.
- Note each finding and where it ended up (fixed and how; explained and why; or logged in KNOWN_ISSUES.md), and anything that now differs from the plan. These go in the review record in step 9. Add an entry to KNOWN_ISSUES.md for every finding the user decides to log.

## 8. Confirm the plan is untouched
- Run `git diff <first commit on this branch> -- <plan file>`. It must show no changes.
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
- **Reviewer:** <who/what performed the review>
- **Scope:** diff of <branch> against <default branch> — <files changed>, about <N> lines

## Findings
- **[Severity]** <one-line description> — <files>
  **Disposition:** fixed (how) | explained (why) | logged in KNOWN_ISSUES.md

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
- The change number, what was built, and what was fixed after review.
- Which documents you created or changed, and why, so they can read them before checking in.
- What to test by hand, using the "How you'll check it" steps from the plan.
- Whether there is a new migration. If so, remind them to Export All (and back up the database file) before running it, and that the app won't start against the database until it's run.
- That when they're satisfied, they type `/commit-change`.

Do NOT merge or push. That is `/commit-change`'s job.
