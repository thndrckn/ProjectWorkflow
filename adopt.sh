#!/bin/bash
# Sets up the ProjectWorkflow in a project. Run it yourself, in your own terminal:
#   bash adopt.sh [project folder]        (the project defaults to the current folder)
# It turns on the trunk lock in the project, installs this plugin and Matt Pocock's pinned plugin
# from this repo's release/ folder, and checks that Matt's one-time setup was done. Safe to run again.
# It changes settings on your machine (plugins, the project's git hooks), which is why you run it.
# Set CLAUDE to another program to try it without touching your real plugins (the tests do).

set -u
here="$(cd "$(dirname "$0")" && pwd)"
release="$here/release"
claude_bin="${CLAUDE:-claude}"
proj="$(cd "${1:-.}" && pwd)" || { echo "That project folder does not exist." >&2; exit 1; }
stop() { echo "STOPPED: $*" >&2; exit 1; }

# 1. Prerequisites
command -v git >/dev/null || stop "git is not installed."
command -v node >/dev/null || stop "node is not installed (the trunk lock needs it)."
command -v "$claude_bin" >/dev/null || stop "the claude command is not installed."
git -C "$proj" rev-parse --show-toplevel >/dev/null 2>&1 || stop "$proj is not a git repository."
proj="$(git -C "$proj" rev-parse --show-toplevel)"
# The workflow's own repo runs its lock from its own githooks folder (CLAUDE.md, "Trunk lock"): the lock's
# status check only accepts that folder, and release/ is untracked, so a worktree could not find it. Pointing
# git at release/ here would read as "lock off" there. Same git directory means the same repo, worktrees included.
common_dir() { git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null; }
mine=$(common_dir "$here")
[ -n "$mine" ] && [ "$mine" = "$(common_dir "$proj")" ] && stop "this is the workflow's own repo, which uses its own githooks folder. Run: bash githooks/install-trunk-lock.sh"
# Checked after the refusal above, because a worktree of the workflow's own repo has no release/ folder.
[ -f "$release/.claude-plugin/marketplace.json" ] || stop "release/ is not set up here. From the ProjectWorkflow folder run: git worktree add release <a local tag, for example v0.1.0>"
[ -f "$proj/CLAUDE.md" ] || stop "the project has no CLAUDE.md. Copy the Workflow lines from ProjectWorkflow's CLAUDE.md into one first."
for line in 'Default branch' 'Change prefix' 'Version files' 'Trunk lock starts at'; do
  grep -q "\*\*$line:\*\*" "$proj/CLAUDE.md" || stop "the project's CLAUDE.md has no \"$line\" line in its Workflow section."
done

# 2. Plugins (Matt's official copy must not also be installed, or the skills would load twice)
listing=$("$claude_bin" plugin list 2>/dev/null)
case "$listing" in *mattpocock-skills@claude-plugins-official*)
  stop "Matt's skills are installed from the official marketplace. Remove that copy, then run this again: $claude_bin plugin uninstall mattpocock-skills@claude-plugins-official" ;;
esac
markets=$("$claude_bin" plugin marketplace list 2>/dev/null)
case "$markets" in *projectworkflow*) ;; *)
  "$claude_bin" plugin marketplace add "$release" || stop "could not add the ProjectWorkflow marketplace." ;;
esac
for p in projectworkflow mattpocock-skills; do
  case "$listing" in *"$p@projectworkflow"*) echo "Plugin $p is installed." ;; *)
    "$claude_bin" plugin install "$p@projectworkflow" || stop "could not install $p." ;;
  esac
done

# 3. The trunk lock, in the project
hooks="$release/githooks"
chmod +x "$hooks/reference-transaction" 2>/dev/null
hp=$(cygpath -m "$hooks" 2>/dev/null || echo "$hooks")   # Windows form where there is one, which git and node both read
git -C "$proj" config core.hooksPath "$hp" || stop "could not point git at the lock's hooks."
(cd "$proj" && node "$hooks/trunk-lock-check.mjs" status) || stop "the lock did not switch on."

# 4. Matt's one-time setup is a command only you can type
if [ ! -f "$proj/docs/agents/issue-tracker.md" ]; then
  echo "ALMOST DONE: Matt's one-time setup has not been done in this project."
  echo "Open Claude Code in $proj, type /setup-matt-pocock-skills, then run this again."
  exit 1
fi
echo "Done: the lock is on, both plugins are installed and Matt's setup is in place."
