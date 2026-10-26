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
# Like the real project, git ignores .claude/*, which is where its worktrees live.
printf '.claude/*\n' > "$master/.gitignore"
git -C "$master" add .gitignore
git -C "$master" -c user.name=t -c user.email=t@t commit -q -m ignore
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
  # Git Bash would rewrite a path inside VAR=/path arguments for node; keep the text as typed.
  case "$tool" in
    Bash|PowerShell) json=$(MSYS2_ARG_CONV_EXCL="*" node -e 'console.log(JSON.stringify({tool_name:process.argv[1],cwd:process.argv[3],tool_input:{command:process.argv[2]}}))' "$tool" "$arg" "$cwd") ;;
    *) json=$(MSYS2_ARG_CONV_EXCL="*" node -e 'console.log(JSON.stringify({tool_name:process.argv[1],cwd:process.argv[3],tool_input:{file_path:process.argv[2]}}))' "$tool" "$arg" "$cwd") ;;
  esac
  printf '%s' "$json" | CLAUDE_PROJECT_DIR="$repo" bash "$hook" >/dev/null 2>&1
  code=$?
  if [ "$code" = "$want" ]; then pass=$((pass+1)); echo "PASS  $name"
  else fail=$((fail+1)); echo "FAIL  $name (wanted $want, got $code)  [$tool] $arg"; fi
}
bothc() { checkc "$1 [Bash]" "$2" "$3" "$4" Bash "$5"; checkc "$1 [PowerShell]" "$2" "$3" "$4" PowerShell "$5"; }

wt="$master/.claude/worktrees/ABC-001"
git -C "$master" worktree add -q "$wt" -b chore/ABC-001-w
# A worktree kept somewhere else inside the main folder is just as free: the hook asks git
# where the worktrees are rather than assuming a folder.
wt2="$master/elsewhere-wt"
git -C "$master" worktree add -q "$wt2" -b chore/ABC-004-w

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

echo "== R8b: ways round the main-folder protection from a worktree"
for c in "GIT_DIR=$master/.git git reset --hard" "GIT_WORK_TREE=$master git reset --hard" \
  "export GIT_DIR=$master/.git" "\$env:GIT_DIR='$master/.git'" 'GIT_DIR=$X git reset --hard' \
  "git -c core.worktree=$master reset --hard" 'git branch -f master HEAD' 'git branch -M main' 'git branch -D master' \
  'git update-ref refs/heads/master HEAD' 'git worktree remove --force x' 'git worktree remove --forc x' \
  'git push origin HEAD:master' 'git push origin master' 'git push origin +HEAD:main' 'git push --mirror' \
  "cd $master && sed -i s/a/b/ README.md" "pushd $master; touch a" "Set-Location $master" "cd '$master'" \
  'cd ..' 'cd ../../..' 'cd $HOME2' "git -C $master/src reset --hard" 'git -C .. commit -m x' \
  "git -C$master reset --hard" "git -ccore.worktree=$master reset --hard" \
  'git --config-env=core.worktree=X reset --hard' "git --namespace foo -C $master reset --hard" \
  'git --namespace foo update-ref -d refs/heads/master' 'git --unknown-flag commit -m x' \
  'git fetch -u . HEAD:master' 'git fetch --update-head-ok . HEAD:main' \
  "git config core.worktree $master" 'git config --local core.bare true' \
  "git config set core.worktree $master" 'git config set --worktree core.bare true' \
  "git config --file $master/.git/config core.worktree X" 'git config -f x core.worktree y' \
  'git config --type path core.worktree X' "git config -f $master/.git/config user.name x" \
  "git config --file=$master/.git/config user.name x" "git config -f$master/.git/config user.name x" \
  'git config -fx core.worktree y'; do
  bothc "worktree session blocks: $c" 2 "$master" "$wt" "$c"
done
for c in 'git push -u origin chore/ABC-001-w' 'git push' 'git branch -d other' 'git branch --show-current' \
  'git worktree list' "cd $wt/src && touch x" 'cd src' 'cd -' "git -C $wt log" "GIT_DIR=$wt/.git git status" \
  "echo hi > $wt2/x.txt" "git -C $wt2 commit -m x" 'git --no-pager log' 'git -c user.name=x commit -m x' \
  'git -cuser.name=x commit -m x' 'git fetch origin' 'git fetch origin master' 'git config user.name x' \
  'git config core.worktree' 'git --namespace foo status' 'git config set user.name x' \
  'git config -f .gitmodules user.name x' 'git config --type bool user.thing true' \
  "git config --file $wt/.git user.name x" 'git config -f.gitmodules user.name x'; do
  bothc "worktree allows: $c" 0 "$master" "$wt" "$c"
done
for t in Edit Write; do
  checkc "second worktree allows $t on its own file" 0 "$master" "$wt2" "$t" "$wt2/src/x.ts"
done

echo "== R9: worktree commands on master"
for c in 'git worktree add .claude/worktrees/ABC-002 -b chore/ABC-002-x master' 'git worktree list' \
  "git worktree remove $wt" 'git worktree remove .claude/worktrees/ABC-001' \
  "git worktree add $master/.claude/worktrees/ABC-009 -b chore/ABC-009-x master" \
  "git worktree add $other/outside -b chore/ABC-010-x master"; do
  allowed "$c"
done
for c in 'git worktree remove --force x' 'git worktree remove -f x' 'git worktree remove x -f' \
  'git worktree remove --forc x' 'git worktree remove --f x' 'git worktree add --forc p master' \
  'git worktree add -f p master' 'git worktree add --force p master' 'git worktree add -B master p' \
  'git worktree add src/foo -b chore/ABC-011-x master' "git worktree add $master/src/foo -b chore/ABC-011-x master" \
  'git worktree add ../x -b chore/ABC-012-x master' 'git worktree add $X -b chore/ABC-013-x master' \
  'git worktree add -b chore/ABC-014-x' \
  'git worktree prune' 'git worktree move a b' 'git worktree lock x' 'git worktree unlock x' 'git worktree repair'; do
  blocked "$c"
done

echo "== R10: the master lock's switch (core.hooksPath) is the user's alone, on master and from a worktree"
for c in 'git config core.hooksPath ""' 'git config core.hooksPath /nonexistent' 'git config --unset core.hooksPath' \
  'git config --unset-all core.hooksPath' 'git config --local core.hooksPath x' 'git config set core.hooksPath x' \
  'git config unset core.hooksPath' 'git config CORE.HOOKSPATH x' 'git config --global core.hooksPath x' \
  'git -c core.hooksPath=/dev/null merge x' 'git -ccore.hooksPath=/x merge x' 'git -c core.hookspath=/x merge x' \
  'git --config-env=core.hooksPath=VAR merge x' \
  'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/x git merge x' \
  'GIT_CONFIG_PARAMETERS="core.hookspath=/x" git merge x' 'export GIT_CONFIG_COUNT=1' \
  "\$env:GIT_CONFIG_COUNT='1'" 'GIT_CONFIG_GLOBAL=/x git merge y'; do
  blocked "$c"
  bothc "worktree session blocks: $c" 2 "$master" "$wt" "$c"
done
for c in 'git config --get core.hooksPath' 'git config core.hooksPath' 'git config --list'; do
  allowed "$c"
  bothc "worktree allows: $c" 0 "$master" "$wt" "$c"
done
# On master every two-word `git config` was already blocked (the older rule), so only the worktree case is new.
bothc "worktree allows: git config get core.hooksPath" 0 "$master" "$wt" 'git config get core.hooksPath'

echo "== R11: the shared conventions folder is the user's alone, on every branch"
shared="$tmp/shared-conventions"; mkdir "$shared"; echo policy > "$shared/POLICY.md"
winshared=$(cygpath -m "$shared" 2>/dev/null || echo "$shared")
# Master and feature projects whose CLAUDE.md names the folder; one master project without the line.
printf -- '- **Shared conventions folder:** `%s` (edited by the user only).\n' "$winshared" > "$master/CLAUDE.md"
printf -- '- **Shared conventions folder:** `%s` (edited by the user only).\n' "$winshared" > "$feature/CLAUDE.md"
noline="$tmp/master-no-line"; mk_repo "$noline"; printf 'No such line here.\n' > "$noline/CLAUDE.md"

# msgcheck <name> <want text in stderr> <repo dir> <tool> <command-or-file_path>
msgcheck() {
  local name=$1 want=$2 repo=$3 tool=$4 arg=$5 json err
  case "$tool" in
    Bash|PowerShell) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:{command:process.argv[2]}}))' "$tool" "$arg") ;;
    *) json=$(node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:{file_path:process.argv[2]}}))' "$tool" "$arg") ;;
  esac
  err=$(printf '%s' "$json" | CLAUDE_PROJECT_DIR="$repo" bash "$hook" 2>&1 >/dev/null)
  if [[ "$err" == *"$want"* ]]; then pass=$((pass+1)); echo "PASS  $name"
  else fail=$((fail+1)); echo "FAIL  $name (message lacked '$want'): $err"; fi
}

for repo in "$master" "$feature"; do
  for tool in Edit Write MultiEdit NotebookEdit; do
    check "R11 $(basename "$repo") blocks $tool in the shared folder" 2 "$repo" "$tool" "$shared/POLICY.md"
  done
  check "R11 $(basename "$repo") blocks a new file in the shared folder" 2 "$repo" Write "$shared/NEW.md"
  check "R11 $(basename "$repo") blocks a .. path into the shared folder" 2 "$repo" Edit "$shared/sub/../POLICY.md"
  for c in "echo hi >> $shared/POLICY.md" "echo hi > $shared/POLICY.md" "cp a $shared/POLICY.md" \
    "sed -i s/a/b/ $shared/POLICY.md" "Set-Content $shared/POLICY.md hi" "Add-Content -Path $shared/POLICY.md -Value hi" \
    "rm $shared/POLICY.md" "touch $shared/X.md" "mv a $shared/POLICY.md" "bash -c \"echo hi > $shared/POLICY.md\"" \
    "cd $shared" "echo hi | tee $shared/POLICY.md"; do
    both "R11 $(basename "$repo") blocks: $c" 2 "$repo" "$c"
  done
  both "R11 $(basename "$repo") allows reading the shared folder" 0 "$repo" "cat $shared/POLICY.md"
done
# Not just the master: a feature branch still edits its own files.
check "R11 feature project edit still allowed" 0 "$feature" Edit "$feature/src/x.ts"
both "R11 feature project shell write still allowed" 0 "$feature" "echo hi > $feature/x.txt"
check "R11 master project edit still blocked" 2 "$master" Edit "$master/src/x.ts"
# The message says why, rather than the generic "create a feature branch".
msgcheck "R11 Edit message names the rule" "edited by the user only" "$feature" Edit "$shared/POLICY.md"
msgcheck "R11 shell message names the rule" "edited by the user only" "$feature" Bash "echo hi >> $shared/POLICY.md"

echo "== R12: with no 'Shared conventions folder' line the guard behaves as before"
check "R12 no line: Edit in the shared folder blocked while the project is on master" 2 "$noline" Edit "$shared/POLICY.md"
# A shell write outside the project was always allowed on master (see R4), and without the
# line the guard cannot tell this folder from any other outside folder: that is the old
# behaviour, kept as is. Only the line makes the shell block (R11).
both "R12 no line: shell write into the shared folder allowed as before (outside the project)" 0 "$noline" "echo hi >> $shared/POLICY.md"
msgcheck "R12 no line: generic message" "Create a feature branch" "$noline" Edit "$shared/POLICY.md"
msgcheck "R12 no line: no shared-folder message" "BLOCKED: You are on" "$noline" Edit "$shared/POLICY.md"

echo
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
