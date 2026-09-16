@echo off
title Smart Inventory System - Dev Launcher
cd /D "%~dp0"

echo =========================================================
echo    Starting Smart Inventory System (Fullstack Dev)
echo =========================================================
echo Backend:  http://127.0.0.1:8000/
echo Admin:    http://127.0.0.1:8000/admin/ (admin / admin123)
echo Frontend: http://localhost:5173/
echo.

netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [MySQL] Service not detected on port 3306. Starting XAMPP MySQL...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping -n 3 127.0.0.1 >nul
    )
)

start "Smart Inventory - Backend" run_backend.bat
start "Smart Inventory - Frontend" run_frontend.bat

echo Services launched in separate windows.
ping -n 3 127.0.0.1 >nul
