// 测试 shell.execAgentCommand
logi("=== Test shell.execAgentCommand ===");

// 测试 1: 简单命令
var r1 = shell.execAgentCommand("echo hello");
logi("echo: " + r1);

// 测试 2: ffmpeg 版本
var r2 = shell.execAgentCommand("/data/local/tmp/ffmpeg -version 2>&1 | head -1");
logi("ffmpeg version: " + (r2 ? r2.substring(0, 50) : "null"));

// 测试 3: 检查文件
var r3 = shell.execAgentCommand("ls -lh /data/local/tmp/ffmpeg");
logi("ls: " + (r3 ? r3.substring(0, 50) : "null"));

// 测试 4: 执行 ffmpeg 合并
var r4 = shell.execAgentCommand("/data/local/tmp/ffmpeg -version");
logi("ffmpeg -version: " + (r4 ? "OK (" + r4.length + " chars)" : "null"));

logi("=== Test Complete ===");
