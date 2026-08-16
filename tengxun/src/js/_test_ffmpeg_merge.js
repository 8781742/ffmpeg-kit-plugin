// FFmpeg 合并模块测试
logi("=== FFmpeg Merge Test ===");

// 检查 ffmpeg
var version = shell.execAgentCommand("/data/local/tmp/ffmpeg -version 2>&1 | head -1");
if (version && version.indexOf("ffmpeg") >= 0) {
    logi("FFmpeg 可用: " + version);
} else {
    loge("FFmpeg 不可用");
    exit();
}

// 查找视频
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
    logi("视频不足");
    exit();
}

// 测试合并
logi("测试合并...");
var output = "/sdcard/Download/test_merge_result.mp4";
var listFile = output + ".txt";

// 创建 concat 列表
var listContent = "file '" + valid[0] + "'\nfile '" + valid[1] + "'\n";
file.writeFile(listContent, listFile);

// 执行合并
var cmd = "/data/local/tmp/ffmpeg -f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";
logi("执行: " + cmd);

var result = shell.execAgentCommand(cmd);
logi("执行结果: " + (result !== null ? "成功" : "失败"));

// 清理
try { file.deleteFile(listFile); } catch(e) {}

// 检查结果
if (file.exists(output)) {
    var size = shell.execAgentCommand("stat -c %s \"" + output + "\" 2>/dev/null || echo 0");
    logi("SUCCESS: " + output + " (" + formatSize(parseInt(size) || 0) + ")");
} else {
    loge("FAILED: 输出文件不存在");
}

logi("=== Test Complete ===");

function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0, size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(1) + " " + units[i];
}
