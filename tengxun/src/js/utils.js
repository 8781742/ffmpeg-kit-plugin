// ============================================================
// 文件: utils.js
// 描述: 通用工具函数
// ============================================================

/**
 * 替换文件名中的非法字符
 */
function replaceStr(str) {
    if (!str) return "未命名";
    // 移除非法字符
    var result = str.replace(/[\\/:*?"<>|\r\n]/g, "");
    // 截断长度
    if (result.length > 20) {
        result = result.substring(0, 20);
    }
    return result || "未命名";
}

/**
 * 生成随机字符串
 */
function generateRandomStr(length) {
    length = length || 16;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + "MB";
    return (bytes / 1073741824).toFixed(1) + "GB";
}

/**
 * 时间戳转格式化时间
 */
function formatTime(timestamp) {
    var d = new Date(timestamp * 1000);
    var pad = function(n) { return n < 10 ? "0" + n : n; };
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) +
        " " + pad(d.getHours()) + "." + pad(d.getMinutes()) + "." + pad(d.getSeconds());
}

/**
 * 从文本中提取抖音链接
 */
function extractDouyinLink(text) {
    var regex = /https?:\/\/v\.douyin\.com\/[a-zA-Z0-9]+\/?/g;
    var match = regex.exec(text);
    return match ? match[0] : null;
}

/**
 * 确保目录存在
 */
function ensureDir(path) {
    if (!file.exists(path)) {
        file.mkdirs(path);
    }
}