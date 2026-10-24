@echo off
title Chanakya Full Stack Launcher
echo Starting Backend and Frontend services...
start "Backend (FastAPI)" "%~dp0start-backend.bat"
start "Frontend (Next.js)" "%~dp0start-frontend.bat"
echo Services launched! 
echo Backend Docs: http://localhost:8000/docs
echo Frontend App: http://localhost:3000
