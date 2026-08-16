# FFmpegKit 插件构建指南

## 当前状态

本地环境只有 Java 8，但 FFmpegKit 需要 Java 11+ 编译。

## 解决方案：使用 Android Studio 构建

### 步骤 1：安装 JDK 11+

下载并安装 JDK 11 或更高版本：
- Adoptium: https://adoptium.net/
- Oracle: https://www.oracle.com/java/technologies/downloads/

安装后记下路径，例如：`C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot`

### 步骤 2：安装 Android Studio

如果没有 Android Studio：
- 下载: https://developer.android.com/studio
- 安装后确保安装了：
  - Android SDK
  - Android SDK Build-Tools
  - Android SDK Platform (API 33)

### 步骤 3：打开项目

1. 启动 Android Studio
2. File → Open
3. 选择目录：`D:\ec\tengxun\FFmpegKitPlugin_full`
4. 等待 Gradle 同步完成（会自动下载 FFmpegKit 依赖）

### 步骤 4：构建 APK

1. 菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
2. 等待构建完成
3. APK 位置：`app/build/outputs/apk/debug/app-debug.apk`

### 步骤 5：提取 DEX

APK 就是 ZIP 文件，可以直接重命名：
```bash
# 在 Windows 命令行
copy "D:\ec\tengxun\FFmpegKitPlugin_full\app\build\outputs\apk\debug\app-debug.apk" "D:\ec\tengxun\FFmpegMerge.dex"
```

### 步骤 6：推送到设备
```bash
adb push D:\ec\tengxun\FFmpegMerge.dex /sdcard/ffmpeg_plugin/
```

## 使用方法

在 EasyClick 脚本中：
```javascript
// 加载插件
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 检查可用性
if (!com.ec.ffmpeg.FFmpegMerge.isAvailable()) {
    logi("FFmpegKit 不可用");
    exit();
}

// 合并视频
var ok = com.ec.ffmpeg.FFmpegMerge.mergeVideos(
    "/sdcard/Download/v1.mp4",
    "/sdcard/Download/v2.mp4",
    "/sdcard/Download/merged.mp4"
);

logi("合并结果: " + ok);
```

## 项目配置

- **包名**: `com.ec.ffmpeg`
- **类名**: `FFmpegMerge`
- **依赖**: `com.arthenica:ffmpeg-kit-full:6.0-2`
- **最低 SDK**: 21
- **目标 SDK**: 33
- **编译选项**: Java 8 兼容

## 注意事项

1. **APK 大小**: 约 80-100MB（包含 FFmpegKit 原生库）
2. **支持架构**: arm64-v8a, x86_64
3. **权限**: 需要读写存储权限（已自动添加）
4. **线程**: FFmpegKit.execute() 是同步调用，会阻塞线程

## 参考

- FFmpegKit GitHub: https://github.com/tanersener/ffmpeg-kit
- FFmpegKit Wiki: https://github.com/tanersener/ffmpeg-kit/wiki
