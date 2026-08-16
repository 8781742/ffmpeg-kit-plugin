@echo off
set ADB=C:\Users\pc\adb.exe
%ADB% shell chmod 755 /sdcard/Download/ffmpeg-bin/ffmpeg
%ADB% shell "/sdcard/Download/ffmpeg-bin/ffmpeg -version 2>&1 | head -1"
%ADB% shell ls -lh /sdcard/ffmpeg_plugin/
%ADB% shell ls -lh /sdcard/Download/抖音下载/.download/*.mp4 2>nul | findstr /i "ep10"
