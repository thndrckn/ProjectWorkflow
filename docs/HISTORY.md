# ProjectWorkflow history index

This file says where ProjectWorkflow's history came from, so any PWF change can be traced back to the original.

PWF-001 to PWF-026 were made inside DisneyTripPlanner as DTP-086 to DTP-111, between 2026-10-23 and 2026-10-26. On 2026-10-26 they were extracted into this repo and renumbered (PWF number = DTP number − 85). The extraction was done by hand by Jason, with Claude giving the steps and checking each result. Its records were added by PWF-027.

## Source

- Repo: https://github.com/thndrckn/DisneyTripPlanner-archive (kept unchanged as the original record)
- Taken at: trunk `c7c1ece` (DTP-111's check-in)
- Tools: git-filter-repo 2.47.0, Python 3.14.5, and `docs/history/renumber_pwf.py`

## Change numbers

"Check-in" is the merge that put the change on trunk. Each change's plan and review record are `docs/plans/PWF-NNN-<name>.md` and `docs/reviews/PWF-NNN-<name>.md`.

| PWF | Was | Name | Checked in | Archive check-in | ProjectWorkflow check-in |
|---|---|---|---|---|---|
| PWF-001 | DTP-086 | tighten-the-workflow | 2026-10-23 | `3fe06de` | `4de4b9d` |
| PWF-002 | DTP-087 | finish-the-workflow | 2026-10-23 | `1689667` | `d677892` |
| PWF-003 | DTP-088 | requirements-and-trace-table | 2026-10-23 | `718541b` | `0414998` |
| PWF-004 | DTP-089 | review-inside-the-dev-step | 2026-10-23 | `3079337` | `68a0d1c` |
| PWF-005 | DTP-090 | grilling-interview | 2026-10-23 | `b418c6a` | `55b3990` |
| PWF-006 | DTP-091 | remove-duplicate-peer-review | 2026-10-24 | `c853516` | `dc38fb0` |
| PWF-007 | DTP-092 | skill-fixes-from-spoolkeeper | 2026-10-24 | `428b9f8` | `7a7bb6d` |
| PWF-008 | DTP-093 | review-accountability | 2026-10-24 | `30d6e11` | `ceb3eb5` |
| PWF-009 | DTP-094 | backlog | 2026-10-24 | `039bd5e` | `cc5d367` |
| PWF-010 | DTP-095 | guard-shell-on-master | 2026-10-24 | `a0f8daf` | `f6a6357` |
| PWF-011 | DTP-096 | plan-rules-and-sweep | 2026-10-24 | `0e4469a` | `8e25a91` |
| PWF-012 | DTP-097 | policy-example-prefix | 2026-10-24 | `0b3f7f3` | `762dc23` |
| PWF-013 | DTP-098 | remove-inert-plan-hooks | 2026-10-24 | `788a021` | `dc6ccb7` |
| PWF-014 | DTP-099 | keep-set-aside-request | 2026-10-24 | `5c02f39` | `8b102eb` |
| PWF-015 | DTP-100 | worktrees-for-parallel-changes | 2026-10-24 | `4fa54fa` | `b5663e5` |
| PWF-016 | DTP-101 | why-comments-vs-decisions | 2026-10-24 | `8f59add` | `3e34616` |
| PWF-017 | DTP-102 | master-lock | 2026-10-25 | `cba716b` | `f5a4863` |
| PWF-018 | DTP-103 | enter-worktree | 2026-10-25 | `a5fb5d3` | `0cd476b` |
| PWF-019 | DTP-104 | convention-checks | 2026-10-25 | `28f43d6` | `8215414` |
| PWF-020 | DTP-105 | fixed-playback-format | 2026-10-25 | `e22852d` | `892be16` |
| PWF-021 | DTP-106 | fixed-re-review-lines | 2026-10-25 | `7b5a277` | `2aa0ad2` |
| PWF-022 | DTP-107 | shared-policy-hand-edit | 2026-10-26 | `8ef7a0f` | `71134bf` |
| PWF-023 | DTP-108 | worktree-npm-ci-powershell-lock-commands | 2026-10-25 | `f33bdde` | `694b7da` |
| PWF-024 | DTP-109 | include-backlog-item-and-rename | 2026-10-26 | `778d2bb` | `f8e6071` |
| PWF-025 | DTP-110 | rename-default-branch-to-trunk | 2026-10-26 | `573a5a5` | `ca4eb8f` |
| PWF-026 | DTP-111 | fewer-conflict-stops | 2026-10-26 | `c7c1ece` | `c9923fb` |

Some check-ins were preceded by a "catch up with master" merge from the same change:

| Change | Archive | ProjectWorkflow |
|---|---|---|
| PWF-017 (DTP-102) | `f13b6a3` | `c59604e` |
| PWF-019 (DTP-104) | `60306f9` | `6b33bb5` |
| PWF-021 (DTP-106) | `99aa6c3` | `9233621` |
| PWF-022 (DTP-107) | `8681b4c` | `ca4f8c2` |
| PWF-025 (DTP-110) | `c75efc6` | `70a29b4` |

PWF-001's check-in (`4de4b9d`) is no longer a merge. Its other parent was DTP-085, which was cut away (step 2 below), so it now has one parent: the end of PWF-001's own work.

## How the extraction was done

1. **Fresh copy.** The archive was cloned into a new folder. The archive itself was not changed.
2. **History cut at DTP-086.** Two commits linked back to DTP-085 (`3338dd5`): DTP-086's "approved plan" (`8c47ec9`) and DTP-086's check-in (`3fe06de`). The plan commit became the starting commit, and the check-in kept only its link to DTP-086's own work (`e0e3884`). Nothing else crossed the line. The cut history had 181 commits, the same as everything after DTP-085 in the archive.
3. **Tags removed.** All 77 tags were DisneyTripPlanner version tags (v0.x.x), so none were kept.
4. **Files kept.** Only these, in every commit: `.claude/skills/`, `.claude/hooks/`, `.claude/settings.json`, `.githooks/`, `CHANGELOG.md`, `docs/DECISIONS.md`, `docs/BACKLOG.md`, and the DTP-086 to DTP-111 files in `docs/plans/` and `docs/reviews/` (including the POLICY and PROCESS_BACKLOG before-copies). The starting commit holds these files as they stood at that point.
5. **Renumbered.** `renumber_pwf.py` changed DTP-086..DTP-111 to PWF-001..PWF-026 in commit messages, file names and file text. Every other DTP number was left as it was, so a DTP number in this repo always means a DisneyTripPlanner change.
6. **Published** to https://github.com/thndrckn/ProjectWorkflow at trunk `c9923fb`.

## What was left out, and why

| Left out | Why |
|---|---|
| `package.json`, `package-lock.json`, `vite.config.ts`, `eslint.config.js`, `scripts/dev.mjs`, `.gitignore` | DisneyTripPlanner's build and dev settings. Workflow changes edited them, but they belong to the app. |
| `scripts/check-conventions.mjs`, `tests/conventions.mjs` | The PWF-019 convention checks. They check DisneyTripPlanner's own rules (Rust, SQL, CSS, migrations), so each project needs its own. |
| `CLAUDE.md`, `.gitattributes` | Project files. Their Workflow section and line-ending rule are per-project settings. |
| `KNOWN_ISSUES.md`, `PEER_REVIEW.md` | DisneyTripPlanner records that workflow changes retired. |
| Everything else | DisneyTripPlanner's app code and records. |

DisneyTripPlanner's versions of the app-side workflow files are kept as examples in `reference/disneytripplanner/`. The full originals stay in the archive.

## Commits dropped

Seven commits changed only left-out files, so nothing was left in them and they were dropped (step 4). Messages are as they were in the archive.

| Archive commit | Message |
|---|---|
| `7d7957c` | chore(DTP-102): name the starting-number line exactly in the by-hand section |
| `8782e3f` | chore(DTP-104): add mechanical convention checks to lint and a new check script |
| `d33629c` | chore(DTP-104): settle review round 0 findings in the convention checks |
| `870fd52` | chore(DTP-104): palette check covers rgba() and other colour functions, with the existing overlays allow-listed |
| `dc2d0ff` | chore(DTP-104): count only column-0 keys as dependencies |
| `d81cdc2` | chore(DTP-108): worktree setup uses npm ci; add PowerShell forms of the bash-only commands |
| `e3e67f1` | chore(DTP-110): rename the default branch to trunk in CLAUDE.md |

The result was 174 commits. The renumbering dropped none.

