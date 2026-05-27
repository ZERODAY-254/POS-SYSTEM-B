$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting POS backend..." -ForegroundColor Cyan
Write-Host "Building frontend for Django..." -ForegroundColor Cyan
Push-Location $frontend
npm.cmd run build
Pop-Location

Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd '$backend'; & '$root\.venv\Scripts\python.exe' manage.py runserver"
) -WorkingDirectory $backend

Write-Host ""
Write-Host "POS System: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API:        http://127.0.0.1:8000/api/" -ForegroundColor Green
