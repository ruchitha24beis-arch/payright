@echo off
title Chanakya Full Stack Launcher
echo Starting Backend and Frontend services...
start "Backend (FastAPI)" cmd.exe /k "%~dp0start-backend.bat"
start "Frontend (Next.js)" cmd.exe /k "%~dp0start-frontend.bat"
echo Services launched! 
echo Backend Docs: http://localhost:8000/docs
echo Frontend App: http://localhost:3000
