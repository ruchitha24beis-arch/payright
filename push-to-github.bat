@echo off
title Push Chanakya to GitHub
cd /d "%~dp0"
echo ========================================================
echo Staging and Committing all updates...
echo ========================================================
git add .
git commit -m "fix(backend): add greenlet and asyncpg to requirements.txt for SQLAlchemy asyncio support"

echo.
echo ========================================================
echo Pushing Chanakya to https://github.com/ruchitha24beis-arch/payright.git
echo ========================================================
echo.
git push -u origin main
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
    echo or enter your GitHub credentials/token when prompted.
    echo ========================================================
)
echo.
pause
