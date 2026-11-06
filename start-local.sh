#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8080}"
DB_TIMEOUT="${DB_TIMEOUT:-90}"
BACKEND_TIMEOUT="${BACKEND_TIMEOUT:-180}"

PIDS=()

log() { printf '\033[1;34m[local]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[local]\033[0m %s\n' "$*" >&2; }

cleanup() {
  trap - EXIT INT TERM
  log "Stopping processes..."
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill -- -"$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  if [[ "${STOP_DB:-0}" == "1" ]]; then
    log "Stopping database..."
    docker compose -f "$BACKEND_DIR/compose.yaml" stop database || true
  fi
}
trap cleanup EXIT INT TERM

# 1. Database
log "Starting database (docker compose)..."
docker compose -f "$BACKEND_DIR/compose.yaml" up -d database

log "Waiting for database to be ready (max ${DB_TIMEOUT}s)..."
for ((i = 0; i < DB_TIMEOUT; i++)); do
  if docker compose -f "$BACKEND_DIR/compose.yaml" exec -T database \
      mysqladmin ping -h 127.0.0.1 -uroot -pqwer --silent >/dev/null 2>&1; then
    log "Database is ready."
    break
  fi
  sleep 1
  if ((i == DB_TIMEOUT - 1)); then
    err "Database did not start within ${DB_TIMEOUT}s."
    exit 1
  fi
done

# 2. Backend
log "Starting backend..."
(cd "$BACKEND_DIR" && exec setsid ./mvnw spring-boot:run) &
PIDS+=($!)
BACKEND_PID=$!

log "Waiting for backend on port ${BACKEND_PORT} (max ${BACKEND_TIMEOUT}s)..."
for ((i = 0; i < BACKEND_TIMEOUT; i++)); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend exited before it became ready."
    exit 1
  fi
  if (exec 3<>"/dev/tcp/127.0.0.1/${BACKEND_PORT}") 2>/dev/null; then
    log "Backend is ready."
    break
  fi
  sleep 1
  if ((i == BACKEND_TIMEOUT - 1)); then
    err "Backend did not start within ${BACKEND_TIMEOUT}s."
    exit 1
  fi
done

# 3. Frontend
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Installing frontend dependencies (npm ci)..."
  (cd "$FRONTEND_DIR" && npm ci)
fi

log "Starting frontend (http://localhost:4200)..."
(cd "$FRONTEND_DIR" && exec setsid npm start) &
PIDS+=($!)

# Wait until any process exits
wait -n
err "One of the processes has exited."
