#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/naju"
PORT="${NAJU_PORT:-1420}"
URL="http://127.0.0.1:${PORT}"
LOG_FILE="$APP_DIR/.naju-dev.log"

cd "$ROOT_DIR"

if command -v git >/dev/null 2>&1; then
  echo "[NAJU] Buscando actualizaciones (git pull --rebase)..."
  git pull --rebase --autostash || echo "[NAJU] Aviso: no se pudo hacer git pull. Continúo con la versión local."
fi

cd "$APP_DIR"

echo "[NAJU] Verificando dependencias..."
npm install

OPEN_BROWSER=1

while true; do
  echo "[NAJU] Iniciando servidor en 0.0.0.0:${PORT}..."
  npm run dev -- --host 0.0.0.0 --port "$PORT" > "$LOG_FILE" 2>&1 &
  DEV_PID=$!

  for _ in $(seq 1 50); do
    if curl -fsS "$URL" >/dev/null 2>&1; then
      break
    fi
    sleep 0.3
  done

  if [ "$OPEN_BROWSER" -eq 1 ]; then
    echo "[NAJU] Abriendo $URL"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
    elif command -v gio >/dev/null 2>&1; then
      gio open "$URL" >/dev/null 2>&1 || true
    fi
    OPEN_BROWSER=0
  fi

  wait "$DEV_PID" || true
  echo "[NAJU] Servidor detenido. Reiniciando en 2 segundos..."
  sleep 2

done
