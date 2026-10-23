# Review: PWF-004 — Review inside the dev step

- **Change:** PWF-004
- **Plan:** docs/plans/PWF-004-review-inside-the-dev-step.md (approved in commit ebb2c61)
- **Branch:** chore/PWF-004-review-inside-the-dev-step
- **Reviewer:** three fresh read-only sub-agents run in parallel (Standards, Spec, Correctness), plus one fresh re-reviewer. None saw the coding session; each was given only the diff command, the plan, the standards files and the saved before-copies.
- **Scope:** diff of chore/PWF-004-review-inside-the-dev-step against master — 4 files (the code-change skill, the plan, and the saved originals `docs/reviews/PWF-004-POLICY-before.md` and `docs/reviews/PWF-004-PROCESS_BACKLOG-before.md`), about 440 lines before these records. Also reviewed: the before/after comparison of the shared `D:/projects/shared-claude-conventions/POLICY.md` and `PROCESS_BACKLOG.md` (both outside git) against their saved copies.

The reviewers assigned every severity below. Claude did not change any of them.

## Findings

### Round 1: Standards reviewer
- **[Low]** The three stop cases and settle rules are written out in several places (skill step 7 and description, policy workflow step 3, policy peer review) — `.claude/skills/code-change/SKILL.md`, shared `POLICY.md`
  **Disposition:** explained. The policy states the rule for every project; the skill holds the step-by-step procedure, which the policy says lives in the project's skills. Re-reviewer accepted.
- **[Low]** The Correctness reviewer's depth rule is a paraphrase of the policy's review-depth paragraph — `SKILL.md`, shared `POLICY.md`
  **Disposition:** explained. The policy's Depth paragraph is unchanged and the paraphrase matches it. Re-reviewer accepted.
- **[Nit]** The skill tells the Standards reviewer to look for `CODING_STANDARDS.md` or `CONTRIBUTING.md`, which this project doesn't have — `SKILL.md`
  **Disposition:** explained. The skill is generic and only uses them if they exist. Re-reviewer accepted.
- **[Nit]** The three stop cases weren't listed together in one place — `SKILL.md`, shared `POLICY.md`
  **Disposition:** fixed. Step 7 now opens with all three listed together.
- **[Nit]** The step 7 heading said "then check again" but the re-review comes after the checks — `SKILL.md`
  **Disposition:** fixed. Heading is now "Settle the findings, check again, re-review".
- **[Informational]** commit-change and build-changes are unchanged, as planned — `.claude/skills`
  **Disposition:** explained (observation, no action).
- **[Informational]** The policy adds "The plan wins over any finding", consistent with the project's memory rule — shared `POLICY.md`
  **Disposition:** explained (observation, no action).
- **[Informational]** No CHANGELOG entry in the diff — `CHANGELOG.md`
  **Disposition:** explained. The entry is written at the records step, after the review; it is now in this branch.

### Round 1: Correctness reviewer
- **[Medium]** A trace-table Fail was handled after the check re-run and the re-review, so its fix got neither — `SKILL.md`
  **Disposition:** fixed. Step 7 now works out the trace results first, then re-runs the checks (and any failed test), then re-reviews. A fixed Fail counts for the re-review.
- **[Low]** The re-review trigger wording ("fixed or explained instead of fixed") was garbled — `SKILL.md`, shared `POLICY.md`
  **Disposition:** fixed. It now reads "any Medium or High finding was raised (each is fixed or explained), or a Fail was fixed".
- **[Low]** A Medium or High finding raised by the re-review had no defined path — `SKILL.md`
  **Disposition:** fixed. It's settled the same way with the same stop cases, the checks run again, and the hand-off says it wasn't re-checked by a reviewer.
- **[Low]** Stop case 2 was vague ("delete behaviour", "anything in data/") and applied to any severity — `SKILL.md`, shared `POLICY.md`
  **Disposition:** explained. I first narrowed "delete behaviour" to "code that deletes user data". The re-reviewer pointed out that changes the plan's wording, so it was put back to the plan's exact words in both files. The any-severity part is what the user chose at interview. The vagueness is the plan's wording and is left as approved.
- **[Low]** No place in the record for the user's answer at a stop — `SKILL.md`
  **Disposition:** fixed. The record template's disposition has a line for the question and the user's answer.
- **[Nit]** Step 6's list of reviewer inputs was inconsistent about the plan file — `SKILL.md`
  **Disposition:** fixed. Each reviewer gets only the inputs for its own job.
- **[Nit]** The Standards reviewer is told to skip what checks enforce but isn't given the check list — `SKILL.md`
  **Disposition:** explained. CLAUDE.md holds the list and is one of its inputs. Re-reviewer accepted.
- **[Informational]** Step references and front matter were updated consistently — `SKILL.md`
  **Disposition:** explained (observation, no action).

### Round 1: Spec reviewer
- **[Medium]** A trace Fail was rated `[High]` by the author, against R2 (the reviewer's severity is never changed) — `SKILL.md`
  **Disposition:** fixed. A Fail is now stated to be not a reviewer finding and to carry no severity; it is only treated like a High for settling (fix only) and for the re-review trigger. The policy says the same.
- **[Low]** "If a Medium or High can't be fixed without hitting a stop case, STOP" looks like a fourth stop case — `SKILL.md`
  **Disposition:** explained. It restates cases 1 and 2. Re-reviewer accepted.
- **[Low]** The skill adds `CODING_STANDARDS.md` and `CONTRIBUTING.md` to the standards files — `SKILL.md`
  **Disposition:** explained. Same as the Nit above. Re-reviewer accepted.
- **[Informational]** No CHANGELOG entry or review record in the diff — `CHANGELOG.md`, `docs/reviews/`
  **Disposition:** explained. Both are written at the records step, after the review.
- **[Informational]** The re-review is a single pass, as planned — `SKILL.md`
  **Disposition:** explained (observation, no action).

## Re-review
Triggered because two Medium findings were raised and fixed. The re-reviewer, given the plan, the standards, the fix diff and my explanations, verified every fix and accepted all six explanations. It raised two new findings:

- **[Low]** Stop case 2's wording ("code that deletes user data") differs from the plan's "delete behaviour" — `SKILL.md`, shared `POLICY.md`
  **Disposition:** fixed. Restored the plan's exact words in both files (commit 09117a1). All checks were run again afterwards. This one fix was not re-checked by a reviewer, since there is no second re-review.
- **[Low]** The re-review trigger and the "whatever the finding's severity" wording are broader than R6 and R5 — `SKILL.md`, shared `POLICY.md`
  **Disposition:** explained. Every Medium or High is either fixed or explained, so "any Medium or High raised" is the same set as R6's "fixed, or explained instead of fixed". "Whatever the severity" is what the user chose at the interview ("any fix that edits those areas"). Both are recorded under Deviations.

No stop case came up, so the user was not asked anything during the review.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the code-change review step: three fresh sub-agents, read-only, given only the diff, plan, standards and before-copies | Pass (checked by Claude) |
| R2 | Read step 6 and step 7: reviewer severities kept as given, disagreement noted in the disposition; the record template matches | Pass (checked by Claude) |
| R3 | Read step 7: Claude settles each finding without waiting; Medium and High can only be fixed or explained | Pass (checked by Claude) |
| R4 | Read step 7: stop case 1 quotes the plan's exact words and asks before acting | Pass (checked by Claude) |
| R5 | Read step 7: stop case 2 lists migrations, delete behaviour, import/export/backup code and `data/` | Pass (checked by Claude) |
| R6 | Read step 7: one re-review given the fix diff and explanations, stop case 3 if an explanation is rejected, unchecked fixes named in the hand-off | Pass (checked by Claude) |
| R7 | Read the record template: severity per finding, disposition, a Re-review section; this record follows it | Pass (checked by Claude) |
| R8 | Read step 10: review summary first, then the full test list with trace results. The first real use is T4, which needs the user | Pass (checked by Claude) |
| R9 | Read the shared `POLICY.md` workflow step 3, peer review, the three stop cases and the backlog line, compared with `docs/reviews/PWF-004-POLICY-before.md` | Pass (checked by Claude) |
| R10 | Read the shared `PROCESS_BACKLOG.md`: items 2 and 3 Done (PWF-004), items 6 to 8 Dropped with the reason, compared with the saved copy | Pass (checked by Claude) |
| R11 | `git diff master` shows no changes to the commit-change and build-changes skills | Pass (checked by Claude) |

## Deviations from the plan
- The plan says nothing about a failed requirement test in the new review flow. The skill and policy now say a Fail carries no severity, is fixed (never explained away or logged), and counts toward the re-review trigger. This closes a gap the Correctness and Spec reviewers found.
- The re-review trigger is worded "any Medium or High finding was raised (each is fixed or explained), or a Fail was fixed". This is the same set as R6's wording, plus fixed Fails.
- Stop case 2 says "whatever the finding's severity". R5 doesn't say it, but it follows from the user's interview answer.
- The skill also says, for the re-review's own findings, that the checks run again and the hand-off notes they were not re-checked by a reviewer. R6 says only "anything still open goes in the hand-off".
- The review of this change was run with the new step 6 as committed in 9a42863, not with the old skill text. The skill was rewritten first, then used.
- The last fix (restoring the plan's wording, 09117a1) came after the single re-review and was not re-checked by a reviewer.

## Summary
The coding step now runs an independent three-reviewer review, Claude settles every finding itself, and it stops only for a plan conflict, data risk, or an explanation the re-reviewer rejects. The shared policy and the backlog match. The first round raised 2 Medium, 8 Low, 5 Nit and 6 Informational findings: all Mediums were fixed, and the Lows and Nits were fixed or explained. The re-reviewer accepted every explanation and added two Lows, now settled. Nothing was logged in KNOWN_ISSUES.md. All checks pass. The plan file is unchanged since its approval.
