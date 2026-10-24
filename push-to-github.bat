@echo off
title Push Chanakya to GitHub
cd /d "%~dp0"
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
    echo Please make sure you are signed into GitHub in your browser,
    echo or enter your GitHub credentials/token when prompted.
    echo ========================================================
)
echo.
pause
