# Review: PWF-030 — Make "lock on" mean one thing in this repo
- **Change:** PWF-030
- **Level:** Full
- **Plan:** docs/plans/PWF-030-lock-on-agrees-in-this-repo.md
- **Reviewers:** Matt's code-review (a Standards reviewer and a Spec reviewer), a fresh Correctness reviewer, and one fresh re-reviewer

## Findings
- **[Low]** The same-repo comparison used `git rev-parse --path-format=absolute --git-common-dir` strings; on Windows a difference in case, path spelling or a symlink could make the same repo look different — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** compare in a way that ignores spelling, for example with `-ef`.
  **Outcome:** fixed (each directory is now resolved with `cd` and `pwd -P` and the two are compared with `-ef`, with a comment saying why)
  **Re-review:** accepted

- **[Low]** `--path-format` needs git 2.31 or newer; on older git the flag may be echoed back and every project would look like the workflow's own repo — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** do not depend on the flag.
  **Outcome:** fixed (the same change: the flag is no longer used)
  **Re-review:** accepted

- **[Nit]** The Trunk lock bullet in CLAUDE.md is long and mixes topics — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** optionally move the new sentence to the Adopt bullet.
  **Outcome:** explained (the plan's R5 puts the wording on the Trunk lock line, and the file keeps one bullet per topic)
  **Re-review:** accepted

- **[Informational]** The new `self` test fixture repeats the shape of the earlier `own` fixture — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** reuse a helper if worthwhile.
  **Outcome:** explained (the fixtures differ, and a helper for about three lines would be generality nobody asked for)
  **Re-review:** accepted

- **[Informational]** Two new inline `[ ... ] && pass=... || ...` assertions bypass the `expect` helper — test-adopt.sh
  **Caused by this change:** no
  **Recommendation:** none.
  **Outcome:** explained (the file already hand-rolls non-output checks that way)
  **Re-review:** accepted

- **[Nit]** The "release/ is not set up" check moved after the git-repo check and the new refusal — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** none; record it.
  **Outcome:** explained (a worktree of the workflow's own repo has no release/ folder, so the refusal has to come first for R2; listed under Deviations)
  **Re-review:** accepted

- **[Nit]** The new test fixture copies release/, githooks and .claude-plugin into the stand-in — test-adopt.sh
  **Caused by this change:** yes
  **Recommendation:** none.
  **Outcome:** explained (it makes the test fail without the refusal, because the repo case would go on to "Done", instead of passing by accident)
  **Re-review:** accepted

- **[Informational]** If adopt.sh runs from a copy that is not in a git repo, the refusal does not apply — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** none.
  **Outcome:** explained (failing open is right for a non-repo, and the release/ check follows)
  **Re-review:** accepted

- **[Informational]** The comparison treats worktrees, the release/ worktree and the main folder as the same repo; submodules and nested repos are accepted — adopt.sh
  **Caused by this change:** no
  **Recommendation:** none.
  **Outcome:** explained (this is the intended behaviour)
  **Re-review:** accepted

- **[Nit]** The core.hooksPath test looks only at the main stand-in, and the plugin-install test counts log lines around the two refused runs — test-adopt.sh
  **Caused by this change:** no
  **Recommendation:** none.
  **Outcome:** explained (the worktree shares the repo config, and counting log lines is how the earlier cases work)
  **Re-review:** accepted

- **[Informational]** If `git rev-parse` failed inside the new folder comparison, the comparison would be false and adopt.sh would not refuse (found by the re-review) — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** none; very unlikely, since the target has already passed a check that it is a git repo, and it does no harm.
  **Outcome:** accepted by Jason
  **Decided by:** Jason

## Re-review
The re-reviewer accepted every outcome above and raised the one Informational at the end, so the round was not clean. Jason accepted it.
**Re-review clean:** no
**Decided by:** Jason

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | New `test-adopt.sh` cases run adopt.sh on a stand-in git repository holding adopt.sh itself: exit 1, the words `install-trunk-lock.sh`, no `core.hooksPath` set, no new `plugin install` in the log. Also run for real: `bash adopt.sh .` in this repo stops with "this is the workflow's own repo". 14 passed, 0 failed | Pass |
| R2 | The same test adds a worktree of that stand-in repository and runs adopt.sh on it: same refusal | Pass |
| R3 | The 10 existing `test-adopt.sh` cases still pass (14 passed in all with the 4 new checks) | Pass |
| R4 | Manual: `node githooks/trunk-lock-check.mjs status` reads `Trunk lock: ON.` in the PWF-030 worktree and in the main folder (git's hook folder is `githooks`) | Pass (checked by Jason) |
| R5 | Manual: the Trunk lock line in CLAUDE.md says this repo uses its own `githooks/`, `release/githooks` is for other projects, and `adopt.sh` refuses here; the On, Off and status commands are unchanged | Pass (checked by Jason) |
| R6 | `bash githooks/test-trunk-lock.sh`: 37 passed, 0 failed; the diff changes no default branch, prefix, version file or starting-number line in CLAUDE.md; `node githooks/trunk-lock-check.mjs gate PWF-030` passed | Pass |

## Deviations from the plan
- The "release/ is not set up here" check in adopt.sh was moved after the git-repo check and the new refusal. The plan did not mention the order. It is needed for R2, because a worktree of the workflow's own repo has no release/ folder. The only visible effect on other projects is which message comes first when both problems exist.
- The plan's "Backlog items fixed" said `/merge-change` removes the backlog item; `/code-change` removed it from `docs/BACKLOG.md` on this branch instead.
- The comparison method is `cd`, `pwd -P` and `-ef` rather than git's own absolute path flag (see the first two findings). The plan did not name a method.

## Summary
adopt.sh now refuses the workflow's own repo and its worktrees and points to `bash githooks/install-trunk-lock.sh`, and CLAUDE.md says this repo uses its own `githooks/` folder and `release/githooks` is for other projects. The Full review found no High or Medium findings; the re-review accepted every outcome and raised one Informational, which Jason accepted.
