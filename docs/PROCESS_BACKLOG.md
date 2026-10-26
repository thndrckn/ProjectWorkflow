# Process Backlog

Ideas for improving the shared workflow (plan → code → review → check in).
This is not a defect list. Broken or limited things in a project go in that project's docs/BACKLOG.md.

How this file works:
- Add an idea any time, with the date and where it came from.
- Nothing here is acted on until a retro picks it.
- When an item is picked, it becomes a normal change with its own number in the project where it's built, and its status here says so.

Status values: Open | Planned (<change number>) | Done (<change number>) | Dropped (reason)

---

## 1. Requirements and traceability
- **Added:** 2026-10-23
- **Source:** Discussion during DTP-087
- **Status:** Done (DTP-088)

Plans state requirements as numbered Given/When/Then cases (R1, R2, …), signed off at play-back. Each requirement gets a test. The review record has a trace table (requirement → test → result), and any requirement without a passing test blocks check-in. Purpose: make "is it right?" checkable against what was approved.

DTP-088 built the requirements, planned tests and trace table. The check-in gate was left out; see items 6 to 8.

## 2. Pre-sorted review findings
- **Added:** 2026-10-23
- **Source:** DTP-087 review
- **Status:** Done (DTP-089)

The review sorts findings into groups before presenting them:
1. Against the plan → not fixed (the plan wins; a plan change is a new change).
2. Medium or High, not against the plan → fix.
3. Low or Informational, not against the plan → reviewer's recommendation (fix, explain, or log).
4. Anything unclear → the user asks for a plain-English explanation before deciding.

The user approves groups instead of judging each finding one at a time.

## 3. Review findings arrive as one big dump
- **Added:** 2026-10-23
- **Source:** DTP-086 / DTP-087 reviews
- **Status:** Done (DTP-089)

The review output is hard to take in all at once. This is the presentation side of item 2, and may be solved by it.

## 4. Bash edits on the default branch bypass the guard
- **Added:** 2026-10-23
- **Source:** DTP-086 review
- **Status:** Open (also in DisneyTripPlanner docs/BACKLOG.md)

The edit-blocking hook covers Edit and Write, but not file changes made through shell commands.

## 5. Check commands leave the shell in `src-tauri`
- **Added:** 2026-10-23
- **Source:** DTP-087 review, finding 1
- **Status:** Open

CLAUDE.md lists checks as `cd src-tauri && cargo test`, which leaves the shell in that folder for the next command. It was held back because the fix would change the approved plan's wording. Possible fix: use `--manifest-path` or a subshell. This one is specific to DisneyTripPlanner.

## 6. Check-in gate on the trace table
- **Added:** 2026-10-23
- **Source:** DTP-088 (left out of scope)
- **Status:** Dropped (User owns manual testing; check-in is the sign-off.)

`/commit-change` reads the trace table in the review record and stops if any requirement has no passing test. No waivers: a wrong requirement means a new change.

## 7. Record manual results at check-in
- **Added:** 2026-10-23
- **Source:** DTP-088 (left out of scope)
- **Status:** Dropped (User owns manual testing; check-in is the sign-off.)

`/commit-change` asks the user for the result of each "Manual" check, records the answer in the trace table, and commits it before the gate runs. This would be a second exception to "check-in never writes records", alongside the merge-conflict section. Depends on item 6.

## 8. Failed checks: resume on the same branch
- **Added:** 2026-10-23
- **Source:** DTP-088 (left out of scope)
- **Status:** Dropped (User owns manual testing; check-in is the sign-off.)

When a recorded Fail is the code's fault (the requirement is right), the fix goes back to `/code-change` on the same branch: fix, re-run checks and review, and retest. The Fail stays in the trace table, with the retest result as a new row after it. Needs a resume mode in `/code-change` that skips branch creation and the approved-plan commit. A wrong requirement still needs a new change. Depends on items 6 and 7.

## 9. Outside-git "before" copies are not enforced
- **Added:** 2026-10-23
- **Source:** DTP-088 review, finding F5
- **Status:** Open

`/code-change` tells Claude to save a copy of a file outside the repository before editing it, but nothing checks the order, and the copy is committed only with the records at step 9, so it sits uncommitted through the build and review. Possible fix: commit the copy as soon as it is saved, and check it differs from the file once edited.
