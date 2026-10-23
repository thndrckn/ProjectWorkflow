# PWF-001 — Tighten the workflow

- **Change:** PWF-001
- **Date:** 2026-10-23

## What you'll see change
- Checking in a change no longer bumps a version or creates a tag. `/commit-change` verifies the records, merges, pushes, deletes the branch, and reports.
- Plans no longer have a "Version" line. Every new changelog entry goes at the top of the "Unreleased" section, newest first, and Unreleased keeps growing until a future `/build-changes` turns it into a version.
- The workflow's skills, hooks, and shared settings are now saved in git, so they have history and travel with the project. Only your personal local settings stay out of git.
- On `master`, Claude can edit nothing except plan files. Workflow files can only be edited on a working branch like any other file.
- Claude can no longer enter plan mode in this project. If it tries, it is told "Plan mode isn't used in this project. Follow /plan-change instead." Plans are written directly as files.
- `/code-change` now checks for other branches as its very first, separate command, and stops and waits for you if any exist. The check for uncommitted changes works the same way.
- The changelog entry for DTP-068 is relabelled from a fix to a feature.
- `/plan-change` can no longer skip the interview or the play-back. If a request already answers everything, Claude says so and asks "Is there anything you want to add or change?", then always plays back and waits for your yes before writing the plan.
- Your list of pre-approved commands moves out of the shared `settings.json` and into your personal `settings.local.json`, so it stays on your machine.
- Before the workflow files are added to git, Claude shows you every file that would be added, and stops if anything other than the skills, hooks and `settings.json` appears.
- Claude's saved note about the plan approval workflow is updated so it no longer says to use plan mode.
- When `/plan-change` finishes writing a plan, it opens the plan in your editor and tells you that Ctrl+Shift+V shows the formatted preview. If the editor's `code` command isn't available, Claude says so and gives you the file path instead.

## What could go wrong / what gets lost
- Nothing in the app or `data/` is touched; no migrations.
- The pre-approved command list is merged into `settings.local.json` before `settings.json` is committed, so your local Windows paths never reach GitHub. If the merge goes wrong you could lose some pre-approvals and be prompted again; nothing else is affected.
- From then on, edits to skills and hooks must happen on a branch, not on `master`. That is intended.
- Existing version tags and old plans that mention versions stay as they are.

## Not included
- No `/build-changes` skill. Unreleased just accumulates until you ask for that separately.
- No change to the shared policy document, which still describes versions and tags (its Versioning section and the "tagged" wording in the check-in step). It lives outside this repo, so it needs its own change; until then, this project's skills override it.
- `rename-plan.sh` and the `plansDirectory` setting stay exactly as they are.
- No change to the app's version number (0.40.0).

## How you'll check it
1. Run `git status` after check-in: `.claude/skills`, `.claude/hooks`, and `.claude/settings.json` are tracked; `.claude/settings.local.json` is not.
2. On `master`, ask Claude to edit any file other than a plan file (including something under `.claude/`). It is blocked.
3. Ask Claude to enter plan mode. It is refused with the message above.
4. Read `/plan-change`, `/code-change`, and `/commit-change` and confirm there is no version, bump, or tag anywhere.
5. Open `CHANGELOG.md`: PWF-001 is the first entry under Unreleased, and DTP-068 reads "(feat)".
6. On your next change, confirm `/code-change` runs `git branch` alone and stops if another branch exists.
7. Run `/plan-change` with a fully specified request: Claude must still ask "Is there anything you want to add or change?" and play back before writing a plan.
8. Open `.claude/settings.json`: it has no `permissions` block. Your pre-approved commands are in `.claude/settings.local.json`.
9. Read Claude's saved note `feedback_plan_approval_gate.md`: it no longer mentions plan mode as the way to plan.
10. Run `/plan-change` on any change: once the plan is saved, it opens in the editor and Claude mentions Ctrl+Shift+V for the preview.

## Check-in
- Type: chore
- Branch: chore/PWF-001-tighten-the-workflow
- Commit message: chore(PWF-001): drop versions from check-ins, track .claude, block plan mode, stricter workflow checks
- Version: no tag

---

## Technical detail (for Claude)
Files only; no Rust, frontend, or schema changes. The "Version" line in this plan's Check-in section is present only because the current format still requires it; this change removes it from the format.

**1. Versions out of check-ins**
- `.claude/skills/plan-change/SKILL.md`: delete the `- Version:` line from the Check-in block in the plan format, and delete the rule bullet "`feat:` is a minor bump; ...". Update step 6 / description text if they mention version or tagging (they don't currently; verify).
- `.claude/skills/commit-change/SKILL.md`: update the description (drop "applies the version", "tags"). Step 3: drop the Version bullet, the `package.json` version arithmetic, and the "Checking in DTP-085 as v0.41.0" example (keep a one-line announcement without a version). Delete step 4 (version bump) and renumber. Step 5: remove the tag bullet. Step 6: remove "(and the tag, if any)" and "and the version (if any)". Intro: "Verifies the records, merges, pushes, deletes the branch, and reports."
- `.claude/skills/code-change/SKILL.md`: step 1, drop "version" from the Check-in list. Step 9 CHANGELOG paragraph: replace with "one entry for this change, added at the top of `## [Unreleased]` (newest first). Never create a version heading; a future `/build-changes` does that." Remove the "If tagging, move anything waiting..." sentence. Step 10 closing line: "Do NOT merge or push." (drop version/tag).
- `CHANGELOG.md`: add the PWF-001 entry at the top of `[Unreleased]`: `- PWF-001 (chore) Tightened the workflow: no versions or tags at check-in, .claude tracked in git, plan mode blocked, stricter branch checks, no skipping the interview or play-back.` Also adjust the intro paragraph's "grouped under the version it shipped in" to note that unreleased entries wait under Unreleased.

**2. Track `.claude/` in git**
- `.gitignore`: replace `.claude/*` with `.claude/settings.local.json`.
- `block-main-edits.sh`: remove the `.claude` allow block and update the header comment; on `master`/`main`, only `docs/plans/` is allowed. (This also blocks `.claude/` edits on `master` after this lands, as intended.)
- Before staging anything under `.claude/`, list every file that would become tracked (e.g. `git status --short -uall .claude` after the `.gitignore` change, run as its own command) and show it to the user. If anything other than files under `.claude/skills/`, `.claude/hooks/`, and `.claude/settings.json` appears, STOP and wait. Only then stage those (none are tracked today).
- `CLAUDE.md` Guard bullet: change "except plan files and `.claude/` itself" to "except plan files".

**3. Block plan mode**
- `.claude/settings.json`: add a `PreToolUse` entry with matcher `EnterPlanMode` running a command hook that prints "Plan mode isn't used in this project. Follow /plan-change instead." to stderr and exits 2 (same blocking convention as `block-main-edits.sh`). Either a small `.claude/hooks/block-plan-mode.sh` (consistent with the existing hooks) or an inline command; use the script for consistency. Leave the `PostToolUse`/`ExitPlanMode` `rename-plan.sh` hook and `plansDirectory` unchanged.
- `plan-change/SKILL.md`: add "Do not enter plan mode. Write the plan file directly, then stop." near the top, next to "Nothing gets coded here."
- Memory file `feedback_plan_approval_gate.md` (in `C:\Users\jason\.claude\projects\d--Projects-DisneyTripPlanner\memory\`) says to use EnterPlanMode/ExitPlanMode; it now contradicts the project. Rewrite it during `/code-change` (outside the repo, so not in the commit) to say plans are written directly under `/plan-change` with plan mode blocked, and update its `MEMORY.md` index line to match. Mention it in the hand-off.

**6. `/plan-change` cannot skip process**
- `plan-change/SKILL.md`: add, near the top beside the plan-mode line, exactly: "Never skip the interview or the play-back. If the request already answers everything, say so and ask at least: 'Is there anything you want to add or change?' Always do the play-back and wait for the user's yes before writing the plan."

**7. Permissions move**
- Move the entire `permissions.allow` list from `.claude/settings.json` into `.claude/settings.local.json`, merging with any existing entries (read the local file first; keep valid JSON; no duplicates). Remove the `permissions` block from `settings.json`. Do this before staging `settings.json`. Verify both files parse as JSON afterward.

**8. Open the plan in the editor**
- `plan-change/SKILL.md`, step 6 ("Stop"): after the plan is saved, run `code <plan file path>` as its own separate command (never combined with another command), then tell the user they can press Ctrl+Shift+V for the formatted preview. If the `code` command isn't available, say so and give the plan's path instead.

**4. `/code-change` branch and change checks**
- Step 2: "Run `git branch` by itself, as its own separate command, before anything else in this step. Never combine it with creating or switching a branch. If any branch other than `master` exists, list them in plain English, explain the new branch will start from `master` and won't include their work, and STOP until the user answers."
- Step 3: same treatment for the uncommitted-changes check: run `git status` as its own command before switching branches or creating anything; show and STOP on unexpected changes.

**5. CHANGELOG**
- Line 80: `DTP-068 (fix)` → `DTP-068 (feat)`.

**Tests / verification:** none automated. Verify by piping sample hook JSON into both hook scripts with `bash`, checking exit codes: edit to a non-plan file on `master` → 2; a plan file on `master` → 0; EnterPlanMode → 2 with the message. Run `git check-ignore .claude/settings.local.json` (ignored) and `git check-ignore .claude/settings.json` (not ignored).
