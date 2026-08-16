

//测试这里先停
//exit(); // 临时注释用于测试
// ============================================================
// 文件: main.js
// 描述: 抖音数据采集 → 腾讯视频上传 完整流水线
// 流程: 解析链接 → 拉取作品 → 存库 → 按合集筛选 → 配对下载 → ffmpeg合并 → 逐个上传
// ============================================================

// ---------- 配置读取（文件优先，回退 window.ec） ----------
var CFG_FILE = "/sdcard/Download/抖音下载/.config.json";
function _get(key, def) {
    try {
        // 优先从持久化文件读取
        if (file.exists(CFG_FILE)) {
            var content = file.readFile(CFG_FILE);
            if (content) {
                try {
                    var cfg = JSON.parse(content);
                    if (cfg[key] !== undefined && cfg[key] !== null && cfg[key] !== "") return String(cfg[key]);
                } catch(e) {}
            }
        }
        // 回退 window.ec.getConfig（UI 环境）
        if (typeof window !== 'undefined' && window.ec) {
            var v = window.ec.getConfig(key);
            if (v !== null && v !== undefined && v !== "") return String(v);
        }
        return def;
    } catch(e) { return def; }
}
function _set(key, val) {
    try {
        var cfg = {};
        if (file.exists(CFG_FILE)) {
            var content = file.readFile(CFG_FILE);
            if (content) { try { cfg = JSON.parse(content); } catch(e) {} }
        }
        cfg[key] = val;
        file.writeFile(JSON.stringify(cfg), CFG_FILE);
        // 同步到 window.ec（UI 环境）
        if (typeof window !== 'undefined' && window.ec) {
            window.ec.saveConfig(key, val);
        }
    } catch(e) {}
}

var LINKS = _get("linkInput", "") || "";
var COOKIE = _get("cookieInput", "") || "";
var SAVE_PATH = (_get("savePath", "/sdcard/Download/抖音下载/") || "");
if (SAVE_PATH.length > 0 && SAVE_PATH.charAt(SAVE_PATH.length - 1) === "/") {
    SAVE_PATH = SAVE_PATH.substring(0, SAVE_PATH.length - 1);
}
var MIX_NAMES_RAW = _get("mixNamesInput", "") || "";
var MIX_NAMES = [];
if (MIX_NAMES_RAW) {
    MIX_NAMES = MIX_NAMES_RAW.split(/[\n,，、]/).map(function(s) {
        return s.trim();
    }).filter(function(s) { return s.length > 0; });
}
var DOWNLOAD_LIMIT = parseInt(_get("downloadLimit", "0")) || 0;
var MAX_THREAD = parseInt(_get("maxThread", "5")) || 5;

// var DB = null; // 使用全局 sqlite 对象
var STAT = { total: 0, success: 0, fail: 0, uploaded: 0 };
var _paused = false;

// ---------- 状态更新 ----------
function updateUI() {
    try {
        _set("_statTotal", String(STAT.total));
        _set("_statSuccess", String(STAT.success));
        _set("_statFail", String(STAT.fail));
        _set("_statUploaded", String(STAT.uploaded));
        _set("_progress", "100");
        toast("已采集:" + STAT.total + " 成功:" + STAT.success + " 上传:" + STAT.uploaded);
    } catch(e) {}
}

// ---------- 停止回调 ----------
try {
    setStopCallback(function() {
        logi("脚本被停止");
        _paused = true;
        stopDB();
        _set("_running", "false");
        _set("_statTotal", String(STAT.total));
        _set("_statSuccess", String(STAT.success));
        _set("_statFail", String(STAT.fail));
        _set("_statUploaded", String(STAT.uploaded));
        toast("脚本已停止");
    });
} catch(e) {}

// ============================================================
// 阶段一：初始化数据库
// ============================================================
var DB_CONNECTED = false;

function initDB() {
    try {
        var _saveDir = SAVE_PATH + "/";
        if (!file.exists(_saveDir)) { file.mkdirs(_saveDir); }
        // connectOrCreateDb 返回 false/true，不是 db 对象
        var ok = sqlite.connectOrCreateDb("/sdcard/Download/抖音下载/data.db");
        if (!ok) { loge("数据库连接失败"); return false; }
        DB_CONNECTED = true;
        // 建表（直接用 execSql）
        sqlite.execSql("CREATE TABLE if not exists t_user_post (id integer primary key autoincrement, sec_uid varchar(200), aweme_id integer unique, rawdata text)");
        sqlite.execSql("CREATE TABLE if not exists t_user_like (id integer primary key autoincrement, sec_uid varchar(200), aweme_id integer unique, rawdata text)");
        sqlite.execSql("CREATE TABLE if not exists t_mix (id integer primary key autoincrement, sec_uid varchar(200), mix_id varchar(200), aweme_id integer, rawdata text)");
        sqlite.execSql("CREATE TABLE if not exists t_music (id integer primary key autoincrement, music_id varchar(200), aweme_id integer unique, rawdata text)");
        sqlite.execSql("CREATE TABLE if not exists t_download_state (id integer primary key autoincrement, mix_id varchar(200), mix_name varchar(500), ep_start integer, ep_end integer, merged_file varchar(1000), file_size integer default 0, status varchar(50) default 'merged', error_msg text, created_at integer)");
        sqlite.execSql("CREATE TABLE if not exists t_upload_state (id integer primary key autoincrement, merged_file varchar(1000), mix_id varchar(200), mix_name varchar(500), ep_start integer, ep_end integer, title varchar(500), status varchar(50) default 'uploaded', error_msg text, retry_count integer default 0, uploaded_at integer)");
        logd("数据库初始化成功");
        return true;
    } catch(e) {
        loge("数据库初始化失败: " + e);
        return false;
    }
}

// ---------- 数据库辅助函数 ----------
function dbQuery(sql) {
    if (!DB_CONNECTED) return null;
    try { return sqlite.query(sql); } catch(e) { return null; }
}

function dbExec(sql) {
    if (!DB_CONNECTED) return;
    try { sqlite.execSql(sql); } catch(e) {}
}

function dbInsert(table, values) {
    // values 格式: ["'val1'", "val2", "3"] (已转义的SQL值)
    var cols = Object.keys(values).join(", ");
    var vals = Object.keys(values).map(function(k) {
        var v = values[k];
        if (v === null || v === undefined) return "null";
        if (typeof v === "number") return String(v);
        return "'" + String(v).replace(/'/g, "''") + "'";
    }).join(", ");
    dbExec("INSERT INTO " + table + " (" + cols + ") VALUES (" + vals + ")");
}

function stopDB() {
    if (DB_CONNECTED) {
        try { sqlite.close(); } catch(e) {}
        DB_CONNECTED = false;
    }
}

// ============================================================
// 阶段二：解析抖音链接，获取 sec_user_id
// ============================================================
function parseSecUid(link) {
    try {
        logd("开始解析链接: " + link);
        var patterns = [
            /\/user\/(MS4wLjABAAAA[a-zA-Z0-9_\-]+)/,
            /sec_user_id=([^&\s"'\]]+)/,
            /sec_uid=([^&\s"'\]]+)/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var match = link.match(patterns[i]);
            if (match && match[1]) {
                logd("✅ 直接提取成功: " + match[1]);
                return match[1];
            }
        }
        if (link.indexOf("v.douyin.com") >= 0) {
            logd("检测到短链接，尝试 HTTP 解析...");
            var resp = http.httpGet(link, null, 10000, {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            });
            if (resp) {
                var loc = typeof resp === "object" && resp.request ? resp.request.url : (typeof resp === "string" ? resp : "");
                for (var j = 0; j < patterns.length; j++) {
                    var m2 = loc.match(patterns[j]);
                    if (m2 && m2[1]) { logd("✅ 从响应提取: " + m2[1]); return m2[1]; }
                }
            }
        }
        loge("❌ 无法解析链接: " + link);
        return null;
    } catch(e) {
        loge("解析链接异常: " + e);
        return null;
    }
}

// ============================================================
// 阶段三：获取用户全部作品（分页）
// ============================================================
function getUserPosts(secUid, cookie) {
    var allAweme = [];
    var maxCursor = 0;
    var count = 35;
    var page = 0;

    while (true) {
        if (_paused) { logi("暂停中，停止分页"); break; }

        var payload = "sec_user_id=" + secUid + "&count=" + count + "&max_cursor=" + maxCursor + "&device_platform=webapp&aid=6383";
        var fullUrl = "https://www.douyin.com/aweme/v1/web/aweme/post/?";
        fullUrl += payload + "&X-Bogus=" + getXbogus(payload);

        var headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Referer": "https://www.douyin.com/",
            "Origin": "https://www.douyin.com",
            "Connection": "keep-alive"
        };
        if (cookie) headers["Cookie"] = cookie;

        logi("分页 " + (page + 1) + " | URL: " + fullUrl.substring(0, 120) + "...");
        logi("分页 " + (page + 1) + " | Cookie长度: " + (cookie ? cookie.length : 0));

        var raw = http.httpGet(fullUrl, null, 15000, headers);
        if (!raw) { loge("请求失败（返回null），跳过分页"); break; }
        logd("响应前100字符: " + raw.substring(0, 100));

        var data;
        try { data = JSON.parse(raw); } catch(e) { loge("JSON解析失败: " + e + " | 原始: " + raw.substring(0, 100)); break; }

        if (!data || data.status_code !== 0 || !data.aweme_list) {
            logi("无更多数据 | status_code=" + data.status_code + " | message=" + (data.message || "none") + " | 停止分页");
            break;
        }

        var list = data.aweme_list;
        logd("本页获取: " + list.length + " 个视频");
        for (var i = 0; i < list.length; i++) {
            allAweme.push(list[i]);
            var aw = list[i];
            var sid = aw.author && aw.author.sec_uid ? aw.author.sec_uid : "";
            var aid = aw.aweme_id || 0;
            if (sid && aid) {
                try {
                    var chk = dbQuery("SELECT id FROM t_user_post WHERE sec_uid='" + sid + "' AND aweme_id=" + String(aid));
                    if (!chk || chk.length === 0) {
                        dbExec("INSERT INTO t_user_post (sec_uid, aweme_id, rawdata) VALUES ('" + sid.replace(/'/g, "''") + "', " + String(aid) + ", '" + JSON.stringify(aw).replace(/'/g, "''") + "')");
                    }
                } catch(e) {}
            }
            STAT.total++;
        }
        STAT.success += list.length;

        maxCursor = data.max_cursor || 0;
        if (!data.has_more || maxCursor <= 0) { logi("已是最后一页"); break; }
        page++;
        sleep(1500);
    }

    logi("共采集 " + allAweme.length + " 个视频");
    return allAweme;
}

// ============================================================
// 阶段四：按合集处理（下载→合并→上传）
// ============================================================

/**
 * 获取所有合集名称列表
 */
function getAllMixNames(allAweme) {
    var seen = {};
    var result = [];
    for (var i = 0; i < allAweme.length; i++) {
        var mix = allAweme[i].mix_info;
        if (mix && mix.mix_id && !seen[mix.mix_id]) {
            seen[mix.mix_id] = true;
            result.push({ mix_id: mix.mix_id, mix_name: mix.mix_name, total_episode: mix.statis && mix.statis.updated_to_episode ? mix.statis.updated_to_episode : 0 });
        }
    }
    logi("发现 " + result.length + " 个合集");
    for (var j = 0; j < result.length; j++) {
        logi("  - " + result[j].mix_name + " (ID:" + result[j].mix_id + ", " + result[j].total_episode + "集)");
    }
    return result.map(function(m) { return m.mix_name; });
}

/**
 * 处理单个合集
 */
function processMix(mixName, allVideos, perMixLimit) {
    logi("===== 处理合集: " + mixName + " =====");

    // 1. 筛选
    var mixVideos = [];
    for (var i = 0; i < allVideos.length; i++) {
        var aw = allVideos[i];
        var mi = aw.mix_info;
        if (mi && mi.mix_name === mixName) mixVideos.push(aw);
    }
    if (mixVideos.length === 0) {
        logi("合集 [" + mixName + "] 没有视频");
        return 0;
    }
    logi("匹配到 " + mixVideos.length + " 个视频");

    // 2. 按集数升序排序
    mixVideos.sort(function(a, b) {
        var ea = a.mix_info && a.mix_info.statis && a.mix_info.statis.current_episode ? a.mix_info.statis.current_episode : 0;
        var eb = b.mix_info && b.mix_info.statis && b.mix_info.statis.current_episode ? b.mix_info.statis.current_episode : 0;
        return ea - eb;
    });

    // 3. 两两配对
    var pairs = [];
    var idx = 0;
    while (idx + 1 < mixVideos.length) {
        pairs.push([mixVideos[idx], mixVideos[idx + 1]]);
        idx += 2;
    }
    if (idx < mixVideos.length) logi("剩余 " + (mixVideos.length - idx) + " 集不足2集，跳过");
    logi("生成 " + pairs.length + " 组配对");

    // 4. 限制数量
    var limit = perMixLimit > 0 ? perMixLimit : pairs.length;
    if (pairs.length > limit) { pairs = pairs.slice(0, limit); logi("限制处理前 " + pairs.length + " 组"); }

    // 5. 逐个下载+合并+上传
    var uploaded = 0;
    for (var p = 0; p < pairs.length; p++) {
        if (_paused) { logi("暂停中，跳过后续组合"); break; }

        var v1 = pairs[p][0];
        var v2 = pairs[p][1];
        var ep1 = v1.mix_info && v1.mix_info.statis && v1.mix_info.statis.current_episode ? v1.mix_info.statis.current_episode : 0;
        var ep2 = v2.mix_info && v2.mix_info.statis && v2.mix_info.statis.current_episode ? v2.mix_info.statis.current_episode : 0;
        var mixId = v1.mix_info && v1.mix_info.mix_id ? v1.mix_info.mix_id : "";

        // 去重检查
        var dup = dbQuery("SELECT id FROM t_download_state WHERE mix_id='" + mixId + "' AND ep_start=" + ep1 + " AND ep_end=" + ep2 + " AND status='merged'");
        if (dup && dup.length > 0) {
            logi("  第" + ep1 + "-" + ep2 + "集 已合并过，跳过");
            uploaded++;
            continue;
        }

        logi("  第" + (p + 1) + "/" + pairs.length + " 组: 第" + ep1 + "-" + ep2 + "集");

        // 下载第1集
        var path1 = downloadSingleVideo(v1, SAVE_PATH + "/.download/", COOKIE);
        if (!path1) {
            loge("  第" + ep1 + "集下载失败，跳过本组合");
            dbExec("INSERT INTO t_download_state (mix_id, mix_name, ep_start, ep_end, status, error_msg, created_at) VALUES ('" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", 'failed', '下载第" + ep1 + "集失败', " + new Date().getTime() + ")");
            STAT.fail++;
            continue;
        }

        // 下载第2集
        var path2 = downloadSingleVideo(v2, SAVE_PATH + "/.download/", COOKIE);
        if (!path2) {
            loge("  第" + ep2 + "集下载失败，清理第" + ep1 + "集后跳过");
            try { file.deleteFile(path1); } catch(e) {}
            dbExec("INSERT INTO t_download_state (mix_id, mix_name, ep_start, ep_end, status, error_msg, created_at) VALUES ('" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", 'failed', '下载第" + ep2 + "集失败', " + new Date().getTime() + ")");
            STAT.fail++;
            continue;
        }

        // 合并
        var mergedName = getMergedFileName(mixName, ep1, ep2);
        var mergedPath = mergeVideos(path1, path2, SAVE_PATH, mergedName);
        if (!mergedPath) {
            loge("  合并失败，清理源文件");
            try { file.deleteFile(path1); } catch(e) {}
            try { file.deleteFile(path2); } catch(e) {}
            dbExec("INSERT INTO t_download_state (mix_id, mix_name, ep_start, ep_end, status, error_msg, created_at) VALUES ('" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", 'failed', '合并失败', " + new Date().getTime() + ")");
            STAT.fail++;
            continue;
        }

        // 合并成功，删除原始视频
        deleteOriginalVideos(path1, path2);

        // 记录下载合并状态
        var fsize = 0;
        try { var sz = shell.execAgentCommand("stat -c %s \"" + mergedPath + "\" 2>/dev/null || ls -l \"" + mergedPath + "\" | awk '{print $5}'"); if (sz) fsize = parseInt(sz.trim()) || 0; } catch(e) {}
        dbExec("INSERT INTO t_download_state (mix_id, mix_name, ep_start, ep_end, merged_file, file_size, status, created_at) VALUES ('" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", '" + mergedPath.replace(/'/g, "''") + "', " + fsize + ", 'merged', " + new Date().getTime() + ")");
        logi("  ✅ 合并完成: " + formatFileSize(fsize));

        // 上传腾讯视频
        var title = mixName + "_第" + ep1 + "-" + ep2 + "集";
        logi("  上传: " + title);
        var uploadOk = uploadToTencentVideo(mergedPath, title);

        if (uploadOk) {
            dbExec("INSERT INTO t_upload_state (merged_file, mix_id, mix_name, ep_start, ep_end, title, status, uploaded_at) VALUES ('" + mergedPath.replace(/'/g, "''") + "', '" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", '" + title.replace(/'/g, "''") + "', 'uploaded', " + new Date().getTime() + ")");
            uploaded++;
            STAT.uploaded++;
            logi("  ✅ 上传成功");
        } else {
            dbExec("INSERT INTO t_upload_state (merged_file, mix_id, mix_name, ep_start, ep_end, title, status, error_msg, retry_count, uploaded_at) VALUES ('" + mergedPath.replace(/'/g, "''") + "', '" + mixId.replace(/'/g, "''") + "', '" + mixName.replace(/'/g, "''") + "', " + ep1 + ", " + ep2 + ", '" + title.replace(/'/g, "''") + "', 'failed', '上传失败', 1, " + new Date().getTime() + ")");
            STAT.fail++;
            loge("  ❌ 上传失败");
        }

        STAT.success++;
        updateUI();
        sleep(2000);
    }

    logi("合集 [" + mixName + "] 完成: 上传成功 " + uploaded + "/" + pairs.length + " 组");
    return uploaded;
}

// ============================================================
// 阶段五：下载单个视频
// ============================================================
function downloadSingleVideo(aw, saveDir, cookie) {
    var urlList = [];
    if (aw.video && aw.video.play_addr && aw.video.play_addr.url_list && aw.video.play_addr.url_list.length > 0) {
        urlList = aw.video.play_addr.url_list;
    }
    if (urlList.length === 0) {
        loge("无视频URL: " + (aw.desc || aw.aweme_id));
        return null;
    }

    var ep = aw.mix_info && aw.mix_info.statis && aw.mix_info.statis.current_episode ? aw.mix_info.statis.current_episode : 0;
    var fileName = "ep" + ep + "_" + aw.aweme_id + ".mp4";
    var filePath = saveDir + fileName;

    if (!file.exists(saveDir)) { file.mkdirs(saveDir); }
    if (file.exists(filePath)) {
        logi("  视频已存在: " + fileName);
        return filePath;
    }

    logi("  下载: 第" + ep + "集 " + (aw.desc || ""));
    var headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; M2012K11C) AppleWebKit/537.36",
        "Referer": "https://www.douyin.com/"
    };
    if (cookie) headers["Cookie"] = cookie;

    for (var ui = 0; ui < urlList.length; ui++) {
        logi("  下载地址: " + urlList[ui]);
        try {
            var dl = http.downloadFile(urlList[ui], filePath, 60000, headers);
            if (dl) {
                logi("  下载完成: " + fileName);
                return filePath;
            } else {
                logi("  URL " + (ui+1) + "/" + urlList.length + " 失败，尝试下一个...");
            }
        } catch(e) {
            logi("  URL " + (ui+1) + "/" + urlList.length + " 异常: " + e + "，尝试下一个...");
        }
    }
    loge("  所有URL下载失败，跳过: " + fileName);
    return null;
}

// ============================================================
// 主流程入口
// ============================================================
function main() {
    logi("===== 开始执行完整流水线 =====");
    var linkCount = LINKS.split(/[\n,，、]/).filter(function(s){return s.trim().length>0;}).length;
    logi("链接数: " + linkCount + " | 合集名: " + (MIX_NAMES.length || "自动获取") + " | 每合集最大: " + (DOWNLOAD_LIMIT || "不限"));
    logi("保存路径: " + SAVE_PATH);

    // 阶段一：初始化数据库
    if (!initDB()) { loge("数据库初始化失败，退出"); return; }

    // 阶段二~三：逐个链接采集
    var allAweme = [];
    var lines = LINKS.split(/[\n,，、]/).map(function(s){return s.trim();}).filter(function(s){return s.length > 0;});

    for (var li = 0; li < lines.length; li++) {
        if (_paused) break;
        var link = lines[li];
        logi("--- 处理链接 " + (li + 1) + "/" + lines.length + " ---");

        var secUid = parseSecUid(link);
        if (!secUid) { loge("链接解析失败，跳过"); continue; }

        var videos = getUserPosts(secUid, COOKIE);
        if (videos && videos.length > 0) {
            allAweme = allAweme.concat(videos);
            logi("累计作品数: " + allAweme.length);
        }
    }

    if (allAweme.length === 0) {
        loge("未获取到任何视频，退出");
        return;
    }

    logi("===== 采集完成，共 " + allAweme.length + " 个视频 =====");

    // 阶段四：按合集处理（下载→合并→上传）
    var mixNamesToProcess = MIX_NAMES.length > 0 ? MIX_NAMES : getAllMixNames(allAweme);
    var totalMixes = mixNamesToProcess.length;
    var totalUploaded = 0;

    for (var mi = 0; mi < totalMixes; mi++) {
        if (_paused) break;
        var mn = mixNamesToProcess[mi];
        logi("\n=== 合集 " + (mi + 1) + "/" + totalMixes + ": " + mn + " ===");

        var uploaded = processMix(mn, allAweme, DOWNLOAD_LIMIT);
        totalUploaded += uploaded;
    }

    logi("\n===== 全部完成 =====");
    logi("总采集: " + STAT.total);
    logi("总成功: " + STAT.success);
    logi("总失败: " + STAT.fail);
    logi("总上传: " + STAT.uploaded);
    logi("各合集合计上传: " + totalUploaded);

    updateUI();
    _set("_running", "false");
}

main();
