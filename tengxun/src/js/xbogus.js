// ============================================================
// 纯 JavaScript MD5 实现（不依赖 Java）
// 来源：https://github.com/blueimp/JavaScript-MD5
// ============================================================

function md5_js(str) {
    function md5cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md51(s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i;
        for (i = 64; i <= s.length; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++)
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i++) tail[i] = 0;
        }
        tail[14] = n * 8;
        md5cycle(state, tail);
        return state;
    }

    function md5blk(s) {
        var md5blks = [],
            i;
        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) |
                (s.charCodeAt(i + 1) << 8) |
                (s.charCodeAt(i + 2) << 16) |
                (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }

    function rhex(n) {
        var s = "",
            j = 0;
        for (; j < 4; j++)
            s += ((n >> (j * 8 + 4)) & 0x0F).toString(16) +
                ((n >> (j * 8)) & 0x0F).toString(16);
        return s;
    }

    function hex(x) {
        var s = "",
            i;
        for (i = 0; i < x.length; i++)
            s += rhex(x[i]);
        return s;
    }

    return hex(md51(str));
}

// ============================================================
// 基于纯 JS MD5 的 X-Bogus 实现
// ============================================================

// ---------- 字符串转字节数组 ----------
function stringToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xFF);
    }
    return bytes;
}

// ---------- 十六进制字符串转字节数组 ----------
function hexToBytes(hexStr) {
    var bytes = [];
    for (var i = 0; i < hexStr.length; i += 2) {
        var byte = parseInt(hexStr.substring(i, i + 2), 16);
        bytes.push(isNaN(byte) ? 0 : byte);
    }
    return bytes;
}

// ---------- 对字节数组做 MD5（纯 JS） ----------
function md5_bytes(bytes) {
    // 将字节数组转回字符串
    var str = "";
    for (var i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return md5_js(str);
}

// ---------- MD5 字符串（纯 JS） ----------
function md5_js_str(str) {
    return md5_js(str);
}

// ---------- Base64（保持用 Android 的） ----------
function base64Encode_java(str) {
    try {
        var bytes = new java.lang.String(str).getBytes("UTF-8");
        return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
    } catch(e) {
        return "";
    }
}

// ---------- RC4 ----------
function rc4(key, data) {
    var s = [];
    for (var i = 0; i < 256; i++) s[i] = i;
    var j = 0;
    for (var i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        var temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }
    var result = "";
    var i = 0, k = 0;
    for (var idx = 0; idx < data.length; idx++) {
        i = (i + 1) % 256;
        k = (k + s[i]) % 256;
        var temp = s[i];
        s[i] = s[k];
        s[k] = temp;
        result += String.fromCharCode(data.charCodeAt(idx) ^ s[(s[i] + s[k]) % 256]);
    }
    return result;
}

// ---------- RC4 返回字节数组 ----------
function rc4Bytes(key, data) {
    var s = [];
    for (var i = 0; i < 256; i++) s[i] = i;
    var j = 0;
    for (var i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        var temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }
    var result = [];
    var i = 0, k = 0;
    for (var idx = 0; idx < data.length; idx++) {
        i = (i + 1) % 256;
        k = (k + s[i]) % 256;
        var temp = s[i];
        s[i] = s[k];
        s[k] = temp;
        result.push(data.charCodeAt(idx) ^ s[(s[i] + s[k]) % 256]);
    }
    return result;
}

// ---------- 获取 arr2（使用纯 JS MD5） ----------
function getArr2(payload, ua, form) {
    // 1. 双重 MD5 - payload
    var firstPayloadMd5 = md5_js_str(payload);
    var firstPayloadBytes = hexToBytes(firstPayloadMd5);
    var saltPayload = md5_bytes(firstPayloadBytes);
    var saltPayloadBytes = hexToBytes(saltPayload);

    // 2. 双重 MD5 - form
    var firstFormMd5 = md5_js_str(form);
    var firstFormBytes = hexToBytes(firstFormMd5);
    var saltForm = md5_bytes(firstFormBytes);
    var saltFormBytes = hexToBytes(saltForm);

    // 3. RC4 加密 UA → Base64 → MD5
    var uaKey = "\x00\x01\x0e";
    var rc4Result = rc4(uaKey, ua);
    var base64Result = base64Encode_java(rc4Result);
    var saltUa = md5_js_str(base64Result);
    var saltUaBytes = hexToBytes(saltUa);

    // 4. 时间戳 + Canvas
    var timestamp = Math.floor(Date.now() / 1000);
    var canvas = 1489154074;

    // 5. 构造 arr1
    var arr1 = [
        64, 0, 1, 14,
        saltPayloadBytes[14] || 0,
        saltPayloadBytes[15] || 0,
        saltFormBytes[14] || 0,
        saltFormBytes[15] || 0,
        saltUaBytes[14] || 0,
        saltUaBytes[15] || 0,
        (timestamp >> 24) & 255,
        (timestamp >> 16) & 255,
        (timestamp >> 8) & 255,
        timestamp & 255,
        (canvas >> 24) & 255,
        (canvas >> 16) & 255,
        (canvas >> 8) & 255,
        canvas & 255,
        64
    ];

    // 6. 异或校验
    for (var i = 1; i < arr1.length - 1; i++) {
        arr1[18] ^= arr1[i];
    }

    // 7. 重排为 arr2
    var arr2 = [
        arr1[0], arr1[2], arr1[4], arr1[6], arr1[8], arr1[10],
        arr1[12], arr1[14], arr1[16], arr1[18],
        arr1[1], arr1[3], arr1[5], arr1[7], arr1[9],
        arr1[11], arr1[13], arr1[15], arr1[17]
    ];
    return arr2;
}

// ---------- getGarbledString ----------
function getGarbledString(arr2) {
    var p = [
        arr2[0], arr2[10], arr2[1], arr2[11], arr2[2], arr2[12],
        arr2[3], arr2[13], arr2[4], arr2[14], arr2[5], arr2[15],
        arr2[6], arr2[16], arr2[7], arr2[17], arr2[8], arr2[18], arr2[9]
    ];

    var charArray = "";
    for (var i = 0; i < p.length; i++) {
        charArray += String.fromCharCode(p[i]);
    }

    var key = String.fromCharCode(255);
    var bytes = rc4Bytes(key, charArray);

    var f = [2, 255];
    for (var i = 0; i < bytes.length; i++) {
        f.push(bytes[i]);
    }
    return f;
}

// ---------- 主入口 ----------
function getXbogus(payload, ua, form) {
    ua = ua || "Mozilla/5.0 (Linux; Android 14; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36";
    form = form || "";

    var shortStr = "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=";

    var arr2 = getArr2(payload, ua, form);
    var garbled = getGarbledString(arr2);

    var xbogus = "";
    for (var i = 0; i < 21; i += 3) {
        var num0 = garbled[i] || 0;
        var num1 = garbled[i + 1] || 0;
        var num2 = garbled[i + 2] || 0;
        var baseNum = num2 | (num1 << 8) | (num0 << 16);

        var idx1 = (baseNum & 16515072) >> 18;
        var idx2 = (baseNum & 258048) >> 12;
        var idx3 = (baseNum & 4032) >> 6;
        var idx4 = baseNum & 63;

        xbogus += shortStr.charAt(idx1);
        xbogus += shortStr.charAt(idx2);
        xbogus += shortStr.charAt(idx3);
        xbogus += shortStr.charAt(idx4);
    }

    return payload + "&X-Bogus=" + xbogus;
}

// ---------- 测试函数 ----------
function testXbogus() {
    logd("========== 开始测试 ==========");

    var payload = "sec_user_id=MS4wLjABAAAAAABC&count=35&max_cursor=0&device_platform=webapp&aid=6383";
    logd("Payload: " + payload);

    // 测试 MD5
    var md5Result = md5_js_str(payload);
    logd("MD5(payload): " + md5Result);
    logd("MD5 长度: " + md5Result.length);

    // 测试双重 MD5
    var firstBytes = hexToBytes(md5Result);
    var secondMd5 = md5_bytes(firstBytes);
    logd("双重 MD5: " + secondMd5);
    logd("双重 MD5 长度: " + secondMd5.length);

    // 测试完整 X-Bogus
    var result = getXbogus(payload);
    logd("========== 结果 ==========");
    logd(result);

    // 验证格式
    var match = /X-Bogus=([A-Za-z0-9]{28})/.exec(result);
    if (match) {
        logd("✅ X-Bogus 格式正确: " + match[1]);
        return true;
    } else {
        logd("❌ X-Bogus 格式错误");
        var anyMatch = /X-Bogus=([^&]+)/.exec(result);
        if (anyMatch) {
            logd("实际值: " + anyMatch[1]);
            logd("实际长度: " + anyMatch[1].length);
            var invalid = anyMatch[1].replace(/[A-Za-z0-9]/g, "");
            if (invalid) {
                logd("非法字符: " + invalid);
            }
        }
        return false;
    }
}

// ============================================================
// 使用 http.httpGet 的 API 请求
// ============================================================

function douyinApiRequest(fullUrl, cookie, timeout) {
    timeout = timeout || 15000;

    var headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Referer": "https://www.douyin.com/",
        "Origin": "https://www.douyin.com",
        "Connection": "keep-alive"
    };

    if (cookie) {
        headers["Cookie"] = cookie;
    }

    logd("请求 URL: " + fullUrl);

    try {
        // httpGet(url, params, timeout, headers)
        var responseStr = http.httpGet(fullUrl, null, timeout, headers);

        if (responseStr && responseStr != "") {
            logd("响应长度: " + responseStr.length);
            var data = JSON.parse(responseStr);
            return data;
        } else {
            logd("❌ 响应为空");
            return null;
        }
    } catch(e) {
        logd("❌ 请求异常: " + e);
        return null;
    }
}

// ============================================================
// 获取用户主页视频列表
// ============================================================

function getUserPosts(secUid, maxCursor, count, cookie) {
    count = count || 35;
    maxCursor = maxCursor || 0;

    var payload = "sec_user_id=" + secUid +
        "&count=" + count +
        "&max_cursor=" + maxCursor +
        "&device_platform=webapp&aid=6383";

    var fullUrl = "https://www.douyin.com/aweme/v1/web/aweme/post/?" + getXbogus(payload);

    var result = douyinApiRequest(fullUrl, cookie);
   // logi(JSON.stringify(result));

    if (result && result.status_code == 0 && result.aweme_list) {
        logd("✅ 获取到 " + result.aweme_list.length + " 个视频");
        return result;
    } else {
        if (result) {
            logd("❌ API 返回错误: " + JSON.stringify(result));
        }
        return null;
    }
}


// ============================================================
// 测试函数
// ============================================================
//
// function testGetUserPosts() {
//     // 用真实的 sec_uid 替换
//     var secUid = "MS4wLjABAAAAq9YFLwfhk5XNofGXLzUxW3V65dvUW4uLTZ_grMFNV0fqGjCNh-ChTNwl8Hh7wL8h";
//     var cookie = "";  // 如果有 cookie 可以填，没有也可以试试
//
//     var result = getUserPosts(secUid, 0, 5, cookie);
//
//     if (result) {
//         logd("========== 测试成功 ==========");
//         logd("视频数量: " + (result.aweme_list ? result.aweme_list.length : 0));
//         if (result.aweme_list && result.aweme_list.length > 0) {
//             logd("第一个视频: " + JSON.stringify(result.aweme_list[0], null, 2));
//         }
//     } else {
//         logd("========== 测试失败 ==========");
//     }
// }
//
// testGetUserPosts()