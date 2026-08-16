package com.ec.ffmpeg;

import android.util.Log;
import java.io.File;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

/**
 * FFmpeg 视频合并插件
 * 使用 ProcessBuilder 调用设备上的 ffmpeg 二进制文件
 */
public class FFmpegMerge {
    private static final String TAG = "FFmpegMerge";
    private static String sFfmpegPath = "/data/local/tmp/ffmpeg";
    private static boolean sInitialized = false;

    /**
     * 初始化 - 设置 ffmpeg 路径
     */
    public static boolean init(String ffmpegPath) {
        if (ffmpegPath != null && ffmpegPath.length() > 0) {
            sFfmpegPath = ffmpegPath;
        }
        sInitialized = true;
        Log.i(TAG, "初始化: " + sFfmpegPath);
        return true;
    }

    /**
     * 检查是否可用
     */
    public static boolean isAvailable() {
        return sInitialized && new File(sFfmpegPath).exists();
    }

    /**
     * 合并两个视频
     */
    public static boolean mergeVideos(String video1, String video2, String output) {
        if (!isAvailable()) {
            Log.e(TAG, "未初始化");
            return false;
        }

        try {
            // 创建 concat 列表
            String listFile = output + ".txt";
            FileWriter fw = new FileWriter(listFile);
            fw.write("file '" + video1 + "'\n");
            fw.write("file '" + video2 + "'\n");
            fw.close();

            // 构建命令
            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -f concat -safe 0");
            cmd.append(" -i \"").append(listFile).append("\"");
            cmd.append(" -c copy");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");

            Log.i(TAG, "执行: " + cmd.toString());

            // 执行
            ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", cmd.toString());
            pb.redirectErrorStream(true);
            Process p = pb.start();

            boolean finished = p.waitFor(300, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                Log.e(TAG, "超时");
                new File(listFile).delete();
                return false;
            }

            int exitCode = p.exitValue();
            new File(listFile).delete();

            if (exitCode == 0 && new File(output).exists()) {
                Log.i(TAG, "合并成功: " + output);
                return true;
            }

            Log.e(TAG, "合并失败，返回码: " + exitCode);
            return false;
        } catch (Exception e) {
            Log.e(TAG, "异常: " + e.getMessage());
            return false;
        }
    }
}
