# PWF-009 — The backlog

- **Change:** PWF-009
- **Date:** 2026-10-24

## What you'll see change
- A new file, `docs/BACKLOG.md`, holds review findings that were neither fixed nor explained. It holds no feature ideas. Every entry has the same shape: a one-line title, then Found in, Severity, Files and What's wrong.
- `KNOWN_ISSUES.md` is gone. Its three entries are sorted:
  1. "The master-edit guard doesn't cover shell edits" goes to the backlog. It is a way around the most basic rule, and you want it fixed, starting with blocking commits on master through the shell.
  2. "rename-plan.sh and plansDirectory are inert while plan mode is blocked" goes to the backlog, to remove if plan mode never comes back (Nit).
  3. "The commit-change catch-up stops on every CHANGELOG conflict" goes to the decisions file, as accepted, because it keeps conflict decisions with you.
- Everything that used to say "known issues" now says the backlog: the four skills (including the check-in gate), the shared policy, the process backlog and the project guide.
- At the start of every `/plan-change`, before the interview, each backlog item is put to you one at a time with three choices: plan it now, keep it queued, or accept it (with a reason).
  - "Plan it now" switches the planning to that item. No more backlog questions are asked, the rest wait for the next `/plan-change`, and you are reminded that your original request needs its own `/plan-change`.
  - "Accept" is recorded in the plan; `/code-change` then moves the item to the decisions file and removes it from the backlog.
- A plan that fixes a backlog item names it, and the change removes the entry.
- The play-back and the plan file list every interview question and your answer.

## Requirements
- **R1.** Given the project is set up, when you look at the docs, then the backlog file exists with entries 1 and 2 above in the fixed format, the old known-issues file no longer exists, and the decisions file holds entry 3 with its reason.
- **R2.** Given any skill, the hook comment, the shared policy, the process backlog or the project guide, when you search for the old known-issues file name, then it appears nowhere outside historical records, and each former mention now points to the backlog.
- **R3.** Given a finding this change didn't cause that the author can neither fix nor explain, when the review is settled, then it is logged in the backlog in the fixed format, and the check-in gate looks for that rather than the old file.
- **R4.** Given the backlog has items, when `/plan-change` starts, then before the interview each item is put to you one at a time with the three choices, and nothing is written to master.
- **R5.** Given you choose "plan it now", when planning continues, then it plans that item, asks no more backlog questions, and reminds you your original request needs its own `/plan-change`.
- **R6.** Given you accept an item, when the plan is written, then the plan lists the item with your reason, and `/code-change` moves it to the decisions file and removes it from the backlog.
- **R7.** Given a plan fixes a backlog item, when the change is coded and reviewed, then the plan names the item, the entry is removed from the backlog, and the review checks that.
- **R8.** Given an interview, when the play-back and the plan file are produced, then both list every question asked and your answer, in a "Decisions from the interview" section.
- **R9.** Given the shared policy is edited, when the change is reviewed, then its original is saved as a before-copy in the reviews folder and the review compares the two.

## Decisions from the interview
| # | Question | Your answer |
|---|---|---|
| 1 | On master the planner can only write the plan file. Should the plan record accepted items and `/code-change` make the edits on the branch? | Yes, the plan records it |
| 2 | Should each backlog entry use a fixed format? | Yes, fixed format |
| 3 | Should plans that fix a backlog item name it in a "Backlog items fixed" line, with `/code-change` removing the entry and the review checking? | Yes, named in the plan |
| 4 | Play-back: is the understanding and requirement list right? | Yes, with one change: the shell-edit guard entry goes to the backlog, not the decisions file |
| 5 | Plan review: is the plan right? | Yes, with one change: T2 is your next real `/plan-change` (no made-up request, no test-only decisions): "plan it now" for the shell-guard item, "keep it queued" for the rename-plan item; the accept path is checked by reading the skills |

Also decided by you in the request: the backlog holds only unfixed, unexplained review findings; the old file is retired; every item is asked about at every `/plan-change` on purpose, to keep the backlog small; "plan it now" stops further questions; a fixing change removes the entry; the play-back lists every question.

## What could go wrong / what gets lost
Nothing is lost: all three old entries are moved, and the old file stays in git history. The shared policy and process backlog live outside this project's git history, so the policy gets a before-copy and the process backlog is edited by a one-line wording change only. This change does not fix the shell-edit guard gap; that is queued in the backlog.

## Not included
- Fixing the shell-edit guard gap (it becomes a backlog item for its own change).
- Removing the inert plan-mode hook and setting.
- Feature ideas in the backlog.
- Rewriting old plans, reviews or archives that mention the old file.

## How you'll check it
**T1 — The files. Covers R1, R2.**

1. Open `docs/BACKLOG.md`, `docs/DECISIONS.md`, and look for `KNOWN_ISSUES.md`.
2. Search the project (outside `docs/plans`, `docs/reviews`, `docs/archive`) and the shared policy folder for "KNOWN_ISSUES".

Expected: the backlog has two entries in the fixed format; the decisions file has the CHANGELOG-conflict entry; the old file is gone; the search finds nothing.

**T2 — The planning step. Covers R4, R5, R8.**

This is your next real `/plan-change`, after this change is built. No made-up request and no test-only decisions.

1. Run your next real `/plan-change`.
2. Expect the backlog items one at a time, before the interview. The backlog lists the rename-plan item first and the shell-guard item second, so both get asked before "plan it now" ends the questions.
3. Choose "keep it queued" for the rename-plan item.
4. Choose "plan it now" for the shell-guard item.

Expected: nothing is written to master; the rename-plan item stays in the backlog; "plan it now" stops further backlog questions and the reminder that your original request needs its own `/plan-change` appears; the play-back lists every question and answer, and the plan has the same list.

The accept path (R6) is not run live; it is checked by reading the skills (T3).

**T3 — The code and check-in steps. Covers R3, R6, R7, R9.**

1. Read the `/code-change` and `/commit-change` skills and the policy's peer-review section.
2. Compare the policy with `docs/reviews/PWF-009-POLICY-before.md`.

Expected: logging, accepting and removing refer to the backlog and the decisions file; the gate checks the backlog; the before-copy holds the old wording and the review record covers the comparison.

## Check-in
- Type: chore
- Branch: chore/PWF-009-backlog
- Commit message: chore(PWF-009): backlog replaces known issues, asked about at every plan

---

## Technical detail (for Claude)
No Rust, frontend, migration or schema work; the CLAUDE.md feature cycle doesn't apply.

**New / changed files**
- Create `docs/BACKLOG.md`: header explaining scope (unfixed, unexplained review findings only), the entry format (`## <title>`, `- **Found in:**`, `- **Severity:**`, `- **Files:**`, `- **What's wrong:**`), and the two entries, in this order so that T2 asks the rename-plan item before the shell-guard item (the rename-plan entry first, Nit; then the shell-guard entry, whose note gives the direction: block commits on master via the shell first; severity Medium). Carry over the wording of the old entries.
- Edit `docs/DECISIONS.md`: add the CHANGELOG-conflict entry (Change PWF-002, original date; Reason from the old text; note moved in PWF-009).
- Delete `KNOWN_ISSUES.md`.
- `.claude/skills/plan-change/SKILL.md`: new step after "Assign the change number" and before the interview: read `docs/BACKLOG.md` (skip if missing or empty); one AskUserQuestion per item (plan it now / keep it queued / accept, with the reason asked as a follow-up for accept); plan-it-now switches subject, ends the loop, adds the reminder; accepted items and items fixed are written to the plan, never to master. Add to the plan format: "Decisions from the interview" section, "Backlog items accepted" (with reasons) and "Backlog items fixed" lines (omit when empty). Play-back lists every question and answer.
- `.claude/skills/code-change/SKILL.md`: the KNOWN_ISSUES mentions (lines ~79, 102, 130, 163 and the omitted long lines at 3, 19, 68 — check each) point to BACKLOG.md; add a step applying the plan's accepted items (add to DECISIONS.md, remove from BACKLOG.md) and removing fixed items; review record notes both; the reviewer checks removal.
- `.claude/skills/commit-change/SKILL.md` (line ~34 gate) and `.claude/skills/build-changes/SKILL.md` (line ~39): wording to BACKLOG.md.
- `.claude/hooks/block-main-edits.sh` line 6: comment points to docs/BACKLOG.md.
- `D:/projects/shared-claude-conventions/POLICY.md` (outside git): first save the original as `docs/reviews/PWF-009-POLICY-before.md`, committed with the records; then change "the project's known-issues file" to the project's backlog (line ~184) and any other mention found by search; add the planning-step backlog question to the Workflow model if it describes `/plan-change`.
- `D:/projects/shared-claude-conventions/PROCESS_BACKLOG.md` (outside git): lines 4 and 47 mention the old file; update the wording to BACKLOG.md. A before-copy is also saved, as for PWF-004.
- `CLAUDE.md`: add the backlog to the Workflow "Records" line.
- `CHANGELOG.md`: entry under `[Unreleased]`.

**Planned tests**
- R1 — Manual (checked by Claude): read the files and confirm KNOWN_ISSUES.md is absent.
- R2 — Automated (command): a search for the old name across the project and shared folder, excluding historical records, returns nothing.
- R3 — Manual (checked by Claude): read the skills and gate wording; no running app needed.
- R4 — Manual (needs the user): behaviour of an interactive question box, checked in the user's next real `/plan-change` (T2); can't be driven by a command.
- R5 — Manual (needs the user): same reason as R4.
- R6 — Manual (checked by Claude): read the plan-change and code-change skills for the accepted-item flow. Not run live, by the user's choice.
- R7 — Manual (checked by Claude): read the skills' fixed-item removal and reviewer check.
- R8 — Manual (needs the user): inspect a real play-back and plan; T2.
- R9 — Manual (checked by Claude): diff the policy against its before-copy and confirm the copy equals the original.
