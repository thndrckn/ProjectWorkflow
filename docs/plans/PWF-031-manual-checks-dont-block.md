# PWF-031: Manual checks don't block check-in

**Type:** fix
**Merge danger:** two-way door (a script and a text change, all in git); small blast radius, but the change is to the review gate itself, which every check-in passes through.
**Level:** Full (it changes the gate)
**Branch:** `fix/PWF-031-manual-checks-dont-block`
**Commit message:** `fix(PWF-031): the gate accepts Manual as the result of a manual check`

## What you'll see change

1. **A manual check no longer stops a check-in.** A review record whose requirements trace has `Manual` as a result passes the gate, as long as everything else in the record passes.
2. **A manual check that was run still says so.** Its result is `Pass` or `Fail`, exactly as now. `Pass` passes, `Fail` still fails.
3. **`/code-change` says this.** The sentence that tells Claude to change `Manual` to `Pass` and says the lock refuses anything that is not a Pass is replaced. `Manual` now means "not run, not blocking"; if Jason runs the check, the result is `Pass` or `Fail`.

## Why this way

- This restores your earlier rule: you own manual testing, and check-in is your sign-off (see the "Dropped" items in `docs/PROCESS_BACKLOG.md`, items 6 to 8). PWF-028's gate was stricter than that rule.
- Only the exact word `Manual` (any capital letters) is newly accepted. Blank, "TBD", "n/a" and anything else still fail, so a forgotten result is not mistaken for a manual check.
- The checker and `release/githooks` are the same file. `release/` is not tracked in git, so only `githooks/` is changed; the release copy is refreshed the usual way.

## Requirements

**R1. Manual passes the gate**
Given a review record that is otherwise complete and whose trace row reads `Manual`, when the gate runs on it, then it reports passed.

**R2. Manual in any capitals**
Given a trace row reading `manual` or `MANUAL`, when the gate runs, then it reports passed.

**R3. A manual check that was run counts as run**
Given a trace row reading `Pass`, when the gate runs, then it passes; given a row reading `Fail`, then the gate fails with "failed its test".

**R4. Anything else still fails**
Given a trace row that is empty or reads something other than Pass, Fail or Manual (for example `TBD`), when the gate runs, then it fails with "no passing result".

**R5. Manual does not hide a failure**
Given a record with one `Manual` row and one `Fail` row, when the gate runs, then it fails.

**R6. The rest of the gate is unchanged**
Given the existing gate and lock tests, when they run, then they all still pass except the one that expected a `Manual` row to fail, which is changed by R1.

**R7. The skill says it**
Given `/code-change`'s record template and the sentence under it, when I read them, then they say `Manual` is accepted by the gate, and a manual check that was run is recorded as `Pass` or `Fail`.

## Checks

| Req | Check |
|---|---|
| R1 | Automated: in `githooks/test-trunk-lock.sh`, the existing "manual" case changes from expecting a failure to expecting `passed`. |
| R2 | Automated: new cases for `manual` and `MANUAL`. |
| R3 | Automated: new case for `Pass`; the existing `fail` case covers `Fail`. |
| R4 | Automated: new cases for an empty result and `TBD`, both expecting "no passing result". |
| R5 | Automated: new case with a `Manual` row and a `Fail` row. |
| R6 | Automated: all four checks from CLAUDE.md (`test-trunk-lock.sh`, `test-block-main-edits.sh`, `test-adopt.sh`, `claude plugin validate .`). |
| R7 | Manual: read the changed lines in `skills/code-change/SKILL.md`. Words cannot be tested by script. |

## What could go wrong / what gets lost

- The gate no longer forces anyone to look at a manual check before check-in. That is the point of this change; Jason's approval of the record is still the sign-off.
- A record could say `Manual` for something that was never checked and could have been automated. Review of the plan's Checks section is the protection, as before.
- Projects that already adopted the workflow keep the stricter gate until they refresh their copy of `release/githooks`.

## Not included

- No change to how Fail, findings, re-review or Level are judged.
- No change to the lock's own settings in CLAUDE.md.
- No re-opening the Dropped items in `docs/PROCESS_BACKLOG.md`.
- The backlog item about the "Original request (set aside)" label (added with this plan, not fixed by it).

## Check-in

- Branch: `fix/PWF-031-manual-checks-dont-block`
- Commit message: `fix(PWF-031): the gate accepts Manual as the result of a manual check`
- Files: `githooks/trunk-lock-check.mjs`, `githooks/test-trunk-lock.sh`, `skills/code-change/SKILL.md`, a line in `docs/DECISIONS.md`, `CHANGELOG.md`, the review record.

## Original request (set aside)

```
restore my rule that manual checks don’t block check-in. The gate accepts “Manual” as the result for a manual check. If a manual check was run, its result says so (Pass or Fail) as now. Level Full (it changes the gate).
```
