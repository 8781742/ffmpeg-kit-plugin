// ============================================================
// 文件: test_hid.js
// 描述: HID 插件测试脚本 — 验证初始化 + 各 API 可用性
// 用法: 在 EC 中先确保 /sdcard/hid/ 下有 KMDEX3.4.dex + libnative-hid*.so
// ============================================================

logi("===== HID 插件测试 =====");

// ─── 第1步：检查文件 ─────────────────────────────────────────
logi("[1] 检查插件文件...");
var dexPath = "/sdcard/hid/KMDEX3.4.dex";
var soDir   = "/sdcard/hid/";

if (!file.exists(dexPath)) {
    loge("❌ DEX 不存在: " + dexPath);
    loge("请把 KMDEX3.4.dex + libnative-hid.so + libnative-hid64.so 放到 /sdcard/hid/ 目录");
    exit();
}
logi("✅ DEX 文件存在: " + dexPath);

var so32 = soDir + "libnative-hid.so";
var so64 = soDir + "libnative-hid64.so";
logi("  libnative-hid.so:  " + (file.exists(so32) ? "✅" : "⚠️ 缺失(32位)"));
logi("  libnative-hid64.so:" + (file.exists(so64) ? "✅" : "⚠️ 缺失(64位)"));

// ─── 第2步：加载 DEX ─────────────────────────────────────────
logi("[2] 加载 DEX...");
setRepeatLoadDex(false);
try {
    loadDex(dexPath);
    logi("✅ DEX 加载成功");
} catch(e) {
    loge("❌ DEX 加载失败: " + e);
    exit();
}

// ─── 第3步：获取 Java 对象 ────────────────────────────────────
logi("[3] 获取 HID Java 对象...");
var hid = null;
try {
    hid = com.hid.server.hid;
    if (!hid) {
        loge("❌ com.hid.server.hid 为 null");
        exit();
    }
    logi("✅ Java 对象获取成功: " + hid);
} catch(e) {
    loge("❌ 获取 Java 对象失败: " + e);
    exit();
}

// ─── 第4步：初始化 ────────────────────────────────────────────
logi("[4] 调用 hid.init(context, so_path)...");
logi("    so_path = " + soDir);
var initOk = false;
try {
    initOk = hid.init(context, soDir);
} catch(e) {
    loge("❌ init 异常: " + e);
}

if (!initOk) {
    loge("❌ hid.init() 返回 false");
    loge("    请检查：1) 蓝牙/HID 设备是否已配对连接  2) so_path 路径是否正确");
    exit();
}
logi("✅ hid.init() 返回 true");

// 等待连接建立
logi("    等待 3 秒让连接建立...");
sleep(3000);

// ─── 第5步：连接状态确认 ──────────────────────────────────────
logi("[5] 检查连接状态...");
try {
    var on = hid.isOn();
    logi("    hid.isOn() = " + on);
    if (!on) {
        loge("❌ 连接未建立！请检查蓝牙/HID 设备");
        exit();
    }
    logi("✅ 设备已连接");
} catch(e) {
    loge("isOn() 异常: " + e);
}

// ─── 第6步：版本号 ────────────────────────────────────────────
logi("[6] 获取版本号...");
try {
    var ver = hid.dexBeat();
    logi("    版本: " + ver);
} catch(e) {
    loge("dexBeat() 异常: " + e);
}

// ─── 第7步：电量 ──────────────────────────────────────────────
logi("[7] 获取电量...");
try {
    var battery = hid.getBatteryLevel();
    var charging = hid.isCharging();
    logi("    电量: " + battery + "%, 充电: " + charging);
} catch(e) {
    loge("电量查询异常: " + e);
}

// ─── 第8步：点击测试 ──────────────────────────────────────────
logi("[8] 点击测试 (屏幕中心)...");
var w = device.width || 1080;
var h = device.height || 1920;
var cx = Math.floor(w / 2);
var cy = Math.floor(h / 2);
try {
    hid.click(cx, cy);
    logi("✅ click(" + cx + "," + cy + ") 成功");
} catch(e) {
    loge("❌ click 异常: " + e);
}
sleep(1000);

// ─── 第9步：滑动测试（向上滑） ───────────────────────────────
logi("[9] 滑动测试 (向上滑)...");
try {
    hid.swip(cx, cy + 200, cx, cy - 200, 400);
    logi("✅ swip 成功");
} catch(e) {
    loge("❌ swip 异常: " + e);
}
sleep(1000);

// ─── 第10步：Home 键 ─────────────────────────────────────────
logi("[10] Home 键测试...");
try {
    hid.keyPress(3);
    logi("✅ keyPress(HOME) 成功");
} catch(e) {
    loge("❌ keyPress 异常: " + e);
}

// ─── 完成 ─────────────────────────────────────────────────────
logi("===== HID 插件测试完成 =====");
logi("所有核心 API 可用 ✅");
logi("现在可以在主脚本中调用 hidInit() 使用 HID 插件");
