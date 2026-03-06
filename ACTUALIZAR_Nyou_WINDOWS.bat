@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "APP_DIR=%~dp0Nyou"
if not exist "%APP_DIR%\package.json" set "APP_DIR=%~dp0nyou"
if not exist "%APP_DIR%\package.json" (
  echo [Nyou] Error: no se encontro la carpeta de la app ^(Nyou\ o nyou\^).
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo [Nyou] Git no esta instalado.
  pause
  exit /b 1
)

if exist ".git\rebase-merge" (
  echo [Nyou] Repo con rebase pendiente.
  echo [Nyou] Ejecuta: git rebase --abort
  pause
  exit /b 1
)
if exist ".git\rebase-apply" (
  echo [Nyou] Repo con rebase pendiente.
  echo [Nyou] Ejecuta: git rebase --abort
  pause
  exit /b 1
)
if exist ".git\MERGE_HEAD" (
  echo [Nyou] Repo con merge pendiente.
  echo [Nyou] Ejecuta: git merge --abort
  pause
  exit /b 1
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
  echo [Nyou] Solo !LOCK_REL! cambio localmente. Restaurando lock para permitir update...
  git checkout -- "!LOCK_REL!"
)

set "DIRTY="
for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY (
  echo [Nyou] Hay cambios locales. Haz commit/stash antes de actualizar.
  git status
  pause
  exit /b 1
)

for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"

echo [Nyou] Fetch...
git fetch origin
if errorlevel 1 (
  echo [Nyou] Error en git fetch.
  pause
  exit /b 1
)

echo [Nyou] Pull (ff-only) en !CURRENT_BRANCH!...
git pull --ff-only origin !CURRENT_BRANCH!
if errorlevel 1 (
  echo [Nyou] No se pudo actualizar con ff-only.
  echo [Nyou] Si el remoto fue reescrito, ejecuta RESET_Nyou_WINDOWS.bat
  pause
  exit /b 1
)

echo [Nyou] Dependencias (npm ci/install)...
cd /d "%APP_DIR%"
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
