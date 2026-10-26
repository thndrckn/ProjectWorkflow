# PWF-028: Workflow v2 — verification record

**This is a verification record, written before check-in.** PWF-028 was built by hand, without the old /plan-change, /code-change and /commit-change, because the workflow cannot check in its own rebuild. The independent review is in `docs/reviews/PWF-028-workflow-v2.md` (Matt's `code-review`, our Correctness reviewer, one re-review, and two narrow checks on the gate). This record lists the check run for each requirement and the result seen.

- **Plan:** `docs/plans/PWF-028-workflow-v2.md`, approved by Jason on 2026-10-26 (commit "approved plan", step 1)
- **Branch:** `pwf-028-workflow-v2`, one commit per step (`chore(PWF-028): step N – …`)
- **Who:** Claude built each step and committed it; Jason approved the plan and every decision recorded below.
- **Not yet done:** the check-in merge into trunk and the push of trunk and the tag. Both wait for Jason.

## Requirements trace

| Req | What it requires | Check run | Result |
|---|---|---|---|
| R1 | The repo root is the plugin | Listed the tree: `skills/`, `hooks/`, `githooks/` at the top, `.claude-plugin/plugin.json` and `marketplace.json`, no `.claude/skills`, `.claude/hooks` or `.githooks`. Ran `claude plugin validate .` | Only the directory-only README and LICENSE notes. Pass |
| R2 | The marketplace pins Matt's plugin by commit | Compared the marketplace `sha` with the installed plugin's commit in `installed_plugins.json` | Both `49dd158d1076134a641b33efb035946536778336`. Pass |
| R3 | Six short skills calling Matt's by name | Counted lines (longest 70); grepped for `mattpocock-skills:` names and for the official marketplace name | Six skills; the five Matt skills are called by name; the official name appears in no skill. Pass |
| R4 | Planning behaviour | Read `design-change`, `plan-small-change`, `plan-large-change` against the design's rows | All listed behaviours present. Pass |
| R5 | Code and review behaviour | Read `code-change` against the design | Present. The review record form is written in the skill. Pass |
| R6 | Merge behaviour, build has no review | Read `merge-change` and `build-changes` | Present; the build's review step is removed. Pass |
| R7 | Gate on the new record | Ran `githooks/test-trunk-lock.sh` | 37 passed, 0 failed. Each broken-record case is refused, a complete one passes. Pass |
| R8 | `NNN.N` numbers; only a whole number checks in | Same tests: a ticket number is accepted, a change fails while a ticket has no record, a ticket commit at the tip of trunk is refused, a large change checks in under its whole number | Pass |
| R9 | Lock tests small and fast | Timed the lock test | 37 cases; about 28 seconds. Slower than "a few seconds": see Deviations. Pass with deviation |
| R10 | Guard | Ran `hooks/test-block-main-edits.sh`; grepped for `shell-command-check` outside history | 9 passed; no references left. Pass |
| R11 | Repo settings | Counted `CLAUDE.md` lines; read `.gitattributes` | 27 lines; LF for `*.sh` and for the hook file `githooks/reference-transaction`. Pass |
| R12 | Shared policy moved in | `cmp` of both copies with the originals; hashes of the originals before and after | Identical; originals unchanged. Pass |
| R13 | Backlog entry | Read `docs/BACKLOG.md` | Entry present. Pass |
| R14 | `adopt.sh` | Ran `bash test-adopt.sh` | 9 passed: stops when `release/` is missing, installs the plugins and turns the lock on, stops and names `/setup-matt-pocock-skills` when the setup file is missing, ends done once it exists, installs nothing twice, stops while the official copy is installed, stops when a CLAUDE.md lock line is missing. Pass |
| R15 | `release/` | `git worktree list`, `git check-ignore release`, `git tag`, `git branch -r`; tag re-cut at close-out | `release/` is a worktree at the local tag `v0.1.0`, ignored by this repo's git, nothing pushed. Pass |
| R16 | `adopt.sh` on a throwaway copy | The same test, with a stand-in for the `claude` command | The lock is on in the copy and both plugins are installed from the marketplace. The real install is Jason's step. Pass with deviation |
| R17 | Reviewed with the new review | Ran the lock's gate on the review record | `Review gate for PWF-028: passed.` Pass |
| R18 | Records and boundaries | `git diff` of PWF-001 to PWF-027 plans and reviews against trunk (empty); `git config core.hooksPath` (unset); `git branch -r` and tags (nothing new); read the changelog entry; verification record written before check-in | All hold. The check-in message is read at check-in; the proposed text is below. Pass, check-in message pending |

## Deviations

1. **The spec's list lives in the change's own review record.** The plan keeps the spec frozen after approval, so findings carried between tickets of a large change cannot be written into it. Skills and lock follow this.
2. **"Re-review clean: no" can pass.** R7 listed it as always failing. It passes when the record says "Decided by: Jason", because otherwise a change could never be checked in after any new finding in its re-review. Used in this very record.
3. **Tests are slower than hoped.** About 28 seconds each for the lock and guard tests, because Windows is slow to start each git process.
4. **R16 used a stand-in `claude` command**, so no real plugin or setting of Jason's was touched.
5. **Lock start is `PWF-029`** in `CLAUDE.md` (not in the plan). PWF-028 was built before the lock was on in this repo; its review record is still checked with `node githooks/trunk-lock-check.mjs gate PWF-028`.
6. **Extra checks Jason authorised**, beyond the single re-review: a narrow check of the C3 fix, then of the stricter Findings rule (G1) he asked to add. N1 and N2 were accepted unchecked at his direction.
7. **Commit amended once.** The "approved plan" commit was amended locally (never pushed) because my first edit did not apply; Python is not installed here.
8. **The tag was moved before publishing.** `v0.1.0` was first cut at step 7 and re-cut at close-out, with `release/` refreshed. It had never been pushed.

## Open items from this change

- The guard-branch entry in the backlog was written as Jason dictated it; a reviewer found it vague.
- Backlog: moving trunk backwards is not caught; a branch can carry its own copy of the lock; the design has no rule for fixes made after the single re-review.
- The first real adoption (DTP-086) will confirm the output format of `claude plugin marketplace list`, which `adopt.sh` reads.
- The copied `docs/POLICY.md` still describes the old commands. Updating it is a hand-edit for Jason.

## Proposed check-in message (for Jason to approve)

> feat(PWF-028): workflow v2 on Matt Pocock's skills
>
> Done by hand: the workflow cannot check in its own rebuild, so the old /plan-change, /code-change and /commit-change were not used. Each step was committed on the branch and checked by Claude; the plan was approved by Jason, and the review record and this change's verification record (docs/PWF-028-verification.md) are in the repo.
