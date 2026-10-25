#!/bin/bash
# Tests for the master lock. Run: bash .githooks/test-master-lock.sh
# Builds throwaway repos in a temp dir, copies the lock's files into each, switches the
# lock on and drives real git commands against it (merges, fast-forwards, plain commits,
# cherry-picks, --no-verify, fetches, tags). Each case says whether the update to the
# default branch must be allowed or refused; a refusal must also leave the branch where
# it was and print the stated words. Exits non-zero if any case fails.

here="$(cd "$(dirname "$0")" && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
checker="$here/master-lock-check.mjs"

pass=0; fail=0
r=""; def=master; pfx=ABC

g() { git -C "$r" "$@"; }

# new_repo <name> [prefix] [default branch] [start number] [omit: prefix|lock|version|badlock]
# A repo whose first commit predates the lock being switched on, like a real project.
new_repo() {
  local name=$1 p=${2:-ABC} d=${3:-master} s=${4:-010} omit=${5:-}   # omit: prefix|lock|version|badlock|claude
  r="$tmp/$name"; def=$d; pfx=$p
  git init -q -b "$d" "$r"
  mkdir -p "$r/.githooks" "$r/docs/reviews"
  cp "$here/master-lock-check.mjs" "$here/reference-transaction" "$here/install-master-lock.sh" "$r/.githooks/"
  chmod +x "$r/.githooks/reference-transaction" "$r/.githooks/install-master-lock.sh"
  {
    printf -- '- **Default branch:** `%s`\n' "$d"
    [ "$omit" = prefix ] || printf -- '- **Change prefix:** `%s`\n' "$p"
    [ "$omit" = version ] || printf -- '- **Version files:** `package.json`, `app/version.txt`. Lockfiles are regenerated.\n'
    if [ "$omit" = badlock ]; then printf -- '- **Master lock starts at:** `%s-1x`\n' "$p"
    elif [ "$omit" != lock ]; then printf -- '- **Master lock starts at:** `%s-%s`\n' "$p" "$s"; fi
  } > "$r/CLAUDE.md"
  [ "$omit" != claude ] || rm "$r/CLAUDE.md"
  printf '{}\n' > "$r/package.json"; mkdir -p "$r/app" "$r/src"; printf '1\n' > "$r/app/version.txt"
  printf '# Changelog\n' > "$r/CHANGELOG.md"
  g add -A
  g update-index --chmod=+x .githooks/reference-transaction .githooks/install-master-lock.sh
  g commit -q -m "chore($p-001): init"
  g config core.hooksPath .githooks
}

# mk_record <number> <variant>: a review record in the new format, broken in one way.
mk_record() {
  local n=$1 v=$2 result=Pass
  local finding="- **[Low]** a thing — f.js
  **Caused by this change:** yes
  **Disposition:** fixed (how)"
  local rereview="## Re-review

### Round 1
It accepted every fix and raised no new finding. Round clean: yes.
"
  case $v in
    ok) ;;
    nofindings) finding=""; rereview="" ;;
    nolabel) finding="- **[Low]** a thing — f.js
  **Disposition:** fixed (how)" ;;
    logged) finding="- **[Low]** a thing — f.js
  **Caused by this change:** yes
  **Disposition:** logged in docs/BACKLOG.md" ;;
    settled) finding="- **[Low]** a thing — f.js
  **Caused by this change:** yes
  **Disposition:** logged in docs/BACKLOG.md
  **Settled by the user:** \"fine as it is\"" ;;
    blankline) finding="- **[Low]** a thing — f.js
  **Caused by this change:** yes

  **Disposition:** fixed (how)" ;;
    plainbullet) finding="- a thing — f.js
  **Disposition:** fixed (how)" ;;
    noaccept) rereview="## Re-review

### Round 1
Looked at it. Round clean: yes.
" ;;
    norereview) rereview="" ;;
    rejected) rereview="## Re-review

### Round 1
The re-reviewer rejected the fix.
" ;;
    unclean) rereview="## Re-review

### Round 1
It raised a new finding. Round clean: no.
" ;;
    round4) rereview="## Re-review

### Round 1
New finding. Round clean: no.

### Round 2
New finding. Round clean: no.

### Round 3
New finding. Round clean: no.

### Round 4
Round clean: yes.
" ;;
    failrow) result=Fail ;;
  esac
  printf '# Review: %s — t\n\n- **Change:** %s\n- **Review format:** accountability\n- **Plan:** x\n\n## Findings\n\n%s\n\n%s\n## Requirements trace\n| Requirement | Test | Result |\n|---|---|---|\n| R1 | t | %s |\n' \
    "$n" "$n" "$finding" "$rereview" "$result"
}

# put_record <number> <variant|old>: writes the record into the working tree and stages it.
put_record() {
  mkdir -p "$r/docs/reviews"
  if [ "$2" = old ]; then printf '# Review: %s\n\nOld style record, no accountability marker.\n' "$1" > "$r/docs/reviews/$1-x.md"
  else mk_record "$1" "$2" > "$r/docs/reviews/$1-x.md"; fi
  g add -A
}

# commit_with <number> <variant|old|none> <message> [git commit flags]   (none: no record at all)
commit_with() {
  local n=$1 v=$2 msg=$3; shift 3
  [ "$v" = none ] || put_record "$n" "$v"
  g commit -q --allow-empty "$@" -m "$msg"
}

# attempt <name> <ok|refused> <words the output must contain, or ''> <command...>
attempt() {
  local name=$1 want=$2 pat=$3; shift 3
  local before after code out
  before=$(g rev-parse "$def" 2>/dev/null)
  out=$("$@" 2>&1); code=$?
  after=$(g rev-parse "$def" 2>/dev/null)
  if [ "$want" = refused ]; then g merge --abort >/dev/null 2>&1; g reset -q --hard >/dev/null 2>&1; fi
  if [ "$want" = ok ]; then
    if [ $code -eq 0 ]; then pass=$((pass+1)); echo "PASS  $name"
    else fail=$((fail+1)); echo "FAIL  $name (wanted it allowed, got exit $code): $out"; fi
  else
    if [ $code -ne 0 ] && [ "$before" = "$after" ] && { [ -z "$pat" ] || printf '%s' "$out" | grep -qF -- "$pat"; }; then
      pass=$((pass+1)); echo "PASS  $name"
    else
      fail=$((fail+1)); echo "FAIL  $name (wanted it refused with \"$pat\"; exit $code, branch moved: $([ "$before" = "$after" ] && echo no || echo YES)): $out"
    fi
  fi
}

# check <name> <expected exit> <words the output must contain, or ''> <command...>
check() {
  local name=$1 want=$2 pat=$3; shift 3
  local out code
  out=$("$@" 2>&1); code=$?
  if [ "$code" = "$want" ] && { [ -z "$pat" ] || printf '%s' "$out" | grep -qF -- "$pat"; }; then pass=$((pass+1)); echo "PASS  $name"
  else fail=$((fail+1)); echo "FAIL  $name (wanted exit $want with \"$pat\", got $code): $out"; fi
}

# on_branch <branch> <number> <variant> <message>: a branch off the default with one numbered commit.
on_branch() {
  g switch -q "$def"
  g switch -q -c "$1"
  commit_with "$2" "$3" "$4"
}

status_in() { ( cd "$r" && node .githooks/master-lock-check.mjs status ); }

echo "== R1: every route onto the default branch is allowed when the records pass"
new_repo r1
on_branch work-merge ABC-020 ok "feat(ABC-020): work"; g switch -q master
attempt "no-ff merge of a change with a passing record" ok "" g merge --no-ff -q work-merge -m "feat(ABC-020): merge"
on_branch work-ff ABC-021 ok "feat(ABC-021): work"; g switch -q master
attempt "fast-forward merge" ok "" g merge --ff-only -q work-ff
on_branch work-pick ABC-022 ok "feat(ABC-022): work"; pick=$(g rev-parse HEAD); g switch -q master
attempt "cherry-pick" ok "" g cherry-pick "$pick"
attempt "plain commit" ok "" commit_with ABC-023 ok "feat(ABC-023): direct"
attempt "plain commit with --no-verify" ok "" commit_with ABC-024 ok "feat(ABC-024): direct" --no-verify
attempt "a change with no findings at all" ok "" commit_with ABC-025 nofindings "feat(ABC-025): direct"
echo "== R1: --no-verify and other routes do not get round the lock"
attempt "--no-verify commit with a failing record" refused "ABC-026" commit_with ABC-026 failrow "feat(ABC-026): x" --no-verify
g reset -q --hard
on_branch work-bad ABC-027 failrow "feat(ABC-027): work"; g switch -q master
attempt "fast-forward of a failing change" refused "ABC-027" g merge --ff-only -q work-bad
attempt "no-ff merge of a failing change" refused "ABC-027" g merge --no-ff -q work-bad -m "feat(ABC-027): merge"
g merge --abort 2>/dev/null; g reset -q --hard

echo "== R2: no review record"
new_repo r2
attempt "a change at the starting number with no record" refused "ABC-010 has no review record" commit_with ABC-010 none "feat(ABC-010): x"
attempt "a change above the starting number with no record" refused "ABC-022 has no review record" commit_with ABC-022 none "feat(ABC-022): x"

echo "== R3: each broken gate rule is refused, with the rule in the message"
new_repo r3
attempt "missing caused label" refused 'no "Caused by this change' commit_with ABC-030 nolabel "feat(ABC-030): x"
attempt "caused finding logged" refused "logged instead of fixed or explained" commit_with ABC-031 logged "feat(ABC-031): x"
attempt "findings but no re-review" refused "no re-review round is recorded" commit_with ABC-032 norereview "feat(ABC-032): x"
attempt "re-reviewer rejection left standing" refused "records a rejection" commit_with ABC-033 rejected "feat(ABC-033): x"
attempt "last round not clean" refused "did not finish" commit_with ABC-034 unclean "feat(ABC-034): x"
attempt "fourth round not authorised" refused "beyond the third" commit_with ABC-035 round4 "feat(ABC-035): x"
attempt "failed requirement" refused "failed its test" commit_with ABC-036 failrow "feat(ABC-036): x"
attempt "caused finding logged but settled by the user" ok "" commit_with ABC-037 settled "feat(ABC-037): x"
attempt "a clean record" ok "" commit_with ABC-038 ok "feat(ABC-038): x"
attempt "a round that does not record the re-reviewer's verdict" refused "does not say whether the re-reviewer accepted" commit_with ABC-039 noaccept "feat(ABC-039): x"
attempt "a finding written without the severity form" refused "has no severity" commit_with ABC-040 plainbullet "feat(ABC-040): x"
attempt "a blank line inside a finding" ok "" commit_with ABC-041 blankline "feat(ABC-041): x"

echo "== R4: commits with no usable change number"
new_repo r4
attempt "no number at all" refused "carries no ABC change number" commit_with x none "fix typo"
attempt "a number with too few digits" refused "carries no ABC change number" commit_with x none "feat(ABC-1): x"
attempt "another prefix's number" refused "carries no ABC change number" commit_with x none "feat(XYZ-050): x"
attempt "a number with no scope brackets" refused "carries no ABC change number" commit_with x none "feat: ABC-050 x"

echo "== R5: release commits"
new_repo r5
printf '# Changelog\n\n## [1.2.3]\n' > "$r/CHANGELOG.md"; printf '{"v":1}\n' > "$r/package.json"; printf '2\n' > "$r/app/version.txt"; g add -A
attempt "a release commit touching only the version files and changelog" ok "" g commit -q -m "chore(release): v1.2.3"
printf 'x\n' > "$r/src/a.txt"; printf '3\n' > "$r/app/version.txt"; g add -A
attempt "a release commit that also changes other files" refused "src/a.txt" g commit -q -m "chore(release): v1.2.4"
g reset -q --hard
printf '# Changelog\n\n## [1.2.5]\n' > "$r/CHANGELOG.md"; g add -A
attempt "a release-looking commit with the wrong message form" refused "carries no ABC change number" g commit -q -m "chore(release): 1.2.5"
g reset -q --hard
g switch -q -c build/v1.2.6
printf '4\n' > "$r/app/version.txt"; g add -A; g commit -q -m "chore(release): v1.2.6"; g switch -q master
attempt "a build branch merged with the release message" ok "" g merge --no-ff -q build/v1.2.6 -m "chore(release): v1.2.6"

echo "== R6: old numbers and old-format records are not checked"
new_repo r6
attempt "a number below the starting number with no record" ok "" commit_with ABC-009 none "feat(ABC-009): x"
attempt "an old-format record above the starting number" ok "" commit_with ABC-041 old "feat(ABC-041): x"

echo "== R7: work branches are never checked"
new_repo r7
g switch -q -c work
attempt "a numbered commit with a failing record on a work branch" ok "" commit_with ABC-050 failrow "feat(ABC-050): x"
attempt "an unnumbered commit on a work branch" ok "" commit_with x none "wip"
g switch -q master; commit_with ABC-051 ok "feat(ABC-051): other"; g switch -q work
attempt "merging the default branch into a work branch with git's own message" ok "" g merge -q master -m "Merge branch 'master' into work"
attempt "creating and deleting branches" ok "" bash -c "git -C '$r' branch tmp && git -C '$r' branch -D tmp"

echo "== R10: the lock fails closed"
new_repo r10a ABC master 010 prefix
attempt "settings missing the change prefix" refused "Change prefix" commit_with ABC-020 ok "feat(ABC-020): x"
new_repo r10b ABC master 010 lock
attempt "settings missing the starting number" refused "Master lock starts at" commit_with ABC-020 ok "feat(ABC-020): x"
new_repo r10c ABC master 010 version
attempt "settings missing the version files" refused "Version files" commit_with ABC-020 ok "feat(ABC-020): x"
new_repo r10d ABC master 010 badlock
attempt "a starting number that is not a change number" refused "Master lock starts at" commit_with ABC-020 ok "feat(ABC-020): x"
new_repo r10e
mkdir -p "$r/docs/reviews/ABC-060-x.md"; printf 'x\n' > "$r/docs/reviews/ABC-060-x.md/file"; g add -A
attempt "a review record that cannot be read as a file" refused "could not finish" g commit -q -m "feat(ABC-060): x"
g reset -q --hard
new_repo r10f
printf -- '- **Default branch:** `master`\n' > "$r/CLAUDE.md"; g add -A
attempt "a change that would strip the lock's settings" refused "without its settings" g commit -q -m "feat(ABC-061): x"
g reset -q --hard
new_repo r10g ABC master 010 claude
g config init.defaultBranch master
attempt "no CLAUDE.md at all at the current tip" refused "settings cannot be read" commit_with ABC-020 ok "feat(ABC-020): x"
new_repo r10h
attempt "deleting the default branch" refused "cannot be deleted" bash -c "git -C '$r' update-ref -d refs/heads/master"
check "a line the hook cannot read" 2 "refuses" bash -c "printf 'garbage\n' | ( cd '$r' && node .githooks/master-lock-check.mjs hook prepared )"
check "a state other than prepared is ignored" 0 "" bash -c "printf 'garbage\n' | ( cd '$r' && node .githooks/master-lock-check.mjs hook committed )"

echo "== R10: a check-in cannot loosen the lock's own settings"
new_repo r10s
# change_settings <sed expression> <number> <message>: a numbered change with a passing record that also edits CLAUDE.md
change_settings() { sed -i "$1" "$r/CLAUDE.md"; commit_with "$2" ok "$3"; }
attempt "raising the starting number" refused "starting number (raised)" change_settings 's/ABC-010/ABC-500/' ABC-080 "feat(ABC-080): x"
attempt "adding a version file" refused "added src/a.txt" change_settings 's/`app\/version.txt`/`app\/version.txt`, `src\/a.txt`/' ABC-081 "feat(ABC-081): x"
attempt "changing the change prefix" refused "" change_settings 's/`ABC`/`XYZ`/' ABC-082 "feat(ABC-082): x"
attempt "changing the default branch name" refused "the default branch" change_settings 's/`master`/`trunk`/' ABC-083 "feat(ABC-083): x"
attempt "lowering the starting number" ok "" change_settings 's/ABC-010/ABC-005/' ABC-084 "feat(ABC-084): x"
attempt "narrowing the version files" ok "" change_settings 's/`package.json`, //' ABC-085 "feat(ABC-085): x"

echo "== R11: the settings come from CLAUDE.md"
new_repo r11 XYZ trunk 050
attempt "below the starting number, other prefix" ok "" commit_with XYZ-049 none "feat(XYZ-049): x"
attempt "at the starting number, other prefix" refused "XYZ-050 has no review record" commit_with XYZ-050 none "feat(XYZ-050): x"
attempt "this prefix with a passing record" ok "" commit_with XYZ-051 ok "feat(XYZ-051): x"
attempt "the default prefix is not special" refused "carries no XYZ change number" commit_with ABC-060 none "feat(ABC-060): x"
g switch -q -c master
attempt "a branch that happens to be called master is not the default here" ok "" commit_with x none "wip"
files=$(find "$here" -type f ! -name test-master-lock.sh)
check "no project names in the lock's files" 1 "" grep -nE 'DTP|Disney|tauri|Cargo|package-lock' $files
check "no hard-coded branch names in the lock's files" 1 "" grep -nE "['\"]master['\"]|['\"]main['\"]|refs/heads/(master|main)" $files

echo "== R12: only the local default branch is guarded"
new_repo r12
git init -q --bare "$tmp/r12-remote.git"
g remote add origin "$tmp/r12-remote.git"
g push -q origin master
git clone -q "$tmp/r12-remote.git" "$tmp/r12-other"
git -C "$tmp/r12-other" -c user.name=t -c user.email=t@t commit -q --allow-empty -m "no number and no record"
git -C "$tmp/r12-other" push -q origin master
attempt "a fetch that moves the remote-tracking branch to an unrecorded commit" ok "" g fetch -q origin
unrecorded=$(g rev-parse origin/master)
attempt "a tag created on an unrecorded commit" ok "" g tag t1 "$unrecorded"
attempt "a tag moved to another commit" ok "" g tag -f t1 HEAD
attempt "a remote-tracking ref set by hand" ok "" g update-ref refs/remotes/origin/zzz "$unrecorded"
attempt "another branch set to an unrecorded commit" ok "" g update-ref refs/heads/other "$unrecorded"
attempt "the default branch set to the same unrecorded commit" refused "carries no ABC change number" g update-ref refs/heads/master "$unrecorded"
attempt "pulling the unrecorded commit into the default branch" refused "carries no ABC change number" g merge --ff-only -q origin/master

echo "== R14: the catch-up merge on a branch needs the change number"
new_repo r14
on_branch work-a ABC-070 ok "feat(ABC-070): work"; g switch -q master
commit_with ABC-071 ok "feat(ABC-071): other change"
g switch -q work-a
g merge -q master -m "chore(ABC-070): catch up with master"
g switch -q master
attempt "a branch with a numbered catch-up merge" ok "" g merge --no-ff -q work-a -m "feat(ABC-070): merge"
on_branch work-b ABC-072 ok "feat(ABC-072): work"; g switch -q master
commit_with ABC-073 ok "feat(ABC-073): other change"
g switch -q work-b
g merge -q master --no-edit
g switch -q master
attempt "a branch with git's unnumbered catch-up merge" refused "Merge branch 'master' into work-b" g merge --no-ff -q work-b -m "feat(ABC-072): merge"
g merge --abort 2>/dev/null; g reset -q --hard

echo "== R8: the status check"
new_repo r8
check "status when the lock is on" 0 "Master lock: ON" status_in
g config --unset core.hooksPath
check "status with core.hooksPath unset" 1 "Master lock: OFF" status_in
g config core.hooksPath elsewhere
check "status with the wrong hook folder" 1 "not this project's" status_in
g config core.hooksPath .githooks
g update-index --chmod=-x .githooks/reference-transaction
check "status when the hook file is not executable" 1 "not marked executable" status_in
g update-index --chmod=+x .githooks/reference-transaction
check "status with the hook file back to executable" 0 "Master lock: ON" status_in
mv "$r/.githooks/reference-transaction" "$r/.githooks/gone"
check "status with the hook file missing" 1 "reference-transaction is missing" status_in
mv "$r/.githooks/gone" "$r/.githooks/reference-transaction"
sed -i '/Master lock starts at/d' "$r/CLAUDE.md"
check "status with the settings incomplete" 1 "Master lock starts at" status_in
g checkout -q -- CLAUDE.md
g config --unset core.hooksPath
check "the setup script switches the lock on" 0 "Master lock: ON" bash "$r/.githooks/install-master-lock.sh"
check "the setup script set the hook folder" 0 ".githooks" g config --get core.hooksPath
check "the setup script is safe to run again" 0 "Master lock: ON" bash "$r/.githooks/install-master-lock.sh"

echo "== the gate agrees with the records already merged into this project"
top=$(git -C "$here" rev-parse --show-toplevel 2>/dev/null)
if [ -n "$top" ] && [ -d "$top/docs/reviews" ]; then
  for f in "$top"/docs/reviews/*.md; do
    case "$f" in *-before.md) continue ;; esac
    grep -qE '^- \*\*Review format:\*\* accountability' "$f" || continue
    num=$(basename "$f" | grep -oE '^[A-Za-z]+-[0-9]+')
    check "gate passes the existing record $num" 0 "" bash -c "cd '$top' && node '$checker' gate $num"
  done
fi

echo
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
