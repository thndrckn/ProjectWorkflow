# Review: PWF-015 — Worktrees for parallel changes

- **Change:** PWF-015
- **Review format:** accountability
- **Plan:** docs/plans/PWF-015-worktrees-for-parallel-changes.md (approved in commit 02645af)
- **Branch:** chore/PWF-015-worktrees-for-parallel-changes
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then four rounds of fresh re-reviewers (rounds 1 to 3, and an extra round 4 the user authorised)
- **Scope:** diff of chore/PWF-015-worktrees-for-parallel-changes against master — 14 files, about 890 lines added and 64 removed (the four skills, the guard hook and its checker and tests, `scripts/dev.mjs`, `vite.config.ts`, `package.json`, CLAUDE.md, `docs/DECISIONS.md`, the plan, and the saved copy of the shared policy). Plus one file outside the repository, `D:\projects\shared-claude-conventions\POLICY.md` (two sentences changed); its saved original is `docs/reviews/PWF-015-POLICY.md-before.md`.

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author). Findings raised by a re-review are marked with the round that raised them.

### First review

**Standards**

- **[Low]** The guard checker hardcodes the worktree folder `.claude/worktrees/`, a project fact — `shell-command-check.js`, `test-block-main-edits.sh`
  **Caused by this change:** yes
  **Disposition:** fixed (`block-main-edits.sh` now asks `git worktree list --porcelain` for the other worktrees' paths and passes them to the checker; no folder is named in the hook code, and a test worktree kept somewhere else proves it)
- **[Informational]** The skills still name `docs/plans/` and `CHANGELOG.md` — `.claude/skills/*`
  **Caused by this change:** no
  **Disposition:** explained (these are the shared workflow's own fixed record paths, which the policy's rule 3 exempts; they were already there)

**Spec**

- **[Low]** The claim placeholder is named `<NUMBER>-claimed-<six random letters>.md`, the plan said `<NUMBER>-claimed.md` — `plan-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (a fixed name would let two chats claiming the same number at once silently overwrite each other's file and never see the clash, which would break R1; the random suffix is what makes the tie-break possible; recorded in `docs/DECISIONS.md` and under Deviations)
- **[Low]** No optional change-number argument for `/commit-change` — `commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed (step 1 now says a change number given as an argument selects the change)
- **[Low]** The plan says to check the schema version "bumped by both sides"; the skill only checks that it equals the highest migration number — `commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (two changes bumping to the same value with the same migration number are caught by the duplicate-number check, and different numbers can no longer match the highest, so both cases are covered)
- **[Nit]** No scripted temporary-repo checks for R1 and R7 as the plan said — no files
  **Caused by this change:** yes
  **Disposition:** fixed (Claude ran scripted checks in throwaway repos: the changelog-only conflict recipe, the highest-number scan with branch names and the tie-break, the next free migration number, and duplicate-migration detection; all gave the expected results; they are not kept in the repository)
- **[Informational]** A single-folder fallback in `/code-change` (plans that are the user's own uncommitted edits, projects without a "Worktree folder" line) is beyond the plan — `code-change/SKILL.md`, `commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (a worktree cannot carry uncommitted edits and the skills are shared with projects without worktree lines; recorded in `docs/DECISIONS.md` and under Deviations)
- **[Informational]** `scripts/dev.mjs` errors when the worktree folder name does not end in a number — `scripts/dev.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (consistent with CLAUDE.md's "Worktree folder" line, which requires the name to end in the change number)

**Correctness**

- **[High]** In worktree mode almost all git was allowed, so the main folder and `master` could still be changed (`GIT_DIR=<main>/.git git reset --hard`, `git -c core.worktree=<main> ...`, `git branch -f master HEAD`, `git update-ref`, `git worktree remove --force` on another worktree) — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (git-environment words pointing into the main folder are blocked; `-c core.worktree/core.bare` counts as a redirect; `update-ref`, forced or moving `branch` on the default branch, pushes to the default branch and `--mirror` are blocked; the `worktree` rules now apply in worktree mode too; tests added)
- **[High]** Relative writes in worktree mode were allowed after `cd <main folder>` because the checker does not follow `cd` — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (`cd`, `chdir`, `pushd`, `Set-Location`, `sl` and `Push-Location` may not point into the main folder or at an unresolvable or `..` path in worktree mode; tests added)
- **[Medium]** The force-flag test missed abbreviated long options (`--forc`, `--f`) — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (unambiguous-prefix matching, as git does; tests added)
- **[Low]** `git worktree add src/foo` on master could put a checkout inside the tracked tree — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (a destination inside the main folder must be a path git ignores, checked with `git check-ignore`; `..` and variable paths are refused; tests added)
- **[Low]** An unforced `git worktree remove` still deletes ignored files such as the worktree's database, with no warning — `commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed (step 3 of `/commit-change` now gives a plain heads-up that the worktree's packages, build folder and data folder are deleted and stops to ask if the user said they want something kept; the `/code-change` hand-off says the same; Claude also confirmed in a throwaway repo that the unforced removal deletes ignored contents and refuses on untracked files)
- **[Low]** `/code-change` copies the plan into the worktree and deletes the original before the plan is committed there — `code-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed in part, explained for the rest (the copy is now verified byte-for-byte identical before the original is deleted, and the skill says where the only copy is and how to recover; the commit cannot be made earlier because the guard blocks `git add`/`git commit` on master and the main folder cannot be touched once inside the worktree; the copy stays safely on disk in the worktree folder)
- **[Informational]** The edit tools allow a detached HEAD while the shell check fails closed on one — `block-main-edits.sh`
  **Caused by this change:** no
  **Disposition:** explained (pre-existing behaviour, deliberately kept and noted in the hook's comment)

### Round 1

- **[Medium]** Attached short options bypassed the redirect check (`git -C/path`, `git -ccore.worktree=...`, `--config-env=...`) — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (`parseGlobals` splits git's global options in every form; tests added)
- **[Medium]** Global options with a separate value were not skipped (`git --namespace foo -C <main> reset --hard`, `git --namespace foo update-ref -d refs/heads/master`) — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (the value-taking global options are known, and any unrecognised global option fails closed; tests added)
- **[Low]** `git fetch -u . HEAD:master` could move the checked-out default branch — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (fetch with a `<src>:<dst>` refspec naming the default branch is blocked; plain `fetch origin master` stays allowed; tests added)
- **[Low]** `git config core.worktree <main>` and `git config --worktree ...` were allowed in worktree mode — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (config writes naming `core.worktree` or `core.bare` are blocked; tests added)
- **[Informational]** Interpreters and scripts remain out of scope — `shell-command-check.js`
  **Caused by this change:** no
  **Disposition:** explained (the checker's header and CLAUDE.md both say it is best-effort pattern matching and not a sandbox; this was already so)

### Round 2

- **[Low]** `git config set core.worktree <main>` (the git 2.46 `config set` form) was allowed — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (any non-option word may be the key; two or more words naming `core.worktree`/`core.bare` are blocked; tests added)
- **[Low]** `git config --file <main>/.git/config core.worktree X` and `git config -f x core.worktree y` were allowed — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (`-f`/`--file` values are taken out of the words, the key rule then applies, and a file pointing into the main folder is blocked for any write-shaped config command; a separate `--type` value is also handled; tests added)
- **[Nit]** `git fetch origin ":master"` came back as "could not read the command" in the reviewer's harness — no files
  **Caused by this change:** yes
  **Disposition:** explained (the reviewer's own JSON escaping of the quotes; unreadable input fails closed, so it can never be allowed; round 3 confirmed the command is correctly blocked)

### Round 3

- **[Low]** The attached short form `-f<path>` was not recognised in the `git config` guard, so `git config -f/tmp/x/main/.git/config user.name z` was allowed in worktree mode — `shell-command-check.js`
  **Caused by this change:** yes
  **Disposition:** fixed (an argument matching `-f<path>` is treated as an attached file value; tests added)
  This was the last permitted round and it was not clean, so Claude stopped and asked the user how to settle it. Question: fix it and authorise a fourth round, fix it with no further review, or leave it unfixed. **Settled by the user:** "Fix it and authorise a 4th review round (Recommended)".

## Re-review

### Round 1
Triggered by every outcome of the first review. The re-reviewer checked all fifteen first-review findings: it accepted every explanation (the pre-existing detached-HEAD observation, the policy exemption for fixed record paths, the placeholder suffix, the schema-version coverage, the single-folder fallback, the number-only dev folder rule, the plan-copy residual and the scripted checks) and accepted the fixes it could check by reading and by running the checker on about 70 commands. It found that the guard fixes for the two High findings were incomplete and raised four new findings, listed above under Round 1 (two Medium, two Low) and one Informational. All four were fixed. The round was **not clean** (new findings).

### Round 2
Checked the four Round 1 fixes by running the checker against each bypass and against master mode. All four were resolved and master mode did not regress. It raised two new Low findings and one Nit in the `git config` guard, listed above under Round 2, all settled (two fixed, the Nit explained and later confirmed). The round was **not clean** (new findings).

### Round 3
Checked the Round 2 fixes with about 30 `git config` and `git fetch` commands in both modes. Both fixes were resolved, the Nit explanation was accepted, and master mode did not regress. It raised one new Low finding, listed above under Round 3. The round was **not clean**, and it was the last permitted round.

### Round 4 (extra)
**Settled by the user:** "Fix it and authorise a 4th review round (Recommended)", the answer to the question asked after Round 3.
The fresh re-reviewer checked the `-f<path>` fix: attached `-f` with paths into the main folder, relative and `..` paths, quoted forms, with `--unset`, `--unset-all` and `--add`, and `-fx` forms were all blocked; the legitimate forms (`-f.gitmodules`, plain `git config user.name x`, `git config -l`, `--get`) still worked; master mode was unchanged. One conservative behaviour was noted (an attached `-f<main path>` with `--get` is blocked, consistent with the existing separate `-f <path>` rule). No new findings. The round was **clean**.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Two live planning chats get different change and migration numbers (T1, on the next two real changes). Claude also ran the number commands in a throwaway repo: highest number across the changelog, plans and branch names, the tie-break between two claims, and the next free migration number | Manual |
| R2 | A live `/code-change` creates the worktree and branch and leaves master's folder alone (T2) | Manual |
| R3 | Two live coding chats do not see each other's files (T2) | Manual |
| R4 | A live worktree app uses an empty database and its own port (T2), and a copy only when the plan asks (T3, on the first real change that needs one). Claude checked the dev wrapper against a stand-in for the Tauri command in a throwaway repo (master unchanged, worktree on port 5274, error without a number or without installed packages) and read that the debug build's database path is relative to the project | Manual |
| R5 | Automated: the hook test script, edits and shell writes from a worktree (allowed in its own files, blocked into master's folder) and the ways round the protection | Pass |
| R6 | A live `/commit-change` merges, pushes and removes the worktree (T5) | Manual |
| R7 | Scripted throwaway-repo run of the changelog-only conflict recipe (both entries kept, this change's on top) and of the duplicate-migration-number check; the conflict stop and the full flow are the live T6 | Pass (checked by Claude) |
| R8 | A live `/build-changes` with a change still open (T7, on the next real build) | Manual |
| R9 | A live `/commit-change` removes the worktree with its build folder, packages and database (T5). Claude confirmed in a throwaway repo that an unforced `git worktree remove` deletes ignored contents | Manual |
| R10 | Automated: the hook test script, `git worktree add`, `list` and unforced `remove` allowed on master; forced, abbreviated-force, `prune`, `move`, `lock` and `repair` blocked | Pass |

## Deviations from the plan
- The claim placeholder file is `<NUMBER>-claimed-<six random letters>.md`, not `<NUMBER>-claimed.md`, so a clash between two chats can be detected (see `docs/DECISIONS.md`). **Approved by the user** after the hand-off, who accepted this decision as recorded in `docs/DECISIONS.md`.
- `/code-change` has a single-folder fallback (for a plan that is the user's own uncommitted edits, and for a project without a "Worktree folder" line), which the plan did not mention (see `docs/DECISIONS.md`). **Approved by the user** after the hand-off, who accepted this decision as recorded in `docs/DECISIONS.md`.
- `/code-change` verifies the plan copy with `cmp` before deleting the original, and `/commit-change` gives a plain heads-up before deleting the worktree's data folder (both from review findings; neither contradicts the plan).
- The guard went further than the plan's wording: the main-folder protection in a worktree also covers `cd`, git environment variables, `-c core.worktree`, git config writes, fetch and push to the default branch, and `git worktree add` must land on a git-ignored path. All of it serves R5.
- The guard asks `git worktree list` where the other worktrees are, instead of a fixed folder, so it names no project folder.
- The hook test script now takes about 20 minutes instead of about 5, because each case starts more processes. Not changed; noted for a future change.
- The shared `POLICY.md` was edited (two sentences), which the plan allowed only if its workflow text needed the wording; its saved original is `docs/reviews/PWF-015-POLICY.md-before.md`.
- The README is unchanged: `npm run dev` works as before, and the worktree behaviour is described in CLAUDE.md and the skills.
- No migration is needed.

## Summary
The workflow now supports coding several changes at once, each in its own worktree. The four skills, the guard hook, a dev-server wrapper that picks a port per worktree, and CLAUDE.md's new lines are in place. The guard was hardened over four re-review rounds (the fourth authorised by the user) until the last one found nothing new. The hook test script passes in full (611 cases, old and new), and cargo test (384 tests), clippy, fmt, lint and the Vite build pass. Requirements R5 and R10 are proven by automated tests and R7 by a scripted check; R1 to R4, R6, R8 and R9 need the live runs in T1 to T7, which use the next real changes.
