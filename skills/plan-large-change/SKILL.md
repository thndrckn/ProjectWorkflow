---
name: plan-large-change
description: Plan a change too big for one session, using Matt's spec and tickets. Started by /design-change, or typed directly (also after a chat was cleared mid-plan). Pauses for Jason to type /to-spec and /to-tickets, numbers the tickets NNN.1, NNN.2 and so on, rates each, and commits the approved spec on an integration branch.
---

# Plan a large change

Second step of the workflow for a large change: design → **plan** → code each ticket → merge. Writes no code. Never enter plan mode.

## 1. Number and pause
- The change number comes from `/design-change`. If typed directly and there is none, claim one as in `plan-small-change` step 1.
- If no spec exists yet, say: *"In this chat, type `/to-spec`, then `/to-tickets`, then tell me **done**."* (Matt's skills; only Jason can start them.) STOP until he says done.
- Typing `/plan-large-change` again later (even after the chat was cleared) resumes here: look for the newest spec and tickets, and carry on from step 2. Matt's local layout is `.scratch/<feature>/spec.md` and `.scratch/<feature>/issues/NN-<slug>.md`; if setup was never done, tell Jason to type `/setup-matt-pocock-skills` and STOP.

## 2. Make them ours
Move the spec to `docs/plans/<NUMBER>-<short-title>.md` and the tickets to `docs/plans/<NUMBER>-<short-title>/`. Then:
- Rename the tickets **NNN.1, NNN.2, …** (file names, headings) and fix every "Blocked by" line to the new numbers.
- Add a **Spec's list** to the spec: the tickets, plus (later) findings carried from one ticket to a later one.
- Rate each ticket as in `plan-small-change` step 3 (door, blast radius, Light or Full) and Jason picks each level.
- Write numbered Given/When/Then requirements for each ticket from the spec, with a test each.
- Record the type, the included backlog items, and the Check-in section (integration branch `<type>/<NUMBER>-<short-title>`, merge commit message).

## 3. Approve and commit
Jason approves the spec and all tickets together (open them with `code`, one command each). On approval, create the integration branch from the default branch (`git pull --ff-only` first), commit as `docs(<NUMBER>): approved spec`. From here they are frozen.

End: *"Next: `/code-change <NUMBER>.1`."*
