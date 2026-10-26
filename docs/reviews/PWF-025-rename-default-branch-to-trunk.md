# Review: PWF-025 — Rename the default branch from master to trunk

- **Change:** PWF-025
- **Review format:** accountability 2
- **Plan:** docs/plans/PWF-025-rename-default-branch-to-trunk.md (approved in commit da5ca61)
- **Branch:** chore/PWF-025-rename-default-branch-to-trunk
- **Reviewer:** Independent Standards, Spec and Correctness reviewers (fresh sub-agents), then one fresh re-reviewer (round 1)
- **Scope:** diff of chore/PWF-025-rename-default-branch-to-trunk against master — 17 files changed (the guard hooks and their test, the lock's checker, hook wrapper, setup script and test, the two skills, CLAUDE.md, BACKLOG.md, DECISIONS.md, CHANGELOG.md, scripts/dev.mjs, vite.config.ts, .gitattributes and the plan), about 330 lines added and 100 removed, 154 of the added lines being the plan itself

This is Part 1 of the plan. Part 2 (the by-hand rename and the CLAUDE.md "Default branch" value and lock label edits) is the user's checklist in the plan and is not part of this diff.

## Findings
Severity and caused label are the reviewer's, never changed by the author.

### Standards reviewer
- **[Low]** The shared skills now name the labels "Trunk lock" and "(or the older Master lock line)" — .claude/skills/build-changes/SKILL.md, .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (the lock is part of the shared workflow's own vocabulary, not a project number, file or feature; the interim alias is needed so the skills do not skip the lock check while CLAUDE.md still says "Master lock" between check-in and the user's hand edit, which would fail open; recorded as a project-wide decision in docs/DECISIONS.md)
  **Re-review (round 1):** accepted
- **[Nit]** CLAUDE.md still reads "Master lock:" and "Master lock starts at:" while the scripts say Trunk — CLAUDE.md, docs/DECISIONS.md
  **Caused by this change:** yes
  **Disposition:** explained (deliberate, documented interim state: those lines are lock settings a check-in cannot edit, so the user changes them by hand per the plan's checklist)
  **Re-review (round 1):** accepted
- **[Nit]** The guard hooks hard-code the branch names trunk, master and main — .claude/hooks/block-main-edits.sh, .claude/hooks/shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained (the list was already hard-coded; the user chose in the interview to keep master and main guarded next to trunk; reading it from CLAUDE.md is under "Not included" in the plan)
  **Re-review (round 1):** accepted
- **[Informational]** The mode word passed between the two guard files changed from master to main-folder, and both must agree — .claude/hooks/shell-command-check.js, .claude/hooks/block-main-edits.sh
  **Caused by this change:** yes
  **Disposition:** explained (the Correctness reviewer verified both files agree; the guard test exercises both paths)
  **Re-review (round 1):** accepted
- **[Informational]** The reviewer only skimmed the large test-script diffs — .githooks/test-trunk-lock.sh, .claude/hooks/test-block-main-edits.sh
  **Caused by this change:** no
  **Disposition:** explained (observation only, no action)
  **Re-review (round 1):** accepted

### Spec reviewer
- **[Nit]** The CLAUDE.md Guard bullet now names trunk, master and main explicitly — CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** explained (the plan allows it; it documents the guard's fixed protected-name list, a project fact that belongs in CLAUDE.md, and R5 exempts only the "Default branch" line from rewording, which is untouched)
  **Re-review (round 1):** accepted
- **[Informational]** The guard test still uses "master" as the name of its test repository and variables — .claude/hooks/test-block-main-edits.sh
  **Caused by this change:** no
  **Disposition:** explained (the plan says to keep the master and main cases)
  **Re-review (round 1):** accepted
- **[Informational]** CLAUDE.md says "CHANGELOG.md is the master list" — CLAUDE.md
  **Caused by this change:** no
  **Disposition:** explained (an unrelated use of the word, not the branch)
  **Re-review (round 1):** accepted

### Correctness reviewer
- **[Informational]** The checker's old-name fallback derives the old file name by a pattern on its own name — .githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Disposition:** explained (transitional and harmless: it only matters for a branch tip from before the rename, and it carries a comment saying why)
  **Re-review (round 1):** accepted
- **[Informational]** Support for the old "Master lock" label stays in the checker after the user's hand edit — .githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Disposition:** explained (intended: the user decided to accept both labels; removing it later is a separate planned change)
  **Re-review (round 1):** accepted

## Re-review
### Round 1
Triggered by the fixed R1 failure and by the explanations above. The author's first full run of the guard test (869 cases) failed two cases, both `git branch -f other HEAD` in the new trunk section (once per shell tool). The expectation was wrong: the guard has always allowed `git branch` in the main folder and blocks a branch change that names a default branch only from a worktree. The fix removed that one case from the "trunk blocks" list; the worktree cases for `git branch -f trunk HEAD` and `git branch -D trunk` stay. The full test was then run again: 867 passed, 0 failed.

The re-reviewer checked the fix and every explanation. It accepted all ten explained findings, accepted the R1 fix (the loop now has five entries, the worktree cases still block, and the guard's worktree-only branch rule agrees), confirmed the branch holds exactly two commits (the approved plan and the work), and raised no new finding.

**Re-review (round 1):** R1 accepted
**Round 1 clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Guard test script with new trunk, master and main cases (867 cases) | Pass (fixed after Fail) |
| R2 | Lock test script: old "Master lock" label cases, old-name tip case (148 cases) | Pass |
| R3 | Lock test script: new "Trunk lock" label cases, relabel allowed, relabel plus raised number refused | Pass |
| R4 | Both renamed test scripts pass; lint, convention checks, vite build, cargo fmt, clippy and tests (384) pass; lock status says Trunk lock: ON | Pass |
| R5 | Search of the living files for the word master; every remaining hit is on the intended list | Pass (checked by Claude) |
| R6 | Diff against master shows no change under docs/reviews, docs/archive, other plans, or old CHANGELOG entries | Pass (checked by Claude) |
| R7 | The user follows the by-hand checklist in the plan | Manual |
| R8 | The user reads the checklist's step 0 | Manual |
| R9 | The user reads the plan's statement that POLICY.md needs no edit | Manual |

## Deviations from the plan
None. Beyond the plan's listed tests, one extra lock test covers a branch tip that holds the checker under its old file name.

## Summary
Part 1 is built: the guard protects trunk, master and main; the master lock is now the trunk lock in its files, scripts, tests, hooks, skills and wording; the checker and skills read either label so nothing breaks before or after the user's hand edit; living documents say "the default branch". The approved plan is unchanged. Every finding is explained, none above Low; the one failed requirement run (R1, a wrong expectation in the new test) was fixed and accepted in round 1, which was clean. Part 2 (the rename itself) is the user's checklist.
