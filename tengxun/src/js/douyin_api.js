// ============================================================
// 文件: douyin_api.js
// 描述: 抖音 API 接口调用
// ============================================================

// API 端点
var Urls = {
    TAB_FEED: "https://www.douyin.com/aweme/v1/web/tab/feed/?",
    USER_SHORT_INFO: "https://www.douyin.com/aweme/v1/web/im/user/info/?",
    USER_DETAIL: "https://www.douyin.com/aweme/v1/web/user/profile/other/?",
    USER_POST: "https://www.douyin.com/aweme/v1/web/aweme/post/?",
    POST_DETAIL: "https://www.douyin.com/aweme/v1/web/aweme/detail/?",
    USER_FAVORITE_A: "https://www.douyin.com/aweme/v1/web/aweme/favorite/?",
    USER_MIX: "https://www.douyin.com/aweme/v1/web/mix/aweme/?",
    MUSIC: "https://www.douyin.com/aweme/v1/web/music/aweme/?"
};

/**
 * 从主页链接解析 sec_user_id
 */
// function parseSecUid(link) {
//     try {
//         logi(JSON.stringify(getHeaders()));
//         var pa = {"b": "22"};
//         var response = http.httpGet (link,pa,10000, {
//             "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
//             "Accept": "application/json, text/plain, */*",
//             "Accept-Language": "zh-CN,zh;q=0.9",
//             "Accept-Encoding": "gzip, deflate, br",
//             "Referer": "https://www.douyin.com/",
//             "Origin": "https://www.douyin.com",
//             "Connection": "keep-alive",
//             "Sec-Ch-Ua": "Not_A Brand",
//             "Sec-Ch-Ua-Mobile": "?1",
//             "Sec-Ch-Ua-Platform": "Android",
//             "Sec-Fetch-Dest": "empty",
//             "Sec-Fetch-Mode": "cors",
//             "Sec-Fetch-Site": "same-origin"
//         });
//         logi(response);
//         var url = response.request.url;
//         var match = /user\/([a-zA-Z0-9_-]+)/.exec(url);
//         if (match) {
//             return match[1];
//         }
//     } catch(e) {
//         logd("解析链接失败: " + e);
//     }
//     return null;
// }




/**
 * 从抖音链接解析 sec_user_id（支持多种格式）
 *
 * 支持格式:
 *   1. 完整主页链接: https://www.douyin.com/user/MS4wLjABAAAA...
 *   2. 短链接:       https://v.douyin.com/if3oNFo4/
 *   3. 直接 sec_uid: MS4wLjABAAAA...
 *
 * 原理:
 *   - 完整链接 → 直接从 URL 路径提取，无需 HTTP 请求 ✅
 *   - 短链接   → 尝试 HTTP 解析（v.douyin.com 使用 JS 跳转，EC 可能无法解析）
 *   - 直接ID   → 原样返回
 *
 * @param {string} link - 抖音链接或 sec_user_id
 * @returns {string|null} sec_user_id 或 null
 */
function parseSecUid(link) {
    try {
        logd("开始解析链接: " + link);

        // ======== 方式1: 直接提取（无需HTTP，最快最可靠）========
        // 支持: 完整 douyin.com 链接、直接 sec_uid 字符串
        var secUid = extractSecUserId(link);
        if (secUid) {
            logd("✅ 直接提取成功: " + secUid);
            return secUid;
        }

        // ======== 方式2: 短链接 HTTP 解析 ========
        var isShortLink = (link.indexOf("v.douyin.com") >= 0 ||
                           link.indexOf("v.douyin.com") >= 0);
        if (isShortLink) {
            logd("检测到短链接，尝试 HTTP 解析...");

            // 2a: httpGet 跟随重定向
            var response = http.httpGet(link, null, 10000, {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            });

            if (response) {
                // httpGet 对 HTML 页面返回 string，对 JSON API 返回 object
                if (typeof response === 'string') {
                    secUid = extractSecUserId(response);
                    if (secUid) {
                        logd("✅ 从响应体提取成功: " + secUid);
                        return secUid;
                    }
                } else if (typeof response === 'object') {
                    var finalUrl = (response.request && response.request.url) || "";
                    if (finalUrl && finalUrl !== link) {
                        logd("重定向到: " + finalUrl);
                        secUid = extractSecUserId(finalUrl);
                        if (secUid) {
                            logd("✅ 从重定向URL提取成功: " + secUid);
                            return secUid;
                        }
                    }
                    var body = response.body || "";
                    secUid = extractSecUserId(body);
                    if (secUid) {
                        logd("✅ 从响应体提取成功: " + secUid);
                        return secUid;
                    }
                }
            }

            // 2b: http.request 手动处理重定向
            var resp = http.request({
                url: link,
                method: "GET",
                headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
                timeout: 10000,
                redirect: false
            });
            if (resp) {
                var statusCode = resp.statusCode || 0;
                logd("短链接 HTTP 状态码: " + statusCode);
                if (statusCode == 301 || statusCode == 302) {
                    var location = (resp.header && (resp.header["Location"] || resp.header["location"])) || "";
                    if (location) {
                        secUid = extractSecUserId(location);
                        if (secUid) {
                            logd("✅ 从 Location 头提取成功: " + secUid);
                            return secUid;
                        }
                    }
                }
            }

            // 短链接解析失败 — 给出明确指引
            loge("⚠️ 短链接解析失败: v.douyin.com 使用 JS 跳转而非 HTTP 302");
            loge("💡 请改用完整链接: 在浏览器中打开短链接 → 复制地址栏中的完整URL");
            loge("   完整格式: https://www.douyin.com/user/MS4wLjABAAAA...");
            loge("   或直接粘贴 sec_user_id: MS4wLjABAAAA...");
        }

        loge("❌ 解析链接失败，未能提取 sec_user_id");
        return null;

    } catch (e) {
        loge("解析链接异常: " + e);
        return null;
    }
}

/**
 * 从 URL 中提取 sec_user_id
 * 支持格式: /user/MS4w...? 、sec_user_id=MS4w...、sec_uid=MS4w...
 */
function extractSecUserId(url) {
    if (!url) return null;

    var patterns = [
        /\/user\/(MS4wLjABAAAA[a-zA-Z0-9_\-]+)/,  // /user/MS4w... 路径格式 (最可靠)
        /sec_user_id=([^&\s"'\]]+)/,                // 参数格式
        /sec_uid=([^&\s"'\]]+)/                     // sec_uid 参数
    ];

    for (var i = 0; i < patterns.length; i++) {
        var match = url.match(patterns[i]);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}



// ============================================================
// 获取 ttwid 设备 ID（免登录关键）
// ============================================================
function getTtwid() {
    try {
        var url = "https://ttwid.bytedance.com/ttwid/union/register/";
        var data = {
            "region": "cn",
            "aid": 1768,
            "needFid": false,
            "service": "www.ixigua.com",
            "migrate_info": {
                "ticket": "",
                "source": "node"
            },
            "cbUrlProtocol": "https",
            "union": true
        };
      var headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        };

// 关键修正：将 data 转为 JSON 字符串
        var response = http.postJSON(url, data,  1000, headers);
        logi(response);

        if (response) {
            response=JSON.parse(response);
            logi(response["redirect_url"]);
            var params = {
                "url": response["redirect_url"],
                "method": "GET"
            };
            var x = http.request(params);
            if (x) {
                logd("header=> " + JSON.stringify(x.header));
                logd("cookie=> " + JSON.stringify(x.cookie));
                logd("statusCode=" + x.statusCode);
                logd("statusMessage=" + x.statusMessage);
                logd("charset=" + x.charset);
                logd("contentType=" + x.contentType);
                logd("body=" + x.body);
            } else {
                loge("无结果");
            }



        // 从响应的 Cookie 中提取 ttwid
        var setCookie = x.cookie;
        if (setCookie) {

// 方法1：去除首尾的大括号（如果存在）
            var cleanCookie = setCookie.replace(/^\{/, '').replace(/\}$/, '');

// 然后再用你的正则提取
            var match = /ttwid=([^;]+)/.exec(cleanCookie);
            if (match) {
                logd("获取 ttwid 成功: " + match[1]); // 输出：1%7C26Sxj4p9...6f4ab5c2
                return "ttwid=" + match[1];
            }


        }


        }
        return null;
    } catch(e) {
        loge("获取 ttwid 失败: " + e);
        return null;
    }
}
/**
 * 获取单个视频详情
 */
function getAwemeDetail(awemeId, cookie) {
    var params = "aweme_id=" + awemeId + "&device_platform=webapp&aid=6383";
    var fullUrl = Urls.POST_DETAIL + getXbogus(params);

    var headers = getHeaders(cookie);
    var response = http.get(fullUrl, {
        headers: headers,
        timeout: 10000
    });

    if (response.statusCode == 200) {
        return JSON.parse(response.body);
    }
    return null;
}

/**
 * 获取请求头
 */
function getHeaders(cookie) {
    var headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.douyin.com/",
        "Origin": "https://www.douyin.com",
        "Connection": "keep-alive",
        "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?1",
        "Sec-Ch-Ua-Platform": '"Android"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
    };
    if (cookie) {
        headers["Cookie"] = cookie;
    }
    logi(JSON.stringify(headers));
    return headers;
}