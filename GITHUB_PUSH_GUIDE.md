# FFmpegKit 插件 — 生成 DEX 指南

## 方案说明

本项目包含两种方案：
- **方案A：FFmpegKit 内嵌**（推荐）— DEX 自带 FFmpeg 能力，无需外部二进制
- **方案B：ProcessBuilder 调用外部 ffmpeg**（已废弃）

## 方案A：通过 GitHub Codespaces 构建 FFmpegKit DEX

### 步骤 1：确认代码已推送

仓库地址：https://github.com/8781742/ffmpeg-kit-plugin

```bash
cd D:/ec/tengxun
git status
# 确保一切已提交并推送
```

### 步骤 2：启动 GitHub Codespace

1. 打开 https://github.com/8781742/ffmpeg-kit-plugin
2. 点击绿色 `Code` 按钮
3. 选择 **Codespaces** 标签页
4. 点击 **Create codespace on main**
5. 等待环境启动（约 2-3 分钟）

### 步骤 3：在 Codespace 终端构建

```bash
cd D:/ec/tengxun/FFmpegKitPlugin_full
./gradlew assembleDebug
```

构建完成后，APK 位置：
```
app/build/outputs/apk/debug/app-debug.apk
```

### 步骤 4：下载 APK 并提取 DEX

**方式1：GitHub UI 下载**
1. 回到 Codespaces 页面 → 点击右侧 "..." → Open in browser
2. 在文件浏览器中找到 `app/build/outputs/apk/debug/app-debug.apk`
3. 右键 → Download

**方式2：SCP 从 Codespace 下载**
```bash
# 在本机终端执行
scp -r <codespace-name>-<username>.github.dev:/home/user/tengxun/FFmpegKitPlugin_full/app/build/outputs/apk/debug/app-debug.apk D:/ec/tengxun/
```

### 步骤 5：APK 重命名为 DEX

```bash
cd D:/ec/tengxun
copy app-debug.apk FFmpegMerge.dex
```

### 步骤 6：推送到设备

```bash
adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/
adb shell chmod 755 /sdcard/ffmpeg_plugin/FFmpegMerge.dex
```

### 步骤 7：在 EasyClick 中使用

```javascript
// 加载插件（FFmpegKit 内嵌版本）
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 检查可用性（无需 init，自动加载）
if (!com.ec.ffmpeg.FFmpegMerge.isAvailable()) {
    loge("FFmpegKit 不可用");
    exit();
}

// 合并视频
var video1 = "/sdcard/Download/抖音下载/ep1.mp4";
var video2 = "/sdcard/Download/抖音下载/ep2.mp4";
var output = "/sdcard/Download/抖音下载/merged.mp4";

var ok = com.ec.ffmpeg.FFmpegMerge.mergeVideos(video1, video2, output);
logi("合并结果: " + ok);
```

## 方案B：FFmpegMergePlugin（需要外部 ffmpeg 二进制）— 已废弃

此方案需要在设备上预先放置 ffmpeg 二进制文件，不推荐。

---

## 项目结构

```
tengxun/
├── FFmpegKitPlugin_full/     # FFmpegKit 内嵌方案（推荐）
│   ├── app/src/main/java/com/ec/ffmpeg/FFmpegMerge.java
│   ├── app/libs/ffmpeg-kit.aar  # 本地 AAR 缓存
│   ├── app/build.gradle       # implementation files('libs/ffmpeg-kit.aar')
│   └── settings.gradle
│
├── FFmpegMergePlugin/         # ProcessBuilder 方案（已废弃）
│   └── src/FFmpegMerge.java
│
├── tengxun/src/js/
│   └── _ffmpeg_merge_plugin.js  # JS 封装层
│
└── ...
```

## 常见问题

### Q: Codespace 构建失败，提示找不到 FFmpegKit
**A:** FFmpegKit 依赖从 Maven Central 下载。检查网络连接。如果不行，可先用本地 AAR：
```bash
cp D:/ec/tengxun/FFmpegKitPlugin_full/app/libs/ffmpeg-kit.aar ~/.codespaces/ffmpeg-kit.aar
# 修改 build.gradle 使用本地文件
```

### Q: DEX 加载失败
**A:** 确认 DEX 文件存在于设备：
```bash
adb shell ls -lh /sdcard/ffmpeg_plugin/FFmpegMerge.dex
```
加载时添加 try-catch：
```javascript
try {
    loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
    logi("加载成功");
} catch(e) {
    loge("加载失败: " + e);
}
```

### Q: 如何验证 FFmpegKit 可用
**A:** 在 EasyClick 控制台执行：
```javascript
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
logi("可用: " + com.ec.ffmpeg.FFmpegMerge.isAvailable());
```
