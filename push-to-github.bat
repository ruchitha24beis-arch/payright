@echo off
title Push Chanakya to GitHub
cd /d "%~dp0"
echo ========================================================
echo Staging and Committing all updates...
echo ========================================================
git add .
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="update: sync project changes and deployment configurations"
git commit -m "%commit_msg%"

echo.
echo ========================================================
echo Pushing Chanakya to https://github.com/ruchitha24beis-arch/payright.git
echo ========================================================
echo.
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS: Repository successfully pushed to GitHub!
    echo URL: https://github.com/ruchitha24beis-arch/payright
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo PUSH FAILED:
    echo Please make sure you are signed into GitHub in your browser,
    echo or check your network connection.
    echo ========================================================
)
echo.
pause
