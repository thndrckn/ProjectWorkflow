# ProjectWorkflow: Claude guide

This repo is the workflow itself: a Claude Code plugin (skills, guard hooks, trunk lock) built on Matt Pocock's skills. The design is `docs/workflow-v2.md`. Where the repo came from is `docs/HISTORY.md`. Jason is a QA lead, not a developer: explain in plain terms, one step at a time.

## Workflow
- **Default branch:** `trunk`
- **Change prefix:** `PWF`
- **Commands:** `/design-change` to start a change that needs thinking through; `/plan-small-change` or `/plan-large-change` to plan one directly; `/code-change` to code and review it (a ticket is `PWF-NNN.N`); `/merge-change` to check it in; `/build-changes` to make a version. Only Jason starts `/code-change`, `/merge-change` and `/build-changes`.
- **Checks (all must pass):** run each as its own command.
  - `bash githooks/test-trunk-lock.sh`
  - `bash hooks/test-block-main-edits.sh`
  - `bash test-adopt.sh`
  - `claude plugin validate .` (the only expected problems are the directory-only README and LICENSE notes)
  - In PowerShell `bash` is not on the path, so run the three `bash` commands through Git's own bash. Set it once with `$bash = "C:\Program Files\Git\bin\bash.exe"` (Git for Windows' usual place; change the path if Git is installed elsewhere), then run `& $bash githooks/test-trunk-lock.sh`, `& $bash hooks/test-block-main-edits.sh` and `& $bash test-adopt.sh`. `claude plugin validate .` is the same in PowerShell.
- **Version files:** `.claude-plugin/plugin.json`
- **Build command:** none. A version is a tag; projects load the plugin from `release/`.
- **Data folder:** none.
- **Worktree folder:** `.claude/worktrees/<change number>`
- **Worktree setup:** none.
- **Records:** plans in `docs/plans/`, review records in `docs/reviews/`, decisions in `docs/DECISIONS.md`, backlog in `docs/BACKLOG.md`. `CHANGELOG.md` is the master list of change numbers. `docs/POLICY.md` and `docs/PROCESS_BACKLOG.md` are the shared policy and process backlog (moved in from `D:/projects/shared-claude-conventions` by PWF-028); they change through normal changes.
- **Guard:** `hooks/` blocks Claude's edit tools on the default branch (plan files excepted) and blocks plan mode. Shell commands are not checked; the lock is the real protection.
- **Trunk lock:** `githooks/reference-transaction` and `githooks/trunk-lock-check.mjs` refuse any update of the default branch that is not a proper check-in: every new commit carries a change number, and every change from the starting number on has a review record that passes the gate. A check-in cannot loosen the lock's own settings in this file. Switching it on or off is Jason's step, in his own terminal; Claude never sets or unsets `core.hooksPath`. On: `bash githooks/install-trunk-lock.sh`. Off: `git config --unset core.hooksPath`. `node githooks/trunk-lock-check.mjs status` says which. In PowerShell, with `$bash` set as under Checks, on is `& $bash githooks/install-trunk-lock.sh`; off (`git config --unset core.hooksPath`) and `status` (`node ...`) don't use bash, so they are typed exactly as above.
- **Trunk lock starts at:** `PWF-029` (PWF-028 was built by hand before the lock was on in this repo; its review record is still checked with `node githooks/trunk-lock-check.mjs gate PWF-028`).
- **Adopt the workflow in another project:** Jason runs `bash adopt.sh <project folder>` in his own terminal. In PowerShell, with `$bash` set as under Checks, it is `& $bash adopt.sh <project folder>`, with the folder written with forward slashes (for example `D:/Projects/MyApp`).

## Rules
- Never commit to trunk, never force-push, and never push until Jason says so.
- PWF-001 to PWF-027 and their records are history: do not change them.
- Shell scripts and git hooks keep LF line endings (`.gitattributes`).
- Matt's skills are called by name (`mattpocock-skills:…`), never copied. His plugin is pinned by commit in `.claude-plugin/marketplace.json`; moving the pin is a normal PWF change that is tested first.

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
