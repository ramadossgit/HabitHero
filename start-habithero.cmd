@echo off
rem Double-clickable wrapper for the full launcher. See start-habithero.ps1
rem Usage: start-habithero.cmd            (backend + mobile/Expo)
rem        start-habithero.cmd -NoMobile  (backend only)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-habithero.ps1" %*
pause
