@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ARGUS
color 0D
cd /d "%~dp0"

set "APP="
if exist "%~dp0frontend\package.json" set "APP=%~dp0frontend"
if exist "%~dp0package.json" if exist "%~dp0argus-cli.mjs" set "APP=%~dp0"
if not defined APP (
  echo frontend not found
  pause
  exit /b 1
)
cd /d "%APP%"

where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js from https://nodejs.org/
  start https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo npm install...
  call npm install --no-fund --no-audit
)

call npm run argus
pause
endlocal
