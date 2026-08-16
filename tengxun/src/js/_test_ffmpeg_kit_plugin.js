// FFmpegMerge DEX 插件测试
logi("=== FFmpegMerge Plugin Test ===");

// 1. 检查 DEX
var dexPath = "/sdcard/ffmpeg_plugin/FFmpegMerge.dex";
logi("[1] DEX: " + dexPath);
if (!file.exists(dexPath)) {
    loge("DEX 不存在");
    exit();
}
logi("DEX 存在");

// 2. 加载 DEX
logi("[2] 加载 DEX...");
setRepeatLoadDex(false);
loadDex(dexPath);
logi("DEX 加载成功");

// 3. 初始化
logi("[3] 初始化...");
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
var ffmpegPath = "/data/local/tmp/ffmpeg";
var initOk = Boolean(cls.getMethod("init", java.lang.String.class).invoke(null, ffmpegPath));
logi("init: " + initOk);
if (!initOk) { exit(); }
logi("初始化成功");

// 4. 检查可用性
logi("[4] 检查可用性...");
var avail = Boolean(cls.getMethod("isAvailable").invoke(null));
logi("isAvailable: " + avail);
if (!avail) { exit(); }
logi("插件可用");

// 5. 获取路径
logi("[5] 获取 ffmpeg 路径...");
var path = cls.getMethod("getFfmpegPath").invoke(null);
logi("ffmpegPath: " + path);

// 6. 查找视频
logi("[6] 查找视频...");
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null");
if (!ls) { logi("无视频"); exit(); }
var files = ls.split("\n");
var valid = [];
for (var i = 0; i < files.length; i++) {
    if (files[i].trim().length > 0) valid.push(files[i].trim());
}
logi("找到 " + valid.length + " 个视频");

if (valid.length < 2) { logi("视频不足"); exit(); }

// 7. 测试合并
logi("[7] 测试合并...");
var output = "/sdcard/Download/merged_plugin_test.mp4";
logi("合并: " + valid[0].substring(valid[0].lastIndexOf('/')+1));

var startTime = new Date().getTime();
var mergeOk = Boolean(cls.getMethod("mergeVideos", java.lang.String.class, java.lang.String.class, java.lang.String.class).invoke(null, valid[0], valid[1], output));
var elapsed = new Date().getTime() - startTime;

logi("合并结果: " + mergeOk + " (耗时 " + elapsed + "ms)");

if (mergeOk && file.exists(output)) {
    var sizeCmd = "stat -c %s \"" + output + "\" 2>/dev/null || echo 0";
    var sizeStr = shell.execAgentCommand(sizeCmd);
    var outSize = parseInt(sizeStr.trim()) || 0;
    logi("SUCCESS: " + output);
    logi("大小: " + formatSize(outSize));
} else {
    loge("FAILED");
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
