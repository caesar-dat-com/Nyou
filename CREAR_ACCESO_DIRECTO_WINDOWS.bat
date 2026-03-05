@echo off
setlocal EnableExtensions

REM Crea un acceso directo (Nyou.lnk) en el Escritorio del usuario (y copia local).

set "ROOT=%~dp0"
set "TARGET=%ROOT%INICIAR_Nyou_WINDOWS.bat"
set "ICON=%ROOT%Nyou.ico"
set "SHORTCUT_LOCAL=%ROOT%Nyou.lnk"
set "SHORTCUT_DESKTOP=%USERPROFILE%\Desktop\Nyou.lnk"

if not exist "%TARGET%" (
  echo [Nyou] Error: no se encontro %TARGET%
  pause
  exit /b 1
)

where powershell >nul 2>&1
if errorlevel 1 (
  echo [Nyou] Error: PowerShell no esta disponible para crear el acceso directo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell;" ^
  "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT_DESKTOP%');" ^
  "$Shortcut.TargetPath = '%TARGET%';" ^
  "$Shortcut.WorkingDirectory = '%ROOT%';" ^
  "$Shortcut.IconLocation = '%ICON%,0';" ^
  "$Shortcut.Save();"

if exist "%SHORTCUT_DESKTOP%" (
  copy /Y "%SHORTCUT_DESKTOP%" "%SHORTCUT_LOCAL%" >nul 2>&1
  echo [Nyou] Acceso directo creado: %SHORTCUT_DESKTOP%
  echo [Nyou] Copia local: %SHORTCUT_LOCAL%
  echo [Nyou] Ahora puedes abrir Nyou desde el Escritorio.
) else (
  echo [Nyou] No se pudo crear el acceso directo.
)

pause
endlocal
