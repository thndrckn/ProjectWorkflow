# PWF-032: Install the workflow's plugins per project, not for every project

**Type:** fix
**Merge danger:** two-way door (script and hook text, all in git; plugin installs can be redone); blast radius is wide, because the guard hook runs on every edit in every project that loads it, and the install step touches your machine's plugin settings.
**Level:** Full (it changes the guard)

## What you'll see change

1. **`adopt.sh` installs both plugins for the adopting project only.** The plugins then load only when Claude Code is opened in that project. Other projects no longer get the workflow's commands or the edit guard.
2. **`adopt.sh` removes the old everywhere-installs.** If either plugin is installed at user scope (all projects), `adopt.sh` removes that copy after installing the project one. This is how your existing installs get switched over.
3. **The guard does nothing in a project that hasn't adopted the workflow.** The edit guard and the plan-mode block check the project's `CLAUDE.md`. With no "Workflow" section, they allow everything.
4. **The lock is untouched.** `githooks/` and the lock's settings do not change.

Things to know:
- Project scope writes the plugin list into the project's `.claude/settings.json`. That file is the project's own, so it shows up as a change to commit in the adopted project.
- Removing the user-scope copies means a project you adopted earlier loses the workflow until you run `adopt.sh` on it again. The lock in it stays on; only the commands and guard go.
- This repo refuses `adopt.sh`, so it gets its two project-scope installs by hand. The exact commands will be in the review record.
- The guard change only reaches projects when a new version is built and `release/` is refreshed (`/build-changes`), as with any change.

## Requirements

**R1. Both plugins are installed at project scope**
Given a project that passes `adopt.sh`'s checks, when `adopt.sh` runs, then `projectworkflow` and `mattpocock-skills` are each installed with project scope, and neither is installed at user scope by `adopt.sh`.

**R2. Already installed for this project means nothing is reinstalled**
Given both plugins are already installed at project scope for this project, when `adopt.sh` runs again, then no install call is made.

**R3. A user-scope install elsewhere does not count as installed here**
Given a plugin is installed only at user scope, when `adopt.sh` runs, then it is still installed at project scope.

**R4. User-scope installs are removed**
Given either plugin is installed at user scope, when `adopt.sh` runs, then that user-scope install is uninstalled (and only after the project-scope install succeeded); given neither is, then no uninstall call is made.

**R5. The official-copy stop still works**
Given Matt's skills are installed from the official marketplace, when `adopt.sh` runs, then it stops with the same message as before and installs nothing.

**R6. The guard stands down outside adopted projects**
Given a project whose `CLAUDE.md` has no "Workflow" heading (or no `CLAUDE.md` at all), when an edit tool call or a plan-mode call reaches the guard on its default branch, then both are allowed.

**R7. The guard still guards adopted projects**
Given a project whose `CLAUDE.md` has a "Workflow" heading, when an edit on the default branch or a plan-mode call reaches the guard, then it is blocked exactly as now (all existing guard cases still pass).

**R8. The lock is unchanged**
Given the lock's files, when this change is compared with trunk, then nothing under `githooks/` is different.

## Checks

- R1 to R5: automated, in `test-adopt.sh`. The stand-in `claude` is extended to record the scope of each install and uninstall, and to report installs with their scope in `plugin list --json`.
- R6, R7: automated, in `hooks/test-block-main-edits.sh` (new cases with and without a Workflow heading, plus all existing cases).
- R8: automated as a manual-free check: `git diff trunk -- githooks` is empty, noted in the review record.
- Not automated: that real Claude Code honours project scope and that `claude plugin list --json` has the shape the script expects. Manual check, because the tests use a stand-in `claude`. You run `adopt.sh` on a throwaway project (a new folder with `git init` and a minimal `CLAUDE.md` holding the Workflow lines), look at `claude plugin list`, then delete it. It runs from this repo's root after the change is merged, because the root is where `adopt.sh` and `release/` live together. The exact commands are in the review record.

## What could go wrong / what gets lost

- **The stand-in could differ from the real `claude`** (for example how `plugin list --json` names scope), so the tests pass and the real run misbehaves. The manual check above covers this, and coding starts by reading the real output.
- **A project adopted earlier loses the commands and guard** until it is adopted again (see above). The lock keeps working.
- **A mis-read "Workflow" check could switch the guard off in an adopted project.** It matches a heading line beginning `#` and the word Workflow, which this repo's `CLAUDE.md` has; R7 tests that. A project that renames its heading loses the guard silently; that is the intended trade for the backstop.
- **Uninstalling the user-scope copy is the one step that changes settings outside the project.** It runs only after the project install worked. The manual check will therefore also remove your real user-scope installs, as intended.

## Not included

- Any change to the lock, `githooks/`, or `install-trunk-lock.sh`.
- Letting `adopt.sh` run on this repo.
- Migrating this repo's own installs by script (done by hand, per above).
- Changing the plugins' contents or Matt's pin.

## Check-in

- Branch: `fix/PWF-032-project-scope-install`
- Commit message: `fix(PWF-032): install the workflow's plugins per project and stand the guard down outside adopted projects`

## Backlog items fixed or accepted

None.
