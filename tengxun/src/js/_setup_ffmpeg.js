// ============================================================
// 文件: _setup_ffmpeg.js
// 描述: 从外部存储部署 ffmpeg 到设备
// ============================================================

var FFMPEG_EXTERNAL_PATH = "/sdcard/Download/ffmpeg";
var FFMPEG_DEPLOY_DIR = "/sdcard/Download/ffmpeg-bin";
var FFMPEG_DEPLOY_PATH = FFMPEG_DEPLOY_DIR + "/ffmpeg";

/**
 * 部署 ffmpeg 到设备
 */
function deployFfmpeg() {
    try {
        if (file.exists(FFMPEG_DEPLOY_PATH)) {
            logi("ffmpeg 已部署，跳过");
            return true;
        }

        logi("开始部署 ffmpeg...");
        file.mkdirs(FFMPEG_DEPLOY_DIR);

        // 从外部存储复制
        if (file.exists(FFMPEG_EXTERNAL_PATH)) {
            var data = file.readFile(FFMPEG_EXTERNAL_PATH);
            if (data) {
                file.writeFile(data, FFMPEG_DEPLOY_PATH);
                logi("ffmpeg 部署成功: " + FFMPEG_DEPLOY_PATH);
                return true;
            }
        }

        loge("无法读取 ffmpeg: " + FFMPEG_EXTERNAL_PATH);
        return false;
    } catch(e) {
        loge("部署异常: " + e);
        return false;
    }
}

/**
 * 获取 ffmpeg 路径
 */
function getFfmpegPath() {
    if (file.exists(FFMPEG_DEPLOY_PATH)) {
        return FFMPEG_DEPLOY_PATH;
    }
    return null;
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    var k = 1024, sizes = ["B", "KB", "MB", "GB"];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

// 自动部署
deployFfmpeg();
logi("_setup_ffmpeg.js 已加载，ffmpeg 路径: " + (getFfmpegPath() || "未部署"));
