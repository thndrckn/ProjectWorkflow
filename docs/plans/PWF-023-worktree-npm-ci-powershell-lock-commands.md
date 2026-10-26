# PWF-023 — Worktree setup uses npm ci, and PowerShell forms for the bash-only commands

- **Change:** PWF-023
- **Date:** 2026-10-25

## What you'll see change
Nothing in the app. The project guide (CLAUDE.md) changes in two ways. Setting up a worktree now says to run `npm ci`, so a worktree never rewrites the lockfile. The three commands that only work through bash (switching the master lock on, turning it back on, and testing the guard hook) now also show the PowerShell form that calls Git's bash directly.

## Requirements
- **R1.** Given CLAUDE.md's Worktree setup line, when a worktree is set up, then the instruction is `npm ci`, run in the worktree, and no other line of the Workflow section tells anyone to run `npm install` in a worktree.
- **R2.** Given the master lock paragraph and the "Turn it back on" step, when a user is in PowerShell, then each gives the PowerShell form `& "C:\Program Files\Git\bin\bash.exe" .githooks/install-master-lock.sh` next to the bash form.
- **R3.** Given the Guard line, when a user wants to test the hook from PowerShell, then it gives `& "C:\Program Files\Git\bin\bash.exe" .claude/hooks/test-block-main-edits.sh` next to the bash form.
- **R4.** Given the edited CLAUDE.md, when the checks run, then all of them still pass, and the lock's own settings (starting number, prefix, default branch, version files) are unchanged.
- **R5.** Given this change's own worktree, with `package-lock.json` first restored to the committed version, when `npm ci` is run in it, then it succeeds and `package-lock.json` is byte-for-byte identical to the committed version afterwards. If `npm ci` refuses because of lockfile drift, coding stops at once and the user is told before anything else is changed, with no lockfile fix and no further edits.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: "Master guard: an absolute path into another worktree is allowed, the same path written relatively is blocked" | Keep it queued |
| Also give the guard hook test a PowerShell form? | Yes, add it too |
| Add a requirement and test that `npm ci` succeeds in this change's worktree and leaves `package-lock.json` unchanged, stopping and telling you first if it refuses? | Added (user's addition) |
| Play-back, first version | Not yes: the user added R5 |
| Play-back, second version | Yes |
| R5 and T3 change: restore `package-lock.json` to the committed version before `npm ci`, and compare with the committed hash | Added (user's change, otherwise approved) |

## What could go wrong / what gets lost
Nothing is lost. If the current lockfile has drifted from `package.json`, `npm ci` will refuse; that is exactly what R5 checks, and coding stops for the user's decision rather than fixing it.

## Not included
- The "Running locally" section keeps `npm install`: that is for the main folder, not a worktree.
- The "Lockfile commands" line keeps `npm install --package-lock-only`: it regenerates the lockfile on purpose at build time.
- No changes to the hooks, the checker or the shell scripts themselves, and none to the lock's own settings.
- The queued backlog entry about relative versus absolute paths in the guard is untouched.

## How you'll check it
**T1 — Worktree setup wording. Covers R1.**

1. Open CLAUDE.md and read the Worktree setup line.

Expected: it says `npm ci`, run in the worktree, and no other worktree instruction in the Workflow section says `npm install`.

**T2 — PowerShell forms. Covers R2, R3.**

1. In CLAUDE.md, read the master lock paragraph, the "Turn it back on" step and the Guard line.

Expected: each bash-only command is followed by its PowerShell form with `& "C:\Program Files\Git\bin\bash.exe"`, and the paths match the bash forms.

**T3 — npm ci works in the worktree. Covers R5.**

1. In this change's worktree, restore `package-lock.json` to the committed version (`git restore package-lock.json`), so the test checks the real lockfile and not one the old setup rewrote. Note the committed version's hash.
2. Run `npm ci`, then hash the lockfile again.

Expected: `npm ci` succeeds and the hash is identical to the committed version's. If it refuses, work stops and you are told.

**T4 — Checks pass, lock settings untouched. Covers R4.**

1. Run all the checks listed in CLAUDE.md, and compare the "Master lock starts at" line, the prefix, the default branch and the version-file list with master.

Expected: every check passes and those lines are identical.

## Check-in
- Type: chore
- Branch: chore/PWF-023-worktree-npm-ci-powershell-lock-commands
- Commit message: chore(PWF-023): worktree setup uses npm ci; add PowerShell forms of the bash-only commands

---

## Technical detail (for Claude)
- Only file edited: CLAUDE.md, plus the usual changelog entry and review record at check-in.
- Worktree setup line (line 34): change `npm install` to `npm ci`.
- Master lock paragraph (line 38): after `bash .githooks/install-master-lock.sh` add the PowerShell form.
- "Turn it back on" (line 47): same.
- Guard line: after `bash .claude/hooks/test-block-main-edits.sh` add `& "C:\Program Files\Git\bin\bash.exe" .claude/hooks/test-block-main-edits.sh`.
- Do not touch the Master lock starts-at line, prefix, default branch or version files. A check-in cannot change those anyway.
- Do R5 first, before any edit: in the worktree run `git restore package-lock.json` first (so the committed lockfile is what is tested), record its hash (a PowerShell `Get-FileHash`), run `npm ci`, and compare the hash afterwards with the committed one. If `npm ci` fails, stop and report; do not run `npm install`, regenerate the lockfile or edit further.
- No code, so no cargo or frontend changes. The conventions test is not needed (the lint and convention scripts are unchanged). Check for any rule in `scripts/check-conventions.mjs` that reads CLAUDE.md lines, in case the edits matter to it.

**Planned tests**
- R1 — Manual: read CLAUDE.md. A text edit with nothing to automate; Claude can check it with a search.
- R2 — Manual: read CLAUDE.md. Same reason; Claude can check it with a search.
- R3 — Manual: read CLAUDE.md. Same reason; Claude can check it with a search.
- R4 — Automated: the full check list in CLAUDE.md, plus a diff of the lock-setting lines against master.
- R5 — Automated: a command run: `git restore package-lock.json`, then compare the lockfile hash before and after `npm ci` in the worktree. Claude runs it itself.
