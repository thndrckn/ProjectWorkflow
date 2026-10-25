# PWF-016 — Why-comments vs DECISIONS.md

- **Change:** PWF-016
- **Date:** 2026-10-24

## What you'll see change
The workflow gets one clear rule about where a "why" is written down. A reason tied to one spot in the code goes in a comment at that spot. A reason that applies to the whole project goes in the decisions list. When a review finding is explained as "by design" and the reason belongs to one spot, the coding step now adds the comment there instead of adding a decisions entry. Reviewers also check that new or changed code that isn't obvious has a "why" comment. The app itself does not change.

## Requirements
- **R1.** Given the shared policy, when someone reads it, then it says a by-design reason tied to one spot goes in a comment at that spot, a project-wide reason goes in the decisions list, and reviewers check that non-obvious new or changed code has a "why" comment.
- **R2.** Given a review finding explained as by design with a reason tied to one spot, when the coding step settles it, then it adds a "why" comment at that spot, writes no decisions entry, and records the outcome in the review record.
- **R3.** Given a by-design finding whose reason is project-wide, when the coding step settles it, then it adds a decisions entry as before.
- **R4.** Given a change with non-obvious new code and no "why" comment, when the standards reviewer runs, then it raises a Low finding; obvious code and unchanged old code are not flagged.
- **R5.** Given the decisions list, when someone reads its introduction, then it states the comment-versus-entry split.

## Decisions from the interview
| Question | Answer |
|---|---|
| Put the rule in the shared policy and /code-change, not only this project's CLAUDE.md? | Yes, shared policy + /code-change |
| Spot-specific by-design reason: add the comment in the same change and no decisions entry? | Yes |
| Missing "why" comments flagged only on code the change adds or alters, rated Low? | Yes |
| Play-back: "Is that right?" | Yes |

The backlog was empty, so no backlog questions were asked.

## What could go wrong / what gets lost
Nothing. Only documentation and skill wording change; no code, data or migrations. The shared policy lives in a separate folder from this project, so that edit is not in this project's git history.

## Not included
- No sweep adding comments to existing code.
- No change to how project-wide decisions are recorded, and no existing DECISIONS.md entry is moved or rewritten.
- No new check or hook enforcing comments; reviewers do it.

## How you'll check it
**T1 — Policy wording. Covers R1.**

1. Open the shared POLICY.md and find the rule.

Expected: it states the spot-versus-project split and that reviewers check new or changed non-obvious code for a "why" comment.

**T2 — Skill wording and decisions intro. Covers R2, R3, R5.**

1. Open the /code-change skill's by-design step and the intro of the decisions list.

Expected: spot-specific reasons become a comment (no entry), project-wide reasons become an entry, and the intro says so.

**T3 — Reviewer behaviour. Covers R4.**

1. Read the Standards reviewer's brief in /code-change.
2. On the next real change that adds non-obvious code, check the review record.

Expected: the brief tells the reviewer to flag missing "why" comments on changed code only, as Low. A live check needs the next real change; it can't be forced here.

## Check-in
- Type: chore
- Branch: chore/PWF-016-why-comments-vs-decisions
- Commit message: chore(PWF-016): put spot-specific by-design reasons in code comments and project-wide ones in DECISIONS.md

---

## Technical detail (for Claude)
- Shared policy (`D:/projects/shared-claude-conventions/POLICY.md`): add a short rule, likely under "Peer review" or a new small section, with no project-specific wording (rule 3 of "Rules for plans and skills"). Mention the Standards reviewer's scope (diff only, Low, obvious code exempt). That folder is a separate repo; note in the hand-off that it needs its own commit.
- `.claude/skills/code-change/SKILL.md`: update the "By-design decisions" bullet in step 7 (spot-specific: add the "why" comment at that spot, matching the surrounding comment density and style, no entry, explain in the review record; project-wide: entry as today; the comment is a code edit, so it is covered by the re-review and checks). Update the Standards reviewer line in step 6 to include the missing-"why"-comment check.
- `docs/DECISIONS.md`: add one sentence to the intro stating the split. Do not touch existing entries.
- Should the skill file text mention shared workflow paths only; no app features.
- No CHANGELOG number beyond the standard Unreleased entry at `/code-change`.

**Planned tests**
- R1 — Manual: read the policy text. Claude can run it itself (grep/read the file).
- R2 — Manual: read the skill's by-design step. Claude can run it itself. Behaviour is confirmed live on the next real change.
- R3 — Manual: same, the project-wide branch still reads as before. Claude can run it itself.
- R4 — Manual: read the Standards reviewer brief; live behaviour needs the next real change with non-obvious code.
- R5 — Manual: read the decisions intro. Claude can run it itself.
