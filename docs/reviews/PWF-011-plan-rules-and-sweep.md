# Review: PWF-011 — Plan rules, and a sweep of project-specific wording

- **Change:** PWF-011
- **Review format:** accountability
- **Plan:** docs/plans/PWF-011-plan-rules-and-sweep.md (approved in commit 5850a67)
- **Branch:** chore/PWF-011-plan-rules-and-sweep
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then one fresh re-reviewer (round 1)
- **Scope:** diff of chore/PWF-011-plan-rules-and-sweep against master — .claude/skills (4 SKILL.md files), .claude/hooks/test-block-main-edits.sh, CLAUDE.md, docs/BACKLOG.md, plus the plan and the saved before-copy, about 325 lines. Also one file outside the repository: D:\projects\shared-claude-conventions\POLICY.md (one new section), original saved as docs/reviews/PWF-011-POLICY.md-before.md.

## Findings

### Standards reviewer
- **[Nit]** The plan-change rules bullet is worded differently from the plan's first draft ("(unit or logic tests)") — .claude/skills/plan-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (the plan's technical detail specifies that wording, so it is not a breach)
- **[Low]** The reviewer did not re-grep the hook scripts, so the claim they are clean rests on the author — .claude/hooks/*
  **Caused by this change:** no
  **Disposition:** explained (the author grepped them: only the `master`/`main` names and `docs/plans/` turned up, both kept on purpose per the plan interview; the re-reviewer re-grepped and agreed)
- **[Informational]** The shared policy does not list "Lockfile commands", "Installer location" and "Data folder" as lines a project must provide — D:\projects\shared-claude-conventions\POLICY.md, CLAUDE.md
  **Caused by this change:** yes
  **Disposition:** explained (an observation: each skill says to ask the user when a line is missing, so nothing breaks; a policy list of required fields would be its own change)
- **[Informational]** The POLICY.md edit is outside git — D:\projects\shared-claude-conventions\POLICY.md
  **Caused by this change:** yes
  **Disposition:** explained (the workflow saves an exact before-copy for this; it is present)

### Spec reviewer
- **[Nit]** build-changes still said "this app's own version lines"; the plan says "the project's own" — .claude/skills/build-changes/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (reworded to "the project's own version lines")
- **[Low]** The reviewer could not confirm the hook test script passes (it is slow on Windows) — .claude/hooks/test-block-main-edits.sh
  **Caused by this change:** yes
  **Disposition:** explained (the author ran it to completion: 376 passed, 0 failed, and a second run exited 0)

### Correctness reviewer
- **[Nit]** Same "this app's own version lines" wording in build-changes — .claude/skills/build-changes/SKILL.md
  **Caused by this change:** no
  **Disposition:** fixed (same edit as above). The author notes the miss was this change's own half-applied edit, but the reviewer's label is kept as given.
- **[Nit]** The shared policy's change-number examples use `DTP-085`, this project's real prefix — D:\projects\shared-claude-conventions\POLICY.md
  **Caused by this change:** no
  **Disposition:** logged in docs/BACKLOG.md
- **[Informational]** New rule 1 has no mechanical enforcement — .claude/skills/plan-change/SKILL.md, D:\projects\shared-claude-conventions\POLICY.md
  **Caused by this change:** yes
  **Disposition:** explained (it is a wording rule, like the others)

## Re-review

### Round 1
Triggered by the fix, the explanations and the logged item above. The fresh re-reviewer was given the plan, the standards, the diff of the fixes, and every finding with its label, outcome and reasoning. It accepted every explanation, accepted the fix, confirmed the "caused: no" label on the logged item is true, and re-grepped the hook scripts itself (only `docs/plans/` and `master`/`main`, both kept on purpose). It raised no new finding. The round was clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the plan-change skill's rules and the policy section for the made-up-change rule | Pass (checked by Claude) |
| R2 | Read the same two files for the chore rule | Pass (checked by Claude) |
| R3 | Read both for the project-specific rule and the shared-paths clarification | Pass (checked by Claude) |
| R4 | Compared the three rule lines in the policy section and the skill (identical) | Pass (checked by Claude) |
| R5 | `bash .claude/hooks/test-block-main-edits.sh` (376 passed, 0 failed); grep of the four skills and the test script for the old project-specific terms (none found); read of the three new CLAUDE.md lines | Pass |

## Deviations from the plan
None. One planned reword (build-changes "the project's own version lines") was missed at first and fixed after review.

## Summary
The three rules are in the plan-change skill and in one new section of the shared policy, word for word the same. The four skills and the hook test script no longer carry app or stack wording; the lockfile commands, installer location and data folder now live in CLAUDE.md. The guard hooks are untouched. All checks pass, and the one re-review round was clean. One nit about the policy's own example prefix is logged in the backlog.
