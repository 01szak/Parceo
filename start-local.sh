#!/usr/bin/env bash
set -euo pipefail

log() { printf '\033[1;34m[local]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[local]\033[0m %s\n' "$*" >&2; }

# optional: ./start-local.sh debug  (backend waits for a debugger on port 5005)
OPTIONS="${1:-}"

declare -A OPTIONS_MAP=(
    [debug]="-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005"
)

if [[ -n "$OPTIONS" && -z "${OPTIONS_MAP[$OPTIONS]+_}" ]]; then
    err "Unknown option: $OPTIONS (allowed: ${!OPTIONS_MAP[*]})"
    exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8080}"
DB_TIMEOUT="${DB_TIMEOUT:-90}"
BACKEND_TIMEOUT="${BACKEND_TIMEOUT:-180}"

PIDS=()

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

command -v docker >/dev/null || { err "docker not found"; exit 1; }
command -v node >/dev/null || { err "node not found"; exit 1; }
command -v npm >/dev/null || { err "npm not found"; exit 1; }
command -v java >/dev/null || { err "java not found"; exit 1; }

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
MAVEN_ARGS=()

if [[ -n "$OPTIONS" ]]; then
    MAVEN_ARGS+=("${OPTIONS_MAP[$OPTIONS]}")
fi

log "Maven arguments: ${MAVEN_ARGS[*]}"
(
    cd "$BACKEND_DIR" &&
    exec setsid ./mvnw spring-boot:run "${MAVEN_ARGS[@]}"
) &
PIDS+=("$!")
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
