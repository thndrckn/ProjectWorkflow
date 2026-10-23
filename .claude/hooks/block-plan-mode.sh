#!/bin/bash
# PreToolUse hook: refuses EnterPlanMode. Plans are written directly by /plan-change.

echo "Plan mode isn't used in this project. Follow /plan-change instead." >&2
exit 2
