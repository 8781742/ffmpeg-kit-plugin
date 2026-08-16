logi("=== 测试 adbClient.runShell ===");

// Check if adbClient is available
if (typeof adbClient === 'undefined') {
    loge("adbClient 未定义");
    exit();
}

logi("adbClient 可用");

// Test simple command
try {
    var result = adbClient.runShell("echo hello", 5000);
    logi("简单命令结果: " + result);
} catch(e) {
    loge("简单命令失败: " + e);
}

// Test ffmpeg version
try {
    var ffmpegPath = "/sdcard/Download/ffmpeg-bin/ffmpeg";
    var result = adbClient.runShell(ffmpegPath + " -version 2>&1 | head -1", 10000);
    logi("ffmpeg 版本: " + result);
} catch(e) {
    loge("ffmpeg 版本失败: " + e);
}

// Test merge with timeout
try {
    var concatFile = "/sdcard/Download/抖音下载/concat.txt";
    var outputFile = "/sdcard/Download/抖音下载/adbclient_test.mp4";
    
    // Clean up previous test
    try { file.deleteFile(outputFile); } catch(e) {}
    
    var cmd = "/sdcard/Download/ffmpeg-bin/ffmpeg -f concat -safe 0 -i \"" + concatFile + "\" -c copy \"" + outputFile + "\" -y 2>&1";
    logi("开始合并...");
    
    var result = adbClient.runShell(cmd, 300000); // 5 minute timeout
    
    logi("合并完成，结果长度: " + (result ? result.length : 0));
    
    if (file.exists(outputFile)) {
        logi("SUCCESS: 输出文件存在，大小: " + file.size(outputFile));
    } else {
        loge("FAIL: 输出文件不存在");
    }
} catch(e) {
    loge("合并异常: " + e);
}
