# Design decisions

Decisions explained as "by design" during code review, so reviewers and Claude don't raise them again. `/code-change` adds an entry when a review finding is explained as by design, unless the decision is already here. Observations that aren't decisions stay in the review record only. A by-design reason that belongs to one spot in the code goes in a comment at that spot instead, not here; only project-wide reasons are entries in this file.

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
