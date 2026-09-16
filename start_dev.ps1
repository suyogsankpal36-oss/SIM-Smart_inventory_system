# Smart Inventory System - PowerShell Dev Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   Starting Smart Inventory System (Fullstack Dev)" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host "Admin:    http://127.0.0.1:8000/admin/ (admin / admin123)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173/" -ForegroundColor Green
Write-Host ""

# Check MySQL
$mysqlRunning = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if (-not $mysqlRunning) {
    Write-Host "[MySQL] Starting XAMPP MySQL..." -ForegroundColor Yellow
    if (Test-Path "C:\xampp\mysql\bin\mysqld.exe") {
        Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini","--standalone" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
}

# Start backend and frontend in separate windows
Start-Process cmd.exe -ArgumentList "/c","run_backend.bat" -WorkingDirectory $ScriptDir
Start-Process cmd.exe -ArgumentList "/c","run_frontend.bat" -WorkingDirectory $ScriptDir

Write-Host "Services launched in separate windows." -ForegroundColor Green
