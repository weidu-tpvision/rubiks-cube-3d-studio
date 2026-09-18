#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXEC="$DIR/release/RubiksCubeStudio-linux-x64/RubiksCubeStudio"

if [ -f "$EXEC" ]; then
  chmod +x "$EXEC"
  exec "$EXEC" "$@"
else
  echo "Linux executable not found at $EXEC"
  echo "Building with npm run electron:build:linux..."
  cd "$DIR"
  npm run electron:build:linux
  chmod +x "$EXEC"
  exec "$EXEC" "$@"
fi
