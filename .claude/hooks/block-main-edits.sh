#!/bin/bash
# PreToolUse hook: blocks Claude from editing files while on master/main.
# Covers the edit tools and, via shell-command-check.js, the Bash and PowerShell tools.
# Always allowed, even on master:
#   - plan files directly inside this project's docs/plans/ (written by /plan-change)
#   - shell commands that pass the check: an allow-list of git subcommands, and no
#     file writes into the project.
# Worktrees: a worktree of this project is judged by its own branch, not the main
# folder's. Work in a worktree on a change branch is not blocked, but while the main
# folder is on master it stays protected from every chat, including one inside a worktree.
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

# jget <tool|cwd|target>: one field of the hook input, empty if it can't be read.
jget() {
  printf '%s' "$input" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try {
    const j = JSON.parse(s), i = j.tool_input || {}, k = process.argv[1];
    const v = k === "tool" ? j.tool_name : k === "cwd" ? j.cwd : (i.file_path || i.notebook_path);
    process.stdout.write(String(v || ""));
  } catch (e) {}
}); ' "$1" 2>/dev/null
}

abs_common() { git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null; }
branch_in() { git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null; }
# Only a named branch other than master/main is let through. An unreadable branch or a
# detached HEAD (rev-parse prints "HEAD") fails closed, same as being on master.
guarded() { [ -z "$1" ] || [ "$1" = "HEAD" ] || [ "$1" = "master" ] || [ "$1" = "main" ]; }

proj_common=$(abs_common "$proj")
proj_common_n=$(norm "$proj_common")

# branch_for <dir>: the branch of the worktree holding dir, when dir belongs to this
# project's repository; otherwise the project folder's own branch (the old behaviour).
branch_for() {
  local c
  if [ -n "$1" ] && [ -d "$1" ] && [ -n "$proj_common_n" ]; then
    c=$(abs_common "$1")
    if [ -n "$c" ] && [ "$(norm "$c")" = "$proj_common_n" ]; then branch_in "$1"; return; fi
  fi
  branch_in "$proj"
}

# The main checkout is the parent of the repository's shared .git directory.
main_root="$proj"
case "$proj_common" in */.git) main_root="${proj_common%/.git}" ;; esac

tool=$(jget tool)

if [ "$tool" = "Bash" ] || [ "$tool" = "PowerShell" ]; then
  cwd=$(jget cwd)
  cwd=$(cygpath -u "$cwd" 2>/dev/null || printf '%s' "$cwd")
  branch=$(branch_for "$cwd")
  mode=master
  if ! guarded "$branch"; then
    # On a change branch. In a worktree the main folder still has to be protected
    # while it sits on master; anywhere else nothing is guarded.
    guarded "$(branch_in "$main_root")" || exit 0
    mode=worktree
    branch=$(branch_in "$main_root")
  fi
  # The checker normalises the path itself, so hand it the main folder as is.
  p=$(cd "$main_root" 2>/dev/null && pwd)
  # Git Bash rewrites path-like arguments for native programs, which would change $p
  # (and /tmp paths); turn that off for the project path and give node a Windows-form
  # script path (cygpath -m) so it can still find the checker.
  here=$(cygpath -m "$(dirname "$0")" 2>/dev/null || dirname "$0")
  verdict=$(printf '%s' "$input" | MSYS2_ARG_CONV_EXCL="*" node "$here/shell-command-check.js" "$p" "$mode" 2>/dev/null)
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
target=$(jget target)

# Allow plan files in this project's docs/plans, and nothing that climbs out with '..'
if [ -n "$target" ]; then
  t=$(norm "$target")
  p=$(norm "$(cd "$proj" 2>/dev/null && pwd)")
  case "$t" in
    *..*) ;;
    "$p"/docs/plans/*) exit 0 ;;
  esac
fi

# Judge the edit by the branch of the folder it lands in (a worktree has its own), with
# any '..' resolved first so a path can't climb out of a worktree into the main folder.
dir=""
if [ -n "$target" ]; then
  dir=$(cygpath -u "$target" 2>/dev/null || printf '%s' "$target")
  dir=$(realpath -m "$dir" 2>/dev/null || printf '%s' "$dir")
  while [ -n "$dir" ] && [ ! -d "$dir" ] && [ "$dir" != "/" ]; do dir=$(dirname "$dir"); done
fi
branch=$(branch_for "$dir")

# An unreadable branch fails closed, same as being on master. (As before, a detached HEAD
# is not blocked for the edit tools; only the shell tools treat it as unreadable.)
if [ -z "$branch" ] || [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
  echo "BLOCKED: You are on '${branch:-an unknown branch}'. Create a feature branch from the default branch first (git switch -c <type>/<short-description>) before editing any files. Never edit on the default branch." >&2
  exit 2
fi

exit 0
