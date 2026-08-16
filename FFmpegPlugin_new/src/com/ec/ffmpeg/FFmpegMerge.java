package com.ec.ffmpeg;

import java.io.File;
import java.io.FileWriter;
import java.util.concurrent.TimeUnit;

public class FFmpegMerge {
    private static final String TAG = "FFmpegMerge";
    private static String sFfmpegPath = "/data/local/tmp/ffmpeg";
    private static boolean sInitialized = false;

    public static boolean init(String ffmpegPath) {
        if (ffmpegPath != null && ffmpegPath.length() > 0) {
            sFfmpegPath = ffmpegPath;
        }
        sInitialized = true;
        System.out.println("[I][" + TAG + "] Initialized: " + sFfmpegPath);
        return true;
    }

    public static boolean isAvailable() {
        return sInitialized && new File(sFfmpegPath).exists();
    }

    public static String getFfmpegPath() {
        return sFfmpegPath;
    }

    public static boolean mergeVideos(String video1, String video2, String output) {
        if (!isAvailable()) {
            System.err.println("[E][" + TAG + "] Not initialized");
            return false;
        }

        try {
            String listFile = output + ".txt";
            FileWriter fw = new FileWriter(listFile);
            fw.write("file '" + video1 + "'\n");
            fw.write("file '" + video2 + "'\n");
            fw.close();

            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -f concat -safe 0");
            cmd.append(" -i \"").append(listFile).append("\"");
            cmd.append(" -c copy");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");

            System.out.println("[I][" + TAG + "] Merging: " + new File(video1).getName());

            ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", cmd.toString());
            pb.redirectErrorStream(true);
            Process p = pb.start();

            boolean finished = p.waitFor(300, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                new File(listFile).delete();
                System.err.println("[E][" + TAG + "] Timeout");
                return false;
            }

            int exitCode = p.exitValue();
            new File(listFile).delete();

            if (exitCode == 0 && new File(output).exists()) {
                System.out.println("[I][" + TAG + "] Success: " + output);
                return true;
            }

            System.err.println("[E][" + TAG + "] Failed, rc: " + exitCode);
            return false;
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] Exception: " + e.getMessage());
            return false;
        }
    }
}
