@echo off
title Smart Inventory System - Backend (Django)
cd /D "%~dp0backend"

echo ===================================================
echo Starting Smart Inventory System - Django Backend
echo ===================================================

netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [MySQL] Service not detected on port 3306. Starting XAMPP MySQL...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping -n 3 127.0.0.1 >nul
    )
)

python manage.py runserver 127.0.0.1:8000
pause
