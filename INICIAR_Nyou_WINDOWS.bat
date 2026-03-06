@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "APP_DIR=%ROOT_DIR%Nyou"
if not exist "%APP_DIR%\package.json" set "APP_DIR=%ROOT_DIR%nyou"
if not exist "%APP_DIR%\package.json" (
  echo [Nyou] Error: no se encontro la carpeta de la app ^(Nyou\ o nyou\^).
  pause
  exit /b 1
)
set "PORT=1420"
set "HOST=127.0.0.1"
if /i "%Nyou_LAN%"=="1" set "HOST=0.0.0.0"
set "URL=http://localhost:%PORT%"

cd /d "%ROOT_DIR%"

REM =========================================================
REM AUTO-UPDATE (ACTIVADO POR DEFECTO)
REM Para desactivarlo: set Nyou_AUTO_UPDATE=0
REM =========================================================
set "DO_UPDATE=1"
if /i "%Nyou_AUTO_UPDATE%"=="0" set "DO_UPDATE=0"

if "%DO_UPDATE%"=="1" (
  where git >nul 2>&1
  if !errorlevel!==0 (
    if exist ".git\rebase-merge" (
      echo [Nyou] Repo con rebase pendiente. Se omite auto-update.
      goto :after_update
    )
    if exist ".git\rebase-apply" (
      echo [Nyou] Repo con rebase pendiente. Se omite auto-update.
      goto :after_update
    )
    if exist ".git\MERGE_HEAD" (
      echo [Nyou] Repo con merge pendiente. Se omite auto-update.
      goto :after_update
    )

    set "LOCK_REL="
    for %%I in ("%APP_DIR%") do set "APP_NAME=%%~nxI"
    set "LOCK_REL=!APP_NAME!\package-lock.json"

    set "TRACKED_CHANGES="
    set "HAS_LOCK="
    set "HAS_NON_LOCK="
    for /f "delims=" %%S in ('git status --porcelain --untracked-files=no') do (
      set "TRACKED_CHANGES=1"
      set "LINE=%%S"
      set "FILE=!LINE:~3!"
      if /i not "!FILE!"=="!LOCK_REL!" set "HAS_NON_LOCK=1"
      if /i "!FILE!"=="!LOCK_REL!" set "HAS_LOCK=1"
    )

    if defined TRACKED_CHANGES if defined HAS_LOCK if not defined HAS_NON_LOCK (
      echo [Nyou] Solo !LOCK_REL! cambio localmente. Restaurando lock para permitir auto-update...
      git checkout -- "!LOCK_REL!"
      set "TRACKED_CHANGES="
      set "HAS_LOCK="
    )

    set "DIRTY="
    for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
    if defined DIRTY (
      echo [Nyou] Repo tiene cambios locales. Se omite auto-update.
    ) else (
      for /f "delims=" %%H in ('git rev-parse HEAD 2^>nul') do set "PRE_HEAD=%%H"
      for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%B"
      if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"
      echo [Nyou] Auto-update: git pull --ff-only origin !CURRENT_BRANCH!
      git pull --ff-only origin !CURRENT_BRANCH!
      if errorlevel 1 (
        echo [Nyou] Aviso: no se pudo actualizar. Continuo con version local.
      ) else (
        for /f "delims=" %%H in ('git rev-parse HEAD 2^>nul') do set "POST_HEAD=%%H"
        if defined PRE_HEAD if defined POST_HEAD if /i not "!PRE_HEAD!"=="!POST_HEAD!" (
          echo [Nyou] Se detectaron actualizaciones. Reiniciando launcher...
          start "" "%~f0"
          exit /b 0
        )
      )
    )
  )
)

:after_update
cd /d "%APP_DIR%"

echo [Nyou] Verificando dependencias...
if not exist "node_modules\vite\bin\vite.js" (
  echo [Nyou] Instalando dependencias...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo [Nyou] Error instalando dependencias. Verifica Node.js.
    pause
    exit /b 1
  )
) else (
  echo [Nyou] Dependencias OK.
)

echo [Nyou] Iniciando servidor en %HOST%:%PORT%...
start "" "%URL%"
call npm run dev -- --host %HOST% --port %PORT% --strictPort

endlocal
