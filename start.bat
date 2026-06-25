@echo off
setlocal EnableExtensions
title MyMCP
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js was not found.
    echo Install it from https://nodejs.org  then run this file again.
    echo.
    pause
    exit /b 1
)

REM Everything (backend + web app) runs inside THIS one window.
node scripts\start.mjs

echo.
echo MyMCP has stopped.
pause
