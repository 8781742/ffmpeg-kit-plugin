# FFmpegMerge DEX 插件使用指南

## 快速开始

### 1. 加载插件
```javascript
// 加载 DEX 插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
```

### 2. 初始化（必须）
```javascript
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
cls.getMethod("init", java.lang.String.class)
   .invoke(null, "/data/local/tmp/ffmpeg");
```

### 3. 合并视频
```javascript
// 合并两个视频
var ok = cls.getMethod("mergeVideos",
    java.lang.String.class, java.lang.String.class, java.lang.String.class)
    .invoke(null, video1, video2, output);

// 合并多个视频
var arr = java.lang.reflect.Array.newInstance(
    java.lang.String.class, videos.length);
for (var i = 0; i < videos.length; i++) {
    java.lang.reflect.Array.set(arr, i, videos[i]);
}
var ok = cls.getMethod("mergeVideos",
    java.lang.String.class,
    java.lang.reflect.Array.newInstance(java.lang.String.class, 0).getClass())
    .invoke(null, output, arr);
```

## API 列表

| 方法 | 说明 |
|------|------|
| `init(ffmpegPath)` | 初始化，设置 ffmpeg 路径 |
| `isAvailable()` | 检查是否可用 |
| `getFfmpegPath()` | 获取配置的 ffmpeg 路径 |
| `mergeVideos(v1, v2, output)` | 合并两个视频 |
| `mergeVideos(output, videos[])` | 合并多个视频 |
| `extractAudio(video, output)` | 提取音频 |
| `trimVideo(video, output, start, duration)` | 裁剪视频 |
| `compressVideo(video, output, maxWidth, maxHeight, crf)` | 压缩视频 |
| `getVideoInfo(video)` | 获取视频信息 |

## 完整示例

```javascript
// 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 初始化
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
cls.getMethod("init", java.lang.String.class)
   .invoke(null, "/data/local/tmp/ffmpeg");

// 检查可用性
if (!cls.getMethod("isAvailable").invoke(null)) {
    logi("插件不可用");
    exit();
}

// 合并视频
var v1 = "/sdcard/Download/video1.mp4";
var v2 = "/sdcard/Download/video2.mp4";
var out = "/sdcard/Download/merged.mp4";

var ok = cls.getMethod("mergeVideos",
    java.lang.String.class, java.lang.String.class, java.lang.String.class)
    .invoke(null, v1, v2, out);

logi("合并结果: " + ok);
```

## 文件位置

| 文件 | 路径 |
|------|------|
| DEX 插件 | `/sdcard/ffmpeg_plugin/FFmpegMerge.dex` |
| FFmpeg 二进制 | `/data/local/tmp/ffmpeg` |
| Java 源码 | `FFmpegMergePlugin/src/FFmpegMerge.java` |
| 测试脚本 | `tengxun/src/js/_test_dx_plugin.js` |

## 注意事项

1. **初始化必调**: 加载 DEX 后必须先调用 `init()` 设置 ffmpeg 路径
2. **ffmpeg 路径**: 使用 `/data/local/tmp/ffmpeg`（已确认可执行）
3. **阻塞调用**: mergeVideos 会阻塞线程，建议在子线程中调用
4. **路径空格**: 避免路径中包含空格，否则需要正确转义
