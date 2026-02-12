#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/naju"
PORT="${NAJU_PORT:-1420}"
URL="http://127.0.0.1:${PORT}"

cd "$APP_DIR"

if [ ! -d node_modules ]; then
  echo "[NAJU] Instalando dependencias..."
  npm install
fi

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "[NAJU] Ya existe un proceso escuchando en $URL"
else
  echo "[NAJU] Iniciando servidor..."
  nohup npm run dev -- --host 0.0.0.0 --port "$PORT" > "$APP_DIR/.naju-dev.log" 2>&1 &
fi

for _ in $(seq 1 25); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.4
done

echo "[NAJU] Abriendo $URL"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 &
elif command -v gio >/dev/null 2>&1; then
  gio open "$URL" >/dev/null 2>&1 &
fi

echo "[NAJU] Listo. Logs: $APP_DIR/.naju-dev.log"
