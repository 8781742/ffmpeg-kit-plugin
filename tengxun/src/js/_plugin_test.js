logi("=== FFmpegPlugin Test ===");

// Load plugin
loadDex("/sdcard/Download/FFmpegPlugin.apk");
logi("Plugin loaded");

// Check availability
var available = com.ffmpeg.plugin.FFmpegPlugin.isAvailable();
logi("Available: " + available);

if (available) {
    var path = com.ffmpeg.plugin.FFmpegPlugin.getFfmpegPath();
    logi("Path: " + path);
    
    // Test merge
    var concatFile = "/sdcard/Download/抖音下载/concat.txt";
    if (file.exists(concatFile)) {
        var content = file.readFile(concatFile);
        var files = [];
        var lines = content.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/file '([^']+)'/);
            if (m) files.push(m[1]);
        }
        
        if (files.length >= 2) {
            logi("Testing merge: " + files[0].substring(files[0].lastIndexOf('/')+1));
            var result = com.ffmpeg.plugin.FFmpegPlugin.mergeTwoVideos(
                files[0], files[1], 
                "/sdcard/Download/抖音下载/plugin_success.mp4"
            );
            logi("Result: " + result);
            
            if (result && file.exists("/sdcard/Download/抖音下载/plugin_success.mp4")) {
                logi("SUCCESS: " + file.size("/sdcard/Download/抖音下载/plugin_success.mp4") + " bytes");
            }
        }
    }
} else {
    logi("FFmpeg not available, checking paths...");
    var p = com.ffmpeg.plugin.FFmpegPlugin.getFfmpegPath();
    logi("Plugin path: " + p);
}
