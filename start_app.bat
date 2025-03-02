@echo off
REM Weight Tracker App Starter
REM This script starts both the backend server and frontend client

echo ===============================================
echo    Starting Weight Tracker App                 
echo ===============================================

REM Check for existing processes
echo Checking for existing Weight Tracker processes...

REM Find Python/Flask processes that might be our backend
set "FOUND_BACKEND=0"
for /f "tokens=1" %%i in ('tasklist /fi "imagename eq python.exe" ^| findstr /i "python"') do (
    set "FOUND_BACKEND=1"
)

REM Find npm/node processes that might be our frontend
set "FOUND_FRONTEND=0"
for /f "tokens=1" %%i in ('tasklist /fi "imagename eq node.exe" ^| findstr /i "node"') do (
    set "FOUND_FRONTEND=1"
)

set "FOUND_PROCESSES=0"
if "%FOUND_BACKEND%"=="1" set "FOUND_PROCESSES=1"
if "%FOUND_FRONTEND%"=="1" set "FOUND_PROCESSES=1"

if "%FOUND_PROCESSES%"=="1" (
    echo Found existing Python/Node processes that might be related to Weight Tracker.
    echo These could be previous instances of the app that weren't properly closed.
    
    echo Terminating existing processes...
    
    REM Kill Python processes
    if "%FOUND_BACKEND%"=="1" (
        echo Stopping Python/Flask processes...
        taskkill /f /im python.exe
    )
    
    REM Kill Node processes
    if "%FOUND_FRONTEND%"=="1" (
        echo Stopping Node/npm processes...
        taskkill /f /im node.exe
    )
    
    REM Wait a moment for processes to terminate
    timeout /t 2 /nobreak > nul
    echo Previous processes terminated.
) else (
    echo No existing Weight Tracker processes found.
)

REM Check for Python virtual environment
if not exist venv\ (
  echo Virtual environment not found. Please follow the setup instructions in README.md
  exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist logs\ (
  echo Creating logs directory...
  mkdir logs
)

REM Start the backend server in a new window
echo Starting backend server...
start "Weight Tracker - Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python run.py"

REM Wait a moment for the backend to initialize
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

REM Start the frontend client in a new window
echo Starting frontend client...
if not exist frontend\ (
  echo Error: Frontend directory not found
  exit /b 1
)

start "Weight Tracker - Frontend" cmd /k "cd /d %~dp0\frontend && set PORT=3939 && npm start"

echo.
echo Weight Tracker is starting up!
echo - Backend is running on http://localhost:5001
echo - Frontend will be available at http://localhost:3939
echo.
echo Please close both terminal windows to shut down the application.
echo.

REM Keep this window open to make it easier for user to find and close
echo Press any key to exit this launcher window...
pause > nul 