# Review: PWF-007 — Skill fixes found while setting up Spoolkeeper

- **Change:** PWF-007
- **Plan:** docs/plans/PWF-007-skill-fixes-from-spoolkeeper.md (approved in commit f173b3c)
- **Branch:** chore/PWF-007-skill-fixes-from-spoolkeeper
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness); no re-review ran, because no `[Medium]` or `[High]` finding was raised
- **Scope:** diff of chore/PWF-007-skill-fixes-from-spoolkeeper against master — 8 files changed (3 skills, CLAUDE.md, new docs/DECISIONS.md, KNOWN_ISSUES.md, CHANGELOG.md, the plan), about 130 lines

## Findings
Every finding is listed, with the severity the reviewer assigned (never changed by the author).

**Standards**

- **[Low]** CLAUDE.md states the backup steps twice: the new "Backup before a migration" line and the older "Real data lives in dev" line — CLAUDE.md
  **Disposition:** logged in KNOWN_ISSUES.md. The plan says the older line stays, so trimming it would go against the plan.
- **[Low]** The new backup line says "copy `data/disney_trip.db`", and the policy puts `data/` off-limits to Claude, so it should be worded as a step for the user — CLAUDE.md, .claude/skills/code-change/SKILL.md
  **Disposition:** explained. Copying only reads the file. The skill already said to back up first when the user asks to run something against `data/`, so behaviour is unchanged; the skill only moved the steps into CLAUDE.md.
- **[Nit]** `@docs/DECISIONS.md` is a relative path while the policy import is absolute — CLAUDE.md
  **Disposition:** explained. It works, and the reviewer said no action was needed.
- **[Informational]** The by-design rule doesn't say where CLAUDE.md's older "deliberately" notes fit — code-change skill, plan
  **Disposition:** explained. The plan's "Not included" leaves moving them for a later change.
- **[Informational]** The missing-line fallback wording repeats in three skills — build-changes, code-change, commit-change
  **Disposition:** explained. Each skill has to stand alone, and R3 and R4 ask for it in each.

**Spec** (no requirement missing; R1 to R9 all met)

- **[Informational]** The "Real data lives in dev" line still repeats the backup instruction — CLAUDE.md
  **Disposition:** logged (same entry as the first Standards finding).
- **[Informational]** Whether the `@docs/DECISIONS.md` import loads can't be checked until a new session starts — CLAUDE.md
  **Disposition:** explained. The plan says the user confirms this at the next session start.
- **[Nit]** The reviewer-brief note is its own bullet, not part of the common brief bullet — code-change skill
  **Disposition:** explained. It still applies to all three reviewers, and the re-reviewer inherits it through "same rules as step 6".

**Correctness**

- **[Low]** The DECISIONS.md entry is written before the re-review, so a rejected explanation could stay recorded — code-change skill, step 7
  **Disposition:** fixed. The by-design bullet now says to revise or remove the entry according to the user's answer if the re-reviewer rejects the explanation.
- **[Low]** The "create the file if missing" instruction gives no header text — code-change skill, step 7
  **Disposition:** fixed. The bullet now spells out the title, a one-line purpose, and the entry format.
- **[Nit]** Step 9 doesn't list docs/DECISIONS.md among the documents to write and commit — code-change skill, step 9
  **Disposition:** fixed. Added a docs/DECISIONS.md bullet to step 9.
- **[Informational]** A decision added in this change can be used to justify itself when the re-reviewer is given the standards — code-change skill
  **Disposition:** explained. The re-reviewer also sees the explanations and must accept each one.
- **[Informational]** The import loading can only be confirmed at the next session start — CLAUDE.md
  **Disposition:** explained (same as the Spec finding above).

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | T1: read the hand-off text in the code-change skill for one line per finding | Pass (checked by Claude) |
| R2 | T2: CLAUDE.md has the "Backup before a migration" line | Pass (checked by Claude) |
| R3 | T2: no "Export All" in the three skills; each reads the steps from CLAUDE.md | Pass (checked by Claude) |
| R4 | T2: each skill's missing-line fallback wording | Pass (checked by Claude) |
| R5 | T3: the reviewer brief says the records come after the review | Pass (checked by Claude) |
| R6 | T4: by-design decisions go to docs/DECISIONS.md with number, date, reason, already-there check | Pass (checked by Claude) |
| R7 | T4: observations stay in the review record only | Pass (checked by Claude) |
| R8 | T5: the Standards reviewer is given docs/DECISIONS.md | Pass (checked by Claude) |
| R9 | T5: CLAUDE.md imports docs/DECISIONS.md and the file exists with header and format, no entries | Pass (checked by Claude) — the import itself loads at the next session start |

## Deviations from the plan
None. The plan's Technical detail named the skill step numbers as approximate; the edits went where the matching headings are.

## Summary
The workflow skills and CLAUDE.md now match the plan. All checks pass (384 Rust tests, clippy, fmt, lint, vite build). The reviewers raised no `[Medium]` or `[High]` findings; three small wording findings were fixed, one was logged, and the rest were explained. docs/DECISIONS.md was created with no entries, because none of the findings was a by-design decision.
