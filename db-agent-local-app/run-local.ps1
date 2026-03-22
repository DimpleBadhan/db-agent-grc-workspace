Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Starting DB agent local app at http://localhost:8090"
Start-Process "http://localhost:8090"
& "$PSScriptRoot\server.ps1" -Port 8090
