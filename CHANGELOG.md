# Changelog

One short entry per change number, newest first. Entries wait under Unreleased until a version is built; released ones are grouped under the version they shipped in. This is the master list of change numbers (`DTP-###`) and versions. The full detail of each change lives in its plan (`docs/plans/`) and review record (`docs/reviews/`). Changes DTP-001 to DTP-083 are numbered after the fact, one per released version, in version order. The original detailed changelog is kept unchanged at `docs/archive/CHANGELOG-detailed.md`.

---

## [Unreleased]

- PWF-023 (chore) Worktree setup now runs `npm ci`, so a worktree never rewrites the lockfile; CLAUDE.md also gives the PowerShell form of the lock setup, lock turn-on and guard test commands, since bash isn't on the PowerShell path.
- PWF-019 (chore) The rules in CLAUDE.md and the shared policy that a program can check are now checked on every change: lint enforces the TypeScript ones (invoke only in api.ts, thin api.ts wrappers, no new Date(text), no browser dialogs, no inline styles, no frontend network calls, lucide-react icons only), and a new `npm run check:conventions` covers SQL, network code, command registration, types.ts vs models.rs, migrations and the dark-only palette; `npm run test:conventions` proves each rule catches a violation.
- PWF-017 (chore) Added the master lock: a git hook that refuses any update of master that is not a proper check-in (every change from PWF-016 on needs a review record that passes the commit-change gate; release commits may touch only the version files and the changelog), however the commit arrives. One shared checker serves the hook and /commit-change, which now also numbers its catch-up merge; /commit-change and /build-changes stop if the lock is off, and the guard hook stops Claude from switching it off.
- PWF-020 (chore) Every /plan-change play-back now uses one fixed format: a normal message with a Summary, the Requirements and the Decisions so far, ending in "Is that right?" as plain text (no question box); a corrected play-back says at the top what changed.
- PWF-018 (chore) /code-change now loads the worktree tools, enters the worktree and checks the folder and branch, stopping if it can't, so /commit-change can step out of it from the same chat; /commit-change loads the tools too.
- PWF-016 (chore) A by-design reason tied to one spot in the code now goes in a "why" comment at that spot, a project-wide one in docs/DECISIONS.md; /code-change and the Standards reviewer follow the rule, and the shared policy states it.
- PWF-015 (chore) Each change is now coded in its own worktree, so several can be coded at once in separate chats: /plan-change claims change and migration numbers at once, /code-change works in a worktree with its own empty database and dev-server port, /commit-change merges from it, resolves a changelog-only clash and removes it, /build-changes builds what is merged while others are open, and the guard hook protects master from every folder.
- PWF-014 (chore) When "Plan it now" sets aside your original /plan-change request, the plan now records it word for word, and /commit-change's final report ends with it as a ready-to-paste /plan-change command.
- PWF-013 (chore) The inert plan-renaming script, its after-plan-mode hook entry and the plan-folder setting are removed from the project settings; plan mode stays blocked. The matching backlog entry is removed.
- PWF-012 (chore) The shared policy's change-number and commit-message examples now use the neutral `ABC-085` instead of this project's real `DTP-085`; the matching backlog entry is removed.
- PWF-011 (chore) Three plan rules added to /plan-change and the shared policy (no made-up changes in tests, workflow changes are chore, no project-specific wording in shared skills and hooks), and the skills' stack wording moved into new CLAUDE.md lines (lockfile commands, installer location, data folder).
- PWF-010 (chore) The master-edit guard now also checks shell commands (Bash and PowerShell) on master: only an allow-list of git subcommands passes, and writes into the project are blocked; best-effort, with a test script.
- PWF-009 (chore) Added docs/BACKLOG.md for review findings that were neither fixed nor explained, and retired KNOWN_ISSUES.md; every /plan-change now asks about each backlog item first (plan it now, keep it queued, or accept it).
- PWF-008 (chore) Review accountability: reviewers label each finding "caused by this change" yes/no, a caused finding must be fixed or explained (never logged), fresh re-reviewers check every non-plain-fix outcome in up to three rounds, /code-change can continue an existing branch, and /commit-change checks the review record before merging. Shared POLICY.md updated to match.
- PWF-007 (chore) Skill fixes found while setting up Spoolkeeper: the hand-off lists every review finding, backup steps come from a new CLAUDE.md line, reviewers know the records come later, and by-design review decisions go into a new docs/DECISIONS.md that CLAUDE.md loads.
- PWF-006 (chore) Removed the duplicate PEER_REVIEW.md at the repo root; the identical archived copy in docs/archive/ stays.
- PWF-005 (chore) The planning interview now follows Matt Pocock's grilling method, written into plan-change with credit: it asks one question at a time (recommended answer first), most-unblocking first, and stops only when nothing is left to ask.
- PWF-004 (chore) Code review is now part of the coding step: independent reviewers rate the findings, Claude settles them itself and asks only about plan conflicts, data risk or a rejected explanation, and the hand-off starts with a plain-English review summary.
- PWF-003 (chore) Plans now have signed-off Given/When/Then requirements, a planned test for each, and a numbered manual test procedure; review records get a requirements trace table.
- PWF-002 (chore) Finished the workflow: project-neutral skills, stricter review rules, a catch-up merge at check-in, and a new /build-changes command.
- PWF-001 (chore) Tightened the workflow: no versions or tags at check-in, `.claude` tracked in git, plan mode blocked, stricter branch checks, no skipping the interview or play-back. Also relabelled DTP-068 from (fix) to (feat).
- DTP-085 (docs) Numbered the changelog, split the review log into per-change records, moved the plans into `docs/`, and removed GENERATED_SPEC.md.
- DTP-084 (docs) Recorded where v0.40.0 differs from its approved park-hours plan.

---

## [0.40.0] - 2026-10-23

- DTP-083 (feat) "Update park hours" now says what it found, and Day Details shows when hours were last checked versus last changed.
  Migration 027 required.

## [0.39.5] - 2026-09-18

- DTP-082 (fix) A finished trip now shows "Trip complete" instead of "Underway", and past trips sort to the bottom of the overview.

## [0.39.4] - 2026-09-18

- DTP-081 (fix) Fixed 7 findings from the second-pass external review of v0.39.3 (a park-hours retry race, stale Lightning Lane names, guest backups, and transaction gaps).

## [0.39.3] - 2026-09-18

- DTP-080 (fix) Fixed 6 findings from an external full-codebase review of v0.39.2 (stale trip-switch writes, date validation, and an older build refusing a newer database).

## [0.39.2] - 2026-09-18

- DTP-079 (refactor) Moved `useFocusTrap` into `src/hooks/` with no behavior change.

## [0.39.1] - 2026-09-18

- DTP-078 (fix) Fixed 19 findings from an external full-codebase review of v0.39.0, plus 10 more found reviewing that batch.
  Migration 026 required (flight journey id).

## [0.39.0] - 2026-09-17

- DTP-077 (feat) Itinerary day cards page their commitment list, and the day label sits beside the date.

## [0.38.0] - 2026-09-17

- DTP-076 (feat) Redesigned the itinerary PDF for phone reading, with a cover page.
  Also made migration 025 safe to run after the app has already created the airlines table.

## [0.37.0] - 2026-09-17

- DTP-075 (feat) Added Export PDF to the Itinerary tab.

## [0.36.5] - 2026-09-17

- DTP-074 (fix) Fixed the findings from a consolidated external full-codebase review of v0.36.4 (stale-response races, non-transactional saves, reservation date bounds, and sheet accessibility), and added an airlines lookup.
  Migration 025 required.

## [0.36.4] - 2026-09-17

- DTP-073 (fix) Fixed a stale-trip display race, an import name-matching mismatch, and a half-deleted connecting flight.

## [0.36.3] - 2026-09-17

- DTP-072 (fix) Fixed 7 findings from the first full-codebase peer review (a crashing trip date shift, a wipe-on-failed Replace All, foreign keys, lint, and CSP).

## [0.36.2] - 2026-09-17

- DTP-071 (fix) Moving a trip's dates now also shifts each flight's departure and arrival timestamps.

## [0.36.1] - 2026-09-17

- DTP-070 (fix) Fixed two bugs found reviewing the trip date-change confirmation (connecting flights moving together, and a date-shift collision).

## [0.36.0] - 2026-09-17

- DTP-069 (feat) Editing a trip's dates now asks to move or delete affected data instead of silently deleting it.

## [0.35.0] - 2026-09-17

- DTP-068 (feat) Renamed the Lightning Lane catalog entry "Soarin' Across America" to "Soarin'", and added "Save & Add Another" to reservation entry.
  Migration 024 required.

## [0.34.0] - 2026-09-17

- DTP-067 (feat) Lightning Lane reservations pick from an attraction catalog, filtered to the day's first park.
  Migration 023 required.

## [0.33.4] - 2026-08-24

- DTP-066 (refactor) Moved `sanitize_filename` out of `commands.rs` into `engine/export_paths.rs`.

## [0.33.3] - 2026-08-24

- DTP-065 (refactor) Moved the Park Pass rule, the park-hours fetch orchestration, and hotel-time filtering out of `commands.rs`.
  Also backfilled 9 missing git tags.

## [0.33.2] - 2026-08-24

- DTP-064 (refactor) Removed the legacy import-format code and moved the day-card commitment logic into Rust.

## [0.33.1] - 2026-08-24

- DTP-063 (fix) The departure-date lookup now reports errors, and the stale-hours check uses the shared datetime helper.
  Also removed the unused `AppError` type.

## [0.33.0] - 2026-08-24

- DTP-062 (feat) Redesigned the itinerary's top day cards into a destination line plus a commitments summary.
  Migration 022 required.

## [0.32.1] - 2026-08-24

- DTP-061 (fix) The itinerary detail panel no longer stretches to the full window width.

## [0.32.0] - 2026-08-24

- DTP-060 (feat) Redesigned the Itinerary's expanded day view into one shared grid with three visual weight tiers.

## [0.31.3] - 2026-08-23

- DTP-059 (fix) A Disney Springs or water park visit no longer gets the theme-park "access begins/ends" treatment.

## [0.31.2] - 2026-08-23

- DTP-058 (fix) DVC resort check-in is now 4:00 PM instead of 3:00 PM, and hotels gain an `is_dvc` flag.
  Migration 021 required.

## [0.31.1] - 2026-08-23

- DTP-057 (fix) Fixed hard-ticket event Early Entry flagging, added the missing regular-hours-end marker, and replaced the generic open/close captions.

## [0.31.0] - 2026-08-23

- DTP-056 (feat) Overhauled the Itinerary marker icon and color system, and removed the Character Meet entertainment kind.
  Migration 020 required.

## [0.30.2] - 2026-08-23

- DTP-055 (fix) Entertainment reservations get a distinct icon and color per kind, and the reservation color palette was rebalanced.

## [0.30.1] - 2026-08-23

- DTP-054 (fix) Closed slide-out sheets no longer paint a shadow onto the window edge.

## [0.30.0] - 2026-08-23

- DTP-053 (feat) Trip Details gained a Notes field, and the Trip Details tab layout was reworked.
  Migration 019 required.

## [0.29.0] - 2026-08-23

- DTP-052 (feat) Renamed Stays to Hotels throughout, and Trip Details now edits in a slide-out sheet.
  Migration 018 required.

## [0.28.2] - 2026-08-23

- DTP-051 (fix) Park reservations no longer appear on the Itinerary, and a round-trip flight counts as one in the overview.

## [0.28.0] - 2026-08-23

- DTP-050 (feat) Park reservations are identified by a real `is_park` column, and the Park Pass rules are enforced server-side.
  Migration 017 required.

## [0.27.1] - 2026-08-22

- DTP-049 (fix) The Plans "All" guests label now compares against the whole trip party.

## [0.27.0] - 2026-08-22

- DTP-048 (feat) Replaced party size with named guest lists, added Park Pass reservations, and added Park Pass gap tracking.
  Migrations 015 and 016 required.

## [0.26.0] - 2026-08-22

- DTP-047 (feat) Entertainment plans can record a kind (Parade, Fireworks, Show, Character Meet, Other).
  Migration 013 required.

## [0.25.0] - 2026-08-22

- DTP-046 (feat) Reservations became "Plans", with four fixed categories and one panel per category.
  Migrations 011 and 012 required.

## [0.24.0] - 2026-08-22

- DTP-045 (test) Raised backend unit tests from 114 to 198, and moved inlined command logic into testable functions.

## [0.23.0] - 2026-08-22

- DTP-044 (feat) The app tracks its required schema version with `PRAGMA user_version` and refuses an outdated database.
  Migration 010 required.

## [0.22.0] - 2026-08-21

- DTP-043 (feat) Overview cards show real per-section counts instead of manual completion flags.
  Migration 009 required.

## [0.21.5] - 2026-08-21

- DTP-042 (fix) Off-property dining shows the full booking window, and Import All and Replace All hold one lock for the whole batch.

## [0.21.4] - 2026-08-21

- DTP-041 (fix) Fixed five known issues (date-range shrink trimming, Extended Evening detection, red-eye arrival markers, weekly hours refresh, and split-stay perks).

## [0.21.3] - 2026-08-16

- DTP-040 (fix) Fixed date column wrapping in the Stays and Flight Journey tables.

## [0.21.2] - 2026-08-16

- DTP-039 (refactor) Moved flight-journey grouping into the Rust engine and split the itinerary marker components out.

## [0.21.1] - 2026-08-16

- DTP-038 (fix) Fixed a backup data-loss bug in `save_draft`, an overview abort on one bad trip, and several overview display issues.

## [0.21.0] - 2026-08-15

- DTP-037 (feat) Added the All Trips overview with four manual completion flags, replacing the trip sidebar.
  Migration 008 required.

## [0.20.0] - 2026-08-15

- DTP-036 (feat) Trips can have split stays across several resorts, each resolving its own perks.
  Migration 007 required.

## [0.19.0] - 2026-08-15

- DTP-035 (feat) Edit panels became right-side drawers, next-day rollover is inferred from clock times, and the Itinerary detail panel animates in.

## [0.18.1] - 2026-08-15

- DTP-034 (fix) Fixed the flight edit card's field grid and checkbox row layout.

## [0.18.0] - 2026-08-15

- DTP-033 (feat) Reworked Trip Details and Key Dates, added overnight-flight and next-day-leave controls, and moved hotel check-in/out times into the database.
  Also fixed a batch of review findings. Migration 006 required.

## [0.17.0] - 2026-08-15

- DTP-032 (feat) Added round-trip and connecting-flight support with a journey-based Flights table.
  Migration 005 required.

## [0.16.0] - 2026-08-15

- DTP-031 (feat) Day Details, Reservations, and Flights edit in a shared sliding sheet, and the Trip Details tab was restructured.

## [0.15.2] - 2026-08-15

- DTP-030 (refactor) Merged a flight's departure and arrival markers into one itinerary marker.

## [0.15.1] - 2026-07-30

- DTP-029 (fix) Added `esbuild` as an explicit dev dependency so production builds work on a fresh install.

## [0.15.0] - 2026-07-30

- DTP-028 (feat) Redesigned the Trip Details tab with a Key Dates panel and Flights panel, and added hotel check-in/out itinerary markers.

## [0.14.1] - 2026-07-29

- DTP-027 (refactor) Reworked the Trip Details card layout.

## [0.14.0] - 2026-07-29

- DTP-026 (feat) Added per-trip and full-database JSON export/import as the app's backup mechanism, with a Settings page.

## [0.13.2] - 2026-07-29

- DTP-025 (fix) `showConfirm()` no longer orphans a pending dialog's promise.

## [0.13.1] - 2026-07-29

- DTP-024 (fix) The database path now resolves next to the executable in release builds.
  Also restyled Trip Details as a bordered card.

## [0.13.0] - 2026-07-29

- DTP-023 (feat) Replaced the Itinerary day columns with a compact Calendar view.

## [0.12.1] - 2026-07-28

- DTP-022 (refactor) Replaced the last `window.confirm` call with the shared confirm dialog.

## [0.12.0] - 2026-07-28

- DTP-021 (feat) Added a "Back up data" button that copies the database file.

## [0.11.1] - 2026-07-27

- DTP-020 (fix) Early Entry no longer applies to Disney Springs or the water parks, and the Itinerary scrollbar sits correctly.
  Migration 004 required.

## [0.11.0] - 2026-07-27

- DTP-019 (feat) Reworked the Itinerary into side-by-side day columns with richer, per-type markers.

## [0.10.2] - 2026-07-27

- DTP-018 (fix) Fixed ticketed-event Early Entry timing, the day-label picker, and several layout issues, and added Itinerary icons.

## [0.10.1] - 2026-07-26

- DTP-017 (fix) Date edits now cascade to already-set times, and reservation party size is clamped to at least 1.

## [0.10.0] - 2026-07-26

- DTP-016 (feat) Added the Itinerary tab, a per-day timeline merging visits, reservations, and flights.

## [0.9.0] - 2026-07-26

- DTP-015 (feat) Added trip party size, a Lightning Lane reservation type, automatic day labels, and a day picker on date fields.

## [0.8.2] - 2026-07-26

- DTP-014 (fix) Selecting a ticketed event now resolves its park from a fixed home park.

## [0.8.1] - 2026-07-26

- DTP-013 (refactor) Dropped `confirmation_code` from reservations, and widened the date and time columns.

## [0.8.0] - 2026-07-26

- DTP-012 (feat) Added the Reservations tab with Dining and Experience types.

## [0.7.1] - 2026-07-26

- DTP-011 (fix) The "park hours changed" confirmation now names which park changed.

## [0.7.0] - 2026-07-26

- DTP-010 (feat) Day Details became a per-day list of plans with ticketed-event support and automatic Extended Evening.
  No migration script; the local database had to be deleted (prototype data).

## [0.6.0] - 2026-07-24

- DTP-009 (feat) Added the Travel Details tab for flights.
  Also dropped the airlines lookup for free text (migration 003) and fixed several smaller bugs.

## [0.5.2] - 2026-07-24

- DTP-008 (refactor) Cleaned up linter findings in `eslint.config.js` and two `useEffect` dependency arrays.

## [0.5.1] - 2026-07-24

- DTP-007 (fix) Moved the day-details backfill out of startup into a manual migration, and fixed error mapping and validation layering.
  Migration 002 required.

## [0.5.0] - 2026-07-24

- DTP-006 (feat) Added the Day Details tab with park hours fetched from themeparks.wiki.

## [0.4.1] - 2026-07-24

- DTP-005 (fix) Made draft saves atomic and closed an overlap-check race.

## [0.4.0] - 2026-07-24

- DTP-004 (feat) Added the hotel suggestion picker, overlap and date validation, an error modal, and Lucide icons.

## [0.3.0] - 2026-07-24

- DTP-003 (feat) Added the hotels lookup table with on-property and Extended Evening flags.
  Migration 001 required.

## [0.2.0] - 2026-07-23

- DTP-002 (feat) Added trips, the app shell with multi-tab workspace, and the Trip Details form.

## [0.1.0] - 2026-07-23

- DTP-001 (feat) Initial scaffold: Tauri 2, React, Vite, TypeScript, SQLite, and the `StorageProvider` trait.
