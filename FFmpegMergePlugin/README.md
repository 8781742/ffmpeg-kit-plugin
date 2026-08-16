# FFmpegMerge DEX Plugin for EasyClick

## 概述
这是一个可被 `loadDex()` 加载的 FFmpeg 视频合并插件，类似 HID 插件的工作方式。

## 文件结构
```
FFmpegMergePlugin/
├── src/
│   └── FFmpegMerge.java      # Java 源码
├── build/
│   └── com/ec/ffmpeg/
│       └── FFmpegMerge.class # 编译后的 class
├── output/
│   ├── FFmpegMerge.jar       # JAR 包
│   └── FFmpegMerge.dex       # DEX 插件（推送到设备）
└── README.md
```

## 使用方法

### 1. 在 EasyClick 中加载插件
```javascript
// 加载插件（首次）
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 初始化（必须调用）
com.ec.ffmpeg.FFmpegMerge.init("/sdcard/Download/ffmpeg-bin/ffmpeg");

// 检查是否可用
if (com.ec.ffmpeg.FFmpegMerge.isAvailable()) {
    logi("插件可用");
}
```

### 2. 核心 API

```javascript
// 合并两个视频
var ok = com.ec.ffmpeg.FFmpegMerge.mergeVideos(
    "/sdcard/Download/video1.mp4",
    "/sdcard/Download/video2.mp4",
    "/sdcard/Download/merged.mp4"
);

// 合并多个视频
var ok = com.ec.ffmpeg.FFmpegMerge.mergeVideos(
    "/sdcard/Download/merged.mp4",
    "/sdcard/Download/v1.mp4",
    "/sdcard/Download/v2.mp4",
    "/sdcard/Download/v3.mp4"
);

// 提取音频
var ok = com.ec.ffmpeg.FFmpegMerge.extractAudio(
    "/sdcard/Download/video.mp4",
    "/sdcard/Download/audio.m4a"
);

// 裁剪视频
var ok = com.ec.ffmpeg.FFmpegMerge.trimVideo(
    "/sdcard/Download/video.mp4",
    "/sdcard/Download/clip.mp4",
    10.5,   // 开始时间（秒）
    30.0    // 时长（秒）
);

// 获取视频信息
var info = com.ec.ffmpeg.FFmpegMerge.getVideoInfo(
    "/sdcard/Download/video.mp4"
);

// 压缩视频
var ok = com.ec.ffmpeg.FFmpegMerge.compressVideo(
    "/sdcard/Download/video.mp4",
    "/sdcard/Download/compressed.mp4",
    720,  // 最大宽度
    1280, // 最大高度
    23    // CRF 码率控制 (18-28)
);
```

## 前提条件

1. **设备上需要有 ffmpeg 二进制文件**
   - 路径：`/sdcard/Download/ffmpeg-bin/ffmpeg`
   - 大小：约 76MB

2. **EasyClick 环境**
   - 支持 `loadDex()` API
   - Java 反射调用能力

## 构建说明

### 环境要求
- JDK 1.8+ (`/c/Program Files/Java/jdk1.8.0_181/bin/javac`)
- Python 3 (用于生成 DEX)

### 构建步骤
```bash
# 1. 编译 Java
javac -source 1.7 -target 1.7 -d build src/FFmpegMerge.java

# 2. 打包 JAR
jar cf output/FFmpegMerge.jar -C build .

# 3. 生成 DEX（使用 Python 脚本）
python3 create_dex.py
```

## 注意事项

1. **路径问题**：ffmpeg 路径中不能有空格，否则需要正确转义
2. **线程安全**：mergeVideos 会阻塞调用线程，建议在子线程中调用
3. **权限**：确保 EasyClick 有读写 SD 卡的权限

## 故障排除

### DEX 加载失败
```javascript
// 检查文件是否存在
logi("文件存在: " + file.exists("/sdcard/ffmpeg_plugin/FFmpegMerge.dex"));

// 尝试加载
try {
    loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
    logi("加载成功");
} catch(e) {
    loge("加载失败: " + e);
}
```

### 合并失败
- 检查 ffmpeg 是否可执行：`/sdcard/Download/ffmpeg-bin/ffmpeg -version`
- 检查输入文件是否存在且有效
- 检查输出路径是否有写权限

## 更新日志

### v1.0 (2026-08-15)
- 初始版本
- 支持双视频合并
- 支持多视频合并
- 支持音频提取、视频裁剪、压缩
