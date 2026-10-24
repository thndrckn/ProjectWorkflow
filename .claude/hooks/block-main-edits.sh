#!/bin/bash
# PreToolUse hook: blocks Claude from editing files while on master/main.
# Covers the edit tools and, via shell-command-check.js, the Bash and PowerShell tools.
# Always allowed, even on master:
#   - plan files directly inside this project's docs/plans/ (written by /plan-change)
#   - shell commands that pass the check: an allow-list of git subcommands, and no
#     file writes into the project.
# The shell check is best-effort pattern matching, not a sandbox: it does not look
# inside scripts or interpreters (node -e, python -c, ...). See shell-command-check.js.

proj="${CLAUDE_PROJECT_DIR:-.}"
input=$(cat)

# Lowercase, forward-slash form, so Windows (D:\...) and Git Bash (/d/...) paths compare equal.
norm() {
  local p
  p=$(cygpath -u "$1" 2>/dev/null || printf '%s' "$1")
  printf '%s' "$p" | tr '\\' '/' | tr '[:upper:]' '[:lower:]'
}

tool=$(printf '%s' "$input" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try { process.stdout.write(String(JSON.parse(s).tool_name || "")); } catch (e) {}
});' 2>/dev/null)

if [ "$tool" = "Bash" ] || [ "$tool" = "PowerShell" ]; then
  branch=$(git -C "$proj" rev-parse --abbrev-ref HEAD 2>/dev/null)
  # Only master/main is let through unguarded on a named branch. An unreadable branch
  # or a detached HEAD (rev-parse prints "HEAD") fails closed, same as being on master.
  if [ -n "$branch" ] && [ "$branch" != "HEAD" ] && [ "$branch" != "master" ] && [ "$branch" != "main" ]; then
    exit 0
  fi
  # The checker normalises the path itself, so hand it the project directory as is.
  p=$(cd "$proj" 2>/dev/null && pwd)
  # Git Bash rewrites path-like arguments for native programs, which would change $p
  # (and /tmp paths); turn that off for the project path and give node a Windows-form
  # script path (cygpath -m) so it can still find the checker.
  here=$(cygpath -m "$(dirname "$0")" 2>/dev/null || dirname "$0")
  verdict=$(printf '%s' "$input" | MSYS2_ARG_CONV_EXCL="*" node "$here/shell-command-check.js" "$p" 2>/dev/null)
  case "$verdict" in
    allow) exit 0 ;;
    *)
      echo "BLOCKED: You are on '${branch:-an unknown branch}' and this command is not allowed there (${verdict#block: }). Create a feature branch from the default branch first (git switch -c <type>/<short-description>) before changing files or committing. Never change the default branch." >&2
      exit 2
      ;;
  esac
fi

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
  echo "BLOCKED: You are on '${branch:-an unknown branch}'. Create a feature branch from the default branch first (git switch -c <type>/<short-description>) before editing any files. Never edit on the default branch." >&2
  exit 2
fi

exit 0
