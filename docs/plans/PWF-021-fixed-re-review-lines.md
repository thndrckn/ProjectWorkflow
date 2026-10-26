# PWF-021 — Fixed re-review lines

- **Change:** PWF-021
- **Date:** 2026-10-25

## What you'll see change
Nothing in the app. In the review workflow, every outcome a re-reviewer checks gets one fixed line in the review record, so the master lock can check "every explanation, logged item and fix was accepted" exactly instead of searching the prose for words like "accepted" or "clean". Each finding gets a line such as "Re-review (round 1): accepted" under it, and each round ends with "Round 1 clean: yes" or "Round 1 clean: no". New records carry a new header marker, "Review format: accountability 2", and are checked by the new rules; old records keep being read as they are today. A new CLAUDE.md line, "Review format 2 required from: PWF-024", makes the new format mandatory from PWF-024 (PWF-022 and PWF-023 are already in flight on the old template): the lock refuses an old-format record at or above that number. The temporary "keyword reading" note in the design decisions file is removed. The shared policy gets one sentence about the new lines, which you add by hand when `/code-change` stops for it.

## Requirements
- **R1.** Given a new-marker record where every finding's latest re-review line is "accepted" and the last round says "Round N clean: yes", when the gate runs, then it passes.
- **R2.** Given a new-marker record with a finding that has no re-review line, or whose latest line is "rejected", when the gate runs, then it fails and names that finding.
- **R3.** Given a finding rejected in one round and accepted in a later round, when the gate runs, then the rejection no longer counts against it.
- **R4.** Given a round that says "clean: yes" while one of its verdicts is a rejection or it raised a new finding, when the gate runs, then it fails.
- **R5.** Given a last round that says "clean: no" or has no round line, when the gate runs, then it fails unless the round carries "Settled by the user:".
- **R6.** Given a fixed failed requirement with no "Re-review (round N): R… accepted" line, when the gate runs, then it fails.
- **R7.** Given an old-marker record with no fixed lines, when the gate runs, then it is read exactly as today and its result doesn't change.
- **R8.** Given a record with fixed re-review lines but the old marker, when the gate runs, then the new rules apply.
- **R9.** Given the updated record template, re-reviewer brief and check-in gate wording, then all three describe the same lines the checker reads, and the shared policy has the one-sentence addition.
- **R10.** Given the design decisions file, then the temporary keyword-reading entry is gone.
- **R11.** Given a new-format record with no findings at all and no fixed failed requirement, when the gate runs, then it passes with no re-review rounds, as today.
- **R12.** Given a change numbered at or above the number in CLAUDE.md's "Review format 2 required from" line, when its record is in the old format (the old marker, or no marker at all), then the gate and the lock refuse it; below that number nothing changes, and with no such line in CLAUDE.md no format is required.
- **R13.** Given a check-in that raises the number in that line or removes the line, when it reaches the default branch, then the lock refuses it; lowering the number, or adding the line (as this change does), is allowed.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: guard allows an absolute cross-worktree path but blocks the relative one | Keep it queued |
| Where do the verdict lines live? | Under each finding (fixed-Fail verdicts as lines in the round that checked them) |
| Add a fixed "Round N clean: yes/no" line? | Yes |
| Which records get the new rules? | New marker ("accountability 2"); old records exempt |
| Edit the shared POLICY.md? | Yes, a short sentence, with a before-copy saved first |
| Play-back: is it right? | Yes, with one addition: a no-findings record passes with no rounds, with a test (R11) |
| Revised play-back: add a CLAUDE.md line requiring the new format from PWF-022 (R12, R13 added, "not included" item removed); you edit POLICY.md by hand with the exact sentence below | Yes |
| Change the required-from number to PWF-024, because PWF-022 and PWF-023 are already in flight on the old template and their records will be old-format | Done: PWF-024 everywhere in this plan |

## What could go wrong / what gets lost
No app data is touched. The risk is in the lock's checker: a bug could refuse a correct check-in or let a bad record through. The lock's test script covers each requirement, and the checker's refusal behaviour stays fail-closed. Until PWF-024, a change can still write the old marker and be read by keyword; from PWF-024 on it is refused. The new CLAUDE.md line is a lock setting, so the lock must not refuse this change's own check-in for adding it, and must refuse a later check-in that raises or removes it. The shared POLICY.md is outside this repository: `/code-change` saves a before-copy in the review records folder, as PWF-015 did, then stops so you can make the edit by hand (it never edits POLICY.md itself).

The exact sentence to add at the end of the "Record" paragraph of POLICY.md:

> In a record marked `Review format: accountability 2`, every finding carries a line `**Re-review (round N):** accepted` or `**Re-review (round N):** rejected` for each round that checked it, and the latest one counts; a fixed failed requirement gets `**Re-review (round N):** R<id> accepted` in the round that checked it; and every round ends with `**Round N clean:** yes` or `**Round N clean:** no`. The check-in gate reads these lines exactly, and from the change number named by "Review format 2 required from" in the project's instructions on, a record without this marker is refused.

## Not included
- Changing old review records, or re-checking merged changes against the new rules.
- Editing POLICY.md: `/code-change` does not do it; you do.
- Any change to the findings format (severity, caused label, disposition, correction lines) or to "Settled by the user:".
- The backlog entry about the guard and relative paths (kept queued).

## How you'll check it

**T1 — Checker tests. Covers R1–R8, R11–R13.**

1. Run the lock's test script (`bash .githooks/test-master-lock.sh`).

Expected: all cases pass, including new cases for each requirement above.

**T2 — Wording agrees. Covers R9, R10.**

1. Read the record template and re-reviewer brief in `/code-change`, the gate rules in `/commit-change`, and the sentence added to the shared policy.
2. Open the design decisions file.

3. When `/code-change` stops for it, add the sentence from this plan to POLICY.md, then say so.

Expected: all describe the same lines (`**Re-review (round N):** accepted | rejected` and `**Round N clean:** yes | no`), the policy sentence matches the plan word for word, and the keyword-reading entry is gone.

**T3 — Full checks. Covers all.**

1. Run the checks listed in CLAUDE.md.

Expected: all pass.

## Check-in
- Type: chore
- Branch: chore/PWF-021-fixed-re-review-lines
- Commit message: chore(PWF-021): fixed re-review lines the master lock can read exactly

---

## Technical detail (for Claude)
Files:
- `.githooks/master-lock-check.mjs`: in `evaluateRecord`, detect the new marker (`Review format: accountability 2`) or any fixed line (`**Re-review (round N):**` under a finding, a `Round N clean:` line); use the new rules for those, keep the current keyword path (`hasRejection`, `saysNotClean`, `statesCleanRound`, `isCleanRound`, the verdict-word regex) only for old-marker records. Update the header comment (it currently states the keyword limit).
- New rules: every finding block's latest `Re-review (round N)` line must say accepted (a finding with "Settled by the user:" is exempt); N must be an existing round; each round needs exactly one `Round N clean: yes|no` line unless it carries "Settled by the user:"; "clean: yes" is refused when a verdict in that round is a rejection or a finding in the Findings section is marked as raised in that round; the last round must be clean: yes or settled; fixed-Fail trace rows need a `Re-review (round N): R… accepted` line in a round. Keep the existing "no findings and no fixed Fail → no rounds needed" path (R11), and the three-round/extra-round rule.
- `.githooks/test-master-lock.sh`: new record variants and attempts for R1–R8 and R11 (including the no-findings new-marker case with no Re-review section, passing). Keep the old variants for R7.
- `.claude/skills/code-change/SKILL.md`: record template header marker, per-finding line, round line, re-reviewer brief (it must output verdicts in that form), continue-mode note about appending lines (never rewriting earlier ones).
- `.claude/skills/commit-change/SKILL.md`: gate rules 4 and 5 worded for the fixed lines.
- `D:\projects\shared-claude-conventions\POLICY.md`: the sentence quoted in "What could go wrong / what gets lost", added at the end of the Record paragraph by the user by hand. `/code-change` saves the before-copy at `docs/reviews/PWF-021-POLICY.md-before.md` (the lock ignores `-before.md` files), STOPs and asks the user to make the edit, then checks the sentence is present word for word and notes in the review record that the user edited the file.
- `CLAUDE.md`: new line "- **Review format 2 required from:** `PWF-024`" beside "Master lock starts at". In the checker, `readConfig` reads it as optional (absent = nothing required); `evaluateRecord`/`gateFor` refuse any record that is not new-marker (including no-marker "exempt" ones) when the change number is at or above it; `loosenedSettings` treats raising the number or removing the line as loosening (adding or lowering is not). Update the lock-settings sentence in CLAUDE.md's Master lock paragraphs to list it.
- `docs/DECISIONS.md`: remove the temporary keyword-reading entry.
- `CHANGELOG.md`: one entry under Unreleased.
No Rust, frontend or migration steps apply.

**Planned tests**
- R1 — Automated: new-marker record, all accepted, last round clean: yes, passes (test script).
- R2 — Automated: a finding with no line, and one with a rejected latest line, are refused naming the finding.
- R3 — Automated: rejected in round 1 then accepted in round 2 passes.
- R4 — Automated: "clean: yes" with a rejection in the round, and with a new finding raised in it, is refused.
- R5 — Automated: last round "clean: no", and missing round line, are refused; with "Settled by the user:" they pass.
- R6 — Automated: a "Pass (fixed after Fail)" row without its round line is refused.
- R7 — Automated: existing old-marker variants keep their current results.
- R8 — Automated: old marker plus fixed lines is judged by the new rules.
- R9 — Manual (checked by Claude): read the three documents and the policy sentence for the same wording; wording is prose, so it can't be unit-tested.
- R10 — Manual (checked by Claude): grep the decisions file for the entry.
- R11 — Automated: new-marker record with no findings and no Re-review section passes.
- R12 — Automated: at the boundary number, an old-marker record and a no-marker record are refused and a new-marker record passes; below it the old ones still pass; with no line in CLAUDE.md nothing is required.
- R13 — Automated: a check-in raising the number is refused, one removing the line is refused, one lowering it passes, and adding the line to a CLAUDE.md that lacks it passes.
