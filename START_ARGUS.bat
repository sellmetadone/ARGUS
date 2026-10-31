@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title ARGUS — Cyber Investigation Graph
color 0B

cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] Cannot change directory to "%~dp0"
  pause
  exit /b 1
)

set "ROOT=%CD%"
set "APP="

if exist "%ROOT%\frontend\package.json" (
  set "APP=%ROOT%\frontend"
) else if exist "%ROOT%\package.json" if exist "%ROOT%\argus-cli.mjs" (
  set "APP=%ROOT%"
)

if not defined APP (
  echo.
  echo [ERROR] package.json not found.
  echo Expected:  %ROOT%\frontend\package.json
  echo.
  echo Make sure you extracted the full ARGUS archive and run this file
  echo from the project root ^(folder that contains frontend\^).
  echo.
  pause
  exit /b 1
)

cd /d "%APP%"
if errorlevel 1 (
  echo [ERROR] Cannot enter "%APP%"
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   ARGUS  —  sellmetadone
echo   Telegram: @sofia_white_death
echo   Channel:  t.me/argus_platform
echo  ========================================
echo.
echo  App directory: %CD%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not on PATH.
  echo Download LTS from https://nodejs.org/
  echo.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODEVER=%%v"
echo  Node: %NODEVER%

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Reinstall Node.js with npm included.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] package.json missing in %CD%
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo.
  echo  Installing dependencies ^(first run^)...
  echo.
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. Check the log above.
    pause
    exit /b 1
  )
  echo.
  echo  Dependencies installed.
  echo.
)

echo.
echo  Menu:
echo    1  Web UI ^(Vite dev server^)
echo    2  CLI console search
echo    3  Both ^(web in new window + CLI^)
echo    0  Exit
echo.
set /p "CHOICE=  Select [1/2/3/0]: "

if "%CHOICE%"=="0" goto :eof
if "%CHOICE%"=="2" goto :cli
if "%CHOICE%"=="3" goto :both
goto :web

:web
echo.
echo  Starting Vite...
echo  When ready, open the URL printed below ^(usually http://127.0.0.1:3030^).
echo  If the port is busy, Vite will pick the next free port — read the line "Local:".
echo.
call npm run dev
if errorlevel 1 (
  echo.
  echo [ERROR] Dev server exited with an error.
  pause
)
goto :eof

:cli
echo.
call npm run cli
pause
goto :eof

:both
echo.
echo  Opening Web UI in a new window...
start "ARGUS Web" cmd /k "cd /d "%APP%" && npm run dev"
timeout /t 3 /nobreak >nul
call npm run cli
pause
goto :eof
