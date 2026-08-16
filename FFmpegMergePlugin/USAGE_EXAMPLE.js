// FFmpegMerge 插件使用示例
// 在 EasyClick 中运行此脚本前，确保：
// 1. /sdcard/ffmpeg_plugin/FFmpegMerge.dex 已存在
// 2. /sdcard/Download/ffmpeg-bin/ffmpeg 可执行

// ============================================
// 方法一：直接使用 Java 反射调用
// ============================================

// 1. 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 2. 初始化（设置 ffmpeg 路径）
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
cls.getMethod("init", java.lang.String.class)
   .invoke(null, "/sdcard/Download/ffmpeg-bin/ffmpeg");

// 3. 合并视频
var video1 = "/sdcard/Download/抖音下载/.download/ep10_7538361937738943790.mp4";
var video2 = "/sdcard/Download/抖音下载/.download/ep10_7549098006100921610.mp4";
var output = "/sdcard/Download/抖音下载/merged_from_plugin.mp4";

var ok = cls.getMethod("mergeVideos",
    java.lang.String.class, java.lang.String.class, java.lang.String.class)
    .invoke(null, video1, video2, output);

logi("合并结果: " + ok);
if (ok && file.exists(output)) {
    logi("成功: " + file.size(output) + " bytes");
}

// ============================================
// 方法二：使用封装函数（推荐）
// ============================================

// 加载封装模块
loadJS("/sdcard/Download/抖音下载/_ffmpeg_merge_plugin.js");

// 初始化
if (!ffmpegMergeInit()) {
    loge("初始化失败");
    exit();
}

// 合并视频
var ok = ffmpegMergeTwo(video1, video2, "/sdcard/Download/抖音下载/", "merged_via_wrapper.mp4");
logi("封装函数合并结果: " + ok);
