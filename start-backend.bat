@echo off
title Chanakya Backend (FastAPI)
cd /d "%~dp0backend"
set "PYTHONPATH=%~dp0backend"
echo Starting FastAPI Backend on http://localhost:8000 ...

if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe -c "import sys" >nul 2>&1
    if %errorlevel% equ 0 (
        .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
        goto :end
    )
)

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

:end
pause

