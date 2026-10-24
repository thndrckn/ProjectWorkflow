# PWF-007 — Skill fixes found while setting up Spoolkeeper

- **Change:** PWF-007
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app. The workflow instructions change:

- When `/code-change` hands off, it lists every review finding on its own plain-English line (severity, what was found, what was done). It no longer gives counts or groups in place of the list.
- CLAUDE.md gets a "Backup before a migration" line. `/code-change`, `/commit-change` and `/build-changes` read the backup steps from it instead of naming Export All themselves. If a project has no such line, they say so and ask you how to back up.
- The three code reviewers are told that the review record and CHANGELOG entry are written after the review, so they don't flag them as missing.
- When a review finding is explained as by design, the decision and its reason go into a new file, `docs/DECISIONS.md`, with the change number and date (unless it is already there). Observations that aren't decisions stay in the review record only.
- The Standards reviewer is given `docs/DECISIONS.md` along with CLAUDE.md. CLAUDE.md loads `docs/DECISIONS.md` the same way it loads the shared policy, so it is always read.

## Requirements
- **R1.** Given a review with findings, when `/code-change` hands off, then it lists every finding on its own line with its severity, what was found, and what was done (fixed, explained and why, or logged). A count or group can't stand in for the list.
- **R2.** Given CLAUDE.md's Workflow section, when it is read, then it has a "Backup before a migration" line giving the backup steps.
- **R3.** Given a migration in the change, when `/code-change`, `/commit-change` or `/build-changes` reminds the user to back up, then the steps come from that CLAUDE.md line. None of the three skills names Export All itself.
- **R4.** Given a CLAUDE.md with no "Backup before a migration" line, when a skill reaches a backup step, then it says the project defines no backup step and asks the user how to back up, rather than guessing.
- **R5.** Given the reviewers' briefs, when `/code-change` launches them, then each is told the review record and CHANGELOG entry are written after the review and must not be flagged as missing.
- **R6.** Given a review finding explained as by design, when `/code-change` settles it, then the decision and its reason are added to `docs/DECISIONS.md` with the change number and date, unless the decision is already there.
- **R7.** Given a finding that is an observation and not a decision, when `/code-change` settles it, then it appears only in the review record and not in `docs/DECISIONS.md`.
- **R8.** Given the Standards reviewer's inputs, when `/code-change` launches it, then it is given `docs/DECISIONS.md` along with CLAUDE.md and the other standards files.
- **R9.** Given CLAUDE.md, when it loads, then it loads `docs/DECISIONS.md` the same way it loads the shared policy. The file exists, with a header and entry format and no entries.

## What could go wrong / what gets lost
Nothing. No app code, database or data files are touched, and no migration is needed. The only risk is wording: a skill that is unclear could behave differently from what is intended, which the reviewers will check.

## Not included
- Moving the existing "deliberately / don't fix this" decisions out of CLAUDE.md into `docs/DECISIONS.md`. That would be its own later change.
- Changing `/plan-change`.
- Any change to the shared policy file.

## How you'll check it
**T1 — Hand-off lists every finding. Covers R1.**

1. Read the hand-off section of the `/code-change` skill.

Expected: it asks for one plain-English line per finding with severity, what was found and what was done, and says counts or grouping can't replace the list.

**T2 — Backup comes from CLAUDE.md. Covers R2, R3, R4.**

1. Read the Workflow section of CLAUDE.md.
2. Search the three skills (`code-change`, `commit-change`, `build-changes`) for "Export All".

Expected: CLAUDE.md has a "Backup before a migration" line. The three skills have no "Export All". Each tells Claude to read the backup steps from CLAUDE.md, and to say so and ask you if the line is missing.

**T3 — Reviewers know the records come later. Covers R5.**

1. Read the review step of the `/code-change` skill.

Expected: the reviewers' brief says the review record and CHANGELOG entry are written after the review and must not be flagged as missing.

**T4 — Decisions are recorded. Covers R6, R7.**

1. Read the "settle the findings" step of the `/code-change` skill.

Expected: a finding explained as by design is recorded in `docs/DECISIONS.md` with change number, date and reason (skipped if already there). An observation that isn't a decision stays in the review record only.

**T5 — Decisions file is loaded and reviewed. Covers R8, R9.**

1. Open CLAUDE.md and `docs/DECISIONS.md`.
2. Read the Standards reviewer's bullet in the `/code-change` skill.

Expected: CLAUDE.md loads `docs/DECISIONS.md` the same way as POLICY.md. The file exists with a header and entry format and no entries. The Standards reviewer is given it along with CLAUDE.md.

## Check-in
- Type: chore
- Branch: chore/PWF-007-skill-fixes-from-spoolkeeper
- Commit message: chore(PWF-007): skill fixes — full finding list, backup steps from CLAUDE.md, reviewer briefs, DECISIONS.md

---

## Technical detail (for Claude)
Only markdown files change. No Rust, frontend, migration or feature cycle steps apply.

**Files**
- `.claude/skills/code-change/SKILL.md`
  - Step 3 (line ~41): "back up the database first" becomes "follow CLAUDE.md's Backup before a migration line".
  - Step 6: add to the common reviewer brief that the review record and CHANGELOG entry are written after the review. Add `docs/DECISIONS.md` to the Standards reviewer's file list, next to CLAUDE.md.
  - Step 7: where findings are explained, a by-design explanation also appends an entry to `docs/DECISIONS.md` (change number, date, decision, reason), after checking it isn't already there. Observations stay in the review record only. Note that the file is created on the branch with the other docs and committed with the records.
  - Step 10 (hand-off): replace the counts summary with one line per finding. Keep the stop-and-ask answers and anything left open.
  - Step 10 migration reminder (line ~145): read the backup steps from CLAUDE.md. If there is no such line, say so and ask the user.
- `.claude/skills/commit-change/SKILL.md` (line ~54) and `.claude/skills/build-changes/SKILL.md` (line ~59): same replacement, with the missing-line fallback.
- `CLAUDE.md`:
  - Workflow section: add **Backup before a migration:** Export All in the app, and copy `data/disney_trip.db`.
  - Import `@docs/DECISIONS.md` next to the existing `@` import of POLICY.md.
  - The existing "Real data lives in dev" line stays.
- New `docs/DECISIONS.md`: header, a short note that entries are design decisions explained during review, and the entry format (change number, date, decision, reason). No entries.

The `/code-change` skill step numbers above are approximate. Match the headings as they stand when coding.

**Planned tests**
- R1 — Manual: read the edited hand-off text. Claude can run it itself by reading the file, since these are instructions with no runnable behaviour.
- R2 — Manual: Claude greps CLAUDE.md for the line.
- R3 — Manual: Claude greps the three skills for "Export All" (expect none) and for the reference to CLAUDE.md's backup line.
- R4 — Manual: Claude reads each skill's fallback wording.
- R5 — Manual: Claude reads the review step's brief wording.
- R6 — Manual: Claude reads the settle step for the by-design recording rule, date, change number and already-there check.
- R7 — Manual: Claude reads the same step for the observation rule.
- R8 — Manual: Claude reads the Standards reviewer bullet.
- R9 — Manual: Claude checks the CLAUDE.md import line and the file's contents. Whether the import loads is confirmed by the user at the next session start.

All are manual because the skills are written instructions with nothing to execute. The project's automated checks still run and must pass.
