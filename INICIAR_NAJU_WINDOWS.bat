@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "APP_DIR=%ROOT_DIR%naju"
set "PORT=1420"
set "HOST=127.0.0.1"
if /i "%NAJU_LAN%"=="1" set "HOST=0.0.0.0"
set "URL=http://localhost:%PORT%"

cd /d "%ROOT_DIR%"

REM =========================================================
REM AUTO-UPDATE (DESACTIVADO POR DEFECTO)
REM Para activarlo: set NAJU_AUTO_UPDATE=1
REM Recomendado: usar ACTUALIZAR_NAJU_WINDOWS.bat manualmente
REM =========================================================
if /i "%NAJU_AUTO_UPDATE%"=="1" (
  where git >nul 2>&1
  if !errorlevel!==0 (
    set "DIRTY="
    for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
    if defined DIRTY (
      echo [NAJU] Repo tiene cambios locales. Se omite auto-update.
    ) else (
      echo [NAJU] Actualizando (git pull --ff-only)...
      git pull --ff-only
      if errorlevel 1 echo [NAJU] Aviso: no se pudo actualizar. Continuo con version local.
    )
  )
)

cd /d "%APP_DIR%"

echo [NAJU] Verificando dependencias...
if not exist "node_modules\vite\package.json" (
  echo [NAJU] Instalando dependencias...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo [NAJU] Error instalando dependencias. Verifica Node.js.
    pause
    exit /b 1
  )
) else (
  echo [NAJU] Dependencias OK.
)

echo [NAJU] Iniciando servidor en %HOST%:%PORT%...
start "" "%URL%"
call npm run dev -- --host %HOST% --port %PORT% --strictPort

endlocal
