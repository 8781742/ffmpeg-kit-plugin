// ============================================================
// 文件: downloader.js
// 描述: 并发下载引擎
// ============================================================

var downloadTasks = [];
var downloadCompleted = 0;
var downloadTotal = 0;
var isDownloading = false;

/**
 * 下载单个文件（带进度）
 */
function downloadFile(url, filePath, fileName, callback) {
    try {
        ensureDir(filePath.substring(0, filePath.lastIndexOf("/")));

        var headers = getHeaders(cookie);
        // 使用流式下载
        var response = http.get(url, {
            headers: headers,
            timeout: 30000,
            stream: true,
            path: filePath
        });

        if (response.statusCode == 200) {
            var size = file.size(filePath);
            logd("下载完成: " + fileName + " (" + formatSize(size) + ")");
            downloadCompleted++;
            if (callback) callback(true, filePath);
        } else {
            loge("下载失败: " + fileName + " HTTP " + response.statusCode);
            if (callback) callback(false, null);
        }
    } catch(e) {
        loge("下载异常: " + fileName + " " + e);
        if (callback) callback(false, null);
    }
}

/**
 * 解析并下载单个作品
 */
function downloadAweme(awemeDict, savePath, callback) {
    try {
        var fileName = awemeDict.create_time + "_" + replaceStr(awemeDict.desc || "未命名");
        var awemePath = savePath + "/" + fileName;
        ensureDir(awemePath);

        // 下载视频或图集
        if (awemeDict.awemeType == 0) {
            // 视频
            var videoUrl = awemeDict.video && awemeDict.video.play_addr &&
            awemeDict.video.play_addr.url_list &&
            awemeDict.video.play_addr.url_list.length > 0 ?
                awemeDict.video.play_addr.url_list[0] : null;
            if (videoUrl) {
                var videoPath = awemePath + "/" + fileName + "_video.mp4";
                if (!file.exists(videoPath)) {
                    downloadFile(videoUrl, videoPath, fileName + "_video.mp4", callback);
                } else {
                    logd("视频已存在: " + fileName);
                    if (callback) callback(true, videoPath);
                }
            }
        } else if (awemeDict.awemeType == 1) {
            // 图集
            if (awemeDict.images && awemeDict.images.length > 0) {
                for (var i = 0; i < awemeDict.images.length; i++) {
                    var imgUrl = awemeDict.images[i].url_list && awemeDict.images[i].url_list[0];
                    if (imgUrl) {
                        var imgPath = awemePath + "/" + fileName + "_image_" + i + ".jpeg";
                        if (!file.exists(imgPath)) {
                            downloadFile(imgUrl, imgPath, fileName + "_image_" + i + ".jpeg", null);
                        }
                    }
                }
                if (callback) callback(true, awemePath);
            }
        }

        // 下载音乐
        if (awemeDict.music && awemeDict.music.play_url &&
            awemeDict.music.play_url.url_list && awemeDict.music.play_url.url_list.length > 0) {
            var musicUrl = awemeDict.music.play_url.url_list[0];
            var musicName = replaceStr(awemeDict.music.title || "音乐");
            var musicPath = awemePath + "/" + fileName + "_music_" + musicName + ".mp3";
            if (!file.exists(musicPath)) {
                downloadFile(musicUrl, musicPath, fileName + "_music.mp3", null);
            }
        }

        // 下载封面
        if (awemeDict.video && awemeDict.video.cover &&
            awemeDict.video.cover.url_list && awemeDict.video.cover.url_list.length > 0) {
            var coverUrl = awemeDict.video.cover.url_list[0];
            var coverPath = awemePath + "/" + fileName + "_cover.jpeg";
            if (!file.exists(coverPath)) {
                downloadFile(coverUrl, coverPath, fileName + "_cover.jpeg", null);
            }
        }

        // 保存 JSON 元数据
        var jsonPath = awemePath + "/" + fileName + "_result.json";
        if (!file.exists(jsonPath)) {
            file.write(jsonPath, JSON.stringify(awemeDict, null, 2));
        }

    } catch(e) {
        loge("下载作品出错: " + e);
        if (callback) callback(false, null);
    }
}

/**
 * 批量下载（并发）
 */
function batchDownload(awemeList, savePath, maxThread, cookie, onProgress, onComplete) {
    if (!awemeList || awemeList.length == 0) {
        toast("没有可下载的视频");
        return;
    }

    isDownloading = true;
    downloadTotal = awemeList.length;
    downloadCompleted = 0;
    var downloadedCount = 0;

    // 初始化数据库（去重）
    var db = initDB();

    // 过滤已下载的
    var toDownload = [];
    for (var i = 0; i < awemeList.length; i++) {
        var item = awemeList[i];
        var secUid = item.author && item.author.sec_uid ? item.author.sec_uid : "";
        var awemeId = item.aweme_id || "";
        if (secUid && awemeId && db) {
            if (isPostDownloaded(db, secUid, awemeId)) {
                logd("已下载跳过: " + awemeId);
                continue;
            }
        }
        toDownload.push(item);
    }

    if (toDownload.length == 0) {
        toast("所有视频已下载过");
        isDownloading = false;
        if (onComplete) onComplete(awemeList.length, 0);
        return;
    }

    toast("开始下载 " + toDownload.length + " 个视频");

    // 使用线程池并发下载
    var threadPool = thread.pool();
    var maxConcurrent = maxThread || 5;

    for (var i = 0; i < toDownload.length; i++) {
        (function(index) {
            threadPool.exec(function() {
                var item = toDownload[index];
                downloadAweme(item, savePath, function(success, path) {
                    downloadedCount++;
                    // 插入数据库
                    if (success && item.author && item.author.sec_uid && item.aweme_id) {
                        insertPost(db, item.author.sec_uid, item.aweme_id, item);
                    }
                    if (onProgress) {
                        onProgress(downloadedCount, toDownload.length, item, success);
                    }
                    if (downloadedCount >= toDownload.length) {
                        isDownloading = false;
                        toast("下载完成！共 " + downloadedCount + " 个");
                        if (onComplete) onComplete(awemeList.length, downloadedCount);
                    }
                });
            });
        })(i);
    }

    // 等待所有任务完成
    threadPool.join();
}


// var url = "https://v11-weba.douyinvod.com/7d7d96dd4810d13b4967203e8e0ad890/6a7d7b47/video/tos/cn/tos-cn-ve-15/oUCPAUWERLQfNBIgQUIG2NemIuMRA76fBGIvL7/?a=6383&ch=10010&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C3&cv=1&br=1237&bt=1237&cs=0&ds=4&ft=AJkeU_TERR0sTHC4NDl2Nc0iPMgzbL-VYGRU_4.0ccGJNv7TGW&mime_type=video_mp4&qs=0&rc=ZTk0N2Q5ZWdoZjhoZzw1N0BpamVucXc5cnc3OzMzNGkzM0AtYi4zLS00NWIxYV9jMzAyYSM2X3NlMmRzYjFhLS1kLTBzcw%3D%3D&btag=c0000e00028000&cquery=100H_100K_100o_101r_100B&dy_q=1786597446&feature_id=37f92ebd2877ae8e7eba995d406c5150&l=20260813130406AD7FB94BB6FCBD403878";
// var x = http.downloadFile(url, "/sdcard/DCIM/Camera/VID_20260128_142244.mp4", 60 * 1000, {"User-Agent": "test"});
// logi(x);