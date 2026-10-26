# PWF-028: Workflow v2

**Status:** Approved by Jason, 2026-10-26
**Type:** feat
**Level:** Full (it changes the lock and the guard)
**Merge danger:** two-way door (git history can be reverted); wide blast radius (every project that adopts it)
**Branch:** `pwf-028-workflow-v2`
**Done by hand:** yes. The old /plan-change, /code-change and /commit-change are being replaced by this change, and the workflow can't check in its own rebuild. Each step is committed on the branch and checked by Claude. Jason approves the plan and the result.
**Design:** `docs/workflow-v2.md` (the approved design). `docs/design.md` is the version before.

## Why

Rebuild the workflow on Matt Pocock's skills (plugin `mattpocock-skills`), with thin wrappers of ours for Jason's approvals, change numbers and records, plus the plumbing to install it in other projects.

## Decision made in this plan (the one gap in the design)

The design says the lock checker is "rewritten for the new, smaller review record" but doesn't define the record. Proposed format (change it before approving if you want it different):

- Header lines: change number, level (Light or Full), plan file, reviewers used.
- One block per finding: severity, "caused by this change" (yes/no), plain-English description, recommendation, **Outcome** (`fixed`, `explained`, `accepted by Jason`, or `moved to backlog`), and where Jason's call was needed, **Decided by:** Jason.
- Each `fixed` or `explained` finding has one line **Re-review:** `accepted` or `rejected`. A `rejected` one must also say `Decided by: Jason`.
- One closing line **Re-review clean:** `yes` or `no`. Only one re-review round exists, so there are no round numbers.
- The trace table (requirement, test, result), then Deviations, then Summary.
- The lock checks that the record is complete; it can't prove that Jason made a decision. Jason's approval of the review is that proof.
- The old "Review format" marker and the "required from" line in CLAUDE.md are gone; there is only one format.

## Requirements

**R1. Plugin layout**
Given the repo root is the plugin,
when someone loads it,
then `skills/`, `hooks/` and `githooks/` are at the top level, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` exist, and the old `.claude/skills`, `.claude/hooks` and `.githooks` are gone.

**R2. Pinned marketplace**
Given Matt's plugin must not change under us,
when the marketplace is read,
then it lists `mattpocock-skills` at a fixed commit (`sha`), the same commit as the copy installed on Jason's machine.

**R3. Six skills, short, calling Matt's**
Given the workflow commands,
when the skills folder is read,
then it holds `design-change`, `plan-small-change`, `plan-large-change`, `code-change`, `merge-change` and `build-changes`, each under 100 lines, and each Matt skill they use (`grilling`, `tdd`, `diagnosing-bugs`, `code-review`, `pr`) is called by the name it has under our pinned marketplace (never the official copy's name), not copied.

**R4. Planning behaviour**
Given `/design-change` or a `/plan-…` command is run,
when its text is read,
then it covers what the design lists: claim the next number; backlog shown once; `grilling`; small-or-large recommendation; change type; merge danger (door and blast radius) with the Light/Full rule (unsure means Full, lock or guard changes always Full); Given/When/Then with a test each; approval before the branch and the "approved plan" commit; and, for large changes, the pause for `/to-spec` and `/to-tickets`, NNN.N numbering, and "approved spec".

**R5. Code and review behaviour**
Given `/code-change` is run,
when its text is read,
then it covers: worktree and ticket branch; `tdd`, or `diagnosing-bugs` for a fix; `code-review` for Light, `code-review` plus our Correctness reviewer for Full; translation of findings into Jason's format; fixes; one narrow re-review; disputes to Jason; the review record in the format above; and the ending line.

**R6. Merge behaviour**
Given `/merge-change` is run,
when its text is read,
then it keeps the safety checks, catch-up merge, changelog entry, gate, `--no-ff` merge, push and cleanup; only whole numbers go to trunk; for a large change every ticket record must have passed and the spec's list must have no open findings; the report ends with the set-aside request. `/build-changes` has no review step.

**R7. Lock checker: new record**
Given a review record in the new format,
when the checker's `gate` is run on it,
then a complete record passes, and a record with a missing outcome, a missing re-review line, a `rejected` without "Decided by: Jason", a "Re-review clean: no", or a non-Pass trace row fails.

**R8. Lock checker: ticket numbers**
Given `NNN.N` ticket numbers,
when the checker runs,
then they are accepted for ticket records, and only a whole number (a check-in) may update trunk.

**R9. Lock tests**
Given the lock is protection,
when its test script is run,
then it covers R7 and R8 and the existing refusal cases, and runs in a few seconds.

**R10. Guard**
Given Claude tries to edit on trunk,
when the guard runs,
then edits on trunk are blocked and plan mode is blocked; the shell-command check (`shell-command-check.js`) is gone and nothing refers to it; the guard's tests pass.

**R11. Repo settings**
Given a new session opens this repo,
when `CLAUDE.md` and `.gitattributes` are read,
then `CLAUDE.md` is short (under 60 lines) and holds only what this repo needs, and `.gitattributes` forces LF for `.sh` files.

**R12. Shared policy moved in**
Given the policy and process backlog live in `D:/projects/shared-claude-conventions`,
when this change is done,
then copies are in this repo (`POLICY.md`, `PROCESS_BACKLOG.md` at `docs/`), identical to the originals, and the originals are untouched.

**R13. Backlog entry**
Given a known gap,
when `docs/BACKLOG.md` is read,
then it holds: "the guard checks the session's own branch, not the folder being written to."

**R14. adopt.sh**
Given a project wants the workflow,
when `adopt.sh` is run in it,
then it turns on the lock, installs this plugin, and installs Matt's pinned plugin. `/setup-matt-pocock-skills` is a user-only skill, so `adopt.sh` can't run it: it checks whether the setup was done (`docs/agents/issue-tracker.md` exists) and, if not, stops and tells Jason to type it. It also stops with a clear message when any other prerequisite is missing. (Settings on Jason's machine are changed only by Jason; the script is run by Jason.)

**R15. release/**
Given projects should adopt a tagged version,
when this change is ready,
then `release/` is a worktree folder checked out at a local tag (what projects load from), `release/` is ignored by this repo's git, and nothing is pushed.

**R16. adopt.sh tested**
Given `adopt.sh` is untested,
when it is run on a throwaway copy of a project,
then it ends with the lock on and both plugins in place, and the copy shows it.

**R17. Reviewed with the new review**
Given this change is code,
when step 8 is done,
then it has a review record in the new format: Matt's `code-review` plus our Correctness reviewer, disputes settled by Jason.

**R18. Records and boundaries**
Given the earlier changes and Jason's rules,
when PWF-028 is checked in,
then PWF-001 to PWF-027 (exactly those) and their records are unchanged (`git diff` shows none); `core.hooksPath` was never set or unset by Claude; nothing was pushed before Jason said so; a verification record exists in `docs/` and was written before check-in; the changelog has a PWF-028 entry; and the check-in message says it was done by hand and why.

## Out of scope

- Adopting the workflow in DisneyTripPlanner, Spoolkeeper or LockedIn (later rollout steps).
- Changing Matt's skills.
- Turning the lock on or off, and installing or removing plugins and marketplaces on Jason's machine (Jason's step; Claude gives the commands).

## Checks

| Req | Check |
|---|---|
| R1 | List the tree; run `claude plugin validate` if it exists, otherwise read both JSON files |
| R2 | Marketplace `sha` equals the installed plugin's commit in `~/.claude/plugins/installed_plugins.json` |
| R3 | Count lines per skill; grep for each Matt skill name as it appears under our marketplace, and that the official copy's name appears nowhere; compare a skill against Matt's text for copying |
| R4–R6 | Read each skill against its row in the design |
| R7–R9 | Run the lock tests; each failing example is refused, the passing one is accepted |
| R10 | Run the guard tests; grep for `shell-command-check` finds nothing |
| R11 | Count lines; read `.gitattributes` |
| R12 | File hashes match the originals; originals' timestamps and hashes unchanged |
| R13 | Read `docs/BACKLOG.md` |
| R14 | Read `adopt.sh`; run it with the setup file missing and see it stop and name `/setup-matt-pocock-skills` |
| R15 | `git worktree list` shows `release/` at the tag; `git check-ignore release` matches; `git branch -r` shows nothing new |
| R16 | Run on a throwaway copy; check `git config core.hooksPath` there and the plugin list |
| R17 | Read the review record; run the lock `gate` on it |
| R18 | `git diff trunk -- 'docs/plans/PWF-00[1-9]*' 'docs/plans/PWF-01*' 'docs/plans/PWF-02[0-7]*' 'docs/reviews/PWF-00[1-9]*' 'docs/reviews/PWF-01*' 'docs/reviews/PWF-02[0-7]*'` is empty (PWF-028's own files are not in the pattern); `git log` shows no push; read the verification record, changelog and check-in message |

## Steps

- [x] 1. Plan: this file; `workflow-v2.md` moved to `docs/`; `docs/design.md` marked superseded; Jason approves; commit "approved plan"
- [x] 2. Repo layout: root becomes the plugin; marketplace pins Matt's plugin by commit
- [x] 3. Skills: the six skills
- [x] 4. Lock: new review record, `NNN.N` numbers, small fast tests
- [x] 5. Guard: shell-command check removed, trunk-edit and plan-mode blocks kept, small tests
- [x] 6. Repo settings: CLAUDE.md, `.gitattributes`, shared policy and process backlog copied in, backlog entry
- [ ] 7. Setup script: `adopt.sh`; `release/` from a local tag; test on a throwaway copy
- [ ] 8. Review PWF-028 with the new review
- [ ] 9. Close-out: verification record, changelog entry, check-in (by hand), push only when Jason says so
