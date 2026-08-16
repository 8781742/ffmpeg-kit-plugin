package com.ec.ffmpeg;

import android.util.Log;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.ReturnCode;

import java.io.FileWriter;
import java.io.File;

public class FFmpegMerge {

    private static final String TAG = "FFmpegMerge";
    private static boolean sInitialized = false;

    public static boolean isAvailable() {
        if (sInitialized) return true;
        try {
            FFmpegKit.execute("-version");
            sInitialized = true;
            Log.i(TAG, "FFmpegKit initialized");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Init failed: " + e.getMessage());
            return false;
        }
    }

    public static boolean mergeVideos(String video1, String video2, String output) {
        if (!isAvailable()) {
            Log.e(TAG, "Not initialized");
            return false;
        }

        try {
            String listFile = createConcatList(video1, video2);
            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";

            Log.i(TAG, "Merging: " + new File(video1).getName() + " + " + new File(video2).getName());

            FFmpegKit.execute(command);

            int rc = FFmpegKit.getSessionLastReturnCode();
            boolean success = ReturnCode.isSuccess(rc);

            new File(listFile).delete();

            if (success) {
                Log.i(TAG, "Success: " + output);
            } else {
                Log.e(TAG, "Failed, rc: " + rc);
            }

            return success;
        } catch (Exception e) {
            Log.e(TAG, "Exception: " + e.getMessage());
            return false;
        }
    }

    public static boolean mergeVideos(String output, String... videos) {
        if (!isAvailable()) return false;
        if (videos == null || videos.length < 2) {
            Log.e(TAG, "Need at least 2 videos");
            return false;
        }

        try {
            String listFile = createConcatListMulti(videos);
            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";

            Log.i(TAG, "Merging " + videos.length + " videos...");

            FFmpegKit.execute(command);

            int rc = FFmpegKit.getSessionLastReturnCode();
            boolean success = ReturnCode.isSuccess(rc);

            new File(listFile).delete();

            if (success) {
                Log.i(TAG, "Success: " + output);
            } else {
                Log.e(TAG, "Failed, rc: " + rc);
            }

            return success;
        } catch (Exception e) {
            Log.e(TAG, "Exception: " + e.getMessage());
            return false;
        }
    }

    public static boolean extractAudio(String video, String output) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            String command = "-i \"" + video + "\" -vn -acodec copy \"" + output + "\" -y";
            FFmpegKit.execute(command);
            return ReturnCode.isSuccess(FFmpegKit.getSessionLastReturnCode());
        } catch (Exception e) {
            Log.e(TAG, "extractAudio error: " + e.getMessage());
            return false;
        }
    }

    public static boolean trimVideo(String video, String output, double startTime, double duration) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            String command = "-ss " + startTime + " -i \"" + video + "\" -t " + duration + " -c copy \"" + output + "\" -y";
            FFmpegKit.execute(command);
            return ReturnCode.isSuccess(FFmpegKit.getSessionLastReturnCode());
        } catch (Exception e) {
            Log.e(TAG, "trimVideo error: " + e.getMessage());
            return false;
        }
    }

    private static String createConcatList(String v1, String v2) {
        String listFile = v1 + ".concat.txt";
        try {
            FileWriter fw = new FileWriter(listFile);
            fw.write("file '" + v1 + "'\n");
            fw.write("file '" + v2 + "'\n");
            fw.close();
        } catch (Exception e) {
            Log.e(TAG, "Create list failed: " + e.getMessage());
        }
        return listFile;
    }

    private static String createConcatListMulti(String... videos) {
        String listFile = "/sdcard/Download/concat_multi.txt";
        try {
            FileWriter fw = new FileWriter(listFile);
            for (String v : videos) {
                fw.write("file '" + v + "'\n");
            }
            fw.close();
        } catch (Exception e) {
            Log.e(TAG, "Create list failed: " + e.getMessage());
        }
        return listFile;
    }
}
