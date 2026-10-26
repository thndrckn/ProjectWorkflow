# Review: PWF-024 — Include a backlog item in the change, and a /rename hint

- **Change:** PWF-024
- **Review format:** accountability 2
- **Plan:** docs/plans/PWF-024-include-backlog-item-and-rename.md (approved in commit 2ec3ff4)
- **Branch:** chore/PWF-024-include-backlog-item-and-rename
- **Reviewer:** independent Standards, Spec and Correctness reviewers (fresh sub-agents), then one fresh re-reviewer (round 1)
- **Scope:** diff of chore/PWF-024-include-backlog-item-and-rename against master — 2 files changed in the repository (the plan-change skill, docs/BACKLOG.md), about 15 lines of edits, plus the plan and a before-copy; plus one file outside the repository, `D:/projects/shared-claude-conventions/POLICY.md`, edited by the user by hand (saved copy: docs/reviews/PWF-024-POLICY.md-before.md; the only difference is line 31, as planned)

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author).

- **[Low]** Step 3 packed the "exactly four choices" sentence and the recommendation rule into one long line — .claude/skills/plan-change/SKILL.md (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (the rule moved to its own paragraph, "Which one to recommend", and the choices are introduced with "The choices:")
  **Re-review (round 1):** accepted

- **[Low]** The recommendation rule compares the item's files with the files the request will touch, but step 3 runs before the interview, so they may be unknown; no fallback or reason — .claude/skills/plan-change/SKILL.md (Standards and Correctness both raised it)
  **Caused by this change:** yes
  **Disposition:** fixed (judge from the request text and code already read; recommend Keep it queued when the request is empty, the files are not yet known, or the overlap is unclear, with the reason stated)
  **Re-review (round 1):** accepted

- **[Nit]** The reason for showing /rename again when the number moves was only implied — .claude/skills/plan-change/SKILL.md (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (added "so the chat name does not stay on a number the change no longer has")
  **Re-review (round 1):** accepted

- **[Low]** Unspecified: an item is included, then a later item is chosen with "Plan it now" — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (the Include bullet now says items already included stay in scope next to the item planned now; the "Plan it now" bullet text is unchanged, so this does not go against the plan)
  **Re-review (round 1):** accepted

- **[Nit]** Include has no way back if the interview later shows the item does not fit — .claude/skills/plan-change/SKILL.md (Correctness)
  **Caused by this change:** yes
  **Disposition:** explained (not asked for in the plan; the play-back lets the user change any requirement, including removing an included item, so there is already a way back)
  **Re-review (round 1):** accepted

- **[Nit]** /code-change refers to a "Backlog items fixed" line while the plan template makes it a section — .claude/skills/code-change/SKILL.md (Correctness)
  **Caused by this change:** no
  **Disposition:** explained (harmless wording that was already there; /code-change reads the item names either way)
  **Re-review (round 1):** accepted

- **[Informational]** The question box allows at most four options, so a fifth choice later would not fit (Correctness)
  **Caused by this change:** no
  **Disposition:** explained (an observation about a possible future change; nothing to do now)
  **Re-review (round 1):** accepted

- **[Informational]** The list of choices is repeated in the skill, BACKLOG.md and POLICY.md (Standards)
  **Caused by this change:** no
  **Disposition:** explained (the documented pattern; each file has its own audience)
  **Re-review (round 1):** accepted

- **[Nit]** The plan's "must not be confused" note is covered by the skill's "unlike 'Plan it now', the remaining backlog questions are still asked" (Spec)
  **Caused by this change:** yes
  **Disposition:** explained (already satisfied by the skill text, no action needed)
  **Re-review (round 1):** accepted

## Re-review

### Round 1
Triggered by the five fixes and four explanations above (all nine first-review findings; the Spec reviewer's requirement check found no missing or partly-built requirement). The re-reviewer checked the diff of the fixes (30857ee..HEAD, the plan-change skill only), accepted every explanation and every fix, confirmed the "caused: no" label on the three logged-as-explained items (/code-change wording, the four-option limit, the repeated list), and found that the "Plan it now" bullet is unchanged and the new Include sentence does not contradict "Ask no more backlog questions". New findings: none.

**Round 1 clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read step 3 of the skill: four named choices (planned test, manual, checked by Claude) | Pass (checked by Claude) |
| R2 | Read the "Include it in this change" bullet: own requirement and test, "Backlog items fixed", remaining items still asked (also T2 on the next real planning) | Pass (checked by Claude) |
| R3 | Read the recommendation paragraph: include only for the same files or area, otherwise queue, with the unknown-files fallback (also T2) | Pass (checked by Claude) |
| R4 | Read step 2: `/rename <NUMBER>` shown after the announcement (also T2) | Pass (checked by Claude) |
| R5 | Read step 2: new number announced and `/rename` shown again with the final number | Pass (checked by Claude) |
| R6 | BACKLOG.md intro read, and POLICY.md line 31 compared with the before-copy after the user's hand edit: only the planned replacement differs | Pass (checked by Claude) |

## Deviations from the plan
- The plan was committed with one added section, "Policy edits for you to make by hand", holding the same old and new POLICY.md text that was in the technical detail. It was added before the plan was committed, because PWF-022 (landed on master while this plan waited) made that section the required place for the text. Nothing else in the plan changed; the user was told.
- The recommendation rule gained the fallback "recommend Keep it queued when the request is empty, the files are not yet known, or the overlap is unclear" (finding above); this is consistent with R3 ("otherwise it recommends queueing").
- The Include bullet gained one sentence about items already included when a later item is planned with "Plan it now" (finding above); the plan did not cover that case.

## Summary
The /plan-change skill now offers four backlog choices with a narrow, reasoned recommendation rule, and shows `/rename <NUMBER>` after the change number (again if it moves). docs/BACKLOG.md's introduction and the user's hand edit of POLICY.md line 31 list all four choices. All checks passed (cargo test 384 passed, clippy, fmt, lint, conventions, vite build). One review round of fixes was checked by a fresh re-reviewer and was clean. The live behaviour (T2) is confirmed on the next real `/plan-change`. PWF-025 also edits docs/BACKLOG.md, so whichever of the two is checked in second will need to resolve a conflict there.
