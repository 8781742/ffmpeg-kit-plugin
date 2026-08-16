logi("=== 深入分析 laoleng ShellManager ===");

loadDex("/sdcard/Download/laoleng.apk");
logi("laoleng 加载成功");

try {
    var ShellManager = com.laoleng.shell.ShellManager;
    logi("ShellManager 类: " + ShellManager);
    
    // 列出所有方法
    logi("--- 方法列表 ---");
    var methods = ShellManager.getClass().getMethods();
    for (var i = 0; i < methods.length; i++) {
        logi("方法: " + methods[i].getName() + " (" + methods[i].getParameterTypes().length + " params)");
    }
    
    // 列出所有字段
    logi("--- 字段列表 ---");
    var fields = ShellManager.getClass().getFields();
    for (var j = 0; j < fields.length; j++) {
        logi("字段: " + fields[j].getName() + " = " + fields[j].get(null));
    }
    
    // 尝试创建实例
    logi("--- 尝试创建实例 ---");
    try {
        var instance = new ShellManager();
        logi("实例创建成功: " + instance);
        
        // 尝试调用方法
        logi("尝试 execShellCommand...");
        var result = instance.execShellCommand("whoami");
        logi("结果: " + result);
    } catch(e) {
        logi("实例创建失败: " + e);
    }
    
} catch(e) {
    logi("错误: " + e);
}
