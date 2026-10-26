---
name: plan-small-change
description: Plan a change that fits in one session. Started by /design-change, or typed directly when the design step isn't needed (a bug fix, a small tweak). Rates the merge danger, recommends Light or Full review, writes the plan with Given/When/Then requirements and a test each, and commits it as the approved plan after Jason approves. Writes no code.
---

# Plan a small change

Second step of the workflow: design → **plan** → code → merge. The only files written are the plan in `docs/plans/` and, once approved, its commit on the change's branch. Never enter plan mode.

## 1. Claim the change number
Skip if `/design-change` already did.
- The prefix is in CLAUDE.md's Workflow section; if absent, ask and STOP.
- Find the highest number for the prefix in `CHANGELOG.md`, `docs/plans/` file names and all local branch names (`git branch --list`). The next one, three digits, is the new number. If none exist anywhere, ask which number to start from.
- Claim it at once with `docs/plans/<NUMBER>-claimed-<six random letters>.md` (one line: claimed by a planning chat still running). If another claim for the same number now exists, the name that sorts first keeps it; the others delete theirs and take the next number.
- Tell Jason the number and show `/rename <NUMBER>` (only he can run it). If the number changes later, say so the same way. A number is never reused.

## 2. Understand it
If typed directly: ask what the change is, read CLAUDE.md and the code it touches, and look up facts instead of asking. A bug report gets its root cause found first with `mattpocock-skills:diagnosing-bugs`. Record the **type**: feat, fix, refactor, perf, style, docs, chore or test.

## 3. Merge danger and level
Using the definition in `mattpocock-skills:pr`:
- **Door:** one-way (hard or impossible to undo, such as a database change or deleted data) or two-way.
- **Blast radius:** what else could break if it is wrong.

Recommend the level with a one-line reason; Jason picks (question box, recommended first):
- **Full:** a one-way door or a wide blast radius. When unsure, Full. Changes to the lock or guard are always Full.
- **Light:** a two-way door and a small blast radius.

## 4. Write the plan
Save `docs/plans/<NUMBER>-<short-title>.md`, then delete the placeholder. Plain English at the top, no code:
`# <NUMBER>: <Title>` · Type · Merge danger (door, blast radius) · Level · **What you'll see change** · **Requirements** (numbered Given/When/Then, each checkable alone) · **Checks** (a test per requirement: automated where one can exist, otherwise the manual check and why) · **What could go wrong / what gets lost** · **Not included** · **Check-in** (branch `<type>/<NUMBER>-<short-title>`, commit message `<type>(<NUMBER>): <one line>`) · **Backlog items fixed** or **accepted** (with Jason's reason), if any · **Original request (set aside)**, word for word in a long fence, if one was set aside.

A plan that grows long is probably too big: say so and suggest `plan-large-change`.

## 5. Approve and commit
Open the plan with `code <path>` (its own command). Jason reads it and asks for changes or approves. Edit and stop again on changes. On approval:
- Create the branch from the default branch (`git pull --ff-only` first; STOP if it can't), commit the plan as `docs(<NUMBER>): approved plan`. From here the plan is frozen.
- End: *"Next: `/code-change`."* Do not start coding.
