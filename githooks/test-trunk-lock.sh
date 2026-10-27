#!/bin/bash
# Tests for the trunk lock. Run: bash githooks/test-trunk-lock.sh
# Builds throwaway repos in a temp dir, switches the lock on in each, and checks the gate on one
# review record (broken one way at a time) and real check-in merges against the hook. Exits non-zero
# if any case fails.

here="$(cd "$(dirname "$0")" && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
pass=0; fail=0
r=""
g() { git -C "$r" "$@"; }
check_lock() { node "$r/githooks/trunk-lock-check.mjs" "$@"; }

# ok <name>, bad <name> <words>: run the command in "$@" after them and compare.
expect() { # expect <exit code> <words or ""> <name> <command...>
  local want=$1 words=$2 name=$3; shift 3
  local out; out=$("$@" 2>&1); local got=$?
  if { [ "$got" -eq "$want" ] || { [ "$want" -eq 1 ] && [ "$got" -ne 0 ]; }; } && { [ -z "$words" ] || [[ "$out" == *"$words"* ]]; }; then pass=$((pass+1))
  else fail=$((fail+1)); echo "FAIL: $name (exit $got, wanted $want${words:+, words \"$words\"})"; echo "$out" | head -5; fi
}

new_repo() {
  r="$tmp/$1"
  git init -q -b trunk "$r"
  mkdir -p "$r/githooks" "$r/docs/reviews" "$r/docs/plans"
  cp "$here/trunk-lock-check.mjs" "$here/reference-transaction" "$r/githooks/"
  chmod +x "$r/githooks/reference-transaction"
  printf -- '- **Default branch:** `trunk`\n- **Change prefix:** `PWF`\n- **Version files:** `package.json`\n- **Trunk lock starts at:** `PWF-010`\n' > "$r/CLAUDE.md"
  printf '{}\n' > "$r/package.json"; printf '# Changelog\n' > "$r/CHANGELOG.md"
  g add -A; g update-index --chmod=+x githooks/reference-transaction
  g commit -q -m "chore(PWF-001): init"
  g config core.hooksPath githooks
}

# record <variant>: a record in the one format, broken in one way.
record() {
  local finding='- **[Low]** a thing — f.js
  **Caused by this change:** no
  **Recommendation:** none
  **Outcome:** fixed (how)
  **Re-review:** accepted'
  local level='Full' clean='yes' row='| R1 | a test | Pass |' findings
  case $1 in
    ok) ;;
    nolevel) level='' ;;
    nooutcome) finding=${finding/'**Outcome:** fixed (how)'/} ;;
    noreview) finding=${finding/'**Re-review:** accepted'/} ;;
    rejected) finding=${finding/accepted/rejected} ;;
    rejected-decided) finding=${finding/accepted/rejected$'\n'  '**Decided by:** Jason'} ;;
    jason-undecided) finding=${finding/'fixed (how)'/'accepted by Jason'}; finding=${finding/'**Re-review:** accepted'/} ;;
    caused-backlog) finding=${finding/'**Caused by this change:** no'/'**Caused by this change:** yes'}; finding=${finding/'fixed (how)'/'moved to backlog'}; finding=${finding/'**Re-review:** accepted'/} ;;
    notclean) clean='no' ;;
    notclean-decided) clean='no
**Decided by:** Jason' ;;
    fail) row='| R1 | a test | Fail |' ;;
    manual) row='| R1 | a test | Manual |' ;;
    manuallower) row='| R1 | a test | manual |' ;;
    manualupper) row='| R1 | a test | MANUAL |' ;;
    empty) row='| R1 | a test |  |' ;;
    tbd) row='| R1 | a test | TBD |' ;;
    manualfail) row=$'| R1 | a test | Manual |\n| R2 | another | Fail |' ;;
    none) finding='None' ;;
    bare) finding='- [High] a thing with no labels' ;;
    lower) finding='- [high] a thing with no labels' ;;
    lowerbold) finding='- **[high]** a thing with no labels' ;;
    starbullet) finding='* [High] a thing with no labels' ;;
    numbered) finding='1. [High] a thing with no labels' ;;
    indented) finding='  - [High] a thing with no labels' ;;
    indentedafter) finding="$finding"$'\n''  - [High] sneaky, after a real finding' ;;
    heading) finding='### [High] a thing with no labels' ;;
    triple) finding='- ***[High]*** a thing with no labels' ;;
    prose) finding='Something went wrong here.' ;;
  esac
  [ "$level" = '' ] && level_line='' || level_line="- **Level:** $level"
  printf '# Review: x\n- **Change:** x\n%s\n\n## Findings\n%s\n\n## Re-review\n**Re-review clean:** %s\n\n## Requirements trace\n| Requirement | Test | Result |\n|---|---|---|\n%s\n\n## Summary\nx\n' "$level_line" "$finding" "$clean" "$row"
}

# --- the gate on one record
new_repo gate
n=PWF-031
put() { mkdir -p "$r/docs/reviews"; record "$1" > "$r/docs/reviews/$n-x.md"; }
gate() { (cd "$r" && node githooks/trunk-lock-check.mjs gate "${1:-$n}"); }
put ok;               expect 0 "passed" "a complete record passes" gate
put none;             expect 0 "passed" "no findings passes" gate
put nolevel;          expect 1 "Level" "a missing level fails" gate
for form in bare lower lowerbold starbullet numbered indented indentedafter heading triple prose; do
  put $form;          expect 1 "not understood" "an unlabelled or oddly written finding ($form) is refused" gate
done
put nooutcome;       expect 1 "no outcome" "a finding without an outcome fails" gate
put noreview;         expect 1 "Re-review: accepted/rejected" "a fixed finding without a re-review line fails" gate
put rejected;         expect 1 "Decided by: Jason" "a rejection without Jason's decision fails" gate
put rejected-decided; expect 0 "passed" "a rejection decided by Jason passes" gate
put jason-undecided;  expect 1 "Decided by: Jason" "accepted by Jason without the decision line fails" gate
put caused-backlog;   expect 1 "moved to the backlog" "a caused finding moved to the backlog fails" gate
put notclean;         expect 1 "not clean" "a re-review that is not clean fails" gate
put notclean-decided; expect 0 "passed" "a not-clean re-review decided by Jason passes" gate
put fail;             expect 1 "failed its test" "a failed requirement fails" gate
put manual;           expect 0 "passed" "a Manual result does not block the gate" gate
put manuallower;      expect 0 "passed" "manual in lower case passes" gate
put manualupper;      expect 0 "passed" "MANUAL in capitals passes" gate
put empty;            expect 1 "no passing result" "an empty result fails" gate
put tbd;              expect 1 "no passing result" "an unrecognised result (TBD) fails" gate
put manualfail;       expect 1 "failed its test" "a Manual row does not hide a Fail row" gate
rm "$r/docs/reviews/$n-x.md"; expect 1 "no review record" "a missing record fails" gate
expect 1 "not a change or ticket number" "another prefix fails" gate ABC-031

# --- ticket numbers
record ok > "$r/docs/reviews/$n.1-t.md"
expect 0 "passed" "a ticket number is accepted" gate "$n.1"
mkdir -p "$r/docs/plans/$n-big"; : > "$r/docs/plans/$n-big/$n.1-t.md"; : > "$r/docs/plans/$n-big/$n.2-u.md"
record ok > "$r/docs/reviews/$n-big.md"
expect 1 "Ticket $n.2" "a change fails while a ticket has no record" gate
record ok > "$r/docs/reviews/$n.2-u.md"
expect 0 "passed" "a change passes once every ticket record passes" gate

# --- the hook on real check-ins
checkin() { # checkin <variant> <branch> : branch off trunk with a plan, record and a numbered commit
  g switch -q -c "$2" trunk
  put "$1"; printf 'x\n' > "$r/f.txt"
  g add -A; g commit -q -m "feat($n): thing"
  g switch -q trunk
}
new_repo hook
expect 1 "refused" "a plain commit on trunk is refused" bash -c "cd '$r' && echo y > a && git add a && git commit -q -m 'feat($n): direct'"
checkin ok c1;      expect 0 "" "a check-in with a passing record is allowed" g merge -q --no-ff c1 -m "feat($n): thing"
g reset -q --hard HEAD 2>/dev/null
new_repo hook2; n=PWF-032
checkin fail c2;    before=$(g rev-parse trunk)
expect 1 "failed its test" "a check-in with a failing record is refused" g merge -q --no-ff c2 -m "feat($n): thing"
[ "$(g rev-parse trunk)" = "$before" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: a refused check-in must leave trunk where it was"; }
g merge --abort 2>/dev/null; g reset -q --hard "$before" 2>/dev/null
g switch -q -c c3 trunk; printf 'y\n' > "$r/h.txt"; g add -A; g commit -q -m "no number here"; g switch -q trunk
expect 1 "carries no PWF change number" "a commit without a change number is refused" g merge -q --no-ff c3 -m "feat($n): thing"
g merge --abort 2>/dev/null; g reset -q --hard "$before" 2>/dev/null

# --- a large change: tickets inside a whole-number check-in
new_repo big; n=PWF-033
mkdir -p "$r/docs/plans/$n-big"; : > "$r/docs/plans/$n-big/$n.1-t.md"
g switch -q -c integ trunk
put ok; record ok > "$r/docs/reviews/$n.1-t.md"; printf 'x\n' > "$r/f.txt"
g add -A; g commit -q -m "docs($n): approved spec"
g switch -q -c tick integ; printf 'z\n' > "$r/t.txt"; g add -A; g commit -q -m "feat($n.1): ticket work"
g switch -q integ; g merge -q --no-ff tick -m "chore($n.1): merge ticket"; g switch -q trunk
g merge -q --no-ff integ -m "feat($n): big thing" 2>/dev/null
expect 0 "" "a large change checks in under its whole number" g rev-parse --verify -q trunk
expect 0 "" "(its tickets were merged inside it)" bash -c "cd '$r' && git log --format=%s trunk | grep -q 'ticket work'"
new_repo big2; n=PWF-034
g switch -q -c tick2 trunk; put ok; printf 'z\n' > "$r/t.txt"; g add -A; g commit -q -m "feat($n.1): ticket only"
g switch -q trunk
expect 1 "only a whole change number" "a ticket's own commit as the tip of trunk is refused" g merge -q --ff-only tick2

# --- a lock loaded from outside the project (adopt.sh): its fail-closed checks still apply
new_repo ext; n=PWF-035
g config --unset core.hooksPath
printf -- '- **Default branch:** `trunk`
' > "$r/CLAUDE.md"; g add -A; g commit -q -m "chore(PWF-035): break the settings"
cp -r "$r/githooks" "$tmp/extlock"; g config core.hooksPath "$tmp/extlock"
expect 1 "settings are incomplete" "an outside lock refuses when the project's settings are broken" bash -c "cd '$r' && echo y > a && git add a && git commit -q -m 'feat($n): x'"

echo "trunk lock tests: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
