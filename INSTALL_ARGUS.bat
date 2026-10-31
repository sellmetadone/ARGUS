@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ARGUS — Install dependencies
color 0B

cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] Cannot cd to "%~dp0"
  pause
  exit /b 1
)

set "APP="
if exist "%~dp0frontend\package.json" set "APP=%~dp0frontend"
if not defined APP if exist "%~dp0package.json" if exist "%~dp0argus-cli.mjs" set "APP=%~dp0"

if not defined APP (
  echo [ERROR] frontend\package.json not found next to this installer.
  pause
  exit /b 1
)

cd /d "%APP%"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Install Node.js LTS from https://nodejs.org/
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found.
  pause
  exit /b 1
)

echo.
echo  Installing ARGUS dependencies in:
echo  %CD%
echo.
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo.
  echo [ERROR] Installation FAILED. See messages above.
  pause
  exit /b 1
)

echo.
echo  [OK] Dependencies installed successfully.
echo  Run START_ARGUS.bat to launch the application.
echo.
pause
exit /b 0
