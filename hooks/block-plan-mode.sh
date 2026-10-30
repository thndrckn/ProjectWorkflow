#!/bin/bash
# PreToolUse hook: refuses EnterPlanMode. Plans are written directly by /plan-small-change and /plan-large-change.
# Only in a project that has adopted the workflow (see adopted.sh); elsewhere plan mode is left alone.

. "$(dirname "$0")/adopted.sh"
workflow_adopted "${CLAUDE_PROJECT_DIR:-.}" || exit 0

echo "Plan mode isn't used in this project. Follow /design-change or /plan-small-change instead." >&2
exit 2
