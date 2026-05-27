$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting POS backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd '$backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"
) -WorkingDirectory $backend

Write-Host "Starting POS frontend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd '$frontend'; npm run dev"
) -WorkingDirectory $frontend

Write-Host ""
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Green
