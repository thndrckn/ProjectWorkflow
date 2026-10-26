---
name: design-change
description: Start a change that needs thinking through. Claims the change number, shows the backlog once, runs Matt's grilling interview, helps decide small or large, then starts the right planning command itself. Writes no code.
disable-model-invocation: true
---

# Design a change

First step of the workflow: **design** → plan → code → merge. Nothing is coded here and no file is written except the number claim.
The change prefix and other settings come from CLAUDE.md. Never enter plan mode.

## 1. Claim the number
Follow "Claim the change number" in the `plan-small-change` skill exactly (same rules, same placeholder file). Tell Jason the number and show `/rename <NUMBER>` (only Jason can run it).

## 2. Backlog, once
Read `docs/BACKLOG.md`. If it has entries, show them all in one list (title, where found, severity, what is wrong) and ask which, if any, to include in this change. Say nothing if it is empty. Included items are carried into the plan.

## 3. Interview
Run Matt's `mattpocock-skills:grilling` skill on the request, unchanged. If the request is a bug report, find the root cause with `mattpocock-skills:diagnosing-bugs` first.

## 4. Small or large
Matt's test: can it be built in one session? Recommend **small** or **large** with a one-line reason, and let Jason pick (question box, recommended option first).

## 5. Hand on
Start the matching skill in this same chat, passing it the number, the interview's answers and the included backlog items: `plan-small-change` or `plan-large-change`. Jason types nothing extra.
