#!/usr/bin/env bash
# MyMCP - one-click launcher for macOS/Linux
cd "$(dirname "$0")" || exit 1
echo "Starting MyMCP..."
node scripts/start.mjs
