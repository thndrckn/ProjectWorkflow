# PWF-027: Extraction records — verification record

**This is not a reviewer review.** No independent reviewers looked at PWF-027. It was done by hand because ProjectWorkflow has no workflow set up yet, so /code-change's review step could not run. This record lists the check run for each requirement and the result seen, so the change can be audited the same way as the others.

- **Plan:** `docs/plans/PWF-027-extraction-records.md`, approved by Jason on 2026-10-26
- **Checked in:** `13d584f` on 2026-10-26
- **Record added:** after check-in. The check-in message says "there is no review record". That was true when it was written. This record was added afterwards, once the gap was noticed.
- **Who:** Jason ran each step on his machine. Claude wrote the steps and checked each result before the next one.

## Requirements trace

| Req | What it requires | Check run | Result |
|---|---|---|---|
| R1 | `docs/HISTORY.md` gives source, cut point, the PWF-to-DTP table, what was left out and why, the dropped commits, and how the renumbering was done | Counted rows in the repo after check-in. Confirmed PWF-001's check-in by its parent: `97bc1b6` is PWF-001's last work commit ("record approval of the .gitignore and hook-parsing deviations"), so `4de4b9d` is the check-in. | 26 table rows, 7 dropped commits listed, all sections present. Pass |
| R2 | `docs/history/renumber_pwf.py` is unchanged from the version that ran | Compared the file fingerprint of `D:\Projects\renumber_pwf.py` with the repo copy | `True`. Pass |
| R3 | `CHANGELOG.md` holds only PWF-001 to PWF-026 in their existing format, a line saying where they came from, and a PWF-027 entry | Before sending, compared the 26 entries line by line with the original file. After check-in, counted entries in the repo. | 26 entries identical to the original. In the repo: 27 PWF entries (26 + PWF-027), 0 DTP entries. The top paragraph names DTP-086 to DTP-111 and `docs/HISTORY.md`. Pass |
| R4 | `docs/design.md` is the design, unedited | Compared the file fingerprint of `D:\Projects\design.md` with the repo copy. Confirmed it was the right file by its timestamp (2026-10-26 11:00:16, the same as the copy seen earlier) and its opening lines. | `True`. Pass |
| R5 | `reference/disneytripplanner/` holds the 7 files from archive commit `c7c1ece`, plus a README | Compared git's fingerprint of each file in the repo with the archive at `c7c1ece` | `archive: 7  reference: 7`, no differences. README present. Pass |
| R6 | The commit message says it was done by hand and why | Read the check-in message | Contains "Done by hand: ProjectWorkflow has no workflow set up yet…". Pass |

## Deviations and corrections

1. **Record added after check-in.** The plan did not list a verification record, and the gap was not noticed until after the check-in. It is added on its own branch and merged, without changing anything already checked in.
2. **First design-file check proved nothing.** The first comparison of the two design copies printed `True` while both files were missing. PowerShell compared two empty results. The real file was then found at `D:\Projects\design.md`, identified as the design, and compared properly (R4).
3. **Wrong commit count before check-in.** Claude said to expect 6 commits on the branch. There were 5, one for each part. The list itself was correct.
4. **Earlier guess corrected from the history.** Claude first said PWF-023 changed `scripts/dev.mjs`. The archive history showed PWF-015 and PWF-025 did, and the README uses the history.
5. **Not kept in the repo.** The filter tool's full commit maps (every old commit ID to its new one) were offered for `docs/history/` and not added. Pass 1's map is kept outside the repo in `D:\Projects\pwf-extraction-pass1`.

## Open items from this change

- ProjectWorkflow has no `.gitattributes`, so line endings are not fixed. This matters for the `.sh` hook files when the workflow is set up here.
- `docs/design.md` is out of date (for example, it still calls the setup change PWF-001). Updating it is the next change.
