/**
 * EasyClick 脚本模板库
 * 提供各类场景的标准模板，确保代码质量和防封能力
 */

export interface ScriptTemplate {
  name: string;
  category: string;
  description: string;
  platform: string;
  code: string;
  features: string[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    name: "基础自动化模板",
    category: "基础框架",
    description: "最基础的EC脚本框架，含权限检查、弹窗拦截、主循环、异常恢复",
    platform: "android",
    code: `/**
 * 基础自动化脚本模板
 * 包含：权限检查 | 弹窗拦截 | 主循环 | 卡屏检测 | 异常恢复
 */

// ====== 配置区 ======
const CONFIG = {
    targetPackage: "com.example.app",
    targetActivity: "com.example.app.MainActivity",
    loopDelayMin: 500,    // 每轮最小间隔ms
    loopDelayMax: 2000,   // 每轮最大间隔ms
    stuckTimeout: 30000,  // 卡屏检测阈值ms
    maxRounds: 0,         // 最大运行轮数，0=无限
};

// ====== 弹窗关键词 ======
const DIALOG_KEYWORDS = [
    "确定", "允许", "同意", "我知道了",
    "暂不", "取消", "关闭", "跳过",
    "以后再说", "好的"
];

// ====== 状态保存 ======
let state = {
    currentRound: 0,
    startTime: Date.now()
};

// ====== 初始化 ======
function init() {
    log.info("========== 脚本启动 ==========");

    // 1. 检查无障碍权限
    if (!android.requestPermission("accessibility")) {
        log.error("无障碍服务未开启，请先开启");
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        exit();
        return;
    }

    // 2. 设置弹窗拦截
    setDialogInterceptor(DIALOG_KEYWORDS);
    log.info("弹窗拦截器已设置，关键词: {}", DIALOG_KEYWORDS);

    // 3. 恢复状态
    try {
        let saved = file.readFile("__state__.json");
        if (saved) {
            state = JSON.parse(saved);
            log.info("从上次中断恢复，已运行{}轮", state.currentRound);
        }
    } catch (e) {
        log.info("没有发现保存状态，冷启动");
    }

    // 4. 启动目标应用
    let launched = app.launchApp(CONFIG.targetPackage);
    if (!launched) {
        log.error("启动{}失败，请检查应用是否安装", CONFIG.targetPackage);
        exit();
        return;
    }
    log.info("应用启动中，等待加载...");
    sleep(5000);

    log.info("========== 初始化完成 ==========");
}

// ====== 主循环 ======
function mainLoop() {
    while (true) {
        // 检查最大运行轮数
        if (CONFIG.maxRounds > 0 && state.currentRound >= CONFIG.maxRounds) {
            log.info("已达到最大轮数{}，脚本退出", CONFIG.maxRounds);
            break;
        }

        state.currentRound++;
        log.info(">>> 第{}轮开始", state.currentRound);

        try {
            // 卡屏检测
            if (isStuck(CONFIG.stuckTimeout)) {
                log.warn("检测到卡屏（{}秒无变化），尝试恢复", CONFIG.stuckTimeout / 1000);
                recoverFromStuck();
            }

            // ---------- 核心业务逻辑 ----------
            executeCoreLogic();
            // -------------------------------

        } catch (e) {
            log.error("第{}轮执行异常: {}", state.currentRound, e.message);
            // 异常后等待一会再继续
            sleep(5000);
        }

        // 保存状态（每10轮）
        if (state.currentRound % 10 === 0) {
            saveState();
        }

        // 随机间隔
        let delay = random(CONFIG.loopDelayMin, CONFIG.loopDelayMax);
        log.info("<<< 第{}轮完成，等待{}ms", state.currentRound, delay);
        sleep(delay);
    }
}

// ====== 核心业务逻辑（根据需求修改） ======
function executeCoreLogic() {
    // TODO: 在此编写你的自动化逻辑
    // 示例：查找并点击"任务"按钮
    let taskBtn = ui.findOne("text=任务", 3000);
    if (taskBtn) {
        taskBtn.click();
        sleep(2000);

        // 查找"领取"按钮
        let claimBtn = ui.findOne("text=领取", 3000);
        if (claimBtn) {
            claimBtn.click();
            log.info("任务领取成功");
            sleep(1000);
        }
    }
}

// ====== 卡屏恢复 ======
function recoverFromStuck() {
    log.info("执行卡屏恢复流程...");

    // 策略1: 按返回键
    device.pressKey(4);
    sleep(2000);

    // 策略2: 如果还在原页面，杀进程重启
    if (isStuck(5000)) {
        log.warn("策略1无效，重启应用");
        app.killApp(CONFIG.targetPackage);
        sleep(2000);
        app.launchApp(CONFIG.targetPackage);
        sleep(5000);
    }

    // 策略3: 重启脚本自身（最后手段）
    if (isStuck(10000)) {
        log.error("应用无法恢复，保存状态后重启脚本");
        saveState();
        exit();
    }
}

// ====== 状态持久化 ======
function saveState() {
    try {
        file.writeFile("__state__.json", JSON.stringify(state, null, 2));
        log.info("状态已保存（{}轮）", state.currentRound);
    } catch (e) {
        log.warn("状态保存失败: {}", e.message);
    }
}

// ====== 错误上报（可选，对接你的后端） ======
function reportError(errMsg) {
    try {
        let deviceId = android.getDeviceId();
        http.postJSON("https://your-server.com/api/error", {
            deviceId: deviceId,
            error: errMsg,
            round: state.currentRound,
            timestamp: Date.now()
        });
    } catch (e) {
        // 静默失败
    }
}

// ====== 入口 ======
try {
    init();
    mainLoop();
} catch (e) {
    log.error("脚本异常退出: {}", e.message);
    saveState();
} finally {
    log.info("========== 脚本结束 ==========");
    log.info("总运行轮数: {}, 运行时长: {}秒",
        state.currentRound,
        Math.floor((Date.now() - state.startTime) / 1000)
    );
}
`,
    features: [
      "权限自动检查",
      "弹窗自动拦截",
      "卡屏检测与恢复",
      "断点续跑（状态保存）",
      "错误上报",
      "随机延时防检测",
    ],
  },
  {
    name: "游戏挂机模板",
    category: "游戏脚本",
    description: "专为游戏挂机优化，含图像识别兜底、多策略操作、防封上报",
    platform: "android",
    code: `/**
 * 游戏挂机模板
 * 特性：UI+OCR+图像三模识别 | 真人滑动曲线 | 防卡图 | 运行统计
 */

const GAME_CONFIG = {
    packageName: "com.example.game",
    stuckCheckInterval: 20000,  // 卡屏检查间隔
    actionDelayMin: 300,
    actionDelayMax: 800,
    randomSwipeProb: 0.2,       // 20%概率执行随机滑动（防检测）
};

let stats = {
    totalActions: 0,
    imageDetections: 0,
    ocrDetections: 0,
    uiClicks: 0,
    recoveries: 0,
};

// ====== 多模识别——找目标 ======
function findTargetWithFallback(config) {
    // 策略1: UI控件识别（最快最准）
    if (config.uiSelector) {
        let el = ui.findOne(config.uiSelector, 2000);
        if (el) {
            stats.uiClicks++;
            return el;
        }
    }

    // 策略2: OCR文字识别（适用游戏场景）
    if (config.ocrText) {
        let results = ocr.recognize(null, { timeout: 3000 });
        for (let r of results) {
            if (r.text.includes(config.ocrText)) {
                stats.ocrDetections++;
                return { x: r.centerX, y: r.centerY, isPoint: true };
            }
        }
    }

    // 策略3: 图像模板匹配（兜底方案）
    if (config.imageTemplate) {
        let p = image.findImage(config.imageTemplate, { tolerance: 15 });
        if (p) {
            stats.imageDetections++;
            return { x: p.x, y: p.y, isPoint: true };
        }
    }

    return null; // 所有策略都失败
}

// ====== 真人滑动曲线 ======
function humanLikeSwipe(x1, y1, x2, y2) {
    let duration = random(400, 800);
    // 添加贝塞尔曲线控制点，模拟手指不规则移动
    let midX = x1 + (x2 - x1) * random(3, 7) / 10 + random(-30, 30);
    let midY = y1 + (y2 - y1) * random(3, 7) / 10 + random(-20, 20);

    device.randomGesture([
        { x: x1, y: y1 },
        { x: midX, y: midY },
        { x: x2, y: y2 }
    ], duration);

    stats.totalActions++;
}

// ====== 随机微动（防检测） ======
function randomMicroAction() {
    if (Math.random() < GAME_CONFIG.randomSwipeProb) {
        let sx = random(100, 500);
        let sy = random(800, 1200);
        device.swipe(sx, sy, sx + random(-50, 50), sy - random(100, 300), random(200, 500));
        log.info("随机微动（防检测）");
    }
}

// ====== 主循环 ======
while (true) {
    if (isStuck(GAME_CONFIG.stuckCheckInterval)) {
        stats.recoveries++;
        log.warn("游戏卡死，尝试点击任意位置恢复...");
        device.click(random(200, 800), random(400, 1000));
        sleep(3000);
    }

    // 查找并操作目标
    let target = findTargetWithFallback({
        uiSelector: "text=开始战斗",
        ocrText: "开始战斗",
        imageTemplate: "btn_battle.png"
    });

    if (target) {
        if (target.isPoint) {
            device.click(target.x + random(-5, 5), target.y + random(-5, 5));
        } else {
            target.click();
        }
        log.info("操作成功（方式: {})", target.isPoint ? "坐标点击" : "UI点击");
        sleep(random(2000, 4000));
    }

    randomMicroAction();
    sleep(random(GAME_CONFIG.actionDelayMin, GAME_CONFIG.actionDelayMax));
}
`,
    features: [
      "UI+OCR+图像三模识别",
      "真人贝塞尔滑动曲线",
      "随机微动防检测",
      "卡图自动恢复",
      "运行数据统计",
    ],
  },
  {
    name: "授权验证系统模板",
    category: "商业化",
    description: "一机一码网络授权验证，包含离线缓存、心跳保活、到期提醒",
    platform: "common",
    code: `/**
 * 一机一码网络授权系统
 * 功能：设备绑定 | 网络验证 | 离线缓存 | 心跳保活 | 到期提醒
 */

const AUTH_CONFIG = {
    serverUrl: "https://your-server.com/api",
    appKey: "your_app_key",
    heartbeatInterval: 300000, // 心跳间隔5分钟
    offlineCacheDays: 3,       // 允许离线运行天数
    retryMax: 3,               // 网络重试次数
};

let authState = {
    isAuthorized: false,
    deviceId: "",
    cardCode: "",
    expireTime: 0,
    lastHeartbeat: 0,
};

// ====== 获取设备标识 ======
function getDeviceId() {
    let id = android.getDeviceId();
    if (!id || id === "000000000000000") {
        // 备用方案
        id = util.md5(
            android.getBrand() +
            android.getModel() +
            android.getAndroidId()
        );
    }
    return id;
}

// ====== 加载本地授权缓存 ======
function loadLocalAuth() {
    try {
        let data = file.readFile("__auth__.dat");
        if (!data) return null;

        // 解密（简单XOR，生产环境建议使用AES）
        let json = "";
        for (let i = 0; i < data.length; i++) {
            json += String.fromCharCode(data.charCodeAt(i) ^ 0x5A);
        }

        let cached = JSON.parse(json);
        // 检查缓存有效期
        if (Date.now() - cached.savedAt > AUTH_CONFIG.offlineCacheDays * 86400000) {
            log.warn("离线缓存已过期，需要重新联网验证");
            return null;
        }
        return cached;
    } catch (e) {
        return null;
    }
}

// ====== 保存本地授权缓存 ======
function saveLocalAuth(data) {
    let json = JSON.stringify({
        ...data,
        savedAt: Date.now()
    });
    // 简单XOR加密
    let encrypted = "";
    for (let i = 0; i < json.length; i++) {
        encrypted += String.fromCharCode(json.charCodeAt(i) ^ 0x5A);
    }
    file.writeFile("__auth__.dat", encrypted);
}

// ====== 网络验证（激活/登录） ======
function onlineActivate(cardCode, deviceId) {
    for (let i = 0; i < AUTH_CONFIG.retryMax; i++) {
        try {
            let res = http.postJSON(AUTH_CONFIG.serverUrl + "/activate", {
                appKey: AUTH_CONFIG.appKey,
                cardCode: cardCode,
                deviceId: deviceId,
                brand: android.getBrand(),
                model: android.getModel(),
            }, {}, 15000);

            if (res.code === 200) {
                let data = JSON.parse(res.body);
                if (data.success) {
                    log.info("网络验证成功！到期时间: {}", new Date(data.expireTime));
                    return data;
                } else {
                    log.error("激活失败: {}", data.message);
                    return null;
                }
            }
        } catch (e) {
            log.warn("网络请求失败({}/{}): {}", i + 1, AUTH_CONFIG.retryMax, e.message);
            if (i < AUTH_CONFIG.retryMax - 1) sleep(3000);
        }
    }
    return null;
}

// ====== 心跳保活 ======
function heartbeat() {
    if (Date.now() - authState.lastHeartbeat < AUTH_CONFIG.heartbeatInterval) {
        return; // 未到心跳时间
    }

    try {
        let res = http.postJSON(AUTH_CONFIG.serverUrl + "/heartbeat", {
            deviceId: authState.deviceId,
            cardCode: authState.cardCode,
            timestamp: Date.now(),
        }, {}, 10000);

        authState.lastHeartbeat = Date.now();
        log.info("心跳上报成功");

        // 服务器可能下发指令或更新到期时间
        if (res.code === 200) {
            let data = JSON.parse(res.body);
            if (data.expireTime) {
                authState.expireTime = data.expireTime;
                saveLocalAuth(authState);
            }
        }
    } catch (e) {
        log.warn("心跳上报失败: {}", e.message);
    }
}

// ====== 检查授权状态 ======
function checkAuth() {
    if (authState.expireTime > 0 && Date.now() > authState.expireTime) {
        log.error("授权已到期！到期时间: {}", new Date(authState.expireTime));
        return false;
    }
    return authState.isAuthorized;
}

// ====== 完整授权流程 ======
function doAuth(cardCode) {
    let deviceId = getDeviceId();
    authState.deviceId = deviceId;
    authState.cardCode = cardCode;

    log.info("设备ID: {}", deviceId);
    log.info("卡密: {}", cardCode);

    // 1. 尝试离线缓存
    let cached = loadLocalAuth();
    if (cached && cached.cardCode === cardCode) {
        log.info("使用离线缓存授权");
        authState = { ...authState, ...cached, isAuthorized: true };
        return true;
    }

    // 2. 网络验证
    log.info("正在进行网络验证...");
    let result = onlineActivate(cardCode, deviceId);

    if (result) {
        authState.isAuthorized = true;
        authState.expireTime = result.expireTime;
        authState.lastHeartbeat = Date.now();
        saveLocalAuth(authState);
        return true;
    }

    // 3. 网络失败，尝试旧缓存兜底
    let oldCache = loadLocalAuth();
    if (oldCache && oldCache.cardCode === cardCode) {
        log.warn("网络验证失败，使用旧缓存（{}天内有效）", AUTH_CONFIG.offlineCacheDays);
        authState = { ...authState, ...oldCache, isAuthorized: true };
        return true;
    }

    log.error("授权失败：网络不可达且无有效本地缓存");
    return false;
}

// ====== 使用示例 ======
// 1. 从输入框获取卡密（或hardcode测试）
let cardCode = "TEST-CODE-123456";

if (doAuth(cardCode)) {
    log.info("授权验证通过，开始运行...");

    // 在定时器中执行心跳
    setInterval(() => {
        if (checkAuth()) {
            heartbeat();
        } else {
            log.error("授权失效，停止脚本");
            exit();
        }
    }, AUTH_CONFIG.heartbeatInterval);

    // 你的核心逻辑
    // mainLoop();

} else {
    log.error("授权失败，脚本退出");
    log.error("请检查网络连接或联系客服获取有效卡密");
    exit();
}
`,
    features: [
      "一机一码设备绑定",
      "网络验证+离线缓存双重保障",
      "心跳保活+服务器远程管控",
      "到期自动检测与提醒",
      "卡密激活流程",
    ],
  },
  {
    name: "云端群控通信模板",
    category: "商业化",
    description: "MQTT/WebSocket云端群控，支持远程指令下发、状态上报、批量管理",
    platform: "android",
    code: `/**
 * 云端群控通信模板
 * 通过WebSocket与云控后台实时通信，支持指令下发与状态上报
 */

const CLOUD_CONFIG = {
    wsUrl: "ws://your-server.com/ws",
    deviceId: "",
    reconnectInterval: 5000,
    reconnectMax: 100,
    heartbeatInterval: 30000,
};

let ws = null;
let reconnectCount = 0;
let isRunning = true;

// ====== 设备信息收集 ======
function getDeviceInfo() {
    return {
        deviceId: CLOUD_CONFIG.deviceId,
        brand: android.getBrand(),
        model: android.getModel(),
        androidVersion: android.getAndroidVersion(),
        ecVersion: app.getECVersion(),
        battery: android.getBattery(),
        screenWidth: device.getScreenWidth(),
        screenHeight: device.getScreenHeight(),
        networkType: android.getNetworkType(),
        freeMemory: android.getFreeMemory(),
        ip: android.getLocalIpAddress(),
    };
}

// ====== WebSocket连接 ======
function connectCloud() {
    log.info("正在连接云控服务器: {}", CLOUD_CONFIG.wsUrl);

    ws = new WebSocket(CLOUD_CONFIG.wsUrl);

    ws.onopen = function () {
        reconnectCount = 0;
        log.info("云控服务器连接成功");

        // 注册设备
        let registerMsg = {
            type: "register",
            deviceId: CLOUD_CONFIG.deviceId,
            info: getDeviceInfo(),
        };
        ws.send(JSON.stringify(registerMsg));
    };

    ws.onmessage = function (event) {
        try {
            let msg = JSON.parse(event.data);
            log.info("收到云控指令: {}", msg.type);

            switch (msg.type) {
                case "start_script":
                    // 启动指定脚本
                    log.info("收到远程启动指令: {}", msg.scriptName);
                    executeRemoteCommand(msg);
                    break;

                case "stop_script":
                    log.info("收到远程停止指令");
                    isRunning = false;
                    break;

                case "update_config":
                    // 更新配置
                    log.info("收到配置更新: {}", JSON.stringify(msg.config));
                    updateLocalConfig(msg.config);
                    break;

                case "screenshot":
                    // 远程截屏
                    let img = device.screenshot();
                    let base64 = util.base64Encode(img);
                    sendToCloud({
                        type: "screenshot_response",
                        requestId: msg.requestId,
                        image: base64,
                    });
                    break;

                case "ping":
                    sendToCloud({ type: "pong", timestamp: Date.now() });
                    break;

                default:
                    log.warn("未知指令类型: {}", msg.type);
            }
        } catch (e) {
            log.error("消息处理异常: {}", e.message);
        }
    };

    ws.onclose = function () {
        log.warn("云控连接断开，{}秒后重连({}/{})",
            CLOUD_CONFIG.reconnectInterval / 1000,
            reconnectCount,
            CLOUD_CONFIG.reconnectMax
        );

        if (reconnectCount < CLOUD_CONFIG.reconnectMax && isRunning) {
            sleep(CLOUD_CONFIG.reconnectInterval);
            reconnectCount++;
            connectCloud();
        }
    };

    ws.onerror = function (e) {
        log.error("WebSocket错误: {}", e.message);
    };
}

// ====== 发送消息到云端 ======
function sendToCloud(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        msg.deviceId = CLOUD_CONFIG.deviceId;
        msg.timestamp = Date.now();
        ws.send(JSON.stringify(msg));
    } else {
        log.warn("WebSocket未连接，消息未发送");
    }
}

// ====== 上报状态 ======
function reportStatus(scriptStatus) {
    sendToCloud({
        type: "status_report",
        deviceInfo: getDeviceInfo(),
        scriptStatus: scriptStatus, // { name, round, state, lastAction }
    });
}

// ====== 执行远程指令 ======
function executeRemoteCommand(msg) {
    // 根据远程指令执行不同的脚本逻辑
    // 可以动态eval或预定义的函数映射
    let commandMap = {
        restart_app: () => {
            app.killApp(GAME_CONFIG.packageName);
            sleep(2000);
            app.launchApp(GAME_CONFIG.packageName);
        },
        clear_cache: () => {
            android.clearAppCache(GAME_CONFIG.packageName);
        },
        reboot_device: () => {
            android.reboot();
        },
    };

    let fn = commandMap[msg.scriptName];
    if (fn) {
        fn();
        sendToCloud({
            type: "command_result",
            command: msg.scriptName,
            success: true,
        });
    }
}

// ====== 初始化 ======
CLOUD_CONFIG.deviceId = android.getDeviceId();
log.info("设备ID: {}", CLOUD_CONFIG.deviceId);
connectCloud();

// ====== 心跳定时器 ======
setInterval(() => {
    sendToCloud({ type: "heartbeat" });
}, CLOUD_CONFIG.heartbeatInterval);

// ====== 主循环 ======
let round = 0;
while (isRunning) {
    round++;
    // 执行自动化逻辑...

    // 定期上报状态
    if (round % 10 === 0) {
        reportStatus({
            name: "主任务",
            round: round,
            state: "running",
            lastAction: new Date().toLocaleString(),
        });
    }

    sleep(1000);
}

log.info("脚本已停止");
`,
    features: [
      "WebSocket实时通信",
      "远程指令下发与执行",
      "设备状态定时上报",
      "自动重连机制",
      "远程截图回传",
      "配置热更新",
    ],
  },
];

/**
 * 按分类获取模板
 */
export function getTemplates(category?: string): ScriptTemplate[] {
  if (!category || category === "all") {
    return [...SCRIPT_TEMPLATES];
  }
  return SCRIPT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * 获取模板分类列表
 */
export function getTemplateCategories(): string[] {
  const cats = new Set(SCRIPT_TEMPLATES.map((t) => t.category));
  return Array.from(cats).sort();
}
