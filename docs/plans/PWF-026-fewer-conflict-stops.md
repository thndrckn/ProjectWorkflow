# PWF-026 — Fewer stops for merge conflicts

- **Change:** PWF-026
- **Date:** 2026-10-26

## What you'll see change
- At the start of `/code-change`, if another open change plans to touch the same files, you get one plain line naming the files and the other change, and the work carries on. It no longer stops to ask whether to continue.
- At check-in, nothing changes for a changelog-only conflict: it still keeps both entries itself.
- At check-in, on any other conflict, it still stops and leaves the branch as it was, but the message now shows each conflicted file with the resolution it would use and why. It resolves nothing until you answer.

## Requirements
- **R1.** Given other open changes whose plans name a file this plan also names, when `/code-change` starts, then it reports the overlapping files and the other change in one line and carries on without asking.
- **R2.** Given no other open change names a file this plan names, when `/code-change` starts, then it says nothing about overlap.
- **R3.** Given the catch-up merge in `/commit-change` conflicts only in the changelog, when the check-in runs, then it still keeps both entries itself and tells you in one line (unchanged).
- **R4.** Given the catch-up merge conflicts in any file other than the changelog, when the check-in runs, then it stops, shows each conflicted file with the resolution it proposes and why, leaves the branch as it was before the merge, and waits for your answer.
- **R5.** Given the check-in has stopped on such a conflict, when you haven't answered yet, then no resolution is applied and nothing is merged or pushed.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: master guard, absolute vs relative path into another worktree (PWF-017) | Keep it queued |
| Backlog: dev.mjs says `npm install` in a worktree (PWF-023) | Keep it queued |
| Should check-in add the proposed resolution to its stop message and still never resolve before you answer? | Yes, add the proposal |
| Play-back: "Is that right?" | Yes |
| Review of the plan file | Three changes: PWF-025 also edits `/commit-change`, so this change is coded after PWF-025 is checked in; no `docs/DECISIONS.md` entry for the overlap rule; T1 and T2 happen at the next real overlap or conflict, none arranged. Otherwise approved |

## What could go wrong / what gets lost
Nothing. Only the wording of two shared skill files changes. The one risk is that two changes meeting conflicts at check-in is now only noticed in a one-line report, which is the point of the change.

## Not included
- No change to how a changelog-only conflict is resolved.
- No automatic resolution of any other conflict.
- No change to the migration-clash check or to the checks run after the merge.
- No change to the backlog items put to you at planning.

## How you'll check it
**T1 — Overlap is reported, not asked. Covers R1, R2.**

No conflict or overlap is arranged for this test. It happens the next time it really occurs.

1. The next time you type `/code-change` while another change in flight names a file the new plan also names, watch the start of the run. (On a run with no overlap, check that no overlap line appears.)

Expected: one line names the overlapping files and the other change, and the run carries on with no question. With no overlap, no line appears.

**T2 — Check-in stop shows the proposal. Covers R3, R4, R5.**

No conflict is arranged for this test. It happens the next time a check-in really meets a conflict.

1. The next time `/commit-change` meets a conflict, read the stop message. (A changelog-only conflict is the other case to watch for.)

Expected: the merge is aborted, each conflicted file is listed with the proposed resolution and its reason, nothing is merged or pushed, and it waits. A changelog-only conflict still resolves itself with a one-line note.

## Check-in
- Type: chore
- Branch: chore/PWF-026-fewer-conflict-stops
- Commit message: chore(PWF-026): report change overlap in one line at code start, show proposed resolutions when check-in stops on a conflict

---

## Technical detail (for Claude)
- `.claude/skills/code-change/SKILL.md`, step 2 (last bullet): replace "say that the second check-in to land will meet conflicts there, and ask whether to continue. STOP until they answer" with a one-line report naming the files and the other change, saying the second check-in to land will meet conflicts there, then carry on. No-overlap case stays silent.
- `.claude/skills/commit-change/SKILL.md`, step 4, the "Anything else" bullet: before `git merge --abort`, read each conflicted file's conflict hunks and work out a proposed resolution per file; then abort the merge (branch back as before), STOP, and present the files with proposal and reason in plain English. Keep "do not apply anything until the user answers". The CHANGELOG-only bullet is untouched. Update the "Never" list only if it contradicts (it should not).
- `docs/DECISIONS.md`: the PWF-015 entry ("stops on every other conflict") stays accurate; no edit. Settled by the user: no `docs/DECISIONS.md` entry for the report-not-ask overlap rule.
- Skills stay free of project-specific facts. No Rust, frontend, migration or schema work, so the CLAUDE.md feature cycle does not apply.
- **Order with PWF-025:** PWF-025 also edits `/commit-change`, so this change is coded after PWF-025 is checked in, and starts from the default branch as it is then. Because of this, the overlap report this change introduces does not apply to the coding of this change itself.

**Planned tests**
- R1 — Manual: read the edited step 2 and confirm it reports in one line and does not stop. Skill text has no automated test. Claude can check by reading the file; a live run needs the user (T1).
- R2 — Manual: read step 2 and confirm the no-overlap case stays silent. Claude can check by reading the file.
- R3 — Manual: read step 4 and confirm the CHANGELOG-only bullet is unchanged (`git diff` shows no edit to it). Claude can run this.
- R4 — Manual: read the edited "Anything else" bullet for per-file proposal and reason, abort before stopping. Claude can check by reading; a live conflict needs the user (T2).
- R5 — Manual: read the bullet and confirm it says nothing is applied, merged or pushed before the user's answer. Claude can check by reading.
