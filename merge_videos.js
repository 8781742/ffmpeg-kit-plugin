// PC端视频合并脚本 - 从设备拉取视频、合并、推回
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DL_DIR = '/sdcard/Download/抖音下载/.download/';
const OUTPUT_DIR = '/sdcard/Download/抖音下载/merged/';

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', timeout: 30000 }).trim();
    } catch(e) {
        return '';
    }
}

function getFileSize(path) {
    try {
        const r = run('adb shell stat -c %s "' + path + '" 2>/dev/null || echo 0');
        return parseInt(r) || 0;
    } catch(e) { return 0; }
}

console.log('查找已下载视频...');
const ls = run('adb shell ls ' + DL_DIR + '*.mp4 2>/dev/null');
if (!ls) { console.log('没有已下载的视频'); process.exit(1); }

const files = ls.split('\n').filter(f => f.trim());
console.log('找到 ' + files.length + ' 个视频');

// 按名称排序配对
files.sort();
for (let i = 0; i + 1 < files.length; i += 2) {
    const v1 = files[i];
    const v2 = files[i+1];
    console.log('合并: ' + path.basename(v1) + ' + ' + path.basename(v2));
    
    // 用 ffmpeg 合并
    const outBase = path.basename(v1).replace(/ep\d+_/,'') + '_合并.mp4';
    const out = OUTPUT_DIR + outBase;
    
    const cmd = `ffmpeg -i "concat:${v1}|${v2}" -c copy "${out}" -y`;
    try {
        execSync(cmd, { stdio: 'pipe', timeout: 60000 });
        console.log('  成功: ' + outBase);
    } catch(e) {
        console.log('  失败: ' + e.message.substring(0,50));
    }
}
console.log('完成');
