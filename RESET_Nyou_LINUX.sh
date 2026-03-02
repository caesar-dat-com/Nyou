#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/Nyou"

cd "$ROOT_DIR"

command -v git >/dev/null 2>&1 || { echo "[Nyou] Git no está instalado."; exit 1; }

echo "[Nyou] Fetch..."
git fetch origin

# Aborta rebase/merge si existen
if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" ]]; then git rebase --abort || true; fi
if [[ -f ".git/MERGE_HEAD" ]]; then git merge --abort || true; fi

echo "[Nyou] Reset HARD a origin/main (preserva store.json y assets si existen)..."
git reset --hard origin/main

# Limpia sin borrar datos locales
git clean -fd -e Nyou/patients/store.json -e Nyou/patients/assets

echo "[Nyou] Dependencias..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[Nyou] OK. Arranca con: ./INICIAR_Nyou_LINUX.sh"
