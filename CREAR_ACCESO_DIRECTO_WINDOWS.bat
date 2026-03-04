@echo off
setlocal

REM Crea un acceso directo (Nyou.lnk) en esta misma carpeta con icono.

set "ROOT=%~dp0"
set "TARGET=%ROOT%INICIAR_Nyou_WINDOWS.bat"
set "ICON=%ROOT%Nyou.ico"
set "SHORTCUT=%ROOT%Nyou.lnk"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell;" ^
  "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT%');" ^
  "$Shortcut.TargetPath = '%TARGET%';" ^
  "$Shortcut.WorkingDirectory = '%ROOT%';" ^
  "$Shortcut.IconLocation = '%ICON%,0';" ^
  "$Shortcut.Save();"

if exist "%SHORTCUT%" (
  echo [Nyou] Acceso directo creado: %SHORTCUT%
  echo [Nyou] Ahora solo dale doble click a Nyou.lnk
) else (
  echo [Nyou] No se pudo crear el acceso directo.
)

pause
endlocal
