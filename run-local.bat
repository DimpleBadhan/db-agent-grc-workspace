@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server at http://localhost:8080
  py -m http.server 8080
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server at http://localhost:8080
  python -m http.server 8080
  exit /b %errorlevel%
)

echo Python was not found. Install Python or open index.html directly in a browser.
exit /b 1
