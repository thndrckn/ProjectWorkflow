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

## A review where every finding was a plain fix gets no re-review
- **Change:** PWF-008
- **Date:** 2026-10-24
- **Reason:** The re-review is triggered by any outcome that isn't a plain fix (an explanation, a logged item, a disputed label) or a fixed failed requirement. Fixes to findings in a review where everything was plainly fixed are not independently re-checked; that is the rule as the user set it, because the author has no judgement call to defend when it simply fixed what the reviewer found.
