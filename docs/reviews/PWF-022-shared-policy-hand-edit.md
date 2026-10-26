# Review: PWF-022 — Shared policy is edited by hand only

- **Change:** PWF-022
- **Review format:** accountability
- **Plan:** docs/plans/PWF-022-shared-policy-hand-edit.md (approved in commit c953256)
- **Branch:** chore/PWF-022-shared-policy-hand-edit
- **Reviewer:** independent Standards, Spec and Correctness reviewers; a re-review ran (3 rounds)
- **Scope:** diff of chore/PWF-022-shared-policy-hand-edit against master — the guard hook and its shell checker and test script, the plan-change and code-change skills, CLAUDE.md, the plan, and the saved before-copy of the file outside the repository that the change edited (`D:\projects\shared-claude-conventions\POLICY.md`, saved at docs/reviews/PWF-022-POLICY.md-before.md), about 500 lines. The user made the POLICY.md edit by hand, as the plan's "Policy edits for you to make by hand" section says.

## Findings

- **[Low]** The shared-only branch in the shell checker repeated the normal pass's cd / shell -c / dd / writer handling — .claude/hooks/shell-command-check.js (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (the duplicate block was removed; the shared-only pass now runs through the same code, with small sharedOnly conditions)

- **[Low]** The shared-only pass let relative, variable and ~ destinations through, so CLAUDE.md's "on every branch" overstated it — .claude/hooks/shell-command-check.js, CLAUDE.md (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (the hook now passes the command's working directory; relative paths are resolved against it and against each cd it can follow; CLAUDE.md states what is and is not judged)

- **[Nit]** CLAUDE.md said the rule is "off" with no line, but an edit is still blocked while the project is on master — CLAUDE.md, .claude/hooks/test-block-main-edits.sh (Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (CLAUDE.md now says exactly what happens with no line; a test covers a change-branch project with no line)

- **[Informational]** The "why" comments are present where the code is non-obvious, and the hook is project-neutral — .claude/hooks (Standards)
  **Caused by this change:** no
  **Disposition:** explained (observation only, no action)

- **[Medium]** Plan R3 and R8 say that with no CLAUDE.md line the guard "still blocks the shared folder"; the build blocks only the edit tools, and only while the project is on master, and a shell write there is allowed — .claude/hooks/block-main-edits.sh, .claude/hooks/test-block-main-edits.sh (Spec)
  **Caused by this change:** yes
  **Disposition:** explained (without the line the guard cannot tell the shared folder from any other folder outside the project, and blocking every outside shell write on master would break existing behaviour. The author stopped and asked the user. Settled by the user: "Yes, record it as a deviation: without the CLAUDE.md line, only the edit tools are blocked; shell writes there aren't." Recorded under Deviations from the plan.)

- **[Nit]** The new test sections are labelled R11 and R12 while the plan's requirements are R1 to R8 — .claude/hooks/test-block-main-edits.sh (Spec)
  **Caused by this change:** yes
  **Disposition:** fixed (a comment in the script maps R11 and R12 to the plan's R1, R2, R3 and R8; the script's own numbering continues R1 to R10 above them, so renaming would collide)

- **[Informational]** POLICY.md differs from the before-copy by one extra sentence in the Record paragraph — D:\projects\shared-claude-conventions\POLICY.md (Spec)
  **Caused by this change:** no
  **Disposition:** explained (the sentence is the user's hand edit for PWF-021. Settled by the user: "Treat it as PWF-021's edit". This change's own two edits were checked exact: the file equals the before-copy plus the two planned replacements, plus that sentence.)

- **[Medium]** Relative-path writes into the shared folder were allowed (for example `echo hi > ../shared-claude-conventions/a` from the project folder) — .claude/hooks/shell-command-check.js (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (same fix as the second Standards finding: relative paths are placed from the working directory and each followable cd; tests added for a sibling-relative path, a bare file name in the folder, and cd chains)

- **[Low]** The folder was passed to the checker only in the Git Bash spelling, so the same folder written the Windows way (`C:/Users/.../Temp/...`) did not match — .claude/hooks/block-main-edits.sh, .claude/hooks/shell-command-check.js (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed (the hook passes both spellings and the checker compares against both; a test uses the Windows spelling)

- **[Low]** The rule fails open: a checker crash fell through to the old flow, and a missing line or a branch that deletes the line turns the rule off — .claude/hooks/block-main-edits.sh (Correctness)
  **Caused by this change:** yes
  **Disposition:** fixed in part, explained in part (a checker crash or any unexpected output now blocks. A missing or unreadable line turning the rule off is the plan's R3 and the user's decision above, and CLAUDE.md says so; a branch deleting the line is a visible diff for the reviewers, and the guard is documented as best-effort, not a sandbox.)

- **[Informational]** Positive checks passed: a sibling folder whose name starts the same is not blocked, case and `..` are handled, a malformed command fails closed — .claude/hooks (Correctness)
  **Caused by this change:** no
  **Disposition:** explained (observation only, no action)

- **[Nit]** Each shell call now starts node twice (the shared pass, then the normal pass) — .claude/hooks/block-main-edits.sh (Correctness)
  **Caused by this change:** yes
  **Disposition:** explained (latency only, tens of milliseconds on a healthy machine; the shared check has to run before the branch logic because it applies on every branch)

- **[Informational]** (Round 1) After a cd the checker cannot follow (a variable or `~`), relative writes are allowed — .claude/hooks/shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained (the documented best-effort gap, in the checker's header comment and in CLAUDE.md; closing it would block every relative write after any `cd $VAR`, which would block ordinary project work)

- **[Nit]** (Round 2) `cd -` was resolved as a directory named `-`, so later relative writes were placed wrongly — .claude/hooks/shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** fixed (`cd -` now counts as a cd the checker cannot follow, like a variable or `~`; two tests added)

- **[Informational]** (Round 2) The shared pass does not judge git commands (for example `git -C <shared> checkout .`) — .claude/hooks/shell-command-check.js
  **Caused by this change:** yes
  **Disposition:** explained (deliberate and written in the code comment: the shared pass judges writers and cd only, and git is best-effort in the main pass too)

## Re-review

### Round 1
Triggered by the fixes and explanations above. A fresh re-reviewer accepted every outcome: it confirmed the duplicate code is gone, that relative and cd-chain writes into the folder are now blocked (it tried about twenty cases), that both folder spellings match, that the unexpected-output case blocks, that CLAUDE.md now matches what the hook does, that the "caused: no" labels are true, and that the user-settled deviation holds. It raised one new finding (the Informational one marked Round 1 above), so the round was not clean.

### Round 2
A fresh re-reviewer accepted the Round 1 explanation. It raised two new findings (the Nit and the Informational marked Round 2 above), so the round was not clean.

### Round 3
A fresh re-reviewer accepted both Round 2 outcomes: it confirmed `cd -` now sets the working directory to unknown, that absolute paths and recognised writers into the folder stay blocked, that the change touches no other path, and that the git note is documented and consistent. It raised no new finding. The round was clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Guard test cases in the script's R11 section: Edit, Write, MultiEdit and NotebookEdit and shell writes (redirects, tee, cp, mv, sed -i, rm, touch, Set-Content, bash -c, cd) into the shared folder, from a master project and a change-branch project, with the Windows spelling, relative paths and cd chains; the message says "edited by the user only" | Pass |
| R2 | The script's R11 cases include an allowed project edit and shell write on a change branch, a still-blocked master project edit, and a read of the shared folder allowed; the full suite (R1 to R10 plus R11 and R12) was run | Pass |
| R3 | R11 cases (path read from the CLAUDE.md line) and R12 cases (line absent: Edit blocked with the generic message on master, shell write allowed, change-branch Edit allowed); see Deviations | Pass |
| R4 | Read the plan-change skill for the optional "Policy edits for you to make by hand" section in the plan format and the rule that leaves it out when unused | Pass (checked by Claude) |
| R5 | Read the code-change skill step; observed in this change's run: the before-copy was committed (1ddcfff) before the stop, the edits were shown, the run waited for the user's "done" after each, and the file was verified against the before-copy plus the planned replacements | Pass (checked by Claude) |
| R6 | Read CLAUDE.md (the "Shared conventions folder" line) and both skills for the rule | Pass (checked by Claude) |
| R7 | The plan carries the exact wording; the user made both edits by hand; the file was checked equal to the before-copy plus exactly the two replacements | Pass (checked by Claude) |
| R8 | The script's R12 section with the line absent; see Deviations. One R12 test failed once from a typo in the test (a missing space between two arguments) and was fixed | Pass (fixed after Fail) |

Test runs: the six required checks (cargo test, clippy, fmt, lint, check:conventions, build:vite) pass. During the review the full guard suite ran 796 passed, 1 failed on the code of commit 64f377b (the one failure was the test typo above); R11 and R12 alone were then re-run: 100 passed, 0 failed, and after the last fix (commit b134bd2, `cd -`) 104 passed, 0 failed. **Final run, requested by the user before check-in:** the full guard suite (`bash .claude/hooks/test-block-main-edits.sh`, all 13 sections R1 to R10, R8b, R11 and R12) was run on the committed code at 960f92a, after the `cd -` fix, with a clean working tree: **801 passed, 0 failed.**

## Deviations from the plan
- **R3 and R8, the missing-line case.** The plan says that with no "Shared conventions folder" line the guard "still blocks the shared folder, with the generic message". Built behaviour: without the line, the edit tools are blocked only while the project folder is on master, with the generic message, and a shell write there is allowed; a project on a change branch is not blocked either. Reason: without the line the guard cannot tell the shared folder from any other folder outside the project. Settled by the user: "Yes, record it as a deviation: without the CLAUDE.md line, only the edit tools are blocked; shell writes there aren't." CLAUDE.md states this behaviour, and the tests assert it.
- **The user's request to make the line required in every project and add it to the Spoolkeeper and LockedIn setup steps** is not part of this change. It would change files in two other projects; it needs its own plan.
- **POLICY.md** now also holds a sentence the user added by hand for PWF-021; it is not part of this change (see the Spec Informational finding).
- Beyond the plan: the checker also blocks `cd` into the shared folder and resolves relative paths and cd chains, and the hook fails closed on unexpected checker output. These came from review findings and fall under R1.

## Summary
The shared conventions folder is now the user's to edit by hand only: CLAUDE.md names the folder on a new line, the guard hook blocks the edit tools and shell writes there on every branch (best-effort, with its limits stated), plans carry a "Policy edits for you to make by hand" section with the exact wording, and `/code-change` saves a before-copy, stops for the user's confirmation and gives the reviewers both versions. The user made the two POLICY.md edits by hand and they were checked exact. Without the CLAUDE.md line, only the edit tools are blocked (a user-settled deviation from the plan). Review fixes closed relative-path, Windows-spelling, duplicate-code and fail-open findings. The third re-review round was clean.
