---
name: code-change
description: Code an approved small change, or one ticket (NNN.1) of a large change, in a worktree. Codes test-first, reviews with Matt's code-review (plus our Correctness reviewer for Full), translates the findings for Jason, fixes, re-reviews once, writes the review record and asks Jason to approve it.
disable-model-invocation: true
---

# Code a change

Third step: design → plan → **code** (with review) → merge. Takes a change number (`PWF-031`) or a ticket number (`PWF-031.2`). Default branch, checks, worktree folder and setup come from CLAUDE.md. Stop where a step says STOP. The plan is frozen after the approved-plan commit; anything that differs from it goes in the record's Deviations.

## 1. Find and open the change
- Run `git branch --show-current` and `git worktree list`, each on its own. Continue an existing worktree for the change if there is one.
- Otherwise start from the default branch with no uncommitted changes (`git pull --ff-only`; STOP if it can't). Read the plan and the Level. Open a worktree in CLAUDE.md's folder: for a small change on its plan's branch; for a ticket, on its own branch `<type>/<NUMBER>.<N>-<title>` off the large change's integration branch (the ticket's earlier blockers must already be merged into it, else STOP). Run CLAUDE.md's worktree setup.
- Enter it: load `EnterWorktree` with `ToolSearch` (`select:EnterWorktree,ExitWorktree`), call it with the path, and check `git rev-parse --show-toplevel` and `git branch --show-current`. STOP if either is wrong. All work happens in the worktree.
- In one plain line, tell Jason which other open changes touch the same files, and carry on.

## 2. Code
Build exactly what the plan says; if it is wrong or impossible, STOP and explain. Use `mattpocock-skills:tdd`, or for type **fix**, `mattpocock-skills:diagnosing-bugs` (reproduce the bug reliably, usually a failing test, before touching code, and keep that test). Follow CLAUDE.md. Commit as you go as `<type>(<NUMBER>): …`. Fix a plan's backlog items by removing them from `docs/BACKLOG.md`; add accepted ones to `docs/DECISIONS.md` with the reason. Never run anything against the data folder (CLAUDE.md's "Data folder" line); before any migration, take the steps in its "Backup before a migration" line (if it has none, say so and ask Jason how to back up). Run CLAUDE.md's checks; fix until they pass.

## 3. Review
You wrote the code, so you do not rate it. Reviewers only read and report, never edit.
- **Light:** run `mattpocock-skills:code-review` on the diff against the default branch, with the plan as the spec.
- **Full:** run it **and** launch a fresh **Correctness** sub-agent (Agent tool) at the same time. Correctness gets the diff, the plan and the commit list only: is the code right? A `feat` gets two angles (general correctness plus the most relevant second: data integrity, security, …); a `fix` confirms the root cause is fixed and looks for the same bug pattern in the touched files; a `refactor` confirms behaviour did not change. Under 400 words.
- Tell the reviewers the record and changelog are written afterwards.

## 4. Translate for Jason
Turn every finding into one block (keep the reviewer's severity, never re-rate): severity `[High]` data loss, security hole, crash or requirement plainly unmet · `[Medium]` real bug or requirement partly met · `[Low]` minor bug or standards breach · `[Nit]` · `[Informational]`; **Caused by this change** yes/no; a plain-English description with files; a recommendation; and, where Jason must choose, his call (ask in the question box, recommended first). Always ask for: a fix that would go against the plan (quote it), a fix that would touch the data folder, migrations or import/export.

## 5. Settle
Every finding ends as **fixed**, **explained** (with the reason), **accepted by Jason**, or **moved to backlog** (`docs/BACKLOG.md`). A "caused: yes" finding can only be fixed, explained, or accepted by Jason, never moved. Fix what should be fixed, then re-run the checks.

## 6. Re-review, one round
If any finding was fixed or explained, launch one fresh reviewer. It gets only the findings (with your outcome and reason for each) and the diff of the fixes. It says `accepted` or `rejected` (with a reason) for each fix and each explanation, and whether it found anything new. Settle new findings as in step 5. Anything still rejected goes to Jason with both sides in plain English; he decides, and you record **Decided by:** Jason. No further round.

## 7. Write the record
Save `docs/reviews/<same file name as the plan>.md` (a ticket: `docs/reviews/<NUMBER>.<N>-<slug>.md`), in exactly this form, and commit it with the changelog entry (for a ticket, the entry is added once, at merge):

```
# Review: <NUMBER> — <Title>
- **Change:** <NUMBER>
- **Level:** Light | Full
- **Plan:** <path>
- **Reviewers:** <who>

## Findings
- **[Severity]** <description> — <files>
  **Caused by this change:** yes | no
  **Recommendation:** <text>
  **Outcome:** fixed (<what>) | explained (<why>) | accepted by Jason | moved to backlog
  **Decided by:** Jason            (only where his call was needed)
  **Re-review:** accepted | rejected   (every fixed or explained finding)

## Re-review
**Re-review clean:** yes | no

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | <test> | Pass | Fail | Manual

## Deviations from the plan
<None, or each one>

## Summary
<two sentences>
```
A Fail can only be fixed, then re-reviewed. A "Manual" check is one Jason owns; the lock accepts "Manual" as the result and it does not block the check-in. If the check was run, the result says so: "Pass" or "Fail". Any other result (blank, "TBD") is refused. If the re-review found anything new, "Re-review clean" is `no` and Jason's decision on what is left is written as `**Decided by:** Jason` in that section. For the last ticket of a large change, also write the change's own record (findings carried, and a trace row per ticket).

## 8. Approve
Show Jason the record in plain English and ask him to approve it. His approval is the proof a decision was made; the lock only checks the record is complete. A small change ends: *"Next: `/merge-change`."* A ticket merges into the integration branch with `git merge --no-ff` (message `chore(<NUMBER>.<N>): merge ticket`), then offers the next unblocked ticket: *"Next: `/code-change <NUMBER>.<N+1>`."*, or *"Next: `/merge-change`."* when all are done. Never merge into the default branch here.
