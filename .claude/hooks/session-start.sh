#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: installs dependencies and
# generates the Prisma client.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if [ ! -f package.json ]; then
  echo "No package.json; skipping dependency install."
  exit 0
fi

# Playwright: use the preinstalled Chromium.
echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1' >> "${CLAUDE_ENV_FILE:-/dev/null}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

command -v pnpm >/dev/null 2>&1 || corepack enable >/dev/null 2>&1 || npm install -g pnpm
pnpm install --frozen-lockfile

if [ -f prisma/schema.prisma ]; then
  pnpm exec prisma generate
fi
