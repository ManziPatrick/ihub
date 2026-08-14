#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Install the repo's committed git hooks (one-time per clone).
#
#  Usage:  scripts/install-hooks.sh
#
#  Points this clone's git at .githooks/ (a pre-push guard that keeps
#  accidental direct pushes off `main`). Hooks live in the repo so the
#  guard ships with the code; `core.hooksPath` is a per-clone setting,
#  so run this once in every new clone.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

git config core.hooksPath ".githooks"
echo "✅ Git hooks installed: $(git config core.hooksPath)"
echo "   → $REPO_ROOT/.githooks/pre-push (guards main against direct pushes)"
