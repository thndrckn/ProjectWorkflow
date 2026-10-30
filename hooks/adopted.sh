#!/bin/bash
# Sourced by the guard hooks. The workflow's guard only acts in a project that has adopted it: one whose
# CLAUDE.md has a Workflow section (a heading line such as "## Workflow"). Anywhere else the hook allows
# everything, so the plugin does no harm in a project that has not adopted the workflow.
# workflow_adopted <project folder>: succeeds when the folder's CLAUDE.md has that heading.
workflow_adopted() {
  grep -qiE '^#+[[:space:]]+workflow([^[:alnum:]]|$)' "$1/CLAUDE.md" 2>/dev/null
}
