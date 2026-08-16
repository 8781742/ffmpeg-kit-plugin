package com.ec.ffmpeg;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

public class FFmpegMerge {
    public static final String TAG = "FFmpegMerge";
    public static final String DEFAULT_FFMPEG_PATH = "/sdcard/Download/ffmpeg-bin/ffmpeg";
    public static final int TIMEOUT_SEC = 300;

    private static String sFfmpegPath = null;
    private static boolean sInitialized = false;

    public static boolean init(String ffmpegPath) {
        if (ffmpegPath != null && ffmpegPath.length() > 0) {
            sFfmpegPath = ffmpegPath;
        } else {
            sFfmpegPath = DEFAULT_FFMPEG_PATH;
        }
        sInitialized = true;
        System.out.println("[I][" + TAG + "] initialized: " + sFfmpegPath);
        return true;
    }

    public static String getFfmpegPath() {
        return sFfmpegPath;
    }

    public static boolean isAvailable() {
        return sInitialized && sFfmpegPath != null;
    }

    public static boolean mergeVideos(String video1, String video2, String outputPath) {
        if (!isAvailable()) {
            System.err.println("[E][" + TAG + "] not initialized");
            return false;
        }
        File f1 = new File(video1);
        File f2 = new File(video2);
        if (!f1.exists()) {
            System.err.println("[E][" + TAG + "] file not found: " + video1);
            return false;
        }
        if (!f2.exists()) {
            System.err.println("[E][" + TAG + "] file not found: " + video2);
            return false;
        }

        try {
            String listFile = outputPath + ".txt";
            FileWriter fw = new FileWriter(listFile);
            fw.write("file '" + video1 + "'\nfile '" + video2 + "'\n");
            fw.close();

            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -f concat -safe 0");
            cmd.append(" -i \"").append(listFile).append("\"");
            cmd.append(" -c copy");
            cmd.append(" \"").append(outputPath).append("\"");
            cmd.append(" -y");

            System.out.println("[I][" + TAG + "] merging: " + f1.getName() + " + " + f2.getName());
            boolean ok = execShellCommand(cmd.toString(), (long) TIMEOUT_SEC * 1000);
            new File(listFile).delete();

            File out = new File(outputPath);
            if (ok && out.exists() && out.length() > 1024) {
                System.out.println("[I][" + TAG + "] OK: " + outputPath + " (" + formatSize(out.length()) + ")");
                return true;
            }
            System.err.println("[E][" + TAG + "] merge failed");
            return false;
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] exception: " + e.getMessage());
            return false;
        }
    }

    public static boolean mergeVideos(String output, String... videos) {
        if (!isAvailable()) return false;
        if (videos == null || videos.length < 2) {
            System.err.println("[E][" + TAG + "] need at least 2 videos");
            return false;
        }
        for (String v : videos) {
            if (!new File(v).exists()) {
                System.err.println("[E][" + TAG + "] file not found: " + v);
                return false;
            }
        }
        try {
            StringBuilder fileList = new StringBuilder();
            for (String v : videos) {
                fileList.append("file '").append(v).append("'\n");
            }
            String listFile = output + ".txt";
            FileWriter fw = new FileWriter(listFile);
            fw.write(fileList.toString());
            fw.close();

            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -f concat -safe 0");
            cmd.append(" -i \"").append(listFile).append("\"");
            cmd.append(" -c copy");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");

            System.out.println("[I][" + TAG + "] merging " + videos.length + " videos...");
            boolean ok = execShellCommand(cmd.toString(), (long) TIMEOUT_SEC * 1000);
            new File(listFile).delete();
            File out = new File(output);
            return ok && out.exists() && out.length() > 1024;
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] exception: " + e.getMessage());
            return false;
        }
    }

    public static boolean extractAudio(String video, String output) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -i \"").append(video).append("\"");
            cmd.append(" -vn -acodec copy");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");
            return execShellCommand(cmd.toString(), 60000L);
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] extractAudio: " + e.getMessage());
            return false;
        }
    }

    public static boolean trimVideo(String video, String output, double startTime, double duration) {
        if (!isAvailable() || !new File(video).exists()) return false;
        try {
            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -ss ").append(startTime);
            cmd.append(" -i \"").append(video).append("\"");
            cmd.append(" -t ").append(duration);
            cmd.append(" -c copy");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");
            return execShellCommand(cmd.toString(), 60000L);
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] trimVideo: " + e.getMessage());
            return false;
        }
    }

    public static String getVideoInfo(String video) {
        if (!isAvailable() || !new File(video).exists()) return null;
        try {
            String probe = sFfmpegPath.replace("ffmpeg", "ffprobe");
            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(probe).append("\"");
            cmd.append(" -i \"").append(video).append("\"");
            cmd.append(" -hide_banner");
            cmd.append(" -print_format json");
            cmd.append(" -show_format");
            cmd.append(" -show_streams");
            cmd.append(" 2>&1");
            return execShellCommandAndGetOutput(cmd.toString(), 10000L);
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean compressVideo(String video, String output,
                                         int maxWidth, int maxHeight, int crf) {
        if (!isAvailable() || !new File(video).exists()) return false;
        crf = Math.max(18, Math.min(28, crf));
        try {
            StringBuilder cmd = new StringBuilder();
            cmd.append("\"").append(sFfmpegPath).append("\"");
            cmd.append(" -i \"").append(video).append("\"");
            if (maxWidth > 0 && maxHeight > 0) {
                cmd.append(" -vf \"scale=").append(maxWidth).append(":").append(maxHeight).append("\"");
            }
            cmd.append(" -c:v libx264 -crf ").append(crf);
            cmd.append(" -c:a aac");
            cmd.append(" \"").append(output).append("\"");
            cmd.append(" -y");
            return execShellCommand(cmd.toString(), 300000L);
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] compressVideo: " + e.getMessage());
            return false;
        }
    }

    private static boolean execShellCommand(String cmd, long timeoutMs) {
        try {
            ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", cmd);
            pb.redirectErrorStream(true);
            Process p = pb.start();
            boolean finished = p.waitFor(timeoutMs / 1000, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                System.err.println("[E][" + TAG + "] timeout: " + cmd.substring(0, Math.min(80, cmd.length())));
                return false;
            }
            int exitCode = p.exitValue();
            if (exitCode != 0) {
                System.err.println("[E][" + TAG + "] exit code: " + exitCode);
            }
            return exitCode == 0;
        } catch (Exception e) {
            System.err.println("[E][" + TAG + "] exec exception: " + e.getMessage());
            return false;
        }
    }

    private static String execShellCommandAndGetOutput(String cmd, long timeoutMs) {
        try {
            ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", cmd);
            pb.redirectErrorStream(true);
            Process p = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            p.waitFor(timeoutMs / 1000, TimeUnit.SECONDS);
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private static String formatSize(long bytes) {
        if (bytes <= 0) return "0 B";
        String[] units = {"B", "KB", "MB", "GB"};
        int i = 0;
        double size = bytes;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return String.format("%.1f %s", size, units[i]);
    }
}
