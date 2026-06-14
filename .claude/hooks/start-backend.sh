#!/usr/bin/env bash
# Boots the Express backend in the background after env hydration so the
# Vite dev server's /api proxy has something to talk to in every session.
# Idempotent: if a server is already listening on PORT, we don't start a second one.
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend"
LOG_DIR="$ROOT/.claude/logs"
LOG_FILE="$LOG_DIR/backend.log"
PORT="${PORT:-5000}"

mkdir -p "$LOG_DIR"

# Already running?
if (echo >"/dev/tcp/127.0.0.1/$PORT") >/dev/null 2>&1; then
  echo "[start-backend] already listening on :$PORT, skipping"
  exit 0
fi

# Install deps if missing (first time after clone)
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "[start-backend] installing backend deps…"
  (cd "$BACKEND_DIR" && npm install --no-audit --no-fund --silent >>"$LOG_FILE" 2>&1) || {
    echo "[start-backend] npm install failed; see $LOG_FILE"
    exit 0
  }
fi

# Detach the server so the hook returns immediately
(
  cd "$BACKEND_DIR"
  nohup node server.js >>"$LOG_FILE" 2>&1 &
  disown || true
) &

# Wait briefly for health
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    echo "[start-backend] up on :$PORT"
    exit 0
  fi
  sleep 0.5
done

echo "[start-backend] backend did not respond yet; tail $LOG_FILE if needed"
