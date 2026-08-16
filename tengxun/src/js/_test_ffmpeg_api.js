// 测试 FFmpegPlugin 所有可能的方法
logi("=== Test FFmpegPlugin API ===");

var pluginPath = "/sdcard/Download/FFmpegPlugin.apk";
logi("[1] 加载插件...");
setRepeatLoadDex(false);
loadDex(pluginPath);
logi("加载成功");

var cls = null;
try {
    cls = java.lang.Class.forName("com.ffmpeg.plugin.FFmpegPlugin");
    logi("找到类: com.ffmpeg.plugin.FFmpegPlugin");
} catch(e) {
    loge("类不存在: " + e);
    exit();
}

// 列出所有方法
logi("[2] 列出方法...");
var methods = cls.getMethods();
logi("共 " + methods.length + " 个方法:");
for (var i = 0; i < methods.length; i++) {
    var m = methods[i];
    var params = "";
    var pt = m.getParameterTypes();
    for (var j = 0; j < pt.length; j++) {
        if (j > 0) params += ", ";
        params += pt[j].getSimpleName();
    }
    logi("  " + m.getName() + "(" + params + ")");
}

// 尝试查找合并相关方法
logi("[3] 测试合并方法...");
var mergeMethod = null;
var methodNames = ["mergeTwoVideos", "mergeVideos", "merge", "concat", "combine"];
for (var i = 0; i < methodNames.length; i++) {
    try {
        mergeMethod = cls.getMethod(methodNames[i], 
            java.lang.String.class, java.lang.String.class, java.lang.String.class);
        logi("找到方法: " + methodNames[i]);
        break;
    } catch(e) {}
}

if (!mergeMethod) {
    loge("未找到合并方法");
    exit();
}

// 查找视频
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null | head -2");
if (!ls) { logi("无视频"); exit(); }
var files = ls.split("\n");
var valid = [];
for (var i = 0; i < files.length; i++) {
    if (files[i].trim().length > 0) valid.push(files[i].trim());
}
if (valid.length < 2) { logi("视频不足"); exit(); }

// 测试合并
logi("[4] 执行合并...");
var output = "/sdcard/Download/test_api_merge.mp4";
var startTime = new Date().getTime();

try {
    var result = mergeMethod.invoke(null, valid[0], valid[1], output);
    var elapsed = new Date().getTime() - startTime;
    logi("结果: " + result + " (耗时 " + elapsed + "ms)");
    
    if (file.exists(output)) {
        var size = shell.execAgentCommand("stat -c %s \"" + output + "\" 2>/dev/null || echo 0");
        logi("SUCCESS: " + output + " (" + formatSize(parseInt(size) || 0) + ")");
    } else {
        loge("FAILED: 输出不存在");
    }
} catch(e) {
    loge("异常: " + e);
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
