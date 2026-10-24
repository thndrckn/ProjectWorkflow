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
- **[Nit]** Path normalisation written twice (bash `norm()` and node `normPath()`) — block-main-edits.sh, shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (bash now passes the project directory as is for the shell path; the original `norm()` remains only for the pre-existing edit-tool path)
- **[Nit]** Terse destination-kind labels in the writers table — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (renamed to every-arg, last-arg, sed-in-place, first-path, first-two-paths, download)
- **[Informational]** The shell check is advisory pattern matching — shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained: stated in both hook headers and CLAUDE.md; recorded in docs/DECISIONS.md.

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

## Re-review

### Round 1
Triggered by the fixes, explanations and the new DECISIONS.md entry above. A fresh re-reviewer checked every outcome against the checker by running sample inputs and the test script (318 passed, 0 failed).
- It accepted every explanation (Standards 2 and 5, Spec 1–5, Correctness 9) and the Standards 3 outcome.
- It accepted every fix and confirmed none broke anything. It also confirmed the check-in and build commands (`git pull --ff-only`, `git switch`, `git merge --no-ff`, `git push`, `git tag`, `git branch -d`, `git diff`, `git log`, `git status`, `git rev-parse`, plan-file writes) are still allowed.
- No new finding. It noted that `git push origin feat:master` is allowed; that is within the accepted best-effort scope and the plan doesn't ask for it to be blocked.
- Round clean: yes.

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

## Summary
The hook now also checks Bash and PowerShell commands on master: an allow-list of git subcommands, and blocked file writes into the project, with the limits documented. The first review found three Medium bypasses (no-space redirects, `bash -lc`, substitutions in quotes) and several Low ones; all were fixed and a fresh re-reviewer accepted every outcome in a single clean round. All five project checks pass.
