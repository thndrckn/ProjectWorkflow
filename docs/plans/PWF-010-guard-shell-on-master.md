# PWF-010 — Close the shell loophole in the master-edit guard

- **Change:** PWF-010
- **Date:** 2026-10-24

## What you'll see change
The guard that stops Claude editing files on `master` now also watches the shell (the Bash and PowerShell tools), not just the edit tools. While the branch is `master` (or `main`), Claude can no longer commit, stage, or write project files by typing shell commands; it gets the same "create a feature branch first" message the edit tools already give.

On master, the shell can still do everything check-in and build need, plus read-only looking around:
- **Git commands allowed:** `status`, `log`, `diff`, `show`, `fetch`, `pull --ff-only`, `merge`, `push` (never forced), `tag`, `switch`, `branch`, `rev-parse`, `ls-files`, `remote` (listing only), `config` (reading only) and `checkout -b` (creating a branch).
- **Every other git command is blocked on master**, for example `commit`, `add`, `cherry-pick`, `revert`, `rebase`, `reset`, `am`, `restore`, `rm`, `stash`, plain `pull`, any other `checkout`, and forced pushes.
- **File-writing commands aimed at the project are blocked on master** (`sed -i`, `>` and `>>` redirects, `tee`, `cp`, `mv`, `rm`, `Set-Content`, `Out-File`, `Add-Content` and similar). Writes outside the project (temp folders, the scratchpad, `/dev/null`, `$null`) and writes to plan files in `docs/plans/` still work.
- On a feature branch nothing changes.

This is pattern matching, not a sandbox. An unusual command, such as a script that writes files, could still get through. The hook says so in a comment.

## Requirements
- **R1.** Given the branch is `master`, when Claude runs a git command through Bash or PowerShell that is not on the allow-list (for example `commit`, `add`, `cherry-pick`, `revert`, `rebase`, `reset`, `am`, `restore`, `rm`, `stash`, `pull` without `--ff-only`, `checkout` in any form other than `-b`, `remote add/remove/rename/set-url`, a `config` that sets or changes a value), or a `push` with `--force`, `-f` or `--force-with-lease`, then the command is blocked with the "create a feature branch" message.
- **R2.** Given the branch is `master`, when Claude runs a file-writing shell command aimed at a project file (`sed -i`, a `>` or `>>` redirect, `tee`, `cp`, `mv`, `rm`, `Set-Content`, `Out-File`, `Add-Content`), then it is blocked.
- **R3.** Given the branch is `master`, when Claude runs an allow-listed git command (`status`, `log`, `diff`, `show`, `fetch`, `pull --ff-only`, `merge`, `push` without force, `tag`, `switch`, `branch`, `rev-parse`, `ls-files`, `remote` listing, `config` reading, `checkout -b`) or a read-only non-git command (`ls`, `cat`), then it is allowed.
- **R4.** Given the branch is `master`, when a shell command writes only outside the project (temp folder, `/dev/null`, `$null`) or only to a plan file in `docs/plans/`, then it is allowed.
- **R5.** Given the branch is a feature branch, when any shell command runs, then the guard allows it.
- **R6.** Given the branch can't be read, when a shell command that would be blocked on master runs, then it is blocked (the guard fails closed).
- **R7.** Given the existing edit-tool behaviour, when Edit or Write is used on master or on a feature branch, then it behaves exactly as before (blocked on master except plan files; allowed on a feature branch).

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: "rename-plan.sh and plansDirectory are inert while plan mode is blocked" | Keep it queued |
| Backlog: "The master-edit guard doesn't cover file changes made through the shell" | Plan it now |
| How far should the guard go on master? | Block commits plus recognisable file-writing commands (best-effort pattern matching) |
| Which shells? | Both Bash and PowerShell |
| Play-back 1 (scope above) | Changed: git on master uses an allow-list (status, log, diff, show, fetch, pull --ff-only, merge, push never forced, tag, switch, branch), everything else blocked; tests added for newly blocked commands |
| Play-back 2 | Changed: also allow rev-parse, ls-files, remote (listing only), config (reading only), and `checkout -b` only; tests added |
| Play-back 3 (final) | Yes |

The original request that started this planning session (a rule about code comments vs `docs/DECISIONS.md`) was set aside when the user chose to plan the backlog item now. It needs its own `/plan-change`.

## Backlog items fixed
- The master-edit guard doesn't cover file changes made through the shell

## What could go wrong / what gets lost
- Nothing in the app or `data/` is touched.
- The guard could block a legitimate command on master. Check-in and build use only allow-listed git commands, so they keep working; if some other command is wrongly blocked, the fix is to add it to the allow-list in a later change.
- It can't catch every way of writing a file from the shell. The hook documents this.
- A bug in the hook could lock Claude out of shell commands on master, or let everything through. The automated test script exists to catch both.

## Not included
- No change to the other backlog entry (rename-plan.sh / plansDirectory); it stays queued.
- No attempt to make the guard a full sandbox (scripts, interpreters, `node -e`, `python -c` writing files are not analysed).
- No block on `git branch -D` (the skills already say never to use it); not requested.
- No change to app code, the database, or `data/`.
- The comments-vs-DECISIONS rule is a separate change.

## How you'll check it
**T1 — Run the hook test script. Covers R1, R2, R3, R4, R5, R6, R7.**

1. Open a terminal in the project and run `bash .claude/hooks/test-block-main-edits.sh`.

Expected: every case prints PASS and the script ends with a summary of zero failures.

**T2 — Shell commit is refused on master. Covers R1, R6.**

1. After check-in, with the branch on `master`, ask Claude to run `git commit --allow-empty -m test` (or `git add .`) in a new session.

Expected: the command is refused with the "create a feature branch" message, and no commit is made.

**T3 — Shell file write is refused on master. Covers R2, R4.**

1. On `master`, ask Claude to run `echo hi >> notes.txt` in the project, then `echo hi > /tmp/x.txt`.

Expected: the first is refused; the second runs.

**T4 — Normal work still flows. Covers R3, R5, R7.**

1. On `master`, ask Claude to run `git status` and `git log -3`.
2. Run your next real `/plan-change` (the comments-vs-DECISIONS request) and see that its plan file still saves on master.
3. On a feature branch, ask Claude to commit a small edit.

Expected: all work as before.

## Check-in
- Type: chore
- Branch: chore/PWF-010-guard-shell-on-master
- Commit message: chore(PWF-010): block commits and file writes through the shell on master

---

## Technical detail (for Claude)
Tooling/config only; no Rust, frontend, SQL or migration. The CLAUDE.md feature cycle does not apply.

**Files**
- `.claude/hooks/block-main-edits.sh`: also read `tool_name` and `tool_input.command` from the JSON (the existing `node -e` parser; emit both). Keep the existing edit-tool path unchanged (R7). For `Bash`/`PowerShell`:
  1. Resolve the branch as today (`git -C "$proj" rev-parse --abbrev-ref HEAD`). Not master/main and branch readable → `exit 0` (R5). Unreadable → treated as master (R6).
  2. Split the command into segments on `;`, `&&`, `||`, `|` and newlines. For each segment, drop leading env assignments and `git -C <path>` / `cd` prefixes, then inspect.
  3. Git segments: take the subcommand and check the allow-list: `status log diff show fetch merge tag switch branch rev-parse ls-files`; `pull` only with `--ff-only`; `push` unless `--force`/`-f`/`--force-with-lease` (also `+refspec`); `remote` only bare, `-v`, `show`, `get-url`; `config` only with `--get`, `--get-all`, `--get-regexp`, `--list`, `-l`, or a single key and no value; `checkout` only as `-b <name>` (not `-B`). Anything else → block.
  4. Non-git segments: block `sed -i`, `tee`, `cp`, `mv`, `rm`, `Set-Content`, `Out-File`, `Add-Content`, `Remove-Item`, `Move-Item`, `Copy-Item`, and `>`/`>>` redirects (ignore `2>&1`-style fd redirects), unless every destination resolves outside the project, is `/dev/null` or `$null`, or is inside `docs/plans/`. Reuse the existing `norm()` helper for path comparison; a destination that can't be resolved (e.g. contains a variable) counts as inside the project.
  5. Block with the existing message and `exit 2`.
  - Replace the "Not covered" header comment with a comment stating the shell check is best-effort pattern matching and what it does not catch (scripts, interpreters).
- `.claude/settings.json`: extend the first PreToolUse matcher to `Edit|Write|MultiEdit|NotebookEdit|Bash|PowerShell`.
- `.claude/hooks/test-block-main-edits.sh` (new): builds a throwaway git repo in a temp dir on `master` and on a feature branch, sets `CLAUDE_PROJECT_DIR` to it, pipes sample tool-call JSON into the hook, and checks the exit code (0 allow, 2 block). Prints PASS/FAIL per case and a summary; exits non-zero on any failure. Includes a case with a detached HEAD / non-repo directory for R6.
- `docs/BACKLOG.md`: remove the "master-edit guard doesn't cover file changes made through the shell" entry (done by `/code-change`).
- `CLAUDE.md`: update the one-line "Guard" description so it says the hook also covers shell commands (git allow-list and file-writing commands) on master.
- `CHANGELOG.md`: one entry under `[Unreleased]`.

**Reuse:** the existing `norm()` path normaliser, the `node -e` JSON parse, and the existing block message/exit code.

**Known debt touched:** none beyond the backlog entry being fixed.

**Planned tests**
- R1 — Automated: test script cases, one per blocked git form: `commit`, `add`, `cherry-pick`, `revert`, `rebase`, `reset`, `am`, `restore`, `rm`, `stash`, plain `pull`, `push --force`, `push -f`, `push --force-with-lease`, `remote add`, `remote set-url`, `config user.name x`, `config --unset`, `checkout main`, `checkout -B x`, `checkout -- file`, `checkout .`; each through both Bash and PowerShell tool names.
- R2 — Automated: cases for `sed -i`, `>`, `>>`, `tee`, `cp`, `mv`, `rm`, `Set-Content`, `Out-File`, `Add-Content` aimed at a project path on master.
- R3 — Automated: one allowed case per allow-listed git subcommand (including `pull --ff-only`, `push`, `remote -v`, `config --get`, `config user.name`, `checkout -b x`, `rev-parse`, `ls-files`) plus `ls` and `cat`.
- R4 — Automated: redirect/`Set-Content` to a temp path, `/dev/null`, `$null`, and a `docs/plans/` file are allowed on master.
- R5 — Automated: representative blocked-on-master commands (`git commit`, `echo > file`) are allowed on a feature branch.
- R6 — Automated: run the hook with `CLAUDE_PROJECT_DIR` pointing at a non-repo directory and a blocked-type command; expect exit 2.
- R7 — Automated: Edit/Write JSON on master is blocked except for a `docs/plans/` file, and allowed on a feature branch (same cases as today's behaviour).
- Manual checks T2–T4 above need the user (or a new session) at the real tool harness; the hook wiring in `settings.json` can't be exercised by the script.
