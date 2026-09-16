@echo off
title Smart Inventory System - Production Launcher
cd /D "%~dp0"

echo =========================================================
echo    Deploying Smart Inventory System (Local Production)
echo =========================================================
echo.

:: 1. Ensure MySQL is running
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [MySQL] Service not detected on port 3306. Starting XAMPP MySQL...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping -n 3 127.0.0.1 >nul
    )
)

:: 2. Apply backend migrations and static files
echo [Backend] Applying database migrations...
cd backend
python manage.py migrate
echo [Backend] Collecting static assets with WhiteNoise...
python manage.py collectstatic --noinput
cd ..

:: 3. Build frontend production bundle
echo [Frontend] Compiling production build...
cd frontend
call npm run build
cd ..

:: 4. Start backend & frontend production preview in separate windows
echo [Services] Starting production backend & frontend servers...
start "Smart Inventory - Backend" cmd /k "cd /D %~dp0backend && python manage.py runserver 127.0.0.1:8000"
start "Smart Inventory - Frontend (Production Preview)" cmd /k "cd /D %~dp0frontend && npm run preview"

echo.
echo =========================================================
echo  Production Deployment Complete!
echo  Application: http://localhost:5173/
echo  Backend API: http://127.0.0.1:8000/
echo  Admin Panel: http://127.0.0.1:8000/admin/ (admin / admin123)
echo =========================================================
pause
