@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [Nyou] Git no esta instalado.
  pause
  exit /b 1
)

set "DIRTY="
for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY (
  echo [Nyou] Hay cambios locales. Haz commit/stash antes de actualizar.
  git status
  pause
  exit /b 1
)

echo [Nyou] Fetch...
git fetch origin
if errorlevel 1 (
  echo [Nyou] Error en git fetch.
  pause
  exit /b 1
)

echo [Nyou] Pull (ff-only)...
git pull --ff-only
if errorlevel 1 (
  echo [Nyou] No se pudo actualizar con ff-only.
  echo [Nyou] Si el remoto fue reescrito, ejecuta RESET_Nyou_WINDOWS.bat
  pause
  exit /b 1
)

echo [Nyou] Dependencias (npm ci/install)...
cd /d "%~dp0nyou"
if exist "package-lock.json" (
  call npm ci
) else (
  call npm install
)

if errorlevel 1 (
  echo [Nyou] Error instalando dependencias.
  pause
  exit /b 1
)

echo [Nyou] OK. Ejecuta INICIAR_Nyou_WINDOWS.bat
pause
endlocal
