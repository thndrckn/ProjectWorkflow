# Backlog

Review findings that were neither fixed nor explained. Only findings a change did not cause end up here; there are no feature ideas. Every `/plan-change` puts each entry to the user: plan it now, keep it queued, or accept it (it then moves to `docs/DECISIONS.md` with a reason). A change that fixes an entry removes it; that change's own records keep the history.

Entry format:

```
## <One-line title>
- **Found in:** <change number>
- **Severity:** <Informational | Nit | Low | Medium | High>
- **Files:** <files involved>
- **What's wrong:** <plain English>
```

## rename-plan.sh and plansDirectory are inert while plan mode is blocked
- **Found in:** PWF-001
- **Severity:** Nit
- **Files:** `.claude/hooks/rename-plan.sh`, `.claude/settings.json`
- **What's wrong:** The rename-plan hook runs after `ExitPlanMode`, and `plansDirectory` only matters to plan mode. Plan mode is blocked, so neither does anything today. They were kept because the approved plan said to keep them; the review suggested deleting them, which was declined because it contradicts the plan. Remove them in a later change if plan mode is never coming back.

## The shared policy's change-number example uses one project's real prefix
- **Found in:** PWF-011
- **Severity:** Nit
- **Files:** `D:\projects\shared-claude-conventions\POLICY.md`
- **What's wrong:** The "Change numbers" and "Commit message convention" sections of the shared policy use `DTP-085` as their example, which is this project's real prefix, while the skills now use the neutral `ABC-085`. The three new rules cover skills and hooks, not the policy itself, and the plan left placeholder examples out, so it was not changed.
