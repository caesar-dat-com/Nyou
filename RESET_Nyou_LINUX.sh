#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/naju"

cd "$ROOT_DIR"

command -v git >/dev/null 2>&1 || { echo "[NAJU] Git no está instalado."; exit 1; }

echo "[NAJU] Fetch..."
git fetch origin

# Aborta rebase/merge si existen
if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" ]]; then git rebase --abort || true; fi
if [[ -f ".git/MERGE_HEAD" ]]; then git merge --abort || true; fi

echo "[NAJU] Reset HARD a origin/main (preserva store.json y assets si existen)..."
git reset --hard origin/main

# Limpia sin borrar datos locales
git clean -fd -e naju/patients/store.json -e naju/patients/assets

echo "[NAJU] Dependencias..."
cd "$APP_DIR"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[NAJU] OK. Arranca con: ./INICIAR_NAJU_LINUX.sh"
