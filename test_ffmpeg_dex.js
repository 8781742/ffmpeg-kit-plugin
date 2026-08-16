// 独立测试 FFmpegMerge DEX 插件
logi("=== FFmpegMerge DEX Test ===");

// 加载插件
var dexPath = "/sdcard/ffmpeg_plugin/FFmpegMerge.dex";
loadDex(dexPath);
logi("DEX loaded");

// 初始化
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
var ok = cls.getMethod("init", java.lang.String.class).invoke(null, "/data/local/tmp/ffmpeg");
logi("init: " + ok);

// 检查可用性
var avail = cls.getMethod("isAvailable").invoke(null);
logi("available: " + avail);

// 查找视频
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null");
if (ls) {
    var files = ls.split("\n").filter(function(s){ return s.trim(); });
    logi("videos: " + files.length);
    
    if (files.length >= 2) {
        var output = "/sdcard/Download/抖音下载/merged_dex_v2.mp4";
        var result = cls.getMethod("mergeVideos",
            java.lang.String.class, java.lang.String.class, java.lang.String.class)
            .invoke(null, files[0], files[1], output);
        logi("merge: " + result);
        
        // 检查结果
        var size = shell.execAgentCommand("ls -l \"" + output + "\" 2>/dev/null | awk \'{print $5}\'");
        logi("output size: " + size);
    }
}

logi("=== Test Complete ===");
