# PWF-029: Finish adopting the workflow in ProjectWorkflow

**Type:** chore
**Merge danger:** two-way door (text and config files, all in git); small blast radius (documentation, plus the setup files Matt's skills read; no code, hook or lock change)
**Level:** Light
**Branch:** `chore/PWF-029-finish-adopting-the-workflow`
**Commit message:** `chore(PWF-029): finish adopting the workflow in ProjectWorkflow`

## What you'll see change

1. **Matt's one-time setup is done here.** The folder `docs/agents/` appears with a note saying issues live as plain files under `.scratch/` (the local markdown tracker), and CLAUDE.md gets a short "Agent skills" block pointing at it. `adopt.sh` stops saying "ALMOST DONE" for this project.
2. **`docs/POLICY.md` describes the new commands** (`/design-change`, `/plan-small-change`, `/plan-large-change`, `/code-change`, `/merge-change`, `/build-changes`) and the new review (one narrow re-review, then you decide) instead of the old `/plan-change` and `/commit-change` and the three-round review loop. Claude makes this edit as part of the change; you approve the text below through this plan and the review.
3. **CLAUDE.md gets PowerShell forms** of the bash-only commands: turning the lock on, running `adopt.sh`, and the four checks.
4. **The hand-edit rule is gone.** `docs/POLICY.md` and `docs/PROCESS_BACKLOG.md` are changed through normal changes like any other file (as `docs/workflow-v2.md` decided). The sentence in CLAUDE.md saying you edit them by hand is removed.

## How this one differs from the usual

- **Matt's setup is a command only you can type** (`/setup-matt-pocock-skills`; Claude cannot start it). `/code-change` stops and asks you to type it in the change's worktree, then continues. In its questions, take the recommended answer each time, and choose **Local markdown** for the tracker. The triage-labels question appears only if the `triage` skill is installed; take the default.
- **`docs/POLICY.md` is edited by Claude** in `/code-change`, using the exact text under "Policy edits" below. Nothing for you to do by hand.

## Requirements

**R1. Matt's setup exists**
Given Matt's setup has been run on this branch, when I look in the repo, then `docs/agents/issue-tracker.md` exists and names local markdown (`.scratch/`) as the tracker, and `docs/agents/domain.md` exists.

**R2. CLAUDE.md points at the setup**
Given the setup has been run, when I read CLAUDE.md, then it has an `## Agent skills` section linking to those files, and every line of its Workflow and Rules sections is unchanged apart from the PowerShell forms (R6) and the Records line (edit 7).

**R3. adopt.sh accepts this project**
Given R1 holds, when `adopt.sh` is run on this repo with a stand-in `claude` program (as `test-adopt.sh` does), then it prints "Done" and does not print "ALMOST DONE".

**R4. POLICY.md names the new commands**
Given the policy edits are made, when I search `docs/POLICY.md` for `/plan-change` and `/commit-change`, then neither is found, and `/design-change`, `/plan-small-change`, `/plan-large-change`, `/code-change`, `/merge-change` and `/build-changes` are each named.

**R5. POLICY.md describes the new review**
Given the policy edits are made, when I read its Peer review section, then the level (Light or Full) is chosen from merge danger rather than change type, Light is Standards and Spec reviewers and Full adds a Correctness reviewer, there is one narrow re-review (not up to three rounds), there is no `Review format` marker, and the user decides anything still disputed.

**R5a. The hand-edit rule is gone**
Given the change is made, when I search CLAUDE.md and `docs/POLICY.md` for "by hand", "edited by hand" and "Policy edits for you", then none is found; POLICY.md says it and `PROCESS_BACKLOG.md` are changed through normal changes. And the guard still blocks only edits on the default branch: an edit to `docs/POLICY.md` on a change branch is allowed.

**R6. PowerShell forms are in CLAUDE.md**
Given the change is made, when I read CLAUDE.md, then the lock on/off commands, `adopt.sh`, and the four checks each have a PowerShell form next to the bash form, and each form gives the same result as the bash one.

**R7. The existing checks still pass**
Given all edits are done, when the four checks in CLAUDE.md are run, then all pass (the only validate notes being the directory-only README and LICENSE ones).

## Checks

| Req | Test |
|---|---|
| R1 | Manual: list `docs/agents/`, read `issue-tracker.md`. Reason: the file is written by Matt's skill from your answers, so reading it is the check. |
| R2 | Manual: `git diff` of CLAUDE.md shows exactly three things and nothing else: the new `## Agent skills` block, the PowerShell lines (R6), and the changed Records line (edit 7). |
| R3 | Automated: a new case in `test-adopt.sh` runs `adopt.sh` on a throwaway project that has the `docs/agents/issue-tracker.md` file and expects "Done". |
| R4 | Automated: `grep -c` for the two old commands (expect 0) and each of the six new ones (expect at least 1), the output pasted into the review record. |
| R5 | Manual: read the Peer review section against `docs/workflow-v2.md`. Reason: it is wording, not a pattern. |
| R5a | Automated: `grep -n -i` for the three phrases (expect none) in both files. Guard: I read `hooks/block-main-edits.sh` and found no rule naming POLICY.md or the shared folder (only the default-branch check), and `bash hooks/test-block-main-edits.sh` already covers edits on a branch being allowed; the review record notes both. |
| R6 | Manual: run the read-only forms (`status` and the four checks) in a PowerShell terminal and compare with bash. The lock-install and `adopt.sh` forms change your git and plugin settings, so you run those two yourself; Claude checks them by reading. Reason: no PowerShell test harness exists here, and adding one is out of scope. |
| R7 | Automated: the four checks from CLAUDE.md, each as its own command. |

## What could go wrong / what gets lost

- Matt's setup edits CLAUDE.md. The lock refuses a check-in that loosens its own settings there; R2 checks that the diff only adds.
- The PowerShell forms could be subtly wrong (quoting, Windows paths). R6 runs the read-only ones and has you run the other two.
- The setup may also offer a glossary or `docs/adr/`. `docs/workflow-v2.md` decided against a glossary, so `/code-change` stops and asks you if the setup proposes one.
- Nothing is deleted. The old POLICY text stays in git history.

## Not included

- Moving the Matt pin, or changing any skill, hook or the lock.
- A PowerShell test harness.
- The other backlog items (guard checks the session's branch, the lock not catching trunk moving backwards, and so on).
- Other projects' CLAUDE.md or POLICY imports (they adopt the workflow in their own changes).

## Backlog items fixed

- **docs/POLICY.md still describes the old commands** (`docs/BACKLOG.md`). `/merge-change` removes it from the backlog.

## Policy edits (made by Claude in `/code-change`, approved by you here)

Edits 1 to 6 are in `docs/POLICY.md`; edit 7 is in CLAUDE.md. Replace each OLD with its NEW.

**1. "Workflow model": the four numbered steps and the sentence introducing them.**

OLD: from `Every project is run like a professional software shop.` through the end of step 4 (the line starting `4. **Check in** (`/commit-change`...`).

NEW:
> Every project is run like a professional software shop. Every change goes through four steps, in order, and nothing reaches the default branch without all four. The design is `docs/workflow-v2.md`.
>
> 1. **Design and plan** (`/design-change`, or `/plan-small-change` / `/plan-large-change` typed directly): the change gets its number, the user is shown the project backlog once, the change is thought through by interview, and the user approves a written plan. A change that fits in one session is a small change; a bigger one gets a spec and numbered tickets (`NNN.1`, `NNN.2`, ...).
> 2. **Code** (`/code-change`, started only by the user): the work happens in a worktree on the change's own branch, test-first, never on the default branch. A large change is coded one ticket at a time.
> 3. **Review** (part of `/code-change`): reviewers independent of the author check the work (Light: Standards and Spec; Full: also Correctness). The author fixes or explains each finding, then one fresh reviewer checks only those outcomes. Anything still disputed goes to the user, who decides.
> 4. **Check in** (`/merge-change`, started only by the user): the trunk lock checks the review record, and the branch is merged into the default branch only if it passes.
>
> A version is made later by `/build-changes` (started only by the user).

**2. "Workflow model": the paragraph beginning `This file, `PROCESS_BACKLOG.md` and anything else in the shared conventions folder`.**

NEW (replaces the whole paragraph):
> This file and `PROCESS_BACKLOG.md` live in `docs/` of the ProjectWorkflow repo. They are changed through normal changes like any other file: planned, approved by the user in the plan, coded on a branch and reviewed.

**3. "Change numbers", first bullet.** Replace `(`/plan-change`)` with `(`/design-change`, or `/plan-small-change` / `/plan-large-change`)`. Add at the end of the bullet: `A large change's tickets are numbered NNN.1, NNN.2, ... under the change's number.`

**4. "Committing", third bullet.** Replace the whole bullet with:
> A change is **checked in** when `/merge-change` merges its branch into the default branch. Nothing is pushed until the user says so.

**5. "Peer review": the Depth, Reviewers, Settling, Re-review, Continuing and Record paragraphs.** The **When** and **Scope** paragraphs and the `**Where a "why" is written down:**` paragraph stay as they are. Check against `docs/workflow-v2.md`: the old **Depth** (by change type, "at least two passes") and **Reviewers** (fresh reviewers, author never rates, "caused" label rules) describe the old multi-reviewer review, so both are rewritten; **Continuing a change** (appending rounds) is replaced by the last sentence of Re-review below.

NEW, in this order (**Depth**, **Reviewers**, then the rest), with the **Where a "why" is written down** paragraph kept after **Reviewers**:
> **Depth**, by merge danger (the definition in Matt's `pr` skill: the door, one-way or two-way, and the blast radius), chosen by the user from the planner's recommendation when the plan is written, not by change type:
> - **Light** (a two-way door and a small blast radius): Matt's `code-review`, a Standards reviewer and a Spec reviewer.
> - **Full** (a one-way door or a wide blast radius; when unsure, Full; changes to the lock or guard are always Full): the same two plus a Correctness reviewer.
>
> **Reviewers:** fresh reviewers that see only the diff, the approved plan and the project's standards, never the author's reasoning. The author does not review its own code and does not have the last word on a finding. Each finding gets a severity (Informational, Nit, Low, Medium or High) and a "caused by this change: yes/no" label from the reviewer; the author may not change either, and disagrees by saying so in the record.
>
> **Settling findings:** the author fixes each finding, explains why it is not a problem, or logs it in `docs/BACKLOG.md`. Each finding is written up in the user's format: severity, "caused by this change", a plain-English description and a recommendation. A finding this change caused must be fixed or explained, never logged.
>
> **Re-review:** one round. A fresh reviewer is given only the findings and the code changed to address them. It confirms each fix and checks each finding that was explained instead of fixed. Anything it still disputes goes to the user with both sides in plain English, and the user decides. `/code-change` run again on an existing branch continues the change; earlier findings are never rewritten.
>
> **Record:** each change (and each ticket) gets a review record at `docs/reviews/<number>-<title>.md` with the level, the findings and their outcomes, who decided any dispute, and a trace table (requirement, test, result). The trunk lock checks the record is complete before the default branch moves. It cannot prove the user made a decision; the user's approval of the review is that proof.

Also remove any remaining mention of `Review format`, `PEER_REVIEW.md` and rounds, and the "Settled by the user" phrase, from the section.

**6. "Before starting any task".** Replace `Every change starts with `/plan-change`.` with `Every change starts with `/design-change`, `/plan-small-change` or `/plan-large-change`.`

**7. CLAUDE.md, Records line.** Delete the sentence `` `docs/POLICY.md` and `docs/PROCESS_BACKLOG.md` are the shared policy and process backlog, moved in from `D:/projects/shared-claude-conventions` by PWF-028; Jason edits them by hand.`` and put in its place: `` `docs/POLICY.md` and `docs/PROCESS_BACKLOG.md` are the shared policy and process backlog (moved in from `D:/projects/shared-claude-conventions` by PWF-028); they change through normal changes.``

## Original request

```
Finish adopting the workflow in ProjectWorkflow: run Matt’s one-time setup (local markdown tracker), update docs/POLICY.md to the new commands, and add PowerShell forms of the bash commands (lock install, adopt.sh) to CLAUDE.md.
```
