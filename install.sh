#!/usr/bin/env bash
# scaffold-code installer — curl -fsSL <raw url>/install.sh | bash
# Clones (or updates) the canonical repo, puts `scaffold` on PATH, and installs
# the machine-global adapters (pi extension + Claude Code hooks).
set -euo pipefail

REPO_URL="${SCAFFOLD_REPO:-https://github.com/1337hero/scaffold-code.git}"
DIR="${SCAFFOLD_HOME:-$HOME/.scaffold-code}"

command -v bun >/dev/null || { echo "scaffold: bun is required (https://bun.sh)"; exit 1; }
command -v git >/dev/null || { echo "scaffold: git is required"; exit 1; }

# running from inside a checkout? use it as canonical instead of cloning
SELF="$(cd "$(dirname "${BASH_SOURCE[0]:-/nonexistent}")" 2>/dev/null && pwd || true)"
if [ -n "$SELF" ] && [ -f "$SELF/bin/scaffold" ]; then
  DIR="$SELF"
elif [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  git clone "$REPO_URL" "$DIR"
fi

mkdir -p "$HOME/.local/bin"
ln -sf "$DIR/bin/scaffold" "$HOME/.local/bin/scaffold"
"$DIR/bin/scaffold" setup

echo "scaffold: installed (canonical: $DIR)"
case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "note: add ~/.local/bin to your PATH" ;;
esac
