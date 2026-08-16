// ============================================================
// 文件: _hid_plugin.js
// 描述: HID 蓝牙插件封装 — click/longClick/swip/touch/keyPress/home
// 文档来源: https://www.yuque.com/fengqunketang/blueshadow/gx0rv4evyyzpr1al
// 依赖: /sdcard/hid/KMDEX3.4.dex + libnative-hid.so + libnative-hid64.so
// ============================================================

// ─── 配置路径 ────────────────────────────────────────────────
var HID_DIR    = "/sdcard/hid/";
var DEX_PATH   = HID_DIR + "KMDEX3.4.dex";
var SO_NAME_32 = "libnative-hid.so";
var SO_NAME_64 = "libnative-hid64.so";

// ─── 状态 ────────────────────────────────────────────────────
var _hidLoaded  = false;
var _hidInitOk  = false;
var _hidObj     = null;

// ============================================================
// 1. 加载 DEX + SO 库
// ============================================================

/**
 * 检查 HID 插件文件是否存在
 * @return {boolean}
 */
function hidFilesExist() {
    if (!file.exists(DEX_PATH)) {
        loge("HID: DEX 不存在: " + DEX_PATH);
        return false;
    }
    // SO 文件可选，插件会在 so_path 目录下自动查找
    logi("HID: DEX 文件存在: " + DEX_PATH);
    return true;
}

/**
 * 加载 KMDEX DEX 插件
 * @return {boolean}
 */
function loadHidDex() {
    if (_hidLoaded) return true;
    if (!hidFilesExist()) return false;
    try {
        // 禁止重复加载 Dex 粘连
        setRepeatLoadDex(false);
        loadDex(DEX_PATH);
        _hidLoaded = true;
        logi("HID: DEX 加载成功");
        return true;
    } catch(e) {
        loge("HID: DEX 加载失败: " + e);
        return false;
    }
}

/**
 * 获取 HID Java 对象
 * @return {object|null}
 */
function getHidObj() {
    if (_hidObj) return _hidObj;
    try {
        _hidObj = com.hid.server.hid;
        if (!_hidObj) {
            loge("HID: com.hid.server.hid 为空");
            return null;
        }
        logi("HID: Java 对象获取成功");
        return _hidObj;
    } catch(e) {
        loge("HID: 获取 Java 对象失败: " + e);
        return null;
    }
}

// ============================================================
// 2. 初始化（核心入口）
// ============================================================

/**
 * 初始化 HID 插件 — 必须调用！
 * 原理：loadDex → 获取 com.hid.server.hid → hid.init(context, so_path)
 * @return {boolean} true=初始化成功 false=失败
 */
function hidInit() {
    // 已经初始化过
    if (_hidInitOk) return true;

    // 1. 加载 DEX
    if (!loadHidDex()) {
        loge("HID: 插件加载失败，请确认 /sdcard/hid/ 下有 KMDEX3.4.dex + libnative-hid*.so");
        return false;
    }

    // 2. 获取 Java 对象
    var hid = getHidObj();
    if (!hid) {
        loge("HID: com.hid.server.hid 不可用");
        return false;
    }

    // 3. 调用 hid.init(context, so_path)
    //    so_path 只传目录，插件会自动在目录下找 libnative-hid.so / libnative-hid64.so
    var initResult = false;
    try {
        initResult = hid.init(context, HID_DIR);
    } catch(e) {
        loge("HID: init 调用异常: " + e);
        return false;
    }

    if (!initResult) {
        loge("HID: 初始化返回 false，请检查硬件连接（蓝牙/HID 设备）");
        return false;
    }

    // 4. 等待连接建立（文档建议 3 秒）
    sleep(3000);

    // 5. 二次确认连接状态
    try {
        if (!hid.isOn()) {
            loge("HID: 初始化后 isOn()=false，连接可能未建立");
            return false;
        }
    } catch(e) {}

    _hidInitOk = true;
    logi("HID: ✅ 初始化成功");
    return true;
}

// ============================================================
// 3. 状态查询
// ============================================================

/**
 * 检查 HID 是否已连接
 * @return {boolean}
 */
function hidIsOn() {
    if (!_hidInitOk && !hidInit()) return false;
    try {
        return com.hid.server.hid.isOn();
    } catch(e) {
        loge("HID isOn 异常: " + e);
        return false;
    }
}

/**
 * 获取插件版本号
 * @return {string}
 */
function hidGetVersion() {
    if (!_hidInitOk) return "unknown";
    try {
        return String(com.hid.server.hid.dexBeat());
    } catch(e) {
        return "error";
    }
}

/**
 * 获取手机当前电量（百分比）
 * @return {number}
 */
function hidGetBatteryLevel() {
    if (!_hidInitOk) return -1;
    try {
        return com.hid.server.hid.getBatteryLevel();
    } catch(e) {
        return -1;
    }
}

/**
 * 是否正在充电
 * @return {boolean}
 */
function hidIsCharging() {
    if (!_hidInitOk) return false;
    try {
        return com.hid.server.hid.isCharging();
    } catch(e) {
        return false;
    }
}

/**
 * 关闭供电
 */
function hidSetPowerOff() {
    if (!_hidInitOk) return;
    try { com.hid.server.hid.setPowerOff(); } catch(e) { loge("hidSetPowerOff: " + e); }
}

/**
 * 打开供电
 */
function hidSetPowerOn() {
    if (!_hidInitOk) return;
    try { com.hid.server.hid.setPowerOn(); } catch(e) { loge("hidSetPowerOn: " + e); }
}

// ============================================================
// 4. 点击操作
// ============================================================

/**
 * 单击坐标
 * @param {number} x
 * @param {number} y
 */
function hidClick(x, y) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.click(x, y);
        return true;
    } catch(e) {
        loge("hidClick 异常: " + e);
        return false;
    }
}

/**
 * 连点击（多次点击同一位置）
 * @param {number} x
 * @param {number} y
 * @param {number} count  点击次数，默认 2
 */
function hidClicks(x, y, count) {
    count = count || 2;
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.clicks(x, y, count);
        return true;
    } catch(e) {
        loge("hidClicks 异常: " + e);
        return false;
    }
}

/**
 * 连点击增强版（支持间隔控制）
 * @param {number} x
 * @param {number} y
 * @param {number} count
 * @param {number} interval  每次点击间隔(ms)，默认 100
 */
function hidClicksV2(x, y, count, interval) {
    count   = count   || 2;
    interval = interval || 100;
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.clicksV2(x, y, count, interval);
        return true;
    } catch(e) {
        loge("hidClicksV2 异常: " + e);
        return false;
    }
}

/**
 * 长按坐标
 * @param {number} x
 * @param {number} y
 * @param {number} duration  长按时长(ms)，默认 800
 */
function hidLongClick(x, y, duration) {
    duration = duration || 800;
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.longClick(x, y, duration);
        return true;
    } catch(e) {
        loge("hidLongClick 异常: " + e);
        return false;
    }
}

// ============================================================
// 5. 滑动操作
// ============================================================

/**
 * 分段滑动（从 (x1,y1) 到 (x2,y2)，分多段完成）
 * @param {number} x1  起点 x
 * @param {number} y1  起点 y
 * @param {number} x2  终点 x
 * @param {number} y2  终点 y
 * @param {number} duration  总时长(ms)
 */
function hidSwip(x1, y1, x2, y2, duration) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.swip(x1, y1, x2, y2, duration);
        return true;
    } catch(e) {
        loge("hidSwip 异常: " + e);
        return false;
    }
}

/**
 * 快速滑动（短时长大距离）
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} duration
 */
function hidSwipM(x1, y1, x2, y2, duration) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.swipM(x1, y1, x2, y2, duration);
        return true;
    } catch(e) {
        loge("hidSwipM 异常: " + e);
        return false;
    }
}

/**
 * 滑动增强版（支持更多参数）
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} duration
 * @param {number} segments  分段数
 */
function hidSwipEx(x1, y1, x2, y2, duration, segments) {
    segments = segments || 3;
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.swipEx(x1, y1, x2, y2, duration, segments);
        return true;
    } catch(e) {
        loge("hidSwipEx 异常: " + e);
        return false;
    }
}

/**
 * 连续滑动（多次滑动）
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} count     滑动次数
 * @param {number} duration  每次时长(ms)
 * @param {number} interval  间隔(ms)
 */
function hidSwipMultiple(x1, y1, x2, y2, count, duration, interval) {
    count     = count     || 3;
    duration  = duration  || 300;
    interval  = interval  || 200;
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.swipMultiple(x1, y1, x2, y2, count, duration, interval);
        return true;
    } catch(e) {
        loge("hidSwipMultiple 异常: " + e);
        return false;
    }
}

// ============================================================
// 6. 触摸模式操作（低级 API）
// ============================================================

/**
 * 模式按下（触摸开始）
 * @param {number} x
 * @param {number} y
 */
function hidTouchDown(x, y) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.touchDown(x, y);
        return true;
    } catch(e) {
        loge("hidTouchDown 异常: " + e);
        return false;
    }
}

/**
 * 模式滑动（触摸移动）
 * @param {number} x
 * @param {number} y
 */
function hidTouchMove(x, y) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.touchMove(x, y);
        return true;
    } catch(e) {
        loge("hidTouchMove 异常: " + e);
        return false;
    }
}

/**
 * 模式抬起（触摸结束）
 */
function hidTouchUp() {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.touchUp();
        return true;
    } catch(e) {
        loge("hidTouchUp 异常: " + e);
        return false;
    }
}

// ============================================================
// 7. 按键 & 系统键
// ============================================================

/**
 * 按下虚拟按键
 * @param {number} keyCode  Android keyCode
 * e.g. 3=HOME, 4=BACK, 26=POWER, 66=ENTER, 82=MENU, 67=SEARCH
 */
function hidKeyPress(keyCode) {
    if (!hidInit()) return false;
    try {
        com.hid.server.hid.keyPress(keyCode);
        return true;
    } catch(e) {
        loge("hidKeyPress 异常: " + e);
        return false;
    }
}

/**
 * 按 Home 键
 */
function hidHome() {
    return hidKeyPress(3);
}

/**
 * 按 Back 键
 */
function hidBack() {
    return hidKeyPress(4);
}

/**
 * 按 Enter/确认 键
 */
function hidEnter() {
    return hidKeyPress(66);
}

/**
 * 按 Power 键（锁屏）
 */
function hidPower() {
    return hidKeyPress(26);
}

// ============================================================
// 8. 便捷封装：拖拽（touchDown + touchMove + touchUp）
// ============================================================

/**
 * 拖拽：按下 → 移动到目标 → 抬起
 * @param {number} x1  起点 x
 * @param {number} y1  起点 y
 * @param {number} x2  终点 x
 * @param {number} y2  终点 y
 * @param {number} duration  移动耗时(ms)
 */
function hidDrag(x1, y1, x2, y2, duration) {
    duration = duration || 500;
    if (!hidInit()) return false;
    try {
        hidTouchDown(x1, y1);
        sleep(100);
        // 分段移动更平滑
        var steps = 10;
        for (var i = 1; i <= steps; i++) {
            var cx = x1 + (x2 - x1) * i / steps;
            var cy = y1 + (y2 - y1) * i / steps;
            hidTouchMove(cx, cy);
            sleep(duration / steps);
        }
        hidTouchUp();
        return true;
    } catch(e) {
        loge("hidDrag 异常: " + e);
        return false;
    }
}

// ============================================================
// 9. 批量操作
// ============================================================

/**
 * 批量点击（多个坐标依次点击）
 * @param {Array<{x:number,y:number}>} points
 * @param {number} delay  每次点击后延迟(ms)
 */
function hidBatchClick(points, delay) {
    delay = delay || 200;
    if (!hidInit()) return false;
    if (!points || points.length === 0) return false;
    for (var i = 0; i < points.length; i++) {
        if (!hidClick(points[i].x, points[i].y)) {
            loge("hidBatchClick 第" + (i+1) + "次失败");
            return false;
        }
        if (delay > 0) sleep(delay);
    }
    return true;
}

/**
 * 批量滑动
 * @param {Array<{x1:number,y1:number,x2:number,y2:number,duration:number}>} swipes
 */
function hidBatchSwip(swipes) {
    if (!hidInit()) return false;
    if (!swipes || swipes.length === 0) return false;
    for (var i = 0; i < swipes.length; i++) {
        var s = swipes[i];
        if (!hidSwip(s.x1, s.y1, s.x2, s.y2, s.duration || 300)) {
            loge("hidBatchSwip 第" + (i+1) + "次失败");
            return false;
        }
        sleep(200);
    }
    return true;
}

// ============================================================
// 10. 自动初始化（模块加载时尝试）
// ============================================================
try {
    // 不强制初始化，由主脚本按需调用 hidInit()
    logi("_hid_plugin.js 已加载，请调用 hidInit() 初始化");
} catch(e) {}
