@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully
echo Starting the application...
call npm start
pause 