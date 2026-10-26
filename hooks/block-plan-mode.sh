#!/bin/bash
# PreToolUse hook: refuses EnterPlanMode. Plans are written directly by /plan-small-change and /plan-large-change.

echo "Plan mode isn't used in this project. Follow /design-change or /plan-small-change instead." >&2
exit 2
