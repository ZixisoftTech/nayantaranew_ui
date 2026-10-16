#!/usr/bin/env bash
# Run the PHP frontend (http://localhost:8000) and Node API (http://localhost:8085) together.
# Ctrl+C stops both.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PHP_PORT="${PHP_PORT:-8000}"
PIDS=()

cleanup() {
    trap - INT TERM EXIT
    echo "Stopping..."
    for pid in ${PIDS[@]+"${PIDS[@]}"}; do
        pkill -TERM -P "$pid" 2>/dev/null
        kill -TERM "$pid" 2>/dev/null
    done
    wait 2>/dev/null
}
trap cleanup INT TERM EXIT

if [ ! -d "$ROOT/nayantara/node_modules" ]; then
    echo "Installing backend dependencies..."
    (cd "$ROOT/nayantara" && npm install) || exit 1
fi

echo "Starting API on http://localhost:8085"
cd "$ROOT/nayantara"
node --watch --env-file-if-exists=.env app.js &
PIDS+=($!)

echo "Starting frontend on http://localhost:$PHP_PORT"
cd "$ROOT"
php -S "localhost:$PHP_PORT" &
PIDS+=($!)

# Exit (and stop the other) as soon as either server dies.
while kill -0 "${PIDS[0]}" 2>/dev/null && kill -0 "${PIDS[1]}" 2>/dev/null; do
    sleep 1
done
