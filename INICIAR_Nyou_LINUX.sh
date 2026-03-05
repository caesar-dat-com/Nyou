#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "$ROOT_DIR/Nyou" ]]; then
  APP_DIR="$ROOT_DIR/Nyou"
elif [[ -d "$ROOT_DIR/nyou" ]]; then
  APP_DIR="$ROOT_DIR/nyou"
else
  echo "[Nyou] Error: no se encontro la carpeta de la app (Nyou/ o nyou/)."
  exit 1
fi
PORT="${Nyou_PORT:-1420}"

HOST="127.0.0.1"
if [[ "${Nyou_LAN:-0}" == "1" ]]; then
  HOST="0.0.0.0"
fi

URL="http://127.0.0.1:${PORT}"
LOG_FILE="$APP_DIR/.nyou-dev.log"
LOCK_HASH_FILE="$APP_DIR/.nyou-lock.sha"

cd "$ROOT_DIR"

# =========================================================
# AUTO-UPDATE (DESACTIVADO POR DEFECTO)
# Para activarlo (bajo tu riesgo): Nyou_AUTO_UPDATE=1
# Recomendado: hacer "git pull" manual y luego ejecutar este script.
# =========================================================
if [[ "${Nyou_AUTO_UPDATE:-0}" == "1" ]] && command -v git >/dev/null 2>&1; then
  if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" || -f ".git/MERGE_HEAD" ]]; then
    echo "[Nyou] Repo con rebase/merge pendiente. Se omite auto-update."
  elif [[ -n "$(git status --porcelain)" ]]; then
    echo "[Nyou] Cambios locales detectados. Se omite auto-update."
  else
    echo "[Nyou] Auto-update: git pull --ff-only"
    git pull --ff-only || echo "[Nyou] Aviso: no se pudo actualizar. Continúo con versión local."
  fi
fi

cd "$APP_DIR"

echo "[Nyou] Verificando dependencias..."

if [[ -f "package-lock.json" ]]; then
  CUR_SHA="$(sha256sum package-lock.json | awk '{print $1}')"
  OLD_SHA=""
  [[ -f "$LOCK_HASH_FILE" ]] && OLD_SHA="$(cat "$LOCK_HASH_FILE" || true)"

  if [[ ! -d "node_modules" || "$CUR_SHA" != "$OLD_SHA" ]]; then
    echo "[Nyou] Instalando dependencias (npm ci)..."
    npm ci
    echo "$CUR_SHA" > "$LOCK_HASH_FILE"
  else
    echo "[Nyou] Dependencias OK (lock sin cambios)."
  fi
else
  if [[ ! -d "node_modules" ]]; then
    echo "[Nyou] Instalando dependencias (npm install)..."
    npm install
  else
    echo "[Nyou] Dependencias OK."
  fi
fi

OPEN_BROWSER=1

while true; do
  echo "[Nyou] Iniciando servidor en ${HOST}:${PORT}..."
  npm run dev -- --host "$HOST" --port "$PORT" --strictPort > "$LOG_FILE" 2>&1 &
  DEV_PID=$!

  # espera readiness en localhost (aunque corra en 0.0.0.0)
  for _ in $(seq 1 60); do
    if command -v curl >/dev/null 2>&1; then
      curl -fsS "$URL" >/dev/null 2>&1 && break
    else
      # si no hay curl, solo espera un poco
      sleep 0.3
    fi
    sleep 0.3
  done

  if [[ "$OPEN_BROWSER" -eq 1 ]]; then
    echo "[Nyou] Abriendo $URL"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
    elif command -v gio >/dev/null 2>&1; then
      gio open "$URL" >/dev/null 2>&1 || true
    fi
    OPEN_BROWSER=0
  fi

  wait "$DEV_PID" || true
  echo "[Nyou] Servidor detenido. Reiniciando en 2 segundos..."
  sleep 2
done
