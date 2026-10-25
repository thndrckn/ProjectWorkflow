# Review: PWF-018 — /code-change must really enter its worktree

- **Change:** PWF-018
- **Review format:** accountability
- **Plan:** docs/plans/PWF-018-enter-worktree.md (approved in commit ac99556)
- **Branch:** chore/PWF-018-enter-worktree
- **Reviewer:** independent Standards, Spec and Correctness reviewers; a re-review ran (2 rounds)
- **Scope:** diff of chore/PWF-018-enter-worktree against master — 2 skill files changed (.claude/skills/code-change/SKILL.md, .claude/skills/commit-change/SKILL.md), about 9 lines (plus the plan file)

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author).

- **[Medium]** The new STOP in code-change step 3 left the user no recovery path (worktree exists, plan already removed from master and not yet committed) — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (the STOP now says where the worktree is and that the plan file exists only there, and not to carry on from the default branch's folder)
- **[Low]** commit-change step 1 entering path had no failure handling or reason — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (explains why the tools must be loaded, checks the branch, STOPs in plain English on any failure)
- **[Low]** commit-change step 1 entering path had no folder/branch check (Correctness reviewer) — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed together with the finding above (branch check added)
- **[Low]** Folder comparison in code-change step 3 could falsely fail on Windows slash direction or drive-letter case — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (step 3 says "the same folder, whatever the slash direction or drive-letter case")
- **[Low]** Continue mode skips step 3 and has no entry check when a chat starts inside the worktree folder — .claude/skills/code-change/SKILL.md, .claude/skills/commit-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (the plan's "Not included" excludes repairing worktrees that were never entered; commit-change step 5 already stops harmlessly, with nothing merged or removed, if the chat cannot leave)
- **[Nit]** The "load the worktree tools with ToolSearch" instruction appears in three places — both skill files
  **Caused by this change:** yes
  **Disposition:** explained (each skill must stand alone when it runs, as docs/DECISIONS.md already records for the missing-backup-line fallback; the two commit-change spots are different steps, entering and leaving)
- **[Nit]** The continue-mode paragraph cross-references step 3's bullet by its quoted title — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (one definition is better than a third copy of the long rule; the paragraph also lists the four parts inline, so it reads correctly if the bullet is renamed)
- **[Nit]** Step 3's bullet adds a sentence explaining why entering matters, a little more than the plan asked — .claude/skills/code-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (it is the "why" reason the Standards reviewer expects for non-obvious additions; it changes no behaviour)
- **[Nit]** The "deferred tools" wording differed between the two skills — both skill files
  **Caused by this change:** yes
  **Disposition:** fixed (both now read "can be deferred tools that cannot be called until loaded")
- **[Informational]** Whether a live run follows the new wording is only confirmed by plan test T2 on the next real change — plan
  **Caused by this change:** no
  **Disposition:** explained (observation; nothing to change)
- **[Informational]** The step 5 STOP leaves nothing harmful behind — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (observation)
- **[Low]** (round 1) commit-change step 1 checks the branch but not the folder, unlike code-change step 3 — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (a worktree has exactly one checked-out branch, so a chat still in the main folder shows the default branch and fails the branch check; the folder check in code-change guards before any code is written)
- **[Nit]** (round 1) The commit-change step 1 bullet was one long sentence — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** fixed (the entering procedure is now an indented sub-bullet; the main bullet says "enter that worktree as described next")
- **[Informational]** (round 1) code-change's continue paragraph says "STOP if anything fails", matching step 3 — .claude/skills/code-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (observation, no inconsistency)

- **[Nit]** (round 2) The commit-change step 1 sub-bullet sits between the bullets that make up step 1's checks — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** yes
  **Disposition:** explained (entering is conditional on being on the default branch, and the main bullet's "as described next" signals that; the reviewer said no action is needed). Settled by the user: both are no-action remarks; no further round needed.
- **[Informational]** (round 2) The main bullet's "carry on" relies on the sub-bullet for the failure STOP — .claude/skills/commit-change/SKILL.md
  **Caused by this change:** no
  **Disposition:** explained (observation; the sub-bullet states each STOP). Settled by the user: both are no-action remarks; no further round needed.

## Re-review

### Round 1
Triggered by the fixes, explanations and an observation from the first review. The re-reviewer accepted all 11 outcomes, including confirming that the "caused: no" label on the continue-mode finding is true. It raised three new findings (a Low, a Nit and an Informational, listed above and marked round 1). Not clean, because it raised new findings.

### Round 2
Triggered by the round 1 findings: one explained and one fixed. The re-reviewer accepted both. It reported "New findings: none" but added two remarks it said need no action, a Nit and an Informational. Under the rules any new finding makes a round not clean, so this round is not clean. Both are recorded above as findings (marked round 2), with the reviewer's labels.

Settled by the user: both are no-action remarks; no further round needed.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read step 3's "Enter the worktree" bullet: loads both tools with ToolSearch before EnterWorktree | Pass (checked by Claude) |
| R2 | Read step 3: folder and branch checks as two commands, STOP before any code, no carrying on from the default branch's folder | Pass (checked by Claude) |
| R3 | Read the continue-mode paragraph: enters exactly as step 3's bullet says, including the STOP | Pass (checked by Claude) |
| R4 | Read commit-change steps 1 and 5: tools loaded before entering and leaving; existing STOP kept | Pass (checked by Claude) |
| R5 | Searched the added lines for project names, numbers and file names: none | Pass (checked by Claude) |

The plan's live check (T2) needs the next real change and the user at a coding chat.

## Deviations from the plan
None. Two small additions beyond the plan's wording, both from review: the STOP also tells the user where the worktree is, and commit-change step 1 checks the branch after entering. Both serve R2 and R4.

## Summary
The two shared skills now say to load the worktree tools before calling them, to check the folder and branch after entering, and to stop in plain English when entry fails. Checks pass (384 Rust tests, clippy, fmt, lint, Vite build). Two re-review rounds ran; round 2 was not clean, and the user settled its two no-action remarks and ruled out a further round; the plan is untouched. The live confirmation is plan test T2 on the next real change.
