# PWF-004 — Review inside the dev step

- **Change:** PWF-004
- **Date:** 2026-10-23

## What you'll see change
Code review becomes part of the coding step, the way it works at your job. A separate reviewer looks at the finished work and rates every problem it finds. Claude then deals with each one itself: fix it, explain why it isn't a problem, or log it for later. It no longer stops after the review to ask you which findings to fix.

Claude stops and asks you in only three cases: a fix would go against the plan you approved, a fix would touch your data (migrations, deletes, import/export and backup, or the data folder), or the re-reviewer doesn't accept Claude's explanation for a Medium or High finding it chose not to fix.

When Claude hands the change over, you get a short plain-English summary of what the reviewer found and what was done about it, next to the numbered test list from PWF-003. The written review record lists every finding.

The shared policy gets the same description of review, plus one new line saying process improvement ideas go in the process backlog. In the backlog, items 6 to 8 are marked Dropped, and items 2 and 3 are marked Done.

## Requirements
- **R1.** Given the checks have passed, when the review step runs, then it's done by a separate reviewer that sees only the diff, the approved plan and the project's standards, not the coding session.
- **R2.** Given the reviewer reports findings, when they're recorded, then each carries the reviewer's own severity, and Claude never changes it. A disagreement is explained in the finding's disposition.
- **R3.** Given findings, when the review ends, then Claude settles each one itself without waiting for you. Medium and High findings can only be fixed or explained. Only Low, Nit and Informational findings may be logged.
- **R4.** Given a fix would go against the approved plan, when Claude reaches it, then it stops and asks you before acting.
- **R5.** Given a fix would edit migrations, delete behaviour, import/export/backup code, or anything in the data folder, when Claude reaches it, then it stops and asks you before acting, even if the fix matches the plan.
- **R6.** Given a Medium or High finding was fixed, or explained instead of fixed, when the settling is done, then a fresh reviewer re-checks the fixes and reads the explanations, once. If it doesn't accept an explanation, Claude stops and asks you. Its other findings are settled the same way, and anything still open goes in the hand-off.
- **R7.** Given the review is finished, when the review record is written, then it lists every finding with the reviewer's severity and its disposition, and notes any re-review.
- **R8.** Given Claude finishes, when it hands off, then it gives a short plain-English summary of what was found and done, plus the full test list with the trace results.
- **R9.** Given the shared policy, when it's read, then the workflow and peer-review sections describe this model (not "nothing is fixed until the user decides") including its three stop cases (a plan conflict, data risk, or the re-reviewer rejecting an explanation), and one line says process improvement ideas go in the process backlog, next to the policy.
- **R10.** Given the process backlog, when it's read, then items 6 to 8 are Dropped with "User owns manual testing; check-in is the sign-off.", and items 2 and 3 are Done (PWF-004).
- **R11.** Given this change, then the check-in and build commands are left as they are.

## What could go wrong / what gets lost
Nothing is lost and there's no migration. The risk is the new process itself: Claude now fixes review findings without your approval, so the three stop rules (R4, R5 and the re-reviewer's rejection in R6) are what protect you. The shared policy and the process backlog live outside this project's git history, so each gets a saved before-copy in this project, and the review compares them against the originals.

## Not included
- The check-in gate on the trace table, recording manual results at check-in, and resuming a failed change (backlog items 6 to 8, now Dropped).
- Any change to the check-in command or the build command, including the build's integration review.
- The full-codebase review.
- Enforcing that before-copies are saved in order (backlog item 9 stays Open).

## How you'll check it
**T1 — The policy describes the new review. Covers R9.**

1. Open the shared policy file and find the Workflow model and Peer review sections.
2. Look for the one new line about the process backlog.

Expected: review is described as done by a separate reviewer, Claude settles findings itself, and you are asked only for plan conflicts, data risk, and an explanation the re-reviewer rejects. The backlog line is there.

**T2 — The backlog is updated. Covers R10.**

1. Open the process backlog.
2. Read the status of items 2, 3, 6, 7 and 8.

Expected: items 2 and 3 say Done (PWF-004). Items 6, 7 and 8 say Dropped with "User owns manual testing; check-in is the sign-off."

**T3 — The coding step runs the new review. Covers R1, R2, R3, R4, R5, R6, R7, R11.**

1. Open the code-change command file and read its review, fixing, record and hand-off steps.
2. Read the review-record format.
3. Check that the commit-change and build-changes command files show no changes in this branch.

Expected: the review is run by a separate reviewer briefed with only the diff, plan and standards. The reviewer's severities are kept. Medium and High cannot be logged. The plan-conflict and data-risk stop rules are there. There is a one-time re-review after a Medium or High finding is fixed or explained, and Claude stops and asks you if the re-reviewer rejects an explanation. The record format lists the reviewer's severity per finding. The other two commands are untouched.

**T4 — The hand-off reads well. Covers R8.**

1. Run the next real change through the coding step, or ask Claude to describe the hand-off wording.
2. Read the hand-off message.

Expected: a short plain-English summary of what was found and what was done, followed by the full test list with the trace results.

## Check-in
- Type: chore
- Branch: chore/PWF-004-review-inside-the-dev-step
- Commit message: chore(PWF-004): make code review part of the coding step, with an independent reviewer and Claude settling the findings

---

## Technical detail (for Claude)

**Files**
- `.claude/skills/code-change/SKILL.md`: rewrite steps 6 and 7 (review, then settle findings), the review-record template in step 9, the hand-off in step 10, the front-matter description, and the opening paragraph. The "STOP. Wait for the user to say which findings to fix" line is removed.
- `D:/projects/shared-claude-conventions/POLICY.md` (outside git): Workflow model step 3 ("The user decides which findings get fixed" becomes the new model), the Peer review "Approval" and "Record" paragraphs (both name the three stop cases: plan conflict, data risk, re-reviewer rejects an explanation), and one new line: process improvement ideas go in `PROCESS_BACKLOG.md`, next to `POLICY.md`.
- `D:/projects/shared-claude-conventions/PROCESS_BACKLOG.md` (outside git): items 6, 7, 8 become `Dropped (User owns manual testing; check-in is the sign-off.)`, items 2 and 3 become `Done (PWF-004)`. Item 1's text mentions items 6 to 8 as left-out pieces; leave that as history.
- Before-copies, saved on the branch before editing the outside-git files and committed with the records: `docs/reviews/PWF-004-POLICY-before.md` and `docs/reviews/PWF-004-PROCESS_BACKLOG-before.md`.
- `CHANGELOG.md` entry, review record, no CLAUDE.md change expected (it only names the commands). `commit-change` and `build-changes` skills unchanged.

**Does R1 use Matt's reviewers? Mostly yes, but not his skill as a whole.**

What was found in `mattpocock-skills:code-review`: it only reports and never fixes, runs a Standards reviewer and a Spec reviewer as parallel sub-agents, and the agent that runs it writes their briefs and assembles the report. It gives no severities and asks for a fixed point and an issue tracker.

Used from his skill, copied into the code-change review step so the project owns the wording:
- The two axes as separate parallel reviewers: Standards (CLAUDE.md, the shared policy, any coding-standards file) and Spec. Here the Spec reviewer checks the approved plan and its numbered requirements.
- The smell baseline (Fowler smells, always a judgement call, repo standards override it).
- Each reviewer starts with a clean context and sees only what it is handed.
- Do not merge or rerank the two axes' findings.

New, because his skill lacks it:
- Every finding carries a severity (`[Informational]`, `[Nit]`, `[Low]`, `[Medium]`, `[High]`) assigned by the reviewer, kept as given in the record (R2).
- A third reviewer for correctness, because the shared policy's review depth rules (a second angle for `feat:`, root cause for `fix:`, unchanged behaviour for `refactor:`) are not covered by his two axes.
- Fixed inputs for all reviewers: the diff command, the plan file, the standards file list, and for an outside-git edit the saved before-copy. The reviewers are told not to edit anything. Claude does not pass its reasoning or conclusions.
- The settle step (fix, explain, log), the three stop cases, and the one-time re-review, none of which his skill has.

Why not run his skill as-is: it would leave the author writing the briefs and assembling the report, and it gives no severities, so R1 and R2 would not be met. Why not the built-in code-review skill: it gives less control over what is checked and does not take the plan and its requirements as the spec.

**Review steps as built**
1. Launch the three reviewers in parallel with the Agent tool as fresh sub-agents (read-only by instruction).
2. Collect their findings with severities untouched.
3. Settle each finding: fix it, explain it, or log it in `KNOWN_ISSUES.md`. Medium and High: fix or explain only.
4. Before each fix, check the two before-fix stop rules (the third stop case is in step 5): plan conflict (quote the plan's exact words) and data risk (migration scripts, delete behaviour, import/export/backup code, anything in `data/`). Either one: STOP and ask.
5. Re-run all checks. If a Medium or High was fixed or explained instead of fixed, launch a fresh reviewer, once, on the fix diff and on the explanations given. If it doesn't accept an explanation, STOP and ask you. Settle its other findings the same way. Anything still open goes in the hand-off.
6. Existing trace-table handling (a Fail is a new finding) stays; it is settled the same way, with the stop rules.

**Review record changes:** the Reviewer line names the reviewers and the re-review. The paragraph saying the author assigned severities goes. The Disposition line adds a note where Claude disagreed with a severity. A "Re-review" subsection is added when one ran.

**Hand-off changes:** a short plain-English summary comes first (what was found by severity, what was fixed, explained and logged, any stop that happened and your answer), then the test list with trace results as in PWF-003.

**Planned tests**
- R1 — Manual (checked by Claude): read the code-change review step for a separate reviewer briefed with only the diff, plan and standards. Not automated: the workflow is written instructions with no code.
- R2 — Manual (checked by Claude): read the review step and the record format for reviewer-assigned severity kept as given, and the disagreement rule.
- R3 — Manual (checked by Claude): read the settle step for fix, explain or log, no stop for approval, and the Medium and High limit.
- R4 — Manual (checked by Claude): read the settle step for the plan-conflict stop with the plan's exact words quoted.
- R5 — Manual (checked by Claude): read the settle step for the data-risk stop and its list of areas.
- R6 — Manual (checked by Claude): read the settle step for the one-time re-review after a Medium or High finding is fixed or explained, for the re-reviewer being given the explanations as well as the fix diff, for the stop when it rejects an explanation, and for open items going to the hand-off.
- R7 — Manual (checked by Claude): read the record template for per-finding severity, disposition and the re-review note.
- R8 — Manual (checked by Claude): read the hand-off step for the plain-English summary followed by the test list with trace results. The first real use of it is T4, which needs you.
- R9 — Manual (checked by Claude): read the Workflow model, Peer review (including the three stop cases) and new backlog line in `POLICY.md`, and compare against `docs/reviews/PWF-004-POLICY-before.md`.
- R10 — Manual (checked by Claude): read statuses in `PROCESS_BACKLOG.md` and compare against `docs/reviews/PWF-004-PROCESS_BACKLOG-before.md`.
- R11 — Manual (checked by Claude): `git diff master` shows no changes to the commit-change and build-changes skills.
