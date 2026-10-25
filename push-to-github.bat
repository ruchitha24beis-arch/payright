@echo off
title Push Chanakya to GitHub
cd /d "%~dp0"
echo ========================================================
echo Staging and Committing all updates...
echo ========================================================
git add .
git commit -m "feat: complete platform with deployment configs (Docker, Render, Vercel) and dynamic API proxying"

echo.
echo ========================================================
echo Pushing Chanakya to https://github.com/ruchitha24beis-arch/payrights.git
echo ========================================================
echo.
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS: Repository successfully pushed to GitHub!
    echo URL: https://github.com/ruchitha24beis-arch/payrights
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo PUSH FAILED:
    echo 1. Ensure the repo 'payrights' exists at:
    echo    https://github.com/new (Repository name: payrights)
    echo 2. Make sure you are signed in or enter your GitHub Personal
    echo    Access Token (PAT) when prompted.
    echo ========================================================
)
echo.
pause
