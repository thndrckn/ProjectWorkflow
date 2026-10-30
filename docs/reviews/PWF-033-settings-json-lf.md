# Review: PWF-033 — Keep the plugin settings file's line endings the same as the install writes them
- **Change:** PWF-033
- **Level:** Light
- **Plan:** docs/plans/PWF-033-settings-json-lf.md
- **Reviewers:** mattpocock-skills:code-review (Standards and Spec) and one fresh re-reviewer

## Findings
- **[Medium]** A `.gitattributes` whose lines end in Windows line endings (what git makes of it on this machine) might not match `adopt.sh`'s exact-line check, so the rule would be added again on every run — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** Strip the carriage returns before matching.
  **Outcome:** fixed (the check reads the file through `tr -d '\r'`; a test with the rule already present and Windows-ended was added, in af223bf. That test also passes without the fix on this machine, because Git for Windows' `grep` ignores a trailing carriage return, so it cannot fail here; the change is for other platforms)
  **Re-review:** accepted
- **[Low]** The tests only looked for the word "commit" in `adopt.sh`'s output, so they did not prove the message says the file needs committing — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** Match the actual sentence.
  **Outcome:** fixed (the tests look for "That file needs committing", in af223bf)
  **Re-review:** accepted
- **[Low]** The plan's R3 covers a last line "with or without a final newline", but only the no-newline case was tested — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** Test the other case too.
  **Outcome:** fixed (a Windows-ended file whose last line ends in a newline: the rule is added once, the project's own line is kept, a second run adds nothing, in af223bf)
  **Re-review:** accepted
- **[Informational]** The `CLAUDE.md` Rules line was edited, and the plan lists no `CLAUDE.md` change — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (it is documentation that follows from the change; listed under Deviations)
  **Re-review:** accepted
- **[Informational]** The rule is added before the plugin installs, so a later stop (for example Matt's setup missing) still leaves `.gitattributes` changed, with the "needs committing" message printed — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (the file is correct either way and the message is true)
  **Re-review:** accepted
- **[Nit]** The rule string repeats in `adopt.sh`, `test-adopt.sh` and `.gitattributes`, and the test comment labels (R1 to R7) refer to the plan without saying so — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (the test repeats the string on purpose, so it fails if the real one drifts; the plan is in the repo)
  **Re-review:** accepted

## Re-review
**Re-review clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | test-adopt.sh: this repo's `.gitattributes` has the line, and `git check-attr` reports text set and eol lf for `.claude/settings.json` | Pass |
| R2 | test-adopt.sh: a project with no `.gitattributes` gets one holding the line | Pass |
| R3 | test-adopt.sh: the project's own lines are kept (last line with and without a newline, Windows endings), the line is added once, a second run changes nothing | Pass |
| R4 | test-adopt.sh: the output says "That file needs committing" when the file changed, and says nothing about it when it did not | Pass |
| R5 | test-adopt.sh: with git converting line endings, an install that rewrites the file with plain endings leaves `git status` empty; the test fails (dirty status) when the rule is taken out of `adopt.sh` | Pass |
| R6 | All four CLAUDE.md checks (43 lock, 16 guard, 44 adopt tests; plugin validation with only the known notes); `git diff trunk -- githooks` is empty | Pass |
| R7 | Second half automated in test-adopt.sh (file checked out with Windows endings, rule added, re-checked-out: plain endings and clean status). First half after the merge, in the main folder: re-check-out the file once, then read `git status --short` and `git ls-files --eol .claude/settings.json` | Manual |

## Deviations from the plan
- `CLAUDE.md`'s Rules line gains a mention of `.claude/settings.json` and of what `adopt.sh` does; the plan lists no `CLAUDE.md` change.
- The branch carries no commit for the `git add --renormalize` Jason asked for, as the plan says: the stored copy is already plain endings, so it changes nothing (tested). R7's re-checkout after the merge does that job.
- The real `claude plugin install` was checked by hand in throwaway repos while planning (without the rule git lists the file as modified, with the rule it is clean); the automated tests use the stand-in `claude`.

## Summary
The `.claude/settings.json` file is now always plain line endings in this repo, and `adopt.sh` adds the same rule to the project it sets up, so a fresh plugin install leaves `git status` clean. Review found one Medium issue (a Windows-ended `.gitattributes` could get the rule added repeatedly) and two test gaps, all fixed and accepted on re-review.
