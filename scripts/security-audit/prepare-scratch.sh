#!/bin/bash
# ABOUTME: Creates an agent's scratch/ (size-limited tmpfs, owned by nobody) and parent-owned
# artifacts/ (root-only) under <output-dir>/agents/<agent-id>/.
# Usage: prepare-scratch.sh <output-dir> <agent-id> [size, default 256m]
set -euo pipefail
OUT="$1"; ID="$2"; SIZE="${3:-256m}"
[[ "$ID" =~ ^[a-z0-9][a-z0-9_-]{0,63}$ ]] || { echo "bad agent id: $ID" >&2; exit 2; }
case "$ID" in con|prn|aux|nul|com[1-9]|lpt[1-9]) echo "reserved agent id: $ID" >&2; exit 2 ;; esac
ROOT="$OUT/agents/$ID"
mkdir -p "$ROOT/scratch" "$ROOT/artifacts"
chmod 700 "$ROOT/artifacts"
findmnt -n "$ROOT/scratch" >/dev/null || mount -t tmpfs -o "size=$SIZE,mode=0700,uid=$(id -u nobody),gid=$(id -g nobody)" tmpfs "$ROOT/scratch"
echo "$ROOT"
