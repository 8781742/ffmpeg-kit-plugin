# FFmpegKit 视频合并插件

使用 [FFmpegKit](https://github.com/tanersener/ffmpeg-kit) SDK 构建的 EasyClick 插件。

## 项目结构

```
FFmpegKitPlugin/
├── app/
│   ├── build.gradle              # 依赖配置
│   └── src/main/
│       ├── AndroidManifest.xml   # 权限配置
│       └── java/com/ec/ffmpeg/
│           └── FFmpegKitMerge.java  # 插件源码
├── build.gradle                  # 项目配置
└── settings.gradle               # 模块配置
```

## 构建步骤

### 1. 环境要求
- Android Studio 或命令行 Gradle
- JDK 8+
- 网络连接（下载 FFmpegKit 依赖）

### 2. 构建 APK
```bash
cd D:/ec/tengxun/FFmpegKitPlugin
gradle assembleRelease
# 或
./gradlew assembleRelease
```

### 3. 提取 DEX
构建完成后，APK 位于 `app/build/outputs/apk/release/app-release.apk`

提取 DEX：
```bash
# 方法1：直接重命名（APK 就是 ZIP）
cp app/build/outputs/apk/release/app-release.apk FFmpegMerge.dex
# EC 的 loadDex 可以直接加载 APK/DEX

# 方法2：解压后提取 classes.dex
unzip app-release.apk classes.dex
```

### 4. 推送到设备
```bash
adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/
```

## 使用方法

### 在 EasyClick 脚本中

```javascript
// 1. 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 2. 检查可用性
if (!com.ec.ffmpeg.FFmpegKitMerge.isAvailable()) {
    logi("FFmpegKit 不可用");
    exit();
}

// 3. 合并两个视频
var ok = com.ec.ffmpeg.FFmpegKitMerge.mergeVideos(
    "/sdcard/Download/video1.mp4",
    "/sdcard/Download/video2.mp4",
    "/sdcard/Download/merged.mp4"
);

logi("合并结果: " + ok);

// 4. 合并多个视频
var ok = com.ec.ffmpeg.FFmpegKitMerge.mergeVideos(
    "/sdcard/Download/merged.mp4",
    "/sdcard/Download/v1.mp4",
    "/sdcard/Download/v2.mp4",
    "/sdcard/Download/v3.mp4"
);
```

## API 列表

| 方法 | 说明 |
|------|------|
| `isAvailable()` | 检查 FFmpegKit 是否可用 |
| `mergeVideos(v1, v2, output)` | 合并两个视频 |
| `mergeVideos(output, v1, v2, ...)` | 合并多个视频 |
| `extractAudio(video, output)` | 提取音频 |
| `trimVideo(video, output, start, duration)` | 裁剪视频 |
| `getVersion()` | 获取版本信息 |

## FFmpegKit 依赖说明

```gradle
// 完整版本 - 包含所有编解码器（推荐用于视频合并）
implementation 'com.arthenica:ffmpeg-kit-full:6.0-2'

// GPL 版本 - 包含更多编解码器（需要 GPL 许可）
implementation 'com.arthenica:ffmpeg-kit-gpl-full:6.0-2'

// Lite 版本 - 体积小，功能有限
implementation 'com.arthenica:ffmpeg-kit-lite:6.0-2'
```

## 注意事项

1. **APK 大小**: `ffmpeg-kit-full` 约 50-80MB，会导致 APK 较大
2. **ARM 支持**: 默认支持 arm64-v8a，如需其他架构需额外配置
3. **权限**: 需要读写外部存储权限
4. **异步执行**: FFmpegKit 支持异步回调，本插件使用同步调用

## 参考

- FFmpegKit GitHub: https://github.com/tanersener/ffmpeg-kit
- FFmpegKit 文档: https://github.com/tanersener/ffmpeg-kit/wiki
- MobileFFmpeg（旧版）: https://github.com/tanersener/mobile-ffmpeg
