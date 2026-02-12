@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "APP_DIR=%ROOT_DIR%naju"
set "PORT=1420"
set "URL=http://localhost:%PORT%"

cd /d "%ROOT_DIR%"

where git >nul 2>&1
if %errorlevel%==0 (
  echo [NAJU] Buscando actualizaciones (git pull --rebase)...
  git pull --rebase --autostash
  if errorlevel 1 echo [NAJU] Aviso: no se pudo hacer git pull. Continuo con version local.
)

cd /d "%APP_DIR%"

echo [NAJU] Verificando / instalando dependencias...
call npm install
if errorlevel 1 (
  echo [NAJU] Error instalando dependencias. Verifica Node.js.
  pause
  exit /b 1
)

set "OPEN_BROWSER=1"

:run_loop
echo [NAJU] Iniciando servidor en 0.0.0.0:%PORT%...
if "%OPEN_BROWSER%"=="1" (
  start "" "%URL%"
  set "OPEN_BROWSER=0"
)

call npm run dev -- --host 0.0.0.0 --port %PORT%

echo [NAJU] Servidor detenido. Reiniciando en 2 segundos...
timeout /t 2 >nul
goto run_loop
