@echo off
title Wanja AI - Study & Question Solver
echo ====================================================
echo      🌸 WANJA AI - Textbook Study Assistant 🌸
echo ====================================================
echo.
echo Starting Wanja AI server on http://localhost:5050 ...
echo Passcode: BETTYAI
echo.
cd /d "%~dp0"
node server/index.js
pause
