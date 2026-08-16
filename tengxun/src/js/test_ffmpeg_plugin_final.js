// FFmpegMerge DEX Plugin - Final Test
logi("=== FFmpegMerge Plugin Test ===");

// 1. 检查 DEX 文件
var dexPath = "/sdcard/ffmpeg_plugin/FFmpegMerge.dex";
logi("[1] 检查插件: " + dexPath);
if (!file.exists(dexPath)) {
    loge("❌ DEX 不存在，请先运行 build 脚本");
    exit();
}
logi("✅ DEX 存在: " + file.size(dexPath) + " bytes");

// 2. 加载 DEX
logi("[2] 加载 DEX...");
try {
    setRepeatLoadDex(false);
    loadDex(dexPath);
    logi("✅ DEX 加载成功");
} catch(e) {
    loge("❌ DEX 加载失败: " + e);
    exit();
}

// 3. 初始化
logi("[3] 初始化...");
var ffmpegPath = "/sdcard/Download/ffmpeg-bin/ffmpeg";
try {
    var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
    var initOk = Boolean(cls.getMethod("init", java.lang.String.class)
        .invoke(null, ffmpegPath));
    logi("init 结果: " + initOk);
    if (!initOk) { exit(); }
    logi("✅ 初始化成功");
} catch(e) {
    loge("❌ 初始化失败: " + e);
    exit();
}

// 4. 检查可用性
logi("[4] 检查可用性...");
try {
    var avail = Boolean(cls.getMethod("isAvailable").invoke(null));
    logi("isAvailable: " + avail);
    if (!avail) { exit(); }
    logi("✅ 插件可用");
} catch(e) {
    loge("❌ 可用性检查失败: " + e);
    exit();
}

// 5. 查找测试视频
logi("[5] 查找测试视频...");
var dlDir = "/sdcard/Download/抖音下载/.download/";
try {
    var ls = shell.execAgentCommand("ls " + dlDir + "*.mp4 2>/dev/null");
    if (!ls || ls.trim().length === 0) {
        logi("⚠️ 没有可测试的视频文件");
    } else {
        var files = ls.split("\n").filter(function(s){ return s.trim().length > 0; });
        logi("找到 " + files.length + " 个视频");
        
        if (files.length >= 2) {
            var output = "/sdcard/Download/抖音下载/merged_via_plugin.mp4";
            logi("[6] 测试合并: " + files[0].substring(files[0].lastIndexOf('/')+1) + " + " + files[1].substring(files[1].lastIndexOf('/')+1));
            
            var mergeOk = Boolean(cls.getMethod("mergeVideos",
                java.lang.String.class, java.lang.String.class, java.lang.String.class)
                .invoke(null, files[0], files[1], output));
            
            logi("合并结果: " + mergeOk);
            
            if (mergeOk && file.exists(output)) {
                var size = file.size(output);
                logi("✅ SUCCESS: " + output + " (" + formatSize(size) + ")");
            } else {
                loge("❌ FAILED: 合并失败或输出不存在");
            }
        }
    }
} catch(e) {
    loge("❌ 合并测试异常: " + e);
}

logi("=== Test Complete ===");

function formatSize(bytes) {
    if (bytes <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0;
    var size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return size.toFixed(1) + " " + units[i];
}
