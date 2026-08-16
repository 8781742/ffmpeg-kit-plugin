logi("=== 测试 execAgentCommand 是否同步 ===");

var ffmpegPath = "/sdcard/Download/ffmpeg-bin/ffmpeg";
var concatFile = "/sdcard/Download/抖音下载/concat.txt";
var outputFile = "/sdcard/Download/抖音下载/sync_test2.mp4";

// Clean up
try { file.deleteFile(outputFile); } catch(e) {}

var startTime = new Date().getTime();
logi("开始时间: " + startTime);

// Run ffmpeg via execAgentCommand
var cmd = ffmpegPath + " -f concat -safe 0 -i \"" + concatFile + "\" -c copy \"" + outputFile + "\" -y 2>&1";
logi("执行命令...");

var result = shell.execAgentCommand(cmd);
var endTime = new Date().getTime();

logi("命令返回，耗时: " + (endTime - startTime) + "ms");
logi("结果: " + (result || "null").substring(0, 100));

// Check if output exists
if (file.exists(outputFile)) {
    var size = file.size(outputFile);
    logi("SUCCESS: 输出文件存在，大小: " + size + " bytes");
} else {
    logi("FAIL: 输出文件不存在");
    // Check if file is being created (growing)
    for (var i = 0; i < 10; i++) {
        sleep(1000);
        if (file.exists(outputFile)) {
            logi("文件已创建，大小: " + file.size(outputFile));
            break;
        }
        logi("等待中... " + (i+1) + "s");
    }
}
