# Review: PWF-002 — Finish the workflow

- **Change:** PWF-002
- **Plan:** docs/plans/PWF-002-finish-the-workflow.md (approved in commit 84ef530)
- **Branch:** chore/PWF-002-finish-the-workflow
- **Reviewer:** /code-review (medium effort), findings decided by the user
- **Scope:** diff of chore/PWF-002-finish-the-workflow against master — 9 files changed (CLAUDE.md, three workflow skills, the new build-changes skill, two hooks, KNOWN_ISSUES.md, the plan), about 290 lines

## Findings
- **[Low]** CLAUDE.md's check commands are written `cd src-tauri && cargo test`, which leaves the shell inside `src-tauri` if run literally and contradicts the skills' "never leave the shell in a different directory" rule — `CLAUDE.md`
  **Disposition:** explained. The approved plan gives those exact commands, and fixing it would go against the plan. The skills already tell Claude to run each check as its own command without leaving the shell in another directory, so the instruction and the rule agree in practice.
- **[Informational]** The post-plan-mode hook in `settings.json` uses a path relative to the shell's directory — `.claude/settings.json`
  **Disposition:** explained. This line is not part of the diff, and the hook does nothing while plan mode is blocked; that is already recorded in KNOWN_ISSUES.md (PWF-001).
- **[Medium]** The catch-up merge will conflict in CHANGELOG.md's Unreleased section whenever two changes are in flight, and the skill stops each time — `.claude/skills/commit-change/SKILL.md`
  **Disposition:** logged in KNOWN_ISSUES.md. The approved plan says to stop and ask on any conflict, so automatic handling would go against it.
- **[Medium]** After the default branch is merged in, "the first commit on this branch" can point at a commit from the default branch, so the plan-untouched check could use the wrong baseline — `.claude/skills/commit-change/SKILL.md`, `.claude/skills/code-change/SKILL.md`
  **Disposition:** fixed. All three plan-diff checks now name the commit whose message is `docs(<NUMBER>): approved plan` as the baseline.
- **[Low]** `/build-changes` finds the latest tag without sorting by version and has no handling for a missing tag — `.claude/skills/build-changes/SKILL.md`
  **Disposition:** fixed. It sorts tags by version (`--sort=-v:refname`) and stops to ask where the review should start if no tag exists.
- **[Medium]** A failed tag or tag push after the merge leaves an untagged release that a re-run would call "nothing to build", and a leftover `build/vX.Y.Z` branch blocks every later build — `.claude/skills/build-changes/SKILL.md`
  **Disposition:** fixed. A failed tag stops with a plain explanation. A re-run with an empty Unreleased section checks for a version heading without a tag and, with the user's OK, resumes at the tag step. A leftover build branch is named as an interrupted build, and the build stops for the user to decide.
- **[Low]** The rename script treats any capitalized word plus three digits as a change number — `.claude/hooks/rename-plan.sh`
  **Disposition:** explained. Recognizing any prefix is what the plan asks for, and reading the prefix from CLAUDE.md would replace that rule. The hook is also inert while plan mode is blocked.
- **[Low]** Step 6 of `/build-changes` doesn't re-run the checks after the version bump, and "confirm nothing else changed" in the lockfiles is vague — `.claude/skills/build-changes/SKILL.md`
  **Disposition:** the lockfile comparison is fixed: each lockfile is diffed against the default branch, only this app's own version lines may differ, and anything else stops the build before anything is committed. The re-run of checks was declined by the user to keep the plan's step order; this is not logged as a limitation.

## Deviations from the plan
None in what was built. Two points where the written skills go slightly beyond the plan's text, both from approved review fixes: `/build-changes` can resume at the tag step after an interrupted build and stops on a leftover build branch, and the plan-untouched check uses the approved-plan commit as its baseline. The plan file itself is unchanged since its approval.

## Summary
CLAUDE.md now carries the checks, build command and version files, and the three workflow skills read the default branch, prefix and checks from it instead of naming them. Code review has the two new rules word for word, and the review record's dispositions are now fixed, explained or logged. The plan-change interview uses the question box. `/commit-change` catches the branch up by merging, never rebasing, and re-runs the checks. The new `/build-changes` skill follows the nine steps, with the lockfile regeneration and `chore(release): vX.Y.Z` commit message. The rename script accepts any prefix and was tested by hand against `TD-001`, `PWF-002`, an unnumbered heading, a headingless file and an already-named file. All the checks passed before and after the review fixes. One limitation is logged in KNOWN_ISSUES.md.
