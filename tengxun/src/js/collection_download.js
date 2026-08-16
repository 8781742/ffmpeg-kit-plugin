// ============================================================
// 合集下载模块 — 筛选、配对、下载、合并
// ============================================================

/**
 * 按合集名称筛选视频
 * @param {Array} awemeList - convertAweme 转换后的视频列表
 * @param {string} mixName - 合集名称（精确匹配）
 * @returns {Array} 匹配的视频列表
 */
function filterByMixName(awemeList, mixName) {
    var result = [];
    for (var i = 0; i < awemeList.length; i++) {
        var item = awemeList[i];
        if (item.mix_info && item.mix_info.mix_name === mixName) {
            result.push(item);
        }
    }
    logi("合集 [" + mixName + "] 匹配: " + result.length + " 个视频");
    return result;
}

/**
 * 获取所有合集名称
 * @param {Array} awemeList - 视频列表
 * @returns {Array} 去重后的合集名称列表 [{mix_id, mix_name}]
 */
function getAllMixNames(awemeList) {
    var seen = {};
    var result = [];
    for (var i = 0; i < awemeList.length; i++) {
        var mix = awemeList[i].mix_info;
        if (mix && mix.mix_id && !seen[mix.mix_id]) {
            seen[mix.mix_id] = true;
            result.push({
                mix_id: mix.mix_id,
                mix_name: mix.mix_name,
                total_episode: mix.updated_to_episode
            });
        }
    }
    logi("发现 " + result.length + " 个合集");
    for (var j = 0; j < result.length; j++) {
        logi("  - " + result[j].mix_name + " (ID:" + result[j].mix_id + ", " + result[j].total_episode + "集)");
    }
    return result;
}

/**
 * 按集数升序排列
 * @param {Array} awemeList - 同一合集的视频列表
 * @returns {Array} 排序后的视频列表
 */
function sortByEpisode(awemeList) {
    return awemeList.sort(function(a, b) {
        var epA = a.mix_info.current_episode || 0;
        var epB = b.mix_info.current_episode || 0;
        return epA - epB;
    });
}

/**
 * 生成配对 [[ep1, ep2], [ep3, ep4], ...]
 * @param {Array} sortedList - 按集数排好序的视频列表
 * @param {number} episodesPerMerge - 每组合并集数(默认2)
 * @returns {Array} 配对数组 [[video1, video2], [video3, video4], ...]
 */
function pairEpisodes(sortedList, episodesPerMerge) {
    episodesPerMerge = episodesPerMerge || 2;
    var pairs = [];
    var i = 0;
    while (i + episodesPerMerge <= sortedList.length) {
        var pair = [];
        for (var j = 0; j < episodesPerMerge; j++) {
            pair.push(sortedList[i + j]);
        }
        pairs.push(pair);
        i += episodesPerMerge;
    }
    // 落单的集数（不够一组）跳过
    if (i < sortedList.length) {
        logi("跳过落单集数: " + (sortedList.length - i) + " 集");
    }
    logi("生成 " + pairs.length + " 组配对 (每组" + episodesPerMerge + "集)");
    return pairs;
}

/**
 * 下载并合并一组视频
 * @param {Array} pair - [video1, video2]
 * @param {string} savePath - 保存路径
 * @param {string} mixName - 合集名称
 * @param {string} cookie - Cookie字符串
 * @param {Object} db - 数据库对象
 * @returns {string|null} 合并后的文件路径,失败返回null
 */
function downloadAndMergePair(pair, savePath, mixName, cookie, db) {
    var v1 = pair[0];
    var v2 = pair[1];
    var epStart = v1.mix_info.current_episode;
    var epEnd = v2.mix_info.current_episode;
    var mixId = v1.mix_info.mix_id;

    logi("处理: " + mixName + " 第" + epStart + "-" + epEnd + "集");

    // 检查数据库是否已完成
    if (db && isPairDownloaded(db, mixId, epStart, epEnd)) {
        logi("  已下载合并过,跳过");
        return null;  // 返回null表示跳过
    }

    // 下载两个视频
    var dlPath = ensureDir(savePath + ".download/");
    var videoPath1 = downloadSingleVideo(v1, dlPath, cookie);
    if (!videoPath1) {
        if (db) markPairFailed(db, mixId, epStart, epEnd, "下载第" + epStart + "集失败");
        return null;
    }

    var videoPath2 = downloadSingleVideo(v2, dlPath, cookie);
    if (!videoPath2) {
        if (db) markPairFailed(db, mixId, epStart, epEnd, "下载第" + epEnd + "集失败");
        // 清理已下载的video1
        try { file.deleteFile(videoPath1); } catch(e) {}
        return null;
    }

    // 合并
    var mergedName = getMergedFileName(mixName, epStart, epEnd);
    var mergedPath = mergeVideos(videoPath1, videoPath2, savePath, mergedName);

    if (!mergedPath) {
        if (db) markPairFailed(db, mixId, epStart, epEnd, "合并失败");
        return null;
    }

    // 合并成功,删除原始视频
    deleteOriginalVideos(videoPath1, videoPath2);

    // 记录数据库
    if (db) {
        insertPairDownloaded(db, mixId, mixName, epStart, epEnd, mergedPath);
    }

    return mergedPath;
}

/**
 * 下载单个视频
 * @param {Object} videoObj - convertAweme 转换后的视频对象
 * @param {string} saveDir - 保存目录
 * @param {string} cookie - Cookie
 * @returns {string|null} 下载后的文件路径
 */
function downloadSingleVideo(videoObj, saveDir, cookie) {
    var urlList = [];
    // 提取视频URL
    if (videoObj.video && videoObj.video.play_addr && videoObj.video.play_addr.url_list) {
        urlList = videoObj.video.play_addr.url_list;
    }

    if (urlList.length === 0) {
        loge("无视频URL: " + videoObj.desc);
        return null;
    }

    // 使用第一个URL下载
    var url = urlList[0];
    var ext = ".mp4";
    // 从URL推断扩展名
    if (url.indexOf(".mp4") !== -1) ext = ".mp4";
    else if (url.indexOf(".webm") !== -1) ext = ".webm";

    var ep = videoObj.mix_info.current_episode || 0;
    var fileName = "ep" + ep + "_" + videoObj.aweme_id + ext;
    var filePath = saveDir + fileName;

    // 检查是否已下载
    if (file.exists(filePath)) {
        logi("  视频已存在: " + fileName);
        return filePath;
    }

    logi("  下载: 第" + ep + "集 " + (videoObj.desc || ""));

    try {
        var httpClient = http.newHttpClient();
        var request = http.newRequest(url);
        // 添加请求头
        var headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 14; M2012K11C) AppleWebKit/537.36",
            "Referer": "https://www.douyin.com/",
            "Cookie": cookie || ""
        };
        for (var key in headers) {
            request.addHeader(key, headers[key]);
        }

        var response = httpClient.execute(request);
        if (response && response.statusCode() === 200) {
            var body = response.bodyBytes();
            file.writeFileBytes(filePath, body);
            logi("  下载完成: " + fileName + " (" + formatFileSize(body.length) + ")");
            return filePath;
        } else {
            loge("  下载失败 HTTP " + (response ? response.statusCode() : "no response"));
            return null;
        }
    } catch(e) {
        loge("  下载异常: " + e);
        return null;
    }
}

/**
 * 处理单个合集：下载+合并所有配对
 * @param {string} mixName - 合集名称
 * @param {Array} allAwemeList - 所有视频列表
 * @param {Object} config - 配置 {savePath, cookie, episodesPerMerge, perMixLimit, db}
 * @param {Function} onProgress - 进度回调(completed, total, mergedFile)
 * @returns {Array} 合并后的文件路径列表
 */
function processCollection(mixName, allAwemeList, config, onProgress) {
    logi("===== 处理合集: " + mixName + " =====");

    var savePath = config.savePath || "/sdcard/Download/抖音下载/";
    var cookie = config.cookie || "";
    var epsPerMerge = config.episodesPerMerge || 2;
    var perMixLimit = config.perMixLimit || 999;
    var db = config.db;

    // 1. 筛选
    var mixVideos = filterByMixName(allAwemeList, mixName);
    if (mixVideos.length === 0) {
        logi("合集 [" + mixName + "] 没有视频");
        return [];
    }

    // 2. 排序
    mixVideos = sortByEpisode(mixVideos);

    // 3. 配对
    var pairs = pairEpisodes(mixVideos, epsPerMerge);

    // 4. 下载+合并
    var mergedFiles = [];
    var total = Math.min(pairs.length, perMixLimit);

    for (var i = 0; i < pairs.length && mergedFiles.length < perMixLimit; i++) {
        var pair = pairs[i];
        var mergedFile = downloadAndMergePair(pair, savePath, mixName, cookie, db);

        if (mergedFile) {
            mergedFiles.push(mergedFile);
            logi("  [" + (i+1) + "/" + pairs.length + "] 完成: " + mergedFile);
        }

        if (onProgress) {
            onProgress(i + 1, total, mergedFile);
        }
    }

    logi("合集 [" + mixName + "] 处理完成: " + mergedFiles.length + " 个合并视频");
    return mergedFiles;
}

/**
 * 主循环: 处理所有合集 → 上传
 * @param {Array} allAwemeList - 所有视频
 * @param {Object} config - 配置对象 {mixNames, savePath, cookie, episodesPerMerge, perMixLimit, titleTemplate, db}
 * @param {Function} onProgress - 总体进度回调
 */
function mainUploadLoop(allAwemeList, config, onProgress) {
    logi("===== 开始主循环 =====");

    var mixNames = config.mixNames || [];
    var db = config.db;

    // 如果没有指定合集名称,自动获取全部
    if (mixNames.length === 0) {
        var allMixes = getAllMixNames(allAwemeList);
        for (var m = 0; m < allMixes.length; m++) {
            mixNames.push(allMixes[m].mix_name);
        }
    }

    var allMergedFiles = [];
    var totalMixes = mixNames.length;

    for (var i = 0; i < totalMixes; i++) {
        var mixName = mixNames[i];
        logi("【合集 " + (i+1) + "/" + totalMixes + "】" + mixName);

        // 阶段2: 下载+合并
        var mergedFiles = processCollection(mixName, allAwemeList, config,
            function(completed, total, mergedFile) {
                if (onProgress) {
                    onProgress("download", mixName, completed, total, mergedFile);
                }
            }
        );

        allMergedFiles = allMergedFiles.concat(mergedFiles);

        // 阶段3: 上传腾讯视频
        for (var j = 0; j < mergedFiles.length; j++) {
            var mf = mergedFiles[j];
            if (db && isFileUploaded(db, mf)) {
                logi("  已上传,跳过: " + mf);
                continue;
            }

            // 生成标题
            var title = buildTitle(config.titleTemplate, mixName, mf);

            logi("  上传: " + title);
            var uploadOk = uploadToTencentVideo(mf, title);

            if (uploadOk) {
                if (db) {
                    insertUploadRecord(db, mf, "", mixName, 0, 0, title);
                }
            } else {
                if (db) {
                    markUploadFailed(db, mf, "上传失败");
                }
                logi("  上传失败,跳过: " + mf);
            }

            if (onProgress) {
                onProgress("upload", mixName, j + 1, mergedFiles.length, mf);
            }
        }
    }

    logi("===== 主循环结束 =====");
    logi("合并视频总数: " + allMergedFiles.length);
    return allMergedFiles;
}

/**
 * 根据模板生成标题
 * @param {string} template - 模板字符串，支持 {mix_name}, {start}, {end}
 * @param {string} mixName - 合集名称
 * @param {string} mergedFile - 合并文件路径(从中提取集数信息)
 * @returns {string} 生成的标题
 */
function buildTitle(template, mixName, mergedFile) {
    var title = template || "{mix_name}_第{start}-{end}集";

    // 从文件名提取集数: xxx_第1-2集.mp4
    var epStart = 0;
    var epEnd = 0;
    var match = mergedFile.match(/第(\d+)-(\d+)集/);
    if (match) {
        epStart = parseInt(match[1]);
        epEnd = parseInt(match[2]);
    }

    title = title.replace(/\{mix_name\}/g, mixName);
    title = title.replace(/\{start\}/g, String(epStart));
    title = title.replace(/\{end\}/g, String(epEnd));

    return title;
}

logi("collection_download.js 模块已加载");
