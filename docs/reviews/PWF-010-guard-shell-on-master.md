# Review: PWF-010 — Close the shell loophole in the master-edit guard

- **Change:** PWF-010
- **Review format:** accountability
- **Plan:** docs/plans/PWF-010-guard-shell-on-master.md (approved in commit 165d6a1)
- **Branch:** chore/PWF-010-guard-shell-on-master
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then one fresh re-reviewer (round 1)
- **Scope:** diff of chore/PWF-010-guard-shell-on-master against master — .claude/hooks/block-main-edits.sh, .claude/hooks/shell-command-check.js (new), .claude/hooks/test-block-main-edits.sh (new), .claude/settings.json, CLAUDE.md, docs/BACKLOG.md, docs/DECISIONS.md, plus the plan, about 700 lines

## Findings

### Standards reviewer
- **[Low]** Redirects with no space before the target (`echo hi>f.txt`) were not caught — shell-command-check.js, test-block-main-edits.sh
  **Caused by this change:** yes
  **Disposition:** fixed (the tokenizer now splits at an unquoted `>`; tests added)
- **[Low]** Allow-listed git subcommands can still do destructive things through flags (`switch -f`, `branch -D/-m`, `tag -d`) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: the user set the allow-list at whole-subcommand level in the interview, and the plan's "Not included" says `branch -D` is deliberately not blocked. Recorded in docs/DECISIONS.md.
  **Correction (round 2):** the user said blocking destructive flags was not their decision. Disposition is now **fixed**: on master the checker blocks `git tag -d/--delete`, `git switch -f/--force/--discard-changes` and `git branch -D` (and `--delete`/`-d` with `--force`/`-f`). The DECISIONS.md entry was removed. Settled by the user: the `branch -D` block overrides the plan's "Not included" line (see Deviations). Round 1's acceptance of the old explanation is superseded by this change.
- **[Nit]** Path normalisation written twice (bash `norm()` and node `normPath()`) — block-main-edits.sh, shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (bash now passes the project directory as is for the shell path; the original `norm()` remains only for the pre-existing edit-tool path)
- **[Nit]** Terse destination-kind labels in the writers table — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (renamed to every-arg, last-arg, sed-in-place, first-path, first-two-paths, download)
- **[Informational]** The shell check is advisory pattern matching — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: stated in both hook headers and CLAUDE.md; recorded in docs/DECISIONS.md.
  **Correction (round 2):** the docs/DECISIONS.md entry was removed at the user's direction. The explanation now rests on the documentation in the hook headers and CLAUDE.md alone; docs/DECISIONS.md is identical to master's, and the re-reviewers in rounds 2–4 confirmed it.

### Spec reviewer
- **[Informational]** The checker blocks slightly more than the plan listed (touch, mkdir, dd, `git ... --output`, relative or unresolvable paths, `bash -c` contents) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: within the plan's "recognisable file-writing commands ... and similar".
- **[Informational]** Destinations starting with `~`, and `nul`, are allowed — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: both are outside the project.
- **[Informational]** `git tag`, `git branch -d/-D` are allowed on master — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: the plan allow-lists whole subcommands and its "Not included" accepts `branch -D`.
- **[Informational]** Push flag clusters containing `f` (for example `-fu`) are blocked, slightly broader than the plan's wording — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: errs toward blocking a forced push.
- **[Informational]** The manual checks T2–T4 and the real settings.json wiring can't be exercised by the script — plan
  **Caused by this change:** no
  **Disposition:** explained: the plan says so; it is an observation.

### Correctness reviewer
- **[Medium]** `echo hi>foo.txt`, `echo hi>>foo.txt`, `cat a>b` were allowed — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (same fix as the Standards redirect finding)
- **[Medium]** `bash -lc` / `bash -ec` skipped the inner-command check — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (clustered `-c` flags matched by pattern)
- **[Medium]** Command substitution inside double quotes was never analysed — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (substitutions are extracted and analysed as commands)
- **[Low]** `..` in absolute paths was not collapsed, so `/tmp/../d/project/x` was allowed — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (absolute paths are normalised before the comparison)
- **[Low]** PowerShell colon syntax (`-Path:foo`) was missed, and Tee-Object, Export-Csv, `curl -o`, `wget -O`, Invoke-WebRequest `-OutFile` were not covered — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (colon parameters split; those writers added)
- **[Low]** Wrappers hid the real command (`env -i git commit`, `timeout 5 git commit`, `xargs git commit`, `g""it commit`) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (wrappers and their options are skipped; quotes are stripped from command names)
- **[Low]** `>|` was wrongly blocked (false positive) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (the tokenizer keeps `>|` as one redirect operator)
- **[Informational]** A detached HEAD counted as a feature branch, so every shell command was allowed — block-main-edits.sh
  **Caused by this change:** yes
  **Disposition:** fixed (a detached HEAD now fails closed for shell commands, with tests)
- **[Informational]** Conservative false positives: relative paths after `cd /tmp` are treated as inside the project, heredoc body lines are analysed as commands — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: it fails closed, is documented, and none of it affects the check-in or build commands.

### Raised by re-review rounds
- **[Low]** (round 2) Abbreviated long options slipped past the new destructive-flag block (`git tag --del v1`, `git switch --discard x`, `git branch --del --force x`) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (any prefix longer than two characters of `--delete`, `--force`, `--discard-changes` is matched); accepted in round 3
- **[Low]** (round 2) A letter inside a glued flag value was read as a flag (`git tag -ukeyid v1` blocked as `tag -d`) — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (only letters before a value-taking letter in a cluster count); accepted in round 3. Consequence: `git switch -cf x`, which git reads as creating a branch named `f`, is allowed.
- **[Informational]** (round 2) `git branch -f main HEAD~5` and `git branch -M a b` are allowed — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: outside the three cases the user asked to block (`tag -d`, `switch -f`, `branch -D`); accepted in round 3
- **[Nit]** (round 3) `git tag -m -d v1` and `git tag -m "-d" v1` were wrongly blocked, because the value after a value-taking flag was read as a flag — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (the separate-token value after `-m`/`-u`/`-F`, `--message`/`--local-user`/`--file`, switch `-c`/`-C` and branch `-u` is skipped, and flags after `--` are treated as names); accepted in round 4. Settled by the user: the user chose to fix it and authorised round 4. Accepted side effect: `git branch --delete -- -f` and similar forms after `--` are allowed.

## Re-review

### Round 1
Triggered by the fixes, explanations and the new DECISIONS.md entry above. A fresh re-reviewer checked every outcome against the checker by running sample inputs and the test script (318 passed, 0 failed).
- It accepted every explanation (Standards 2 and 5, Spec 1–5, Correctness 9) and the Standards 3 outcome.
- It accepted every fix and confirmed none broke anything. It also confirmed the check-in and build commands (`git pull --ff-only`, `git switch`, `git merge --no-ff`, `git push`, `git tag`, `git branch -d`, `git diff`, `git log`, `git status`, `git rev-parse`, plan-file writes) are still allowed.
- No new finding. It noted that `git push origin feat:master` is allowed; that is within the accepted best-effort scope and the plan doesn't ask for it to be blocked.
- Round clean: yes.

### Round 2
Triggered by the user's direction after round 1: remove the DECISIONS.md entry and block `tag -d`, `switch -f` and `branch -D` on master. A fresh re-reviewer ran about 60 inputs through the checker and confirmed the fix, that check-in and build commands stayed allowed, and that docs/DECISIONS.md matched master. It raised two new Low findings and two Informational notes (listed above). Round clean: no. The findings were fixed or explained and the checks re-run.

### Round 3
A fresh re-reviewer checked the fixes for the two Low findings by running sample inputs. It accepted both fixes and the explanations for `switch -cf x` and for the two Informational notes, and raised one new Nit (listed above). Round clean: no. This was the last permitted round, so the author stopped and asked the user. Settled by the user: fix the Nit and authorise round 4.

### Round 4 (extra)
Authorised by the user. A fresh re-reviewer ran about 55 inputs, including forms where a value-taking letter could hide a real destructive flag (`git tag -m x -d v1`, `git branch -u x -D y`, `git switch -c x -f`, `git tag --message x --delete v1`). It accepted the fix, found no bypass, and confirmed check-in and build commands still pass on master and that docs/DECISIONS.md matches master. No new finding. Round clean: yes.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | test-block-main-edits.sh: one case per blocked git form (plus the added wrapper, quoting and substitution cases), through Bash and PowerShell | Pass |
| R2 | test-block-main-edits.sh: file-writing commands aimed at the project, including no-space redirects, `bash -lc`, PowerShell colon syntax, `curl -o` | Pass |
| R3 | test-block-main-edits.sh: one allowed case per allow-listed git subcommand, plus `ls`/`cat` | Pass |
| R4 | test-block-main-edits.sh: writes to temp, `/dev/null`, `$null` and `docs/plans/` allowed; `..` escape blocked | Pass |
| R5 | test-block-main-edits.sh: blocked-on-master commands allowed on a feature branch | Pass |
| R6 | test-block-main-edits.sh: non-repo directory and detached HEAD block | Pass |
| R7 | test-block-main-edits.sh: Edit/Write/MultiEdit on master and a feature branch | Pass |

T2–T4 in the plan need the hook running in a real session and are Manual.

## Deviations from the plan
- The checker went into its own file, `.claude/hooks/shell-command-check.js`, called from the hook. The plan described the logic inside the hook without naming this file.
- Beyond the plan: a detached HEAD now fails closed for shell commands, and `git ... --output` is blocked because it writes a file. Both are within the plan's intent.
- The plan's detached-HEAD/non-repo test for R6 was built as a non-repo directory plus a detached HEAD repo.
- **Approved by the user:** the plan's "Not included" says `git branch -D` is not blocked. After the first review the user directed that master also block `git tag -d/--delete`, `git switch -f/--force/--discard-changes` and `git branch -D` (and `--delete`/`-d` with `--force`/`-f`), overriding that line. The plan is unchanged; this is the deviation. Test cases were added for each.

## Summary
The hook now also checks Bash and PowerShell commands on master: an allow-list of git subcommands, and blocked file writes into the project, with the limits documented. The first review found three Medium bypasses (no-space redirects, `bash -lc`, substitutions in quotes) and several Low ones; all were fixed and a fresh re-reviewer accepted every outcome in a single clean round. All five project checks pass.

**Update (rounds 2–4):** at the user's direction the checker also blocks `tag -d`, `switch -f` and `branch -D` on master, and the DECISIONS.md entry was removed. Rounds 2 and 3 each raised small findings in the new code, which were fixed; round 3 was the last permitted round, so the user was asked and authorised round 4, which was clean. The hook test script now passes 376 cases and all five project checks pass.
