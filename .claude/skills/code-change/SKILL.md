---
name: code-change
description: Second step of the workflow, run by the user after a plan is approved. Creates the branch, writes the code and tests, runs checks, gets a code review, waits for the user to choose fixes, re-runs checks, writes the documentation, and hands off for /commit-change. Never merges to master.
disable-model-invocation: true
---

# Code a change

This is the second step of the workflow: plan → **code** → review → check in.
This repo's default branch is `master`.

Follow these steps in order. Stop where a step says STOP.

**Document control:** once the plan is committed in step 3, the plan file is an approved document and is never edited again. Anything that differs from the plan is recorded in the review record (step 9), not in the plan.

## 1. Find the plan
- Use the plan written by `/plan-change` in this session.
- If there isn't one, or it's unclear which plan file in `docs/plans/` to use, ask the user which one. STOP until they answer.
- Read the plan, including its change number (for example `DTP-085`) and its Check-in section (type, branch name, commit message).

## 2. Check for other branches
- Run `git branch` on its own, as a separate command, before anything else in this step. Never combine it with creating or switching a branch.
- If any branch other than `master` exists, list them in plain English and explain that the new branch will start from `master`, so it won't include any work on those branches. `/code-change` is meant to be run from `master`; if the current branch is not `master`, say so as part of the list.
- Ask whether to continue, or to deal with one of those branches first. STOP until they answer.

## 3. Make the working copy
- Run `git status` on its own, as a separate command, before switching or creating any branch. Never combine it with anything else. Check for uncommitted changes, other than the new plan file.
  - If the plan says this change is the user's own existing edits, those edits are expected. Leave them in place; creating the branch below carries them onto it.
  - Any other uncommitted changes: show them and STOP until the user answers.
- Switch to `master` and update it from GitHub with `git pull --ff-only`. If it can't fast-forward, STOP and tell the user in plain English.
- From `master`, create the branch named in the plan's Check-in section.
- Commit the plan file as the first commit on the branch, with the message `docs(<NUMBER>): approved plan`. From here on, the plan file is frozen.

## 4. Write the code
- Build exactly what the plan describes. If something in the plan turns out to be wrong or impossible, STOP and explain. Do not improvise around it.
- Follow CLAUDE.md and POLICY.md: business logic in Rust, the full feature cycle (models, traits, provider, engine, command, lib.rs, api.ts, types.ts, view), no inline styles, datetime helpers only.
- Write tests as you go that prove the change works. Use /tdd where it fits: write a failing test first, then make it pass.
- Commit work in progress on the branch as you go, with messages that start with the plan's type and number, for example `feat(DTP-085): add status table`. Nothing goes to `master` in this step.
- Write migration scripts when the plan calls for them, but never run anything against files in `data/` unless the user's current message explicitly asks. If they do, back up the database first.

## 5. Run the checks
All of these must pass before review. Run each one from the repo root as its own command; the shell's directory persists between commands, so never `cd` into `src-tauri` without a subshell or `--manifest-path`:
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- `npm run lint`
- `npm run build:vite`
- `npm run test:pdf` if anything touching the itinerary or PDF changed

If something fails, fix it and re-run. If you can't fix it, STOP and report in plain English.

## 6. Review
- Run /code-review on the diff between this branch and `master`.
- Present EVERY finding: severity (`[Informational]`, `[Nit]`, `[Low]`, `[Medium]`, `[High]`), a one-line plain-English description, and the files involved.
- STOP. Do not fix anything. Wait for the user to say which findings to fix.

## 7. Fix what the user approved, then check again
- Fix only the findings the user approved.
- Run every check from step 5 again. All must pass.
- Note each finding and the user's decision (fixed and how, declined, or not a real problem and why), and anything that now differs from the plan. These go in the review record in step 9.

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
- **Scope:** diff of <branch> against master — <files changed>, about <N> lines

## Findings
- **[Severity]** <one-line description> — <files>
  **Disposition:** fixed (how) | declined by user | not a real problem (why)

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
- **KNOWN_ISSUES.md**: a declined finding that is a real limitation, so it isn't forgotten.

Do not add new entries to `docs/archive/PEER_REVIEW.md`; it is the archive of older reviews.

## 10. Hand off
Tell the user in plain English:
- The change number, what was built, and what was fixed after review.
- Which documents you created or changed, and why, so they can read them before checking in.
- What to test by hand, using the "How you'll check it" steps from the plan.
- Whether there is a new migration. If so, remind them to Export All (and back up the database file) before running it, and that the app won't start against the database until it's run.
- That when they're satisfied, they type `/commit-change`.

Do NOT merge or push. That is `/commit-change`'s job.
