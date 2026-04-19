@echo off
setlocal

REM Launch Reverse Alarm on a connected Android device/emulator via Expo.
REM Usage:
REM   run.bat            -> expo run:android (debug, installs + starts Metro)
REM   run.bat release    -> expo run:android --variant release
REM   run.bat start      -> expo start (Metro only, assumes APK already installed)

set "MODE=%~1"

if /I "%MODE%"=="start" (
    echo.
    echo Starting Metro bundler...
    echo.
    call npx expo start
    goto :end
)

if not exist "android\gradlew.bat" (
    echo.
    echo android\ not found. Running prebuild first...
    echo.
    call node prebuild.js --clean
    if errorlevel 1 goto :fail
)

if /I "%MODE%"=="release" (
    echo.
    echo Running expo run:android --variant release...
    echo.
    call npx expo run:android --variant release
) else (
    echo.
    echo Running expo run:android...
    echo.
    call npx expo run:android
)

if errorlevel 1 goto :fail

:end
pause
exit /b 0

:fail
echo.
echo Run failed.
echo.
pause
exit /b 1
