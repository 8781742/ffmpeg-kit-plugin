// 测试现有的 FFmpegPlugin.apk
logi("=== Test Existing FFmpegPlugin ===");

// 检查插件
var pluginPath = "/sdcard/Download/FFmpegPlugin.apk";
logi("[1] 检查插件: " + pluginPath);
if (!file.exists(pluginPath)) {
    loge("插件不存在");
    exit();
}
logi("插件存在");

// 加载插件
logi("[2] 加载插件...");
try {
    setRepeatLoadDex(false);
    loadDex(pluginPath);
    logi("插件加载成功");
} catch(e) {
    loge("插件加载失败: " + e);
    exit();
}

// 检查可用的类
logi("[3] 检查可用类...");
try {
    // 尝试常见的包名
    var packages = [
        "com.ffmpeg.plugin.FFmpegPlugin",
        "com.ec.ffmpeg.FFmpegPlugin",
        "com.silentlexx.ffmpeggui.FFmpegPlugin"
    ];
    
    for (var i = 0; i < packages.length; i++) {
        try {
            var cls = java.lang.Class.forName(packages[i]);
            logi("找到类: " + packages[i]);
            
            // 列出方法
            var methods = cls.getMethods();
            logi("方法数量: " + methods.length);
            for (var j = 0; j < Math.min(10, methods.length); j++) {
                logi("  " + methods[j].getName());
            }
            break;
        } catch(e2) {
            logi("类 " + packages[i] + " 不存在: " + e2.toString().substring(0, 50));
        }
    }
} catch(e) {
    loge("检查类失败: " + e);
}

logi("=== Test Complete ===");
