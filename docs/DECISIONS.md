# Design decisions

Decisions explained as "by design" during code review, so reviewers and Claude don't raise them again. `/code-change` adds an entry when a review finding is explained as by design, unless the decision is already here. Observations that aren't decisions stay in the review record only.

Entry format:

```
## <Decision, in one line>
- **Change:** <change number>
- **Date:** <YYYY-MM-DD>
- **Reason:** <why it is this way>
```

## Each skill states its own missing-backup-line fallback
- **Change:** PWF-007
- **Date:** 2026-10-24
- **Reason:** `/code-change`, `/commit-change` and `/build-changes` each say what to do when CLAUDE.md has no "Backup before a migration" line (say so and ask the user), instead of pointing at one shared place. Each skill has to stand alone when it runs, so the repeated wording is deliberate, not duplication to remove.

## The commit-change catch-up resolves a CHANGELOG-only conflict itself, and stops on every other conflict
- **Change:** PWF-015 (replaces PWF-002, which stopped on every CHANGELOG conflict)
- **Date:** 2026-10-24
- **Reason:** Every change adds an entry at the top of `## [Unreleased]` in `CHANGELOG.md`, so when two changes are coded at once in separate worktrees, the second one's catch-up merge in `/commit-change` conflicts there almost every time. When `CHANGELOG.md` is the only conflicting file and this change's own diff to it is just its own entry, the skill keeps the default branch's text, adds this change's entry at the top of Unreleased, tells the user in one line, and carries on. Any other conflict still aborts the merge and asks the user, and the skill still never rewrites a change's entry otherwise. (The earlier stop-and-ask rule was PWF-002, moved here from the former known-issues file in PWF-009.)
