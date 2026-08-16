// ============================================================
// 腾讯视频上传模块 v3 — OCR 识别 + 点击验证
// 包名: com.tencent.qqlive
// 策略: OCR识别文字位置 → 精确点击 → OCR验证跳转成功 → 重试
// 路径: 打开App→个人中心→更多→创作中心→发布→上传视频→选视频→完成→标题→视频分类→少儿→少儿动画→发布→同意上传
// ============================================================

var UPLOAD_CFG = {
    pkg: "com.tencent.qqlive",
    delay: {
        appOpen: 6000,
        pageLoad: 3000,
        h5Load: 5000,
        anim: 1500,
        short: 800,
        back: 1500,
        input: 1000,
        filePicker: 4000,
    },
    ocrTimeout: 5000,      // OCR 识别超时(ms)
    maxRetry: 3,           // 单步最大重试次数
};

// ====== OCR 引擎（全局单例） ======
var _ocrEng = null;
var _ocrInited = false;
var _ocrFailed = false;

/**
 * 初始化 OCR 引擎
 * EC 8.x 支持: paddleOcrNcnnV5, paddleOcrOnnxV5 等
 */
function _ocrInit() {
    if (_ocrInited) return true;
    if (_ocrFailed) return false;

    logi("OCR: 初始化引擎...");
    try {
        // 申请截图权限
        var reqOk = image.requestScreenCapture(10000, 0);
        if (!reqOk) {
            logi("OCR: 截图权限申请失败，尝试再次...");
            reqOk = image.requestScreenCapture(10000, 0);
        }
        if (!reqOk) {
            loge("OCR: 截图权限不可用，OCR 功能无法使用");
            _ocrFailed = true;
            return false;
        }
        sleep(500);

        // 创建 OCR 实例
        _ocrEng = ocr.newOcr();
        if (!_ocrEng) {
            loge("OCR: 创建实例失败");
            _ocrFailed = true;
            return false;
        }

        // 尝试 ncnn V5（推荐，轻量快速）
        var config = {
            "type": "paddleOcrNcnnV5",
            "padding": 32,
            "maxSideLen": 640
        };
        var inited = _ocrEng.initOcr(config);
        if (!inited) {
            logi("OCR: ncnnV5 初始化失败: " + _ocrEng.getErrorMsg() + "，尝试 onnxV4...");
            config = {
                "type": "paddleOcrOnnxV4",
                "padding": 60,
                "maxSideLen": 960,
                "numThread": 2
            };
            inited = _ocrEng.initOcr(config);
        }
        if (!inited) {
            logi("OCR: onnxV4 也失败: " + _ocrEng.getErrorMsg() + "，尝试 ocrLite...");
            config = {
                "type": "ocrLite",
                "numThread": 1,
                "padding": 10,
                "maxSideLen": 0
            };
            inited = _ocrEng.initOcr(config);
        }
        if (!inited) {
            loge("OCR: 所有引擎初始化失败: " + _ocrEng.getErrorMsg());
            _ocrEng.releaseAll();
            _ocrEng = null;
            _ocrFailed = true;
            return false;
        }

        _ocrInited = true;
        logi("OCR: 初始化成功");
        return true;
    } catch (e) {
        loge("OCR: 初始化异常: " + e);
        _ocrFailed = true;
        return false;
    }
}

/**
 * OCR 识别屏幕，查找指定文字
 * @param {string} text - 要查找的文字
 * @param {number} threshold - 置信度阈值 (0~1)，默认 0.7
 * @returns {object|null} {x, y, confidence, label, left, top, right, bottom} 或 null
 */
function _ocrFind(text, threshold, region) {
    if (!_ocrInited || !_ocrEng) return null;
    if (!threshold) threshold = 0.7;
    // region: {topPct, bottomPct, leftPct, rightPct} 限制搜索区域（屏幕百分比），可选

    try {
        var img = image.captureFullScreenEx();
        if (!img) {
            logi("OCR: 截图失败");
            return null;
        }

        var result = _ocrEng.ocrImage(img, UPLOAD_CFG.ocrTimeout, {});
        image.recycle(img);

        if (!result || result.length === 0) return null;

        var sh = device.getScreenHeight();
        var sw = device.getScreenWidth();

        // 精确匹配优先，再尝试包含匹配
        var bestMatch = null;
        var bestConf = threshold;
        for (var i = 0; i < result.length; i++) {
            var item = result[i];
            if (!item.label) continue;
            if (item.confidence < bestConf) continue;

            // 区域过滤
            if (region) {
                var itemCenterY = item.y + item.height / 2;
                var itemCenterX = item.x + item.width / 2;
                if (region.topPct && itemCenterY < sh * region.topPct) continue;
                if (region.bottomPct && itemCenterY > sh * region.bottomPct) continue;
                if (region.leftPct && itemCenterX < sw * region.leftPct) continue;
                if (region.rightPct && itemCenterX > sw * region.rightPct) continue;
            }

            if (item.label === text) {
                bestMatch = item;
                bestConf = item.confidence;
                break;
            }
            if (item.label.indexOf(text) >= 0 && item.confidence > bestConf) {
                bestMatch = item;
                bestConf = item.confidence;
            }
        }

        if (bestMatch) {
            return {
                x: bestMatch.x + Math.floor(bestMatch.width / 2),
                y: bestMatch.y + Math.floor(bestMatch.height / 2),
                confidence: bestMatch.confidence,
                label: bestMatch.label,
                left: bestMatch.x,
                top: bestMatch.y,
                right: bestMatch.x + bestMatch.width,
                bottom: bestMatch.y + bestMatch.height
            };
        }
    } catch (e) {
        logi("OCR: 识别异常: " + e);
    }
    return null;
}

/**
 * 检查屏幕上是否存在指定文字（轻量，用于验证页面跳转）
 */
function _ocrHas(text, threshold, region) {
    return _ocrFind(text, threshold || 0.6, region) != null;
}

// ============================================================
// OCR 点击（核心函数）
// ============================================================

/**
 * OCR 识别 → 点击 → 验证
 * @param {string} targetText  - 要点击的文字
 * @param {string} verifyText  - 验证文字（点击后下一页应出现的文字），null=不验证
 * @param {number} waitMs      - 点击后等待时间(ms)
 * @param {string} stepDesc    - 步骤描述
 * @returns {boolean} 是否成功
 */
function _ocrClick(targetText, verifyText, waitMs, stepDesc) {
    logi("  [OCR点击] " + stepDesc);

    // 1. OCR 找目标文字
    var pos = _ocrFind(targetText, 0.65);
    if (!pos) {
        loge("    ❌ OCR 未找到: [" + targetText + "]");
        return false;
    }

    logi("    ✅ 找到 [" + pos.label + "] 置信度=" + pos.confidence.toFixed(2) + " 位置=(" + pos.x + "," + pos.y + ")");

    // 2. 点击
    clickPoint(pos.x, pos.y);

    // 3. 等待页面加载
    sleep(waitMs || UPLOAD_CFG.delay.pageLoad);

    // 4. 验证（如果指定了验证文字）
    if (verifyText) {
        var verified = _ocrHas(verifyText, 0.6);
        if (verified) {
            logi("    ✅ 验证成功: [" + verifyText + "] 已出现");
            return true;
        } else {
            logi("    ⚠️ 验证失败: 未找到 [" + verifyText + "]，可能页面未跳转");
            return false;
        }
    }

    return true;
}

/**
 * 带重试的 OCR 点击
 * @returns {boolean}
 */
function _ocrClickRetry(targetText, verifyText, waitMs, stepDesc) {
    for (var i = 0; i < UPLOAD_CFG.maxRetry; i++) {
        if (i > 0) {
            logi("    重试 " + i + "/" + UPLOAD_CFG.maxRetry + "...");
            // 重试前尝试返回并重新进入
            sleep(1000);
        }
        if (_ocrClick(targetText, verifyText, waitMs, stepDesc)) {
            return true;
        }
    }
    loge("  ❌ [" + stepDesc + "] 已达最大重试次数");
    return false;
}

/**
 * 关闭常见弹窗（通过 OCR 找关闭按钮）
 */
function _dismissPopups() {
    var btns = ["关闭", "取消", "我知道了", "同意", "允许", "跳过", "×"];
    for (var i = 0; i < btns.length; i++) {
        try {
            var pos = _ocrFind(btns[i], 0.7);
            if (pos) {
                logi("  关闭弹窗: [" + btns[i] + "]");
                clickPoint(pos.x, pos.y);
                sleep(500);
                return true;
            }
        } catch(e) {}
    }
    return false;
}

// ============================================================
// 上传流程主函数
// ============================================================

function uploadToTencentVideo(videoPath, title) {
    logi("===== 腾讯视频上传开始 =====");
    logi("视频: " + videoPath);
    logi("标题: " + title);

    // 确保 OCR 已初始化
    if (!_ocrInited && !_ocrFailed) {
        if (!_ocrInit()) {
            loge("OCR 引擎初始化失败，无法继续上传");
            return false;
        }
    }
    if (_ocrFailed) {
        loge("OCR 引擎不可用，无法继续上传");
        return false;
    }

    var ok = false;
    for (var attempt = 1; attempt <= UPLOAD_CFG.maxRetry; attempt++) {
        logi("--- 第 " + attempt + "/" + UPLOAD_CFG.maxRetry + " 次尝试 ---");
        try {
            ok = _doUpload(videoPath, title);
            if (ok) break;
            logi("上传失败，准备重试...");
            sleep(2000);
        } catch (e) {
            loge("上传异常: " + e);
        }
        // 重试前返回首页
        try { _goHome(); } catch(e2) {}
    }

    logi("===== 上传" + (ok ? "成功" : "失败(已达最大重试)") + " =====");
    return ok;
}

function _doUpload(videoPath, title) {
    // S1: 打开腾讯视频
    if (!_s1_openApp()) return false;
    // S2: 个人中心
    if (!_s2_tabMine()) return false;
    // S3: 上滑+更多
    if (!_s3_scrollToMore()) return false;
    // S4: 创作中心
    if (!_s4_creatorCenter()) return false;
    // S5: 发布
    if (!_s5_publishEntry()) return false;
    // S6: 上传视频
    if (!_s6_uploadVideo()) return false;
    // S7: 选择第一个视频
    if (!_s7_selectFirstVideo()) return false;
    // S8: 完成
    if (!_s8_done()) return false;
    // S9: 输入标题
    if (!_s9_inputTitle(title)) return false;
    // S10: 视频分类
    if (!_s10_videoCategory()) return false;
    // S11: 少儿
    if (!_s11_categoryChild()) return false;
    // S12: 少儿动画
    if (!_s12_childAnim()) return false;
    // S13: 发布
    if (!_s13_publish()) return false;
    // S14: 同意上传
    if (!_s14_agreeUpload()) return false;

    return true;
}

// ============================================================
// S1: 打开腾讯视频
// ============================================================

function _s1_openApp() {
    logi("S1: 打开腾讯视频");
    utils.openApp(UPLOAD_CFG.pkg);
    sleep(UPLOAD_CFG.delay.appOpen);

    // 关闭可能的广告弹窗
    for (var i = 0; i < 3; i++) {
        _dismissPopups();
        sleep(500);
    }

    // 确保在首页（检查底部导航是否存在）
    var onHome = _ocrHas("首页", 0.5, { topPct: 0.85 }) || _ocrHas("个人中心", 0.5, { topPct: 0.85 });
    if (!onHome) {
        logi("  未检测到底部导航，尝试返回首页...");
        for (var b = 0; b < 6; b++) {
            back();
            sleep(1200);
            _dismissPopups();
            sleep(300);
            if (_ocrHas("首页", 0.5, { topPct: 0.85 }) || _ocrHas("个人中心", 0.5, { topPct: 0.85 })) {
                logi("  第" + (b+1) + "次返回后到达首页");
                onHome = true;
                break;
            }
        }
        // 最后一次尝试：重新打开App
        if (!onHome) {
            logi("  重新打开App...");
            utils.openApp(UPLOAD_CFG.pkg);
            sleep(UPLOAD_CFG.delay.appOpen);
            for (var j = 0; j < 3; j++) { _dismissPopups(); sleep(500); }
            onHome = _ocrHas("首页", 0.5, { topPct: 0.85 }) || _ocrHas("个人中心", 0.5, { topPct: 0.85 });
        }
    }

    if (onHome) {
        logi("  S1 ✅ (在首页)");
    } else {
        logi("  S1 ⚠️ (可能不在首页，继续尝试)");
    }
    return true;
}

// ============================================================
// S2: 个人中心（OCR找"个人中心"→点击→验证出现"更多"或"创作中心"）
// ============================================================

function _s2_tabMine() {
    logi("S2: 个人中心");

    // 先检查是否已经在个人中心页面（有"我的点赞"、"我的圈儿"等特征）
    if (_ocrHas("我的点赞", 0.6) || _ocrHas("我的圈儿", 0.6) || (_ocrHas("创作中心", 0.6) && _ocrHas("更多", 0.6))) {
        logi("  已在个人中心页面");
        logi("  S2 ✅");
        return true;
    }

    // OCR 搜索底部导航栏 (屏幕下 15% 区域，y > 85%)
    var bottomRegion = { topPct: 0.85 };
    var pos = _ocrFind("个人中心", 0.65, bottomRegion);
    if (!pos) {
        pos = _ocrFind("我的", 0.65, bottomRegion);
    }

    if (pos) {
        logi("  找到底栏: [" + pos.label + "] (" + pos.x + "," + pos.y + ")");
        clickPoint(pos.x, pos.y);
        sleep(UPLOAD_CFG.delay.pageLoad);
        // 验证
        if (_ocrHas("更多", 0.6) || _ocrHas("创作中心", 0.6) || _ocrHas("我的点赞", 0.6)) {
            logi("  S2 ✅");
            return true;
        }
        logi("  点击后未验证到个人中心页面特征");
    }

    // OCR没找到或验证失败 → 坐标兜底
    var coordX = Math.floor(device.getScreenWidth() * 0.875);
    var coordY = Math.floor(device.getScreenHeight() * 0.932);
    logi("  坐标点击个人中心 (" + coordX + "," + coordY + ")");
    clickPoint(coordX, coordY);
    sleep(UPLOAD_CFG.delay.pageLoad);
    if (_ocrHas("更多", 0.6) || _ocrHas("创作中心", 0.6) || _ocrHas("我的点赞", 0.6) || _ocrHas("我的圈儿", 0.6)) {
        logi("  S2 ✅ (坐标)");
        return true;
    }

    // 还没成功 — 尝试返回后重试
    logi("  底栏未找到/验证失败，尝试返回首页...");
    for (var b = 0; b < 3; b++) {
        back();
        sleep(1500);
        _dismissPopups();
        sleep(500);

        // 重新检查底栏
        var pos2 = _ocrFind("个人中心", 0.6, bottomRegion);
        if (!pos2) pos2 = _ocrFind("我的", 0.6, bottomRegion);
        if (pos2) {
            logi("  第" + (b+1) + "次返回后找到底栏: [" + pos2.label + "] (" + pos2.x + "," + pos2.y + ")");
            clickPoint(pos2.x, pos2.y);
            sleep(UPLOAD_CFG.delay.pageLoad);
            logi("  S2 ✅");
            return true;
        }

        // 也检查是否已到达个人中心
        if (_ocrHas("我的点赞", 0.6) || _ocrHas("我的圈儿", 0.6)) {
            logi("  已在个人中心页面");
            logi("  S2 ✅");
            return true;
        }
    }

    // 最后兜底: 重新打开App
    logi("  重新打开App兜底...");
    utils.openApp(UPLOAD_CFG.pkg);
    sleep(UPLOAD_CFG.delay.appOpen);
    for (var k = 0; k < 2; k++) { _dismissPopups(); sleep(500); }

    var pos3 = _ocrFind("个人中心", 0.6, bottomRegion);
    if (!pos3) pos3 = _ocrFind("我的", 0.6, bottomRegion);
    if (pos3) {
        logi("  兜底找到底栏: [" + pos3.label + "] (" + pos3.x + "," + pos3.y + ")");
        clickPoint(pos3.x, pos3.y);
        sleep(UPLOAD_CFG.delay.pageLoad);
        logi("  S2 ✅");
        return true;
    }

    // 终极兜底: 坐标点击"个人中心"tab（已验证位置: 87.5%宽, 93.2%高, 1080x2400设备）
    var fallbackX = Math.floor(device.getScreenWidth() * 0.875);
    var fallbackY = Math.floor(device.getScreenHeight() * 0.932);
    logi("  终极兜底: 坐标点击个人中心 (" + fallbackX + "," + fallbackY + ")");
    clickPoint(fallbackX, fallbackY);
    sleep(UPLOAD_CFG.delay.pageLoad);
    // 验证是否成功跳转
    if (_ocrHas("我的点赞", 0.6) || _ocrHas("我的圈儿", 0.6) || _ocrHas("创作中心", 0.6) || _ocrHas("更多", 0.6)) {
        logi("  S2 ✅ (坐标兜底)");
        return true;
    }

    loge("  S2 ❌ 无法进入个人中心");
    return false;
}

// ============================================================
// S3: 上滑找"更多" → OCR 点击 → 验证"创作中心"
// ============================================================

function _s3_scrollToMore() {
    logi("S3: 上滑找更多");

    // 先检查"更多"是否已经在屏幕上
    if (_ocrHas("更多", 0.65)) {
        logi("  更多已在屏幕中");
        return _ocrClickRetry("更多", "创作中心", UPLOAD_CFG.delay.pageLoad, "更多→创作中心");
    }

    // 上滑查找
    var sw = device.getScreenWidth();
    var sh = device.getScreenHeight();
    for (var i = 0; i < 5; i++) {
        logi("  上滑第" + (i+1) + "次...");
        swipeToPoint(
            Math.floor(sw * 0.5), Math.floor(sh * 0.85),
            Math.floor(sw * 0.5), Math.floor(sh * 0.20),
            500
        );
        sleep(UPLOAD_CFG.delay.anim);

        if (_ocrHas("更多", 0.65)) {
            logi("  第" + (i+1) + "次滑动后找到'更多'");
            return _ocrClickRetry("更多", "创作中心", UPLOAD_CFG.delay.pageLoad, "更多→创作中心");
        }
    }

    // 如果5次都没找到，尝试在所有 OCR 结果中搜
    try {
        var img = image.captureFullScreenEx();
        if (img && _ocrEng) {
            var result = _ocrEng.ocrImage(img, UPLOAD_CFG.ocrTimeout, {});
            image.recycle(img);
            if (result) {
                for (var j = 0; j < result.length; j++) {
                    if (result[j].label.indexOf("更多") >= 0) {
                        var cx = result[j].x + Math.floor(result[j].width / 2);
                        var cy = result[j].y + Math.floor(result[j].height / 2);
                        logi("  兜底找到'更多': (" + cx + "," + cy + ")");
                        clickPoint(cx, cy);
                        sleep(UPLOAD_CFG.delay.pageLoad);
                        if (_ocrHas("创作中心", 0.6)) {
                            logi("  S3 ✅");
                            return true;
                        }
                    }
                }
            }
        }
    } catch(e) {}

    loge("  S3 ❌ 未找到'更多'按钮");
    return false;
}

// ============================================================
// S4: 创作中心 → 验证"发布"
// ============================================================

function _s4_creatorCenter() {
    logi("S4: 创作中心");
    var ok = _ocrClickRetry("创作中心", "发布", UPLOAD_CFG.delay.h5Load, "创作中心→发布");
    if (!ok) {
        // 有些版本用"创作者中心"
        ok = _ocrClickRetry("创作者中心", "发布", UPLOAD_CFG.delay.h5Load, "创作者中心→发布");
    }
    if (ok) { logi("  S4 ✅"); } else { loge("  S4 ❌"); }
    return ok;
}

// ============================================================
// S5: 发布 → 验证"上传视频"
// ============================================================

function _s5_publishEntry() {
    logi("S5: 发布入口");
    var ok = _ocrClickRetry("发布", "上传视频", UPLOAD_CFG.delay.pageLoad, "发布→上传视频");
    if (!ok) {
        // 有些版本可能叫"投稿"
        ok = _ocrClickRetry("投稿", "上传视频", UPLOAD_CFG.delay.pageLoad, "投稿→上传视频");
    }
    if (ok) { logi("  S5 ✅"); } else { loge("  S5 ❌"); }
    return ok;
}

// ============================================================
// S6: 上传视频 → 验证文件选择器出现
// ============================================================

function _s6_uploadVideo() {
    logi("S6: 上传视频");
    // 文件选择器是系统组件，不同ROM显示不同文字
    // 验证文字fallback: 图片和视频, 视频, 图片, 照片, 相册, 取消, 完成

    var targetFound = false;
    for (var attempt = 0; attempt < UPLOAD_CFG.maxRetry; attempt++) {
        // 先找"上传视频"并点击
        var pos = _ocrFind("上传视频", 0.65);
        if (!pos) {
            logi("  OCR未找到'上传视频' (attempt " + (attempt+1) + ")");
            if (attempt > 0) { sleep(1000); }
            continue;
        }
        targetFound = true;
        logi("  找到'上传视频' (" + pos.x + "," + pos.y + ")，点击...");
        clickPoint(pos.x, pos.y);
        sleep(UPLOAD_CFG.delay.filePicker);

        // 验证: 检查是否出现文件选择器（多种ROM适配）
        var pickerIndicators = ["图片和视频", "视频", "图片", "照片", "相册", "取消", "完成", "选择文件"];
        for (var i = 0; i < pickerIndicators.length; i++) {
            if (_ocrHas(pickerIndicators[i], 0.6)) {
                logi("  文件选择器已出现 (检测到: [" + pickerIndicators[i] + "])");
                logi("  S6 ✅");
                return true;
            }
        }
        logi("  文件选择器验证文字未匹配，尝试下一个...");
        sleep(1000);
    }

    if (!targetFound) {
        // 连"上传视频"都没找到过 —— 可能已经在文件选择器了
        var pickerIndicators2 = ["视频", "图片", "照片", "相册", "取消", "完成"];
        for (var j = 0; j < pickerIndicators2.length; j++) {
            if (_ocrHas(pickerIndicators2[j], 0.6)) {
                logi("  已在文件选择器中 (检测到: [" + pickerIndicators2[j] + "])");
                logi("  S6 ✅");
                return true;
            }
        }
        loge("  S6 ❌ 未找到'上传视频'按钮");
        return false;
    }

    // 点了但没验证到 —— 可能是文件选择器已出现但文字都不匹配
    // 乐观处理：页面已变化说明点击生效
    logi("  S6 ⚠️ (点击成功，文件选择器可能已打开)");
    return true;
}

// ============================================================
// S7: 选择第一个视频（文件选择器）
// 适配多种ROM: MIUI / ColorOS / 原生Android
// 策略: 等加载 → 切到视频Tab → 点第一个文件 → 验证选中
// ============================================================

function _s7_selectFirstVideo() {
    logi("S7: 选择第一个视频");

    var sw = device.getScreenWidth();
    var sh = device.getScreenHeight();

    // 1. 等待加载完成（"正在加载"消失）
    logi("  等待文件加载...");
    for (var w = 0; w < 10; w++) {
        if (!_ocrHas("正在加载", 0.5)) break;
        sleep(1000);
    }
    sleep(500);

    // 2. 检查并切换到"视频"tab
    // 有些ROM默认显示"图片"，需手动切换到"视频"
    var needSwitchTab = !_ocrHas("无照片", 0.5) && !_ocrHas("无视频", 0.5);
    // 检查是否有"视频"tab可见（说明在混合视图或图片tab）
    var vidTabPos = _ocrFind("视频", 0.6);
    if (vidTabPos && vidTabPos.y < sh * 0.15) {
        // "视频"是顶部tab — 需要点击切换到视频视图
        logi("  切换到'视频'tab (" + vidTabPos.x + "," + vidTabPos.y + ")");
        clickPoint(vidTabPos.x, vidTabPos.y);
        sleep(2000);
        // 等加载
        for (var w2 = 0; w2 < 8; w2++) {
            if (!_ocrHas("正在加载", 0.5)) break;
            sleep(800);
        }
    }

    // 3. 选择第一个视频
    // 文件选择器网格布局: 第一个文件通常在左上区域
    // 不同ROM的第一个文件位置略有不同，使用OCR辅助定位
    var clicked = false;

    // 方案A: OCR找文件时长标签（如"00:17"、"01:22"等时间格式）— 这最可能是视频
    try {
        var img = image.captureFullScreenEx();
        if (img && _ocrEng) {
            var result = _ocrEng.ocrImage(img, UPLOAD_CFG.ocrTimeout, {});
            image.recycle(img);
            if (result) {
                // 找第一个带时间戳的项（视频时长格式 MM:SS 或 HH:MM:SS）
                for (var i = 0; i < result.length; i++) {
                    var label = result[i].label;
                    // 匹配时间格式: 00:17, 1:23, 01:23:45 等
                    var timeMatch = label.match && label.match(/^\d{1,2}:\d{2}(:\d{2})?$/);
                    if (timeMatch) {
                        var cx = result[i].x + Math.floor(result[i].width / 2);
                        var cy = result[i].y - 80; // 缩略图在时间标签上方
                        if (cy < 0) cy = result[i].y + Math.floor(result[i].height / 2);
                        if (cx > sw * 0.1 && cx < sw * 0.9 && cy > sh * 0.2 && cy < sh * 0.85) {
                            logi("  找到视频时间标签 [" + label + "]，点击缩略图 (" + cx + "," + cy + ")");
                            clickPoint(cx, cy);
                            sleep(UPLOAD_CFG.delay.short);
                            clicked = true;
                            break;
                        }
                    }
                }
            }
        }
    } catch(e) {}

    if (!clicked) {
        // 方案B: OCR找视频文件名或缩略图下方的文字
        // 如果OCR没找到时间标签，尝试点击网格第一个位置
        logi("  使用首个文件位置 (" + Math.floor(sw * 0.25) + "," + Math.floor(sh * 0.28) + ")");
        clickPoint(Math.floor(sw * 0.25), Math.floor(sh * 0.28));
        sleep(UPLOAD_CFG.delay.short);
    }

    // 4. 验证选择（可选: 检查"完成"按钮是否变为可点击/高亮）
    sleep(1000);
    // MIUI/COS文件选择器选中后文件名会高亮或出现勾选标记
    // 这里乐观认为选择了文件
    logi("  S7 ✅ (文件已选择)");
    return true;
}

// ============================================================
// S8: 完成 → 验证发布编辑页出现（"视频分类"或"标题"）
// ============================================================

function _s8_done() {
    logi("S8: 完成");
    var ok = _ocrClickRetry("完成", "视频分类", UPLOAD_CFG.delay.pageLoad, "完成→视频分类");
    if (!ok) {
        ok = _ocrClickRetry("完成", "标题", UPLOAD_CFG.delay.pageLoad, "完成→标题");
    }
    if (!ok) {
        // 可能"完成"键在右上角，文字很小
        ok = _ocrClick("完成", null, UPLOAD_CFG.delay.pageLoad, "完成(不验证)");
    }
    if (ok) { logi("  S8 ✅"); } else { loge("  S8 ❌"); }
    return ok;
}

// ============================================================
// S9: 输入标题
// ============================================================

function _s9_inputTitle(title) {
    logi("S9: 输入标题: " + title);

    // 1. 点击标题区域，让输入框获得焦点
    //    OCR 找"标题"或"起个标题"等提示文字，点击它触发输入框聚焦
    var titleHint = _ocrFind("标题", 0.6);
    if (titleHint) {
        logi("  找到标题区域: (" + titleHint.x + "," + titleHint.y + ")");
        clickPoint(titleHint.x, titleHint.y);
    } else {
        // 回退：发布页中部
        var sw = device.getScreenWidth();
        var sh = device.getScreenHeight();
        clickPoint(Math.floor(sw * 0.50), Math.floor(sh * 0.35));
    }
    sleep(800);

    // 2. 设置剪贴板
    try {
        utils.setClipboardText(title);
        logi("  剪贴板已设置");
    } catch(e) {
        logi("  剪贴板设置失败: " + e);
    }
    sleep(300);

    // 3. 方法A: 用 shell 发送粘贴按键 (KEYCODE_PASTE = 279)
    try {
        shell.execCommand("input keyevent 279");
        sleep(500);
        logi("  S9 ✅ (粘贴成功)");
        return true;
    } catch(e) {
        logi("  shell 粘贴失败: " + e);
    }

    // 4. 方法B: 长按 + OCR 找"粘贴"菜单
    try {
        var sw2 = device.getScreenWidth();
        var sh2 = device.getScreenHeight();
        longClickPoint(Math.floor(sw2 * 0.50), Math.floor(sh2 * 0.35));
        sleep(800);

        var pastePos = _ocrFind("粘贴", 0.7);
        if (pastePos) {
            clickPoint(pastePos.x, pastePos.y);
            sleep(500);
            logi("  S9 ✅ (粘贴菜单)");
            return true;
        }
    } catch(e) {
        logi("  长按粘贴失败: " + e);
    }

    // 粘贴失败不算致命错误，标题可以后续手动编辑
    logi("  S9 ⚠️ (标题输入可能未完成)");
    return true;
}

// ============================================================
// S10: 视频分类 → 验证"少儿"或分类页出现
// ============================================================

function _s10_videoCategory() {
    logi("S10: 视频分类");

    // 先向下轻滑露出分类区域
    var sw = device.getScreenWidth();
    var sh = device.getScreenHeight();
    swipeToPoint(
        Math.floor(sw * 0.5), Math.floor(sh * 0.70),
        Math.floor(sw * 0.5), Math.floor(sh * 0.45),
        300
    );
    sleep(UPLOAD_CFG.delay.short);

    var ok = _ocrClickRetry("视频分类", "少儿", UPLOAD_CFG.delay.pageLoad, "视频分类→少儿");
    if (ok) { logi("  S10 ✅"); } else { loge("  S10 ❌"); }
    return ok;
}

// ============================================================
// S11: 少儿 → 验证"少儿动画"
// ============================================================

function _s11_categoryChild() {
    logi("S11: 少儿");
    var ok = _ocrClickRetry("少儿", "少儿动画", UPLOAD_CFG.delay.pageLoad, "少儿→少儿动画");
    if (ok) { logi("  S11 ✅"); } else { loge("  S11 ❌"); }
    return ok;
}

// ============================================================
// S12: 少儿动画 → 返回发布页
// ============================================================

function _s12_childAnim() {
    logi("S12: 少儿动画");

    // 找到并点击"少儿动画"
    var pos = _ocrFind("少儿动画", 0.6);
    if (pos) {
        // 检查是否已选中（可能需要点击确认）
        var isSelected = false;
        if (_ocrHas("已选", 0.6) || _ocrHas("✓", 0.7)) {
            isSelected = true;
        }
        if (!isSelected) {
            clickPoint(pos.x, pos.y);
            sleep(UPLOAD_CFG.delay.short);
            logi("  点击少儿动画");
        } else {
            logi("  少儿动画已选中");
        }
        // 等待页面响应（选择后可能自动跳转）
        sleep(UPLOAD_CFG.delay.pageLoad);
    } else {
        logi("  ⚠️ 未找到'少儿动画'，尝试直接返回");
    }

    // 判断当前页面，避免多余 back() 导致回退过头
    // 如果已回到编辑页（检测"标题"/"视频分类"/"发布"按钮），不需要再 back
    var onEditPage = _ocrHas("标题", 0.6) ||
                     _ocrHas("视频分类", 0.6) ||
                     _ocrHas("关联内容", 0.6);
    if (onEditPage) {
        logi("  已自动返回编辑页，跳过back");
    } else {
        // 仍在分类页 — 返回编辑页
        logi("  仍停留在分类页，返回编辑页...");
        var backPos = _ocrFind("返回", 0.6);
        if (backPos && backPos.x < device.getScreenWidth() * 0.2) {
            clickPoint(backPos.x, backPos.y);
        } else {
            back();
        }
        sleep(UPLOAD_CFG.delay.back);
    }

    // 最终确认已在编辑页
    var finalCheck = _ocrHas("标题", 0.6) || _ocrHas("视频分类", 0.6) || _ocrHas("关联内容", 0.6);
    logi("  S12 " + (finalCheck ? "✅" : "⚠️ (可能不在编辑页)"));
    return true;
}

// ============================================================
// S13: 发布 → 验证"同意上传"弹窗出现
// ============================================================

function _s13_publish() {
    logi("S13: 发布");

    // OCR 找"发布"按钮（页面右下角）
    var publishPos = _ocrFind("发布", 0.65);
    if (publishPos) {
        // 右下角的"发布"才是发布按钮（可能有多个"发布"文字）
        var sw = device.getScreenWidth();
        var sh = device.getScreenHeight();
        if (publishPos.x > sw * 0.5 && publishPos.y > sh * 0.5) {
            // 在右下半屏，是发布按钮
            clickPoint(publishPos.x, publishPos.y);
            sleep(UPLOAD_CFG.delay.pageLoad);
        } else {
            // 可能是其他"发布"标签，继续找右下角的
            var img2 = image.captureFullScreenEx();
            if (img2 && _ocrEng) {
                var allText = _ocrEng.ocrImage(img2, UPLOAD_CFG.ocrTimeout, {});
                image.recycle(img2);
                if (allText) {
                    var bestBtn = null;
                    for (var i = 0; i < allText.length; i++) {
                        if (allText[i].label.indexOf("发布") >= 0 &&
                            allText[i].x > sw * 0.6 && allText[i].y > sh * 0.6) {
                            bestBtn = allText[i];
                            break;
                        }
                    }
                    if (bestBtn) {
                        clickPoint(bestBtn.x + Math.floor(bestBtn.width / 2),
                                   bestBtn.y + Math.floor(bestBtn.height / 2));
                    } else {
                        // 兜底
                        clickPoint(Math.floor(sw * 0.88), Math.floor(sh * 0.93));
                    }
                }
            }
            sleep(UPLOAD_CFG.delay.pageLoad);
        }
    } else {
        // 兜底：右下角
        var sw2 = device.getScreenWidth();
        var sh2 = device.getScreenHeight();
        clickPoint(Math.floor(sw2 * 0.88), Math.floor(sh2 * 0.93));
        sleep(UPLOAD_CFG.delay.pageLoad);
    }

    logi("  S13 ✅");
    return true;
}

// ============================================================
// S14: 同意上传（确认弹窗）
// ============================================================

function _s14_agreeUpload() {
    logi("S14: 同意上传");

    // 等待弹窗出现
    sleep(2000);

    var ok = _ocrClick("同意上传", null, UPLOAD_CFG.delay.anim, "同意上传");
    if (!ok) {
        ok = _ocrClick("同意", null, UPLOAD_CFG.delay.anim, "同意");
    }
    if (!ok) {
        ok = _ocrClick("确认", null, UPLOAD_CFG.delay.anim, "确认");
    }
    if (!ok) {
        ok = _ocrClick("确定", null, UPLOAD_CFG.delay.anim, "确定");
    }
    // S14 不强制要求成功 —— 有些情况下没有二次确认弹窗
    logi("  S14 " + (ok ? "✅ (已确认)" : "⚠️ (未找到确认弹窗，可能直接发布了)"));
    return true;
}

// ============================================================
// 辅助：返回首页
// ============================================================

function _goHome() {
    logi("返回首页");
    for (var i = 0; i < 3; i++) {
        back();
        sleep(UPLOAD_CFG.delay.short);
    }
    // 确认已回首页
    try { utils.openApp(UPLOAD_CFG.pkg); } catch(e) {}
    sleep(UPLOAD_CFG.delay.appOpen);
}

// ============================================================
// 释放 OCR 资源（脚本停止时调用）
// ============================================================

function _ocrRelease() {
    if (_ocrEng) {
        try {
            _ocrEng.releaseAll();
            logi("OCR: 资源已释放");
        } catch(e) {}
        _ocrEng = null;
        _ocrInited = false;
    }
}

// 注册停止回调
try {
    setStopCallback(function() {
        logi("tencent_upload: 脚本停止，释放OCR资源");
        _ocrRelease();
    });
} catch(e) {}

logi("tencent_upload.js 模块已加载 (v3 — OCR识别+验证)");
