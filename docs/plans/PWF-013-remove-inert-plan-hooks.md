# PWF-013 — Remove the inert plan-mode leftovers

- **Change:** PWF-013
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app. The workflow settings lose three leftovers from the old plan-mode workflow that no longer do anything: the plan-renaming script, the setting that runs it after plan mode ends, and the plan-folder setting. Plan mode stays blocked, and the guard against editing `master` is untouched. Old plans and reviews that mention these leftovers stay as history.

## Requirements
- **R1.** Given the project settings, when the change is done, then the plan-renaming script no longer exists and the settings no longer mention it or the plan-folder setting.
- **R2.** Given the settings after the cleanup, when Claude tries to enter plan mode, then it is still refused with the existing message.
- **R3.** Given the settings after the cleanup, when an edit on `master` is attempted, then the guard still blocks it, and the guard's self-test still passes.
- **R4.** Given the backlog, when the change is done, then the "rename-plan.sh and plansDirectory are inert while plan mode is blocked" entry is gone.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog entry "rename-plan.sh and plansDirectory are inert while plan mode is blocked": plan it now, keep it queued, or accept it? | Plan it now |
| Is plan mode never coming back, so should all three leftovers (script, hook entry, plan-folder setting) be deleted? | Yes, delete all three |
| Play-back: "Is that right?" | Yes |

## Backlog items fixed
- rename-plan.sh and plansDirectory are inert while plan mode is blocked

## What could go wrong / what gets lost
Nothing. If plan mode ever returns, the deleted pieces can be restored from git history. Your original request about code comments versus the decisions file is not part of this change and needs its own `/plan-change`.

## Not included
- The plan-mode block guard and its hook entry (they stay).
- Any edits to old plans or reviews that mention the removed files.
- The code-comments versus DECISIONS.md rule.

## How you'll check it
**T1 — Leftovers are gone. Covers R1, R4.**

1. Look in the hooks folder for the plan-renaming script.
2. Open the project settings and look for the plan-folder setting and the after-plan-mode hook entry.
3. Open the backlog.

Expected: no script, no plan-folder setting, no after-plan-mode hook entry, and the backlog entry about them is gone.

**T2 — Guards still work. Covers R2, R3.**

1. Run the guard self-test.
2. Ask Claude to enter plan mode.

Expected: the self-test passes, and plan mode is refused with "Plan mode isn't used in this project."

## Check-in
- Type: chore
- Branch: chore/PWF-013-remove-inert-plan-hooks
- Commit message: chore(PWF-013): remove inert rename-plan hook and plansDirectory

---

## Technical detail (for Claude)
- Delete `.claude/hooks/rename-plan.sh`.
- In `.claude/settings.json`, remove the `plansDirectory` key and the whole `PostToolUse` block. Keep both `PreToolUse` entries. Keep the JSON valid.
- Remove the entry from `docs/BACKLOG.md` (leave the header and format description).
- Grep confirmed no references in CLAUDE.md, POLICY.md, skills or other hooks; only historical plans/reviews and the backlog mention them. Re-grep before finishing.
- No Rust or frontend change, so the cargo and npm checks are unaffected; still run them per the workflow.

**Planned tests**
- R1 — Automated: after the change, a grep for `rename-plan` and `plansDirectory` outside `docs/plans`, `docs/reviews` and `docs/archive` returns nothing, the script file is absent, and `.claude/settings.json` parses as JSON.
- R2 — Automated: run `bash .claude/hooks/block-plan-mode.sh` and confirm exit code 2 and the message; confirm the `EnterPlanMode` matcher is still in settings.
- R3 — Automated: `bash .claude/hooks/test-block-main-edits.sh` passes.
- R4 — Automated: grep `docs/BACKLOG.md` for the entry title returns nothing.
