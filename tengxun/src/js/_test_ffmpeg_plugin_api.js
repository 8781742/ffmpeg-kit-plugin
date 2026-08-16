// 测试 FFmpegPlugin API
logi("=== Test FFmpegPlugin API ===");

// 加载插件
var pluginPath = "/sdcard/Download/FFmpegPlugin.apk";
logi("[1] 加载插件: " + pluginPath);
setRepeatLoadDex(false);
loadDex(pluginPath);
logi("插件加载成功");

// 获取类
logi("[2] 获取类...");
var cls = null;
try {
    cls = java.lang.Class.forName("com.ffmpeg.plugin.FFmpegPlugin");
    logi("类: com.ffmpeg.plugin.FFmpegPlugin");
} catch(e) {
    loge("类加载失败: " + e);
    // 尝试列出所有类
    logi("尝试查找类...");
    exit();
}

// 列出方法
logi("[3] 列出方法...");
var methods = cls.getMethods();
logi("方法数量: " + methods.length);
for (var i = 0; i < methods.length; i++) {
    var m = methods[i];
    logi("  " + m.getName() + "(" + getParamTypes(m) + ")");
}

// 测试 merge 方法
logi("[4] 测试合并...");
var mergeMethod = null;
try {
    mergeMethod = cls.getMethod("mergeTwoVideos", 
        java.lang.String.class, java.lang.String.class, java.lang.String.class);
    logi("找到 mergeTwoVideos 方法");
} catch(e) {
    logi("mergeTwoVideos 不存在: " + e);
    // 尝试其他方法名
    try {
        mergeMethod = cls.getMethod("mergeVideos",
            java.lang.String.class, java.lang.String.class, java.lang.String.class);
        logi("找到 mergeVideos 方法");
    } catch(e2) {
        loge("未找到合并方法: " + e2);
        exit();
    }
}

// 查找视频
var ls = shell.execAgentCommand("ls /sdcard/Download/抖音下载/.download/*.mp4 2>/dev/null | head -2");
if (!ls) { logi("没有找到视频"); exit(); }

var files = ls.split("\n");
var valid = [];
for (var i = 0; i < files.length; i++) {
    if (files[i].trim().length > 0) valid.push(files[i].trim());
}

if (valid.length < 2) { logi("视频不足"); exit(); }

logi("测试合并: " + valid[0].substring(valid[0].lastIndexOf('/')+1));
var output = "/sdcard/Download/test_plugin_merge.mp4";

try {
    var startTime = new Date().getTime();
    var result = mergeMethod.invoke(null, valid[0], valid[1], output);
    var elapsed = new Date().getTime() - startTime;
    
    logi("合并结果: " + result + " (耗时 " + elapsed + "ms)");
    
    if (result && file.exists(output)) {
        var size = shell.execAgentCommand("stat -c %s \"" + output + "\" 2>/dev/null || echo 0");
        logi("SUCCESS: " + output + " (" + formatSize(parseInt(size) || 0) + ")");
    } else {
        loge("FAILED");
    }
} catch(e) {
    loge("合并异常: " + e);
}

logi("");
logi("=== Test Complete ===");

function getParamTypes(method) {
    var params = method.getParameterTypes();
    var types = [];
    for (var i = 0; i < params.length; i++) {
        types.push(params[i].getName());
    }
    return types.join(", ");
}

function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0, size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(1) + " " + units[i];
}
