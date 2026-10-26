# DisneyTripPlanner reference files

**Examples only. Nothing in this folder is active.** No skill, hook or check reads these files, and nothing here is copied into a project automatically.

These are DisneyTripPlanner's own versions of the files where the workflow meets the app. They were left out of ProjectWorkflow's history because they belong to DisneyTripPlanner (see `docs/HISTORY.md`, "What was left out, and why"). They are kept here for two uses:

- When DisneyTripPlanner adopts ProjectWorkflow, its adoption change copies what it needs from here.
- When another project (Spoolkeeper, LockedIn) adopts ProjectWorkflow, these show how DisneyTripPlanner did it. The rules in them are DisneyTripPlanner's (Rust, SQL, CSS, its migrations, its palette), so each project writes its own.

## Source

Copied unchanged on 2026-10-26 from https://github.com/thndrckn/DisneyTripPlanner-archive at commit `c7c1ece` (DTP-111's check-in), with the same folder layout as in DisneyTripPlanner. Each file is the whole file, including the parts that are app settings rather than workflow.

## Which changes made them

| File | Workflow changes that edited it |
|---|---|
| `scripts/check-conventions.mjs` | PWF-019 (created it) |
| `tests/conventions.mjs` | PWF-019 (created it) |
| `eslint.config.js` | PWF-019 |
| `package.json` | PWF-015, PWF-019 |
| `scripts/dev.mjs` | PWF-015, PWF-025 |
| `.gitattributes` | PWF-017, PWF-025 |
| `CLAUDE.md` | PWF-001, 002, 007, 008, 009, 010, 011, 015, 017, 019, 021, 022, 023, 025 |

Everything in these files that was there before PWF-001 is DisneyTripPlanner's own work, numbered DTP-001 to DTP-085 in its own history.
