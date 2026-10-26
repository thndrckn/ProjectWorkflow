# ProjectWorkflow v2: design

**Status:** approved by Jason, 2026-10-26. Replaces `docs/design.md`. Input for PWF-028.

**Idea in one line:** Matt Pocock's skills do the work, and our thin wrappers give Jason his approvals, change numbers and records, at the lowest usage that keeps the audit trail.

## What Jason sees

You start every change with `/design-change`, then `/code-change` and `/merge-change`, plus `/build-changes`. The two planning commands are started for you.

**Small change** (fits in one session):
1. `/design-change`: answer the questions and agree it's small. It moves on to planning: pick Light or Full, approve the plan.
2. `/code-change`: it codes test-first and reviews; approve the review.
3. `/merge-change`: it checks in.

**Large change** (won't fit in one session):
1. `/design-change`: answer the questions, agree it's large. It pauses: *"Type `/to-spec`, then `/to-tickets`, then tell me **done**."*
2. Type those two, then say done. It numbers the tickets, picks a level for each with you, and you approve the spec and tickets together.
3. `/code-change NNN.1`, then `.2`, and so on. Each ticket is coded, reviewed and approved in turn.
4. `/merge-change`: trunk only gets the whole change once every ticket is done.

Every command ends by saying what to type next.

**Steps are skippable, the audit core is not.** Start wherever fits:
- `/design-change` when the change needs thinking through.
- `/plan-small-change` when you already know what to do, such as a bug fix or a small tweak. The design step is skipped.
- `/plan-large-change` when Matt's spec and tickets already exist.

Whichever you start with, the change still gets a number, an approved plan, a review, a record and a proper check-in.

## How each step works

### `/design-change`: the interview
1. Claims the next change number.
2. Shows the backlog once. Jason picks any items to include.
3. Runs Matt's `grilling` interview, unchanged. It asks in rounds, gives its recommended answers, looks up facts itself and confirms shared understanding.
4. Recommends **small or large** using Matt's test: *can it be built in one session?* Gives a one-line reason, and Jason picks.
5. Starts `/plan-small-change` or `/plan-large-change` itself, in the same chat. These are our skills, so `/design-change` can call them, and Jason types nothing extra. Either can also be typed directly, for example after a chat was cleared mid-plan.

Splitting it this way means each run reads only the instructions for its own path.

### `/plan-small-change`: started by `/design-change`, or typed directly (e.g. a bug fix)
1. If typed directly, claims the next change number and asks what the change is.
2. Records the change type (feat, fix, refactor, docs, chore).
3. Rates the **merge danger**, using the definition from Matt's `pr` skill:
   - **Door:** one-way (hard or impossible to undo, e.g. a database change or deleted data) or two-way (easy to walk back).
   - **Blast radius:** what else could break if it's wrong.
4. Recommends **Light or Full** from that, with a one-line reason, and Jason picks. A one-way door or a wide blast radius means Full. A two-way door with a small blast radius means Light. When unsure, it recommends Full. Changes to the lock or guard are always Full.
5. Writes the plan: numbered Given/When/Then requirements, a test per requirement, the type, the merge danger and the level.
6. Jason approves. It creates the change's branch and commits "approved plan" on it.
7. Ends: *"Next: `/code-change`."*

### `/plan-large-change`: started by `/design-change`, or typed directly
1. Pauses with: *"In this chat, type `/to-spec`, then `/to-tickets`, then tell me **done**."* These two are Matt's, and only Jason can start them.
2. When Jason says done, it carries on from where it stopped. If the chat was compacted or cleared in the meantime, typing `/plan-large-change` does the same thing: it finds the new spec and tickets and finishes. It then:
   - numbers the tickets **NNN.1, NNN.2, …** (fixing their "Blocked by" lines);
   - starts the spec's list;
   - rates each ticket's merge danger and recommends Light or Full from it, as for a small change, and Jason picks;
   - writes Given/When/Then for each ticket from the spec.
3. Jason approves the spec and the tickets together. It creates the change's integration branch and commits "approved spec" on it.
4. Ends: *"Next: `/code-change NNN.1`."*

### `/code-change`
1. Takes a small change's number or a ticket's number (NNN.1).
2. Opens a worktree on the change's branch. For a ticket, it creates the ticket's own branch off the integration branch, which merges back into it when approved. It then works in that worktree and codes with Matt's `tdd`, or, when the type is **fix**, with Matt's `diagnosing-bugs`: reproduce the bug reliably (usually a failing test) before touching the code, then fix it and keep that test as proof it stays fixed.
3. Reviews:
   - **Light:** Matt's `code-review` (a Standards reviewer and a Spec reviewer, each kept short).
   - **Full:** Matt's `code-review` **plus our Correctness reviewer**, for two different viewpoints.
4. Translates every finding into Jason's format: severity, "caused by this change", a plain-English description, a recommendation, and Jason's call where one is needed.
5. Fixes what should be fixed.
6. **Re-review, one round:** a fresh reviewer gets only the findings and the code changed to address them. It confirms each fix, and it checks each finding that was explained instead of fixed. Anything it still disputes goes to Jason with both sides in plain English, and Jason decides.
7. Writes the review record: level, findings, outcomes, who decided disputes, and the requirement → test → result trace table.
8. Jason approves the review. Large change: the ticket merges into the integration branch, and the next ticket is offered. Small change: *"Next: `/merge-change`."*

Each ticket of a large change is reviewed on its own. Small diffs give cheap reviews, and nothing waits until the end to be fixed.

### `/merge-change`
Kept from today: safety checks, catch-up merge, changelog entry, the gate, the `--no-ff` merge, push and worktree cleanup.

Changed:
- Only whole numbers go to trunk. For a large change, the gate requires every ticket's record to have passed and the spec's list to have no open findings: each one fixed, accepted by Jason, or moved to the project backlog.
- The final report ends with the set-aside request, if there was one.

### `/build-changes`
Version, tag and installer. **No review step.** Code is reviewed before check-in, and the build is tested by Jason.

## Backlogs

- **Project backlog** (`docs/BACKLOG.md`): work and findings that belong to no open change. It is shown once at each `/design-change`.
- **A spec's list** (inside a large change's spec): its tickets, plus findings carried from one ticket to a later one. It must have no open findings before the change goes to trunk.

## Protection (kept, simplified)

- **Trunk lock:** refuses any update of trunk that isn't a proper check-in. Its checker is rewritten for the new, smaller review record and accepts `NNN.N` ticket numbers.
- **Guard hook:** blocks Claude's direct edits on trunk.
- **Plan mode blocked.**

## Removed

| Removed | Why |
|---|---|
| Our Standards and Spec reviewers | Matt's `code-review` does both. In the PWF-019 comparison it found 4 correctness bugs ours missed, at lower cost. |
| Full re-review rounds (up to 3, fresh reviewers each time) | Replaced by one narrow re-review, then Jason. This was the second-largest cost. |
| Separate fixed play-back | `grilling` already confirms shared understanding, and Jason approves the written plan. |
| Shell-command check in the guard (644 lines) | The lock is the real protection. |
| Shared-folder hand-edit rule | The shared policy moves into ProjectWorkflow. |
| Integration review at build | Reviews happen before check-in. |
| Our copy of the grilling method | We call Matt's instead, so we get his fixes. |
| Fixed re-review lines | Replaced by the simpler record. |

## Kept from ours

Change numbers, the approved-plan commit, Given/When/Then with a test per requirement, the set-aside request, worktrees, the changelog, `DECISIONS.md` and "why" comments, the gate, the lock, the guard, and plain-English output throughout.

## Not used from Matt

- `grill-with-docs` and its glossary. A glossary was decided against earlier, and `DECISIONS.md` already holds the decisions.
- `implement-spec`'s single review at the end. We review per ticket instead.
- `wayfinder`, `triage`, `retro`. They are available to type directly, but not part of the workflow.

## Matt's version is pinned

ProjectWorkflow's own marketplace lists Matt's plugin at a fixed commit (verified: a marketplace entry with a `sha` checks out exactly that commit). His skills change only when the pin is moved, which is a normal PWF change that gets tested. The official copy is removed so the skills aren't installed twice. `adopt.sh` checks that the pinned plugin is installed.

## Evidence behind this

- **Pinning:** checked against the Claude Code plugin docs and the files on Jason's machine.
- **Local files:** Matt's setup writes the spec and tickets as plain files, which a wrapper can renumber. Checked from the skill text and a hand run; the rename itself is untested.
- **Review comparison**, on PWF-019 (DTP-104), round 0:
  - ours found 19 and his found 10;
  - 6 were found by both;
  - the 13 only ours found were all Low, Nit or Info;
  - his 4 unique findings were correctness bugs;
  - **one sample, nothing run.**

## Known risks

1. **Matt changes his file layout.** The ticket renumbering could break. The pin plus a test when moving it covers this.
2. **The translation is done by instructions,** so a record can come out malformed. The lock refuses it at check-in.
3. **The levels and reviewer counts rest on one sample.** Note what each real Disney change's reviewers catch, and adjust after about ten changes.

## Rollout

1. **PWF-028**, built by hand: this design plus the plumbing (plugin packaging, marketplace with the pin, `release/`, `adopt.sh`, a short CLAUDE.md, `.gitattributes`, the shared policy moved in, the lock turned on by Jason).
2. **DTP-086:** DisneyTripPlanner adopts it. This is the first real-code pilot.
3. Spoolkeeper adopts it.
4. LockedIn does its prework, then adopts it.

Backlog entry to add: the guard checks the session's own branch, not the folder being written to.
