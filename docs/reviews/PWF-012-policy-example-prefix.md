# Review: PWF-012 — Neutral change-number examples in the shared policy

- **Change:** PWF-012
- **Review format:** accountability
- **Plan:** docs/plans/PWF-012-policy-example-prefix.md (approved in commit a17dd64)
- **Branch:** chore/PWF-012-policy-example-prefix
- **Reviewer:** three independent fresh reviewers (Standards, Spec, Correctness); one re-review round ran
- **Scope:** diff of chore/PWF-012-policy-example-prefix against master — 3 files (docs/BACKLOG.md, the plan, the saved before-copy), about 6 lines removed from the backlog; plus D:\projects\shared-claude-conventions\POLICY.md (outside the repository, 2 lines changed), saved original at docs/reviews/PWF-012-POLICY.md-before.md

## Findings
- **[Informational]** The shared POLICY.md edit is outside any git repository, so git cannot track or revert it — D:\projects\shared-claude-conventions\POLICY.md
  Raised by all three reviewers (Standards, Spec, Correctness) as the same observation.
  **Caused by this change:** no
  **Disposition:** explained (the plan's "What could go wrong" section already states this, and the committed before-copy is the revert path; a pure observation, not a by-design decision, so nothing added to docs/DECISIONS.md)

No other findings from any reviewer.

## Re-review
### Round 1
Triggered by the explained Informational finding. The re-reviewer accepted the explanation, confirmed the "caused: no" label (the folder was already not a git repository), independently diffed the before-copy against the live policy and confirmed only lines 52 and 168 changed, and raised no new findings. The round was clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | grep line 52 of the policy for `ABC-085` | Pass (checked by Claude) |
| R2 | grep for `feat(ABC-085): show feedback when no hours are found` | Pass (checked by Claude) |
| R3 | grep the policy for `DTP-`, expect none | Pass (checked by Claude) |
| R4 | grep BACKLOG.md: removed title absent, other entry present once | Pass (checked by Claude) |

## Deviations from the plan
None.

## Summary
The two examples in the shared policy now use `ABC-085`, the backlog entry is removed, and all checks pass (384 Rust tests, clippy, fmt, lint, Vite build). No reviewer found a defect; the one Informational observation was explained and accepted in a clean first re-review round.
