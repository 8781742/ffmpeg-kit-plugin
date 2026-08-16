# FFmpegKit 视频合并插件使用指南

## 快速开始

### 1. 构建插件

使用 Android Studio 打开项目：
```
D:\ec\tengxun\FFmpegKitPlugin_full
```

构建后得到 APK，重命名为 `.dex`：
```bash
copy app\build\outputs\apk\debug\app-debug.apk FFmpegMerge.dex
```

### 2. 推送到设备
```bash
adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/
```

### 3. 在 EasyClick 中使用

```javascript
// 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 合并视频
var ok = com.ec.ffmpeg.FFmpegKitMerge.mergeVideos(
    "/sdcard/Download/v1.mp4",
    "/sdcard/Download/v2.mp4",
    "/sdcard/Download/merged.mp4"
);

if (ok) {
    logi("合并成功");
}
```

## API 列表

| 方法 | 说明 |
|------|------|
| `isAvailable()` | 检查 FFmpegKit 是否可用 |
| `mergeVideos(v1, v2, output)` | 合并两个视频 |
| `mergeVideos(output, v1, v2, ...)` | 合并多个视频 |

## 依赖

- Android Studio 4.0+
- JDK 11+
- 网络连接（下载 FFmpegKit 依赖）
