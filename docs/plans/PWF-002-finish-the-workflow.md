# PWF-002 — Finish the workflow

- **Change:** PWF-002
- **Date:** 2026-10-23

## What you'll see change
Nothing in the app. This changes the workflow tooling only.

- The workflow steps no longer hard-code this project's branch name, change prefix or commands. They read the default branch, change prefix, checks, build command and version files from a list in the project's guide, so the same steps can be reused in another project.
- Code review gets two new rules. Every finding must end up fixed, explained (with the reason), or written into the known-issues file, so nothing is left unaccounted for. And if a proposed fix would go against the approved plan, the finding is flagged with the plan's exact words before you decide, and nothing is done against the plan without asking you.
- Planning interviews now use the question box: one question per box, with the recommended answer as the first option.
- A new command, `/build-changes`, that only you can start. It turns everything waiting under "Unreleased" into a numbered version: it checks the repository is clean and in sync, lists the entries, proposes a version and waits for your OK, runs all the checks, reviews how the changes interact, then sets the version, merges, tags, builds the installer and reminds you about any migrations. A build has no change number, plan or review record, and it never fixes code itself. If its review finds a problem, the build stops and the fix goes through the normal workflow as a new change.
- When you check in a change, the branch is first brought up to date with the default branch if the default branch has moved on. Any conflict stops and asks you. All checks run again on the combined code, and any code changed while resolving a conflict is reviewed and recorded.
- Plan files with other change prefixes (for example `TD-001`) are now renamed correctly, not just `DTP`.
- The message shown when an edit is blocked on the default branch no longer names `master`.

## What could go wrong / what gets lost
Nothing is lost, and there is no migration. The risk is a mistake in the new steps, which would show up the next time a change is planned, coded or checked in, or when the first build runs. The first `/build-changes` also moves a pile of waiting entries into a version and corrects the out-of-date version in the npm lockfile, so read its proposed version and entry list before you approve.

## Not included
- No change to how the app works, no schema change, no change to anything in `data/`.
- The edit-blocking hook is not made to read the branch name from the project guide. It keeps blocking both `master` and `main`, and only its message is reworded.
- No full build is run as part of this change. `/build-changes` is written but not used until you start it.
- The old plans, review records and the shared policy file are not edited.

## How you'll check it
1. Open the project guide and confirm the Workflow section lists the checks (all must pass), the checks that apply only when relevant, the build command and the version files (including both lockfiles).
2. Read the three workflow skills and confirm none of them names `master`, `DTP` or a specific check command, and that the two review sentences appear word for word in the review step.
3. Start `/plan-change` on a tiny change and confirm the interview uses the question box, one question per box, recommended answer first.
4. Read the new `/build-changes` skill and confirm it follows your nine steps in order, uses `chore(release): vX.Y.Z` for its commits, regenerates the lockfiles with the tools, and never edits code.
5. Try the plan-file renaming with a name like `TD-001 — Example` and confirm it becomes `TD-001-example.md`.
6. On the next real change, confirm `/commit-change` mentions the catch-up step and skips it when the default branch has not moved.

## Check-in
- Type: chore
- Branch: chore/PWF-002-finish-the-workflow
- Commit message: chore(PWF-002): make the workflow project-neutral, add review rules, /build-changes and a catch-up merge

---

## Technical detail (for Claude)
No Rust, frontend, migration or app-test changes, so the CLAUDE.md feature cycle does not apply. All edits are to workflow files and docs. Edits happen on the branch, so the master-edit hook allows them.

**1. CLAUDE.md — Workflow section.** Keep the existing lines (default branch, change prefix, commands, records, guard, real data). Add:
- **Checks (all must pass):** `cd src-tauri && cargo test`; `cargo clippy --all-targets -- -D warnings`; `cargo fmt --check`; and from the repo root `npm run lint`; `npm run build:vite`.
- **Checks (only when relevant):** `npm run test:pdf` when the itinerary or PDF changed.
- **Build command:** `npm run build`.
- **Version files:** `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `package-lock.json`, `src-tauri/Cargo.lock`. The two lockfiles are regenerated with the tools, never hand-edited.
- Update the "Commands" line to list `/build-changes` (user-only), and the changelog/records wording if needed.
- The existing code-change step 5 note about not `cd`-ing into `src-tauri` without a subshell is kept as a general rule: run each check as its own command from the repo root, using a subshell or `--manifest-path` for the Rust ones. The CLAUDE.md list gives the commands as the user wrote them; the skill says "run the checks from CLAUDE.md, each as its own command, without leaving the shell in a different directory."

**2. `.claude/skills/plan-change/SKILL.md`.**
- Remove the `/code-change` wording that names nothing project-specific already; replace `DTP` examples with "for example `ABC-085`" or read-from-CLAUDE.md wording. Remove "`DTP-084`" style examples, or keep them clearly labelled as examples using a neutral prefix.
- Interview rule: ask each question with the question-box tool (AskUserQuestion), exactly one question per box, the recommended answer as the first option labelled "(Recommended)". This replaces the old "never use a multiple-choice question tool that shows several questions at once" sentence; the one-question-per-message rule stays.
- Plan-file example paths use a neutral example prefix.
- Branch and commit examples stay generic.

**3. `.claude/skills/code-change/SKILL.md`.**
- Replace "This repo's default branch is `master`" and every `master` mention with "the default branch (from CLAUDE.md)". Replace "for example `DTP-085`" examples.
- Step 5: "Run every check under 'Checks (all must pass)' in CLAUDE.md, plus every check under 'Checks (only when relevant)' that applies. Run each as its own command, and never leave the shell inside a different directory."
- Step 6 (review): add, word for word:
  - "Every finding ends in one of three places: fixed, explained (wrong, by design, or a pure observation, with the reason), or logged in KNOWN_ISSUES.md. Nothing is left unaccounted for."
  - "If a proposed fix would go against the approved plan, mark it in the findings list with the plan's exact words before the user decides, and never act against the plan without asking."
- Step 7 and step 9: the review record's disposition options become fixed, explained (with reason) or logged in KNOWN_ISSUES.md, replacing "declined by user | not a real problem". A finding the user declines to fix that is a real limitation is logged in KNOWN_ISSUES.md; one that is wrong, by design or an observation is explained. Update the record template and the "KNOWN_ISSUES.md" bullet accordingly. (The shared policy's wording "fixed, declined by the user, or not a real problem" is left alone; the project skill is stricter.)
- Step 9 CHANGELOG instructions: unchanged (Unreleased, never a version heading).

**4. `.claude/skills/commit-change/SKILL.md`.**
- Same neutralising: default branch from CLAUDE.md, no `master`/`DTP` literals.
- New step between "Read the decisions" and "Merge and publish", **Catch up with the default branch**:
  - Fetch. If the default branch has commits the working branch doesn't (`git log HEAD..<default> --oneline` is non-empty), bring the branch up to date by **merging the default branch into the working branch, never rebasing**, so the approved-plan commit keeps its hash.
  - On any conflict: `git merge --abort`, STOP, and ask the user in plain English.
  - After a clean merge, run all checks again (same list as code-change step 5) on the combined code; if any fail, STOP and report.
  - If resolving a conflict changed code (only possible after the user decided on a conflict and told the skill how to continue), review those changes and add them to the change's review record. This is the one place `/commit-change` writes to the record; the "Never" list gets an explicit exception for it. Because the plan stays untouched, re-confirm the plan diff is empty after the merge.
  - A clean merge with no conflicts changes no records.
- The existing step-1 check that the default branch matches `origin/<default>` stays first, so the catch-up compares against a default branch that equals GitHub.
- Merge-and-publish step: the final merge into the default branch should now be a fast-forwardable merge, still done with `--no-ff` using the plan's commit message.

**5. New `.claude/skills/build-changes/SKILL.md`** (front matter `disable-model-invocation: true`, name `build-changes`, description saying it is user-only, run after check-ins, never part of a change). Steps, in order, stopping where stated:
1. Safety checks: on the default branch, working tree clean, default branch equals `origin/<default>` after a fetch, no other local branches. STOP if not.
2. List every entry under `## [Unreleased]` in `CHANGELOG.md`. STOP if none.
3. Propose the version: minor if any entry is `(feat)`, otherwise patch, from the highest existing version heading / latest `v*` tag. Wait for the user's OK; the user may change it.
4. Run all checks from CLAUDE.md (all-must-pass, plus relevant ones; run `test:pdf` if anything in the range touched the itinerary or PDF). STOP on failure.
5. Integration review of everything since the last `v*` tag (`git diff <tag>..HEAD`), focused on how the changes interact, not on each change alone (earlier per-change reviews already covered those). Report findings. If it finds a problem, STOP the build; the fix goes through the normal workflow as a new change; the build never edits code itself. The skill applies the same three-outcome finding rule.
6. Create branch `build/vX.Y.Z` from the default branch. Move the Unreleased entries under a new heading `## [X.Y.Z] - <today>` (leaving an empty `## [Unreleased]`), and set the version in every file listed under "Version files" in CLAUDE.md. For the lockfiles: after setting the version in the manifest files, regenerate them with the tools — `npm install --package-lock-only` and `cargo check --manifest-path src-tauri/Cargo.toml` — never by hand. Commit it all on the branch as `chore(release): vX.Y.Z`. Merge into the default branch with `--no-ff` using the same message, and push. Delete the branch only after the push succeeds, with `-d`.
7. Tag `vX.Y.Z` on the default branch and push the tag.
8. Run the build command from CLAUDE.md and report the installer location (found under `src-tauri/target/release/bundle/`).
9. List every "Migration required" / "Migration NNN required" line among the entries in this version, with the reminder to Export All and back up the database file first.
Rules: no change number, plan or review record for a build; never force-push; never run anything against `data/`; the master-edit hook does not block the work because it happens on `build/vX.Y.Z`. Also state that CHANGELOG release edits happen only here.

**6. `.claude/hooks/rename-plan.sh`.** Recognize any prefix: the "already named" case becomes `[A-Z]*-[0-9][0-9][0-9]-*`; the heading test becomes `^[A-Z]+-[0-9]{3}`; extracting the number uses `grep -oE '^[A-Z]+-[0-9]{3}'`; stripping the number from the slug uses `s/^[a-z]+-[0-9]{3}-?//`. Date-named files start with a digit, so they cannot match. Update the header comment to use a neutral example (`TD-001`). Verify by running the script against temp plan files (`TD-001`, `PWF-002`, a headingless one) in the scratchpad.

**7. `.claude/hooks/block-main-edits.sh`.** Change only the error message to say "the default branch" instead of naming `master`. The `master`/`main` check stays.

**8. Records.** CHANGELOG entry at the top of Unreleased: `- PWF-002 (chore) Finished the workflow: project-neutral skills, stricter review rules, a catch-up merge at check-in, and a new /build-changes command.` Review record at `docs/reviews/PWF-002-finish-the-workflow.md`. CLAUDE.md is updated as described in part 1. README is not affected. KNOWN_ISSUES.md gets an entry only if a review finding calls for one.

**Tests / checks.** There is no app code, so the Rust and frontend checks will run unchanged as a sanity check (expected to pass untouched). The rename-plan script is verified by hand as in part 6. The skills are verified by reading them against this plan.
