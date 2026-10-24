# Review: PWF-008 — Review accountability

- **Change:** PWF-008
- **Plan:** docs/plans/PWF-008-review-accountability.md (approved in commit 2b57c38)
- **Branch:** chore/PWF-008-review-accountability
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then four fresh re-reviewers (Rounds 1 to 4, the fourth authorised by the user). This record is in the old format, as the plan says: the old `/code-change` rules ran this review, so there are no caused-by labels and no format marker, and the new gate exempts it.
- **Scope:** diff of chore/PWF-008-review-accountability against master — 6 files changed, about 390 lines (two skill files, CLAUDE.md, docs/DECISIONS.md, the plan, the POLICY.md before-copy), plus `D:\projects\shared-claude-conventions\POLICY.md`, which is outside the repository. Its saved original is `docs/reviews/PWF-008-POLICY.md-before.md`.

## Findings
Every finding is listed, with the severity the reviewer assigned (never changed by the author).

First review, Spec reviewer:
- **[Low]** A plan requirement that is missing or wrong was not stated to count as caused in the reviewer briefs (R1 only partly done) — code-change/SKILL.md
  **Disposition:** fixed (step 6 now says a missing, partly done or wrongly built plan requirement is always "yes", and tells the Spec reviewer)
- **[Low]** The gate's new-format trigger ("any Caused by this change line anywhere") could catch an old-format record that quotes the phrase — commit-change/SKILL.md
  **Disposition:** fixed (the trigger is now a line that starts with the marker, or, after leading spaces, with the label field; mid-line prose does not count). The Correctness reviewer raised the same finding as a Low.
- **[Informational]** Behaviour added beyond the plan (continue mode stops on uncommitted changes, counts rounds across runs, and a "Continuing a change" paragraph in the policy) — code-change/SKILL.md, POLICY.md
  **Disposition:** explained (an observation; each addition fits the plan's wording and nothing conflicts with it). The re-reviewer accepted this.
- **[Informational]** Gate rule 4 checked only the last re-review round — commit-change/SKILL.md
  **Disposition:** fixed (rule 4 now covers every round)

First review, Standards reviewer:
- **[Low]** Gate rule 5 was ambiguous when no re-review ran — commit-change/SKILL.md, POLICY.md
  **Disposition:** fixed (rule 3 now says no Re-review section is needed when every finding is plainly fixed, and rules 4 and 5 are then met)
- **[Low]** Continue-mode detection looser than the plan, with no way to get the change number — code-change/SKILL.md
  **Disposition:** fixed (the number comes from the branch name, the search is anchored on `^docs(<NUMBER>): approved plan`, and it stops and asks if the branch name has no number)
- **[Informational]** A plain fix is never independently re-checked when every outcome in a review is a plain fix — code-change/SKILL.md, POLICY.md
  **Disposition:** first explained as by design, with an entry in docs/DECISIONS.md, and the re-reviewer accepted that. The user then said it was not their rule, decided that any fix triggers the re-review so every fix is independently re-checked, and approved that as a deviation from the plan. Fixed: the skills and policy now trigger the re-review on any outcome, including a plain fix, and the DECISIONS.md entry was removed.

First review, Correctness reviewer:
- **[Medium]** Deadlock after the three-round cap: nothing said what happens after the user answers — code-change/SKILL.md, commit-change/SKILL.md
  **Disposition:** fixed (the user's recorded answer, "Settled by the user: <answer>", settles open items and the gate accepts it; one extra round is allowed to check a fix made after a gate failure)
- **[Medium]** Append-only record conflicts with fixing a gate failure — both skills
  **Disposition:** fixed (a correction line is added under the finding, never a rewrite; a missing label or severity is supplied by a fresh reviewer; the gate reads the latest correction)
- **[Medium]** Fixes to a re-review round's own new findings were never checked, and a fixed requirement Fail alone did not trigger a re-review — both skills, POLICY.md
  **Disposition:** fixed (a round is clean only if the re-reviewer raised no new finding at all, and a fixed Fail triggers a re-review in the skill, the gate and the policy)
- **[Low]** Gate trigger too broad — commit-change/SKILL.md
  **Disposition:** fixed (same fix as the Spec reviewer's second finding)
- **[Low]** No path for a rejected "not caused" label or a rejected fix — code-change/SKILL.md
  **Disposition:** fixed (rejection handling now covers explanations, labels and fixes)
- **[Low]** Continue-mode edge cases: no review record yet, change-number derivation, continuing an old-format record — code-change/SKILL.md
  **Disposition:** fixed
- **[Low]** Leftover old wording ("Medium or High", "like a High finding", gate rule 6 matching only a bare "Fail") — both skills
  **Disposition:** fixed
- **[Informational]** The author can still dodge the gate by deleting both the marker and every label line — commit-change/SKILL.md
  **Disposition:** explained (the plan accepts this; the gate guards against removing the marker alone, and `/code-change` always writes it). The re-reviewer accepted this.

Re-review findings:
- **[Low]** A user's "Settled by the user" answer could not override gate rule 2, a deadlock — code-change/SKILL.md, commit-change/SKILL.md
  **Disposition:** fixed (rule 2 now exempts an item carrying the user's recorded answer)
- **[Low]** Continue mode would re-stop on a round the user already settled, and an unclean extra round had no outcome — code-change/SKILL.md
  **Disposition:** fixed (a round whose open items carry "Settled by the user" counts as closed, and stop case 4 applies to an unclean extra round as to a third)
- **[Low]** Gate rule 3 could not detect that a requirement Fail was fixed — both skills
  **Disposition:** fixed (such a requirement's trace result reads "Pass (fixed after Fail)", and rule 3 requires a re-review for it)
- **[Low]** In continue mode the author alone decided whether new work needed the full review — code-change/SKILL.md
  **Disposition:** fixed (any new code, text or rule beyond the smallest edit that fixes an open item gets the full review; when in doubt, run it)
- **[Nit]** The policy said "up to three rounds in total" but the skills allow one extra round — POLICY.md
  **Disposition:** fixed (the policy now mentions the one extra round)
- **[Nit]** The policy said "dated correction line" but the skill says round-numbered — POLICY.md
  **Disposition:** fixed (the policy now says round-numbered)

Raised by Round 2 (labelled by the reviewer; all caused by this change):
- **[Low]** (caused by this change: yes) A rejection settled through stop case 3 could fail the gate, because the "Settled by the user" phrase was only required for stop case 4 — code-change/SKILL.md, commit-change/SKILL.md
  **Disposition:** fixed (every stop-case answer is recorded as "Settled by the user: <answer>")
- **[Low]** (caused by this change: yes) Round-limit combinations had no rule (three rounds ended by user settlement then a gate failure; a second gate failure after the single extra round) — code-change/SKILL.md, commit-change/SKILL.md, POLICY.md
  **Disposition:** fixed (any round beyond the third needs the user's authorisation, recorded as "Settled by the user: <answer>" under that round)
- **[Low]** (caused by this change: partly) The record template had no heading for an extra round, and re-reviewers are given the author's outcomes and reasoning, which the reviewer-input rule forbade — code-change/SKILL.md, POLICY.md
  **Disposition:** fixed (a "Round 4 (extra)" heading, and an explicit exception for re-reviewers in step 6 and in POLICY.md)

Raised by Round 3 (all caused by this change):
- **[Low]** (caused by this change: yes) "Only four stop cases" became inaccurate once a round beyond the third needs the user to authorise it; stop case 4 said "the third round" — code-change/SKILL.md, POLICY.md
  **Disposition:** fixed (stop case 4 now covers the last permitted round, the third or an authorised extra, and a further round beyond the third)
- **[Nit]** (caused by this change: yes) The template's "Round 4 (extra) and so on" was ambiguous for a fifth round — code-change/SKILL.md
  **Disposition:** fixed (the template lists "Round 4 (extra)", "Round 5 (extra)" and so on)
- **[Informational]** (caused by this change: yes) POLICY.md did not name the phrase the gate looks for — POLICY.md, commit-change/SKILL.md
  **Disposition:** fixed (the policy names "Settled by the user: <answer>")

Round 4 (extra) raised no findings.

## Re-review
Four rounds ran. The first was under the old rules (one re-review); after the user's decision that any fix triggers a re-review, the rest ran under the new rules, with each new finding labelled caused-by-this-change by the reviewer and all of them caused (one "partly"). The record stays in the old format, so the labels are written inline, not as label lines, and the gate exempts it.

### Round 1
Triggered by the three Medium findings. It checked the fixes and explanations above. It accepted all three explanations (the plain-fix one was later overturned by the user; see its finding) and found every fix resolved its finding, apart from the new Low and Nit findings listed under "Re-review findings". No Medium or High issues. All were fixed. Not clean (new findings).

### Round 2
Triggered by the user's decision that any fix triggers a re-review, and by the fixes made after Round 1. It checked fixes A to F (the settled-by-the-user override, the closed-round rule, the "fixed after Fail" trace result, the stricter continue-mode review rule, the policy round wording, and the widened trigger with the DECISIONS.md entry removed), all of which held. It raised three Low findings, listed under "Raised by Round 2". All fixed. Not clean (new findings).

### Round 3
Checked the three Round 2 fixes and accepted all three. It raised one Low, one Nit and one Informational finding, listed under "Raised by Round 3", all caused by this change. This was the third round, so it was not clean and stop case 4 applied.
Question asked of the user: how to settle the three open items (fix all three and authorise one more round; fix all three with no further review; fix only the Low and explain the rest).
Settled by the user: fix all three and authorise one more round (Round 4 (extra)). All three were fixed.

### Round 4 (extra)
Authorised by the user (see Round 3). It accepted all three fixes and raised no findings and no new contradiction, deadlock or loophole. One observation, not a finding: step 7 still says "Keep going until a round is clean" next to the three-round limit; stop case 4 caps it, so nothing was changed. Clean.

Nothing is left unchecked: every fix made in this change was checked by a later round, and Round 4 found nothing further.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the code-change skill: reviewer briefs require severity and a caused label, and a missing or wrong plan requirement and a Fail count as caused | Pass (checked by Claude) |
| R2 | Read step 7: a caused "yes" finding can only be fixed or explained, never logged | Pass (checked by Claude) |
| R3 | Read step 7: a "no" finding may be fixed, explained or logged at any severity, and the re-reviewer confirms the label | Pass (checked by Claude) |
| R4 | Read step 7: trigger (any outcome, including a plain fix, per the approved deviation), scope and a fresh reviewer each round, repeated until a round is clean | Pass (checked by Claude) |
| R5 | Read step 7: stop case 4 after the third round with the open items shown | Pass (checked by Claude) |
| R6 | Read step 7: a rejection is fixed, logged if not caused, or goes to the user | Pass (checked by Claude) |
| R7 | Read step 7: a label dispute counts as an explanation the re-reviewer must accept | Pass (checked by Claude) |
| R8 | Read the Continue mode section: detection by branch, steps skipped, append-only, plan frozen | Pass (checked by Claude) |
| R9 | Read the commit-change gate: all rules, plain-English failure list, stop, new-format trigger, old-format exemption. Live behaviour needs a real run (plan T5) | Pass (checked by Claude) |
| R10 | Diffed POLICY.md against the before-copy; confirmed the before-copy matches the original (byte-compared before editing) | Pass (checked by Claude) |

## Deviations from the plan
**Approved by the user, contradicting the plan's R4:** R4 re-checks only when a finding "ended as something other than plain fixed". The user decided that any fix triggers the re-review, so every fix is independently re-checked, including when every outcome is a plain fix. The skills (`/code-change` step 7, the `/commit-change` gate rule 3) and POLICY.md were updated to match, and the DECISIONS.md entry that had described the narrower rule was removed. A review with no findings at all needs no re-review.

Additions the review led to, beyond the plan's wording, none contradicting it. All of them have been read and accepted by the user: the four listed in the hand-off (the three-round settlement and extra round, correction lines, "Pass (fixed after Fail)" with its re-review trigger, and the stricter continue-mode review rule), and the other two, the "a round is clean only if it raised no new finding at all" rule and the CLAUDE.md continue-mode line:
- Settled-by-the-user wording after the three-round stop, and one extra round to check a fix made after a gate failure.
- Correction lines for fixing a record without rewriting it.
- A round is clean only if it raised no new finding at all.
- A fixed requirement Fail triggers a re-review, and is recorded as "Pass (fixed after Fail)".
- Added in later rounds, not yet listed above: any round beyond the third needs the user's authorisation (recorded as "Settled by the user: <answer>"); every stop-case answer is recorded with that phrase; stop case 4 covers the last permitted round and a needed extra round; re-reviewers are exempt from the "no author reasoning" input rule. These came from re-review findings and are recorded in the Re-review section; the user has read and accepted these four as deviations.
- Continue-mode edge cases: no record yet, an old-format record, and a stricter rule for when new work gets the full review.
- The plan allowed a CLAUDE.md line "only if needed"; one line about continue mode was added to the Workflow section.

## Summary
The review rules now work as the plan describes, in the `/code-change` and `/commit-change` skills and the shared policy. The independent review found real gaps in how the loop ends, how records are corrected, and how the gate detects its trigger; all were fixed. Four re-review rounds ran, the last one authorised by the user, and the fourth found nothing, so every fix was checked by a reviewer. All five checks passed, and the plan is untouched since approval. The first real test of the gate is the next change's check-in (plan T5).
