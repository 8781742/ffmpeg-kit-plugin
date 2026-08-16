@echo off
REM Test ffmpeg on device
set ADB=C:\Users\pc\.config\easyclick\ecbin\adb.exe
%ADB% shell "/data/local/tmp/ffmpeg-bin/ffmpeg -version 2>&1 | head -2"
echo ---
%ADB% shell "/data/local/tmp/ffmpeg-bin/ffmpeg -f concat -safe 0 -i /sdcard/Download/抖音下载/concat.txt -c copy /sdcard/Download/test_merge.mp4 -y 2>&1"
echo ---
%ADB% shell "ls -lh /sdcard/Download/test_merge.mp4 2>/dev/null && echo OK || echo FAIL"
