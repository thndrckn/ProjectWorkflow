# Review: PWF-031 — Manual checks don't block check-in
- **Change:** PWF-031
- **Level:** Full
- **Plan:** docs/plans/PWF-031-manual-checks-dont-block.md
- **Reviewers:** mattpocock-skills:code-review (Standards and Spec), a fresh Correctness reviewer, and one fresh re-reviewer

## Findings
- **[Low]** The gate accepted `Manual-fail`, `Manual: failed` and `Manual (Fail)` as well as plain `Manual`, which goes beyond the plan's "only the exact word Manual" — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** Accept only the whole word `Manual` as the result.
  **Outcome:** fixed (the pattern is now `/^(pass|manual$)/i`, and a `Manual-fail` test was added, in 22fae1a)
  **Re-review:** accepted
- **[Nit]** The plan's Checks say R3 gets a "new case for Pass", but no new Pass case was added — docs/plans/PWF-031-manual-checks-dont-block.md
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (the existing "a complete record passes" case already has a `Pass` row, and the existing `fail` case covers Fail; a duplicate would test nothing new)
  **Re-review:** accepted
- **[Informational]** The BACKLOG.md entry came from Jason at plan approval, not from a review finding, and the DECISIONS.md entry was made at planning time; both sit slightly outside the wording of their files' headers — docs/BACKLOG.md, docs/DECISIONS.md
  **Caused by this change:** yes
  **Recommendation:** None needed.
  **Outcome:** explained (Jason asked for the backlog item, and the decision records a project-wide gate rule; both follow the entry formats)
  **Re-review:** accepted
- **[Informational]** `release/githooks` only gets the fix at the next `/build-changes`, and docs/PROCESS_BACKLOG.md:70 still describes an old idea — githooks/, docs/PROCESS_BACKLOG.md
  **Caused by this change:** no
  **Recommendation:** None needed.
  **Outcome:** explained (expected; the plan's "What could go wrong" already says projects keep the stricter gate until they refresh)
  **Re-review:** accepted

## Re-review
**Re-review clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | test-trunk-lock.sh: "a Manual result does not block the gate" | Pass |
| R2 | test-trunk-lock.sh: lower case and capitals cases | Pass |
| R3 | test-trunk-lock.sh: "a complete record passes" (Pass) and "a failed requirement fails" (Fail) | Pass |
| R4 | test-trunk-lock.sh: empty, TBD and Manual-fail cases | Pass |
| R5 | test-trunk-lock.sh: "a Manual row does not hide a Fail row" | Pass |
| R6 | All four CLAUDE.md checks (43 lock, 9 guard, 14 adopt tests; plugin validation with only the known notes) | Pass |
| R7 | Read the changed lines in skills/code-change/SKILL.md | Manual |

## Deviations from the plan
None. The `Manual-fail` fix brings the gate in line with the plan's "only the exact word Manual".

## Summary
The review gate now accepts a bare `Manual` as the result of a manual check, while Pass and Fail behave as before and anything else still fails. The reviewers found one Low issue (a loose match), which was fixed and accepted on re-review.
