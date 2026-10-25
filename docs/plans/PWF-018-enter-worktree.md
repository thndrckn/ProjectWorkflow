# PWF-018 — /code-change must really enter its worktree

- **Change:** PWF-018
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app changes. In the workflow:
- When you type `/code-change`, Claude makes the change's worktree, moves the chat into it, and checks that it really is inside it (right folder, right branch) before writing any code.
- If the chat can't get into the worktree, Claude stops straight away and tells you in plain English, instead of carrying on from the main folder.
- `/commit-change` typed in that same coding chat can then step out of the worktree by itself, so you no longer need a separate chat on master to check a change in.

## Requirements
- **R1.** Given `/code-change` has made a change's worktree, when it moves into it, then it first loads the worktree tools and moves in through them, rather than assuming they can already be used.
- **R2.** Given `/code-change` has tried to move into the worktree, when the working folder is not that worktree or the branch is not the plan's branch, then it stops with a plain-English explanation before writing any code, and does not carry on in the main folder.
- **R3.** Given `/code-change` is continuing an existing change from the main folder, when a worktree exists for that change, then it moves in with the same load, enter and verify steps, including the same stop.
- **R4.** Given `/commit-change` is typed in a coding chat inside a worktree, when it reaches the merge step, then it first loads the tool for stepping out, and if the chat still cannot leave the worktree it stops and tells you, as it does today.
- **R5.** Given the workflow skills are shared between projects, when this change is done, then nothing project-specific has been added to them.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog entries | None (backlog is empty), so none were asked. |
| If `/code-change` can't enter the worktree (tool unavailable or the switch fails), should it STOP and tell you instead of carrying on from the main folder? | Yes, STOP. |
| Play-back: "Is that right?" (understanding and requirements R1 to R5) | Yes. |

## What could go wrong / what gets lost
Nothing is lost: only skill instructions change, no code, data or migration. The one risk is that the new wording is still skipped by a future run. The check-in of the next real change will show whether it holds (see T2).

## Not included
- No change to the guard hook, to CLAUDE.md, or to the app.
- No fallback to the single-folder flow when entering fails (you chose to stop instead).
- No repair for a worktree made earlier without being entered; `/commit-change` already stops there and says to run it from a main-folder chat naming the change.

## How you'll check it
**T1 — Read the new wording. Covers R1, R2, R3, R4, R5.**

1. Open `.claude/skills/code-change/SKILL.md` (step 3 and the paragraph about continuing from the main folder) and `.claude/skills/commit-change/SKILL.md` (steps 1 and 5).
2. Look for: loading the worktree tools first, a check of folder and branch after entering, a STOP if they don't match, and no project-specific names.

Expected: each of these is there, and the skills still read clearly.

**T2 — Live run on the next real change. Covers R1, R2, R4.**

1. Plan the next real change and type `/code-change` in a fresh chat.
2. Watch that Claude says it entered the worktree and shows the folder and branch.
3. When it hands off, type `/commit-change` in that same chat.

Expected: `/commit-change` steps out of the worktree by itself, merges, pushes and removes the worktree, with no need for a main-folder chat.

## Check-in
- Type: chore
- Branch: chore/PWF-018-enter-worktree
- Commit message: chore(PWF-018): /code-change loads the worktree tools and checks it is inside the worktree

---

## Technical detail (for Claude)
Root cause (best explanation; the records do not prove it): `code-change` step 3 already says "Enter the worktree with `EnterWorktree` and its `path`", but `EnterWorktree` and `ExitWorktree` are deferred tools whose schemas are not callable until loaded with `ToolSearch` (`select:EnterWorktree,ExitWorktree`). The skill never says to load them and never verifies the result. `ExitWorktree` is a no-op for a worktree not entered through the tool, so a skipped or failed entry surfaces only at `/commit-change`.

Files, all under `.claude/skills/`, wording only, no project-specific facts:
- `code-change/SKILL.md`, step 3: replace the "Enter the worktree" bullet with: load both tools in one `ToolSearch` call (`select:EnterWorktree,ExitWorktree`), call `EnterWorktree` with `path`, then verify with separate commands `git rev-parse --show-toplevel` and `git branch --show-current` that the folder is the worktree and the branch is the plan's. If the tool can't be loaded, the call fails, or either check differs, STOP and tell the user in plain English; write no code and do not continue from the main folder.
- `code-change/SKILL.md`, the continue-mode paragraph about entering an existing worktree from the default branch: point to the same load, enter and verify rule.
- `commit-change/SKILL.md`, step 1 (entering a worktree from the default branch) and step 5 (leaving it): load `ExitWorktree` (and `EnterWorktree` in step 1) with `ToolSearch` first; keep the existing STOP when the chat cannot leave.
- CHANGELOG entry and review record are written by `/code-change`. No change to CLAUDE.md.

Feature-cycle steps from CLAUDE.md: none apply (no app code). Checks from CLAUDE.md still run as the change's checks.

**Planned tests**
- R1 — Manual (checked by Claude): read the edited step 3 and confirm it loads the tools before `EnterWorktree`. Wording in a skill file cannot be unit tested; Claude can read it.
- R2 — Manual (checked by Claude): read step 3 and confirm the folder and branch check and the STOP are present. Whether a live run follows it is covered by T2, which needs the user.
- R3 — Manual (checked by Claude): read the continue-mode paragraph and confirm it uses the same rule.
- R4 — Manual (checked by Claude): read commit-change steps 1 and 5 and confirm the tool loading and the kept STOP. A live check needs the user (T2).
- R5 — Manual (checked by Claude): search the edited skill files for project names, numbers and file names beyond the shared workflow paths.
