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


auto_restore_lock_if_only_change() {
  local rel_lock
  rel_lock="${APP_DIR#$ROOT_DIR/}/package-lock.json"

  [[ -f "$APP_DIR/package-lock.json" ]] || return 0
  git ls-files --error-unmatch "$rel_lock" >/dev/null 2>&1 || return 0

  local tracked_changes
  tracked_changes="$(git status --porcelain --untracked-files=no)"
  [[ -n "$tracked_changes" ]] || return 0

  local has_lock_change
  has_lock_change="$(printf '%s\n' "$tracked_changes" | awk -v lock="$rel_lock" 'substr($0, 4) == lock {print "1"; exit}')"
  [[ -n "$has_lock_change" ]] || return 0

  local non_lock_changes
  non_lock_changes="$(printf '%s\n' "$tracked_changes" | awk -v lock="$rel_lock" 'substr($0, 4) != lock {print}')"
  if [[ -z "$non_lock_changes" ]]; then
    echo "[Nyou] Solo package-lock.json cambió localmente. Restaurando lock para permitir update..."
    git checkout -- "$rel_lock"
  fi
}

command -v git >/dev/null 2>&1 || { echo "[Nyou] Git no está instalado."; exit 1; }

# Evita romper si hay rebase/merge a medias
if [[ -d ".git/rebase-merge" || -d ".git/rebase-apply" || -f ".git/MERGE_HEAD" ]]; then
  echo "[Nyou] Repo con rebase/merge pendiente."
  echo "[Nyou] Ejecuta: git rebase --abort  ||  git merge --abort"
  exit 1
fi

auto_restore_lock_if_only_change

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
