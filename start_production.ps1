# =====================================================================
# Smart Inventory System - Production Launcher (PowerShell Edition)
# Runs natively on Windows using Python 3.12, Node.js, and XAMPP MariaDB
# =====================================================================

$ErrorActionPreference = "Continue"
$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }

Write-Host "=========================================================" -ForegroundColor DarkYellow
Write-Host "   Deploying Smart Inventory System (Windows Production)  " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor DarkYellow
Write-Host ""

# 1. Verify MySQL / MariaDB on port 3306
Write-Host "[1/4] Checking MySQL status on port 3306..." -ForegroundColor Cyan
$portCheck = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if (-not $portCheck) {
    Write-Host "[MySQL] Port 3306 inactive. Attempting to start XAMPP MySQL daemon..." -ForegroundColor Yellow
    $mysqld = "C:\xampp\mysql\bin\mysqld.exe"
    $myini = "C:\xampp\mysql\bin\my.ini"
    if (Test-Path $mysqld) {
        Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$myini --standalone" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "[MySQL] Daemon started." -ForegroundColor Green
    } else {
        Write-Warning "[MySQL] Could not locate mysqld.exe at C:\xampp\mysql\bin\mysqld.exe. Please ensure MySQL is running in XAMPP."
    }
} else {
    Write-Host "[MySQL] Active on port 3306." -ForegroundColor Green
}

# 2. Apply Backend Migrations & WhiteNoise Static Files
Write-Host "`n[2/4] Initializing Django Backend (Migrations & WhiteNoise Static Assets)..." -ForegroundColor Cyan
Set-Location -Path "$RootPath\backend"
python manage.py migrate
python manage.py collectstatic --noinput

# 3. Compile Frontend Production Bundle
Write-Host "`n[3/4] Compiling Vite Frontend Production Bundle..." -ForegroundColor Cyan
Set-Location -Path "$RootPath\frontend"
npm run build

# 4. Launch Production Backend & Frontend Services
Write-Host "`n[4/4] Launching Production Backend & Frontend Services..." -ForegroundColor Cyan
Set-Location -Path $RootPath

# Start Django Backend on port 8000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\backend'; Write-Host 'Starting Smart Inventory Django Backend on port 8000...' -ForegroundColor DarkYellow; python manage.py runserver 127.0.0.1:8000"

# Start Frontend Preview Server on port 5173
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\frontend'; Write-Host 'Starting Smart Inventory Frontend (Production Preview) on port 5173...' -ForegroundColor DarkYellow; npm run preview"

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host " Production Services Deployed Successfully!" -ForegroundColor Green
Write-Host " Web Application:   http://localhost:5173/" -ForegroundColor Yellow
Write-Host " Backend REST API:  http://127.0.0.1:8000/api/" -ForegroundColor Yellow
Write-Host " Admin Dashboard:   http://127.0.0.1:8000/admin/" -ForegroundColor Yellow
Write-Host " Default Superuser: admin / admin123" -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "`nPress any key to exit this launcher window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
