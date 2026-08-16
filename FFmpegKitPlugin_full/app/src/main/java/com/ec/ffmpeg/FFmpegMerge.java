package com.ec.ffmpeg;

import android.util.Log;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.ReturnCode;

import java.io.File;

public class FFmpegMerge {
    private static final String TAG = "FFmpegMerge";

    public static boolean isAvailable() {
        try {
            FFmpegKit.execute("-version");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error: " + e.getMessage());
            return false;
        }
    }

    public static boolean mergeVideos(String video1, String video2, String output) {
        if (!new File(video1).exists()) {
            Log.e(TAG, "File not found: " + video1);
            return false;
        }
        if (!new File(video2).exists()) {
            Log.e(TAG, "File not found: " + video2);
            return false;
        }

        try {
            String listFile = output + ".txt";
            java.io.FileWriter fw = new java.io.FileWriter(listFile);
            fw.write("file '" + video1 + "'\n");
            fw.write("file '" + video2 + "'\n");
            fw.close();

            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";
            Log.i(TAG, "Merging: " + new File(video1).getName());

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
        if (videos == null || videos.length < 2) {
            Log.e(TAG, "Need at least 2 videos");
            return false;
        }

        try {
            String listFile = "/sdcard/Download/concat_multi.txt";
            java.io.FileWriter fw = new java.io.FileWriter(listFile);
            for (String v : videos) {
                fw.write("file '" + v + "'\n");
            }
            fw.close();

            String command = "-f concat -safe 0 -i \"" + listFile + "\" -c copy \"" + output + "\" -y";
            Log.i(TAG, "Merging " + videos.length + " videos");

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
}
