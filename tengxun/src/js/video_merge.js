// ============================================================
// 视频合并模块 — 静态编译 ffmpeg (assets/bin/ffmpeg)
// ============================================================

var FFMPEGKIT_LIBS_DIR = "/sdcard/Download/ffmpegkit/libs/arm64-v8a";
var FFMPEGKIT_SRC_DIR = "/sdcard/Download/ffmpegkit/src";

/**
 * 部署 FFmpegKit 库到设备
 */
function deployFfmpegKit() {
    try {
        if (file.exists(FFMPEGKIT_LIBS_DIR + "/libffmpegkit.so")) {
            logi("FFmpegKit 已部署");
            return true;
        }

        logi("部署 FFmpegKit...");
        file.mkdirs(FFMPEGKIT_LIBS_DIR);
        file.mkdirs(FFMPEGKIT_SRC_DIR);

        // 复制 .so 文件到设备
        var soFiles = [
            "libavutil.so", "libavcodec.so", "libavformat.so",
            "libavfilter.so", "libavdevice.so", "libswscale.so",
            "libswresample.so", "libc++_shared.so", "libffmpegkit.so"
        ];

        for (var i = 0; i < soFiles.length; i++) {
            var srcPath = "D:/ec/tengxun/tengxun/libs/arm64-v8a/" + soFiles[i];
            var destPath = FFMPEGKIT_SRC_DIR + "/" + soFiles[i];
            try {
                var data = file.readFile(srcPath);
                if (data) {
                    file.writeFile(data, destPath);
                    logi("复制: " + soFiles[i]);
                }
            } catch(e) {}
        }

        // 复制到 libs 目录
        for (var i = 0; i < soFiles.length; i++) {
            var src = FFMPEGKIT_SRC_DIR + "/" + soFiles[i];
            var dst = FFMPEGKIT_LIBS_DIR + "/" + soFiles[i];
            try {
                var data = file.readFile(src);
                if (data) file.writeFile(data, dst);
            } catch(e) {}
        }

        logi("FFmpegKit 部署完成");
        return true;
    } catch(e) {
        loge("部署失败: " + e);
        return false;
    }
}

/**
 * 加载 FFmpegKit
 */
function loadFfmpegKit() {
    try {
        var soPath = FFMPEGKIT_LIBS_DIR + "/libffmpegkit.so";
        if (!file.exists(soPath)) {
            loge("FFmpegKit .so 不存在: " + soPath);
            return false;
        }
        java.lang.System.load(soPath);
        logi("FFmpegKit 加载成功");
        return true;
    } catch(e) {
        loge("FFmpegKit 加载失败: " + e);
        return false;
    }
}

/**
 * 合并两个视频
 */
function mergeVideos(video1, video2, outputDir, outputName) {
    if (!file.exists(video1)) { loge("源文件不存在: " + video1); return null; }
    if (!file.exists(video2)) { loge("源文件不存在: " + video2); return null; }
    ensureDir(outputDir);

    var outputPath = outputDir + "/" + outputName;
    if (outputPath.indexOf(".") === -1) outputPath += ".mp4";
    if (file.exists(outputPath)) {
        logi("合并文件已存在: " + outputPath);
        return outputPath;
    }

    try {
        logi("执行合并: " + outputName);

        // 写入 concat 列表文件
        var listFile = outputDir + "/concat.txt";
        file.writeFile("file '" + video1 + "'\nfile '" + video2 + "'\n", listFile);

        // 使用 FFmpegKit 执行
        var cmd = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + outputPath + "\" -y";
        logi("ffmpeg 命令: " + cmd);

        // 使用 shell 执行 ffmpeg (由 _setup_ffmpeg.js 部署)
        var ffmpegPath = getFfmpegPath();
        if (ffmpegPath) {
            var cmd = ffmpegPath + " " + cmd;
            logi("ffmpeg 命令: " + cmd);
            // execAgentCommand 通过代理同步阻塞，会等待 ffmpeg 完成
            var result = shell.execAgentCommand(cmd);
            logi("ffmpeg 结果: " + (result || "ok"));
        } else {
            loge("ffmpeg 可执行文件不存在，尝试部署...");
            try { if (typeof deployFfmpeg === "function") deployFfmpeg(); } catch(e) {}
            ffmpegPath = getFfmpegPath();
            if (!ffmpegPath) {
                loge("ffmpeg 部署失败，无法合并视频");
            }
            try { file.deleteFile(listFile); } catch(e) {}
            return null;
        }

        try { file.deleteFile(listFile); } catch(e) {}

        if (file.exists(outputPath)) {
            var size = getFileSize(outputPath);
            logi("合并完成: " + outputPath + " (" + formatFileSize(size) + ")");
            return outputPath;
        }
        loge("合并失败（文件未生成）");
        return null;
    } catch(e) {
        loge("合并异常: " + e);
        return null;
    }
}

function getFileSize(path) {
    try {
        var r = shell.execAgentCommand("stat -c %s \"" + path + "\" 2>/dev/null || echo 0");
        return parseInt(r && r.trim()) || 0;
    } catch(e) { return 0; }
}

function deleteOriginalVideos(video1, video2) {
    try {
        if (video1 && file.exists(video1)) { file.deleteFile(video1); logi("已删除: " + video1); }
        if (video2 && file.exists(video2)) { file.deleteFile(video2); logi("已删除: " + video2); }
    } catch(e) { loge("删除失败: " + e); }
}

function getMergedFileName(mixName, epStart, epEnd) {
    return mixName.replace(/[\/\\:*?"<>|]/g, "_") + "_第" + epStart + "-" + epEnd + "集.mp4";
}

function ensureDir(path) {
    if (!file.exists(path)) { file.mkdirs(path); }
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    var k = 1024, sizes = ["B", "KB", "MB", "GB"];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

logi("video_merge.js 模块已加载 (ffmpeg 路径: " + (getFfmpegPath() || "未部署") + ")");
