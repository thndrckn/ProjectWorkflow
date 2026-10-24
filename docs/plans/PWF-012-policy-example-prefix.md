# PWF-012 — Neutral change-number examples in the shared policy

- **Change:** PWF-012
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app. The shared workflow policy's two examples (a change number and a commit message) now use the neutral `ABC-085` instead of this project's real `DTP-085`, matching the shared skills. The matching entry leaves the backlog.

## Requirements
- **R1.** Given the shared policy's "Change numbers" section, when someone reads its example, then it shows `ABC-085` and not `DTP-085`.
- **R2.** Given the policy's "Commit message convention" section, when someone reads its example, then it shows `feat(ABC-085): show feedback when no hours are found`, with the wording unchanged.
- **R3.** Given the shared policy, when it is searched for `DTP-`, then there are no matches.
- **R4.** Given the backlog, when this change is done, then the "shared policy's change-number example" entry is gone and the other entry is untouched.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog 1: "rename-plan.sh and plansDirectory are inert while plan mode is blocked" | Keep it queued |
| Backlog 2: "The shared policy's change-number example uses one project's real prefix" | Plan it now |
| Switch both examples to `ABC-085`? | Yes |
| Also make the feature wording in the commit example neutral? | No, change only the number |
| Play-back: "Is that right?" | Yes |

## Backlog items fixed
- The shared policy's change-number example uses one project's real prefix

## What could go wrong / what gets lost
Nothing. The shared policy folder is not a git repository, so the edit is not tracked by a branch and cannot be reverted with git. The fix is two one-word edits, and a before-copy is saved for review.

## Not included
- The feature wording in the commit example stays.
- The `DTP-` references in `PROCESS_BACKLOG.md` are history and stay.
- Your request about code comments versus `docs/DECISIONS.md` needs its own `/plan-change`.
- The other backlog entry (rename-plan.sh and plansDirectory) stays queued.

## How you'll check it
**T1 — Examples are neutral. Covers R1, R2, R3.**

1. Open the shared `POLICY.md` and find the "Change numbers" and "Commit message convention" sections.
2. Search the file for `DTP-`.

Expected: the first example reads `ABC-085`, the second reads `feat(ABC-085): show feedback when no hours are found`, and the search finds nothing.

**T2 — Backlog entry removed. Covers R4.**

1. Open `docs/BACKLOG.md`.

Expected: only the "rename-plan.sh and plansDirectory are inert while plan mode is blocked" entry remains.

## Check-in
- Type: chore
- Branch: chore/PWF-012-policy-example-prefix
- Commit message: chore(PWF-012): use neutral ABC-085 in shared policy examples

---

## Technical detail (for Claude)
- Edit `D:\projects\shared-claude-conventions\POLICY.md` line 52 (`DTP-085` → `ABC-085`) and line 168 (`feat(DTP-085): ...` → `feat(ABC-085): ...`). That folder is outside the repository: save a before-copy for the reviewers, as `/code-change` describes for files outside the repository.
- Remove the "The shared policy's change-number example uses one project's real prefix" entry from `docs/BACKLOG.md`.
- No code, no feature cycle, no migration.

**Planned tests**
- R1 — Automated: grep line 52 of the policy for `ABC-085`. Claude can run it itself.
- R2 — Automated: grep for the exact string `feat(ABC-085): show feedback when no hours are found`. Claude can run it itself.
- R3 — Automated: grep the policy for `DTP-` and expect no matches. Claude can run it itself.
- R4 — Automated: grep `docs/BACKLOG.md` for the removed title (expect none) and the other entry's title (expect one). Claude can run it itself.
