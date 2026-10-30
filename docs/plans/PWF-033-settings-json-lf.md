# PWF-033: Keep the plugin settings file's line endings the same as the install writes them

**Type:** fix
**Merge danger:** two-way door (a one-line rule and a script step, all in git); small blast radius (the rule names exactly one file path, and the script step only adds a line to a project's `.gitattributes`).
**Level:** Light

## What you'll see change

1. **A fresh plugin install leaves git clean.** On this machine git checks files out with Windows line endings, and `claude plugin install --scope project` writes `.claude/settings.json` with plain (LF) endings, so git listed the file as modified although nothing in it changed. A rule in `.gitattributes` says that file is always plain endings, so the two agree.
2. **`adopt.sh` adds the same rule to the project it sets up.** It creates the project's `.gitattributes` if there is none, or adds one line to the existing file, and never adds it twice. It tells you the file is changed and not yet committed, so you commit it in that project.
3. **This repo is brought into line too.** The committed copy of `.claude/settings.json` is already plain endings, so `git add --renormalize` changes nothing there and there is nothing to commit from it (tested). What differs is the copy in the folder on this machine, which has Windows endings and which a commit cannot change. After the merge it is re-checked-out once (steps in R7), and `git status` is read to confirm trunk is clean.
4. **Nothing else changes.** No other file's line endings, the lock and the guard are untouched.

Things to know:
- The cause is reproduced and the fix confirmed in a throwaway repo with the same git setting as this machine: without the rule the install makes git list the file as modified; with it, `git status` stays empty.
- In a project adopted earlier that already has the file checked out with Windows endings, the rule takes effect the next time the file is checked out. If git still lists it, run `git add --renormalize .claude/settings.json` there. The same may apply once to this repo after the merge.

## Requirements

**R1. This repo has the rule**
Given this repo's `.gitattributes`, when I read it, then it has the line `.claude/settings.json text eol=lf`, and `git ls-files --eol .claude/settings.json` reports the attribute `text eol=lf`.

**R2. adopt.sh adds the rule**
Given a project with no `.gitattributes`, when `adopt.sh` runs, then the project gets a `.gitattributes` holding that line.

**R3. adopt.sh keeps the project's own rules, and adds the line once**
Given a project whose `.gitattributes` already has other rules (the last line with or without a final newline), when `adopt.sh` runs, then those lines are unchanged and the line is added once; given it already has the line, when `adopt.sh` runs again, then the file is unchanged.

**R4. adopt.sh says it is uncommitted**
Given `adopt.sh` changed the project's `.gitattributes`, when it finishes, then its output says the file needs committing in that project; given it changed nothing, then it does not say so.

**R5. The install leaves git clean**
Given a project adopted by `adopt.sh` where git converts line endings on checkout, when the file `.claude/settings.json` is committed, checked out again, and then rewritten with plain endings the way the install does, then `git status` shows nothing.

**R7. This repo is clean after the merge (added at approval, at Jason's request)**
Given the change is merged into trunk in the main folder, when the file is re-checked-out once (delete `.claude/settings.json`, then `git checkout -- .claude/settings.json`), then `git ls-files --eol .claude/settings.json` reports `w/lf` with `attr/text eol=lf`, and `git status --short` prints nothing. Also, given a repo where git converts line endings and the file has Windows endings, when the rule is added and the file is re-checked-out, then the working copy has plain endings and `git status` is clean (automated).

**R6. Nothing else moves**
Given the change, when compared with trunk, then nothing under `githooks/` differs, and the existing lock, guard and adopt tests all still pass.

## Checks

- R1: automated, in `test-adopt.sh`: it reads this repo's `.gitattributes` for the line.
- R2 to R4: automated, in `test-adopt.sh`, on throwaway projects (none, with other rules, with the last line lacking a newline, already having the line).
- R5: automated, in `test-adopt.sh`. The stand-in `claude` is extended so an install writes `.claude/settings.json` with plain endings, as the real one does. The test sets git to convert line endings in a throwaway project.
- R7: the second half is automated in `test-adopt.sh` (a throwaway repo with Windows-style checkout, the file committed, the rule added, the file re-checked-out). The first half is Manual, because the working copy in the main folder is not in git: after the merge, Claude reads `git status --short` and `git ls-files --eol .claude/settings.json` in `D:\Projects\ProjectWorkflow` and reports the result to Jason; the one-time re-checkout is the only command, and it deletes nothing but a copy git can restore.
- R6: automated: the four checks in CLAUDE.md; `git diff trunk -- githooks` is empty, noted in the review record.
- Not automated: that the real `claude plugin install` writes plain endings and the rule makes git clean in a real project. Done once already by hand in a throwaway repo while planning (see above); `/code-change` repeats it once and records it as Manual if it is not run.

## What could go wrong / what gets lost

- **The rule only helps where git converts line endings.** On a machine where it doesn't, the rule does nothing and nothing breaks.
- **The project's `.gitattributes` is edited by `adopt.sh`.** It only appends one line and leaves the rest alone (R3), and tells you it is uncommitted (R4). If the project's file has Windows line endings itself, the new line is added with plain endings; git handles both.
- **The renormalise commit is empty.** Jason asked for `git add --renormalize .claude/settings.json` committed on the branch; it produces no change because the stored copy is already plain endings. So the branch carries no commit for it, and the real fix for this repo is the re-checkout after the merge (R7).
- **A real `claude` could someday write the file differently** (for example with Windows endings). The rule would then make git convert it on commit, which is still harmless.

## Not included

- Any other file's line endings.
- Committing the project's `.gitattributes` for you.
- Changing the lock, the guard or `githooks/`.
- Fixing the earlier-adopted projects automatically (the renormalise note above covers them).

## Check-in

- Branch: `fix/PWF-033-settings-json-lf`
- Commit message: `fix(PWF-033): keep .claude/settings.json at plain line endings so a plugin install leaves git clean`

## Backlog items fixed or accepted

None.
