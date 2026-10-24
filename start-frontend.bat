@echo off
title Chanakya Frontend (Next.js)
cd /d "%~dp0frontend"

set "NODE_EXE="
where node.exe >nul 2>&1
if %errorlevel% equ 0 set "NODE_EXE=node.exe"

if "%NODE_EXE%"=="" if exist "C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)

if "%NODE_EXE%"=="" if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
)

if "%NODE_EXE%"=="" (
    for /f "delims=" %%i in ('where /r "C:\Users\%USERNAME%" node.exe 2^>nul') do (
        if not defined NODE_EXE set "NODE_EXE=%%i"
    )
)

echo Starting Next.js Frontend on http://localhost:3000 ...
if not "%NODE_EXE%"=="" (
    "%NODE_EXE%" "node_modules\next\dist\bin\next" dev -p 3000
) else (
    npm run dev
)
pause

