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
cp "$here/adopt.sh" "$pw/"
cp -r "$here/.claude-plugin" "$here/githooks" "$pw/release/"
# A stand-in claude: logs every call, remembers marketplaces and installs, lists them.
state="$tmp/state"; : > "$state"
cat > "$tmp/claude" <<EOF
#!/bin/bash
echo "\$*" >> "$tmp/log"
case "\$1 \$2 \$3" in
  "plugin marketplace add") echo projectworkflow >> "$state.m" ;;
  "plugin marketplace list") cat "$state.m" 2>/dev/null ;;
  "plugin install "*) echo "\$3" >> "$state" ;;
  "plugin list "*|"plugin list") cat "$state" ;;
esac
exit 0
EOF
chmod +x "$tmp/claude"; export CLAUDE="$tmp/claude"

proj="$tmp/project"; git init -q -b trunk "$proj"
printf -- '- **Default branch:** `trunk`\n- **Change prefix:** `ABC`\n- **Version files:** `package.json`\n- **Trunk lock starts at:** `ABC-010`\n' > "$proj/CLAUDE.md"
git -C "$proj" add -A; git -C "$proj" commit -q -m "chore(ABC-001): init"

lonely="$tmp/lonely"; mkdir -p "$lonely"; cp "$here/adopt.sh" "$lonely/"
expect 1 "release/ is not set up" "stops when release/ is missing" bash "$lonely/adopt.sh" "$proj"

expect 1 "/setup-matt-pocock-skills" "stops and names Matt's setup when it was not done" bash "$pw/adopt.sh" "$proj"
expect 0 "Trunk lock: ON" "the lock is on in the project" bash -c "cd '$proj' && node '$pw/release/githooks/trunk-lock-check.mjs' status"
[ "$(git -C "$proj" config core.hooksPath)" = "$(cygpath -m "$pw/release/githooks" 2>/dev/null || echo "$pw/release/githooks")" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: hooksPath points at release/githooks"; }
grep -q "install projectworkflow@projectworkflow" "$tmp/log" && grep -q "install mattpocock-skills@projectworkflow" "$tmp/log" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: both plugins installed from the marketplace"; }

mkdir -p "$proj/docs/agents"; : > "$proj/docs/agents/issue-tracker.md"
installs=$(grep -c "plugin install" "$tmp/log")
expect 0 "Done" "ends done once Matt's setup exists" bash "$pw/adopt.sh" "$proj"
[ "$(grep -c "plugin install" "$tmp/log")" = "$installs" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: running again installs nothing twice"; }

echo "mattpocock-skills@claude-plugins-official" >> "$state"
expect 1 "plugin uninstall mattpocock-skills@claude-plugins-official" "stops while the official copy is installed" bash "$pw/adopt.sh" "$proj"

sed -i '/Change prefix/d' "$proj/CLAUDE.md"
expect 1 "no \"Change prefix\" line" "stops when CLAUDE.md lacks a lock setting" bash "$pw/adopt.sh" "$proj"

echo "adopt tests: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
