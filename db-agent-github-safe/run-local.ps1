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

Write-Host "Python was not found. Opening index.html directly in your browser."
Start-Process "$projectRoot\index.html"
