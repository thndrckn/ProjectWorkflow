# Review: PWF-020 — Fixed play-back format

- **Change:** PWF-020
- **Review format:** accountability
- **Plan:** docs/plans/PWF-020-fixed-playback-format.md (approved in commit 8427afe)
- **Branch:** chore/PWF-020-fixed-playback-format
- **Reviewer:** independent Standards, Spec and Correctness reviewers; a re-review ran (2 rounds)
- **Scope:** diff of chore/PWF-020-fixed-playback-format against master — 2 files (the plan-change skill, and the plan), about 70 lines

## Findings

- **[Low]** An unrelated package-lock.json version sync (0.39.2 to 0.40.0, caused by `npm install` in the worktree) was committed in a skill-only change — package-lock.json (raised by Standards and Spec)
  **Caused by this change:** yes
  **Disposition:** fixed (lockfile restored to master's version; the branch diff now touches only the skill and the plan)

- **[Low]** Step 5 gave no reason for not using a question box for the play-back — .claude/skills/plan-change/SKILL.md (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (step 5 now says the box cannot hold a long play-back and leaves no room to write changes)

- **[Low]** A reply that is neither a clear yes nor a change (a question, "maybe") was not covered — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (added: answer it or ask what they mean, then end with "Is that right?" again)

- **[Low]** "Yes, but …" was ambiguous between a yes and a change — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (added: a reply that adds any change, even "yes, but …", is a change, not a yes)

- **[Nit]** The no-question-box rule was stated twice in near-identical words — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (one statement kept, with its reason)

- **[Informational]** Line 16 and the "a few plain sentences" Summary wording unchanged from the old text — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** no
  **Disposition:** explained (matches the old wording, no action needed)

- **[Informational]** Shared-skill rule met and no smells in the added text — .claude/skills/plan-change/SKILL.md (Standards)
  **Caused by this change:** no
  **Disposition:** explained (observation only)

- **[Nit]** "Decisions so far" renames the old phrase, and the parts are a bare numbered list — .claude/skills/plan-change/SKILL.md (Standards)
  **Caused by this change:** yes
  **Disposition:** explained (reads fine; the plan requires exactly these parts)

- **[Nit]** The Spec reviewer's note that no other skill mentions the play-back (informational) — .claude/skills (Spec)
  **Caused by this change:** yes
  **Disposition:** explained (no action: the grep confirms R5)

- **[Nit]** (Round 1) Step 5 does not say to stop after "Is that right?" — .claude/skills/plan-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (the next line, "Wait for a yes", already covers it)

- **[Informational]** (Round 1) The plan template's "including the play-back" wording in the Decisions table is still consistent — .claude/skills/plan-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (observation only)

## Re-review

### Round 1
Triggered by the fixes and explanations above. A fresh re-reviewer accepted all nine outcomes: it confirmed the lockfile is back at master's version and the branch touches only the skill and the plan, that each wording fix resolves its finding, and that R1 to R5 still hold. It raised two new findings (the Nit and the Informational marked Round 1 above), so the round was not clean.

### Round 2
A fresh re-reviewer checked the two Round 1 findings and accepted both explanations. It re-read step 5 and raised no new finding. The round was clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read step 5 for the "normal message" rule | Pass (checked by Claude) |
| R2 | Read step 5 for the three parts in order | Pass (checked by Claude) |
| R3 | Read step 5 for the plain-text "Is that right?" ending and step 4 for the interview question box | Pass (checked by Claude) |
| R4 | Read step 5 for the corrected play-back rule; live run is T2 | Pass (checked by Claude) |
| R5 | Grep the four skills for play-back mentions | Pass (checked by Claude) |

T2 (a live run in the next real `/plan-change`) needs the user, so R1 to R4 are also still open for that manual check.

## Deviations from the plan
None.

## Summary
Step 5 of the plan-change skill now describes the fixed play-back layout: a normal message with Summary, Requirements and Decisions so far, ending in "Is that right?" as plain text with no question box, and a corrected play-back that says at the top what changed. Review fixes added the reason for the rule and two reply edge cases, and removed an unrelated lockfile sync. All checks pass and the second re-review round was clean.
