#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/Nyou"

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

echo "[Nyou] Fetch..."
git fetch origin

echo "[Nyou] Pull (ff-only)..."
if ! git pull --ff-only; then
  echo "[Nyou] No se pudo actualizar con ff-only."
  echo "[Nyou] Si el remoto fue reescrito o hay divergencia, ejecuta: ./RESET_Nyou_LINUX.sh"
  exit 1
fi

echo "[Nyou] Dependencias..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[Nyou] OK. Arranca con: ./INICIAR_Nyou_LINUX.sh"
