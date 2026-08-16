@echo off
echo ========================================
echo   FFmpegKit Plugin Builder
echo ========================================
echo.

set PROJECT_DIR=D:\ec\tengxun\FFmpegKitPlugin_full
set OUTPUT_DIR=D:\ec\tengxun

echo [1] 检查 Android Studio...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo     OK: Android Studio found
) else (
    echo     WARNING: Android Studio not found
    echo     Please install Android Studio first
    pause
    exit /b 1
)

echo.
echo [2] 打开项目...
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%PROJECT_DIR%"
echo.
echo     Android Studio 已启动
echo     请等待 Gradle 同步完成
echo     然后执行: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo.
echo [3] 构建完成后
echo     APK 位置: %PROJECT_DIR%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo [4] 提取 DEX
echo     copy "%PROJECT_DIR%\app\build\outputs\apk\debug\app-debug.apk" "%OUTPUT_DIR%\FFmpegMerge.dex"
echo.
echo [5] 推送到设备
echo     adb push %OUTPUT_DIR%\FFmpegMerge.dex /sdcard/ffmpeg_plugin/
echo.
echo ========================================
pause
