# PWF-008 — Review accountability

- **Change:** PWF-008
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app. The change is to how reviews work, so the author never has the last word on its own findings.

- Every finding the reviewer reports now says whether this change caused it (yes or no), along with its severity.
- A finding this change caused can only end as fixed, or as "not a real problem" with a reason the re-reviewer accepts. It can never be logged or accepted as is.
- A finding this change did not cause can be fixed, explained or logged, at any severity. The old "Medium and High can never be logged" rule goes away, because the caused label replaces it.
- A fresh reviewer re-checks whenever any outcome isn't plain "fixed", at every severity. It checks every explanation, every logged item (is "not caused" really true?) and every fix. It repeats until a round comes back clean, with a limit of three re-review rounds. If the third still isn't clean, Claude stops and shows you what's still open.
- If the re-reviewer rejects an explanation, Claude fixes it, or logs it if this change didn't cause it. If Claude still disagrees, it stops and asks you. Claude can only dispute a label with an explanation the re-reviewer accepts.
- `/code-change` run on an existing working branch continues that change: it fixes, re-runs the checks, re-reviews, and adds a new round to the review record. A failed gate goes back through `/code-change`.
- `/commit-change` checks the review record against these rules before merging. If anything fails, it stops with a plain-English list and merges nothing. The check applies to any review record in the new format, and older records are exempt.
- The shared policy's workflow and peer-review wording is updated to match.

## Requirements
- **R1.** Given a review is run, when a reviewer reports a finding, then it carries a severity and a "caused by this change: yes/no" label. The same holds for a re-reviewer's findings, and a failed requirement counts as caused.
- **R2.** Given a finding labelled "caused: yes", when Claude settles it, then it ends as fixed, or as "not a real problem" with a reason the re-reviewer accepts, and never as logged.
- **R3.** Given a finding labelled "caused: no", when Claude settles it, then it may be fixed, explained or logged at any severity, and the re-reviewer confirms the "not caused" label.
- **R4.** Given any finding ended as something other than plain "fixed", when the round finishes, then a fresh reviewer re-checks every explanation, every logged item and every fix, and this repeats with a new fresh reviewer after any round that wasn't clean.
- **R5.** Given the re-review rounds have reached three and the third isn't clean, when that happens, then Claude stops and shows you what's still open instead of continuing.
- **R6.** Given the re-reviewer rejects an explanation, when Claude responds, then it fixes it, or logs it if this change didn't cause it. If Claude still disagrees, it stops and asks you.
- **R7.** Given Claude wants to dispute a label, when it does, then it needs an explanation the re-reviewer accepts.
- **R8.** Given you run `/code-change` on a working branch that holds an approved-plan commit, when it starts, then it continues that change (fix, checks, re-review, a new round appended to the review record) without creating a branch or editing the plan.
- **R9.** Given a review record in the new format (one with a format marker line, or with "Caused by this change" lines), when you run `/commit-change`, then it checks the record against R1 to R7. If anything fails, it stops with a plain-English list of what failed and merges nothing. A record in the old format is exempt.
- **R10.** Given the shared policy file, when the change is done, then its workflow and peer-review wording matches these rules and a before-copy of it is saved with the records.

## What could go wrong / what gets lost
- Nothing in the app or its data is touched.
- The shared policy file is outside this repository. It is edited in place, and the before-copy is saved in `docs/reviews/` so the original wording is recoverable. Other projects that import the same policy get the new wording too.
- This change is checked in under the old rules. It is the one-time exception: its own review record is in the old format (no caused-by labels, no format marker), so the new gate exempts it. Every record written after this change is in the new format.
- The new loop makes reviews longer, by design.

## Not included
- The backlog and retiring KNOWN_ISSUES.md (that's PWF-009).
- Any change to the app's code.
- Checking older review records (PWF-008 and earlier) against the new rules.

## How you'll check it
**T1 — Read the review rules. Covers R1, R2, R3, R4, R5, R6, R7.**

1. Open the updated `/code-change` skill and read the Review and Settle sections.

Expected: reviewers are told to label every finding "caused: yes/no". A caused finding can't be logged. A not-caused finding can be logged at any severity. The re-review covers any non-plain-fixed outcome and repeats, with a stop after three rounds. A rejected explanation is fixed, logged or escalated to you, and a label dispute needs the re-reviewer's acceptance.

**T2 — Read the continue mode. Covers R8.**

1. Open the updated `/code-change` skill and read the start of it.

Expected: on a working branch with an approved-plan commit it continues the change and appends a new round to the review record, and never creates a branch or edits the plan.

**T3 — Read the gate. Covers R9.**

1. Open the updated `/commit-change` skill and read the records check.

Expected: it checks the review record for labels, dispositions, accepted explanations, completed re-review rounds and nothing left open. On a failure it lists what failed in plain English and merges nothing. It applies only to records in the new format (a "Review format" marker line, or "Caused by this change" lines); a record in the old format, such as PWF-008's own, is exempt.

**T4 — Read the policy. Covers R10.**

1. Open the shared policy file and read the Workflow model and Peer review sections.
2. Open the before-copy in `docs/reviews/` and compare.

Expected: the policy matches the rules above, and the before-copy holds the old wording unchanged.

**T5 — Live run on the next change. Covers R1 to R9.**

1. Plan and code the next change as normal, then run `/commit-change` on it.

Expected: the review record shows labels and re-review rounds, and the gate passes. If you want to see the gate stop, delete a label from the record on the branch and run `/commit-change`.

## Check-in
- Type: chore
- Branch: chore/PWF-008-review-accountability
- Commit message: chore(PWF-008): review accountability — caused-by labels, re-review loop, commit gate

---

## Technical detail (for Claude)
Files, all documentation or skill text; no Rust or frontend change, so the CLAUDE.md feature cycle does not apply:

- `.claude/skills/code-change/SKILL.md`
  - Step 1 and the start: continue mode. If the current branch is not the default branch and `git log --grep` finds a `docs(<NUMBER>): approved plan` commit for it, continue that change. Skip steps 2 and 3 except confirming a clean working copy, and go to fix, checks, review, and appending a new round to the review record. The plan is not re-committed or edited.
  - Step 6: the reviewer briefs require a "Caused by this change: yes/no" line per finding. The definition is: the problem is in what this change added or altered, or in behaviour it changed. A failed requirement is always "yes".
  - Step 7: the settle rules are rewritten. Caused "yes" ends fixed or explained (accepted by the re-reviewer), never logged. Caused "no" can be fixed, explained or logged at any severity. A label dispute is an explanation the re-reviewer must accept. The old Medium/High-never-logged rule is removed.
  - Step 7: the re-review is a loop. It runs whenever any outcome isn't plain "fixed", at every severity, and checks every explanation, logged item and fix. It repeats with a new fresh reviewer after any non-clean round, to at most three rounds. If the third round isn't clean, stop and show the open items. This is a new stop case (4). A rejected explanation is fixed, or logged if not caused. If Claude still disagrees, stop case 3. The hand-off no longer says fixes after the re-review went unchecked, because they are checked until clean.
  - Step 9: the review record format gains a "Caused by this change" line per finding and numbered re-review rounds. Each round records what it checked, its findings and their labels, and acceptance of each explanation, logged item and fix. A continued run appends rounds and never rewrites earlier ones.
  - Step 10: the hand-off wording lists the caused label next to each finding.
- `.claude/skills/commit-change/SKILL.md`: a new gate in step 2, with no change numbers hardcoded. It applies when the review record is in the new format: it has a `- **Review format:** accountability` line in its header, or any "Caused by this change" line (so removing the marker can't dodge the gate). Records with neither are exempt. `/code-change` step 9 writes the marker into every new record. The gate checks that every finding has a severity and a label, that no caused finding is logged, that every explanation, logged item and fix has an accepting re-review round, that re-review rounds are complete (and within three), and that nothing is open. Failures are listed in plain English, and it stops without writing records. The skill's "Never" list is updated to match.
- `D:\projects\shared-claude-conventions\POLICY.md` (outside the repo): Workflow model step 3, "Reviewers", "Settling findings", "When to stop and ask the user" and "Record" in Peer review. Before editing, save the original unchanged as `docs/reviews/PWF-008-POLICY.md-before.md` on the branch, per code-change step 4.
- `CLAUDE.md`: no change planned unless the Workflow section's command descriptions need to mention continue mode. Add a small line only if needed.
- `CHANGELOG.md`: one entry under Unreleased. `docs/reviews/PWF-008-review-accountability.md`: review record. `docs/DECISIONS.md`: only if a finding is explained as by design.
- Known debt: KNOWN_ISSUES.md is still the log; PWF-009 retires it.

**Planned tests** (documentation and skill text, so there is no automated test framework for these; Claude checks by reading the files and searching for the required wording)
- R1 — Manual (checked by Claude): read the code-change skill and confirm the reviewer briefs require the label and a failed requirement counts as caused. Proven live on the next change.
- R2 — Manual (checked by Claude): confirm the settle rules forbid logging a caused finding.
- R3 — Manual (checked by Claude): confirm a not-caused finding may be logged at any severity and the re-reviewer confirms the label.
- R4 — Manual (checked by Claude): confirm the re-review trigger, the scope of what it checks, and the repeat with a fresh reviewer.
- R5 — Manual (checked by Claude): confirm the three-round limit and the stop with the open items.
- R6 — Manual (checked by Claude): confirm the fix, log or ask-you path for a rejected explanation.
- R7 — Manual (checked by Claude): confirm label disputes need re-reviewer acceptance.
- R8 — Manual (checked by Claude): confirm continue mode detection, steps skipped, append-only record and plan frozen.
- R9 — Manual (checked by Claude): confirm every gate check, the plain-English failure list, the stop, the new-format trigger (marker or labels), and that an old-format record is exempt. The live behaviour needs a real run, which is T5 on the next change.
- R10 — Manual (checked by Claude): diff the policy against the before-copy, and confirm the before-copy equals the original.
