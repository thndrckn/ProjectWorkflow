#!/bin/bash
# Tests for block-main-edits.sh. Run: bash .claude/hooks/test-block-main-edits.sh
# Builds throwaway repos in a temp dir (one on master, one on a feature branch, one
# that is not a repo), feeds sample tool calls to the hook, and checks the exit code
# (0 = allowed, 2 = blocked). Exits non-zero if any case fails.

hook="$(cd "$(dirname "$0")" && pwd)/block-main-edits.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mk_repo() {
  git init -q -b master "$1" >/dev/null
  git -C "$1" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
}
master="$tmp/master-repo"; mk_repo "$master"
feature="$tmp/feature-repo"; mk_repo "$feature"; git -C "$feature" switch -q -c chore/ABC-000-x
norepo="$tmp/not-a-repo"; mkdir "$norepo"
other="$tmp/elsewhere"; mkdir "$other"

pass=0; fail=0

# check <name> <expected exit> <repo dir> <tool> <command-or-file_path>
check() {
  local name=$1 want=$2 repo=$3 tool=$4 arg=$5 json code
  case "$tool" in
    Bash|PowerShell) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:{command:process.argv[2]}}))' "$tool" "$arg") ;;
    *) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:{file_path:process.argv[2]}}))' "$tool" "$arg") ;;
  esac
  printf '%s' "$json" | CLAUDE_PROJECT_DIR="$repo" bash "$hook" >/dev/null 2>&1
  code=$?
  if [ "$code" = "$want" ]; then pass=$((pass+1)); echo "PASS  $name"
  else fail=$((fail+1)); echo "FAIL  $name (wanted $want, got $code)  [$tool] $arg"; fi
}

# Run the same shell command through both shell tools.
both() { check "$1 [Bash]" "$2" "$3" Bash "$4"; check "$1 [PowerShell]" "$2" "$3" PowerShell "$4"; }
blocked() { both "master blocks: $1" 2 "$master" "$1"; }
allowed() { both "master allows: $1" 0 "$master" "$1"; }

echo "== R1: git commands outside the allow-list are blocked on master"
for c in 'git commit -m x' 'git add .' 'git add -A' 'git cherry-pick abc' 'git revert abc' \
  'git rebase main' 'git reset --hard' 'git am p.patch' 'git restore f' 'git rm f' 'git stash' \
  'git pull' 'git pull origin master' 'git push --force' 'git push -f' 'git push --force-with-lease' \
  'git push origin +master' 'git remote add x url' 'git remote set-url origin url' \
  'git remote remove origin' 'git config user.name x' 'git config --unset user.name' \
  'git config --global user.name x' 'git checkout main' 'git checkout -B x' 'git checkout -- f' \
  'git checkout .' 'git clean -fd' 'git commit --amend' 'git -C . commit -m x' \
  'git status && git commit -m x' 'git diff --output=out.txt' \
  'git tag -d v1' 'git tag --delete v1' 'git switch -f main' 'git switch --force main' \
  'git switch --discard-changes main' 'git switch -fc x' 'git branch -D x' 'git branch --delete --force x' \
  'git tag --del v1' 'git switch --discard x' 'git switch --forc x' 'git branch --del --force x' 'git branch --del -f x' 'git branch -d -f x' 'git tag -dm msg v1' 'git tag -d -m x v1' 'git branch -df x' 'git branch -fd x' 'git branch -d --force x'; do
  blocked "$c"
done

echo "== R2: file-writing shell commands aimed at the project are blocked on master"
for c in 'sed -i s/a/b/ f.txt' 'sed -i.bak s/a/b/ src/f.ts' 'echo hi > f.txt' 'echo hi >> f.txt' \
  'echo hi | tee f.txt' 'cp a b' 'mv a b' 'rm f' 'rm -rf src' 'touch f' 'mkdir d' \
  'Set-Content f.txt hi' 'Set-Content -Path f.txt -Value hi' 'Out-File f.txt' 'Add-Content f.txt hi' \
  'Remove-Item f.txt' 'Copy-Item a b' 'Move-Item a b' 'New-Item f.txt' 'echo hi 2> err.txt' \
  'bash -c "echo hi > f.txt"' 'ls && echo hi > f.txt' 'echo hi > $HOME2/x' \
  "echo hi > \"$master/src/x.txt\"" 'echo hi>f.txt' 'echo hi>>f.txt' 'cat a>b' 'echo hi 2>f.txt'   'bash -lc "git commit -m x"' 'bash -ec "echo hi > f.txt"' 'pwsh -NoProfile -Command "Set-Content f.txt hi"'   'echo "$(git commit -m x)"' 'echo "`git commit -m x`"' 'echo $(git commit -m x)'   'env -i git commit -m x' 'timeout 5 git commit -m x' 'xargs git commit -m x' 'g""it commit -m x'   'sudo -u root git commit -m x' 'nohup git commit -m x'   'Out-File -FilePath:f.txt' 'Set-Content -Path:f.txt -Value hi' 'Tee-Object f.txt' 'Export-Csv f.csv'   'curl -o f.txt http://x' 'wget -O f.txt http://x' 'Invoke-WebRequest http://x -OutFile f.txt'   "echo hi > $master/../master-repo/src/x.txt" 'echo hi >| f.txt'; do
  blocked "$c"
done

echo "== R3: allow-listed git and read-only commands are allowed on master"
for c in 'git status' 'git log -3' 'git diff' 'git diff main...HEAD' 'git show HEAD' 'git fetch' \
  'git pull --ff-only' 'git merge --no-ff feat' 'git merge --abort' 'git push' 'git push origin master' \
  'git tag v1.0.0' 'git tag --list' 'git tag -a v1 -m x' 'git tag -ukeyid v1' 'git tag -m -d v1' 'git tag -a -m --force v1' 'git tag --message -d v1' 'git branch -u origin/x' 'git tag -m "msg -d" v1' 'git switch --detach' 'git switch -cf x' 'git branch --delete x' 'git switch -c x' 'git switch master' 'git branch' \
  'git branch --show-current' 'git branch -d x' 'git rev-parse --abbrev-ref HEAD' 'git ls-files' \
  'git remote' 'git remote -v' 'git remote show origin' 'git remote get-url origin' \
  'git config --get user.name' 'git config --list' 'git config user.name' 'git checkout -b x' \
  'git -C . status' 'git log --oneline | head -3' 'ls' 'cat package.json' 'ls -la 2>&1' \
  'npm run lint' 'cd src-tauri && cargo test'; do
  allowed "$c"
done

echo "== R4: writes outside the project, or to plan files, are allowed on master"
for c in 'echo hi > /dev/null' 'echo hi 2>/dev/null' "echo hi > $other/x.txt" "cp a $other/b" \
  "rm $other/x" "tee $other/x" 'echo hi > $null' 'Out-File $null' "Set-Content -Path $other/x -Value hi" \
  "echo hi > $master/docs/plans/ABC-001-x.md" 'echo hi > docs/plans/ABC-001-x.md' \
  'cmd 2>&1' 'git status > /dev/null 2>&1' 'ls>/dev/null' 'ls 2>&1 | head' "echo hi>$other/x.txt"   "echo hi >| $other/x.txt" 'echo "$(git status)"' 'timeout 5 git status' 'env -i git log'   "Out-File -FilePath:$other/x.txt" 'curl http://x' "curl -o $other/x http://x" 'ls >&2'; do
  allowed "$c"
done
blocked "echo hi > $master/docs/plans/../src/x.txt"
blocked "echo hi > docs/plans/../src/x.txt"

echo "== R5: nothing is blocked on a feature branch"
for c in 'git commit -m x' 'git add .' 'echo hi > f.txt' 'sed -i s/a/b/ f' 'git reset --hard' 'rm f'; do
  both "feature allows: $c" 0 "$feature" "$c"
done

echo "== R6: an unreadable branch fails closed"
for c in 'git commit -m x' 'echo hi > f.txt'; do
  both "unknown branch blocks: $c" 2 "$norepo" "$c"
done
both "unknown branch allows: git status" 0 "$norepo" 'git status'
detached="$tmp/detached-repo"; mk_repo "$detached"; git -C "$detached" checkout -q --detach
both "detached HEAD blocks: git commit -m x" 2 "$detached" 'git commit -m x'
both "detached HEAD allows: git status" 0 "$detached" 'git status'

echo "== R7: edit tools behave as before"
for t in Edit Write MultiEdit; do
  check "master blocks $t on a project file" 2 "$master" "$t" "$master/src/x.ts"
  check "master allows $t on a plan file" 0 "$master" "$t" "$master/docs/plans/ABC-001-x.md"
  check "master blocks $t climbing out of plans" 2 "$master" "$t" "$master/docs/plans/../src/x.ts"
  check "feature allows $t on a project file" 0 "$feature" "$t" "$feature/src/x.ts"
done

# The hook input carries cwd; these cases run from inside a worktree of the master repo.
# checkc <name> <expected exit> <project dir> <cwd> <tool> <command-or-file_path>
checkc() {
  local name=$1 want=$2 repo=$3 cwd=$4 tool=$5 arg=$6 json code
  case "$tool" in
    Bash|PowerShell) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],cwd:process.argv[3],tool_input:{command:process.argv[2]}}))' "$tool" "$arg" "$cwd") ;;
    *) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],cwd:process.argv[3],tool_input:{file_path:process.argv[2]}}))' "$tool" "$arg" "$cwd") ;;
  esac
  printf '%s' "$json" | CLAUDE_PROJECT_DIR="$repo" bash "$hook" >/dev/null 2>&1
  code=$?
  if [ "$code" = "$want" ]; then pass=$((pass+1)); echo "PASS  $name"
  else fail=$((fail+1)); echo "FAIL  $name (wanted $want, got $code)  [$tool] $arg"; fi
}
bothc() { checkc "$1 [Bash]" "$2" "$3" "$4" Bash "$5"; checkc "$1 [PowerShell]" "$2" "$3" "$4" PowerShell "$5"; }

wt="$master/.claude/worktrees/ABC-001"
git -C "$master" worktree add -q "$wt" -b chore/ABC-001-w

echo "== R8: a worktree on a change branch is not blocked, and master's folder stays protected from it"
for t in Edit Write MultiEdit; do
  checkc "worktree allows $t on its own file" 0 "$master" "$wt" "$t" "$wt/src/x.ts"
  checkc "worktree session blocks $t on master's file" 2 "$master" "$wt" "$t" "$master/src/x.ts"
  checkc "worktree session blocks $t climbing into master's folder" 2 "$master" "$wt" "$t" "$wt/../../../src/x.ts"
done
for c in 'git commit -m x' 'git add .' 'git reset --hard' 'echo hi > f.txt' 'rm f' 'sed -i s/a/b/ f' \
  "echo hi > $wt/src/x.txt" "git -C $wt commit -m x" 'cargo test' "cp a $other/b"; do
  bothc "worktree allows: $c" 0 "$master" "$wt" "$c"
done
for c in "echo hi > $master/src/x.txt" "cp a $master/src/b" "rm -rf $master/src" 'echo hi > ../../../x.txt' \
  "git -C $master commit -m x" "git --git-dir=$master/.git commit -m x" "git -C $master add ."; do
  bothc "worktree session blocks: $c" 2 "$master" "$wt" "$c"
done
bothc "worktree session still reads master" 0 "$master" "$wt" "git -C $master status"

echo "== R9: worktree commands on master"
for c in 'git worktree add .claude/worktrees/ABC-002 -b chore/ABC-002-x master' 'git worktree list' \
  "git worktree remove $wt" 'git worktree remove .claude/worktrees/ABC-001'; do
  allowed "$c"
done
for c in 'git worktree remove --force x' 'git worktree remove -f x' 'git worktree remove x -f' \
  'git worktree add -f p master' 'git worktree add --force p master' 'git worktree add -B master p' \
  'git worktree prune' 'git worktree move a b' 'git worktree lock x' 'git worktree unlock x' 'git worktree repair'; do
  blocked "$c"
done

echo
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
