// ============================================================
// FFmpeg 视频合并模块 - 纯 JS 实现
// 使用 /data/local/tmp/ffmpeg
// 注意：路径中避免中文，如有需要会自动复制到 ASCII 路径
// ============================================================

var FFMPEG_PATH = "/data/local/tmp/ffmpeg";
var _ffmpegAvailable = false;

/**
 * 检查 ffmpeg 是否可用
 */
function ffmpegIsAvailable() {
    if (_ffmpegAvailable) return true;
    try {
        var version = shell.execAgentCommand(FFMPEG_PATH + " -version 2>&1 | head -1");
        if (version && version.indexOf("ffmpeg") >= 0) {
            _ffmpegAvailable = true;
            logi("FFmpeg 可用: " + FFMPEG_PATH);
            return true;
        }
    } catch(e) {}
    return false;
}

/**
 * 复制文件到 ASCII 路径（避免中文路径问题）
 */
function ensureAsciiPath(srcPath) {
    if (!srcPath || srcPath.indexOf('一') === -1) return srcPath;
    // 路径中有中文，复制到 ASCII 路径
    var fileName = srcPath.substring(srcPath.lastIndexOf('/') + 1);
    var destPath = "/sdcard/Download/_tmp_" + fileName;
    try {
        var data = file.readFile(srcPath);
        if (data) {
            file.writeFile(data, destPath);
            logi("复制到 ASCII 路径: " + destPath);
            return destPath;
        }
    } catch(e) {}
    return srcPath;
}

/**
 * 合并两个视频
 */
function ffmpegMergeTwo(video1, video2, outputPath) {
    if (!ffmpegIsAvailable()) return false;

    // 确保源文件存在
    if (!file.exists(video1)) {
        loge("视频不存在: " + video1);
        return false;
    }
    if (!file.exists(video2)) {
        loge("视频不存在: " + video2);
        return false;
    }

    // 处理中文路径
    var v1 = ensureAsciiPath(video1);
    var v2 = ensureAsciiPath(video2);
    var out = ensureAsciiPath(outputPath);

    try {
        var listFile = out + ".txt";
        var listContent = "file '" + v1 + "'\nfile '" + v2 + "'\n";
        file.writeFile(listContent, listFile);

        var cmd = FFMPEG_PATH
            + " -f concat -safe 0"
            + " -i \"" + listFile + "\""
            + " -c copy"
            + " \"" + out + "\""
            + " -y";

        logi("合并: " + v1.substring(v1.lastIndexOf('/')+1)
            + " + " + v2.substring(v2.lastIndexOf('/')+1));

        var result = shell.execAgentCommand(cmd);
        logi("ffmpeg 执行结果: " + (result !== null ? "成功" : "失败"));

        try { file.deleteFile(listFile); } catch(e) {}

        if (file.exists(out)) {
            var sizeResult = shell.execAgentCommand("stat -c %s \"" + out + "\" 2>/dev/null || echo 0");
            var size = parseInt(sizeResult.trim()) || 0;
            logi("合并成功: " + out + " (" + formatSize(size) + ")");
            return true;
        }

        loge("合并失败: 输出文件不存在");
        return false;
    } catch(e) {
        loge("合并异常: " + e);
        return false;
    }
}

/**
 * 合并多个视频
 */
function ffmpegMergeMultiple(output, videos) {
    if (!ffmpegIsAvailable()) return false;
    if (!videos || videos.length < 2) {
        loge("至少需要 2 个视频");
        return false;
    }

    try {
        var listFile = output + ".txt";
        var listContent = "";
        for (var i = 0; i < videos.length; i++) {
            var v = ensureAsciiPath(videos[i]);
            if (!file.exists(v)) {
                loge("视频不存在: " + v);
                return false;
            }
            listContent += "file '" + v + "'\n";
        }
        file.writeFile(listContent, listFile);

        var out = ensureAsciiPath(output);
        var cmd = FFMPEG_PATH
            + " -f concat -safe 0"
            + " -i \"" + listFile + "\""
            + " -c copy"
            + " \"" + out + "\""
            + " -y";

        logi("合并 " + videos.length + " 个视频...");
        shell.execAgentCommand(cmd);

        try { file.deleteFile(listFile); } catch(e) {}

        if (file.exists(out)) {
            logi("合并成功: " + out);
            return true;
        }
        return false;
    } catch(e) {
        loge("合并异常: " + e);
        return false;
    }
}

/**
 * 一键合并（兼容原有接口）
 */
function ffmpegMergeVideos(file1, file2, outputDir, outputName) {
    if (!ffmpegIsAvailable()) return null;

    try {
        if (!file.exists(outputDir)) {
            file.mkdirs(outputDir);
        }
    } catch(e) {}

    var outputPath = outputDir + "/" + outputName;
    if (outputPath.indexOf(".") === -1) outputPath += ".mp4";

    if (file.exists(outputPath)) {
        logi("输出已存在，跳过: " + outputPath);
        return outputPath;
    }

    var ok = ffmpegMergeTwo(file1, file2, outputPath);
    return ok ? outputPath : null;
}

function formatSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0;
    var size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return size.toFixed(1) + " " + units[i];
}

// 自动检测
try {
    ffmpegIsAvailable();
} catch(e) {}
