# Backlog

Review findings that were neither fixed nor explained. Only findings a change did not cause end up here; there are no feature ideas. Every `/design-change` puts each entry to the user: plan it now, include it in this change, keep it queued, or accept it (it then moves to `docs/DECISIONS.md` with a reason). A change that fixes an entry removes it; that change's own records keep the history.

Entry format:

```
## <One-line title>
- **Found in:** <change number>
- **Severity:** <Informational | Nit | Low | Medium | High>
- **Files:** <files involved>
- **What's wrong:** <plain English>
```

## dev.mjs tells a worktree user to run npm install when node_modules is missing
- **Found in:** PWF-023
- **Severity:** Low
- **Files:** `scripts/dev.mjs`
- **What's wrong:** When `node_modules` is missing, `npm run dev` says "Run npm install first." In a worktree, CLAUDE.md now says to use `npm ci` instead, so the message gives stale advice there. It is only a message, not a break, and it was already there before this change.

## The guard checks the session's own branch, not the folder being written to
- **Found in:** PWF-028
- **Severity:** Low
- **Files:** `hooks/block-main-edits.sh`
- **What's wrong:** The guard checks the session's own branch, not the folder being written to. Noted while rebuilding the guard in PWF-028 and left as it was.

## The lock does not catch moving trunk backwards
- **Found in:** PWF-028
- **Severity:** Low
- **Files:** `githooks/trunk-lock-check.mjs`
- **What's wrong:** The lock only looks at commits new to trunk. Moving trunk back (for example `git reset --hard HEAD~5`) adds none, so it is allowed and history can be rewound silently. It was already so before PWF-028.

## A branch merged into trunk can carry its own copy of the lock
- **Found in:** PWF-028
- **Severity:** Informational
- **Files:** `githooks/trunk-lock-check.mjs`, `githooks/reference-transaction`
- **What's wrong:** In a project that keeps the lock inside the project, git has already checked out the incoming branch's files when the hook runs, so a branch could carry a weakened checker. The rule against loosening CLAUDE.md's lock settings does not cover the checker's own code; review is the protection. A project that loads the lock from `release/` is not affected. It was already so before PWF-028.

## The design has no rule for fixes made after the single re-review
- **Found in:** PWF-028
- **Severity:** Low
- **Files:** `docs/workflow-v2.md`, `skills/code-change/SKILL.md`
- **What's wrong:** The workflow allows one narrow re-review. If that re-review rejects a fix or raises something new, the fixes made after it are checked by nobody, and the record can only say the round was not clean and that Jason decided. Consider a narrow check of those fixes when they are to the lock or guard.

## POLICY.md's Light review leaves out "each kept short"
- **Found in:** PWF-029
- **Severity:** Nit
- **Files:** `docs/POLICY.md`
- **What's wrong:** `docs/workflow-v2.md` says the Light reviewers (Standards and Spec) are each kept short; the Depth paragraph in POLICY.md's Peer review does not say so. Found by the PWF-029 review; PWF-029 did not cause it.

## CLAUDE.md's "never push until Jason says so" does not say what counts as the go-ahead
- **Found in:** PWF-029
- **Severity:** Low
- **Files:** `CLAUDE.md`
- **What's wrong:** The Rules say never to push until Jason says so, but `/merge-change` pushes the default branch itself. The rule should say that Jason typing `/merge-change` is that go-ahead. Raised by Jason while checking PWF-029.

## adopt.sh and the lock check disagree on what "lock on" means in this repo
- **Found in:** PWF-029
- **Severity:** Low
- **Files:** `adopt.sh`, `githooks/trunk-lock-check.mjs`, `CLAUDE.md`
- **What's wrong:** In a project, `adopt.sh` points git at `release/githooks`. In ProjectWorkflow itself the lock check (`status`, and so `/merge-change`) only accepts the repo's own `githooks` folder, so it reads OFF when `release/githooks` is set, and `/merge-change` stops. Decide which this repo should use and make `adopt.sh`, the check and CLAUDE.md agree. Planned as PWF-030. Raised by Jason while running `/merge-change` for PWF-029.
