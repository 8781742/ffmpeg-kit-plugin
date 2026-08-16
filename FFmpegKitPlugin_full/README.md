# FFmpegKit 插件构建指南

## 项目结构
```
D:/ec/tengxun/FFmpegKitPlugin_full/
├── app/
│   ├── build.gradle          # FFmpegKit 依赖配置
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/com/ec/ffmpeg/
│           └── FFmpegKitMerge.java  # 插件源码
├── build.gradle
└── settings.gradle
```

## 构建步骤

### 方法1：使用 Android Studio（推荐）

1. 打开 Android Studio
2. File → Open → 选择 `D:\ec\tengxun\FFmpegKitPlugin_full`
3. 等待 Gradle 同步完成（会自动下载 FFmpegKit 依赖）
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. APK 生成在：`app/build/outputs/apk/debug/app-debug.apk`

### 方法2：使用命令行

```bash
cd D:\ec\tengxun\FFmpegKitPlugin_full

# 使用 Gradle Wrapper（首次会自动下载）
gradle.bat assembleDebug
```

### 提取 DEX

构建完成后，从 APK 提取 DEX：

```bash
# APK 就是 ZIP 文件，直接重命名
copy app\build\outputs\apk\debug\app-debug.apk FFmpegMerge.dex

# 或在 EC 中直接使用 APK 路径
loadDex("D:\path\to\app-debug.apk");
```

## 使用方法

### 在 EasyClick 脚本中

```javascript
// 1. 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegKitMerge.dex");

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
```

## FFmpegKit 依赖说明

```gradle
// build.gradle
dependencies {
    // Full 版本 - 包含所有编解码器（推荐）
    implementation 'com.arthenica:ffmpeg-kit-full:6.0-2'
    
    // 或使用旧版（Java 8 兼容）
    // implementation 'com.arthenica:mobile-ffmpeg-full:4.4.1'
}
```

## 注意事项

1. **FFmpegKit 6.x 需要 Java 11+** 编译
2. **APK 大小**：full 版本约 80-100MB（包含所有架构的 so 文件）
3. **权限**：需要读写存储权限（已在 AndroidManifest.xml 中声明）
4. **异步执行**：FFmpegKit.execute() 是同步调用，会阻塞线程

## 参考文档

- FFmpegKit GitHub: https://github.com/tanersener/ffmpeg-kit
- FFmpegKit Wiki: https://github.com/tanersener/ffmpeg-kit/wiki
