@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Muse.ps1"
if errorlevel 1 pause
