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

## The commit-change catch-up stops on every CHANGELOG conflict
- **Change:** PWF-002
- **Date:** 2026-10-23
- **Reason:** Every change adds an entry at the top of `## [Unreleased]` in `CHANGELOG.md`, so when two changes are in flight, the second one's catch-up merge in `/commit-change` will usually conflict there. The skill aborts the merge and asks the user on any conflict, and never edits the CHANGELOG entry itself, so that conflict is resolved by hand each time. Accepted for now: it keeps conflict decisions with the user. A rule for resolving CHANGELOG-only conflicts automatically would need its own change. (Moved here from the former known-issues file in PWF-009.)
