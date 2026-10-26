# PWF-030: Make "lock on" mean one thing in this repo

**Type:** chore
**Merge danger:** two-way door (script and text changes, all in git); wide-ish blast radius (`adopt.sh` is what every project uses to adopt the workflow, and the lock is what protects trunk)
**Level:** Full (it changes how the lock is switched on)
**Branch:** `chore/PWF-030-lock-on-agrees-in-this-repo`
**Commit message:** `chore(PWF-030): adopt.sh refuses the workflow's own repo; one meaning of lock on`
**Comes after:** PWF-029. The backlog item this fixes, and the CLAUDE.md lines it extends, arrive with PWF-029. Code this only once PWF-029 is on trunk.

## What you'll see change

1. **The decision.** In ProjectWorkflow itself the lock runs from the repo's own `githooks/` folder. Other projects keep using `release/githooks`, set up by `adopt.sh`.
2. **`adopt.sh` refuses to run on the workflow's own repo** (the main folder or any of its worktrees). It stops with a plain line saying to run `bash githooks/install-trunk-lock.sh` instead, and changes nothing.
3. **CLAUDE.md says which is which**, so the lock's On, Off and status commands, `adopt.sh`, and `/merge-change`'s lock check all agree.

## Why this way

- CLAUDE.md, `install-trunk-lock.sh` and the lock's `status` command already all said "own `githooks/`". Only `adopt.sh` disagreed, because it was run here by mistake, and it left git pointing at `release/githooks`. That is why `/merge-change` read the lock as off.
- Own `githooks/` works from every worktree: each worktree has its own checked-out copy, so `status` reads the same everywhere. `release/` is untracked and exists only in the main folder, so the check would not find it from a worktree.
- The cost: a branch could carry its own weakened copy of the checker (already in the backlog as "A branch merged into trunk can carry its own copy of the lock"). Review is the protection, and lock changes are always Full.
- Not chosen: pointing this repo at `release/githooks` too. It would protect against that cost, but every lock command would have to find `release/` from a worktree first.

## Requirements

**R1. adopt.sh refuses the workflow's own repo**
Given a project folder that is the same git repository as the folder `adopt.sh` lives in, when `adopt.sh` is run on it, then it exits with an error, prints a line naming `bash githooks/install-trunk-lock.sh`, and sets no `core.hooksPath` and installs no plugin.

**R2. It refuses a worktree of that repo too**
Given a worktree of the workflow's own repo, when `adopt.sh` is run on that worktree, then it refuses the same way.

**R3. Other projects are unaffected**
Given a different git project, when `adopt.sh` is run on it, then it behaves as before (the existing adopt tests still pass).

**R4. "Lock on" agrees**
Given the lock was switched on with `bash githooks/install-trunk-lock.sh` in this repo, when `node githooks/trunk-lock-check.mjs status` is run in the main folder and in a worktree, then both report `Trunk lock: ON`.

**R5. CLAUDE.md says so**
Given the change is made, when I read the Trunk lock line in CLAUDE.md, then it says this repo uses its own `githooks/`, that `adopt.sh` refuses here, and that `release/githooks` is for other projects; and its On, Off and status commands are unchanged.

**R6. The lock's own settings are unchanged**
Given the change is made, when the lock checks the CLAUDE.md diff against the version before, then it finds no change to the default branch, change prefix, version files or starting number.

## Checks

| Req | Test |
|---|---|
| R1 | Automated: a new `test-adopt.sh` case makes the stand-in workflow folder a git repository and runs `adopt.sh` on it; expects exit 1, the words `install-trunk-lock.sh`, no `core.hooksPath`, and no `plugin install` in the stand-in's log. |
| R2 | Automated: the same test adds a worktree of that repository and runs `adopt.sh` on it; expects the same. |
| R3 | Automated: the existing `test-adopt.sh` cases (10) all still pass. |
| R4 | Manual: after you switch the lock on, I run `status` in the main folder and in the PWF-030 worktree and paste both outputs into the record. Reason: it depends on your real git setting, which Claude never sets. |
| R5 | Manual: read the Trunk lock line. Reason: wording. |
| R6 | Automated: `bash githooks/test-trunk-lock.sh` (it already tests that a check-in cannot loosen the lock's settings) passes, plus the gate for PWF-030. |

## What could go wrong / what gets lost

- If the "same repository" test were wrong, `adopt.sh` could refuse a real project, or accept this repo. R1 to R3 test both directions.
- The refusal message must be clear enough that a person who runs `adopt.sh` here by mistake knows what to do. The review reads the wording.
- Your current git setting (`release/githooks`) stays until you run `bash githooks/install-trunk-lock.sh` yourself. This change does not set it, and Claude never does.
- Nothing is deleted.

## Not included

- Changing the checker (`githooks/trunk-lock-check.mjs`) or `install-trunk-lock.sh`.
- Moving this repo's lock to `release/githooks`.
- The backlog item about a branch carrying its own copy of the lock.
- Making `release/` appear in worktrees.

## Check-in

Branch `chore/PWF-030-lock-on-agrees-in-this-repo`; commit message `chore(PWF-030): adopt.sh refuses the workflow's own repo; one meaning of lock on`.

## Backlog items fixed

- **adopt.sh and the lock check disagree on what "lock on" means in this repo** (`docs/BACKLOG.md`, added on the PWF-029 branch). `/merge-change` removes it from the backlog.

## Original request

```
Add a backlog item: in ProjectWorkflow itself, adopt.sh sets the lock to release/githooks but /merge-change’s lock check only accepts the repo’s own githooks, so the two disagree on “on”. Decide which this repo should use and make both agree. Plan it as PWF-030.
```
