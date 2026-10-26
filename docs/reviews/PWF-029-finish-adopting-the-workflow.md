# Review: PWF-029 — Finish adopting the workflow in ProjectWorkflow
- **Change:** PWF-029
- **Level:** Light
- **Plan:** docs/plans/PWF-029-finish-adopting-the-workflow.md
- **Reviewers:** Matt's code-review (a Standards reviewer and a Spec reviewer); one fresh re-reviewer

## Findings
- **[Low]** The PowerShell recipe appears in three CLAUDE.md bullets (Checks, Trunk lock, Adopt) — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** keep one PowerShell note and have the other bullets refer to it.
  **Outcome:** explained (the plan's R6 requires a PowerShell form next to each bash command; the two later bullets only point back to Checks for the `$bash` setting, so it is set in one place)
  **Re-review:** accepted

- **[Nit]** "off and status are typed exactly as above" was terse and could suggest `git config` needs `$bash` — CLAUDE.md, Trunk lock line
  **Caused by this change:** yes
  **Recommendation:** say why those two need no change.
  **Outcome:** fixed (the line now names `git config --unset core.hooksPath` and `node ...` and says they don't use bash)
  **Re-review:** accepted

- **[Informational]** The new test-adopt.sh case had no "why" comment for its small fixture — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** add one line saying why the fixture holds only those files.
  **Outcome:** fixed (comment added: adopt.sh reads only CLAUDE.md and the setup file, and needs a git repo)
  **Re-review:** accepted

- **[Nit]** The new fixture repeats the git init and commit lines used earlier in test-adopt.sh — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** reuse a helper if one exists.
  **Outcome:** explained (two lines used twice; a helper would be generality nobody asked for)
  **Re-review:** accepted

- **[Informational]** POLICY.md's new step 4 and the Committing section agree with CLAUDE.md — docs/POLICY.md
  **Caused by this change:** yes
  **Recommendation:** none, noted as consistent.
  **Outcome:** explained (nothing to change; a consistency check, not a problem)
  **Re-review:** accepted

- **[Low]** The PowerShell forms hard-code `C:\Program Files\Git\bin\bash.exe`, which fails with a non-default Git install — CLAUDE.md, Checks
  **Caused by this change:** yes
  **Recommendation:** say it is the usual place and where to change it.
  **Outcome:** fixed (the line says it is Git for Windows' usual place and to change the path if Git is installed elsewhere)
  **Re-review:** accepted

- **[Informational]** POLICY.md "Settling findings" keeps "A failed requirement test is not a reviewer finding; it can only be fixed", which the plan's edit 5 text did not include — docs/POLICY.md
  **Caused by this change:** yes
  **Recommendation:** none, or record it as a deviation.
  **Outcome:** explained (it carries over a rule from the old text that is still true; recorded under Deviations)
  **Re-review:** accepted

- **[Nit]** CLAUDE.md gained a new "Adopt the workflow in another project" bullet rather than a line next to an existing adopt.sh line — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** none; it is the only place for it.
  **Outcome:** explained (R6 requires an adopt.sh PowerShell form and CLAUDE.md had no adopt.sh line to put it next to)
  **Re-review:** accepted

- **[Informational]** `docs/agents/triage-labels.md` and its CLAUDE.md block were added though R1 and R2 name only two files — docs/agents, CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** none.
  **Outcome:** explained (the triage skill is installed and Jason answered yes to the default labels in Matt's setup, which writes that file)
  **Re-review:** accepted

- **[Informational]** POLICY.md's "Branch commits stay on your computer; they aren't pushed" is consistent with the new check-in wording — docs/POLICY.md
  **Caused by this change:** no
  **Recommendation:** none.
  **Outcome:** explained (nothing to change)
  **Re-review:** accepted

- **[Nit]** POLICY.md's Depth paragraph omits "each kept short" for the Light reviewers, which `docs/workflow-v2.md` has — docs/POLICY.md
  **Caused by this change:** no
  **Recommendation:** add the phrase in a later change.
  **Outcome:** moved to backlog
  **Re-review:** accepted

- **[Nit]** The Adopt line says to use forward slashes but gave no reason (found by the re-review) — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** give the reason.
  **Outcome:** accepted by Jason (the reason "because bash reads a backslash as an escape" was added after the re-review and was not checked by a further reviewer)
  **Decided by:** Jason

- **[Nit]** The hard-coded Git path is still one assumed path (found by the re-review) — CLAUDE.md, Checks
  **Caused by this change:** yes
  **Recommendation:** none beyond the wording already added for the Low finding above.
  **Outcome:** accepted by Jason
  **Decided by:** Jason

## Re-review
The re-reviewer accepted every outcome above and raised the two Nits at the end, so the round was not clean. Jason accepted both.
**Re-review clean:** no
**Decided by:** Jason

Two fixes were made after the re-review, authorised by Jason while he checked R5, and not checked by a further reviewer:
- POLICY.md "Peer review", Record paragraph: restored "Every finding is recorded, whatever its disposition; the record shows what was checked and decided, not just what was changed", and that the record lists deviations from the plan and ends with a short summary. Both had been dropped by edit 5.
- POLICY.md "Committing", check-in bullet: it said "Nothing is pushed until the user says so", but `/merge-change` pushes the default branch itself (and stops without force-pushing if the push is rejected). Claude changed POLICY.md to match the skill: the bullet now says `/merge-change` merges with `--no-ff`, pushes the default branch, and removes the worktree and branch, and stops if the push is rejected. The skill was not changed.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Manual: `docs/agents/` holds `issue-tracker.md` (local markdown), `domain.md` and `triage-labels.md`, byte-identical to Matt's seed files (the Standards reviewer also checked this) | Pass (checked by Jason) |
| R2 | Manual: CLAUDE.md differs from the plan commit only by the Agent skills block, the PowerShell lines and the Records line (the Spec reviewer also checked this) | Pass (checked by Jason) |
| R3 | New `test-adopt.sh` case runs adopt.sh on a project holding this repo's own CLAUDE.md and `docs/agents/issue-tracker.md` and expects "Done"; 10 passed, 0 failed | Pass |
| R4 | grep: `/plan-change` and `/commit-change` appear 0 times in `docs/POLICY.md`; `/design-change` 3, `/plan-small-change` 3, `/plan-large-change` 3, `/code-change` 5, `/merge-change` 2, `/build-changes` 2 | Pass |
| R5 | Manual: Peer review reads against `docs/workflow-v2.md` (Light/Full by merge danger, one narrow re-review, no `Review format` marker, user decides disputes), re-read after the two post-re-review fixes | Pass (checked by Jason) |
| R5a | grep for "by hand", "Policy edits for you" in CLAUDE.md and `docs/POLICY.md`: none except CLAUDE.md line 23 "PWF-028 was built by hand" (history on a lock setting line, left alone on purpose). `hooks/block-main-edits.sh` has no rule naming POLICY.md; the guard test (9 passed) covers edits on a branch | Pass |
| R6 | Manual: run in PowerShell by Claude: `$bash` with the three bash checks (37, 9 and 9 tests passed), `claude plugin validate .`, and `node githooks/trunk-lock-check.mjs status` (same output as in bash). The lock-install and adopt forms change settings; Jason ran both in PowerShell and `adopt.sh` ended with "Done" | Pass (checked by Jason) |
| R7 | The four checks from CLAUDE.md, each run as its own command: trunk lock 37 passed; guard 9 passed; adopt 10 passed; `claude plugin validate .` passed with the expected warnings | Pass |

## Deviations from the plan
- `docs/POLICY.md` "Rules for plans and skills" rule 4 (the "Policy edits for you to make by hand" rule) was removed. It was not on the plan's edit list, and R5a could not pass with it in place. Accepted by Jason.
- The "When to stop and ask the user" paragraph in POLICY.md Peer review was rewritten to three cases (it still described rounds). It was not on the plan's edit list. Accepted by Jason.
- Edit 4's check-in wording ("Nothing is pushed until the user says so") and edit 5's Record paragraph were changed after the re-review, as described under Re-review.
- "editing CLAUDE.md by hand" in POLICY.md's Committing section was reworded to "changing CLAUDE.md directly", so that R5a's search comes out clean.
- The sentence "A failed requirement test is not a reviewer finding; it can only be fixed." was kept in Settling findings; edit 5's text did not have it.
- `test-adopt.sh` gained a case (R3). The plan named it as the test, so this is not a scope change.
- R5a's search matches CLAUDE.md line 23, "PWF-028 was built by hand". It was left alone on purpose.
- The guard blocked writing a temporary helper script to the scratch folder (it judges the session's own branch, not the file's folder; this is an existing backlog item), so the script was run from inside the worktree and deleted.

## Summary
Matt's setup is in place (local markdown tracker, default labels, single-context), POLICY.md and CLAUDE.md describe the new commands and review, and CLAUDE.md has PowerShell forms checked from PowerShell. The review found no High or Medium findings; the re-review accepted every outcome and raised two Nits, which Jason accepted.
