# Review: PWF-003 — Requirements and a trace table

- **Change:** PWF-003
- **Plan:** docs/plans/PWF-003-requirements-and-trace-table.md (approved in commit 3ee69f9)
- **Branch:** chore/PWF-003-requirements-and-trace-table
- **Reviewer:** /code-review (medium effort), findings decided by the user
- **Scope:** diff of chore/PWF-003-requirements-and-trace-table against master — 4 files changed (the plan-change and code-change skills, the plan, the saved original `docs/reviews/PWF-003-POLICY-before.md`), about 360 lines. Also reviewed: the before/after comparison of the shared `D:/projects/shared-claude-conventions/POLICY.md` (outside git) against its saved copy `docs/reviews/PWF-003-POLICY-before.md`. The comparison shows two added sentences and nothing else. `PROCESS_BACKLOG.md` (also outside git) was edited too and has no saved copy: the plan listed it, but only POLICY.md was given one.

## Findings
The reviewer's output carried no severity labels. Every severity below was assigned by Claude when the findings were presented, so there is no original reviewer severity to compare against and none was adjusted afterwards.

- **[Low]** The new trace-result bullets sit in step 7, after the review has stopped for the user's decisions, so a Fail found there had no place to be shown to the user — `.claude/skills/code-change/SKILL.md`
  **Disposition:** fixed. A Fail found in step 7, automated or checked by Claude, is now shown to the user as in step 6, and the step stops until they decide.
- **[Nit]** A blank line split the step 7 list, so the trace bullets read as a separate block — `.claude/skills/code-change/SKILL.md`
  **Disposition:** fixed. The blank line was removed.
- **[Low]** R6 in the plan names a file path, but the new rule says requirements contain no file paths — `docs/plans/PWF-003-requirements-and-trace-table.md`
  **Disposition:** explained. The plan is approved and frozen, so fixing it would go against document control. It is recorded under Deviations. Plans written from now on follow the rule.
- **[Low]** A plan written before this change has no Requirements section, and `/code-change` has no fallback for it — `.claude/skills/code-change/SKILL.md`
  **Disposition:** explained. The plan's "Not included" says old plans are not retrofitted, and no other plan is in flight, so nothing is affected today.
- **[Low]** Nothing enforces that the copy of an outside-git file is saved before the edit, and the rule commits it only with the records at step 9 — `.claude/skills/code-change/SKILL.md`
  **Disposition:** explained. The plan says "commit it on the branch with the records", so fixing it would go against the plan. In this change the copy was saved before the edit and committed in the first work commit; the comparison against the current POLICY.md confirms it is the original. Added to the process backlog as item 9.
- **[Nit]** The review-record template has no field for what the before/after comparison found — `.claude/skills/code-change/SKILL.md`
  **Disposition:** explained. The plan only asks for the Scope line to name the file, and a problem found by the comparison already goes through the normal findings list.
- **[Informational]** A "Manual" row stays "Manual" in the committed record, so a later reader can't tell whether the user ran it — `.claude/skills/code-change/SKILL.md`
  **Disposition:** explained. Recording the user's manual results is excluded by the plan's "Not included". Added to the process backlog as item 7 in the same set of left-out pieces.
- **[Nit]** R9's test is judged by eye, and the skill diff also adds the trace and hand-off wording — `docs/plans/PWF-003-requirements-and-trace-table.md`
  **Disposition:** explained. The plan is frozen. R9 is read as covering how the review is run (its scope and steps), which changed only by the one new rule in step 6. The trace and hand-off wording is the feature itself.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the plan-change format block for the Requirements section and the Given / When / Then pattern | Pass (checked by Claude) |
| R2 | Read the plan-change play-back step for the requirements and the "a yes covers the requirements" line | Pass (checked by Claude) |
| R3 | Read the plan-change technical-detail format for the "Planned tests" list and the rule that a manual one says why | Pass (checked by Claude) |
| R4 | Read the code-change review-record format and step 7 for the trace table and the three result forms | Pass (checked by Claude) |
| R5 | Read the code-change hand-off step and the plan-change "How you'll check it" format | Pass (checked by Claude) |
| R6 | `docs/reviews/PWF-003-POLICY-before.md` compared with the new POLICY.md, and this record's Scope line read | Pass (checked by Claude) |
| R7 | Read the two added POLICY.md sentences in the plan paragraph and the review-record paragraph | Pass (checked by Claude) |
| R8 | Read the backlog: item 1 is Done (PWF-003), and items 6 to 9 are new and Open | Pass (checked by Claude) |
| R9 | `git diff master` of the commit-change skill is empty, and the code-change diff read for review-running changes | Pass (checked by Claude) |

All nine planned tests were manual checks that Claude could run by reading, so none needs the user at the app and no row shows "Manual".

## Deviations from the plan
- R6 names a file path, which the new rule for requirements forbids (finding above). The plan was not edited.
- The process backlog gained a fourth new item (9) beyond the three the plan listed, for the review finding about outside-git copies. The user asked for it.
- The plan said to save the original POLICY.md copy "before editing". It was saved before the edit, but git converts its line endings on commit, so the committed copy may differ from the file on disk by line endings only. The text comparison ignored line endings.

## Summary
The planning step now requires numbered Given / When / Then requirements, a play-back that includes them, a planned test for each, and a numbered manual test procedure. The coding step builds the planned tests, records a trace table with Pass, Fail or Manual results, saves a copy of any outside-git file it edits, and lists the plan's numbered tests with their trace results at hand-off. The shared POLICY.md and the process backlog were updated outside git. The check-in command and the way reviews are run are unchanged apart from the one new rule. All checks passed after the review fixes (384 Rust tests, clippy, fmt, lint, the Vite build). The review had eight findings: two fixed, six explained, one of them also added to the backlog.
