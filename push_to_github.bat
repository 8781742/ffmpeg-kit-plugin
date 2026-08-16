@echo off
echo ========================================
echo   Push to GitHub
echo ========================================
echo.

cd /d D:\ec\tengxun

echo [1] Adding remote repository...
git remote add origin https://github.com/8781742/ffmpeg-kit-plugin.git 2>nul
echo     Done.

echo.
echo [2] Setting branch name...
git branch -M main 2>nul
echo     Done.

echo.
echo [3] Pushing to GitHub...
echo     Please enter your GitHub credentials when prompted.
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Repository pushed.
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Open GitHub repository in browser
    echo 2. Click Code -> Codespaces -> New codespace
    echo 3. Wait for environment to start
    echo 4. Run: cd FFmpegKitPlugin_full ^&^& ./gradlew assembleDebug
    echo 5. Download APK and rename to .dex
    echo 6. Push to device: adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/
) else (
    echo.
    echo ========================================
    echo   FAILED to push
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. GitHub username/password is incorrect
    echo 2. Use Personal Access Token instead of password
    echo 3. Check your internet connection
    echo.
    echo To generate a Personal Access Token:
    echo - GitHub -> Settings -> Developer settings
    echo - Personal access tokens -> Tokens (classic)
    echo - Select 'repo' scope and generate
)

echo.
pause
