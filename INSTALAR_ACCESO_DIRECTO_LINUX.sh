#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHER="$ROOT_DIR/INICIAR_Nyou_LINUX.sh"
ICON="$ROOT_DIR/Nyou.png"
DESKTOP_NAME="Nyou.desktop"
DESKTOP_FILE="$HOME/.local/share/applications/$DESKTOP_NAME"
DESKTOP_FILE_ON_DESKTOP="$HOME/Desktop/$DESKTOP_NAME"

mkdir -p "$HOME/.local/share/applications"
mkdir -p "$HOME/Desktop"

cat > "$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=Nyou
Comment=Iniciar Nyou Web App
TryExec=/usr/bin/env
Exec=/usr/bin/env bash -lc '"$LAUNCHER"'
Icon=$ICON
Terminal=false
Categories=Office;MedicalSoftware;
StartupNotify=true
Path=$ROOT_DIR
DESKTOP

cp "$DESKTOP_FILE" "$DESKTOP_FILE_ON_DESKTOP"
chmod +x "$DESKTOP_FILE" "$DESKTOP_FILE_ON_DESKTOP" "$LAUNCHER"

if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_FILE" metadata::trusted true >/dev/null 2>&1 || true
  gio set "$DESKTOP_FILE_ON_DESKTOP" metadata::trusted true >/dev/null 2>&1 || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
fi

echo "[Nyou] Acceso directo instalado:"
echo " - $DESKTOP_FILE"
echo " - $DESKTOP_FILE_ON_DESKTOP"
