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

cd "$ROOT_DIR"

command -v git >/dev/null 2>&1 || { echo "[Nyou] Git no está instalado."; exit 1; }

# Evita romper si hay rebase/merge a medias
if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" || -f ".git/MERGE_HEAD" ]]; then
  echo "[Nyou] Repo con rebase/merge pendiente."
  echo "[Nyou] Ejecuta: git rebase --abort  ||  git merge --abort"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[Nyou] Hay cambios locales. Haz commit/stash antes de actualizar."
  git status
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

echo "[Nyou] Fetch..."
git fetch origin

echo "[Nyou] Pull (ff-only) en ${CURRENT_BRANCH}..."
if ! git pull --ff-only origin "$CURRENT_BRANCH"; then
  echo "[Nyou] No se pudo actualizar con ff-only."
  echo "[Nyou] Si el remoto fue reescrito o hay divergencia, ejecuta: ./RESET_Nyou_LINUX.sh"
  exit 1
fi

echo "[Nyou] Dependencias..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[Nyou] OK. Arranca con: ./INICIAR_Nyou_LINUX.sh"
