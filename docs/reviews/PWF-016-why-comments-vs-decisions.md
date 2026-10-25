# Review: PWF-016 — Why-comments vs DECISIONS.md

- **Change:** PWF-016
- **Review format:** accountability
- **Plan:** docs/plans/PWF-016-why-comments-vs-decisions.md (approved in commit 3c2e206)
- **Branch:** chore/PWF-016-why-comments-vs-decisions
- **Reviewer:** independent Standards, Spec and Correctness reviewers, then two fresh re-reviewers (rounds 1 and 2)
- **Scope:** diff of chore/PWF-016-why-comments-vs-decisions against master — 3 files (plan, .claude/skills/code-change/SKILL.md, docs/DECISIONS.md), about 76 lines added. Also the shared D:/projects/shared-claude-conventions/POLICY.md, a file outside this repository that the user edited by hand; git cannot show that edit.

## Findings

- **[Medium]** (Standards) and **[High]** (Spec): the shared POLICY.md lacked the new rule (plan R1) — D:/projects/shared-claude-conventions/POLICY.md
  **Caused by this change:** yes
  **Disposition:** fixed. The author's own edit was blocked by the master-edit guard hook (the file is outside the repo), so the author asked the user how to proceed. Settled by the user: "You edit it by hand". Round 1's re-reviewer rejected closing the finding as explained until the text was really in the file. The user then added the paragraph; round 2 confirmed it is present, well placed and consistent.
- **[Nit]** ambiguous sentence "Commit the entry with the records in step 9" in the by-design bullet — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (now "Commit any entry ...").
- **[Low]** (Correctness) no route when the spot cannot hold a comment (data file, lockfile, generated code) — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (nearest file that can; otherwise treat as project-wide).
- **[Low]** (Correctness) no tiebreaker between "one spot" and "project-wide" — .claude/skills/code-change/SKILL.md, docs/DECISIONS.md
  **Caused by this change:** yes
  **Disposition:** fixed (several spots or unsure: treat as project-wide).
- **[Low]** (Correctness) a rejected comment explanation was not covered — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed ("revise or remove the entry, or revise the comment").
- **[Low]** (Correctness) a comment in a stop-case-2 place (migration, import/export/backup code, data folder) could skip the user's answer — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (needs the user's answer first).
- **[Informational]** (Correctness) Standards-line change is within scope — .claude/skills/code-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (observation, no action).
- **[Low]** (round 1, new) the stop-case-2 sentence did not say what happens if the user declines the comment — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (if declined, treat as project-wide). Accepted in round 2.

## Re-review

### Round 1
Triggered by the fixes and the explanation above. The re-reviewer accepted the Nit and four Low fixes and the Informational explanation. It did not accept closing the POLICY.md finding as explained, since a requirement cannot be closed by deferring it, and it raised one new Low (above). Not clean.

### Round 2
Triggered by the user adding the POLICY.md paragraph and the fix to the new Low. The re-reviewer confirmed the paragraph is present, placed after "Settling findings", matches plan R1, is project-neutral and agrees with the skill and the decisions intro; it accepted the last fix and re-checked the whole bullet and Standards line against steps 6, 7, 9 and the stop cases. No new finding. Clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | T1: read the paragraph in the shared POLICY.md | Pass (checked by Claude) |
| R2 | Read the by-design step of /code-change; live behaviour on the next real change | Pass (checked by Claude) |
| R3 | Read the project-wide branch of the same step | Pass (checked by Claude) |
| R4 | Read the Standards reviewer line; live behaviour on the next real change | Pass (checked by Claude) |
| R5 | Read the intro of docs/DECISIONS.md | Pass (checked by Claude) |

## Deviations from the plan
- The shared POLICY.md was edited by the user by hand, not by Claude, because the master-edit guard blocked Claude's edit (the file is outside the repo). The text is the same as planned.
- The by-design bullet gained four short clauses beyond the plan's wording (no-comment fallback, one-spot tiebreaker, stop-case-2 and declined comment), added to settle review findings.

## Summary
The workflow now states where a "why" goes: a comment at the spot for spot-specific reasons, DECISIONS.md for project-wide ones, and reviewers check changed non-obvious code for a "why" comment. All six first-round findings and the one new finding were fixed, round 2 was clean, and all checks passed. The shared POLICY.md edit is outside this repo and needs its own commit.
