@echo off
title Launching PlexusX...
cd /d "%~dp0"

echo [PlexusX] Compiling latest changes...
call npm run build

echo [PlexusX] Starting app...
start "" npx electron .
exit
