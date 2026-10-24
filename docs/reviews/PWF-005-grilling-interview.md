# Review: PWF-005 — Use the grilling method properly in the planning interview

- **Change:** PWF-005
- **Plan:** docs/plans/PWF-005-grilling-interview.md (approved in commit df4913f)
- **Branch:** chore/PWF-005-grilling-interview
- **Reviewer:** three independent sub-agent reviewers (Standards, Spec, Correctness). No re-review ran, because no `[Medium]` or `[High]` finding was raised and no requirement failed.
- **Scope:** diff of chore/PWF-005-grilling-interview against master — 1 skill file changed (`.claude/skills/plan-change/SKILL.md`, +10/−6 lines), plus the plan file

## Findings
Every finding is listed, with the severity the reviewer assigned (never changed by the author).

### Spec reviewer
- **[Low]** The plan says to keep the intro rule about still asking "anything to add or change?"; it sits above section 3 and is untouched — `.claude/skills/plan-change/SKILL.md`
  **Disposition:** explained (it confirms the plan is met; nothing to do).
- **[Nit]** The opening line "Grill the user relentlessly…" and the phrase "nothing left silently assumed" were not in the plan — `.claude/skills/plan-change/SKILL.md`
  **Disposition:** explained (copied from Matt's wording, which the plan says to copy, and it glosses "empty frontier" without changing the rule).
- **[Informational]** The frontmatter description still reads true — same file.
  **Disposition:** explained (no action needed).
- **[Informational]** The reviewer said the CHANGELOG entry belongs to `/commit-change` — `CHANGELOG.md`
  **Disposition:** explained (wrong: `/code-change` step 9 writes it, and it is added in the records commit).

### Correctness reviewer
- **[Low]** The frontmatter description ("one question at a time until the change is fully understood") is a little looser than "stop when the frontier is empty" — `.claude/skills/plan-change/SKILL.md`
  **Disposition:** explained (still true; the plan only asked to check it still reads true).
- **[Low]** An empty frontier could be read as permission to skip the intro's mandatory "anything to add or change?" question, since the stop bullet doesn't restate it — `.claude/skills/plan-change/SKILL.md`
  **Disposition:** explained. The intro rule is global ("Never skip the interview or the play-back") and the plan says to keep it as it is and change nothing outside the removed rule (R6). Adding a clause would be an unplanned change.
- **[Nit]** "Most-unblocking first" and "risky ones as soon as they're on the frontier" could conflict — same file.
  **Disposition:** explained (the sentence already says risky goes as soon as it is on the frontier, which is the approved "risky early").
- **[Nit]** "Ask about anything risky as its own question" overlaps with one-question-per-box — same file.
  **Disposition:** explained (the plan deliberately keeps that rule).
- **[Informational]** Facts rule agrees with step 1 — same file. **Disposition:** explained (no action).
- **[Informational]** The play-back is the confirmation and agrees with step 4; old rule gone; no skill-load instruction remains — same file. **Disposition:** explained (no action).
- **[Informational]** "Word each question so that choosing the recommended answer is a plain 'yes'" is awkward for multiple choice — same file.
  **Disposition:** explained (it is what the plan and Matt's method specify).

### Standards reviewer
- **[Low]** "One question at a time" is stated in the frontmatter and the shared policy, so the wording could drift — `.claude/skills/plan-change/SKILL.md`
  **Disposition:** explained (both still read true; no change needed).
- **[Nit]** "Relentlessly" sits a little oddly beside the one-question-per-message rule — same file.
  **Disposition:** explained (copied tone; harmless).
- **[Nit]** Plan header and all-manual planned tests are consistent — plan file.
  **Disposition:** explained (no action).
- **[Informational]** The CHANGELOG entry and review record weren't in the diff yet — `CHANGELOG.md`, `docs/reviews/`
  **Disposition:** fixed (both are in the records commit).

No stop case applied.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | T1: read the interview step, search for the credit and for any skill-load instruction (T2 confirms live) | Pass (checked by Claude) |
| R2 | T1 read the wording; T2 live | Manual |
| R3 | T1 read the wording; T2 live | Manual |
| R4 | T1 read the wording; T2 live | Manual |
| R5 | T1: search shows the old rule is gone and the stop rule points to the play-back (T2 confirms live) | Pass (checked by Claude) |
| R6 | T1: diff against master shows only section 3 changed | Pass (checked by Claude) |

## Deviations from the plan
None.

## Summary
Only section 3 of the plan-change skill changed: the grilling method is now written into the step with a credit to Matt Pocock's grilling skill, one question at a time in the question box, and the old "keep going" rule is replaced by "stop when the frontier is empty". All five checks passed and the approved plan file is unchanged. The reviewers raised no `[Medium]` or `[High]` findings.
