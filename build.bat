@echo off
setlocal

REM Build Reverse Alarm debug APK.
REM Usage:
REM   build.bat            -> assembleDebug
REM   build.bat release    -> assembleRelease

set "VARIANT=%~1"
if "%VARIANT%"=="" set "VARIANT=debug"

if /I "%VARIANT%"=="release" (
    set "GRADLE_TASK=assembleRelease"
) else (
    set "GRADLE_TASK=assembleDebug"
)

if not exist "android\gradlew.bat" (
    echo.
    echo android\ not found. Running prebuild first...
    echo.
    call node prebuild.js --clean
    if errorlevel 1 goto :fail
)

echo.
echo Running gradle %GRADLE_TASK%...
echo.
pushd android
call gradlew.bat %GRADLE_TASK%
set "BUILD_STATUS=%ERRORLEVEL%"
popd

if not "%BUILD_STATUS%"=="0" goto :fail

echo.
echo Build succeeded. APK at:
if /I "%VARIANT%"=="release" (
    echo   android\app\build\outputs\apk\release\
) else (
    echo   android\app\build\outputs\apk\debug\
)
echo.
pause
exit /b 0

:fail
echo.
echo Build failed.
echo.
pause
exit /b 1
