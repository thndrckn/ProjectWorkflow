# PWF-022 — Shared policy is edited by hand only

- **Change:** PWF-022
- **Date:** 2026-10-25

## What you'll see change
The shared conventions folder (the shared policy, the process backlog and anything added there later) is now officially edited by you only. Claude is blocked from changing anything in it, on every branch and in every worktree, and is told why in plain words. When a change needs the policy edited, its plan gets a "Policy edits for you to make by hand" section with the exact old and new text. While coding, Claude saves a before-copy of each policy file on the change's branch, then stops and waits for you to say you've made the edits. The reviewers then compare the before-copy with the edited policy. The rule is written down in CLAUDE.md and the skills.

## Requirements
- **R1.** Given any branch or worktree, when Claude tries to edit or write a file in the shared conventions folder (Edit/Write tools or a shell command), then it is blocked with a message saying the shared folder is edited by the user only.
- **R2.** Given the guard's test script, when it runs, then it covers the new rule: an allowed project edit still passes, and a shared-folder edit and a shell write there are blocked.
- **R3.** Given the guard is shared across projects, when it learns where the shared folder is, then it reads the path from a new "Shared conventions folder" line in CLAUDE.md's Workflow section, not from hard-coded text. When that line is missing, the guard behaves as it does today: it still blocks the shared folder, with the generic message.
- **R4.** Given a plan whose change needs a policy edit, when `/plan-change` writes it, then it has a "Policy edits for you to make by hand" section with the exact old and new text. A plan with no policy edit leaves the section out.
- **R5.** Given an approved plan with that section, when `/code-change` reaches that point, then it first saves a before-copy of each policy file to be edited and commits it on the change's branch. It then stops, shows the edits, and continues only after you confirm you've made them. The reviewers are given the before-copy and the edited policy to compare.
- **R6.** Given someone reading the docs, when they look in CLAUDE.md and the skills, then the rule is written down: Claude never edits the shared folder, and policy changes go through the plan's "Policy edits" section.
- **R7.** Given this change itself, when it is coded, then the exact policy wording is already in this plan's "Policy edits" section, and it is delivered through that hand-edit step with nothing left to decide.
- **R8.** Given the guard's test script, when the CLAUDE.md line is absent, then a test shows the shared folder is still blocked, with the generic message.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: master guard absolute/relative path | Keep it queued |
| Hand-edited by you only, as a deliberate rule? | Yes |
| Plan lists exact wording, `/code-change` pauses for confirmation? | Yes, plus a before-copy saved on the branch first |
| Rule covers the whole shared folder? | Whole folder |
| Explicit guard rule with clear message and test? | Yes, plus the missing-line fallback and its test |
| Add a history or snapshot step? | No beyond the before-copy |
| Play-back 1 | Yes, with two additions (before-copy in R5, missing-line fallback in R3 and R8) |
| Play-back 2 | Yes |
| Exact POLICY.md wording in this plan, not decided in /code-change | Yes (asked after the plan was saved) |

## What could go wrong / what gets lost
Nothing is lost. The guard could wrongly block a project file if the folder path is matched too loosely, which the tests in R2 are there to catch. Hand edits to the policy still leave no history of their own; the before-copy, the plan and the review record are the trail.

## Not included
- Putting the shared folder under git or any backup of it.
- Letting Claude edit any file in the shared folder by any route.
- The queued backlog item about absolute and relative paths in the guard.

## How you'll check it
**T1 — Guard blocks the shared folder. Covers R1, R3.**

1. On any branch, ask Claude to add a line to the shared policy.
2. Ask it to append a line to the shared folder with a shell command.

Expected: both are refused with a message that the shared folder is edited by the user only.

**T2 — Missing line falls back. Covers R3, R8.**

1. Run the guard test script (`bash .claude/hooks/test-block-main-edits.sh`).

Expected: all cases pass, including the one with the CLAUDE.md line removed, which is still blocked with the generic message.

**T3 — Policy edit handoff. Covers R4, R5, R6, R7.**

1. Read this change's coding run: the before-copy is committed on the branch, then Claude stops and shows the policy wording.
2. Make the edits by hand and confirm.
3. Read CLAUDE.md and the three skills.

Expected: it waited for your confirmation, the review record compares the before-copy with the edited policy, and the rule is written in CLAUDE.md and the skills.

## Check-in
- Type: chore
- Branch: chore/PWF-022-shared-policy-hand-edit
- Commit message: chore(PWF-022): make the shared policy hand-edited only, with a guard rule and a handoff step

## Policy edits for you to make by hand
Two edits to `D:\projects\shared-claude-conventions\POLICY.md`. Nothing about the wording is left to `/code-change`; it saves a before-copy of the file, shows you these edits, and waits. Each "old" text appears exactly once in the file today.

**Edit 1 — "Workflow model" section (after the PROCESS_BACKLOG.md line).**

Old text:

~~~
Process improvement ideas go in `PROCESS_BACKLOG.md`, next to this file.
~~~

New text:

~~~
Process improvement ideas go in `PROCESS_BACKLOG.md`, next to this file.

This file, `PROCESS_BACKLOG.md` and anything else in the shared conventions folder are edited by the user by hand only. Claude never edits them, by any route, and each project's guard hook blocks it. A project's CLAUDE.md names the folder on its "Shared conventions folder" line. A change that needs the shared folder edited lists the exact old and new text in its plan, under "Policy edits for you to make by hand". `/code-change` saves a before-copy of each file on the change's branch, stops until the user confirms the edit is made, and gives the reviewers the before-copy and the edited file.
~~~

**Edit 2 — "Rules for plans and skills" section (new rule 4, after rule 3).**

Old text:

~~~
3. Shared skills and hooks never contain anything project-specific (numbers, file names, app features); project facts come from CLAUDE.md. The shared workflow's own paths (plans, reviews, changelog, backlog, decisions) are not project-specific.
~~~

New text:

~~~
3. Shared skills and hooks never contain anything project-specific (numbers, file names, app features); project facts come from CLAUDE.md. The shared workflow's own paths (plans, reviews, changelog, backlog, decisions) are not project-specific.
4. A plan whose change needs an edit to the shared conventions folder gives the exact old and new text in a "Policy edits for you to make by hand" section, so nothing about the wording is left to coding. A plan with no such edit leaves the section out.
~~~

---

## Technical detail (for Claude)
- `.claude/hooks/block-main-edits.sh` and `.claude/hooks/shell-command-check.js`: add a shared-folder check ahead of the branch check, for the edit tools and for shell writes. The folder path comes from a "Shared conventions folder:" line in CLAUDE.md (read via `$CLAUDE_PROJECT_DIR`); with no line, no new rule applies and today's fail-closed branch check still blocks it, with the generic message. The hook contains no project-specific names.
- `.claude/hooks/test-block-main-edits.sh`: cases for R1, R2, R3 and R8 (a temp CLAUDE.md with and without the line).
- `CLAUDE.md`: add the "Shared conventions folder" line to the Workflow section, and state the hand-edit rule. Per PWF-017, the lock-settings rule applies only to the master lock's own settings, so this is a normal edit.
- `.claude/skills/plan-change/SKILL.md`: add the optional "Policy edits for you to make by hand" section to the plan format and its rule (R4).
- `.claude/skills/code-change/SKILL.md`: add the stop step, reusing the existing outside-the-repository before-copy mechanism (step 4 and the reviewer inputs in step 6) for R5.
- `docs/DECISIONS.md`: no entry unless a review explains something as by design.

**Planned tests**
- R1 — Automated: guard test cases for an Edit/Write and a shell write into the shared folder.
- R2 — Automated: the test script itself, including an allowed project edit.
- R3 — Automated: test with the CLAUDE.md line present (path read from it) and absent (generic block).
- R4 — Manual: skill wording, Claude reads it back from the skill file; it needs no app.
- R5 — Manual: observed during this change's own `/code-change` run; needs the user to confirm the hand edit.
- R6 — Manual: Claude reads CLAUDE.md and the skills; no app needed.
- R7 — Manual: observed during this change's `/code-change` run.
- R8 — Automated: guard test with the line absent.
