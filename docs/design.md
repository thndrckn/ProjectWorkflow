# ProjectWorkflow — design

Status: agreed in a grilling session, 2026-10-26. Nothing is built yet. The first change, PWF-001, builds from this document.

## Purpose

Today the Claude Code workflow (plan, code, review, check in, build) is carried as copies. DisneyTripPlanner (DTP) has the full set. SpoolKeeper has older, diverged copies and no lock. LockedIn has almost nothing. The shared policy lives in `D:/projects/shared-claude-conventions`, which is not under git and is imported by an absolute `@` path.

ProjectWorkflow is one project that owns the workflow. Apps install it and carry only their own configuration.

## What was read

- DTP: `.claude/skills/{plan,code,commit}-change`, `build-changes`, `.claude/hooks/*` (guard, plan-mode block, shell-command check, tests), `.githooks/*` (trunk lock, checker, installer, tests), `.gitattributes`, and the "Workflow" section of `CLAUDE.md`.
- `shared-claude-conventions`: `POLICY.md` and `PROCESS_BACKLOG.md`.
- SpoolKeeper and LockedIn: the `.claude` folders and the `CLAUDE.md` import line.

## Decisions

### 1. What moves into ProjectWorkflow

| From | To | Notes |
|---|---|---|
| DTP `.claude/skills/*` | the plugin's skills | `/workflow:plan-change`, `/workflow:code-change`, `/workflow:commit-change`, `/workflow:build-changes` |
| DTP `.claude/hooks/*` (guard, plan-mode block, shell-command check) | the plugin's hooks | Their tests move too and become this project's checks |
| DTP `.githooks/*` (`reference-transaction`, `trunk-lock-check.mjs`, installer) | `githooks/` in the repo | The `.gitattributes` rule that forces LF for hook scripts moves with them |
| `POLICY.md`, workflow half | `WORKFLOW.md` | Workflow model, change numbers, committing, commit messages, versioning, peer review, before-starting-any-task, rules for plans and skills, and the "turn the lock off by hand" steps |
| `POLICY.md`, stack half | `policies/tauri-react-sqlite.md` | Rust/Tauri/SQLite house rules. Non-Tauri apps import only the policies that apply |
| `PROCESS_BACKLOG.md` | this project's `docs/BACKLOG.md` | Same statuses. Items 4 and 9 stay open here. Item 5 is DTP-specific and moves to DTP's `docs/BACKLOG.md`. Items 1-3 and 6-8 stay as history |
| `shared-claude-conventions` folder | retired | Deleted at the end of the migration |

### 2. What stays in each app

- The CLAUDE.md "Workflow" config lines: default branch, change prefix, checks, build command, version files, lockfile commands, data folder, migrations, worktree lines, installer location, backup-before-migration, trunk lock starts at, review format 2 required from.
- A new line, `Workflow config version: N` (see section 4).
- App-specific architecture and rules in CLAUDE.md.
- `docs/` (plans, reviews, BACKLOG, DECISIONS) and `CHANGELOG.md`.
- Its own convention checks (DTP's `npm run lint` and `check:conventions`).
- The engine reads these lines and never owns them. The rule that a check-in cannot loosen the lock's settings in CLAUDE.md stays app-side, as today. `Workflow config version` is the one setting treated differently (see section 4).

### 3. How apps install it

- Plugin name `workflow`, marketplace name `projectworkflow`, sourced from `release/`.
- The apps' `.claude/settings.json` adds the marketplace and enables the plugin.
- CLAUDE.md replaces `@D:/projects/shared-claude-conventions/POLICY.md` with imports of `…/release/WORKFLOW.md` and the relevant `…/release/policies/*.md`.
- The git lock is switched on per app by the user, because Claude must never set `core.hooksPath`. The user runs `release/adopt.sh <app folder>` in their own terminal. It is safe to re-run. It does three things:
  1. Sets the app's `core.hooksPath` to `release/githooks`.
  2. Adds the marketplace and plugin to the app's `.claude/settings.json`.
  3. Creates a CLAUDE.md "Workflow" stub if the app has none, then prints the lock status.
- `adopt.sh` first checks the dependency in section 3a. If it is missing, `adopt.sh` stops with a non-zero exit before changing anything, and prints how to install it.

### 3a. Dependencies

- **Matt Pocock's plugin (`mattpocock-skills`)** must be installed and enabled. `/workflow:plan-change` uses the grilling method from it. Today DTP's `plan-change` carries that method as inline text ("adapted from Matt Pocock's grilling skill") rather than calling the skill, so PWF-001 decides whether `plan-change` calls the skill or keeps the text. The dependency is listed either way.
- `adopt.sh` checks for it before doing anything else. The exact check (the user's enabled plugins) is settled in PWF-001.
- Also required on the machine, as in the constraints below: Git Bash and Node.
- The dependency is checked at adoption only. A later uninstall is not detected by the skills.

### 3b. Guard scope: the ProjectWorkflow folder is off-limits to app chats

- The guard blocks any chat whose project is an app from writing anywhere under the ProjectWorkflow folder. That includes `release/`, the repo's working files and its worktrees. It covers the edit tools and the Bash and PowerShell tools, with the same best-effort pattern matching as the rest of the guard.
- Workflow changes happen only as PWF changes, in a ProjectWorkflow chat, through the normal process. An app chat that finds a workflow problem logs it in this project's backlog through the user, not by editing.
- This replaces the old rule that blocked only the shared conventions folder. It generalises it, and the "Shared conventions folder" line is no longer needed (section 6).
- In a ProjectWorkflow chat the usual guard applies: no edits on `trunk`, and work happens in a change worktree.
- `release/` is also off-limits inside ProjectWorkflow chats. Only the release step moves it, to a tag. Nobody edits it.
- `status` remains the check. `/workflow:commit-change` and `/workflow:build-changes` stop if the lock is off. The lock still fails closed.
- An app that has not been adopted has no lock, as today.

### 4. How apps get updates

- The repo keeps a `release/` git worktree checked out at the latest `vX.Y.Z` tag. Development happens on `trunk` and in change worktrees. Apps never see unreleased work.
- A release step (the equivalent of `/build-changes` for this project) bumps the plugin version, moves CHANGELOG entries into the version heading, tags, and moves `release/` to the tag. Hooks, `WORKFLOW.md` and skills therefore all change together.
- Apps' `core.hooksPath`, `@` imports and plugin marketplace all point into `release/`.
- No auto-update. Plugin updates still need `/plugin update` per app.
- **Keeping skills and hooks in step after a release.** The skills and plugin hooks come from the plugin copy that Claude Code caches. The git hooks, `WORKFLOW.md` and the policies are read live from `release/`. So after a release, the two can differ until the plugin is updated. To catch that:
  - Every skill, as its first step, compares its own plugin version with the version recorded in `release/` (its plugin manifest). On a mismatch it stops, says in plain English that the plugin is out of date, and tells the user to run `/plugin update`. It does nothing else until the versions match.
  - The skills and the plugin hooks ship in the same plugin, so they always share one version. A stale plugin is therefore caught the first time any skill is used.
  - The git hooks live in `release/` and are never stale.
  - Known gap: between a release and the next skill use, the old guard hook keeps running. Only the skills stop on a mismatch, not the hooks.
- **Workflow config version:** each app declares `Workflow config version: N`. The skills and checker stop with a plain-English message if the app's N does not match what they need. N rises only when a release changes or adds a required CLAUDE.md line, and the release notes list exactly what each app must change.
  - **Raising N is a normal change.** An app raises it through its ordinary plan, code, review and check-in, which is how it adopts a release. The lock does not refuse a raise.
  - **Lowering or removing the line is refused** at check-in, like the other lock settings. The user does that by hand with the lock off.
  - This differs from the lock's other settings, where a raise is also refused. The checker has to treat this line asymmetrically, which is part of PWF-001.

### 5. This project's own process

- Name ProjectWorkflow, change prefix `PWF`, default branch `trunk`.
- It runs its own workflow (plan, code, review, check-in) with the trunk lock on.
- Its checks are the two hook test suites (`test-block-main-edits.sh`, `test-trunk-lock.sh`).
- Bootstrap, in order:
  1. PWF-001 is the first change, hand-built before the plugin exists: copy DTP's files in and make the split.
  2. Tag `v0.1.0` and check out `release/`.
  3. The user runs `adopt.sh` on this project itself.
  4. From PWF-002 on, the project runs on itself.
- Change numbers, commit scope (`type(PWF-NNN): …`), plans, review records and CHANGELOG follow `WORKFLOW.md`.

### 6. Policy editing

Policies are no longer hand-edited. Once they are checked in, a policy edit is an ordinary PWF change: plan, branch, independent review, lock at check-in. This applies to `WORKFLOW.md` and to the stack policy.

Removed with the shared folder:
- the "Shared conventions folder" CLAUDE.md line,
- the guard hook's rule for that folder,
- the "Policy edits for you to make by hand" section in plans and in `/code-change`,
- the "edited by hand only" text in the policy.

### 7. Migration of existing apps

Each adoption is an ordinary change in that app, using that app's prefix.

1. **DisneyTripPlanner, first, as the reference.**
   - The user turns the old lock off by hand and runs `adopt.sh`.
   - The change deletes DTP's `.claude/skills`, `.claude/hooks` and `.githooks`.
   - CLAUDE.md keeps its config lines, gains `Workflow config version`, and swaps the policy import for the two new ones.
   - Its lock settings carry over unchanged (starts at DTP-101, review format 2 from DTP-109).
   - Its Workflow section drops the text that describes the machinery, and keeps its own values.
2. **SpoolKeeper, second.**
   - Its diverged skill and hook copies are diffed once against the release, in case anything is worth merging back as a PWF change, and are then deleted.
   - The lock starts at its next change number.
   - It gets no review-format-2 line until it chooses one.
3. **LockedIn, third.**
   - It has no skills now, so it needs a Workflow section, `docs/` folders and a default branch.
   - The lock starts at its next number.
4. **TNHPS and Resort Ranking** are not software projects and are not adopted.

## Constraints and non-goals

- Single Windows machine, with absolute `D:/Projects/ProjectWorkflow/release` paths. Git Bash and Node are required. There is no portability, multi-machine or remote-install story.
- No auto-update.
- No per-app overrides of shared skills. An app that wants different behaviour changes the shared skill through a PWF change, or does not adopt.
- No tool to generate CLAUDE.md beyond the `adopt.sh` stub.
- Not fixed by this design: PROCESS_BACKLOG items 4 (shell edits bypass the guard) and 9 (before-copies not enforced). Both stay open in this project's backlog.

## Content rules carried over

- Shared skills and hooks contain nothing app-specific (numbers, file names, features). App facts come from the app's CLAUDE.md. The workflow's own paths (plans, reviews, changelog, backlog, decisions) are not app-specific.
- During PWF-001, DTP's skills and hooks are checked for hard-coded DTP values. The 2,956 lines of skills, hooks and checker were only read for their CLAUDE.md dependencies, not audited line by line.
- Workflow and tooling changes are type `chore`.
