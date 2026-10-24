# PWF-011 — Plan rules, and a sweep of project-specific wording

- **Change:** PWF-011
- **Date:** 2026-10-24

## What you'll see change
Nothing in the app. The workflow gets three written rules, and the shared skills and hooks lose the wording that only fits this app.

- The planning skill and the shared policy both state three rules: tests never use a made-up change or a test-only decision (a check that needs a live run uses the next real change), workflow and tooling changes are type chore, and shared skills and hooks never contain anything project-specific.
- The four skills and the hook test script are cleaned of app and stack wording. The facts they relied on (lockfile commands, installer location, data folder) now live in the project guide, and the skills point there.
- The guard's default-branch names and the plans folder stay as they are, because they belong to the shared workflow.

## Requirements
- **R1.** Given a plan whose check needs a live run, when `/plan-change` writes the tests, then the check uses the next real change and never a made-up change or a test-only decision.
- **R2.** Given a change to the workflow or tooling, when `/plan-change` sets the type, then the type is chore.
- **R3.** Given any shared skill or hook, when it is written or edited, then it contains nothing project-specific (numbers, file names, app features), and project facts come from the project guide. The shared workflow's own paths are not project-specific.
- **R4.** Given the shared policy, when someone reads it, then one section after "Workflow model" states the three rules, worded the same as the plan-change skill.
- **R5.** Given the four skills and the hook test script after this change, then none contains project-specific wording (app features, the lockfile and installer commands, the data folder, real change numbers or versions). The generic tool commands `npm run lint` and `cargo test` stay in the test script. The project guide holds the lockfile commands, installer location and data folder. The guard's `master`/`main` and `docs/plans/` are unchanged, and the hook test script still passes.

## Decisions from the interview
| Question | Answer |
|---|---|
| Backlog: "rename-plan.sh and plansDirectory are inert while plan mode is blocked" | Keep it queued |
| Where should the three rules be written? | Also in POLICY.md (the plan-change skill and the shared policy) |
| POLICY.md layout | One new section right after "Workflow model", same wording as the skill; commit-type table untouched |
| Only add the rules, or also sweep the existing skills? | Also sweep the existing skills |
| Move the app and stack facts into CLAUDE.md? | Yes |
| Play-back 1 | No: the rule and the sweep must also cover the shared hooks |
| Play-back 2 | No: decide design here, not in `/code-change`; `master`/`main` stay (PWF-002); `docs/plans/` stays in the hooks as shared workflow; only the test script's examples change |
| Play-back 3 | No: keep `npm run lint` and `cargo test` in the test script (generic tool commands, and the test proves real check commands aren't blocked on master); `ABC-000`/`ABC-001` is fine |
| Play-back 4 | Yes |

## What could go wrong / what gets lost
- The shared policy lives outside this repository, so git can't show the edit. `/code-change` saves a before-copy of it on the branch first. Other projects that import it will see the new section.
- The guard hook protects master. Only its test script changes, and the test must still pass.
- Skill wording changes could weaken a safeguard by accident (for example the data-folder stop case in `/code-change`). The review checks that each reworded rule still says the same thing.
- No data, schema or migration changes.

## Not included
- Changing the guard's `master`/`main` handling or the `docs/plans/` path.
- Touching the backlog entry about the unused rename-plan hook and plans directory setting (it stays queued).
- Any app code.
- Re-wording the placeholder examples (`ABC-085`) or the shared-workflow file names (CHANGELOG, backlog, decisions, plans, reviews).

## How you'll check it
**T1 — Rules in the planning skill. Covers R1, R2, R3.**

1. Open the plan-change skill and find its "Rules for the plan" list.

Expected: it contains the three rules, including the made-up-change rule, chore for workflow and tooling changes, and the no-project-specific-content rule for skills and hooks.

**T2 — Rules in the shared policy. Covers R4.**

1. Open the shared policy and find the new section right after "Workflow model".

Expected: it states the same three rules in the same words as the skill.

**T3 — Skills and hooks are clean. Covers R3, R5.**

1. Search the four skills and the hook test script for the lockfile commands, the installer folder, the data folder, "Migration 027", `v0.21.0`, and `DTP-`.
2. Open the project guide's Workflow section.

Expected: the searches find nothing in the skills or hook test script. The guide has lines for the lockfile commands, installer location and data folder, and the skills point to them.

**T4 — Guard still works. Covers R5.**

1. Run the hook test script.

Expected: every case passes, and the guard still blocks edits on master.

## Check-in
- Type: chore
- Branch: chore/PWF-011-plan-rules-and-sweep
- Commit message: chore(PWF-011): add plan rules and sweep project-specific wording from shared skills and hooks

---

## Technical detail (for Claude)
Files, all workflow/tooling, no app layers or feature cycle:

- `.claude/skills/plan-change/SKILL.md` — add the three rules to "Rules for the plan". Neutralise: line "(Rust, frontend logic)" → "(unit or logic tests)"; "Follow the project's architecture: business logic in Rust, the full feature cycle, lookup tables, numbered migrations." → "Follow the architecture and conventions CLAUDE.md describes."; "layers (Rust vs frontend)" → "layers"; "the CLAUDE.md feature cycle steps" is already generic.
- `.claude/skills/build-changes/SKILL.md` — lockfile step: use the commands in CLAUDE.md's "Lockfile commands" line and "the project's own version lines"; installer step: report the location from CLAUDE.md's "Installer location" line (if none, find the build output and say so) instead of the Tauri path; "Migration 027 required." → "Migration NNN required."; `v0.9.0`/`v0.21.0` → `v1.9.0`/`v1.21.0`. If CLAUDE.md lacks a lockfile or installer line, say so and ask, same fallback pattern as the backup line (each skill states its own fallback, see DECISIONS).
- `.claude/skills/code-change/SKILL.md` — replace `data/` in the migration rule and Stop case 2 with "the data folder named in CLAUDE.md's 'Data folder' line (if none, ask the user)". Keep the stop-case meaning unchanged.
- `.claude/hooks/test-block-main-edits.sh` — `DTP-000`/`DTP-001` → `ABC-000`/`ABC-001` only. Leave `npm run lint` and `cargo test`.
- `CLAUDE.md` — Workflow section: add "Lockfile commands" (`npm install --package-lock-only` and `cargo check --manifest-path src-tauri/Cargo.toml`), "Installer location" (`src-tauri/target/release/bundle/`) and "Data folder" (`data/`).
- `D:\projects\shared-claude-conventions\POLICY.md` — new section "Rules for plans and skills" after "Workflow model", same wording as the skill; rule 3 reads "Shared skills and hooks never contain anything project-specific (numbers, file names, app features); project facts come from CLAUDE.md. The shared workflow's own paths (plans, reviews, changelog, backlog, decisions) are not project-specific." Before-copy saved per `/code-change` step on files outside the repository.
- Hooks `block-main-edits.sh`, `shell-command-check.js`, `block-plan-mode.sh`, `rename-plan.sh`: swept, only the `master`/`main` names and `docs/plans/` found, both staying; no edits expected.

**Planned tests**
- R1 — Manual (Claude can run it: read the skill and policy files): the made-up-change rule is present in the skill's rules. Wording check, so not automatable.
- R2 — Manual (Claude can run it: read the files): the chore rule is present.
- R3 — Manual (Claude can run it: read the files): the project-specific rule and its shared-paths clarification are present in both places.
- R4 — Manual (Claude can run it: diff the rule text in the two files): the three rules match word for word.
- R5 — Automated: `bash .claude/hooks/test-block-main-edits.sh` passes. Plus a manual search (Claude can run it with grep) of the four skills and the test script for the listed project-specific terms, and a read of CLAUDE.md for the three new lines.
