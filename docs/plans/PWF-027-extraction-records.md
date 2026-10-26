# PWF-027: Extraction records

**Status:** Approved by Jason, 2026-10-26
**Done by hand:** yes. ProjectWorkflow has no workflow set up yet (no CLAUDE.md settings, no trunk lock), so /plan-change, /code-change and /commit-change can't run here. Each step is run by Jason and checked by Claude before the next one.

## Why

ProjectWorkflow was extracted from DisneyTripPlanner-archive and renumbered. The repo must say, in the repo itself, where it came from and what was left out, so anyone can trace any PWF change back to the original.

## What was done before this change (for the record)

- Source: https://github.com/thndrckn/DisneyTripPlanner-archive, trunk at `c7c1ece` (last commit of DTP-111).
- History cut: starts at DTP-086's first commit (`8c47ec9`, "approved plan"). Its links to DTP-085 (`3338dd5`) were removed. The first commit holds the kept files as they stood at that point.
- Files kept: `.claude/skills/`, `.claude/hooks/`, `.claude/settings.json`, `.githooks/`, `CHANGELOG.md`, `docs/DECISIONS.md`, `docs/BACKLOG.md`, and the DTP-086 to DTP-111 files in `docs/plans/` and `docs/reviews/`.
- All Disney version tags (v0.2.0 to v0.40.0) were removed.
- 7 commits were dropped because they only touched app files (listed in the history index).
- Renumbered DTP-086..DTP-111 to PWF-001..PWF-026 (PWF = DTP − 85) in commit messages, file names and file text, using `renumber_pwf.py`. Other DTP numbers are unchanged.
- Pushed to https://github.com/thndrckn/ProjectWorkflow, trunk at `c9923fb`.

## Requirements

**R1. History index**
Given someone holds a PWF number,
when they open `docs/HISTORY.md`,
then they find: the source repo and commit, the cut point, the 26-row PWF-to-DTP table, the kept and left-out file groups with the reason for each, the 7 dropped commits (archive ID, message, reason), and how the renumbering was done.

**R2. Renumbering script kept**
Given the renumbering has to be repeatable,
when PWF-027 is checked in,
then `docs/history/renumber_pwf.py` is in the repo, unchanged from the version that was run.

**R3. Changelog trimmed**
Given `CHANGELOG.md` still holds the 85 Disney entries (DTP-001 to DTP-085),
when PWF-027 is checked in,
then it holds only PWF-001 to PWF-026 in their existing format, a line at the top saying those 26 were made in DisneyTripPlanner as DTP-086 to DTP-111 (see `docs/HISTORY.md`), and a new PWF-027 entry.

**R4. Design added as-is**
Given `design.md` was written before the extraction,
when PWF-027 is checked in,
then it is at `docs/design.md`, unedited. Bringing it up to date is a separate change, so the before and after are both on record.

**R5. Reference folder**
Given DTP's app-side workflow pieces were left out of the history,
when PWF-027 is checked in,
then `reference/disneytripplanner/` holds DTP's versions from archive commit `c7c1ece` of: `scripts/check-conventions.mjs`, `tests/conventions.mjs`, `eslint.config.js`, `package.json`, `scripts/dev.mjs`, `.gitattributes`, `CLAUDE.md`; plus a `README.md` saying they are examples only, not active, where they came from, and which PWF changes made them.

**R6. Honest commit**
Given this change skipped the normal workflow,
when it is committed,
then the commit message says it was done by hand and why.

## Out of scope

- Updating design.md (the next change).
- Setting up the workflow in ProjectWorkflow itself (CLAUDE.md settings, lock).
- Any change to skills, hooks or lock code.

## Checks

- R1, R3: read the files; count 26 table rows and 26 + 1 changelog entries.
- R2: the file hash matches `D:\Projects\renumber_pwf.py`.
- R4: the file hash matches `D:\Projects\ProjectWorkflow-design.md`.
- R5: each file's hash matches the archive copy at `c7c1ece`.
- R6: read the commit message.
