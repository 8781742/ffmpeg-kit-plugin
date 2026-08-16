// FFmpeg 合并最终测试
logi("=== FFmpeg Merge Final Test ===");

// 1. 检查 ffmpeg
logi("[1] 检查 FFmpeg...");
var ver = shell.execAgentCommand("/data/local/tmp/ffmpeg -version 2>&1 | head -1");
if (!ver || ver.indexOf("ffmpeg") < 0) {
    loge("FFmpeg 不可用");
    exit();
}
logi("FFmpeg OK");

// 2. 查找视频
logi("[2] 查找视频...");
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null");
if (!ls) { logi("无视频"); exit(); }
var files = ls.split("\n");
var valid = [];
for (var i = 0; i < files.length; i++) {
    if (files[i].trim().length > 0) valid.push(files[i].trim());
}
logi("找到 " + valid.length + " 个视频");

if (valid.length < 2) { logi("视频不足"); exit(); }

// 3. 复制到 ASCII 路径
logi("[3] 复制到 ASCII 路径...");
var v1 = valid[0];
var v2 = valid[1];
var v1a = "/sdcard/Download/_f_v1.mp4";
var v2a = "/sdcard/Download/_f_v2.mp4";
var outa = "/sdcard/Download/_f_merged.mp4";

shell.execAgentCommand("cp '" + v1 + "' '" + v1a + "'");
shell.execAgentCommand("cp '" + v2 + "' '" + v2a + "'");

if (!file.exists(v1a) || !file.exists(v2a)) {
    loge("复制失败");
    exit();
}
logi("复制成功");

// 4. 创建 concat 列表
logi("[4] 创建 concat 列表...");
var list = "file '" + v1a + "'\nfile '" + v2a + "'\n";
file.writeFile(list, "/sdcard/Download/_f_concat.txt");
logi("列表已创建");

// 5. 执行合并
logi("[5] 执行合并...");
var cmd = "/data/local/tmp/ffmpeg -f concat -safe 0 -i /sdcard/Download/_f_concat.txt -c copy " + outa + " -y";
var result = shell.execAgentCommand(cmd);
logi("执行结果: " + (result !== null ? "成功" : "失败"));

// 6. 检查结果
logi("[6] 检查结果...");
if (file.exists(outa)) {
    var sizeCmd = "stat -c %s '" + outa + "' 2>/dev/null || echo 0";
    var sizeStr = shell.execAgentCommand(sizeCmd);
    var outSize = parseInt(sizeStr.trim()) || 0;
    logi("SUCCESS: " + outa);
    logi("大小: " + formatSize(outSize));
} else {
    loge("FAILED: 输出文件不存在");
}

logi("");
logi("=== Test Complete ===");

function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0, size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(1) + " " + units[i];
}
