# Review: PWF-023 — Worktree setup uses npm ci, and PowerShell forms for the bash-only commands

- **Change:** PWF-023
- **Review format:** accountability
- **Plan:** docs/plans/PWF-023-worktree-npm-ci-powershell-lock-commands.md (approved in commit 36bef8c)
- **Branch:** chore/PWF-023-worktree-npm-ci-powershell-lock-commands
- **Reviewer:** Independent Standards, Spec and Correctness reviewers (fresh sub-agents), then one fresh re-reviewer (round 1)
- **Scope:** diff of chore/PWF-023-worktree-npm-ci-powershell-lock-commands against master — 3 files (CLAUDE.md, docs/BACKLOG.md, the plan) plus these records, about 10 lines outside the plan

## Findings
Severity and caused label are the reviewer's, never changed by the author.

### Standards reviewer
- **[Low]** The hard-coded Git bash path in the PowerShell forms had no stated reason — CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** fixed (all three forms now read "in PowerShell, where bash isn't on the path, and with Git in its default folder: ...")
- **[Nit]** The same PowerShell wrapper is written out three times — CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** explained (the plan's R2 and R3 ask for the form at each of the three spots, and each spot is read on its own, for example the lock-recovery step, so one shared note would be worse)
- **[Informational]** The `npm ci` change is consistent with the standards — CLAUDE.md
  **Caused by this change:** no
  **Disposition:** explained (observation only, no action)

### Spec reviewer
- **[Nit]** The Worktree setup line's parenthetical "(never `npm install` there ...)" puts the `npm install` text back on the line that R1 says should not tell anyone to run it — CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** explained (it forbids the command rather than instructing it, and gives the non-obvious reason, which the Standards review asks for)
- **[Nit]** The Guard line's PowerShell lead-in was worded differently from the other two — CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** fixed (same edit as the Standards Low: all three read the same)

### Correctness reviewer
- **[Low]** scripts/dev.mjs says "Run npm install first." when node_modules is missing, which is stale advice in a worktree — scripts/dev.mjs
  **Caused by this change:** no
  **Disposition:** logged in docs/BACKLOG.md
- **[Nit]** README.md still says `npm install` — README.md
  **Caused by this change:** no
  **Disposition:** explained (the README is for a normal clone; the new rule is for worktrees only)
- **[Informational]** The `npm ci` claim is correct; it fails if the lockfile has drifted, which would be a stop signal — CLAUDE.md
  **Caused by this change:** no
  **Disposition:** explained (observation only; the author ran R5 and `npm ci` succeeded on the committed lockfile)

## Re-review
### Round 1
Triggered by the two fixes, the explanations and the logged item. The re-reviewer accepted every outcome: both fixes resolve their findings and the lock's own settings lines are unchanged; all four explanations were accepted; the "caused: no" label on the logged dev.mjs item is true (the diff does not touch that file) and the backlog entry exists. It raised no new finding. The round is clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the Worktree setup line (T1) | Pass (checked by Claude) |
| R2 | Read the master lock paragraph and "Turn it back on" (T2) | Pass (checked by Claude) |
| R3 | Read the Guard line (T2) | Pass (checked by Claude) |
| R4 | All checks listed in CLAUDE.md pass; the lock-setting lines are not in the diff | Pass |
| R5 | `git restore package-lock.json`, `npm ci`, compare hash: succeeded, hash 30093fa0…81236ab identical, worktree clean | Pass |

## Deviations from the plan
None. The Worktree setup line carries a short reason in parentheses and the PowerShell forms carry a short lead-in; the plan did not forbid either.

## Summary
CLAUDE.md now tells worktree setup to use `npm ci` and gives the PowerShell form of the three bash-only commands. `npm ci` was proven on the committed lockfile before any edit. One uncaused finding (a stale message in scripts/dev.mjs) is logged in the backlog. One re-review round was clean.
