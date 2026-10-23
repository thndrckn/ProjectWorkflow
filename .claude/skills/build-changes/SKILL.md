---
name: build-changes
description: Run by the user after one or more check-ins. Turns everything waiting under Unreleased in CHANGELOG.md into a new version: checks the repository, proposes the version, runs all checks, reviews how the changes interact, sets the version, merges, tags, and builds the installer. Never fixes code, and has no change number, plan or review record.
disable-model-invocation: true
---

# Build the waiting changes into a version

This is separate from the plan → code → review → check in cycle. Check-ins never create versions; this is the only place a version is made.
The default branch, checks, build command and version files come from the Workflow section of CLAUDE.md. Wherever this skill says "the default branch", use the one named there.

A build has no change number, no plan and no review record. It never edits code to fix a problem. If it finds one, it stops, and the fix goes through the normal workflow as a new change.

The user typing `/build-changes` is their go-ahead to start. They still approve the version in step 3. Follow these steps in order, and stop where a step says STOP.

## 1. Safety checks
Run each as its own command.
- Confirm you are on the default branch.
- Confirm there are no uncommitted changes.
- Fetch from GitHub and confirm the default branch matches `origin/<default>`.
- Run `git branch` and confirm there are no other local branches.

If any of these fails, STOP and tell the user in plain English what is wrong.

## 2. List what's waiting
Read `CHANGELOG.md` and list every entry under `## [Unreleased]`, exactly as written, in plain English. If there are none, STOP and say there is nothing to build.

## 3. Propose the version
- Find the current version from the newest version heading in `CHANGELOG.md` and the latest `v*` git tag. If they disagree, STOP and tell the user.
- Propose the next version: a minor bump if any waiting entry is a `(feat)`, otherwise a patch bump. Show which entry decided it.
- Ask the user to approve it, using the question box with the proposed version as the first option "(Recommended)". The user may choose a different version. STOP until they answer.

## 4. Run all the checks
Run every check under "Checks (all must pass)" in CLAUDE.md, plus every check under "Checks (only when relevant)" whose condition applies to anything changed since the last version tag. Run each as its own command, and never leave the shell in a different directory afterwards. If any fails, STOP and report in plain English. Do not fix it.

## 5. Integration review
- Review everything since the last version tag (`git diff <last tag>..HEAD`), focused on how the changes interact with each other: conflicting assumptions, one change undoing or bypassing another, shared code or data touched by more than one change, migrations that depend on each other. Each change was already reviewed on its own, so do not repeat that.
- Use /code-review for the diff, and add your own look at the interactions.
- Present every finding with a severity, a one-line plain-English description, and the files involved. Every finding ends in one of three places: fixed (through a new change), explained (wrong, by design, or a pure observation, with the reason), or logged in KNOWN_ISSUES.md (also through a new change, since the build edits nothing). Nothing is left unaccounted for.
- If it finds a problem, STOP the build. Tell the user the fix goes through the normal workflow (`/plan-change`) as a new change, and that they can run `/build-changes` again afterwards. The build never fixes code itself. If there are no problems, say so and continue.

## 6. Make the version
- Create the branch `build/vX.Y.Z` from the default branch.
- In `CHANGELOG.md`, move the Unreleased entries under a new heading `## [X.Y.Z] - <today's date>`, leaving an empty `## [Unreleased]` above it.
- Set the version in the version files that hold it directly (everything under "Version files" in CLAUDE.md except the lockfiles).
- Regenerate the lockfiles with the tools, never by hand: `npm install --package-lock-only`, and `cargo check --manifest-path src-tauri/Cargo.toml`. Confirm that the lockfiles now show the new version for this app, and that nothing else in them changed beyond what those commands did.
- Commit everything on the branch with the message `chore(release): vX.Y.Z`.
- Switch to the default branch and merge with `git merge --no-ff build/vX.Y.Z`, using the message `chore(release): vX.Y.Z`. If the merge conflicts, run `git merge --abort`, STOP, and tell the user.
- Push the default branch. If the push is rejected, STOP and tell the user in plain English. Do not force-push.
- Only after the push succeeds, delete the branch with `git branch -d` (never `-D`).

## 7. Tag
Tag the default branch `vX.Y.Z` (an annotated tag, message `vX.Y.Z`) and push the tag.

## 8. Build the installer
Run the build command from CLAUDE.md. Report the installer location (for a Tauri build, under `src-tauri/target/release/bundle/`) and the file names. If the build fails, say so plainly. The version and tag are already published at this point, so tell the user the fix goes through the normal workflow and the next build makes a new version.

## 9. Migrations
List every line in this version's changelog entries that says a migration is required (for example "Migration 027 required."). If there are any, remind the user to Export All and back up the database file before running them, and that the app won't start against the database until they are run. If there are none, say so.

## Never
- Create a change number, plan or review record for a build.
- Edit code, or fix a problem the checks or the review found.
- Edit anything under `data/` or run anything against it.
- Force-push, or push any branch other than the default branch and the tag.
- Make a version in any other way. A check-in never does.
