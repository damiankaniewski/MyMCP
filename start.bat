@echo off
setlocal EnableExtensions EnableDelayedExpansion
title MyMCP
cd /d "%~dp0"

REM A bare carriage return, used to redraw the progress line in place.
for /f %%A in ('copy /Z "%~dpnx0" nul') do set "CR=%%A"

echo ============================================
echo                  MyMCP
echo ============================================
echo.

REM ---- [0%%] Node.js -----------------------------------------------------
echo [  0%%] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js was not found.
    echo Install it from https://nodejs.org  then run this file again.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODEVER=%%v"
echo        OK - Node.js !NODEVER!

REM ---- [20%%] backend dependencies --------------------------------------
echo [ 20%%] Backend dependencies...
if not exist "backend\node_modules" (
    echo        installing - this can take a minute, please wait...
    call npm --prefix backend install
    if errorlevel 1 goto installerror
    echo        OK - installed
) else (
    echo        OK - already present
)

REM ---- [45%%] web app dependencies --------------------------------------
echo [ 45%%] Web app dependencies...
if not exist "frontend\node_modules" (
    echo        installing - this can take a minute, please wait...
    call npm --prefix frontend install
    if errorlevel 1 goto installerror
    echo        OK - installed
) else (
    echo        OK - already present
)

REM ---- [60%%] launch servers --------------------------------------------
echo [ 60%%] Starting backend and web app...
start "MyMCP - backend" /min /D "%~dp0backend" cmd /k npm run dev
start "MyMCP - web app" /min /D "%~dp0frontend" cmd /k npm run dev
echo        OK - launched in two background windows

REM ---- [60-100%%] wait until both actually respond ----------------------
echo.
set /a tries=0
set "MAXTRIES=45"
:waitloop
set /a tries+=1
set "BACK=0"
set "FRONT=0"
curl -s -o nul http://localhost:3001/api/health >nul 2>nul && set "BACK=1"
curl -s -o nul http://localhost:5173 >nul 2>nul && set "FRONT=1"

if "!BACK!!FRONT!"=="11" goto ready

set /a pct=60 + tries*40/MAXTRIES
if !pct! gtr 99 set "pct=99"
if "!BACK!"=="1" (set "BSYM=ready") else (set "BSYM=...  ")
if "!FRONT!"=="1" (set "FSYM=ready") else (set "FSYM=...  ")
<nul set /p "=  [ !pct!%%] backend: !BSYM!   web app: !FSYM!         !CR!"

if !tries! geq !MAXTRIES! goto timeout
ping -n 2 127.0.0.1 >nul
goto waitloop

:ready
<nul set /p "=  [100%%] backend: ready   web app: ready                 "
echo.
echo.
echo Opening http://localhost:5173 in your browser...
start "" "http://localhost:5173"
echo.
echo MyMCP is running in the two background windows.
echo Close those windows when you want to stop it.
echo This launcher will now close.
ping -n 4 127.0.0.1 >nul
exit /b 0

:timeout
echo.
echo.
echo [WARN] The app is taking longer than expected to start.
echo        Opening the browser anyway - it should appear shortly.
start "" "http://localhost:5173"
ping -n 4 127.0.0.1 >nul
exit /b 0

:installerror
echo.
echo [ERROR] Installing dependencies failed. Check your internet connection
echo and that Node.js is installed correctly, then try again.
echo.
pause
exit /b 1
