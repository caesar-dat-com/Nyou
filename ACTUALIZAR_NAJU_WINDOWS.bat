@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [NAJU] Git no esta instalado.
  pause
  exit /b 1
)

set "DIRTY="
for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY (
  echo [NAJU] Hay cambios locales. Haz commit/stash antes de actualizar.
  git status
  pause
  exit /b 1
)

echo [NAJU] Fetch...
git fetch origin
if errorlevel 1 (
  echo [NAJU] Error en git fetch.
  pause
  exit /b 1
)

echo [NAJU] Pull (ff-only)...
git pull --ff-only
if errorlevel 1 (
  echo [NAJU] No se pudo actualizar con ff-only.
  echo [NAJU] Si el remoto fue reescrito, ejecuta RESET_NAJU_WINDOWS.bat
  pause
  exit /b 1
)

echo [NAJU] Dependencias (npm ci/install)...
cd /d "%~dp0naju"
if exist "package-lock.json" (
  call npm ci
) else (
  call npm install
)

if errorlevel 1 (
  echo [NAJU] Error instalando dependencias.
  pause
  exit /b 1
)

echo [NAJU] OK. Ejecuta INICIAR_NAJU_WINDOWS.bat
pause
endlocal
