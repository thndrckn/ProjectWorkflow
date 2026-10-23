---
name: plan-change
description: Start any change to this project. Assigns the change number, interviews the user one question at a time until the change is fully understood, writes a plan file in the project's required format, then stops. Coding starts only when the user types /code-change.
disable-model-invocation: true
---

# Plan a change

This is the first step of the workflow: **plan** → code → review → check in.
Nothing gets coded here. The output is a plan file. Then you stop.

Do not edit any code during planning. The only file you write is the plan file in `docs/plans/`.

Do not enter plan mode. Write the plan file directly, then stop.

Never skip the interview or the play-back. If the request already answers everything, say so and ask at least: "Is there anything you want to add or change?" Always do the play-back and wait for the user's yes before writing the plan.

## 1. Look before asking
- Read CLAUDE.md and the shared POLICY.md if they aren't already loaded.
- Read the code the idea touches. Look things up yourself instead of asking the user questions the code can answer.
- Run `git status`. If there are uncommitted edits (other than plan files), list them and ask the user whether they are part of this change. If they are, the plan must say so and describe them, so `/code-change` carries them onto the branch.
- If the request is a bug report, find the actual root cause first using the diagnosing-bugs skill, then plan the fix.

## 2. Assign the change number
- The change prefix is set in the Workflow section of CLAUDE.md. If CLAUDE.md doesn't set one, ask the user and STOP until they answer.
- Find the highest existing number for that prefix (for example `ABC-084`) in both `CHANGELOG.md` and the file names in `docs/plans/`. The new change gets the next number, written with three digits (`ABC-085`).
- If no numbers exist yet in either place, do not guess. Ask the user which number to use and STOP until they answer.
- Tell the user the number in one line, for example: "This change is ABC-085."

## 3. Interview the user
Use the grilling skill, with these rules:
- Ask exactly ONE question per message. Never batch questions.
- Ask every question using the question box (the AskUserQuestion tool): one question per box, never several questions in one box. Put the recommended answer first in the options and label it "(Recommended)".
- Wait for the user's reply before asking the next question.
- Only ask about real decisions: what it should do, edge cases, trade-offs. Never ask about facts you can look up.
- Ask about anything risky as its own question: schema changes, migrations, data that could be lost or changed, anything touching import/export or deletes.
- Keep going until nothing important is unresolved.

## 4. Play it back
Sum up the shared understanding in a few plain-English sentences and ask: "Is that right?"
Wait for a yes. If the user corrects anything, fix your understanding and play it back again.

## 5. Write the plan file
Save the plan to `docs/plans/<NUMBER>-<short-title>.md`, for example `docs/plans/ABC-085-docs-cleanup.md`. The short title is lowercase and hyphenated.

Use exactly this format. The top sections are for the user: plain English, no code, SQL, or file paths.

```
# <NUMBER> — <Title>

- **Change:** <NUMBER>
- **Date:** <YYYY-MM-DD>

## What you'll see change
<What's different in the app, from the user's point of view.>

## What could go wrong / what gets lost
<Data loss, migrations to run by hand, risky changes. Always present. Write "Nothing" if so.>

## Not included
<What this plan deliberately doesn't do.>

## How you'll check it
<Manual steps the user can follow to confirm it works.>

## Check-in
- Type: feat | fix | refactor | perf | style | docs | chore | test
- Branch: <type>/<NUMBER>-<short-title>
- Commit message: <type>(<NUMBER>): <one line>

---

## Technical detail (for Claude)
<Files, layers (Rust vs frontend) and why, functions to reuse, migration contents,
tests to add, the CLAUDE.md feature cycle steps that apply.>
```

Rules for the plan:
- Follow the project's architecture: business logic in Rust, the full feature cycle, lookup tables, numbered migrations.
- If any section would be long, the change is probably too big. Say so and suggest splitting it into separate changes, each with its own number.

## 6. Stop
After saving the plan, open it in the editor by running `code <plan file path>` as its own separate command, never combined with another command. Then tell the user they can press Ctrl+Shift+V for the formatted preview. If the `code` command isn't available, say so and give the plan's path instead.

Tell the user, in plain English:
- The change number and where the plan file is.
- To read it, and to ask for any changes they want. If they ask for changes, update the plan file and stop again.
- That when they're happy with it, they type `/code-change` to start coding.

Do not start coding. Do not create a branch. Wait.
