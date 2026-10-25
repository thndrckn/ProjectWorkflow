# PWF-020 — Fixed play-back format

- **Change:** PWF-020
- **Date:** 2026-10-25

## What you'll see change
Every time `/plan-change` plays the plan back to you, it looks the same, in every chat. The play-back is a normal message with three parts in a set order: a Summary, the Requirements, and the Decisions so far. It ends with "Is that right?" as plain text, with no question box. You answer yes, or write your changes, in the normal chat input. If you write changes, the corrected play-back uses the same layout and says at the top what changed. Interview questions still use the question box. The app itself does not change.

## Requirements
- **R1.** Given the interview is finished, when the skill plays the plan back, then it writes the play-back as a normal message, never inside a question box.
- **R2.** Given a play-back is written, when the user reads it, then it has these parts in this order: Summary (a few plain sentences), Requirements (R1, R2, … one per line), Decisions so far (the question-and-answer table).
- **R3.** Given a play-back is written, when it ends, then its last line is "Is that right?" as plain text, no question box is shown, and the user answers yes or writes changes in the normal chat input. Interview questions still use the question box.
- **R4.** Given the user wrote changes instead of yes, when the skill plays the plan back again, then the corrected play-back uses the same layout and states what changed at the top.
- **R5.** Given the skill file is read, when step 5 is checked, then it describes this layout, and nothing else in the skill or in the other skills contradicts it.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog entries | None in the backlog, so none were asked. |
| Scope: only step 5 of the plan-change skill (the only place a play-back is described)? | Yes, step 5 of plan-change only |
| Is that right? (play-back) | Yes, with one change: no question box for the play-back. It ends with "Is that right?" as plain text; the user answers yes or writes changes in the normal chat input. Interview questions still use the question box. |

## What could go wrong / what gets lost
Nothing. Only the wording of one skill step changes.

## Not included
- No change to the other skills, the shared policy, or app code.
- No change to how the interview questions are asked, or to the plan file format.

## How you'll check it
**T1 — Read the skill. Covers R1, R2, R3, R4, R5.**

1. Open the plan-change skill and read step 5.
2. Search the four skills for other mentions of the play-back.

Expected: step 5 describes the plain-message layout, the three parts in order, the closing plain-text "Is that right?" with no question box, and the corrected play-back rule. No other text contradicts it.

**T2 — Run it for real. Covers R1, R2, R3, R4.**

1. In the next real `/plan-change`, finish the interview and watch the play-back.
2. Reply with a change instead of yes, once.

Expected: the play-back is a normal message in the three-part order, ends with "Is that right?" as plain text with no question box, and the corrected play-back opens with what changed. Interview questions still appear in the question box.

## Check-in
- Type: chore
- Branch: chore/PWF-020-fixed-playback-format
- Commit message: chore(PWF-020): give every plan-change play-back one fixed format

---

## Technical detail (for Claude)
- Edit `.claude/skills/plan-change/SKILL.md`, section "5. Play it back" only. Keep the existing rules: draft requirements from the interview, list every question asked (backlog and interview), wait for a yes, replay after corrections. Add the fixed layout: a normal message (Summary, Requirements, Decisions so far) ending with "Is that right?" as plain text, no question box; the user replies yes or writes changes in the chat input; a corrected play-back uses the same layout with a "what changed" line at the top. Also update the step 5 / line 16 wording that has the user's "yes" come from a question box, if any, and leave the interview's question-box rules (step 4) unchanged.
- Keep the wording project-neutral (shared-skill rule). Check line 16 and line 52 still agree with the new step 5.
- The Decisions table in the plan file (step 6) already includes the play-back answer; leave it.
- No CLAUDE.md feature-cycle steps apply (no app code, no migration).

**Planned tests**
- R1 — Manual: read step 5 for the "normal message, never in the question box" rule. A text file, so Claude can check it itself by reading it.
- R2 — Manual: read step 5 for the three parts in order. Claude can check it by reading.
- R3 — Manual: read step 5 for the plain-text "Is that right?" ending with no question box, and step 4 for interview questions still using it. Claude can check it by reading.
- R4 — Manual: read step 5 for the corrected play-back rule. Claude can check it by reading; the live run (T2) needs the user in a real `/plan-change`.
- R5 — Manual: grep the four skills for "play-back" and "play it back" and confirm nothing contradicts step 5. Claude can run it.
