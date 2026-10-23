#!/usr/bin/env bash
# .claude/hooks/rename-plan.sh
# Silently renames the plan file after ExitPlanMode approval,
# using the plan's first `#` heading. A heading that starts with a change number
# (e.g. `# DTP-085 — Title`) becomes `DTP-085-title.md`; any other heading becomes
# `YYYY-MM-DD-title.md`. A file already named `DTP-###-*.md` is left alone.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | grep -o '"filePath"[[:space:]]*:[[:space:]]*"[^"]*"' | sed -E 's/.*"filePath"[[:space:]]*:[[:space:]]*"([^"]*)"/\1/')
PLAN=$(echo "$INPUT" | grep -o '"plan"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"plan"[[:space:]]*:[[:space:]]*"([^"]*)"/\1/')

if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Pull the first markdown heading out of the actual file (more reliable than
# parsing escaped JSON for multi-line content)
TITLE=$(grep -m 1 '^# ' "$FILE_PATH" | sed 's/^# //')

if [[ -z "$TITLE" ]]; then
  exit 0
fi

case "$(basename "$FILE_PATH")" in
  DTP-[0-9][0-9][0-9]-*) exit 0 ;;
esac

SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
DATE=$(date +%Y-%m-%d)
DIR=$(dirname "$FILE_PATH")
if echo "$TITLE" | grep -qE '^DTP-[0-9]{3}'; then
  NUM=$(echo "$TITLE" | grep -oE '^DTP-[0-9]{3}')
  REST=$(echo "$SLUG" | sed -E 's/^dtp-[0-9]{3}-?//')
  NEW_PATH="$DIR/$NUM-$REST.md"
  if [[ -z "$REST" ]]; then NEW_PATH="$DIR/$NUM.md"; fi
else
  NEW_PATH="$DIR/$DATE-$SLUG.md"
fi

# avoid clobbering if the target somehow already exists
BASE="${NEW_PATH%.md}"
COUNT=1
while [[ -f "$NEW_PATH" ]]; do
  NEW_PATH="$BASE-$COUNT.md"
  COUNT=$((COUNT + 1))
done

mv "$FILE_PATH" "$NEW_PATH"
exit 0