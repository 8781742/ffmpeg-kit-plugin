/**
 * EasyClick 常见错误归档与解决方案库
 * 持续沉淀排错经验，提升AI输出代码质量
 */
export const ERROR_DATABASE = [
    {
        pattern: "AccessibilityService.*not.*enabled|无障碍服务.*未开启",
        title: "无障碍服务未开启",
        platform: "android",
        cause: "EC需要无障碍权限才能获取UI控件树，未开启导致所有ui.*方法失效",
        solution: "跳转无障碍设置页，引导用户手动开启",
        codeFix: `
// 脚本开头加入权限检查
if (!android.requestPermission("accessibility")) {
    log.error("请先开启无障碍服务");
    app.startActivity({
        action: "android.settings.ACCESSIBILITY_SETTINGS"
    });
    exit();
}`,
        severity: "fatal",
    },
    {
        pattern: "Floating.*window.*permission|悬浮窗权限",
        title: "悬浮窗权限未授予",
        platform: "android",
        cause: "创建悬浮窗需要SYSTEM_ALERT_WINDOW权限，各厂商默认关闭",
        solution: "引导用户到悬浮窗权限设置页",
        codeFix: `
if (!floaty.hasPermission()) {
    floaty.requestPermission();
    sleep(2000);
    if (!floaty.hasPermission()) {
        log.error("悬浮窗权限未授予，请手动设置");
        app.startActivity({
            action: "android.settings.action.MANAGE_OVERLAY_PERMISSION"
        });
        exit();
    }
}`,
        severity: "fatal",
    },
    {
        pattern: "NullPointerException|Cannot read property|is null|undefined",
        title: "控件查找返回空值",
        platform: "common",
        cause: "findOne超时返回null，后续调用null.click()导致崩溃",
        solution: "每次findOne后必须判空再操作",
        codeFix: `
// ❌ 错误写法
let btn = ui.findOne("text=确认");
btn.click(); // 如果没找到直接闪退

// ✅ 正确写法
let btn = ui.findOne("text=确认", 3000);
if (btn) {
    btn.click();
    log.info("已点击确认按钮");
} else {
    log.warn("未找到确认按钮，使用备用方案");
    device.click(500, 600);
}`,
        severity: "error",
    },
    {
        pattern: "timeout|超时",
        title: "操作超时",
        platform: "common",
        cause: "等待控件出现时间不足，或页面加载慢",
        solution: "增加超时时间、添加页面加载判断、增加重试机制",
        codeFix: `
// 增加重试机制
function clickWithRetry(selector, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        let el = ui.findOne(selector, 5000);
        if (el) {
            el.click();
            return true;
        }
        log.warn("第{}次查找{}失败，重试中...", i + 1, selector);
        sleep(2000);
    }
    return false;
}`,
        severity: "error",
    },
    {
        pattern: "image.*not.*found|findImage.*failed|图色.*失败",
        title: "模板匹配失败",
        platform: "common",
        cause: "截图与模板不一致（分辨率、色差、缩放），或模板图片路径错误",
        solution: "检查模板路径、适当调大tolerance容差、使用scale参数",
        codeFix: `
// ❌ 直接匹配，容差太小
let p = image.findImage("btn.png");

// ✅ 调整容差、添加多模板兜底
let templates = ["btn_1080p.png", "btn_720p.png", "btn_default.png"];
let found = null;
for (let t of templates) {
    found = image.findImage(t, {
        tolerance: 20,    // 放宽容差
        scale: 1.0,
        region: null      // 全屏
    });
    if (found) break;
    log.warn("模板{}未匹配，尝试下一个", t);
}`,
        severity: "warn",
    },
    {
        pattern: "App.*not.*installed|应用未安装",
        title: "目标应用未安装",
        platform: "common",
        cause: "目标App未安装或包名不正确",
        solution: "启动前检测App是否存在，提示用户安装",
        codeFix: `
function ensureAppInstalled(packageName, appName) {
    if (!app.isInstalled(packageName)) {
        log.error("{}未安装，请先安装", appName);
        // 可选：跳转应用商店
        app.startActivity({
            action: "android.intent.action.VIEW",
            data: "market://details?id=" + packageName
        });
        exit();
    }
}`,
        severity: "error",
    },
    {
        pattern: "network.*error|connect.*refused|SocketTimeout",
        title: "网络请求失败",
        platform: "common",
        cause: "无网络连接、服务器无响应、URL错误、DNS解析失败",
        solution: "添加网络检测、请求重试、超时处理",
        codeFix: `
function httpGetWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            let res = http.get(url, {}, 10000);
            if (res.code === 200) return res;
            log.warn("HTTP {}错误，状态码: {}", url, res.code);
        } catch (e) {
            log.error("第{}次请求异常: {}", i + 1, e.message);
        }
        sleep(3000);
    }
    return null;
}`,
        severity: "error",
    },
    {
        pattern: "out.*of.*memory|OOM|内存不足",
        title: "内存溢出",
        platform: "common",
        cause: "长时间运行未释放截图/图片资源，或循环中不断创建对象",
        solution: "定期调用gc()、释放不用的截图、避免循环创建大对象",
        codeFix: `
// ❌ 循环中不断截图不释放
while (true) {
    let img = device.screenshot();
    let p = image.findImage("target.png");
    // img未释放，内存持续增长
}

// ✅ 使用keepScreen复用截图
image.keepScreen(true);
while (true) {
    let p = image.findImage("target.png");
    // 使用同一张截图
    sleep(1000);
}
image.keepScreen(false); // 用完释放

// 每100轮主动GC一次
if (round % 100 === 0) {
    image.recycle();
    gc();
}`,
        severity: "fatal",
    },
    {
        pattern: "kill.*by.*system|process.*died|已被系统杀死",
        title: "进程被系统杀死",
        platform: "android",
        cause: "后台运行时间过长，系统电池优化或内存回收策略杀死进程",
        solution: "加入电池优化白名单、定期前台保活、关键点保存状态",
        codeFix: `
// 启动时请求忽略电池优化
if (android.isIgnoringBatteryOptimizations()) {
    log.info("已忽略电池优化");
} else {
    android.requestIgnoreBatteryOptimizations();
}

// 定期保存状态，被杀后恢复
let state = loadState();
log.info("从{}轮恢复运行", state.lastRound);

function saveState(round) {
    file.writeFile("__state__.json", JSON.stringify({
        lastRound: round,
        timestamp: Date.now()
    }));
}`,
        severity: "fatal",
    },
    {
        pattern: "selector.*syntax|选择器.*错误",
        title: "UI选择器语法错误",
        platform: "common",
        cause: "CSS选择器或EC选择器语法写错",
        solution: "检查选择器格式，使用EC规范的写法",
        codeFix: `
// EC 选择器常用格式：
// 文本匹配: "text=确定"  "text*确定"（包含）
// ID匹配: "id=com.xxx:id/btn"
// 类匹配: "class=android.widget.Button"
// 描述匹配: "desc=搜索"
// 组合: "text=确定&&class=android.widget.Button"
// 层级: "text=标题 > text=子项"

// ❌ CSS写法（EC不支持）
"#btn_confirm"
".my-button"

// ✅ EC选择器写法
"id=com.app:id/btn_confirm"
"text=确认提交"`,
        severity: "error",
    },
    {
        pattern: "version.*not.*compatible|版本.*不兼容",
        title: "EC版本与脚本不兼容",
        platform: "common",
        cause: "脚本使用了新版本API，但设备上EC引擎版本过旧",
        solution: "在脚本开头检查EC版本，给出提示",
        codeFix: `
let requiredVersion = "8.0.0";
let currentVersion = app.getECVersion();
if (compareVersion(currentVersion, requiredVersion) < 0) {
    log.error("需要EC版本>={}，当前版本{}", requiredVersion, currentVersion);
    log.error("请更新EasyClick引擎后再运行");
    exit();
}`,
        severity: "error",
    },
    {
        pattern: "encrypt|pack|打包.*失败",
        title: "脚本加密打包失败",
        platform: "common",
        cause: "混淆配置错误、文件路径问题、依赖缺失",
        solution: "检查obfuscator.json配置、确认所有依赖已放入libs目录",
        codeFix: `
// obfuscator.json 最小配置示例
{
    "encryptLevel": 3,        // 加密级别 1-5
    "removeLogs": true,        // 移除console.log
    "obfuscateVarNames": true, // 混淆变量名
    "exclude": ["config.js"],  // 排除文件
    "libs": ["./libs/"]        // 依赖目录
}`,
        severity: "error",
    },
];
/**
 * 根据错误日志匹配解决方案
 */
export function matchError(logText, platform) {
    const matches = [];
    for (const entry of ERROR_DATABASE) {
        try {
            const regex = new RegExp(entry.pattern, "i");
            if (regex.test(logText)) {
                if (platform && entry.platform !== "common" && entry.platform !== platform) {
                    continue;
                }
                matches.push(entry);
            }
        }
        catch {
            // 跳过无效正则
        }
    }
    return matches;
}
/**
 * 获取所有已知错误模式
 */
export function getAllErrors() {
    return [...ERROR_DATABASE];
}
//# sourceMappingURL=error-db.js.map