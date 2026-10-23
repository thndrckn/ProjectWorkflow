#!/bin/bash
# PreToolUse hook: blocks Claude from editing files while on master/main.
# Always allowed, even on master:
#   - plan files directly inside this project's docs/plans/ (written by /plan-change)
# Not covered: file changes made through the Bash tool (sed -i, echo >, ...).
# See KNOWN_ISSUES.md.

proj="${CLAUDE_PROJECT_DIR:-.}"
input=$(cat)

# Parse the edited file's path (file_path, or notebook_path for notebooks) from the JSON
# properly, rather than grepping the raw text. Empty if it can't be read.
target=$(printf '%s' "$input" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try {
    const i = JSON.parse(s).tool_input || {};
    process.stdout.write(String(i.file_path || i.notebook_path || ""));
  } catch (e) {}
});' 2>/dev/null)

# Lowercase, forward-slash form, so Windows (D:\...) and Git Bash (/d/...) paths compare equal.
norm() {
  local p
  p=$(cygpath -u "$1" 2>/dev/null || printf '%s' "$1")
  printf '%s' "$p" | tr '\\' '/' | tr '[:upper:]' '[:lower:]'
}

# Allow plan files in this project's docs/plans, and nothing that climbs out with '..'
if [ -n "$target" ]; then
  t=$(norm "$target")
  p=$(norm "$(cd "$proj" 2>/dev/null && pwd)")
  case "$t" in
    *..*) ;;
    "$p"/docs/plans/*) exit 0 ;;
  esac
fi

branch=$(git -C "$proj" rev-parse --abbrev-ref HEAD 2>/dev/null)

# An unreadable branch fails closed, same as being on master.
if [ -z "$branch" ] || [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
  echo "BLOCKED: You are on '${branch:-an unknown branch}'. Create a feature branch from master first (git switch -c <type>/<short-description>) before editing any files. Never edit on master." >&2
  exit 2
fi

exit 0
