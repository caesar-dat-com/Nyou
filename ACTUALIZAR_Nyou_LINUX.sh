#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/naju"

cd "$ROOT_DIR"

command -v git >/dev/null 2>&1 || { echo "[NAJU] Git no está instalado."; exit 1; }

# Evita romper si hay rebase/merge a medias
if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" || -f ".git/MERGE_HEAD" ]]; then
  echo "[NAJU] Repo con rebase/merge pendiente."
  echo "[NAJU] Ejecuta: git rebase --abort  ||  git merge --abort"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[NAJU] Hay cambios locales. Haz commit/stash antes de actualizar."
  git status
  exit 1
fi

echo "[NAJU] Fetch..."
git fetch origin

echo "[NAJU] Pull (ff-only)..."
if ! git pull --ff-only; then
  echo "[NAJU] No se pudo actualizar con ff-only."
  echo "[NAJU] Si el remoto fue reescrito o hay divergencia, ejecuta: ./RESET_NAJU_LINUX.sh"
  exit 1
fi

echo "[NAJU] Dependencias..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[NAJU] OK. Arranca con: ./INICIAR_NAJU_LINUX.sh"
