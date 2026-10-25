# Design decisions

Decisions explained as "by design" during code review, so reviewers and Claude don't raise them again. `/code-change` adds an entry when a review finding is explained as by design, unless the decision is already here. Observations that aren't decisions stay in the review record only.

Entry format:

```
## <Decision, in one line>
- **Change:** <change number>
- **Date:** <YYYY-MM-DD>
- **Reason:** <why it is this way>
```

## The number-claim placeholder file has a random suffix
- **Change:** PWF-015
- **Date:** 2026-10-24
- **Reason:** `/plan-change` claims its change number with `docs/plans/<NUMBER>-claimed-<six random letters>.md`, not a fixed `<NUMBER>-claimed.md`. With one fixed name, two chats claiming the same number at the same moment would silently overwrite each other's file and never notice the clash. With a random suffix both files exist, the one whose name sorts first keeps the number, and the other chat takes the next one.

## /code-change keeps a single-folder fallback next to the worktree flow
- **Change:** PWF-015
- **Date:** 2026-10-24
- **Reason:** A worktree cannot carry the user's own uncommitted edits, and the skills are shared with projects that have no "Worktree folder" line in CLAUDE.md. For those two cases `/code-change` creates the branch in the main folder as it always did, and `/commit-change` has nothing to remove afterwards. This is deliberate, not a leftover to delete.

## Each skill states its own missing-backup-line fallback
- **Change:** PWF-007
- **Date:** 2026-10-24
- **Reason:** `/code-change`, `/commit-change` and `/build-changes` each say what to do when CLAUDE.md has no "Backup before a migration" line (say so and ask the user), instead of pointing at one shared place. Each skill has to stand alone when it runs, so the repeated wording is deliberate, not duplication to remove.

## The commit-change catch-up resolves a CHANGELOG-only conflict itself, and stops on every other conflict
- **Change:** PWF-015 (replaces PWF-002, which stopped on every CHANGELOG conflict)
- **Date:** 2026-10-24
- **Reason:** Every change adds an entry at the top of `## [Unreleased]` in `CHANGELOG.md`, so when two changes are coded at once in separate worktrees, the second one's catch-up merge in `/commit-change` conflicts there almost every time. When `CHANGELOG.md` is the only conflicting file and this change's own diff to it is just its own entry, the skill keeps the default branch's text, adds this change's entry at the top of Unreleased, tells the user in one line, and carries on. Any other conflict still aborts the merge and asks the user, and the skill still never rewrites a change's entry otherwise. (The earlier stop-and-ask rule was PWF-002, moved here from the former known-issues file in PWF-009.)

## The master lock covers updates made through the main folder, not plumbing run from a stale worktree
- **Change:** PWF-017
- **Date:** 2026-10-24
- **Reason:** `core.hooksPath` is the relative folder `.githooks`, so each worktree runs its own branch's copy of the hook (none, in a worktree branched before the lock existed). The default branch can only be advanced by porcelain (commit, merge, pull) in the main folder, where the default branch's own copy runs. From any other worktree only plumbing can move it (`update-ref`, `branch -f`, a fetch refspec), which the Claude guard blocks for Claude; a user typing plumbing by hand is the same class as turning the lock off by hand, which CLAUDE.md documents as the user's own step. An absolute hook path was not chosen: it would make `status` and the lock's own bootstrap depend on the main folder holding the files.

## The master lock reads review-record rounds only by keyword
- **Change:** PWF-017
- **Date:** 2026-10-24
- **Reason:** Review records are free prose. The checker reads the labelled lines (severity, "Caused by this change", "Disposition", the trace table, the "Settled by the user:" phrase) exactly, but a re-review round only by keyword (a rejection, "clean", a verdict word such as accepted, resolved, confirmed), so it cannot check item by item that each outcome was accepted. A false refusal fails safe, and `/commit-change` reads the record itself and stops when its reading and the checker disagree. The limit is stated in the checker's header comment. **Temporary:** the user has accepted this only until the planned change to the re-review line format, which will give the rounds a machine-readable form and replace the keyword reading; remove this entry then.
