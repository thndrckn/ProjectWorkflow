#!/bin/sh
# One-time setup of the master lock for this copy of the project: points git at this
# folder's hooks and makes the hook file executable, then reports whether the lock is on.
# Safe to run again. Run it yourself, in your own terminal (see CLAUDE.md, "Master lock").
here=$(cd "$(dirname "$0")" && pwd) || exit 1
cd "$here" || exit 1
rel=$(git rev-parse --show-prefix) || { echo "Not inside a git repository." >&2; exit 1; }
rel=${rel%/}
cd "$(git rev-parse --show-toplevel)" || exit 1
chmod +x "$rel/reference-transaction" "$rel/install-master-lock.sh" 2>/dev/null
git config core.hooksPath "$rel" || exit 1
node "$rel/master-lock-check.mjs" status
