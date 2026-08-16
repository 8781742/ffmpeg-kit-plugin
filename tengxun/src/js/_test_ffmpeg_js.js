// FFmpeg 合并模块测试（纯 JS 版本）
logi("=== FFmpeg Merge Module Test ===");

// 加载模块
loadJS("/sdcard/Download/抖音下载/_ffmpeg_merge_plugin.js");

// 测试可用性
logi("[1] 检查 ffmpeg...");
if (!ffmpegIsAvailable()) {
    loge("❌ FFmpeg 不可用");
    exit();
}
logi("✅ FFmpeg 可用");

// 查找视频
logi("[2] 查找视频...");
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null");
if (!ls) {
    logi("没有找到视频");
    exit();
}

var files = ls.split("\n");
var valid = [];
for (var i = 0; i < files.length; i++) {
    if (files[i].trim().length > 0) valid.push(files[i].trim());
}
logi("找到 " + valid.length + " 个视频");

if (valid.length < 2) {
    logi("视频不足 2 个");
    exit();
}

// 测试合并
logi("[3] 测试合并...");
var output = "/sdcard/Download/抖音下载/merged_js_test.mp4";
var startTime = new Date().getTime();

var ok = ffmpegMergeTwo(valid[0], valid[1], output);
var elapsed = new Date().getTime() - startTime;

logi("合并结果: " + ok + " (耗时 " + elapsed + "ms)");

if (ok && file.exists(output)) {
    var sizeCmd = "stat -c %s \"" + output + "\" 2>/dev/null || echo 0";
    var sizeStr = shell.execAgentCommand(sizeCmd);
    var outSize = parseInt(sizeStr.trim()) || 0;
    logi("✅ SUCCESS: " + output);
    logi("   大小: " + formatSize(outSize));
} else {
    loge("❌ FAILED");
}

logi("");
logi("=== Test Complete ===");
