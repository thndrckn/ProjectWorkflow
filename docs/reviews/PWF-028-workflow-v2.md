# Review: PWF-028 — Workflow v2

- **Change:** PWF-028
- **Level:** Full
- **Plan:** docs/plans/PWF-028-workflow-v2.md
- **Reviewers:** Matt's `code-review` (Standards and Spec reviewers) and our Correctness reviewer, then one fresh re-reviewer, then one extra narrow check on the gate that Jason authorised
- **Scope:** `git diff trunk...HEAD` on branch pwf-028-workflow-v2 at the time of review (steps 1 to 7), about 37 files; docs/POLICY.md, docs/PROCESS_BACKLOG.md and docs/workflow-v2.md were copied or moved on purpose and not reviewed for content

## Findings

- **[Medium]** S1: adopt.sh points git at an absolute hook path, against the earlier PWF-017 decision — adopt.sh, docs/DECISIONS.md
  **Caused by this change:** yes
  **Recommendation:** record the new choice as a decision.
  **Outcome:** fixed (new DECISIONS entry for PWF-028 says the absolute `release/githooks` path replaces the relative one)
  **Re-review:** accepted

- **[Low]** S2: the code and merge skills lacked the missing "Backup before a migration" fallback — skills/code-change/SKILL.md, skills/merge-change/SKILL.md
  **Caused by this change:** yes
  **Recommendation:** state it in both.
  **Outcome:** fixed (both skills now say to ask Jason when CLAUDE.md has no such line)
  **Re-review:** accepted

- **[Low]** S3: DECISIONS entries describe skills that no longer exist — docs/DECISIONS.md
  **Caused by this change:** yes
  **Recommendation:** say what was replaced, dropped or kept.
  **Outcome:** fixed (the same new entry names them)
  **Re-review:** accepted

- **[Low]** S4: CLAUDE.md says there is no build command but /build-changes builds an installer — CLAUDE.md, skills/build-changes/SKILL.md
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (/build-changes is generic and reads each project's own CLAUDE.md; this repo ships a tag, not an installer)
  **Re-review:** accepted

- **[Nit]** S5: CLAUDE.md points to docs/HISTORY.md after design.md was superseded — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (HISTORY.md exists and is correct)
  **Re-review:** accepted

- **[Low]** S6: the branch names trunk, master and main are hardcoded in the guard — hooks/block-main-edits.sh
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (kept on purpose by the PWF-025 decision)
  **Re-review:** accepted

- **[Low]** S7: the enter-worktree steps are repeated in /code-change and /merge-change — skills/code-change/SKILL.md, skills/merge-change/SKILL.md
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (each skill must stand alone)
  **Re-review:** accepted

- **[Nit]** S8: terse variable names in the guard — hooks/block-main-edits.sh
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (carried over from the old script and matches the surrounding style)
  **Re-review:** accepted

- **[Nit]** S9: leftover fallback for the old master-lock-check.mjs file name — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** remove it.
  **Outcome:** fixed (removed)
  **Re-review:** accepted

- **[Informational]** S10: the backlog entry about the guard is vague and a comment in the guard contradicts it — docs/BACKLOG.md
  **Caused by this change:** no
  **Recommendation:** none needed.
  **Outcome:** explained (the wording is Jason's, as he dictated it)
  **Re-review:** accepted

- **[Low]** P1: the backlog still listed the removed shell-command-check.js — docs/BACKLOG.md
  **Caused by this change:** yes
  **Recommendation:** remove the obsolete entry.
  **Outcome:** fixed (entry removed)
  **Re-review:** accepted

- **[Low]** P2: /build-changes step 3 pointed at a review step that was removed — skills/build-changes/SKILL.md
  **Caused by this change:** yes
  **Recommendation:** reword it.
  **Outcome:** fixed (now "which commit the build should count from")
  **Re-review:** accepted

- **[Informational]** P3: the gate does not check the Plan and Reviewers header lines — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (R7 lists the failure cases and only Level is needed to read a record)
  **Re-review:** accepted

- **[Informational]** P4: CLAUDE.md sets the lock start at PWF-029 — CLAUDE.md
  **Caused by this change:** yes
  **Recommendation:** tell Jason.
  **Outcome:** explained (PWF-028 is built by hand; Jason was told, and its record is still checked with the gate)
  **Re-review:** accepted

- **[Nit]** P5: the checker still reads the older "Master lock" label — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (kept on purpose by the PWF-025 decision)
  **Re-review:** accepted

- **[Informational]** P6: the release tag sits at the step 7 commit — release/, adopt.sh
  **Caused by this change:** yes
  **Recommendation:** re-cut the tag at close-out.
  **Outcome:** explained (the tag is local and re-cut at close-out, before anything is pushed)
  **Re-review:** accepted

- **[Low]** C1: with the checker outside the project, two of the lock's fail-closed checks could never fire — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** count an outside checker as present.
  **Outcome:** fixed (done, with a new test)
  **Re-review:** accepted

- **[Low]** C2: the lock ignores the old .githooks location — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** none needed.
  **Outcome:** explained (resolved by the C1 fix; adopt.sh replaces the old setup)
  **Re-review:** accepted

- **[Low]** C3: a finding with no labels was skipped by the gate — githooks/trunk-lock-check.mjs
  **Caused by this change:** no
  **Recommendation:** make the gate refuse it.
  **Outcome:** fixed (the finding detector now matches `- [High] text` and the starred forms, with a test)
  **Re-review:** rejected
  **Decided by:** Jason
  The re-reviewer rejected the first fix because the plain form was still skipped. It was fixed again and Jason authorised one extra narrow check on the gate. That check confirmed the gate refuses `- [Sev] text`, `- *[Sev]* text` and `- **[Sev]** text` for all five severities, with or without a continuation line. It also found other unlabelled forms still skipped (lower-case severity, `*` or numbered bullets, indented bullets, heading-style findings, `***` emphasis); those predate this change and were then fixed by the stricter rule in G1.

- **[Low]** C4: moving trunk backwards is not caught by the lock — githooks/trunk-lock-check.mjs
  **Caused by this change:** no
  **Recommendation:** log it.
  **Outcome:** moved to backlog
  **Re-review:** accepted

- **[Low]** C5: the "update ends on a ticket commit" check used date order — githooks/trunk-lock-check.mjs
  **Caused by this change:** no
  **Recommendation:** use topological order.
  **Outcome:** fixed (`--topo-order`)
  **Re-review:** accepted

- **[Low]** C6: the guard hardcodes branch names and allows edits on a detached HEAD — hooks/block-main-edits.sh
  **Caused by this change:** no
  **Recommendation:** none needed.
  **Outcome:** explained (existing behaviour, same as S6)
  **Re-review:** accepted

- **[Low]** C7: adopt.sh treats any marketplace list containing "projectworkflow" as already added — adopt.sh
  **Caused by this change:** yes
  **Recommendation:** confirm the real output at the first adoption.
  **Outcome:** explained (Jason runs it and sees the output; the real format of `claude plugin marketplace list` is only known at the first real adoption, DTP-086)
  **Re-review:** accepted

- **[Informational]** C8: a branch merged into trunk can carry its own copy of the checker — githooks/trunk-lock-check.mjs
  **Caused by this change:** no
  **Recommendation:** log it.
  **Outcome:** moved to backlog
  **Re-review:** accepted

- **[Informational]** C9: with node missing, every branch update is refused — githooks/reference-transaction
  **Caused by this change:** no
  **Recommendation:** none needed.
  **Outcome:** explained (fail-closed by design)
  **Re-review:** accepted

- **[Low]** N1: on Windows a checker on another drive was still counted as "not present" — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** treat an absolute relative path as outside the project.
  **Outcome:** accepted by Jason (fixed after the re-review; Jason accepted the fix without another check)
  **Decided by:** Jason

- **[Nit]** N2: the "outside the project" test could be fooled by a file name starting with ".." — githooks/trunk-lock-check.mjs
  **Caused by this change:** yes
  **Recommendation:** match `../` or `..` exactly.
  **Outcome:** accepted by Jason (fixed after the re-review; Jason accepted the fix without another check)
  **Decided by:** Jason

- **[Low]** G1: the gate still skipped unlabelled findings written in other forms (lower-case severity, `*` or numbered bullets, indented bullets, headings, `***` emphasis) — githooks/trunk-lock-check.mjs
  **Caused by this change:** no
  **Recommendation:** refuse every Findings line that is not "None" or a well-formed finding.
  **Outcome:** fixed (the stricter rule, with a test for each of those forms; its backlog entry is closed as fixed by this change)
  **Re-review:** accepted
  Found by the extra narrow check on C3 and settled at Jason's direction. A second narrow check, on this gate change only, tried about 45 forms with LF and CRLF line endings: it refused every unlabelled or oddly written one, accepted every valid one, and found nothing that hides a finding. Its limits, none a defect: a trailing paragraph must be indented, an empty Findings section is accepted, and "None" followed by a note is refused.

## Re-review
One fresh re-reviewer checked 25 outcomes: it accepted 24 and rejected the C3 fix, and raised N1 and N2. So the round was not clean.

**Re-review clean:** no
**Decided by:** Jason
What Jason decided: N1 and N2 are accepted without another check. C3 was checked once more by a fresh reviewer, as an extra check on the gate that Jason authorised (not a full round); the result is in the C3 finding above. That check showed other unlabelled forms still slipped through, so Jason had the stricter rule put into PWF-028 (G1) and authorised a second narrow check of that gate change only, which was clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Listed the tree; `claude plugin validate .` passes apart from the directory-only README and LICENSE notes | Pass (checked by Claude) |
| R2 | Marketplace sha `49dd158` equals the installed plugin's commit | Pass (checked by Claude) |
| R3 | Six skills, longest 70 lines; Matt's skills called as `mattpocock-skills:…`; the official marketplace name appears in no skill | Pass (checked by Claude) |
| R4 | Read the three planning skills against the design | Pass (checked by Claude) |
| R5 | Read /code-change against the design | Pass (checked by Claude) |
| R6 | Read /merge-change and /build-changes against the design | Pass (checked by Claude) |
| R7 | Lock tests: a complete record passes and each failure case is refused (37 passed) | Pass (checked by Claude) |
| R8 | Lock tests: ticket numbers accepted, a ticket at the tip of trunk refused | Pass (checked by Claude) |
| R9 | `bash githooks/test-trunk-lock.sh`: 37 passed, about 28 seconds (not the few seconds hoped for) | Pass (checked by Claude) |
| R10 | Guard tests 9 passed; `shell-command-check` appears nowhere outside history | Pass (checked by Claude) |
| R11 | CLAUDE.md is 27 lines; `.gitattributes` forces LF for `.sh` files | Pass (checked by Claude) |
| R12 | Copies are byte-identical to the originals; the originals' hashes are unchanged | Pass (checked by Claude) |
| R13 | The guard backlog entry is in docs/BACKLOG.md | Pass (checked by Claude) |
| R14 | `bash test-adopt.sh`: 9 passed (stops and names /setup-matt-pocock-skills when the setup file is missing) | Pass (checked by Claude) |
| R15 | `release/` is a worktree at the local tag v0.1.0; `git check-ignore release` matches; no remote branch added | Pass (checked by Claude) |
| R16 | `test-adopt.sh` on a throwaway copy with a stand-in for the claude command: the lock is on and both plugins are installed from the marketplace | Pass (checked by Claude) |
| R17 | This record, from Matt's code-review plus our Correctness reviewer | Pass (checked by Claude) |
| R18 | Old records PWF-001 to PWF-027 unchanged (`git diff` empty); core.hooksPath never set by Claude; nothing pushed (no remote branch or tag added); verification record in docs/reviews/PWF-028-workflow-v2-verification.md, written before check-in; changelog entry present; check-in message to be read at check-in (see the verification record) | Pass (checked by Claude) |

## Deviations from the plan
- The spec's list: the plan keeps the spec frozen after approval, so findings carried from one ticket to a later one go in the large change's own review record, not in the spec. The skills and the lock follow this.
- R7 listed "Re-review clean: no" as always failing. It now passes when the record also says "Decided by: Jason", because otherwise a change could never be checked in after any new finding in its re-review.
- R9 hoped for a few seconds; the lock tests take about 28 seconds on this machine (Windows starts each git process slowly).
- R16 was tested with a stand-in for the claude command, so no real plugin or setting of Jason's was touched. The real install happens when Jason runs adopt.sh.
- Lock start is PWF-029 in CLAUDE.md; this was not in the plan.
- The tag v0.1.0 and `release/` are re-cut at close-out.

## Summary
28 findings: none High, one Medium (the hook-path decision, now recorded). Most were fixed or explained, two moved to the backlog, and the one rejected fix (C3) was fixed again and checked once more. The lock, guard and setup tests all pass; R18 closes in step 9.
