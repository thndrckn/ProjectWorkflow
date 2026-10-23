#!/bin/bash
# PreToolUse hook: blocks Claude from editing files while on master/main.
# Always allowed, even on master:
#   - plan files in docs/plans/ (written by /plan-change while on master)

input=$(cat)

# Pull out ONLY the path of the file being edited (file_path, or notebook_path for notebooks).
# The rest of the input also mentions .claude (for example the transcript path),
# so the check must look at the edited file's path alone.
target=$(printf '%s' "$input" | grep -oE '"(file_path|notebook_path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1)

# Allow plan files in docs/plans (handles / and \\ path separators)
if printf '%s' "$target" | grep -qE '[/\\]docs[/\\]+plans[/\\]'; then
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
  echo "BLOCKED: You are on '$branch'. Create a feature branch from $branch first (git switch -c <type>/<short-description>) before editing any files. Never edit on $branch." >&2
  exit 2
fi

exit 0
