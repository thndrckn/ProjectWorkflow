# Review: PWF-021 — Fixed re-review lines

- **Change:** PWF-021
- **Review format:** accountability 2
- **Plan:** docs/plans/PWF-021-fixed-re-review-lines.md (approved in commit 3aa9ae2)
- **Branch:** chore/PWF-021-fixed-re-review-lines
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then one fresh re-reviewer (round 1, clean)
- **Scope:** diff of chore/PWF-021-fixed-re-review-lines against master — 8 files, about 700 lines added (the lock's checker and its tests, the /code-change and /commit-change skills, CLAUDE.md, docs/DECISIONS.md, the saved before-copy of the shared POLICY.md); plus the shared POLICY.md outside the repository, edited by the user by hand (before-copy: docs/reviews/PWF-021-POLICY.md-before.md)

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author). Findings raised by a re-review are listed here too, marked with the round that raised them. Three reviewers raised the same garbled refusal message; it is one finding below.

- **[Nit]** The refusal message for an old-format record read "which changes from PWF-024 on need:", which is garbled (raised by Standards, Spec and Correctness) — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (reworded to "which is required from PWF-024 on:")
  **Re-review (round 1):** accepted
- **[Nit]** A comment above the round-checking function named a parameter that does not exist — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (the comment now describes the real parameters)
  **Re-review (round 1):** accepted
- **[Nit]** The "round is clean" test and the extraction of a round's clean lines were written out twice — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (two small helpers now do it; behaviour unchanged)
  **Re-review (round 1):** accepted
- **[Low]** The gate command now needs a complete, valid CLAUDE.md and no comment said why; it also did not check that the change number carries the configured prefix (Standards and Correctness) — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (a why comment says the requirement depends on the settings, the gate fails closed, and the hook uses the old tip's settings so the change adding the line passes; the gate now refuses a number with another prefix, with a test)
  **Re-review (round 1):** accepted
- **[Informational]** The temporary DECISIONS.md entry was removed, yet old-format records are still read by keyword until PWF-024 — `docs/DECISIONS.md`, `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the entry itself said to remove it when this change landed; the checker's header comment states the remaining limit, which ends when PWF-024 makes the new format mandatory)
  **Re-review (round 1):** accepted
- **[Informational]** A record counts as format 2 if it has the marker or any fixed line — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (intended by R8 so dropping the marker cannot dodge the new rules; commented in the checker and covered by tests)
  **Re-review (round 1):** accepted
- **[Informational]** The "raised in round" line is a marker the re-reviewer must write; a re-reviewer who leaves it off lets a round pass as clean — `.githooks/master-lock-check.mjs`, `.claude/skills/code-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (a finding is free prose, so the checker cannot see that it was raised in a round without a marker; the template requires the line, the re-reviewer brief requires new findings to be listed, and /commit-change reads the record itself as well)
  **Re-review (round 1):** accepted
- **[Informational]** Two behaviours go slightly beyond the plan: the gate reads CLAUDE.md, and a record with fixed lines but no marker is read as format 2 — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (both follow from R8, R12 and the plan's wording that the marker cannot be dropped to dodge the rules)
  **Re-review (round 1):** accepted
- **[Low]** A fixed-Fail verdict line was matched on plain text, so an id written with a colon, or a bold id in the trace table, would not match (fails closed) — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (ids are compared without punctuation or bold marks; the colon form is accepted and tested; one requirement per line by design)
  **Re-review (round 1):** accepted
- **[Low]** The skill text says each round has exactly one clean line, but duplicates of the same value passed — `.githooks/master-lock-check.mjs`, `.claude/skills/code-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed (more than one clean line in a round now fails the gate, with a test)
  **Re-review (round 1):** accepted
- **[Informational]** An old record that quotes the fixed line forms in its text would be switched to format 2 — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (intended by R8; no existing record in docs/reviews contains the line forms, and the gate's test over the existing records still passes)
  **Re-review (round 1):** accepted
- **[Informational]** A verdict line counts only when indented under its finding — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the template shows the lines indented; a misplaced line fails closed, never open)
  **Re-review (round 1):** accepted
- **[Informational]** The hook (old tip's settings) and the gate (the branch's settings) read different snapshots — `.githooks/master-lock-check.mjs`
  **Caused by this change:** no
  **Disposition:** explained (that difference is what lets the change that adds the new CLAUDE.md line pass its own check-in; it is now documented in the gate's comment; the re-reviewer confirmed the "no" label)
  **Re-review (round 1):** accepted

## Re-review

### Round 1
Triggered by every outcome of the first review (nine fixes and explanations across thirteen findings). A fresh re-reviewer checked all of them and accepted every fix and every explanation, and confirmed the "caused: no" label on the last finding. It raised no new finding. It also compared the user's hand edit of the shared POLICY.md with the plan's sentence: the words match; two informational observations (the inline-code marks around the line forms are missing, and the file holds an unrelated paragraph about hand-edited shared files, at lines 42 and 43, that belongs to PWF-022) are recorded under the deviations below. The re-reviewer did not run the lock's tests itself (they take several minutes); the author ran them after the fixes (135 passed).
**Round 1 clean:** yes

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Lock test: format 2 record, every verdict accepted, last round clean, passes | Pass |
| R2 | Lock tests: finding with no line, and with a rejected latest line, refused | Pass |
| R3 | Lock test: rejected in one round, accepted in a later one, passes | Pass |
| R4 | Lock tests: clean round holding a rejection, and one that raised a finding, refused | Pass |
| R5 | Lock tests: last round clean: no, and no round line, refused; settled by the user passes | Pass |
| R6 | Lock tests: fixed Fail with its line passes; without it, and with a rejection, refused | Pass |
| R7 | Lock test: old-marker record keeps keyword reading; the gate over the existing records still passes | Pass |
| R8 | Lock tests: old marker plus fixed lines, and no marker plus fixed lines, read by the new rules | Pass |
| R9 | Read the template, re-reviewer brief, /commit-change rules and the POLICY.md sentence for the same line forms | Pass (checked by Claude) |
| R10 | Searched docs/DECISIONS.md for the keyword-reading entry | Pass (checked by Claude) |
| R11 | Lock test: format 2 record with no findings and no rounds passes | Pass |
| R12 | Lock tests: below, at and above the number; gate command; no line; empty line fails closed | Pass |
| R13 | Lock tests: raising and removing refused; lowering and adding allowed | Pass |

## Deviations from the plan
- The user's hand edit of the shared POLICY.md matches the plan's sentence word for word, but the inline-code marks around the format name and the three line forms did not survive (the sentence shows them as plain text and bold). Formatting only; the user can restore the marks.
- POLICY.md also contains an unrelated paragraph at lines 42 and 43 (hand-edited shared files), which is not part of this change and is not in the saved before-copy; it belongs to PWF-022.
- A `Raised in round: N` line was added to the record template: the plan said a finding "raised in that round" must be recognisable but did not name the line.
- The gate command also reads CLAUDE.md and refuses a number with another prefix (review findings, fixed).

## Summary
The master lock now reads review format 2 records exactly: a verdict line under each finding, one for each fixed failed requirement, and one clean line closing each round, with the old keyword reading kept only for old records. CLAUDE.md's new "Review format 2 required from" line (PWF-024) makes the format mandatory from that change on, and a check-in cannot raise or remove it. The record template, the re-reviewer brief and the check-in gate wording describe the same lines, the temporary DECISIONS.md entry is gone, and the user added the sentence to the shared POLICY.md by hand. Thirteen findings from three reviewers were all fixed or explained; one re-review round accepted every outcome and was clean. The lock's tests pass (135).
