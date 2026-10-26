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
- Read CLAUDE.md and the shared POLICY.md if they aren't already loaded. Never edit anything in the shared conventions folder (see CLAUDE.md); if the change needs it edited, the plan carries the exact wording (step 6).
- Read the code the idea touches. Look things up yourself instead of asking the user questions the code can answer.
- Run `git status`. If there are uncommitted edits (other than plan files, which other planning chats may have waiting), list them and ask the user whether they are part of this change. If they are, the plan must say so and describe them, so `/code-change` carries them onto the branch.
- If the request is a bug report, find the actual root cause first using the diagnosing-bugs skill, then plan the fix.

## 2. Assign the change number
- The change prefix is set in the Workflow section of CLAUDE.md. If CLAUDE.md doesn't set one, ask the user and STOP until they answer.
- Several planning chats can run at once, so a number is claimed the moment it is assigned. Find the highest existing number for that prefix (for example `ABC-084`) in `CHANGELOG.md`, in the file names in `docs/plans/`, and in the names of all local branches (`git branch --list`, which includes the branches of changes being coded in worktrees). The new change gets the next number, written with three digits (`ABC-085`).
- If no numbers exist yet in any of those places, do not guess. Ask the user which number to use and STOP until they answer.
- Claim it at once: save a placeholder `docs/plans/<NUMBER>-claimed-<six random letters>.md` containing one line saying the number is claimed by a `/plan-change` that is still running. Then list the files in `docs/plans/` that start with that number. If another claim or plan for the same number now exists, the file whose name sorts first keeps the number; the others delete their placeholder and repeat this step with the next number.
- Tell the user the number in one line, for example: "This change is ABC-085.", and under it show the command to name the chat, for example: "To name this chat, type: `/rename ABC-085`". Only the user can run `/rename`, so show it, never run it. If the number the user was told changes later (a claim clash that moves it, or any other reason), say the new number the same way and show `/rename` again with the final number.
- A number is never reused. If the planning is abandoned, the placeholder stays and the number is simply skipped. The user can delete it by hand.
- **Migration numbers:** if CLAUDE.md has a "Migrations" line, then as soon as the interview shows the change needs a migration, claim its number the same way: the next free number after the highest in the migrations folder CLAUDE.md names, in every plan in `docs/plans/` that names a migration, and in every local branch's changes to that folder (`git diff --name-only <default branch>...<branch> -- <folder>`). Write the claim into the placeholder file, and put it in the plan. If CLAUDE.md has no "Migrations" line, skip this, and tell the user the migration steps were skipped because CLAUDE.md has no such line.

## 3. Put the backlog to the user
Read `docs/BACKLOG.md`. If it is missing or has no entries, say nothing and go to step 4. Otherwise, before the interview, put every entry to the user, new and queued alike, one at a time, in the question box (AskUserQuestion), one question per box, in the order they appear in the file. Asking every time is deliberate: it keeps the backlog small. Show the entry's title, where it was found, its severity and what is wrong, and offer exactly four choices. Put the one you recommend first in the options, labelled "(Recommended)", and say in the question why you recommend it. Recommend **Include it in this change** only when the item touches the same files or the same area as the change being planned (compare the item's files with the files the request will touch); otherwise recommend **Keep it queued**.
- **Plan it now.** Planning switches to that item: it becomes this change (the number from step 2 stays with it), and your interview is about the item, not the original request. Ask no more backlog questions; the remaining items wait for the next `/plan-change`. Tell the user plainly that their original request needs its own `/plan-change`. If the original request is not empty (it is empty if it is missing or only whitespace), keep it exactly as the user typed it, word for word, taken from the raw command arguments and never from your own summary of them, and write it into the plan under "Original request (set aside)". The plan names the item in a "Backlog items fixed" line.
- **Include it in this change.** The item joins this plan's scope next to the original request, which is not set aside. The interview covers it too, and the plan gives it its own requirement and its own planned test. The plan names it under "Backlog items fixed", and `/code-change` removes it from the backlog. Go to the next item: unlike "Plan it now", the remaining backlog questions are still asked.
- **Keep it queued.** Nothing changes. Go to the next item.
- **Accept it.** Ask for the reason in a follow-up question box. Nothing is written now (the default branch is protected): the plan lists the item and the reason under "Backlog items accepted", and `/code-change` adds it to `docs/DECISIONS.md` and removes it from the backlog.

Keep a list of every question asked and the answer given, here and in the interview, for the play-back and the plan file.

## 4. Interview the user
Grill the user relentlessly until you reach a shared understanding. Method adapted from Matt Pocock's grilling skill.

Map the change as a design tree: every decision branches into the decisions that hang off it. The **frontier** is every decision whose prerequisites are already settled, the questions you can ask now without guessing at answers you haven't heard yet. A question whose answer depends on another open question is not on the frontier yet.

Work the frontier with these rules:
- Ask exactly ONE question per message, never a whole round at once. Pick the question that unblocks the most other decisions. Risky ones go as soon as they are on the frontier.
- Ask every question using the question box (the AskUserQuestion tool): one question per box, never several questions in one box. Put the recommended answer first in the options and label it "(Recommended)". Word each question so that choosing the recommended answer is a plain "yes".
- Wait for the user's reply. Each answer settles decisions and may unblock others, so recompute the frontier before asking the next question.
- Only ask about real decisions: what it should do, edge cases, trade-offs. Finding facts is your job, never the user's: look them up yourself, and use a sub-agent only for a broad search. Never ask about facts you can look up.
- Ask about anything risky as its own question: schema changes, migrations, data that could be lost or changed, anything touching import/export or deletes.
- Stop only when the frontier is empty: every branch visited, nothing left silently assumed. Then go to the play-back (step 5). The user's yes there is the confirmation of shared understanding.

## 5. Play it back
Draft the requirements from the interview. Every plan has at least one requirement, whatever its type. Each is a numbered Given / When / Then case (R1, R2, …) in plain English that can be checked on its own.
Every play-back uses the same fixed format, so it looks the same in every chat. Write it as a normal message, with these parts in this order:
1. **Summary:** a few plain sentences.
2. **Requirements:** R1, R2, … one per line.
3. **Decisions so far:** a table of every question asked so far (backlog and interview) with the user's answer.

End the message with "Is that right?" as plain text. Never put the play-back in a question box, because the box cannot hold a long play-back and gives no room to write changes (the interview questions in step 4 still use it). The user answers yes, or writes their changes, in the normal chat input.
Wait for a yes. A yes covers the requirements too. A reply that adds any change, even "yes, but …", is a change, not a yes. If the user writes changes, including to a requirement, fix your understanding and play it back again in the same format, saying at the top what changed. If the reply is a question or unclear, answer it or ask what they mean, then end with "Is that right?" again.

## 6. Write the plan file
Save the plan to `docs/plans/<NUMBER>-<short-title>.md`, for example `docs/plans/ABC-085-docs-cleanup.md`. The short title is lowercase and hyphenated. Then delete this change's own placeholder file from step 2.

Use exactly this format. The top sections are for the user: plain English, no code, SQL, or file paths.

```
# <NUMBER> — <Title>

- **Change:** <NUMBER>
- **Date:** <YYYY-MM-DD>

## What you'll see change
<What's different in the app, from the user's point of view.>

## Requirements
- **R1.** Given <starting situation>, when <something happens>, then <what must be true>.
- **R2.** Given …, when …, then ….

## Decisions from the interview
<A table of every question asked (backlog questions and interview questions, including the play-back) and the user's answer, so a reviewer can check any "the user decided" claim against it.>

## Backlog items fixed
<Only when the change fixes backlog items (chosen "Plan it now" or "Include it in this change"): the title of each. /code-change removes them from docs/BACKLOG.md. Leave this section out otherwise.>

## Backlog items accepted
<Only when the user accepted items: each title with the user's reason. /code-change adds them to docs/DECISIONS.md and removes them from the backlog. Leave this section out otherwise.>

## Original request (set aside)
<Only when "Plan it now" set aside a non-empty original request: that request, word for word, exactly as the user typed it, in a fenced block whose fence is longer than any run of backticks inside the request (or use a `~~~` fence, longer than any run of tildes inside it), so the text is never altered, trimmed or rewrapped. Leave this section out otherwise.>

## What could go wrong / what gets lost
<Data loss, migrations to run by hand, risky changes. Always present. Write "Nothing" if so.>

## Not included
<What this plan deliberately doesn't do.>

## How you'll check it
<The user's manual test procedure: a numbered list of tests. Every requirement is covered by at least one test.>

**T1 — <name>. Covers R1, R2.**

1. <Step the user does.>
2. <Next step.>

Expected: <what the user should see.>

## Check-in
- Type: feat | fix | refactor | perf | style | docs | chore | test
- Branch: <type>/<NUMBER>-<short-title>
- Commit message: <type>(<NUMBER>): <one line>

## Policy edits for you to make by hand
<Only when the change needs a file in the shared conventions folder edited (CLAUDE.md's "Shared conventions folder" line names it): for each edit, the file, the exact old text (it must appear exactly once in the file; check it) and the exact new text, each in a fenced block whose fence is longer than any run of backticks or tildes inside it. Claude never edits that folder, so nothing about the wording is left to /code-change. Leave this section out otherwise.>

---

## Technical detail (for Claude)
<Files, layers and why, functions to reuse, migration contents,
tests to add, the CLAUDE.md feature cycle steps that apply.>

**Planned tests**
- R1 — <Automated | Manual>: <the test>. <For a manual one: why it isn't automated, and whether Claude can run it itself (read a file, run a command) or it needs the user at the app.>
```

Rules for the plan:
- Every requirement has a planned test in "Planned tests". A test is automated wherever one can exist (unit or logic tests). A manual check is named and says why.
- Requirements are plain English, with no code or file paths, like the other top sections.
- Follow the architecture and conventions CLAUDE.md describes.
- Tests never use a made-up change or a test-only decision; a check that needs a live run uses the next real change.
- Workflow and tooling changes are type chore.
- The shared conventions folder is edited by the user by hand only, never by Claude. When the change needs it edited, the plan gives the exact old and new text in its "Policy edits for you to make by hand" section. A plan with no such edit leaves the section out.
- Shared skills and hooks never contain anything project-specific (numbers, file names, app features); project facts come from CLAUDE.md. The shared workflow's own paths (plans, reviews, changelog, backlog, decisions) are not project-specific.
- If any section would be long, the change is probably too big. Say so and suggest splitting it into separate changes, each with its own number.

## 7. Stop
After saving the plan, open it in the editor by running `code <plan file path>` as its own separate command, never combined with another command. Then tell the user they can press Ctrl+Shift+V for the formatted preview. If the `code` command isn't available, say so and give the plan's path instead.

Tell the user, in plain English:
- The change number and where the plan file is.
- To read it, and to ask for any changes they want. If they ask for changes, update the plan file and stop again.
- That when they're happy with it, they type `/code-change` to start coding.

Do not start coding. Do not create a branch or a worktree. Wait.
