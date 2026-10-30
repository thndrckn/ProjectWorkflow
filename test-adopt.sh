#!/bin/bash
# Tests for adopt.sh, on throwaway copies, with a stand-in for the claude command so no real plugins
# or settings are touched. Run: bash test-adopt.sh
here="$(cd "$(dirname "$0")" && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
pass=0; fail=0
expect() { # expect <exit code> <words> <name> <command...>
  local want=$1 words=$2 name=$3; shift 3
  local out; out=$("$@" 2>&1); local got=$?
  if [ "$got" -eq "$want" ] && [[ "$out" == *"$words"* ]]; then pass=$((pass+1))
  else fail=$((fail+1)); echo "FAIL: $name (exit $got, wanted $want, words \"$words\")"; echo "$out" | tail -4; fi
}

# A stand-in ProjectWorkflow folder: adopt.sh plus a release/ that is a copy of the real files.
pw="$tmp/pw"; mkdir -p "$pw/release"
cp "$here/adopt.sh" "$pw/"; cp -r "$here/hooks" "$pw/"
cp -r "$here/.claude-plugin" "$here/githooks" "$pw/release/"
# A stand-in claude: logs every call, remembers marketplaces and installs (id|scope|project folder, - for
# user scope), and lists them as JSON like the real one. FAILINSTALL=1 makes every install fail, BADLIST=1
# makes the listing unreadable, WINPATH=1 records and lists project folders the way Windows spells them
# (backslashes, capitals).
state="$tmp/state"; : > "$state"
export STATE="$state" LOG="$tmp/log"
cat > "$tmp/claude" <<'EOF'
#!/bin/bash
echo "$*" >> "$LOG"
scope=user; args=("$@")
for ((i=0; i<${#args[@]}; i++)); do [ "${args[i]}" = "--scope" ] && scope=${args[i+1]}; done
dir=$(cygpath -m "$PWD" 2>/dev/null || echo "$PWD")
[ -n "${WINPATH:-}" ] && dir=$(echo "$dir" | tr / '\\' | tr a-z A-Z)
[ "$scope" = project ] && p=$dir || p=-
case "$1 $2" in
  "plugin marketplace") case "$3" in add) echo projectworkflow >> "$STATE.m" ;; list) cat "$STATE.m" 2>/dev/null ;; esac ;;
  "plugin install") [ -n "${FAILINSTALL:-}" ] && exit 1; echo "$3|$scope|$p" >> "$STATE"
    # like the real one: a project-scope install writes .claude/settings.json with plain (LF) line endings
    [ "$scope" = project ] && { mkdir -p .claude; printf '{\n  "enabledPlugins": {\n    "%s": true\n  }\n}\n' "$3" > .claude/settings.json; } ;;
  "plugin uninstall") grep -vxF "$3|$scope|$p" "$STATE" > "$STATE.n"; mv "$STATE.n" "$STATE" ;;
  "plugin list") [ -n "${BADLIST:-}" ] && { echo "unknown option --json"; exit 1; }; node -e '
    const l = require("fs").readFileSync(process.env.STATE, "utf8").split("\n").filter(Boolean).map(x => x.split("|"));
    console.log(JSON.stringify(l.map(([id, scope, p]) => p === "-" ? { id, scope } : { id, scope, projectPath: p })));' ;;
esac
exit 0
EOF
chmod +x "$tmp/claude"; export CLAUDE="$tmp/claude"

proj="$tmp/project"; git init -q -b trunk "$proj"
printf -- '## Workflow\n- **Default branch:** `trunk`\n- **Change prefix:** `ABC`\n- **Version files:** `package.json`\n- **Trunk lock starts at:** `ABC-010`\n' > "$proj/CLAUDE.md"
git -C "$proj" add -A; git -C "$proj" commit -q -m "chore(ABC-001): init"

lonely="$tmp/lonely"; mkdir -p "$lonely"; cp "$here/adopt.sh" "$lonely/"
expect 1 "release/ is not set up" "stops when release/ is missing" bash "$lonely/adopt.sh" "$proj"

bash "$pw/adopt.sh" "$proj" > "$tmp/first-run" 2>&1   # the first run's output, read by the .gitattributes checks below
expect 1 "/setup-matt-pocock-skills" "stops and names Matt's setup when it was not done" bash "$pw/adopt.sh" "$proj"
expect 0 "Trunk lock: ON" "the lock is on in the project" bash -c "cd '$proj' && node '$pw/release/githooks/trunk-lock-check.mjs' status"
[ "$(git -C "$proj" config core.hooksPath)" = "$(cygpath -m "$pw/release/githooks" 2>/dev/null || echo "$pw/release/githooks")" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: hooksPath points at release/githooks"; }
projhere=$(cygpath -m "$proj" 2>/dev/null || echo "$proj")
# R1: both plugins installed at project scope, for this project, and nothing installed at user scope.
grep -qxF "projectworkflow@projectworkflow|project|$projhere" "$state" && grep -qxF "mattpocock-skills@projectworkflow|project|$projhere" "$state" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: both plugins installed at project scope for the project"; }
grep "plugin install" "$tmp/log" | grep -qv -- "--scope project" && { fail=$((fail+1)); echo "FAIL: an install was not at project scope"; } || pass=$((pass+1))
# R4: with nothing at user scope, nothing is uninstalled.
grep -q "plugin uninstall" "$tmp/log" && { fail=$((fail+1)); echo "FAIL: uninstalled something when no user-scope copy existed"; } || pass=$((pass+1))

mkdir -p "$proj/docs/agents"; : > "$proj/docs/agents/issue-tracker.md"
installs=$(grep -c "plugin install" "$tmp/log")
expect 0 "Done" "ends done once Matt's setup exists" bash "$pw/adopt.sh" "$proj"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: running again installs nothing twice"; }

# R3, R4: a second project is not covered by the first one's install, and user-scope copies are removed
# only after its own project-scope installs worked.
proj2="$tmp/project2"; git init -q -b trunk "$proj2"; mkdir -p "$proj2/docs/agents"; : > "$proj2/docs/agents/issue-tracker.md"
cp "$proj/CLAUDE.md" "$proj2/"
git -C "$proj2" add -A; git -C "$proj2" commit -q -m "chore(ABC-001): init"
proj2here=$(cygpath -m "$proj2" 2>/dev/null || echo "$proj2")
printf '%s\n' "projectworkflow@projectworkflow|user|-" "mattpocock-skills@projectworkflow|user|-" >> "$state"
FAILINSTALL=1 expect 1 "could not install" "a failed install stops the run" bash "$pw/adopt.sh" "$proj2"
installs=$(grep -c "plugin install" "$tmp/log")
grep -q "plugin uninstall" "$tmp/log" && { fail=$((fail+1)); echo "FAIL: removed the user-scope copy although the project install failed"; } || pass=$((pass+1))
expect 0 "Done" "a second project is adopted on its own" bash "$pw/adopt.sh" "$proj2"
[ "$(grep -c "plugin install" "$tmp/log")" = "$((installs+2))" ] && grep -qxF "projectworkflow@projectworkflow|project|$proj2here" "$state" && grep -qxF "mattpocock-skills@projectworkflow|project|$proj2here" "$state" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a user-scope or other-project install counted as installed here"; }
grep -q "plugin uninstall projectworkflow@projectworkflow --scope user" "$tmp/log" && grep -q "plugin uninstall mattpocock-skills@projectworkflow --scope user" "$tmp/log" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: user-scope installs were not uninstalled"; }
grep -q '|user|' "$state" && { fail=$((fail+1)); echo "FAIL: a user-scope install is left"; } || pass=$((pass+1))
grep -qxF "projectworkflow@projectworkflow|project|$projhere" "$state" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: the first project's install was lost"; }

# This repo's own CLAUDE.md and Matt's setup file are accepted as a finished project (PWF-029).
# adopt.sh only reads those two files from the project, plus needs a git repo, so that is all the stand-in holds.
own="$tmp/own"; git init -q -b trunk "$own"; mkdir -p "$own/docs/agents"
cp "$here/CLAUDE.md" "$own/"; cp "$here/docs/agents/issue-tracker.md" "$own/docs/agents/"
git -C "$own" add -A; git -C "$own" commit -q -m "chore(PWF-001): init"
expect 0 "Done" "this repo's own CLAUDE.md and setup file are accepted" bash "$pw/adopt.sh" "$own"

# The workflow's own repo (and its worktrees) uses its own githooks folder, so adopt.sh refuses it (PWF-030).
# This stand-in is a git repository holding adopt.sh itself; a worktree of it must be refused the same way.
self="$tmp/self"; git init -q -b trunk "$self"; mkdir -p "$self/release"
cp "$here/adopt.sh" "$self/"; cp -r "$here/.claude-plugin" "$here/githooks" "$self/release/"
cp "$here/CLAUDE.md" "$self/"; mkdir -p "$self/docs/agents"; : > "$self/docs/agents/issue-tracker.md"
git -C "$self" add -A; git -C "$self" commit -q -m "chore(PWF-001): init"
git -C "$self" worktree add -q "$tmp/self-wt" -b other
installs=$(grep -c "plugin install" "$tmp/log")
expect 1 "install-trunk-lock.sh" "refuses the workflow's own repo" bash "$self/adopt.sh" "$self"
expect 1 "install-trunk-lock.sh" "refuses a worktree of the workflow's own repo" bash "$self/adopt.sh" "$tmp/self-wt"
[ -z "$(git -C "$self" config core.hooksPath)" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: the refused run set core.hooksPath"; }
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: the refused run installed a plugin"; }

echo "mattpocock-skills@claude-plugins-official|user|-" >> "$state"
installs=$(grep -c "plugin install" "$tmp/log")
expect 1 "plugin uninstall mattpocock-skills@claude-plugins-official" "stops while the official copy is installed" bash "$pw/adopt.sh" "$proj"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: installed something while the official copy was installed"; }

# The official copy counts at any scope, including project scope for another project.
grep -vxF "mattpocock-skills@claude-plugins-official|user|-" "$state" > "$state.n"; mv "$state.n" "$state"
echo "mattpocock-skills@claude-plugins-official|project|/somewhere/else" >> "$state"
expect 1 "plugin uninstall mattpocock-skills@claude-plugins-official" "stops for an official copy at project scope elsewhere" bash "$pw/adopt.sh" "$proj"
grep -vxF "mattpocock-skills@claude-plugins-official|project|/somewhere/else" "$state" > "$state.n"; mv "$state.n" "$state"

# A plugin list that cannot be read stops the run before anything is installed or removed.
installs=$(grep -c "plugin install" "$tmp/log"); removals=$(grep -c "plugin uninstall" "$tmp/log")
BADLIST=1 expect 1 "could not read the plugin list" "stops when the plugin list cannot be read" bash "$pw/adopt.sh" "$proj"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && [ "$(grep -c "plugin uninstall" "$tmp/log")" = "$removals" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: an unreadable plugin list still led to an install or removal"; }

# A project folder spelled the Windows way (backslashes, capitals) is still recognised as installed.
proj3="$tmp/project3"; git init -q -b trunk "$proj3"; mkdir -p "$proj3/docs/agents"; : > "$proj3/docs/agents/issue-tracker.md"
cp "$proj/CLAUDE.md" "$proj3/"; git -C "$proj3" add -A; git -C "$proj3" commit -q -m "chore(ABC-001): init"
WINPATH=1 expect 0 "Done" "a project is adopted when the list spells its folder the Windows way" bash "$pw/adopt.sh" "$proj3"
installs=$(grep -c "plugin install" "$tmp/log")
WINPATH=1 expect 0 "Done" "adopting again" bash "$pw/adopt.sh" "$proj3"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a differently spelled folder was not recognised, so plugins were installed again"; }

# The guard stands down in a project with no Workflow heading, so adopting such a project is refused.
proj4="$tmp/project4"; git init -q -b trunk "$proj4"; sed '/^## Workflow/d' "$proj/CLAUDE.md" > "$proj4/CLAUDE.md"
git -C "$proj4" add -A; git -C "$proj4" commit -q -m "chore(ABC-001): init"
installs=$(grep -c "plugin install" "$tmp/log")
expect 1 "Workflow heading" "stops when CLAUDE.md has no Workflow heading" bash "$pw/adopt.sh" "$proj4"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: installed a plugin in a project with no Workflow heading"; }

# PWF-033: .claude/settings.json is always plain (LF) endings, so a plugin install leaves git clean.
rule='.claude/settings.json text eol=lf'
# R1: this repo has the rule, and git applies it to the file.
grep -qxF "$rule" "$here/.gitattributes" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: this repo's .gitattributes has the settings.json rule"; }
attrs=$(git -C "$here" check-attr text eol -- .claude/settings.json)
[[ "$attrs" == *"text: set"* && "$attrs" == *"eol: lf"* ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: git applies text eol=lf to .claude/settings.json ($attrs)"; }
# R2: the first run on proj (it had no .gitattributes) created one with the rule and said to commit it.
[ "$(cat "$proj/.gitattributes" 2>/dev/null)" = "$rule" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: adopt.sh created .gitattributes with the rule"; }
grep -q "gitattributes. That file needs committing" "$tmp/first-run" 2>/dev/null && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: adopt.sh said the new .gitattributes needs committing"; }
# R3, R4: a project's own rules stay (even with no final newline), the line is added once, and a second run
# changes nothing and says nothing about it.
proj5="$tmp/project5"; git init -q -b trunk "$proj5"; mkdir -p "$proj5/docs/agents"; : > "$proj5/docs/agents/issue-tracker.md"
cp "$proj/CLAUDE.md" "$proj5/"; printf '*.png binary\n*.sh text eol=lf' > "$proj5/.gitattributes"
git -C "$proj5" add -A; git -C "$proj5" commit -q -m "chore(ABC-001): init"
expect 0 "That file needs committing" "adopt.sh tells the owner to commit a changed .gitattributes" bash "$pw/adopt.sh" "$proj5"
[ "$(cat "$proj5/.gitattributes")" = "$(printf '*.png binary\n*.sh text eol=lf\n%s' "$rule")" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: the project's own rules were kept and the line added once"; }
sum=$(cksum < "$proj5/.gitattributes"); out=$(bash "$pw/adopt.sh" "$proj5" 2>&1)
[ "$(cksum < "$proj5/.gitattributes")" = "$sum" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a second run changed .gitattributes"; }
[[ "$out" == *gitattributes* ]] && { fail=$((fail+1)); echo "FAIL: a run that changed nothing still mentioned .gitattributes"; } || pass=$((pass+1))
# R3 again: a .gitattributes with Windows line endings (what git makes of it here), last line ending in a
# newline. The rule is added once; a second run does not add it again.
proj6="$tmp/project6"; git init -q -b trunk "$proj6"; mkdir -p "$proj6/docs/agents"; : > "$proj6/docs/agents/issue-tracker.md"
cp "$proj/CLAUDE.md" "$proj6/"; printf '*.png binary\r\n' > "$proj6/.gitattributes"
git -C "$proj6" add -A 2>/dev/null; git -C "$proj6" commit -q -m "chore(ABC-001): init"
bash "$pw/adopt.sh" "$proj6" >/dev/null 2>&1; bash "$pw/adopt.sh" "$proj6" >/dev/null 2>&1
[ "$(grep -cF "$rule" "$proj6/.gitattributes")" = 1 ] && [ "$(head -c 14 "$proj6/.gitattributes")" = "$(printf '*.png binary\r\n' | head -c 14)" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a Windows-ended .gitattributes got the rule once and kept its own line"; }
proj7="$tmp/project7"; git init -q -b trunk "$proj7"; mkdir -p "$proj7/docs/agents"; : > "$proj7/docs/agents/issue-tracker.md"
cp "$proj/CLAUDE.md" "$proj7/"; printf '*.png binary\r\n%s\r\n' "$rule" > "$proj7/.gitattributes"   # the rule is already there, Windows-ended
git -C "$proj7" add -A 2>/dev/null; git -C "$proj7" commit -q -m "chore(ABC-001): init"
sum=$(cksum < "$proj7/.gitattributes"); out=$(bash "$pw/adopt.sh" "$proj7" 2>&1)
[ "$(cksum < "$proj7/.gitattributes")" = "$sum" ] && [[ "$out" != *gitattributes* ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a rule already in a Windows-ended .gitattributes was added again"; }
# R5: where git converts line endings, an install that rewrites the file with plain endings leaves git clean.
git -C "$proj5" config core.autocrlf true
git -C "$proj5" add -A 2>/dev/null; git -C "$proj5" commit -q -m "chore(ABC-002): adopt"
rm "$proj5/.claude/settings.json"; git -C "$proj5" checkout -- .claude/settings.json
(cd "$proj5" && "$CLAUDE" plugin install mattpocock-skills@projectworkflow --scope project >/dev/null)   # same content as adopt.sh's last install wrote
[ -z "$(git -C "$proj5" status --short 2>/dev/null)" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: an install left git status dirty: $(git -C "$proj5" status --short)"; }
# R7 (second half): a file checked out with Windows endings, then the rule added and the file checked out once more.
rep="$tmp/repo7"; git init -q -b trunk "$rep"; git -C "$rep" config core.autocrlf true; mkdir "$rep/.claude"
printf '{\n  "a": 1\n}\n' > "$rep/.claude/settings.json"; git -C "$rep" add -A 2>/dev/null; git -C "$rep" commit -q -m "chore(ABC-001): init"
rm "$rep/.claude/settings.json"; git -C "$rep" checkout -- .claude/settings.json
[[ "$(git -C "$rep" ls-files --eol .claude/settings.json)" == *"w/crlf"* ]] || { fail=$((fail+1)); echo "FAIL: the stand-in repo did not start with Windows endings"; }
echo "$rule" > "$rep/.gitattributes"; git -C "$rep" add -A 2>/dev/null; git -C "$rep" commit -q -m "chore(ABC-002): rule"
rm "$rep/.claude/settings.json"; git -C "$rep" checkout -- .claude/settings.json
eol=$(git -C "$rep" ls-files --eol .claude/settings.json)
[[ "$eol" == *"w/lf"* && "$eol" == *"text eol=lf"* ]] && [ -z "$(git -C "$rep" status --short)" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: re-checkout with the rule gives plain endings and a clean status ($eol)"; }

sed -i '/Change prefix/d' "$proj/CLAUDE.md"
expect 1 "no \"Change prefix\" line" "stops when CLAUDE.md lacks a lock setting" bash "$pw/adopt.sh" "$proj"

echo "adopt tests: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
