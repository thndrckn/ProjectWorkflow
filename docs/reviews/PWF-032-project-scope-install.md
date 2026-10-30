# Review: PWF-032 — Install the workflow's plugins per project, not for every project
- **Change:** PWF-032
- **Level:** Full
- **Plan:** docs/plans/PWF-032-project-scope-install.md
- **Reviewers:** mattpocock-skills:code-review (Standards and Spec), a fresh Correctness reviewer, and one fresh re-reviewer

## Findings
- **[Medium]** `adopt.sh` accepted a project whose CLAUDE.md had the four setting lines but no Workflow heading, while the guard now stays off without that heading, so such a project would get plugins that silently do nothing — adopt.sh, hooks/adopted.sh
  **Caused by this change:** yes
  **Recommendation:** Make `adopt.sh` require the same heading, using the shared check, and let the heading have text after the word.
  **Outcome:** fixed (`adopt.sh` sources `hooks/adopted.sh` and stops without the heading; the pattern now allows "## Workflow: rules" and Windows line endings; tests added in both test files, in c354c7a)
  **Re-review:** accepted
- **[Medium]** The stop for Matt's official copy only saw user-scope installs and this project's own, so a copy installed for another project or at another scope no longer stopped the run (the plan's R5 says "same as before") — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** List the official copy at every scope.
  **Outcome:** fixed (the listing also prints any `@claude-plugins-official` plugin at any scope; test added, in c354c7a)
  **Re-review:** accepted
- **[Low]** A plugin list that failed or could not be read was treated as "nothing installed", so plugins were reinstalled each run and the official-copy stop was skipped, silently — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** Stop with a clear message instead.
  **Outcome:** fixed (`adopt.sh` stops with "could not read the plugin list"; test added, in c354c7a)
  **Re-review:** accepted
- **[Low]** The tests only used a self-consistent spelling of the project folder, so the case and slash handling of the folder comparison was untested — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** Test a Windows-style spelling.
  **Outcome:** fixed (the stand-in `claude` can spell folders with backslashes and capitals; a test adopts twice and expects no reinstall, in c354c7a)
  **Re-review:** accepted
- **[Informational]** It is not confirmed that a git worktree of an adopted project (a different folder) loads the project-scope plugins. This repo's own change flow works in worktrees — adopt.sh, .claude/settings.json
  **Caused by this change:** yes
  **Recommendation:** One manual check by Jason.
  **Outcome:** explained (it cannot be tested with a stand-in; the committed `.claude/settings.json` enables both plugins in any checkout of this repo; it is a Manual row in the trace below)
  **Re-review:** accepted
- **[Low]** Installs at `local` scope are ignored: not counted as installed and not removed — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (the workflow uses user and project scope only, which is all the plan covers)
  **Re-review:** accepted
- **[Informational]** If removing a user-scope copy fails, `adopt.sh` stops before switching the lock on — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (both project installs are already in, nothing is lost, and `adopt.sh` is safe to run again)
  **Re-review:** accepted
- **[Nit]** Style points: two similar plugin loops in `adopt.sh`, repeated folder-spelling code in the tests, a short variable name in the stand-in, a longer comment than the file's usual — adopt.sh, test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (the two loops are separate on purpose, because every install must succeed before any removal; the rest is test-only and small)
  **Re-review:** accepted

## Re-review
**Re-review clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | test-adopt.sh: both plugins installed at project scope for the project, no install at user scope | Pass |
| R2 | test-adopt.sh: running again installs nothing twice; a Windows-spelled folder is recognised | Pass |
| R3 | test-adopt.sh: a second project is adopted on its own although the first has the plugins and user-scope copies exist | Pass |
| R4 | test-adopt.sh: no removal when no user-scope copy exists; user-scope copies removed after the project installs; no removal when the project install fails or the list is unreadable | Pass |
| R5 | test-adopt.sh: stops for an official copy at user scope and at project scope elsewhere, installing nothing | Pass |
| R6 | test-block-main-edits.sh: edits on trunk and plan mode allowed with no CLAUDE.md, no Workflow section, and a sentence that only mentions the word | Pass |
| R7 | test-block-main-edits.sh: all earlier guard cases, plus "Workflow: ..." with Windows line endings, still blocked | Pass |
| R8 | `git diff trunk -- githooks` is empty; the lock tests (43) pass | Pass |
| R9 | `.claude/settings.json` committed; both `--scope project` installs run in the worktree left `git status` clean and changed no tracked file (uninstalling does empty the file, so it was restored from git) | Pass |
| All four CLAUDE.md checks | 43 lock, 16 guard, 32 adopt tests; plugin validation with only the known notes | Pass |
| Not automated: real `adopt.sh` run on a throwaway project, then `claude plugin list` | Jason's commands from the planning chat, run from this repo's root after the merge | Manual |
| Not automated: a worktree of an adopted project loads the plugins | Open Claude Code in a worktree of an adopted project and check `/plugin` | Manual |

## Deviations from the plan
- `adopt.sh` also refuses a project with no Workflow heading, stops on an unreadable plugin list, and counts Matt's official copy at every scope. None of these are in the plan; they came out of review and keep R5 and R6 true in practice.
- R9 was checked in this change's worktree, not the repo root, because the root is on trunk until the merge. The result is the same file either way.
- The plan was amended once after approval (R9, commit 93fdc0b), at Jason's request.
- `CLAUDE.md` has three small edits (the Guard line, a new Plugins line, the Adopt line) and `hooks/adopted.sh` is a new shared file; both follow from the plan.

## Summary
`adopt.sh` now installs both plugins for the adopting project only and removes the all-projects copies, and the guard does nothing in a project with no Workflow section; the lock is unchanged and this repo's own plugin settings are committed. Review found four issues (a heading mismatch, the official-copy check, an unreadable list, and an untested path spelling), all fixed and accepted on re-review.
