# FFmpegKit 插件 — 生成 DEX 步骤

## 当前配置
- **FFmpegKit 版本**: 5.1（AAR 文件已内置在仓库中）
- **AGP 版本**: 7.4.2
- **Gradle 版本**: 7.6.4
- **输出**: DEX 文件，内嵌 FFmpeg 能力，无需外部二进制

---

## 步骤 1：重建 Codespace

1. 在 Codespace 界面按 `Ctrl+Shift+P`
2. 输入 `Codespaces: Rebuild Container`
3. 等待重建完成（约 1-2 分钟）

## 步骤 2：拉取最新代码并构建

```bash
# 在 Codespace 终端执行
git pull
cd FFmpegKitPlugin_full
./gradlew assembleDebug
```

构建成功会显示 `BUILD SUCCESSFUL`。

## 步骤 3：下载 APK

**方式1：文件浏览器**
- Codespace 右侧文件面板 → 找到 `app/build/outputs/apk/debug/app-debug.apk`
- 右键 → Download

**方式2：终端命令（从本机）**
```bash
# 如果 codespace 名称是 ffmpeg-kit-plugin-xxx
scp <name>.github.dev:/workspaces/ffmpeg-kit-plugin/FFmpegKitPlugin_full/app/build/outputs/apk/debug/app-debug.apk D:/ec/tengxun/
```

## 步骤 4：重命名并推送

```bash
cd D:/ec/tengxun
copy app-debug.apk FFmpegMerge.dex
adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/
```

## 步骤 5：EasyClick 中使用

```javascript
// 加载插件（FFmpegKit 内嵌，无需 init）
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");

// 检查可用
logi("可用: " + com.ec.ffmpeg.FFmpegMerge.isAvailable());

// 合并视频
com.ec.ffmpeg.FFmpegMerge.mergeVideos(
    "/sdcard/Download/video1.mp4",
    "/sdcard/Download/video2.mp4",
    "/sdcard/Download/merged.mp4"
);
```
