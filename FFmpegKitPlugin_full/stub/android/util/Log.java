package android.util;
public class Log {
    public static int i(String t, String m) { System.out.println("[I][" + t + "] " + m); return 0; }
    public static int e(String t, String m) { System.err.println("[E][" + t + "] " + m); return 0; }
}
