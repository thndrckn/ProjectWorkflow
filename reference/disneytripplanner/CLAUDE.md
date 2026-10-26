@D:/projects/shared-claude-conventions/POLICY.md
@docs/DECISIONS.md

# DisneyTripPlanner — Claude Development Guide

## What this app is
A desktop Disney trip planner and visual schedule manager. Local-first desktop app built with Tauri 2 (Rust) + React + Vite + TypeScript + SQLite. No accounts, no telemetry. The only network activity is a deliberate, read-only fetch of park operating hours from themeparks.wiki, isolated in `external/park_hours_fetcher.rs` — no other network calls exist or should be added. Designed to easily transition to a Proxmox-hosted API backend without frontend rewrites.

---

## Workflow
This project follows the Workflow model in the shared policy.

- **Default branch:** `trunk`
- **Change prefix:** `DTP`
- **Commands:** `/plan-change` to start a change, `/code-change` to code and review it (run on an existing working branch, it continues that change, for example after `/commit-change` stops on a failed review gate), `/commit-change` to check it in, `/build-changes` to turn the waiting changelog entries into a version and build the installer. Only the user starts `/code-change`, `/commit-change` and `/build-changes`.
- **Checks (all must pass):** run each as its own command.
  - `cd src-tauri && cargo test`
  - `cd src-tauri && cargo clippy --all-targets -- -D warnings`
  - `cd src-tauri && cargo fmt --check`
  - `npm run lint` (also enforces the TypeScript convention rules in `eslint.config.js`)
  - `npm run check:conventions` (the Rust, CSS, migration and cross-file convention rules)
  - `npm run build:vite`
- **Checks (only when relevant):** `npm run test:pdf` when the itinerary or PDF changed; `npm run test:conventions` when `eslint.config.js`, `scripts/check-conventions.mjs` or `tests/conventions.mjs` changed.
- **Build command:** `npm run build`
- **Version files:** `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `package-lock.json`, `src-tauri/Cargo.lock`. The two lockfiles are regenerated with the tools after the version is set, never edited by hand.
- **Lockfile commands:** `npm install --package-lock-only` and `cargo check --manifest-path src-tauri/Cargo.toml`.
- **Installer location:** `src-tauri/target/release/bundle/`.
- **Data folder:** `data/`.
- **Database files to copy into a worktree:** `data/disney_trip.db`, plus `data/disney_trip.db-wal` and `data/disney_trip.db-shm` when they exist.
- **Backup before a migration:** Export All in the app, and copy `data/disney_trip.db`.
- **Migrations:** the folder is `migrations/`, numbered `NNN_name.sql`. The schema version is `CURRENT_SCHEMA_VERSION` in `src-tauri/src/database/sqlite_provider.rs`; it equals the highest migration number, and every script ends with `PRAGMA user_version = N;`.
- **Worktree folder:** `.claude/worktrees/<change number>`, for example `.claude/worktrees/DTP-101`. The folder name must end in the change number, because `npm run dev` picks the worktree's port from it.
- **Worktree setup:** `npm ci`, run in the worktree (never `npm install` there, which can rewrite `package-lock.json`).
- **Worktree check environment:** run the Rust checks (the `cargo` ones) with `CARGO_TARGET_DIR` set to the main folder's `src-tauri/target`, so worktrees share compiled work with the main folder. `npm run dev` deliberately does not: a worktree's app builds into its own `src-tauri/target`, because Windows cannot overwrite an app that is running, and the real app is. That folder goes when the worktree is removed.
- **Records:** plans in `docs/plans/`, review records in `docs/reviews/`. `CHANGELOG.md` is the master list of change numbers and versions. `docs/archive/PEER_REVIEW.md` is the archive of reviews before DTP numbering. `docs/BACKLOG.md` holds review findings that were neither fixed nor explained; every `/plan-change` puts each entry to the user.
- **Shared conventions folder:** `D:/projects/shared-claude-conventions` (holds `POLICY.md` and `PROCESS_BACKLOG.md`). It is edited by the user by hand only. Claude never edits it, by any route. The guard hook blocks the edit tools and shell writes there (including relative paths and `cd` it can follow) on every branch and in every worktree, as best-effort pattern matching like the rest of the guard: variables, `~` and interpreters (`node -e`) are not judged. The hook reads this line, with the path in backticks, to find the folder. With no line, or one it cannot read, the rule is off: the folder is then treated like any other folder outside the project, so the edit tools are blocked only while the project folder is on the default branch, and shell writes there are allowed. A change that needs the folder edited lists the exact old and new text in its plan under "Policy edits for you to make by hand". `/code-change` saves a before-copy of each file on the branch, stops until the user confirms the edit is made, and gives the reviewers the before-copy and the edited file.
- **Guard:** a hook in `.claude/hooks/` blocks Claude from editing files on the default branch, except plan files. It protects the names `trunk`, `master` and `main`, so renaming the default branch never leaves it unguarded. It also checks the Bash and PowerShell tools there: only an allow-list of git subcommands passes (including `git worktree add`, `list` and a plain `remove`), and writes into the project are blocked (best-effort pattern matching, not a sandbox). A worktree is judged by its own branch, not the main folder's, so work in a worktree on a change branch is not blocked, while the main folder stays protected from every chat, including one inside a worktree. Test it with `bash .claude/hooks/test-block-main-edits.sh` (in PowerShell, where bash isn't on the path, and with Git in its default folder: `& "C:\Program Files\Git\bin\bash.exe" .claude/hooks/test-block-main-edits.sh`).
- **Trunk lock:** a git hook (`.githooks/reference-transaction`, checker `.githooks/trunk-lock-check.mjs`) that refuses any update of the default branch that is not a proper check-in, by whatever route it arrives (merge, fast-forward, plain commit, cherry-pick, pull, `--no-verify`). Every commit new to the default branch must carry a change number (`type(DTP-NNN): …`) or be a `chore(release): vX.Y.Z` commit that changes only the version files and `CHANGELOG.md`; every change number from the starting number on needs a review record that passes the commit-change gate (the checker's `gate` mode is the gate `/commit-change` runs, and the same code the hook uses). Only the local default branch is guarded; other branches, remote-tracking refs and tags are never blocked. It fails closed, and a check-in cannot loosen the lock's own settings in this file (raise the starting number, add version files, change the prefix or default branch, raise or remove the review format 2 line). Switch it on once per copy with `bash .githooks/install-trunk-lock.sh` (in PowerShell, where bash isn't on the path, and with Git in its default folder: `& "C:\Program Files\Git\bin\bash.exe" .githooks/install-trunk-lock.sh`); `node .githooks/trunk-lock-check.mjs status` says whether it is on, and `/commit-change` and `/build-changes` stop if it is not. Every merge or correction commit on a branch must carry the change number in its message (for example `chore(<NUMBER>): catch up with <default branch>`), or the lock refuses the branch when it is merged. See "Trunk lock — turning it off by hand" below.
- **Trunk lock starts at:** `DTP-101` (the first change number the lock checks; older numbers and old-format review records are waved through).
- **Review format 2 required from:** `DTP-109` (the first change number whose review record must be in review format 2, with the header `Review format: accountability 2` and the fixed re-review lines; the lock and the gate refuse an old-format record, or one with no format marker, at or above it).
- **Parallel changes:** each `/code-change` works in its own worktree (see the worktree lines above) so several changes can be coded at once, each in its own chat. Planning still happens in the main folder on the default branch. `/commit-change` is typed in the coding chat, merges from the worktree and removes it afterwards.
- **Real data lives in dev:** the user runs the app with `npm run dev` for real trip planning, so `data/disney_trip.db` holds real trips. Use the app for real only on the default branch. Before running any migration, take the steps in "Backup before a migration" above. A worktree's app uses the worktree's own `data/`, empty unless the plan asked for a copy; it never opens the main folder's `data/`.

### Trunk lock — turning it off by hand (for the user only)
These steps are for the user, typed by the user in their own terminal, and only when the lock itself is broken (for example it refuses a check-in that is correct, or the checker crashes). **Claude never runs them, never sets or unsets `core.hooksPath` (by `git config`, `git -c`, or the `GIT_CONFIG_*` environment settings), and never loosens the hook or checker files outside a planned change.** The guard hook blocks those commands for Claude, on the default branch and from a worktree, and the shell check is best-effort, so the rule rests on this instruction too. There is no override setting and no bypass flag, on purpose.

- **Turn it off:** in the project folder, run `git config --unset core.hooksPath`. The default branch then accepts any commit again, with no checks, until it is switched on.
- **Turn it back on:** run `bash .githooks/install-trunk-lock.sh` (in PowerShell, where bash isn't on the path, and with Git in its default folder: `& "C:\Program Files\Git\bin\bash.exe" .githooks/install-trunk-lock.sh`), then `node .githooks/trunk-lock-check.mjs status`, which should say `Trunk lock: ON`.
- While it is off, `/commit-change` and `/build-changes` stop and say so. Fix the cause through the normal workflow (`/plan-change`, `/code-change`) and switch the lock back on before checking anything in.
- Changing the lock's own settings in this file (raising the lock's "starts at:" line, raising or removing the "Review format 2 required from:" line, adding version files, renaming the change prefix or the default branch) is refused as a check-in too, so each of those is done by hand with the lock off, then switched back on.
- A merge or pull the lock refuses can leave the working folder changed: run `git merge --abort` or `git reset --hard` to put it back. A `git revert` or any commit with git's own default message has no change number and is refused, so give it one.

---

## Architecture

```
React view → api.ts (invoke) → #[tauri::command] in commands.rs → StorageProvider / engine/* → SQLite
```

### Rust backend (`src-tauri/src/`)
- `database/models.rs` — all Rust structs that serialize to JSON for the frontend
- `database/traits.rs` — `StorageProvider` async trait (the abstraction boundary)
- `database/sqlite_provider.rs` — SQLite implementation of `StorageProvider`
- `database/mod.rs` — module exports
- `engine/time_snapper.rs` — datetime parse/format helpers, minute-level arithmetic
- `engine/date_validator.rs` — date parsing, validation, and calendar-date range enumeration
- `engine/schedule_builder.rs` — merges day_visits, reservations, and flights into the Itinerary tab's per-day, chronologically-sorted point-marker timeline
- `engine/flight_journey.rs` — flight-journey grouping, outbound/return run-splitting, layover-note derivation, and import-time `flight_group_id` remapping
- `engine/key_dates.rs` — Key Dates panel and All Trips overview computation (dining/Lightning Lane booking windows, overview card assembly)
- `engine/mod.rs` — module exports
- `commands.rs` — Tauri command definitions only. Commands are thin: call a `StorageProvider` or engine method, return the result. **No SQL in commands.rs. No data logic in commands.rs.**
- `external/park_hours_fetcher.rs` — the one isolated network dependency (themeparks.wiki). Degrades gracefully: an unrecognized park returns an empty result, never an error.
- `lib.rs` — Tauri builder wiring: plugins, managed state, invoke handler registration.

Errors are plain `Result<T, String>` throughout — `StorageProvider`, the engine layer, and every `#[tauri::command]` all use `String` as the error type, converted at the point of failure (`.map_err(|e| e.to_string())` or a literal message). There is no dedicated error-type module; a prior `AppError` enum was removed after it saw use in only 4 call sites, all immediately coerced to `String` anyway.

### Backup & restore
There is no raw database file copy. Backup/restore goes through `StorageProvider` like everything else, serialized to/from JSON — this is deliberate, since a mechanism tied to "the database is a literal file you can copy" doesn't survive the planned move to a Proxmox-hosted API backend, and a raw `.db` file isn't meaningful to a non-technical user anyway.

- `export_trip`/`import_trip` (`commands.rs`) — one trip's full data graph (`TripExport` in `models.rs`), for moving a single trip between installs or sharing it.
- `export_all`/`import_all`/`replace_all` (`commands.rs`) — every trip (`DatabaseExport`), the app's sole backup/restore mechanism. `import_all` merges (every trip in the file becomes a new trip, nothing existing is touched); `replace_all` wipes all existing trips first, then imports — both take an automatic timestamped safety export first.
- `engine/import_resolver.rs` — resolves a trip's denormalized park/ticketed-event names against this install's lookup tables at import time (name-based, not by raw id, since two installs' lookup tables can diverge), plus duplicate-trip detection.

### Schema version tracking

`database/sqlite_provider.rs` stamps every database with SQLite's built-in `PRAGMA user_version`, tracked 1:1 with migration file numbers (`user_version = N` means migrations through `NNN` have been applied). Freshness is determined by whether the `trips` table exists yet — not by file-existence, since `Connection::open` creates the physical file immediately, before any table does, so a file already on disk (e.g. left behind by a process killed before its own bootstrap ever committed) doesn't mean the database has real content. `SqliteProvider::new` runs the existence check, then (for a non-fresh database) the `CURRENT_SCHEMA_VERSION` check, *then* table creation and (only if fresh) the version stamp, all inside one transaction — so an interruption anywhere in that sequence leaves nothing committed, and a database rejected as outdated has nothing written to it at all (checked before `init_tables` runs, not after). None of this auto-applies anything — the `trips`-existence check only ever decides "fresh vs. not," never "what to alter," so it stays inside the spirit of the "never write in-app migration routines" line in the shared policy above even though it is, technically, a form of schema introspection.

**Every future schema-changing migration script must end with `PRAGMA user_version = N;`** matching its own file number, and `CURRENT_SCHEMA_VERSION` in `sqlite_provider.rs` must be bumped to match. Forgetting either half silently breaks this check (a script that changes schema but doesn't bump the pragma leaves the version stamp lying about what's actually applied).

**Every migration that creates a table — a brand-new one or a renamed one — must use `CREATE TABLE IF NOT EXISTS` (and a rename must additionally start with `DROP TABLE IF EXISTS <new_name>;` before the `ALTER TABLE ... RENAME TO`).** `init_tables()` in `sqlite_provider.rs` runs `CREATE TABLE IF NOT EXISTS` for every table on every launch, fresh database or not. `SqliteProvider::new` now checks an existing database's schema version *before* calling `init_tables`, which closes the main way this used to bite — but a binary predating that fix, or a dev server's file-watcher rebuilding mid-edit, can still launch against an un-migrated database and silently pre-create the table before any migration script runs, so a migration's own `CREATE TABLE` (or `DROP TABLE IF EXISTS` + rename) must tolerate that on its own rather than relying on launch-order alone. See `018_hotel_stays_rename.sql` (a rename), `023_lightning_lane_attractions.sql` and `025_airlines_lookup.sql` (brand-new tables) for migrations that hit this.

### Frontend (`src/`)
- `api.ts` — flat `api` object of thin `invoke()` wrappers. One line per command. No logic, no transformation. Never call `invoke()` directly in a view — always go through `api.ts`.
- `types.ts` — TypeScript interfaces mirroring Rust structs. When a Rust struct changes, this file must be updated to match.
- `main.tsx` — React root mount only.
- `App.tsx` — top-level layout and state coordination only.
- `components/` — pure display components.
- `utils.ts` — date/time display formatting only. No business logic.
- `confirm.ts` — the `showConfirm()` singleton confirm-dialog store.

---

## Storage Trait Standard
All database and data access operations must be abstracted behind the `StorageProvider` Rust trait in `src-tauri/src/database/traits.rs`.

- Tauri commands in `commands.rs` call methods on `&dyn StorageProvider` via `State<Arc<dyn StorageProvider>>`.
- Do not write direct `rusqlite` or SQL calls inside Tauri command handlers. They belong inside `sqlite_provider.rs`.

**Why this abstraction exists:** When this app moves to a Proxmox-hosted API backend for multi-user support, only `sqlite_provider.rs` gets replaced with a network-based implementation. `commands.rs`, the engine layer, and the entire frontend touch nothing.

### Database state
Single `Arc<dyn StorageProvider>` backed by `SqliteProvider` which wraps `Mutex<Connection>` — no connection pool.

---

## Adding a new feature — the required cycle
1. Add structs to `database/models.rs` if needed
2. Add method to `StorageProvider` trait in `database/traits.rs` if needed
3. Implement it in `database/sqlite_provider.rs`
4. Write any engine logic in `engine/*.rs`
5. Expose a `#[tauri::command]` in `commands.rs`
6. Register it in `invoke_handler!` in `lib.rs`
7. Add a one-line wrapper to `api.ts`
8. Add the TypeScript interface to `types.ts` if needed
9. Call it from the view

**Do not shortcut this cycle. Do not implement step 2 in JavaScript instead.**

---

## Data model — key tables
- `trips` — one row per trip; identity (name), arrival/departure dates, notes. Party size, hotel, and on-property/extended-evening eligibility moved to `hotel_stays` (see the "Split stays migration" note below) — a trip can have more than one hotel stay, each with its own perk eligibility.
- `hotel_stays` — one or more stays per trip; free-text `hotel` name plus an opportunistic `hotel_id` link into the `hotels` lookup table (resolved by case-insensitive name match, not enforced), each stay's own `start_date`/`end_date`, `on_property`, and `extended_evening_hours` flags. Perk eligibility for a given date is the OR across every stay touching that date (`schedule_builder::on_property_for_date`/`extended_evening_eligible_for_date`), not a single trip-level flag.
- `hotels` — seeded lookup table; `on_property` and `extended_evening_hours` flags per resort
- `airlines` — seeded lookup table; `flights.airline`/`flights.airline_id` follow the same free-text-plus-opportunistic-FK pattern as `hotel_stays.hotel`/`hotel_id` (see `resolve_airline`) — a deliberate choice over a locked-down dropdown/FK-only column, so an airline outside the seeded catalog remains valid free text. Superseded `003_flights_airline_text.sql`'s earlier all-free-text-only design.
- `parks` — seeded lookup table; `has_early_entry` flag
- `ticketed_event_types` — seeded lookup table; each event's home park and fixed early-entry clock time
- `day_details` / `day_visits` — one `day_details` row per calendar day of a trip; `day_visits` is a variable-length ordered list of stops (park or ticketed event) for that day
- `reservations` / `reservation_types` — dining/experience/Lightning Lane bookings, typed via lookup table
- `cached_park_hours` — per-trip, per-park, per-date copy of what themeparks.wiki last returned; `day_visits` blank hour fields are filled from it (`backfill_day_details_from_cache`). Its `MAX(fetched_at)` (`DayDetailsView.hours_last_updated`) drives the open-time staleness check in `DayDetailsSection.tsx` — deliberately, not `trip_park_hours_status.checked_at`: a trip whose hours aren't published has no cached rows, so it re-checks on every open and fills in by itself the moment Disney publishes, instead of waiting out a week after each empty check. Don't "fix" this to use `checked_at`.
- `trip_park_hours_status` — one row per trip with `checked_at` (a fetch completed, even an empty one) and `updated_at` (a fetch actually changed the trip's day details); the Day Details footer shows whichever is more recent. Stamped atomically with the cache write and backfill in `apply_fetched_park_hours` / `overwrite_park_hours_from_cache`, never by a separate call. Deliberately not part of trip export/import, same as `cached_park_hours` — an imported trip reads "Never" until its first check.
- `flights` — one row per flight leg, both directions share the same shape

**`hotels`, `airlines`, `parks`, `ticketed_event_types`, and `reservation_types` are lookup tables** per the Lookup tables policy.

### `day_visits` — read this before touching itinerary/schedule logic
A day can have any number of visits in sequence (park-hopping). Early Entry, Extended Evening, and the "day starts/ends here" marker logic in `schedule_builder.rs` all depend on which visit is first/last in that sequence — see the Domain engine section below before changing visit ordering or the schedule-building rules.

---

## Domain engine — critical concepts

### Itinerary schedule building
The stop/rules logic lives in `engine/schedule_builder.rs`. Do not reimplement this logic anywhere — not inline, not in JS.

- **Early Entry:** for a regular park visit, it's `park open time minus 30 minutes`, gated on the park's `has_early_entry` flag and on whether any `hotel_stays` row touching that date has `on_property` set (`schedule_builder::on_property_for_date` — an OR across every stay covering the date, not a single trip-level flag; see the `hotel_stays` row above). For a ticketed event, it's a fixed clock time from `ticketed_event_types.early_entry_time` — never an offset, and never gated on `on_property`, since it's a perk of the ticket, not the resort stay.
- **Extended Evening:** only on the last visit of the day, only when that date's stay eligibility (`schedule_builder::extended_evening_eligible_for_date`, same per-stay-OR rule as Early Entry) is true, and only when the visit's `extended_evening_start` is present at all — deliberately *not* an exact match against the visit's regular close time. An exact-match rule was tried and dropped: `extended_evening_start` and `close` are independently editable/backfilled and can drift apart without either one being wrong (see `schedule_builder.rs`'s `extended_evening_still_applies_when_start_time_has_drifted_from_close` test). Never applies to a ticketed event.
- Exactly one marker per day ever gets the "day starts here" / "day ends here" (green/red) treatment — see the code comments in `schedule_builder.rs` for which marker wins in each case before changing this.

### Time arithmetic
Datetime and date-range math lives in `engine/time_snapper.rs` and `engine/date_validator.rs`, hand-rolled prior to the shared dependency policy being loosened — well-tested against leap years and month/year boundaries, so it's correct as-is and doesn't need to change just because a library exists. If this logic needs to grow more complex, or if new date-heavy features come up, adding `chrono` is now the encouraged move per the shared policy rather than something to avoid — no need to ask first, just note it in the commit.

---

## Datetime helpers
**Rust:** parse and format through dedicated helpers in `engine/time_snapper.rs` and `engine/date_validator.rs`.

**JavaScript:** always use a dedicated parse helper from `utils.ts`.

---

## Icons
This app imports icons directly from `lucide-react` per file (e.g. `import { DatabaseBackup, FilePlus2 } from 'lucide-react'` in `App.tsx`). There is currently no centralized icon wrapper module. If icon usage grows past a handful of ad hoc imports, consider centralizing following LockedIn's `components/Icon.jsx` pattern — but do not extract one without explicit instruction per the subcomponent threshold policy.

---

## Visual identity — dark mode only
There is no light mode. No toggle. No `prefers-color-scheme`. The palette is fixed:

| Token | Value | Role |
|---|---|---|
| `--bg` | `#1a1a1a` | Page background |
| `--surface` / `--surface-2` / `--surface-3` | `#242424` / `#2e2e2e` / `#383838` | Depth layers |
| `--border` | `#3a3a3a` | All dividers and outlines |
| `--accent` | `#1a6fc4` | Blue — buttons, active states |
| `--accent-hover` | `#2d8de0` | Hover on accent |
| `--success` | `#2aaa70` | Positive indicators |
| `--danger` | `#d05050` | Destructive actions |
| `--text` / `--text-muted` / `--text-faint` | `#f0ede8` / `#a8a49e` / `#6a6660` | Three-tier text hierarchy |

**Typography:** Segoe UI / system-ui at 13px base. Section labels are 10px uppercase with `letter-spacing: 0.08em`.

---

## Data protection — files specific to this app
In addition to the shared data-protection policy, this app's `data/` directory contains:
- `data/disney_trip.db` — the live database.
- `data/disney_trip_export_pre_import_*.json` — automatic safety-net exports, one written before every `import_all`/`replace_all` runs. Not clutter to clean up.

---

## Running locally
```bash
npm install
npm run dev        # starts Vite dev server + Tauri
```
```bash
cd src-tauri && cargo test   # Rust unit tests
```

DB is created automatically at `data/disney_trip.db` (dev) or in a `data/` directory next to the exe (release).

---

## What not to do (in addition to shared policy)
- Do not put SQL queries or data logic in `commands.rs` — they belong in `sqlite_provider.rs` or the engine
- Do not implement engine logic (snapping, schedule building, conflict checking) in JavaScript
- Do not add network calls beyond the existing themeparks.wiki fetch
- The mechanically checkable rules in this file and the shared policy (`invoke()` only in `api.ts`, thin `api.ts` wrappers, no `new Date(text)`, no `window.confirm`, no inline styles, SQL only in `sqlite_provider.rs`, network code only in `external/`, commands registered and wrapped, `types.ts` field names matching `models.rs`, migration rules from 018 on, dark-only palette) are enforced by `npm run lint` and `npm run check:conventions`. Never switch a rule off to get a change through: a legitimate exception goes in the rule's commented allow-list (`eslint.config.js`, or the lists in `scripts/check-conventions.mjs`) and is explained in the review record.
