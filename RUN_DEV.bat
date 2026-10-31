@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ARGUS — Dev server
cd /d "%~dp0"

set "APP="
if exist "%~dp0frontend\package.json" set "APP=%~dp0frontend"
if not defined APP if exist "%~dp0package.json" set "APP=%~dp0"
if not defined APP (
  echo [ERROR] package.json not found
  pause
  exit /b 1
)

cd /d "%APP%"
where node >nul 2>&1 || (
  echo Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo npm install failed
    pause
    exit /b 1
  )
)

echo.
echo Starting Vite. Open the URL shown as "Local:" in the browser.
echo Press Ctrl+C to stop.
echo.
call npm run dev
if errorlevel 1 pause
