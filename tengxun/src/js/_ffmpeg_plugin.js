// FFmpeg Plugin Wrapper for EasyClick
// 用法：loadDex("/sdcard/Download/FFmpegPlugin.apk");
//       FFmpegPlugin.mergeTwoVideos(file1, file2, outputPath);

var PLUGIN_PATH = "/sdcard/Download/FFmpegPlugin.apk";
var _pluginLoaded = false;

/**
 * 加载 FFmpeg 插件
 */
function loadFFmpegPlugin() {
    if (_pluginLoaded) return true;
    
    if (!file.exists(PLUGIN_PATH)) {
        loge("FFmpegPlugin.apk 不存在: " + PLUGIN_PATH);
        return false;
    }
    
    try {
        loadDex(PLUGIN_PATH);
        _pluginLoaded = true;
        logi("FFmpegPlugin 加载成功");
        return true;
    } catch(e) {
        loge("FFmpegPlugin 加载失败: " + e);
        return false;
    }
}

/**
 * 合并两个视频
 * @return true=成功 false=失败
 */
function ffmpegMergeTwo(file1, file2, outputPath) {
    if (!loadFFmpegPlugin()) return false;
    
    try {
        var result = com.ffmpeg.plugin.FFmpegPlugin.mergeTwoVideos(file1, file2, outputPath);
        logi("合并结果: " + result);
        return result;
    } catch(e) {
        loge("合并异常: " + e);
        return false;
    }
}

/**
 * 检查 ffmpeg 是否可用
 */
function ffmpegIsAvailable() {
    if (!loadFFmpegPlugin()) return false;
    try {
        return com.ffmpeg.plugin.FFmpegPlugin.isAvailable();
    } catch(e) {
        return false;
    }
}

// 自动加载
try {
    loadFFmpegPlugin();
} catch(e) {}
