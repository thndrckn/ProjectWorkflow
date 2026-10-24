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
- **What's wrong:** The rename-plan hook runs after `ExitPlanMode`, and `plansDirectory` only matters to plan mode. Plan mode is blocked, so neither does anything today. They were kept because the approved plan said to keep them. Remove them in a later change if plan mode is never coming back.

## The master-edit guard doesn't cover file changes made through the shell
- **Found in:** PWF-001
- **Severity:** Medium
- **Files:** `.claude/hooks/block-main-edits.sh`
- **What's wrong:** The hook blocks the Edit, Write, MultiEdit and NotebookEdit tools on `master`, but not file changes or commits made through the shell (for example `sed -i`, `echo >` or `git commit`). That is a way around the most basic rule. To fix, starting with blocking commits on `master` through the shell.
