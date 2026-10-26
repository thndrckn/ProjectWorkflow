# Backlog

Review findings that were neither fixed nor explained. Only findings a change did not cause end up here; there are no feature ideas. Every `/plan-change` puts each entry to the user: plan it now, include it in this change, keep it queued, or accept it (it then moves to `docs/DECISIONS.md` with a reason). A change that fixes an entry removes it; that change's own records keep the history.

Entry format:

```
## <One-line title>
- **Found in:** <change number>
- **Severity:** <Informational | Nit | Low | Medium | High>
- **Files:** <files involved>
- **What's wrong:** <plain English>
```

## Master guard: an absolute path into another worktree is allowed, the same path written relatively is blocked
- **Found in:** PWF-017
- **Severity:** Informational
- **Files:** `.claude/hooks/shell-command-check.js`, `.claude/hooks/block-main-edits.sh`
- **What's wrong:** While the main folder is on master, a shell command that writes to another worktree's folder (for example `cp` or `Copy-Item` of a plan file into a change's worktree) is allowed when the destination is written as an absolute path, because that worktree is judged by its own branch, and is blocked when the same destination is written relatively, because a relative path cannot be resolved and counts as inside the project. The reviewer who rated it found this intended, best-effort behaviour that fails closed, not a defect, and not caused by PWF-017; it is logged at the user's direction because the cost is only that cross-worktree writes need absolute paths.

## dev.mjs tells a worktree user to run npm install when node_modules is missing
- **Found in:** PWF-023
- **Severity:** Low
- **Files:** `scripts/dev.mjs`
- **What's wrong:** When `node_modules` is missing, `npm run dev` says "Run npm install first." In a worktree, CLAUDE.md now says to use `npm ci` instead, so the message gives stale advice there. It is only a message, not a break, and it was already there before this change.
