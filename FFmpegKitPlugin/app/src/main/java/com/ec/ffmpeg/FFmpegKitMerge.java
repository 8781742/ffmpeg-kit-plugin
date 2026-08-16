package com.ec.ffmpeg;

import android.util.Log;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.ReturnCode;

import java.io.FileWriter;
import java.io.File;

/**
 * FFmpegKit 视频合并插件
 *
 * 用法：
 *   loadDex("/sdcard/ffmpeg_plugin/FFmpegKitMerge.dex");
 *   com.ec.ffmpeg.FFmpegKitMerge.mergeVideos(v1, v2, output);
 */
public class FFmpegKitMerge {

    private static final String TAG = "FFmpegKitMerge";
    private static boolean sInitialized = false;

    // ============================================================
    // 公共 API
    // ============================================================

    /**
     * 检查 FFmpegKit 是否可用
     * @return true=可用
     */
    public static boolean isAvailable() {
        if (sInitialized) return true;
        try {
            FFmpegKit.execute("-version");
            sInitialized = true;
            Log.i(TAG, "FFmpegKit 初始化成功");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "FFmpegKit 初始化失败: " + e.getMessage());
            return false;
        }
    }

    /**
     * 合并两个视频（stream copy，速度快）
     * @param video1     第一个视频
     * @param video2     第二个视频
     * @param outputPath 输出路径
     * @return true=成功 false=失败
     */
    public static boolean mergeVideos(String video1, String video2, String outputPath) {
        if (!isAvailable()) {
            Log.e(TAG, "插件未初始化");
            return false;
        }

        try {
            String listFile = createConcatList(video1, video2);
            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + outputPath + "\" -y";

            Log.i(TAG, "合并: " + new File(video1).getName() + " + " + new File(video2).getName());

            FFmpegKit.execute(command);

            int rc = FFmpegKit.getSessionLastReturnCode();
            boolean success = ReturnCode.isSuccess(rc);

            // 清理临时文件
            new File(listFile).delete();

            if (success) {
                Log.i(TAG, "合并成功: " + outputPath);
            } else {
                Log.e(TAG, "合并失败，返回码: " + rc);
            }

            return success;
        } catch (Exception e) {
            Log.e(TAG, "合并异常: " + e.getMessage());
            return false;
        }
    }

    /**
     * 合并多个视频
     * @param output 输出路径
     * @param videos 视频路径数组（至少2个）
     * @return true=成功
     */
    public static boolean mergeVideos(String output, String... videos) {
        if (!isAvailable()) return false;
        if (videos == null || videos.length < 2) {
            Log.e(TAG, "至少需要2个视频");
            return false;
        }

        try {
            String listFile = createConcatListMulti(videos);
            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";

            Log.i(TAG, "合并 " + videos.length + " 个视频...");

            FFmpegKit.execute(command);

            int rc = FFmpegKit.getSessionLastReturnCode();
            boolean success = ReturnCode.isSuccess(rc);

            new File(listFile).delete();

            if (success) {
                Log.i(TAG, "合并成功: " + output);
            } else {
                Log.e(TAG, "合并失败，返回码: " + rc);
            }

            return success;
        } catch (Exception e) {
            Log.e(TAG, "合并异常: " + e.getMessage());
            return false;
        }
    }

    /**
     * 提取音频
     * @param video  输入视频
     * @param output 输出音频路径
     * @return true=成功
     */
    public static boolean extractAudio(String video, String output) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            String command = "-i \"" + video + "\" -vn -acodec copy \"" + output + "\" -y";
            FFmpegKit.execute(command);
            return ReturnCode.isSuccess(FFmpegKit.getSessionLastReturnCode());
        } catch (Exception e) {
            Log.e(TAG, "extractAudio 异常: " + e.getMessage());
            return false;
        }
    }

    /**
     * 裁剪视频
     * @param video     输入视频
     * @param output    输出路径
     * @param startTime 开始时间（秒）
     * @param duration  时长（秒）
     * @return true=成功
     */
    public static boolean trimVideo(String video, String output, double startTime, double duration) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            String command = "-ss " + startTime + " -i \"" + video + "\" -t " + duration + " -c copy \"" + output + "\" -y";
            FFmpegKit.execute(command);
            return ReturnCode.isSuccess(FFmpegKit.getSessionLastReturnCode());
        } catch (Exception e) {
            Log.e(TAG, "trimVideo 异常: " + e.getMessage());
            return false;
        }
    }

    /**
     * 获取 FFmpeg 版本信息
     * @return 版本字符串
     */
    public static String getVersion() {
        try {
            FFmpegKit.execute("-version");
            // 返回空字符串，实际版本信息需要通过 callback 获取
            return "FFmpegKit available";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    // ============================================================
    // 内部方法
    // ============================================================

    /**
     * 创建 concat 列表文件
     */
    private static String createConcatList(String v1, String v2) {
        String listFile = v1 + ".concat.txt";
        try {
            FileWriter fw = new FileWriter(listFile);
            fw.write("file '" + v1 + "'\n");
            fw.write("file '" + v2 + "'\n");
            fw.close();
        } catch (Exception e) {
            Log.e(TAG, "创建列表文件失败: " + e.getMessage());
        }
        return listFile;
    }

    /**
     * 创建多视频 concat 列表
     */
    private static String createConcatListMulti(String... videos) {
        String listFile = "/sdcard/Download/concat_multi.txt";
        try {
            FileWriter fw = new FileWriter(listFile);
            for (String v : videos) {
                fw.write("file '" + v + "'\n");
            }
            fw.close();
        } catch (Exception e) {
            Log.e(TAG, "创建列表文件失败: " + e.getMessage());
        }
        return listFile;
    }
}
