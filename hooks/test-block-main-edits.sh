#!/bin/bash
# Tests for the guard hooks. Run: bash hooks/test-block-main-edits.sh
# Builds throwaway repos in a temp dir, feeds sample edit calls to the hook, and checks the exit code
# (0 = allowed, 2 = blocked). Exits non-zero if any case fails.

dir="$(cd "$(dirname "$0")" && pwd)"
hook="$dir/block-main-edits.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t

main="$tmp/main-repo"
git init -q -b trunk "$main"; mkdir -p "$main/docs/plans"; git -C "$main" commit -q --allow-empty -m init
git -C "$main" worktree add -q "$tmp/wt" -b chore/PWF-000-x
other="$tmp/elsewhere"; mkdir "$other"

pass=0; fail=0
# check <name> <expected exit> <tool> <file path>   (the hook runs for the main repo's session)
check() {
  local json code
  json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:{file_path:process.argv[2]}}))' "$3" "$4")
  printf '%s' "$json" | CLAUDE_PROJECT_DIR="$main" bash "$hook" >/dev/null 2>&1
  code=$?
  if [ "$code" = "$2" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL  $1 (wanted $2, got $code)"; fi
}

check "Edit on trunk is blocked" 2 Edit "$main/src.js"
check "Write on trunk is blocked" 2 Write "$main/new.txt"
check "NotebookEdit on trunk is blocked" 2 NotebookEdit "$main/n.ipynb"
check "a plan file on trunk is allowed" 0 Write "$main/docs/plans/PWF-001-x.md"
check "a path climbing out of docs/plans is blocked" 2 Write "$main/docs/plans/../../src.js"
check "an edit in a worktree on a change branch is allowed" 0 Edit "$tmp/wt/src.js"
check "a path climbing out of the worktree into trunk is blocked" 2 Edit "$tmp/wt/../main-repo/src.js"

git -C "$main" switch -q -c chore/PWF-000-y
check "an edit on a change branch is allowed" 0 Edit "$main/src.js"

# the plan-mode block always refuses
bash "$dir/block-plan-mode.sh" >/dev/null 2>&1
[ $? = 2 ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL  plan mode is refused"; }

echo "guard tests: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
