@echo off
title Chanakya Frontend (Next.js)
cd /d "%~dp0frontend"

echo Starting Next.js Frontend on http://localhost:3000 ...
call npm run dev
pause

