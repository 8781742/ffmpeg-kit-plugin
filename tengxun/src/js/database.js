// ============================================================
// 文件: database.js
// 描述: SQLite 去重存储
// ============================================================

var DB_PATH = "/sdcard/Download/抖音下载/data.db";

/**
 * 初始化数据库
 */
function initDB() {
    var db = null;
    try {
        ensureDir("/sdcard/Download/抖音下载/");
        db = sqlite.open(DB_PATH);
        if (!db) {
            loge("数据库打开失败");
            return null;
        }
        // 创建表
        db.exec("CREATE TABLE if not exists t_user_post (" +
            "id integer primary key autoincrement," +
            "sec_uid varchar(200)," +
            "aweme_id integer unique," +
            "rawdata text" +
            ")");
        db.exec("CREATE TABLE if not exists t_user_like (" +
            "id integer primary key autoincrement," +
            "sec_uid varchar(200)," +
            "aweme_id integer unique," +
            "rawdata text" +
            ")");
        db.exec("CREATE TABLE if not exists t_mix (" +
            "id integer primary key autoincrement," +
            "sec_uid varchar(200)," +
            "mix_id varchar(200)," +
            "aweme_id integer," +
            "rawdata text" +
            ")");
        db.exec("CREATE TABLE if not exists t_music (" +
            "id integer primary key autoincrement," +
            "music_id varchar(200)," +
            "aweme_id integer unique," +
            "rawdata text" +
            ")");
        logd("数据库初始化成功: " + DB_PATH);
        return db;
    } catch(e) {
        loge("数据库初始化失败: " + e);
        return null;
    }
}

/**
 * 检查作品是否已下载
 */
function isPostDownloaded(db, secUid, awemeId) {
    if (!db) return false;
    try {
        var result = db.query("SELECT id FROM t_user_post WHERE sec_uid=? AND aweme_id=?", [secUid, awemeId]);
        return result && result.length > 0;
    } catch(e) {
        return false;
    }
}

/**
 * 插入下载记录
 */
function insertPost(db, secUid, awemeId, data) {
    if (!db) return;
    try {
        db.exec("INSERT INTO t_user_post (sec_uid, aweme_id, rawdata) VALUES (?, ?, ?)",
            [secUid, awemeId, JSON.stringify(data)]);
        logd("插入记录: " + awemeId);
    } catch(e) {
        // 可能已存在，忽略
    }
}

/**
 * 检查合集作品是否已下载
 */
function isMixDownloaded(db, secUid, mixId, awemeId) {
    if (!db) return false;
    try {
        var result = db.query("SELECT id FROM t_mix WHERE sec_uid=? AND mix_id=? AND aweme_id=?", [secUid, mixId, awemeId]);
        return result && result.length > 0;
    } catch(e) {
        return false;
    }
}

/**
 * 插入合集记录
 */
function insertMix(db, secUid, mixId, awemeId, data) {
    if (!db) return;
    try {
        db.exec("INSERT INTO t_mix (sec_uid, mix_id, aweme_id, rawdata) VALUES (?, ?, ?, ?)",
            [secUid, mixId, awemeId, JSON.stringify(data)]);
    } catch(e) {}
}

// ============================================================
// 下载+合并状态追踪 (t_download_state)
// ============================================================

/**
 * 创建下载状态表
 */
function initDownloadState(db) {
    if (!db) return;
    try {
        db.exec("CREATE TABLE if not exists t_download_state (" +
            "id integer primary key autoincrement," +
            "mix_id varchar(200)," +
            "mix_name varchar(500)," +
            "ep_start integer," +
            "ep_end integer," +
            "merged_file varchar(1000)," +
            "file_size integer default 0," +
            "status varchar(50) default 'merged'," +
            "error_msg text," +
            "created_at integer" +
            ")");
        logd("t_download_state 表初始化成功");
    } catch(e) {
        loge("t_download_state 初始化失败: " + e);
    }
}

/**
 * 检查某pair是否已下载合并
 */
function isPairDownloaded(db, mixId, epStart, epEnd) {
    if (!db) return false;
    try {
        var result = db.query(
            "SELECT id FROM t_download_state WHERE mix_id=? AND ep_start=? AND ep_end=? AND status='merged'",
            [mixId, epStart, epEnd]
        );
        return result && result.length > 0;
    } catch(e) {
        return false;
    }
}

/**
 * 获取某合集已下载的pair数量
 */
function getDownloadedCount(db, mixId) {
    if (!db) return 0;
    try {
        var result = db.query(
            "SELECT count(*) as cnt FROM t_download_state WHERE mix_id=? AND status='merged'",
            [mixId]
        );
        return result && result.length > 0 ? result[0].cnt : 0;
    } catch(e) {
        return 0;
    }
}

/**
 * 插入下载合并记录
 */
function insertPairDownloaded(db, mixId, mixName, epStart, epEnd, mergedFile) {
    if (!db) return;
    try {
        db.exec(
            "INSERT INTO t_download_state (mix_id, mix_name, ep_start, ep_end, merged_file, status, created_at) VALUES (?, ?, ?, ?, ?, 'merged', ?)",
            [mixId, mixName, epStart, epEnd, mergedFile, new Date().getTime()]
        );
        logi("下载合并记录: " + mixName + " 第" + epStart + "-" + epEnd + "集");
    } catch(e) {
        loge("插入下载记录失败: " + e);
    }
}

/**
 * 标记pair为失败
 */
function markPairFailed(db, mixId, epStart, epEnd, errorMsg) {
    if (!db) return;
    try {
        db.exec(
            "INSERT OR REPLACE INTO t_download_state (mix_id, ep_start, ep_end, status, error_msg, created_at) VALUES (?, ?, ?, 'failed', ?, ?)",
            [mixId, epStart, epEnd, errorMsg, new Date().getTime()]
        );
    } catch(e) {}
}

// ============================================================
// 上传状态追踪 (t_upload_state)
// ============================================================

/**
 * 创建上传状态表
 */
function initUploadState(db) {
    if (!db) return;
    try {
        db.exec("CREATE TABLE if not exists t_upload_state (" +
            "id integer primary key autoincrement," +
            "merged_file varchar(1000)," +
            "mix_id varchar(200)," +
            "mix_name varchar(500)," +
            "ep_start integer," +
            "ep_end integer," +
            "title varchar(500)," +
            "status varchar(50) default 'uploaded'," +
            "error_msg text," +
            "retry_count integer default 0," +
            "uploaded_at integer" +
            ")");
        logd("t_upload_state 表初始化成功");
    } catch(e) {
        loge("t_upload_state 初始化失败: " + e);
    }
}

/**
 * 检查文件是否已上传
 */
function isFileUploaded(db, mergedFile) {
    if (!db) return false;
    try {
        var result = db.query(
            "SELECT id FROM t_upload_state WHERE merged_file=? AND status='uploaded'",
            [mergedFile]
        );
        return result && result.length > 0;
    } catch(e) {
        return false;
    }
}

/**
 * 获取某合集已上传数量
 */
function getUploadedCount(db, mixId) {
    if (!db) return 0;
    try {
        var result = db.query(
            "SELECT count(*) as cnt FROM t_upload_state WHERE mix_id=? AND status='uploaded'",
            [mixId]
        );
        return result && result.length > 0 ? result[0].cnt : 0;
    } catch(e) {
        return 0;
    }
}

/**
 * 插入上传记录
 */
function insertUploadRecord(db, mergedFile, mixId, mixName, epStart, epEnd, title) {
    if (!db) return;
    try {
        db.exec(
            "INSERT INTO t_upload_state (merged_file, mix_id, mix_name, ep_start, ep_end, title, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)",
            [mergedFile, mixId, mixName, epStart, epEnd, title, new Date().getTime()]
        );
        logi("上传记录: " + title);
    } catch(e) {
        loge("插入上传记录失败: " + e);
    }
}

/**
 * 标记上传失败（含重试次数）
 */
function markUploadFailed(db, mergedFile, errorMsg) {
    if (!db) return;
    try {
        // 先查当前重试次数
        var result = db.query("SELECT retry_count FROM t_upload_state WHERE merged_file=?", [mergedFile]);
        var retry = (result && result.length > 0) ? (result[0].retry_count || 0) + 1 : 1;
        db.exec(
            "INSERT OR REPLACE INTO t_upload_state (merged_file, status, error_msg, retry_count, uploaded_at) VALUES (?, 'failed', ?, ?, ?)",
            [mergedFile, errorMsg, retry, new Date().getTime()]
        );
    } catch(e) {}
}

/**
 * 初始化所有新增表（在 initDB 后调用）
 */
function initNewTables(db) {
    initDownloadState(db);
    initUploadState(db);
}