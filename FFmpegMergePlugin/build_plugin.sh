#!/bin/bash
# FFmpeg Merge DEX Plugin Build Script
# 编译环境：Windows Git Bash
# 依赖：JDK 1.8, adb

set -e

echo "===== FFmpegMerge Plugin Builder ====="

# ── 路径配置 ──────────────────────────────────────────────
PLUGIN_DIR="/d/ec/tengxun/FFmpegMergePlugin"
SRC_DIR="$PLUGIN_DIR/src"
BUILD_DIR="$PLUGIN_DIR/build"
OUTPUT_DIR="$PLUGIN_DIR/output"
ANDROID_JAR=""
DX_TOOL=""
JAVAC="/c/Program Files/Java/jdk1.8.0_181/bin/javac"
ADB="/c/Users/pc/adb.exe"

# ── 查找 android.jar ──────────────────────────────────────
echo "[1] 查找 android.jar..."
for d in "/c/Program Files (x86)/Android/android-sdk" "/c/Users/pc/AppData/Local/Android/Sdk" "/d/Android/sdk"; do
    if [ -d "$d/platforms" ]; then
        ANDROID_JAR=$(find "$d/platforms" -name "android.jar" 2>/dev/null | head -1)
        break
    fi
done

if [ -z "$ANDROID_JAR" ]; then
    echo "  android.jar 未找到，尝试使用 EcAndroid.jar 替代..."
    # EasyClick 运行时会提供 Android API
    ANDROID_JAR="$PLUGIN_DIR/EcAndroid.jar"
    if [ ! -f "$ANDROID_JAR" ]; then
        echo "  生成 EcAndroid.jar (stub)..."
        cat > "$SRC_DIR/android/util/Log.java" << 'JAVAEOF'
package android.util;
public class Log {
    public static int i(String tag, String msg) { System.out.println("[I][" + tag + "] " + msg); return 0; }
    public static int e(String tag, String msg) { System.err.println("[E][" + tag + "] " + msg); return 0; }
    public static int d(String tag, String msg) { System.out.println("[D][" + tag + "] " + msg); return 0; }
}
JAVAEOF
        mkdir -p "$SRC_DIR/android/util"
        # Create a minimal Log.java stub
        echo 'package android.util;' > "$SRC_DIR/android/util/Log.java"
        echo 'public class Log {' >> "$SRC_DIR/android/util/Log.java"
        echo '    public static int i(String t, String m) { return 0; }' >> "$SRC_DIR/android/util/Log.java"
        echo '    public static int e(String t, String m) { return 0; }' >> "$SRC_DIR/android/util/Log.java"
        echo '}' >> "$SRC_DIR/android/util/Log.java"
        $JAVAC -source 1.7 -target 1.7 "$SRC_DIR/android/util/Log.java" -d "$BUILD_DIR"
        mkdir -p "$OUTPUT_DIR"
        cp "$BUILD_DIR/android/util/Log.class" "$OUTPUT_DIR/"
        # Delete stub after compilation
        rm -rf "$SRC_DIR/android"
        ANDROID_JAR=""
        echo "  Stub Log 已创建并清理"
    fi
fi
echo "  ANDROID_JAR=$ANDROID_JAR"

# ── 查找 dx 工具 ──────────────────────────────────────────
echo "[2] 查找 dx 工具..."
for f in \
    "/c/Users/pc/AppData/Roaming/AIS/app/res/raw/dx.bat" \
    "/c/Users/pc/AppData/Roaming/AIS/appbak/res/raw/dx.bat" \
    "C:/Program Files (x86)/Android/android-sdk/build-tools/25.0.3/dx.bat"; do
    if [ -f "$f" ]; then
        DX_TOOL="$f"
        break
    fi
done
echo "  DX_TOOL=$DX_TOOL"

# ── 编译 Java ─────────────────────────────────────────────
echo "[3] 编译 Java 源码..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

if [ -n "$ANDROID_JAR" ] && [ -f "$ANDROID_JAR" ]; then
    $JAVAC -source 1.7 -target 1.7 \
        -bootclasspath "$ANDROID_JAR" \
        -d "$BUILD_DIR" \
        "$SRC_DIR/FFmpegMerge.java"
else
    $JAVAC -source 1.7 -target 1.7 \
        -d "$BUILD_DIR" \
        "$SRC_DIR/FFmpegMerge.java"
fi
echo "  编译完成"

# ── 打包为 JAR ────────────────────────────────────────────
echo "[4] 打包 JAR..."
mkdir -p "$OUTPUT_DIR"
cd "$BUILD_DIR"
jar cf "$OUTPUT_DIR/FFmpegMerge.jar" com/ec/ffmpeg/FFmpegMerge.class
echo "  JAR: $OUTPUT_DIR/FFmpegMerge.jar"

# ── 转换为 DEX ────────────────────────────────────────────
echo "[5] 转换 DEX..."
if [ -n "$DX_TOOL" ] && [ -f "$DX_TOOL" ]; then
    # dx.bat 需要 Windows 命令行环境
    cmd.exe //c "\"$DX_TOOL\" --dex --output=\"$OUTPUT_DIR/FFmpegMerge.dex\" \"$OUTPUT_DIR/FFmpegMerge.jar\""
    if [ -f "$OUTPUT_DIR/FFmpegMerge.dex" ]; then
        echo "  DEX 生成成功: $OUTPUT_DIR/FFmpegMerge.dex"
    else
        echo "  DEX 生成失败，尝试其他方式..."
        # 备选：用 jar 改名（部分 EC 版本支持 .jar 作为 DEX）
        cp "$OUTPUT_DIR/FFmpegMerge.jar" "$OUTPUT_DIR/FFmpegMerge.jar"
        echo "  备选：使用 JAR 文件（EC 部分版本支持直接 loadDex JAR）"
    fi
else
    echo "  dx 工具未找到，使用 JAR 替代"
    cp "$OUTPUT_DIR/FFmpegMerge.jar" "$OUTPUT_DIR/FFmpegMerge.jar"
fi

# ── 推送至设备 ────────────────────────────────────────────
echo "[6] 推送到设备..."
if [ -f "$ADB" ]; then
    mkdir -p /tmp/ffmpeg_plugin
    cp "$OUTPUT_DIR/FFmpegMerge.dex" /tmp/ffmpeg_plugin/ 2>/dev/null || \
    cp "$OUTPUT_DIR/FFmpegMerge.jar" /tmp/ffmpeg_plugin/ 2>/dev/null
    $ADB push /tmp/ffmpeg_plugin/ /sdcard/ffmpeg_plugin/ 2>&1
    $ADB shell "chmod 755 /sdcard/ffmpeg_plugin/*" 2>&1
    echo "  推送完成"
    ls -la /sdcard/ffmpeg_plugin/ 2>/dev/null || true
else
    echo "  adb 未找到，请手动复制 $OUTPUT_DIR/ 到设备"
fi

# ── 验证 ──────────────────────────────────────────────────
echo "[7] 验证..."
if [ -f "$ADB" ]; then
    $ADB shell "ls -lh /sdcard/ffmpeg_plugin/ 2>/dev/null"
fi

echo ""
echo "===== 构建完成 ====="
echo "输出目录: $OUTPUT_DIR"
echo "使用方法:"
echo "  loadDex('/sdcard/ffmpeg_plugin/FFmpegMerge.dex')"
echo "  com.ec.ffmpeg.FFmpegMerge.init('/sdcard/Download/ffmpeg-bin/ffmpeg')"
echo "  com.ec.ffmpeg.FFmpegMerge.mergeVideos(file1, file2, output)"
echo ""
