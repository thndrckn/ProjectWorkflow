# Review: PWF-009 — The backlog

- **Change:** PWF-009
- **Review format:** accountability
- **Plan:** docs/plans/PWF-009-backlog.md (approved in commit b6d23ef)
- **Branch:** chore/PWF-009-backlog
- **Reviewer:** three independent fresh reviewers (Standards, Spec, Correctness), then two fresh re-reviewers (rounds 1 and 2)
- **Scope:** diff of chore/PWF-009-backlog against master — 10 files changed, about 175 lines (the four skills, the hook comment, CLAUDE.md, docs/BACKLOG.md, docs/DECISIONS.md, KNOWN_ISSUES.md deleted), plus two files outside the repository: D:/projects/shared-claude-conventions/POLICY.md (saved original docs/reviews/PWF-009-POLICY-before.md) and PROCESS_BACKLOG.md (saved original docs/reviews/PWF-009-PROCESS_BACKLOG-before.md)

## Findings

- **[Low]** Bare "BACKLOG.md" (no `docs/` path) in the code-change step 7 note and the review-record Disposition template — `.claude/skills/code-change/SKILL.md` (raised by Standards as Low; Spec and Correctness raised the same defect as Nit)
  **Caused by this change:** yes
  **Disposition:** fixed (both spots now say docs/BACKLOG.md)

- **[Nit]** DECISIONS.md entry for the moved CHANGELOG-conflict item said "By design" though the original said "Accepted for now" — `docs/DECISIONS.md`
  **Caused by this change:** yes
  **Disposition:** fixed (wording restored)

- **[Low]** The same DECISIONS.md entry used today's date and a non-standard Change line — `docs/DECISIONS.md`
  **Caused by this change:** yes
  **Disposition:** fixed (Change PWF-002, Date 2026-10-23; move note at the end of the Reason)

- **[Nit]** Backlog entries reworded rather than carried over verbatim — `docs/BACKLOG.md`
  **Caused by this change:** yes
  **Disposition:** fixed for the rename-plan entry (dropped sentence restored); explained for the shell-guard entry: the user directed it be rewritten as a Medium item ("a way around the most basic rule", start with blocking commits via the shell), and the dropped sentence argued against fixing it.

- **[Nit]** The "Decisions from the interview" plan section is not read by any downstream skill — `.claude/skills/plan-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained: the Spec reviewer is given the whole plan file, and the section exists so any reviewer can check "the user decided" claims; R8 asks only that the play-back and plan carry it.

- **[Informational]** The commit-change gate still mentions "the former known-issues file" — `.claude/skills/commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained: deliberate, so older new-format records that say "logged in KNOWN_ISSUES.md" still read as logged; the literal old filename does not appear, so R2 holds.

- **[Informational]** Choosing "plan it now" after "accept" answers yields a plan with both sections — `.claude/skills/plan-change/SKILL.md`
  **Caused by this change:** no
  **Disposition:** explained: allowed; code-change applies each section independently.

- **[Informational]** The commit-change gate does not check that fixed or accepted items were removed from the backlog — `.claude/skills/commit-change/SKILL.md`
  **Caused by this change:** no
  **Disposition:** explained: R7 puts that check in the review (the Spec reviewer brief covers it); a gate rule was not planned.

- **[Informational]** Old plans and review records still mention KNOWN_ISSUES.md — `docs/plans/*`, `docs/reviews/*`
  **Caused by this change:** no
  **Disposition:** explained: historical records, left alone ("Not included" in the plan).

- **[Informational]** The accept flow depends on `/code-change` making the edits — `docs/BACKLOG.md`, skills
  **Caused by this change:** no
  **Disposition:** explained: this is the user's decision #1 in the plan.

- **[Nit]** (raised in round 1) commit-change gate rule 2 said "in BACKLOG.md" without the `docs/` prefix — `.claude/skills/commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed (now "in docs/BACKLOG.md")

## Re-review

### Round 1
Triggered by the fixes and explanations above. The re-reviewer accepted all ten outcomes (the fixes, every explanation, and the "caused: no" labels on the informational items). One new finding: the commit-change Nit above, caused yes, severity Nit, fixed. Not clean, because a new finding was raised.

### Round 2
Triggered by the round-1 fix. A fresh re-reviewer accepted the fix, confirmed gate rule 2 still works, found no bare "BACKLOG.md" left, and raised no new findings. Clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the files; confirm BACKLOG.md has the two entries in order, DECISIONS.md has the third, KNOWN_ISSUES.md is gone | Pass (checked by Claude) |
| R2 | Search for the old file name outside plans, reviews and archive, in the project and the shared policy folder | Pass |
| R3 | Read the code-change and commit-change wording for logging and the gate | Pass (checked by Claude) |
| R4 | The user's next real `/plan-change` (T2) | Manual |
| R5 | The user's next real `/plan-change` (T2) | Manual |
| R6 | Read the plan-change and code-change skills for the accept flow | Pass (checked by Claude) |
| R7 | Read the skills' fixed-item removal and the Spec reviewer check | Pass (checked by Claude) |
| R8 | The user's next real `/plan-change` (T2) | Manual |
| R9 | Diff POLICY.md against docs/reviews/PWF-009-POLICY-before.md | Pass (checked by Claude) |

## Deviations from the plan
None. The plan file is unchanged since its approval commit.

## Summary
The backlog replaces the known-issues file. The skills, hook comment, shared policy, process backlog and project guide all point to it, and `/plan-change` now asks about each item first. All checks passed (384 Rust tests, clippy, fmt, lint, vite build). Every finding was fixed or explained; two re-review rounds ran and the last was clean. R4, R5 and R8 are checked live in the user's next `/plan-change`.
