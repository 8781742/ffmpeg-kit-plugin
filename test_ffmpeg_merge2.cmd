@echo off
set ADB=C:\Users\pc\adb.exe
set FFMPEG=/sdcard/Download/ffmpeg-bin/ffmpeg
set VIDEO1=/sdcard/Download/抖音下载/.download/ep10_7538361937738943790.mp4
set VIDEO2=/sdcard/Download/抖音下载/.download/ep10_7549098006100921610.mp4
set OUTPUT=/sdcard/Download/抖音下载/merged_test.mp4
set LIST=/sdcard/Download/抖音下载/concat_test.txt

REM Check files exist
%ADB% shell ls -lh %VIDEO1% %VIDEO2%

REM Create concat list
%ADB% shell echo file '%VIDEO1%' > %LIST%
%ADB% shell echo file '%VIDEO2%' >> %LIST%
%ADB% shell cat %LIST%

REM Run ffmpeg merge
%ADB% shell "%FFMPEG% -f concat -safe 0 -i %LIST% -c copy %OUTPUT% -y"

REM Check result
%ADB% shell ls -lh %OUTPUT% 2>nul && echo SUCCESS || echo FAILED
