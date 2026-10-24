# PWF-014 — Keep the request that "plan it now" sets aside

- **Change:** PWF-014
- **Date:** 2026-10-24

## What you'll see change
When you choose "Plan it now" on a backlog item, your original `/plan-change` request is no longer lost. The plan records it word for word. `/plan-change` still tells you plainly that the request needs its own `/plan-change`.

When that change is checked in, `/commit-change`'s final report ends with a short lead-in and a ready-to-paste `/plan-change` command holding your original request, so you can start planning it straight away.

If you didn't choose "Plan it now", or your original request was empty, nothing changes: no section in the plan, no command in the report. The app itself is untouched.

## Requirements
- **R1.** Given you choose "Plan it now" on a backlog item while your original request was non-empty, when the plan is written, then it has an "Original request (set aside)" section containing that request word for word.
- **R2.** Given you did not choose "Plan it now", or your original request was empty, when the plan is written, then it has no such section.
- **R3.** Given a checked-in change whose plan has that section, when `/commit-change` gives its final report, then the report ends with a short lead-in and a code block holding `/plan-change` followed by your original request exactly as recorded, ready to paste.
- **R4.** Given a checked-in change whose plan has no such section, when `/commit-change` gives its final report, then the report has no such command.
- **R5.** Given "Plan it now" sets aside your request, when `/plan-change` continues, then it still tells you plainly that your original request needs its own `/plan-change`.

## Decisions from the interview
| # | Question | Answer |
|---|---|---|
| 1 | Backlog questions | None asked; the backlog was empty |
| 2 | Should the report end with the request in a code block as `/plan-change <your words exactly>`? | Yes, last, in a code block |
| 3 | If "Plan it now" isn't chosen or the request was empty, is nothing recorded and no command shown? | Yes |
| 4 | Play-back: is the understanding and the requirements right? | Yes |

## What could go wrong / what gets lost
Nothing. Only two workflow instruction files change; no app code, data or migrations.

## Not included
- No change to how backlog items are asked about or accepted.
- No automatic start of the set-aside request's own `/plan-change`; you paste it yourself.
- `/commit-change` still never writes or edits the plan.

## How you'll check it
**T1 — Plan skill records the request. Covers R1, R2, R5.**

1. Read the "Plan it now" bullet and the plan format in the plan-change skill.

Expected: "Plan it now" says to keep the original request word for word, only when it is non-empty, and still tells you it needs its own `/plan-change`. The plan format has an "Original request (set aside)" section, left out otherwise.

**T2 — Commit skill reports the request. Covers R3, R4.**

1. Read the Report step in the commit-change skill.

Expected: it says to read the section from the plan and end the report with a lead-in and a code block with `/plan-change <request>`, and to add nothing when the section is absent.

**T3 — Live run. Covers R1–R5.**

1. The next time the backlog has an item and you have a real request, choose "Plan it now" at the next real `/plan-change`.
2. Check that plan for the section, and read the final report when that change is checked in.

Expected: the plan holds your request word for word; the report ends with the paste-ready command.

## Check-in
- Type: chore
- Branch: chore/PWF-014-keep-set-aside-request
- Commit message: chore(PWF-014): keep the request "plan it now" sets aside and hand it back at check-in

---

## Technical detail (for Claude)
- `.claude/skills/plan-change/SKILL.md`: in the "Plan it now" bullet of step 3, add: if the original request (the command arguments) is non-empty, keep it exactly as typed and write it into the plan. In the plan format, add an optional section "Original request (set aside)" after "Backlog items accepted", holding the request in a quote or fenced block unaltered; omit when "Plan it now" wasn't chosen or the request was empty. Keep the existing plain reminder.
- `.claude/skills/commit-change/SKILL.md`: in step 6, add a final bullet: if the plan has an "Original request (set aside)" section, end the report with a one-line lead-in and a fenced code block containing `/plan-change ` followed by the recorded text exactly; it is the last thing in the report; otherwise add nothing. Read-only on the plan, so the "Never" list is unaffected.
- Shared skills stay free of project specifics. CHANGELOG entry under Unreleased.

**Planned tests**
- R1 — Manual: read the plan-change skill text (Claude can do this itself); a skill instruction can't be unit-tested. Live confirmation at T3.
- R2 — Manual: same reading; Claude can do it itself.
- R3 — Manual: read the commit-change report step; Claude can do it itself. Live confirmation at T3.
- R4 — Manual: same reading.
- R5 — Manual: confirm the reminder wording remains in the plan-change skill.
