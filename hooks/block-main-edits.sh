#!/bin/bash
# PreToolUse hook: blocks Claude's edit tools (Edit, Write, MultiEdit, NotebookEdit) while the
# folder being edited is on the default branch (trunk, or the older names master/main).
# Shell commands are not checked: the trunk lock is the real protection of the default branch.
# Always allowed, even on the default branch: plan files directly inside this project's docs/plans/
# (the planning skills write them before the change has a branch).
# A worktree of this project is judged by its own branch, so work in one is not blocked.

proj="${CLAUDE_PROJECT_DIR:-.}"
input=$(cat)

# Lowercase, forward-slash form, so Windows (D:\...) and Git Bash (/d/...) paths compare equal.
norm() {
  local p
  p=$(cygpath -u "$1" 2>/dev/null || printf '%s' "$1")
  printf '%s' "$p" | tr '\\' '/' | tr '[:upper:]' '[:lower:]'
}

# The edited file's path (file_path, or notebook_path for notebooks), empty if it can't be read.
target=$(printf '%s' "$input" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try { const i = JSON.parse(s).tool_input || {}; process.stdout.write(String(i.file_path || i.notebook_path || "")); } catch (e) {}
}); ' 2>/dev/null)

abs_common() { git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null; }
branch_in() { git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null; }
proj_common_n=$(norm "$(abs_common "$proj")")

# branch_for <dir>: the branch of the worktree holding dir, when dir belongs to this project's
# repository; otherwise the project folder's own branch.
branch_for() {
  local c
  if [ -n "$1" ] && [ -d "$1" ] && [ -n "$proj_common_n" ]; then
    c=$(abs_common "$1")
    if [ -n "$c" ] && [ "$(norm "$c")" = "$proj_common_n" ]; then branch_in "$1"; return; fi
  fi
  branch_in "$proj"
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

# Judge the edit by the branch of the folder it lands in, with any '..' resolved first so a path
# can't climb out of a worktree into the main folder.
dir=""
if [ -n "$target" ]; then
  dir=$(cygpath -u "$target" 2>/dev/null || printf '%s' "$target")
  dir=$(realpath -m "$dir" 2>/dev/null || printf '%s' "$dir")
  while [ -n "$dir" ] && [ ! -d "$dir" ] && [ "$dir" != "/" ]; do dir=$(dirname "$dir"); done
fi
branch=$(branch_for "$dir")

# An unreadable branch fails closed, same as being on the default branch.
if [ -z "$branch" ] || [ "$branch" = "trunk" ] || [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
  echo "BLOCKED: You are on '${branch:-an unknown branch}'. Create a feature branch from the default branch first (git switch -c <type>/<short-description>) before editing any files. Never edit on the default branch." >&2
  exit 2
fi

exit 0
