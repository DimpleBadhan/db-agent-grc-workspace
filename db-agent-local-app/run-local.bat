@echo off
setlocal
cd /d "%~dp0"
echo Starting DB Agent local app at http://localhost:8090
start "" http://localhost:8090
node "%~dp0server.js"
