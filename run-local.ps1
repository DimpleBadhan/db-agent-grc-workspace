$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (Get-Command py -ErrorAction SilentlyContinue) {
  Write-Host "Starting local server at http://localhost:8080"
  py -m http.server 8080
  exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  Write-Host "Starting local server at http://localhost:8080"
  python -m http.server 8080
  exit $LASTEXITCODE
}

Write-Error "Python was not found. Install Python or open index.html directly in a browser."
