# Review: PWF-014 — Keep the request that "plan it now" sets aside

- **Change:** PWF-014
- **Review format:** accountability
- **Plan:** docs/plans/PWF-014-keep-set-aside-request.md (approved in commit 36afedd)
- **Branch:** chore/PWF-014-keep-set-aside-request
- **Reviewer:** independent Standards, Spec and Correctness reviewers; two re-review rounds by fresh reviewers
- **Scope:** diff of chore/PWF-014-keep-set-aside-request against master — 3 files (two skill files and the plan), about 80 lines

## Findings

- **[Medium]** A request containing backtick fences or several lines could be broken or altered when written into the plan or the report — plan-change and commit-change skills (Correctness; also raised as a Nit by Spec and Standards)
  **Caused by this change:** yes
  **Disposition:** fixed (both skills now say to use a fence longer than any backtick run in the request, or a tilde fence; the report puts `/plan-change ` and the request on the same line, further lines unchanged)

- **[Low]** "Word for word" did not say to take the request from the raw command arguments rather than a summary — plan-change skill
  **Caused by this change:** yes
  **Disposition:** fixed (now says raw command arguments, never a summary)

- **[Low]** "Not empty" was not defined for a whitespace-only request — plan-change skill
  **Caused by this change:** yes
  **Disposition:** fixed (empty means missing or only whitespace)

- **[Low]** Same-line paste of the command and the request was not specified — commit-change skill
  **Caused by this change:** yes
  **Disposition:** fixed (with the first finding)

- **[Nit]** The code block and "nothing comes after it" sit inside a list headed "tell the user in plain English" — commit-change skill
  **Caused by this change:** yes
  **Disposition:** explained (the bullet is the last in the list and states the ordering; plan R3 asks for the code block explicitly)

- **[Informational]** The plan is frozen after approval but the skill writes the section — both skills
  **Caused by this change:** no
  **Disposition:** explained (the section is written at planning time; commit-change only reads it)

- **[Informational]** The plan said "quote or fenced block"; the skill says fenced block only — plan-change skill
  **Caused by this change:** yes
  **Disposition:** explained (stricter and within the plan's intent; a fence is needed to keep the text verbatim)

- **[Informational]** "Last of all" ordering must be kept if later report bullets are added — commit-change skill
  **Caused by this change:** no
  **Disposition:** explained (observation only)

- **[Informational]** The empty-request test was left to judgement — plan-change skill
  **Caused by this change:** no
  **Disposition:** fixed (superseded by the whitespace definition above)

- **[Nit]** (raised in re-review round 1) The tilde alternative gave no rule for a request that itself contains tilde runs — both skills
  **Caused by this change:** yes
  **Disposition:** fixed (tilde fence must be longer than any tilde run in the request)

## Re-review

### Round 1
Triggered by the fixes and explanations above. The re-reviewer accepted every fix and explanation, and accepted the "no" labels on the observations. It reported "no new findings" but also raised the tilde Nit above, which counts as a new finding, so the round was not clean.

### Round 2
Checked the tilde fix and the consistency of the wording across the two skills. Accepted the fix, no new findings. Clean.

## Requirements trace
| Requirement | Test | Result |
|---|---|---|
| R1 | Read the plan-change skill: "Plan it now" records a non-empty request word for word under "Original request (set aside)" | Pass (checked by Claude) |
| R2 | Read the plan-change skill: the section is left out when "Plan it now" wasn't chosen or the request was empty | Pass (checked by Claude) |
| R3 | Read the commit-change report step: ends with a lead-in and a code block of `/plan-change` plus the recorded request | Pass (checked by Claude) |
| R4 | Read the commit-change report step: nothing added when the plan has no such section | Pass (checked by Claude) |
| R5 | Confirm the "needs its own `/plan-change`" reminder is still in the plan-change skill | Pass (checked by Claude) |

T3 (a live run at the next real "Plan it now") needs the user.

## Deviations from the plan
None.

## Summary
Both skills now keep the set-aside request word for word and hand it back as a paste-ready command at check-in, with rules that keep the text unaltered whatever it contains. All Rust and frontend checks passed (no app code changed). Two re-review rounds ran; the last was clean.
