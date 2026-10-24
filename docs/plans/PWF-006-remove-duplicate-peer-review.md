# PWF-006 — Remove the duplicate peer review file

- **Change:** PWF-006
- **Date:** 2026-10-24

## What you'll see change
The leftover copy of the old peer review log at the top of the project folder is deleted. The same file is still kept in the archive folder, so the old reviews and the review records converted from it are unaffected. The app itself looks and works exactly the same.

## Requirements
- **R1.** Given the project has an identical peer review log both at the top level and in the archive folder, when the change is done, then the top-level file is gone and the archive copy is still there, unchanged.
- **R2.** Given other files refer to the archived peer review log, when the change is done, then none of them points at the removed top-level file, and no other file has changed apart from the changelog entry.
- **R3.** Given the app and its checks, when the change is done, then the app builds and all the checks still pass.

## What could go wrong / what gets lost
Nothing. The deleted file is byte-for-byte identical to the archive copy, and it stays recoverable from git history.

## Not included
- The archive copy is kept.
- The review records in the reviews folder are not touched.
- No wording changes elsewhere.

## How you'll check it
**T1 — The duplicate is gone, the archive copy remains. Covers R1, R2.**

1. Look at the top level of the project folder.
2. Look in the archive folder under docs.

Expected: no peer review file at the top level; the archive copy is still in the archive folder.

**T2 — Everything still works. Covers R3.**

1. Run the project checks.
2. Start the app.

Expected: all checks pass and the app opens normally.

## Check-in
- Type: chore
- Branch: chore/PWF-006-remove-duplicate-peer-review
- Commit message: chore(PWF-006): remove the duplicate PEER_REVIEW.md at the repo root

---

## Technical detail (for Claude)
- `git rm PEER_REVIEW.md` (root). Before deleting, confirm with `cmp PEER_REVIEW.md docs/archive/PEER_REVIEW.md` that it is still identical.
- Add a `CHANGELOG.md` entry under [Unreleased] in the existing format (no version bump).
- `CLAUDE.md`, `.claude/skills/code-change/SKILL.md`, `docs/reviews/*` and `docs/archive/RECORDS-INDEX.md` already refer to `docs/archive/PEER_REVIEW.md` or by bare name; the `eslint.config.js` line is a comment. None need editing. Re-grep after deletion for any link to the root path.
- No feature cycle steps apply (no Rust or frontend code, no schema).

**Planned tests**
- R1 — Manual: Claude runs `cmp` before deleting, then `ls`/`git ls-files` to confirm the root file is gone and the archive copy is present. Claude can run it itself.
- R2 — Manual: Claude greps for references to the root path and runs `git status`/`git diff --stat` to confirm only the deletion and the changelog changed. Claude can run it itself.
- R3 — Automated: the standard checks (`cargo test`, clippy, fmt, `npm run lint`, `npm run build:vite`). Nothing in them touches the file, so passing is expected.
