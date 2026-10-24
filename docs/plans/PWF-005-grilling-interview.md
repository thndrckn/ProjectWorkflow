# PWF-005 — Use the grilling method properly in the planning interview

- **Change:** PWF-005
- **Date:** 2026-10-23

## What you'll see change
When you start `/plan-change`, Claude follows Matt Pocock's grilling method, which is now written out in the plan-change interview step itself (credited to his grilling skill) instead of being loaded from his skill. It works out every decision that can be asked right now (the "frontier"), then asks them one at a time in the question box, recommended answer first. After each answer it recomputes what is left to ask. It asks the question that unblocks the most other decisions first, and risky questions (data loss, migrations, import/export, deletes) as soon as they come up. The interview ends only when nothing is left to ask, then goes to the existing play-back, where your yes is the confirmation. Facts are looked up, never asked. The old "keep going until nothing important is unresolved" rule is gone, replaced by "stop when nothing is left to ask". The app itself does not change.

## Requirements
- **R1.** Given I read the plan-change interview step, when I look for the grilling method, then it is written out in that step (the decision tree, the frontier, recommended answers worded so "yes" accepts them, facts looked up, done when nothing is left to ask), it credits Matt Pocock's grilling skill, and it does not load that skill.
- **R2.** Given decisions are open, when Claude asks, then it asks one per question box, recommended answer first and labelled "(Recommended)", and recomputes what is left to ask after each answer.
- **R3.** Given several questions can be asked at once, when Claude chooses what to ask next, then it picks the one that unblocks the most others, with risky ones early.
- **R4.** Given a question needs a fact from the code or environment, when Claude needs it, then it looks it up (using a sub-agent only for broad searches) and never asks me.
- **R5.** Given nothing is left to ask, when the interview ends, then Claude goes to the play-back, my yes there is the shared-understanding confirmation, and the old "keep going until nothing important is unresolved" rule no longer exists.
- **R6.** Given the change is done, when I compare the rest of plan-change, then every other step and rule is unchanged except the removed rule in R5.

## What could go wrong / what gets lost
Nothing. Only the wording of one workflow instruction file changes. No app code, database, or user data is touched.

## Not included
- No change to the shared policy file or to the other workflow commands.
- No separate "shared understanding" confirmation step; the play-back stays the only confirmation.
- No app changes.
- No live loading of Matt's grilling skill; the method is copied in so the project owns the wording, as PWF-004 did for his reviewers.

## How you'll check it
**T1 — Read the new wording. Covers R1, R2, R3, R4, R5, R6.**

1. Open the plan-change skill file and read the interview step, including the credit line.
2. Compare it against the plan-change skill file on master (the diff).

Expected: the interview step spells out the grilling method itself with a credit to Matt Pocock's grilling skill and no instruction to load that skill, ask the frontier one question at a time in the question box (recommended first), order by most-unblocking with risky early, look facts up without asking, and end when nothing is left to ask. The "keep going until nothing important is unresolved" line is gone. The diff shows no other step changed.

**T2 — Run a real interview. Covers R1, R2, R3, R4, R5.**

1. After the change is checked in, start `/plan-change` for your next real change.
2. Answer the questions.

Expected: Claude follows the grilling method without loading a skill; questions come one per box with the recommended answer first; no question is about something Claude could look up; after the last question Claude plays back for your yes.

## Check-in
- Type: chore
- Branch: chore/PWF-005-grilling-interview
- Commit message: chore(PWF-005): copy the grilling method into plan-change and ask its frontier one question at a time

---

## Technical detail (for Claude)
Only `.claude/skills/plan-change/SKILL.md` changes, in section 3 "Interview the user":
- Replace "Use the grilling skill, with these rules:" with the grilling method copied into the step so the project owns the wording, with a credit line ("Method adapted from Matt Pocock's grilling skill"). No instruction to load the skill. Copied from his skill: the design tree (every decision branches into the decisions that hang off it); the frontier (every decision whose prerequisites are settled); a recommended answer on every question, worded so "yes" accepts it; recompute the frontier after each answer; facts are found by Claude, decisions are the user's; done when the frontier is empty. Not copied: his numbered ❓/➡️ round format and ask-the-whole-frontier-at-once pacing, replaced by the pacing below.
- Pacing: where his method asks the whole frontier in one round, this step asks one question at a time in the question box (AskUserQuestion), recommended answer first labelled "(Recommended)", frontier recomputed after each answer. The question box replaces his round format.
- Order: the question that unblocks the most other decisions goes first; risky ones (schema, migrations, data loss, import/export, deletes) as soon as they are on the frontier. Keep the existing "ask about anything risky as its own question" rule.
- Facts: look up yourself; sub-agent only for broad sweeps; never ask the user.
- Keep "Only ask about real decisions…" and "Wait for the user's reply…".
- Delete "Keep going until nothing important is unresolved." Replace with: stop only when the frontier is empty, then go to the play-back (step 4), whose yes is the shared-understanding confirmation.
- Keep the intro rule that if the request answers everything, still ask "Is there anything you want to add or change?".
- Check the frontmatter `description` still reads true ("one question at a time"); no other section edited.
- No Rust, frontend, migration, or CLAUDE.md feature-cycle steps apply. CHANGELOG entry per the workflow at check-in.

**Planned tests**
- R1 — Manual: the wording is a prompt instruction, so no automated test can exist. Claude reads the file and searches it for the credit line and for any instruction to load the skill (T1); the user confirms live (T2).
- R2 — Manual: same reason. Claude reads the file (T1); the user confirms live (T2).
- R3 — Manual: same reason. Claude reads the file (T1); the user confirms live (T2).
- R4 — Manual: same reason. Claude reads the file (T1); the user confirms live (T2).
- R5 — Manual: same reason. Claude reads the file and confirms the old rule is gone with a search (T1); the user confirms live (T2).
- R6 — Manual: Claude runs a diff against master and confirms only section 3 changed (T1).
