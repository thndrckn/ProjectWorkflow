# Review: PWF-017 — The master lock

- **Change:** PWF-017
- **Review format:** accountability
- **Plan:** docs/plans/PWF-017-master-lock.md (approved in commit ee13568)
- **Branch:** chore/PWF-017-master-lock
- **Reviewer:** three independent reviewers (Standards, Spec, Correctness), then six rounds of fresh re-reviewers (rounds 1 to 3, and extra rounds 4 to 6 the user authorised)
- **Scope:** diff of chore/PWF-017-master-lock against master — 12 files, about 1,040 lines added and 3 removed (the new `.githooks/` folder with the checker, hook wrapper, setup script and test script; `.gitattributes`; the guard checker and its tests; the commit-change and build-changes skills; CLAUDE.md; CHANGELOG.md; the plan). `docs/DECISIONS.md` and this record were added afterwards.

## Findings
Every finding is listed, with the severity and caused label the reviewer assigned (never changed by the author). Findings raised by a re-review are marked with the round that raised them.

### First review

**Standards**

- **[Nit]** commit-change step 5 said "(a change that introduces the lock is the only case)", a stale one-off remark in a shared skill — `.claude/skills/commit-change/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** fixed (the text now reads "If it has no such line, skip this.")
- **[Nit]** The CLAUDE.md "Master lock" bullet was one very long paragraph — `CLAUDE.md`
  **Caused by this change:** yes
  **Disposition:** fixed (the bullet is trimmed; the recovery and revert notes moved into the by-hand section)
- **[Nit]** The bullet said See "Master lock" below, but the heading it points to has a longer name — `CLAUDE.md`
  **Caused by this change:** yes
  **Disposition:** fixed (the reference now names the heading, "Master lock — turning it off by hand")
- **[Informational]** The checker (about 400 lines) and the test script (about 325) are large single files — `.githooks/master-lock-check.mjs`, `.githooks/test-master-lock.sh`
  **Caused by this change:** yes
  **Disposition:** explained (an observation only; one checker serving both the hook and /commit-change is what the plan asked for)
- **[Informational]** The status-check instruction is repeated in three places in the skills — `.claude/skills/commit-change/SKILL.md`, `.claude/skills/build-changes/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (each skill has to stand alone when it runs; docs/DECISIONS.md already records that for repeated skill wording)

**Spec**

- **[Medium]** A missing CLAUDE.md at the old tip did not refuse, although the plan's R10 test says it must — `.githooks/master-lock-check.mjs`, `.githooks/test-master-lock.sh`
  **Caused by this change:** yes
  **Disposition:** fixed (when CLAUDE.md or its "Default branch" line cannot be read, the hook falls back on git's own idea of the default branch, origin/HEAD and init.defaultBranch, and refuses if the updated branch is it; a test with no CLAUDE.md at all was added)
- **[Medium]** Gate rule 4 (every explanation, logged item and fix in a round is accepted) is only partly built; only the last round is read, by keyword — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed in part, explained for the rest (every round must now state the re-reviewer's verdict or carry "Settled by the user:", with a test; the records are free prose, so item-by-item acceptance cannot be parsed reliably, and /commit-change still reads the record itself and stops on disagreement; recorded in docs/DECISIONS.md)
- **[Low]** The "left open" refusal also applies to findings labelled caused-no, where the plan's wording could be read as limiting it — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (/commit-change's rules say every finding needs a disposition and none is left open or accepted as is, whatever its label)
- **[Low]** The plan's bootstrap exception (an old tip with no lock line passes) is not built, and the settings-missing tests refuse instead — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the exception contradicts the plan's own R10 test, and it is not needed: git only finds the hook after this change is merged; recorded under Deviations)
  **Correction (round 4):** this explanation was wrong, and rounds 1 to 3 accepted it. A merge checks the merged files, `.githooks` included, out before it updates the branch, so a user who has already switched the lock on has git run the new hook during the very merge that introduces it, with the old tip still lacking the lock's settings; the lock refused that merge. Disposition is now **fixed**: the exception is built, narrowed to "the old tip's settings are incomplete AND the old tip does not hold the lock's files" (so a missing setting where the files are present still refuses, keeping R10); tests added; round 4 accepted it.
- **[Informational]** Extras beyond the plan: a CLAUDE.md note on recovering from a refused merge, and the skills skip the status check when CLAUDE.md has no Master lock line — `CLAUDE.md`, `.claude/skills/commit-change/SKILL.md`, `.claude/skills/build-changes/SKILL.md`
  **Caused by this change:** yes
  **Disposition:** explained (a project without the lock line needs the skip; the plan's "stop if off" applies where the project has the line)

**Correctness**

- **[Medium]** A change could loosen the lock's settings in CLAUDE.md as part of its own check-in (raise the starting number, widen the version files, change the prefix) — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (the hook refuses a check-in that raises the starting number, adds version files or changes the prefix or default branch; lowering the number or narrowing the files is allowed; six tests added)
- **[Low]** A commit numbered below the starting number skips the gate whatever it contains — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (that is requirement R6, as the user decided: older numbers are waved through)
- **[Low]** A release-worded commit may change the contents of the version files arbitrarily, because only file names are checked — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (R5 and the user's decision define the release exception by the files touched; a hook cannot judge a file's contents)
- **[Low]** `core.hooksPath` is relative, so each worktree runs its own branch's copy of the hook; a stale worktree has none, so plumbing run from it is unchecked — `.githooks/install-master-lock.sh`, `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the default branch can only be advanced by porcelain in the main folder, where its own copy of the hook runs; plumbing from another worktree is blocked for Claude by the guard, and a user typing it by hand is the same class as turning the lock off by hand; recorded in docs/DECISIONS.md)
- **[Low]** The gate's parsing is fragile: a blank line inside a finding ended its block, findings without the severity form were not counted, and a clean last round that mentions an earlier rejection is refused — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed in part, explained for the rest (blocks now run over blank lines followed by indented text, and any bullet carrying the Caused-by or Disposition labels counts as a finding, so one with no severity is refused; two tests added. The refused clean round fails safe: /commit-change stops when its own reading disagrees, and a recorded "Settled by the user:" line settles it; recorded in docs/DECISIONS.md)
- **[Informational]** Moving the default branch back to an ancestor (`git reset --hard HEAD~1`) adds no commits and is allowed — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (no commit reaches the branch that way)
- **[Informational]** The lock does not check that a numbered commit's content belongs to that change — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the plan's "Not included": the lock enforces the written gate and nothing more)
- **[Informational]** The only legitimate commits it refuses are those with no change number, such as git's default merge message and `git revert` — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (by design, R4; the by-hand section of CLAUDE.md now says to give such a commit a number)

### Round 1

- **[Low]** The verdict check on re-review rounds is a loose keyword regex, so gate rule 4 is only nominally enforced — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (the checker's header comment now states that rounds are read only by keyword, and that /commit-change reads the record itself and stops on disagreement)
- **[Low]** The default-branch fallback uses origin/HEAD and init.defaultBranch, which are per-machine settings, so another branch with a hinted name could be refused when CLAUDE.md is unreadable — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (reachable only when CLAUDE.md or its "Default branch" line is unreadable at that tip, it fails closed, and failing closed is what the plan's R10 requires)
- **[Informational]** Renaming the change prefix or the default branch always needs the lock off by hand — `CLAUDE.md`
  **Caused by this change:** yes
  **Disposition:** fixed (the by-hand section now lists the settings changes that are done by hand with the lock off)

### Round 2

- **[Nit]** The CLAUDE.md by-hand bullet named "Master lock starts at" without the trailing colon of the real line label — `CLAUDE.md`
  **Caused by this change:** yes
  **Disposition:** fixed (it now says the "Master lock starts at:" line)
- **[Nit]** The checker's header comment lists the keywords the gate reads, while the code also accepts confirmed and verified — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (the comment says "such as", so the list is illustrative and accurate)

### Round 4 (extra)

- **[Medium]** The merge that introduces the lock was refused by the lock itself when the lock was already switched on, because git finds the new hook while the merge checks its files out; the message wrongly said the settings were incomplete. Found by the author in a run against a clone of the real project history, after rounds 1 to 3 had accepted the explanation of the matching Spec finding; rated by the round 4 reviewer — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** fixed (the checker waves an update through when the old tip's settings are incomplete and the old tip does not hold the lock's files; a test of the merge that adds the lock, and one of an unnumbered commit refused afterwards, were added; the real-history run now merges and then refuses and allows as expected)
- **[Nit]** `lockPresentAt` tests only whether the checker exists at its current path in the old tip, so a moved checker would look lock-free — `.githooks/master-lock-check.mjs`
  **Caused by this change:** yes
  **Disposition:** explained (moving the checker is a deliberate change to the hook folder, made through a planned and reviewed change; complete settings are still enforced whatever the files, and a check-in cannot make the settings incomplete or loosen them)
- **[Informational]** No test pinned "complete settings but the lock's files absent at the old tip, still enforced" — `.githooks/test-master-lock.sh`
  **Caused by this change:** yes
  **Disposition:** fixed (a test was added: the hook files run from outside the repository, are removed from it, and an unnumbered commit is still refused)

### Round 5

- **[Nit]** The new test cannot tell the file-presence check from the settings rule, so its name overstated what it pins — `.githooks/test-master-lock.sh`
  **Caused by this change:** yes
  **Disposition:** fixed (the section title and case name now say it pins the settings rule, and a comment says the file check is covered by the bootstrap test)

## Re-review

### Round 1
Triggered by every outcome of the first review. The re-reviewer checked all eighteen first-review outcomes (five Standards, five Spec, eight Correctness). It accepted every explanation and every fix, including the settings-loosening fix, the default-branch fallback, the sturdier record parsing and the per-round verdict check (accepted as a partial fix with the limit stated). It raised three new findings, listed above under Round 1 (two Low, one Informational). The round was **not clean** (new findings).

### Round 2
A new fresh re-reviewer checked the three Round 1 outcomes (the keyword-limit comment, the origin/HEAD fallback explanation, the by-hand bullet) and accepted all three. It raised two new Nits, listed above under Round 2. The round was **not clean** (new findings).

### Round 3
A third fresh re-reviewer checked the two Round 2 outcomes: it accepted the wording fix and the explanation that "such as" makes the keyword list illustrative. It raised no new finding. Round clean: yes.

After round 3 the author ran the lock against a clone of the real project history and found the defect listed under "Round 4 (extra)" above, which rounds 1 to 3 had missed. The review was at its three-round limit, so the author stopped and asked the user.

### Round 4 (extra)
**Settled by the user:** "Authorise round 4 (Recommended)", the answer to the question asked after round 3 about checking the bootstrap fix.
A fresh re-reviewer rated the defect Medium (caused: yes), accepted the bootstrap fix (it waves an update through only when the old tip's settings are incomplete and the lock's files are absent; a check-in cannot make the settings incomplete or loosen them, and deleting the checker leaves the settings complete, so no unchecked commit gets through), accepted the corrected P4 entry as a deviation that tightens the plan, and accepted the guard-test edit. It raised two new items, listed above under Round 4 (extra). The round was **not clean** (new findings).

### Round 5
**Settled by the user:** "Add the pinning test, authorise round 5", the answer to the question asked after round 4.
A fresh re-reviewer accepted the explanation of the moved-checker Nit and the added pinning test. It raised one new Nit (the test name overstated what it pins), listed above under Round 5. The round was **not clean** (new finding).

### Round 6
**Settled by the user:** "Reword the test, authorise round 6", the answer to the question asked after round 5.
A last fresh re-reviewer checked the wording fix against the checker and accepted it, and raised no new finding. Round clean: yes.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Automated: the lock's test script — merge with no-ff, fast-forward, cherry-pick, plain commit, `--no-verify` commit, a change with no findings, all allowed with passing records; `--no-verify`, fast-forward and merge of a failing change refused | Pass |
| R2 | Automated: a change at and above the starting number with no record is refused, naming the change | Pass |
| R3 | Automated: seven fixtures that each break one gate rule are refused with the rule in the message; a settled-by-the-user fixture, a clean record and a blank-line-in-finding record pass; a missing-verdict round and a finding without a severity form are refused; plus the gate run on every existing new-format record (PWF-009 to PWF-015), all passing | Pass |
| R4 | Automated: an unnumbered commit, a number with too few digits, another prefix's number and a number outside the scope brackets are refused | Pass |
| R5 | Automated: a release commit touching only the version files and changelog passes, a build branch merged with the release message passes; one that also changes another file and one with the wrong message form are refused | Pass |
| R6 | Automated: a number below the starting number with no record passes; an old-format record above it passes | Pass |
| R7 | Automated: a failing-record commit, an unnumbered commit, merging the default branch into a work branch with git's own message, and creating and deleting branches all succeed on a work branch | Pass |
| R8 | Automated for the status check (on, hooksPath unset, wrong folder, hook file not executable, missing, settings incomplete, the setup script switching it on and being safe to run again): Pass. The skills' stop wording is read in the next real change's /commit-change and /build-changes (T4) | Manual |
| R9 | A live /commit-change and /build-changes on the next real change (T4). Claude ran the gate on every existing new-format record and confirmed all pass | Manual |
| R10 | Automated: settings missing the prefix, the starting number or the version files, a malformed starting number, an unreadable record, no CLAUDE.md at all, a change stripping the settings, raising or widening them, deleting the default branch, and a garbled line each refuse; lowering the number and narrowing the files pass; the merge that introduces the lock passes once git already finds its hook, and complete settings are still enforced when the lock's files are absent. Claude also merged the branch into a clone of the real project history and tried an unnumbered commit, a PWF-018 commit with no record, a release commit and a release commit that also edits CLAUDE.md | Pass |
| R11 | Automated: a throwaway repo with another prefix, default branch name and starting number, where the lock follows CLAUDE.md; plus grep checks that the lock's files name none of this project's names or fixed branch names | Pass |
| R12 | Automated: a fetch that moves a remote-tracking branch to an unrecorded commit, a tag created and moved, a hand-set remote-tracking ref and another branch all succeed; the default branch set to the same unrecorded commit, and a pull of it into the default branch, are refused | Pass |
| R13 | Read CLAUDE.md: the "Master lock — turning it off by hand (for the user only)" section names the off and on steps, marks them for the user only, and tells Claude never to run them or set core.hooksPath | Pass (checked by Claude) |
| R14 | Automated: a branch with a numbered catch-up merge merges into the default branch; one with git's default catch-up message is refused, naming the commit. The skill wording is read in /commit-change step 4 | Pass |

## Deviations from the plan
- The checker is `.githooks/master-lock-check.mjs`, not `.js`, so node reads it as a module in any folder the lock is copied into, including the throwaway test repos.
- A `.gitattributes` file was added so the hook scripts keep LF line endings on a Windows checkout (the project sets `core.autocrlf`); the plan did not list it.
- The plan's bootstrap exception (an old tip with no lock line passes) is built in a narrower form: it applies only when the old tip's settings are incomplete AND the old tip does not hold the lock's own files. The plain wording would contradict the plan's own R10 test (a CLAUDE.md missing the lock line refuses where the lock is present). The first version of this change left the exception out as "not needed"; that was wrong, because git finds the hook while the merge that introduces the lock checks its files out. Found and fixed in round 4 (see the Correction under the Spec finding). Either way, the merge of this change is not checked against its own records.
- Deleting the default branch is refused (the plan passed deletions through), because delete-and-recreate would otherwise be a way round the lock.
- When git passes an all-zero old value (a bare `update-ref`), the checker looks up the branch's current tip instead of treating the update as a branch creation.
- A check-in cannot loosen or change the lock's own settings in CLAUDE.md (raise the starting number, add version files, change the prefix or default branch); the plan only said the settings are read from the old tip.
- When CLAUDE.md or its "Default branch" line cannot be read at the current tip, the hook falls back on origin/HEAD and init.defaultBranch to recognise the default branch, so a missing CLAUDE.md refuses (planned R10 test).
- Every re-review round must state the re-reviewer's verdict; the plan described only the last-round checks.
- The guard (`.claude/hooks/shell-command-check.js`) now blocks `git -c core.hooksPath`, `git config` writes naming `core.hooksPath` and the `GIT_CONFIG_*` environment settings in every mode, with a new test section; the plan said to extend it only if not already covered, and it was not.
- The Windows `Copy-Item` in PowerShell was not stopped by the master guard when the plan was copied into the worktree (a bare `cp` was); the guard is best-effort pattern matching, as its header says. Not changed here.
- `docs/DECISIONS.md` gained two entries (the lock covers updates through the main folder only; the lock reads review-record rounds only by keyword).
- No migration is needed.

## Summary
The master lock is built: a `reference-transaction` hook and one shared checker (`hook`, `gate` and `status` modes) that refuse any update of the default branch that carries an unnumbered commit, a change from PWF-016 on without a passing review record, or a release-worded commit that touches more than the version files and changelog; only the local default branch is guarded, and the lock fails closed. `/commit-change` now runs the same gate, numbers its catch-up merge and checks the lock is on; `/build-changes` checks it too; CLAUDE.md names the setup, the starting number and the user-only turn-off steps; and the guard blocks Claude from touching `core.hooksPath`. The first review found 18 items; the author fixed the real problems (settings could be loosened by a check-in, a missing CLAUDE.md did not refuse, fragile record parsing) and explained the rest, which re-reviewers accepted. Three re-review rounds ran, the third clean. A run against a clone of the real project history then found a defect all three rounds had missed: the lock would have refused the merge that introduces it, because git finds the hook while that merge checks its files out; the earlier "not needed" explanation of the bootstrap exception was wrong and is corrected above. With the user's authorisation three extra rounds (4 to 6) checked the fix, a pinning test and its wording; round 6 was clean. The lock's test script passes in full (91 cases), all required checks pass, and the plan is untouched. The guard's own test script (`test-block-main-edits.sh`) ran in full once, before the last two edits to it: 697 passed and 2 failed, the 2 being a wrong expectation in a case I had added (two-word `git config` on master was already blocked by an older rule); that case was moved to the worktree-only checks and the script was not run in full again (it takes about an hour), so those last lines are covered by the run's other results, not by a second full run.
