@echo off
set EC=D:\ec\tengxun\ec_work_config\android\bin\ec-android-cli.exe
set LOG=D:\ec\tengxun\ai_logs\ffmpeg_plugin_test.log

echo === Running FFmpegMerge Plugin Test ===
%EC% run -m tengxun -f json -k "Test Complete" -o %LOG%
echo Exit code: %errorlevel%
echo.
echo === Log Output ===
type %LOG% 2>nul | findstr /i "FFmpegMerge\|DEX\|init\|merge\|SUCCESS\|FAILED"
