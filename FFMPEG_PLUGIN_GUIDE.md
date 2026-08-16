# FFmpeg 视频合并 DEX 插件 - 使用指南

## 快速开始

### 1. 加载插件
```javascript
// 在 EasyClick 脚本开头加载
loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
```

### 2. 初始化（必须）
```javascript
var cls = java.lang.Class.forName("com.ec.ffmpeg.FFmpegMerge");
cls.getMethod("init", java.lang.String.class)
   .invoke(null, "/sdcard/Download/ffmpeg-bin/ffmpeg");
```

### 3. 合并视频
```javascript
// 合并两个视频
var ok = cls.getMethod("mergeVideos",
    java.lang.String.class, java.lang.String.class, java.lang.String.class)
    .invoke(null, video1, video2, output);

// 或合并多个视频
var ok = cls.getMethod("mergeVideos",
    java.lang.String.class,
    java.lang.reflect.Array.newInstance(java.lang.String.class, 0).getClass())
    .invoke(null, output, video1, video2, video3);
```

## 完整封装模块

已创建 `/sdcard/Download/抖音下载/_ffmpeg_merge_plugin.js`，可直接加载：

```javascript
loadJS("/sdcard/Download/抖音下载/_ffmpeg_merge_plugin.js");

// 初始化
if (!ffmpegMergeInit()) {
    loge("初始化失败");
    exit();
}

// 合并两视频
var result = ffmpegMergeTwo(file1, file2, outputDir, outputName);

// 合并多视频
var result = ffmpegMergeMultiple(output, [file1, file2, file3]);
```

## 文件位置

| 文件 | 位置 |
|------|------|
| DEX 插件 | `/sdcard/ffmpeg_plugin/FFmpegMerge.dex` |
| JS 封装 | `tengxun/src/js/_ffmpeg_merge_plugin.js` |
| 测试脚本 | `tengxun/src/js/test_ffmpeg_plugin_final.js` |
| FFmpeg 二进制 | `/sdcard/Download/ffmpeg-bin/ffmpeg` |

## 注意事项

1. **ffmpeg 权限**: 需要确保 ffmpeg 有执行权限 (`chmod 755`)
2. **路径空格**: ffmpeg 路径不能有空格，否则需要正确转义
3. **线程阻塞**: mergeVideos 会阻塞调用线程，建议在子线程中调用
4. **首次加载**: `loadDex()` 只需调用一次，之后可重复使用

## 故障排除

### DEX 加载失败
```javascript
logi("DEX 存在: " + file.exists("/sdcard/ffmpeg_plugin/FFmpegMerge.dex"));
try {
    loadDex("/sdcard/ffmpeg_plugin/FFmpegMerge.dex");
    logi("加载成功");
} catch(e) {
    loge("加载失败: " + e);
}
```

### 合并失败
- 检查 ffmpeg 是否可执行: `ffmpeg -version`
- 检查输入文件是否存在且有效
- 检查输出路径是否有写权限
