# PWF-003 — Requirements and a trace table

- **Change:** PWF-003
- **Date:** 2026-10-23

## What you'll see change
Nothing in the app. This changes the workflow tooling only.

- Every plan gets a **Requirements** section: numbered cases (R1, R2, …) written as Given / When / Then in plain English. You sign them off when Claude plays the plan back, together with the rest of the plan, and your "yes" covers them.
- Every plan names a planned test for each requirement. It is an automated test wherever one can exist. A manual check is named too, with a line on why it isn't automated.
- The review record gets a **trace table** with one row per requirement: the requirement, its test, and the result.
  - An automated test shows Pass or Fail.
  - A manual check that Claude can run itself, such as reading a file or running a text search, shows Pass or Fail with "(checked by Claude)".
  - "Manual" is only for a check that needs you at the app.
- "How you'll check it" in every plan becomes your manual test procedure: numbered tests (T1, T2, …), each saying which requirements it covers, the steps, and the expected result.
- When `/code-change` hands off, it lists those tests by number, in full. Next to each test it shows the trace-table results of the requirements that test covers, so you can see which ones Claude has already checked.
- The shared policy file gets a short note on requirements and the trace table. That edit is not in git, so the original is saved on the branch alongside the records, the review looks at the edit as a before/after comparison, and the review record names it.
- The process backlog marks the requirements idea as done, and gains new open items for the parts left out of this change.

## Requirements
- **R1.** Given a change is being planned, when the plan file is saved, then it has a Requirements section with numbered cases (R1, R2, …), each written as Given / When / Then in plain English.
- **R2.** Given the planning interview has finished, when Claude plays the plan back, then the requirements are part of the play-back and nothing is written until you say yes.
- **R3.** Given a saved plan, when its technical detail is read, then every requirement has a planned test, marked automated or manual, and each manual one says why it isn't automated.
- **R4.** Given a finished review record, when it is read, then it has a trace table with one row per requirement showing the requirement, its test, and the result, where a manual check Claude ran itself reads Pass or Fail with "(checked by Claude)", and "Manual" appears only for a check that needs you at the app.
- **R5.** Given a plan whose "How you'll check it" is a numbered list of tests, each naming the requirements it covers, the steps, and the expected result, when `/code-change` hands off, then it lists every one of those tests by number, with the trace-table results of the requirements each covers shown next to it.
- **R6.** Given this change edits the shared policy file, when the review runs, then the original is saved on the branch as `docs/reviews/PWF-003-POLICY-before.md`, the review covers a before/after comparison of that file, and the review record's scope names it.
- **R7.** Given the shared policy file after this change, when its plan and review-record sections are read, then they state the requirements section and the trace table.
- **R8.** Given the process backlog after this change, when it is read, then the requirements item is marked Done (PWF-003) and the left-out pieces appear as new Open items.
- **R9.** Given this change is finished, when the check-in command and the way reviews are run are compared with before, then the check-in command is unchanged, and the way reviews are run is unchanged except for the one new rule about saving a copy of files outside git.

## What could go wrong / what gets lost
Nothing is lost, and there is no migration. The risk is a mistake in the new wording, which would show up the next time a change is planned or coded. The shared policy file is edited outside git, so that edit takes effect for every project that imports it straight away and can't be undone with git. The saved copy of the original on the branch lets it be put back by hand. The backlog file has the same limit.

## Not included
- No check-in gate. `/commit-change` is not changed and does not read the trace table.
- No recording of your manual results after the hand-off, and no handling of a failed manual check (no resume mode, no retest rows, no waivers).
- No change to how reviews are run or presented, except the one new rule about saving a copy of files outside git.
- Old plans and review records are not given requirements, trace tables or numbered tests.
- No change to the app, the schema, or anything in `data/`.

## How you'll check it
Each test names the requirements it covers. Do them in order after `/code-change` hands off.

**T1 — Planning step. Covers R1, R2, R3.**

1. Open `.claude/skills/plan-change/SKILL.md`.
2. Find the play-back step and the plan format block.

Expected: the play-back includes the requirements and waits for your yes. The format has a Requirements section of numbered Given / When / Then cases, a "Planned tests" list in the technical detail with a reason for each manual one, and "How you'll check it" described as numbered tests with "Covers R…", steps and expected result.

**T2 — Coding step and hand-off. Covers R4, R5.**

1. Open `.claude/skills/code-change/SKILL.md`.
2. Find the review-record format and the hand-off step.

Expected: the review record has a "Requirements trace" table (requirement, test, result) with Pass or Fail "(checked by Claude)" for checks Claude ran, and "Manual" only for checks that need you at the app. The hand-off lists every numbered test from the plan with the trace results of its covered requirements next to it.

**T3 — Shared policy and its backup. Covers R6, R7.**

1. Open `docs/reviews/PWF-003-POLICY-before.md` (the original) and `D:/projects/shared-claude-conventions/POLICY.md` (the new one), and compare them.
2. Open the review record and read its Scope line.

Expected: the only differences are short additions on requirements in the plan paragraph and on the trace table in the review-record paragraph, with no gate wording. The Scope line names the policy file and its saved copy.

**T4 — Backlog. Covers R8.**

1. Open `D:/projects/shared-claude-conventions/PROCESS_BACKLOG.md`.

Expected: item 1 reads Done (PWF-003) and says the check-in gate was left out. New Open items exist for the check-in gate, recording manual results at check-in, and failed-check handling.

**T5 — Nothing else moved. Covers R9.**

1. Run `git diff master -- .claude/skills/commit-change/SKILL.md`.
2. Read the diff of `.claude/skills/code-change/SKILL.md` for the review step.

Expected: no changes to the check-in command file. The review step differs only by the one rule about saving a copy of a file outside git.

**T6 — The next real change. Covers R1, R4, R5.**

1. Run `/plan-change` on the next change and `/code-change` after it.

Expected: the plan has a Requirements section and numbered tests, the review record has a trace table, and the hand-off lists the tests with their results.

## Check-in
- Type: chore
- Branch: chore/PWF-003-requirements-and-trace-table
- Commit message: chore(PWF-003): add signed-off requirements to plans and a trace table to review records

---

## Technical detail (for Claude)
No Rust, frontend, migration or app-test changes, so the CLAUDE.md feature cycle does not apply. All edits are workflow files and docs. They are made on the branch, so the master-edit hook allows them, except the two files outside this repo.

**1. `.claude/skills/plan-change/SKILL.md`**

- Step 4 (play it back): the play-back covers the proposed requirements as well as the understanding. Requirements are drafted from the interview before the play-back. A correction to a requirement means playing it back again.
- Step 5 (plan format): add a `## Requirements` section after "What you'll see change". Format: `- **R1.** Given …, when …, then …`. Plain English, no code or file paths, each case checkable on its own. Every plan has at least one requirement, whatever its type.
- Step 5 ("How you'll check it"): the section is the user's manual test procedure, a numbered list `**T1 — <name>. Covers R1, R2.**` followed by numbered steps and an `Expected:` line. Every requirement is covered by at least one test.
- Step 5 (technical detail): add a "Planned tests" list mapping each Rn to its test. Automated where one can exist (Rust, frontend logic). A manual one says why, and whether Claude can run it itself (reading a file, running a command) or it needs the user at the app.
- Update the plan rules to match.

**2. `.claude/skills/code-change/SKILL.md`**

- Step 4: write the planned tests as part of the build. A test that differs from the plan is a deviation.
- Step 7 or 9: record each requirement's result for the trace table. Automated test: run it, record Pass or Fail. A Fail is a finding and goes through the normal findings flow. Manual check Claude can run itself: run it, record Pass or Fail with "(checked by Claude)". Check that needs the user at the app: record "Manual".
- Step 9 review record format: add a `## Requirements trace` section between Findings and Deviations: `| Requirement | Test | Result |` with one row per requirement, the test named as in the plan (or as built, with the difference noted under Deviations).
- Step 10 hand-off: list every numbered test (T1, T2, …) from the plan's "How you'll check it", in full, with the trace results of the requirements each one covers next to it.
- Review (step 6): when a change edits a file outside the repository, save a copy of the original on the branch as `docs/reviews/<change number>-<file name>-before.md` before editing it, commit it with the records, and include a before/after comparison in the review scope. The review record's Scope line names the file and its copy. Written as a general rule, because it is about files outside git.

**3. `D:/projects/shared-claude-conventions/POLICY.md`** (outside git). Before editing, copy the original to `docs/reviews/PWF-003-POLICY-before.md` in this repo, unchanged, and commit it on the branch with the records. Then edit only:

- "Before starting any task": the plan includes a Requirements section (numbered Given / When / Then, signed off at play-back), a planned test for each, and a numbered manual test procedure in "How you'll check it".
- "Peer review" > Record: the review record includes a trace table of requirement, test and result.
Keep the wording short. The skills hold the detail. No gate wording.

**4. `D:/projects/shared-claude-conventions/PROCESS_BACKLOG.md`** (outside git). Item 1: status Done (PWF-003), with a line saying the check-in gate was left out. Add new Open items (numbered 6 onward, dated 2026-10-23, source PWF-003): the check-in gate; recording manual results at check-in; failed-check handling (resume mode, retest rows).

**Not touched:** `.claude/skills/commit-change/SKILL.md`, `.claude/skills/build-changes/SKILL.md`, CLAUDE.md, the hook, old plans and reviews.

**Planned tests.** All are manual, because the changes are instructions in text files and there is no automated test harness for them. None needs the user at the app, so Claude runs each one by reading the file or running a text search and records Pass or Fail "(checked by Claude)". The user's own procedure is "How you'll check it" above.

- R1 — Manual (Claude): read the plan-change format block and confirm the Requirements section and its Given / When / Then pattern.
- R2 — Manual (Claude): read the plan-change play-back step and confirm requirements are in it.
- R3 — Manual (Claude): read the plan-change technical-detail format and confirm the planned-tests list and the manual-reason rule.
- R4 — Manual (Claude): read the code-change review-record format and confirm the trace table and the three result forms.
- R5 — Manual (Claude): read the code-change hand-off step and the plan-change "How you'll check it" format, and confirm the numbered tests and the results shown next to them.
- R6 — Manual (Claude): confirm `docs/reviews/PWF-003-POLICY-before.md` is identical to the original and compare it with the new POLICY.md, and read the review record's Scope line.
- R7 — Manual (Claude): read the POLICY.md paragraphs.
- R8 — Manual (Claude): read the backlog.
- R9 — Manual (Claude): `git diff master -- .claude/skills/commit-change/SKILL.md` shows no changes, and no review-running step is reworded beyond the one rule in the code-change review step for files outside git.

Known debt touched: none.
