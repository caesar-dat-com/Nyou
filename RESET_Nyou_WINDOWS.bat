@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [Nyou] Git no esta instalado.
  pause
  exit /b 1
)

echo [Nyou] RESET a origin/main (preserva store.json y assets)...
git fetch origin
if errorlevel 1 (
  echo [Nyou] Error en git fetch.
  pause
  exit /b 1
)

git reset --hard origin/main
if errorlevel 1 (
  echo [Nyou] Error en git reset.
  pause
  exit /b 1
)

REM Limpia archivos no versionados, pero NO borra store ni assets
git clean -fd -e Nyou/patients/store.json -e Nyou/patients/assets
if errorlevel 1 (
  echo [Nyou] Error en git clean.
  pause
  exit /b 1
)

cd /d "%~dp0Nyou"
if exist "package-lock.json" (
  call npm ci
) else (
  call npm install
)

echo [Nyou] Listo. Ejecuta INICIAR_Nyou_WINDOWS.bat
pause
endlocal
