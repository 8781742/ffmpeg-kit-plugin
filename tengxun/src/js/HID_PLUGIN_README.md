# HID 蓝牙插件 — 使用说明

## 文件清单

将以下 3 个文件放到 Android 设备的 `/sdcard/hid/` 目录：

| 文件 | 说明 |
|------|------|
| `KMDEX3.4.dex` | DEX 插件主文件 |
| `libnative-hid.so` | 32位原生库 |
| `libnative-hid64.so` | 64位原生库 |

> ⚠️ `.so` 文件名**一个字都不能改**，必须保持原名

## 使用方式

### 方式一：直接调用（推荐）

```javascript
// 在主脚本开头加载
loadJS("/sdcard/Download/抖音下载/_hid_plugin.js");

// 初始化（必调一次）
if (!hidInit()) {
    loge("HID 初始化失败，请检查蓝牙连接");
    exit();
}

// 使用各种操作
hidClick(540, 960);           // 单击
hidSwip(540, 1400, 540, 600, 400);  // 上滑
hidLongClick(540, 960, 800);  // 长按
hidHome();                     // Home键
```

### 方式二：完整初始化流程（参考 test_hid.js）

```javascript
// 1. 加载 DEX
setRepeatLoadDex(false);
loadDex("/sdcard/hid/KMDEX3.4.dex");

// 2. 获取 Java 对象
var hid = com.hid.server.hid;

// 3. 初始化（传入 so 目录）
var ok = hid.init(context, "/sdcard/hid/");
sleep(3000);  // 等待连接

if (!ok || !hid.isOn()) {
    loge("HID 连接失败");
    exit();
}
```

## API 速查

| 函数 | 说明 |
|------|------|
| `hidInit()` | 初始化插件（返回 true/false） |
| `hidIsOn()` | 检查是否已连接 |
| `hidGetVersion()` | 获取插件版本 |
| `hidGetBatteryLevel()` | 获取电量 |
| `hidIsCharging()` | 是否充电中 |
| `hidClick(x, y)` | 单击 |
| `hidClicks(x, y, count)` | 连击 |
| `hidClicksV2(x, y, count, interval)` | 连击增强 |
| `hidLongClick(x, y, duration)` | 长按 |
| `hidSwip(x1,y1,x2,y2,duration)` | 滑动 |
| `hidSwipM(x1,y1,x2,y2,duration)` | 快速滑动 |
| `hidSwipEx(x1,y1,x2,y2,duration,segments)` | 滑动增强 |
| `hidSwipMultiple(x1,y1,x2,y2,count,duration,interval)` | 连续滑动 |
| `hidTouchDown(x,y)` | 触摸按下 |
| `hidTouchMove(x,y)` | 触摸移动 |
| `hidTouchUp()` | 触摸抬起 |
| `hidDrag(x1,y1,x2,y2,duration)` | 拖拽封装 |
| `hidKeyPress(keyCode)` | 按键 |
| `hidHome()` | Home 键 |
| `hidBack()` | Back 键 |
| `hidEnter()` | 确认键 |
| `hidPower()` | 电源键 |
| `hidBatchClick(points, delay)` | 批量点击 |
| `hidBatchSwip(swipes)` | 批量滑动 |

## 常用 keyCode

| 值 | 按键 |
|----|------|
| 3 | HOME |
| 4 | BACK |
| 26 | POWER |
| 66 | ENTER |
| 82 | MENU |
| 67 | SEARCH |

## 注意事项

1. **EasyClick 没有 so 加载方式**，必须通过 `hid.init(context, so_path)` 指定 so 目录
2. 初始化后**最好等待 3 秒**再操作
3. 首次使用请先运行 `test_hid.js` 验证连接
