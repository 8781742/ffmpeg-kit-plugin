logi("=== 测试 laoleng ShellManager 正确调用 ===");

loadDex("/sdcard/Download/laoleng.apk");

// 方法1: 直接静态调用
try {
    logi("方法1: ShellManager.execShellCommand('whoami')");
    var result = com.laoleng.shell.ShellManager.execShellCommand("whoami");
    logi("结果1: " + result);
} catch(e) {
    logi("方法1失败: " + e);
}

// 方法2: 通过 Class.forName
try {
    logi("方法2: Class.forName");
    var cls = java.lang.Class.forName("com.laoleng.shell.ShellManager");
    logi("类: " + cls);
    
    // 获取方法
    var methods = cls.getDeclaredMethods();
    logi("方法数: " + methods.length);
    for (var i = 0; i < methods.length; i++) {
        logi("  - " + methods[i].getName() + "(" + methods[i].getParameterTypes().length + " params)");
    }
} catch(e) {
    logi("方法2失败: " + e);
}

// 方法3: 尝试创建实例并调用
try {
    logi("方法3: 创建实例");
    var mgr = new com.laoleng.shell.ShellManager();
    logi("实例: " + mgr);
    
    var result = mgr.execShellCommand("whoami");
    logi("结果: " + result);
} catch(e) {
    logi("方法3失败: " + e);
}

// 方法4: 尝试静态字段
try {
    logi("方法4: 静态字段");
    var fields = com.laoleng.shell.ShellManager.class.getFields();
    for (var i = 0; i < fields.length; i++) {
        logi("字段: " + fields[i].getName() + " = " + fields[i].get(null));
    }
} catch(e) {
    logi("方法4失败: " + e);
}
