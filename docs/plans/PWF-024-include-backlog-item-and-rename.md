# PWF-024 — Include a backlog item in the change, and a /rename hint

- **Change:** PWF-024
- **Date:** 2026-10-25

## What you'll see change
Nothing in the app. Two things change when you run `/plan-change`:

1. Each backlog question now has four choices instead of three: plan it now, include it in this change, keep it queued, accept it. "Include it in this change" adds the item to the plan you are already making, with its own requirement and its own test, and the plan lists it as a backlog item fixed. The remaining backlog items are still asked after it. The planner recommends "include" only when the item touches the same files or area as the change being planned, and tells you why. Otherwise it recommends keeping the item queued. The three existing choices behave as before.
2. Right after the planner tells you the change number, it also shows the command to name the chat, for example `/rename PWF-025`. If the number you were told moves later (for example after a clash with another planning chat), it announces the new number and shows `/rename` again with the final one.

The backlog file's introduction and the shared policy's one sentence about the backlog choices are updated to list all four choices. The policy edit is made by you by hand, with the exact old and new wording given in the technical detail below.

## Requirements
- **R1.** Given a backlog entry is put to the user, when the planner offers choices, then there are four: plan it now, include it in this change, keep it queued, accept it.
- **R2.** Given the user picks "include", when planning continues, then the item joins this plan's scope with its own requirement and its own planned test, it is listed under "Backlog items fixed", and the remaining backlog items are still put to the user.
- **R3.** Given an entry touches the same files or area as the change being planned, when the planner offers choices, then it recommends "include" and says why. Given it doesn't, then it recommends keeping it queued.
- **R4.** Given the planner announces the change number, when it tells the user, then it also shows `/rename <NUMBER>`.
- **R5.** Given the change number the user was told moves (for example after a claim clash), when the planner announces the final number, then it shows `/rename` again with that final number.
- **R6.** Given the docs describe the backlog choices, when this change is done, then the backlog file's introduction lists all four, and the shared policy's sentence is changed by hand to the exact wording in the technical detail, after `/code-change` saves a before-copy and stops.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog 1: "Master guard: an absolute path into another worktree is allowed, the same path written relatively is blocked" (Informational) | Keep it queued |
| Backlog 2: "dev.mjs tells a worktree user to run npm install when node_modules is missing" (Low) | Keep it queued |
| Update the shared policy sentence by hand, the way PWF-021 did | Yes, update by hand |
| Put the exact old and new policy text in the plan, so nothing about the wording is left to /code-change | Yes (added by the user at the play-back) |
| If the change number moves after a claim clash, show /rename again with the final number | Yes (added by the user at the play-back) |
| Play-back (second): "Is that right?" | Yes |

## What could go wrong / what gets lost
Nothing is lost and no data is touched. The risk is wording: a vague rule in the skill could make the planner recommend "include" too eagerly and grow changes. The rule is therefore narrow (same files or area, with a stated reason; otherwise recommend queueing). The shared policy is outside this repository, so `/code-change` never edits it: it saves a before-copy in the review records folder and stops for your hand edit.

## Not included
- No change to `/code-change`, which already removes every item listed under "Backlog items fixed" from the backlog.
- No change to the existing three choices.
- No automatic renaming of the chat: the planner only shows the command, since only you can run it.
- The two queued backlog items stay queued.

## How you'll check it
**T1 — The skill text. Covers R1, R2, R3, R4, R5.**

1. Open the planning skill file and read step 2 and step 3.

Expected: step 3 names four choices, including the "include" rules (scope, own requirement and test, "Backlog items fixed", remaining items still asked, recommended only for same files or area with a reason, otherwise queue). Step 2 shows `/rename <NUMBER>` after announcing the number, and again with the final number if it moves.

**T2 — Live run of the next real planning. Covers R1, R2, R3, R4.**

1. Run `/plan-change` for the next real change while the backlog still has entries.

Expected: the change number is announced with the `/rename` line under it; each backlog question has four choices, with the recommendation matching how close the entry is to that change.

**T3 — The documents. Covers R6.**

1. After `/code-change` stops for the policy edit, apply the replacement given in the plan, then reopen the shared policy and the backlog file.

Expected: both name all four choices, and the policy line otherwise reads as before.

## Check-in
- Type: chore
- Branch: chore/PWF-024-include-backlog-item-and-rename
- Commit message: chore(PWF-024): add "include it in this change" backlog choice and /rename hint to /plan-change

## Policy edits for you to make by hand
One edit, to `D:/projects/shared-claude-conventions/POLICY.md`, line 31 only. The old text appears exactly once in the file (checked on 2026-10-26). Everything else in the file stays as it is.

Old text:

```
(plan it now, keep it queued, or accept it)
```

New text:

```
(plan it now, include it in this change, keep it queued, or accept it)
```

---

## Technical detail (for Claude)

**Files**
- `.claude/skills/plan-change/SKILL.md`
  - Step 2, the "Tell the user the number in one line" bullet: after the announcement line, add a second line showing `/rename <NUMBER>` (for example "To name this chat, type: `/rename ABC-085`"). Add: if the number the user was told changes (a claim clash that moves it after it was announced, or any other reason), announce the new number the same way and show `/rename` again with the final number. Keep the skill free of project facts (generic `<NUMBER>`, no DTP).
  - Step 3: change "offer exactly three choices" to four. Add the bullet **Include it in this change.** (after "Plan it now"): the item joins this plan's scope; the interview covers it as well as the original request; it gets its own requirement (R-number) and its own planned test; it is named in the plan's "Backlog items fixed" section; the remaining backlog items are still put to the user; the original request is NOT set aside. Add the recommendation rule: recommend "include" only when the item touches the same files or area as the change being planned (the planner compares the item's "Files" line with what the request will touch), and say in the question why; otherwise recommend "Keep it queued". The recommended choice goes first in the box with "(Recommended)", per step 4's rule. Existing bullets for plan it now, keep it queued and accept it stay unchanged, except that "Plan it now" and "Include" must not be confused: only "Plan it now" stops further backlog questions.
  - Step 6 template: the "Backlog items fixed" comment now reads "Only when the change fixes backlog items (items the user chose to plan now or include): the title of each…". Nothing else in the template changes.
- `docs/BACKLOG.md`: the introduction's sentence "plan it now, keep it queued, or accept it" becomes "plan it now, include it in this change, keep it queued, or accept it"; also "A change that fixes an entry removes it" already covers included items.
- Shared policy (`D:\projects\shared-claude-conventions\POLICY.md`, outside the repository; `/code-change` saves a before-copy as `docs/reviews/PWF-024-POLICY.md-before.md`, commits it with the records, and STOPS for the user's hand edit, as PWF-021 did). Line 31 only. Exact replacement of this substring:
  - **Old text:** `(plan it now, keep it queued, or accept it)`
  - **New text:** `(plan it now, include it in this change, keep it queued, or accept it)`
  - The rest of line 31, and every other line, stays byte-for-byte as it is.
- No application code, migration, `api.ts`, `types.ts` or tests of the app are touched. The feature cycle does not apply.

**Checks:** the "all must pass" list from CLAUDE.md still runs. No lint or convention rule covers the skill text; `npm run test:conventions` is not needed because `eslint.config.js`, `scripts/check-conventions.mjs` and `tests/conventions.mjs` are untouched.

**Planned tests**
- R1 — Manual (checked by Claude): read the edited skill and confirm step 3 lists four choices with the exact names. Skill prose has no runnable test; Claude can read the file itself.
- R2 — Manual (checked by Claude): read the "Include it in this change" bullet and confirm it states own requirement and test, "Backlog items fixed", remaining items still asked, original request not set aside. Confirmed live by T2 on the next real planning.
- R3 — Manual (checked by Claude): read the recommendation rule (same files or area, with a reason; otherwise queue). Confirmed live by T2.
- R4 — Manual (checked by Claude): read step 2 and confirm the `/rename <NUMBER>` line follows the announcement. Confirmed live by T2.
- R5 — Manual (checked by Claude): read step 2 and confirm the moved-number rule. A clash can't be staged without a made-up change, so it is checked by reading only.
- R6 — Manual: Claude reads `docs/BACKLOG.md` and checks that the stop-and-wait for the user's hand edit happens, then re-reads the shared policy after the user's edit and confirms line 31 matches the new text exactly. It needs the user to make the edit; after it, Claude can verify by reading the file.
