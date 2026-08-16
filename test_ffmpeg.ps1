$ADB = "C:\Users\pc\.config\easyclick\ecbin\adb.exe"
$downloadDir = "/sdcard/Download/"
$movieDir = $downloadDir + [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes("抖音下载"))

# Test ffmpeg
& cmd /c "$ADB shell /data/local/tmp/ffmpeg-bin/ffmpeg -version 2>&1 | head -2"
Write-Output "---"

# Show concat content
& cmd /c "$ADB shell cat $movieDir/concat.txt"
Write-Output "---"

# List source files
& cmd /c "$ADB shell ls -lh $movieDir/.download/"
Write-Output "---"

# Run merge
$result = & cmd /c "$ADB shell /data/local/tmp/ffmpeg-bin/ffmpeg -f concat -safe 0 -i `"$movieDir/concat.txt`" -c copy `"$movieDir/test_merge.mp4`" -y 2>&1"
Write-Output $result
Write-Output "---"

# Check result
& cmd /c "$ADB shell ls -lh $movieDir/test_merge.mp4 2>&1"
