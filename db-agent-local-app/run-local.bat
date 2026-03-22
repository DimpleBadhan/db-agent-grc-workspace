@echo off
setlocal
cd /d "%~dp0"
echo Starting DB agent local app at http://localhost:8090
start "" http://localhost:8090
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8090
