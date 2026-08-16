# EasyClick 自动化项目 — 抖音数据采集 (Android)

## 项目概况
- **项目名称**：tengxun（抖音数据采集）
- **平台**：Android（免Root）
- **引擎**：EasyClick 8.x
- **开发语言**：JavaScript (EC语法)
- **IDE**：**IntelliJ IDEA 2021.1.1 + EasyClick 插件**
- **模块名**：`tengxun`
- **源码目录**：`tengxun/src/js/`

## 现有功能
- `database.js` — SQLite 去重存储（t_user_post / t_user_like / t_mix / t_music）
- 抖音作品采集、合集下载、音乐下载
- 数据存储路径：`/sdcard/Download/抖音下载/`

## 开发环境（IDEA + EC 插件配合 Claude Code）
- **写代码**：Claude Code 直接生成/修改 `tengxun/src/js/*.js`
- **运行调试**：在 IntelliJ IDEA 中通过 EasyClick 插件运行
- **命令行工具**：`ec_work_config/android/bin/ec-android-cli`（自动化截图/OCR/构建）
- **MCP Server**：`ec-mcp-server/` 提供 API查询、脚本生成、日志分析

## EC CLI 常用命令（模块名: tengxun）
```bash
EC=./ec_work_config/android/bin/ec-android-cli

# 预览/运行
$EC preview -m tengxun          # 预览（执行UI）
$EC run -m tengxun              # 运行脚本
$EC stop -m tengxun             # 停止脚本
$EC build -m tengxun            # 构建 IEC

# 截图/UI抓取
$EC capture-screen -m tengxun   # 截图
$EC capture-node -m tengxun     # 抓UI节点(XML)

# OCR/图像
$EC ocr-screen -m tengxun       # OCR识别屏幕
$EC test-image -m tengxun -s 小图.png  # 模板匹配测试

# 监控日志
$EC monitor                     # 持续日志流
$EC run -m tengxun -o log.txt   # 运行并写日志
```

## MCP 工具速查
| 工具 | 功能 |
|------|------|
| `ec_api_query` | 查询 EC API 文档（40+ API） |
| `ec_script_gen` | 根据需求生成完整脚本 |
| `ec_log_parse` | 分析运行日志自动排错 |
| `ec_project_info` | 查看项目结构和平台配置 |
| `ec_troubleshoot` | 快速诊断常见问题 |

## 编码规范
- 使用 `logd()`/`loge()`（EC 项目目前使用这些日志函数）
- 所有 DB 操作包裹 try-catch
- SQLite 表使用 `if not exists` 防止重复创建
- 采集数据存储到 `/sdcard/Download/抖音下载/`

## 关键概念
- **UI选择器**：`text=确定` `id=com.app:id/btn` `class=android.widget.Button`
- **SQLite**：使用 `sqlite.open()` / `db.exec()` / `db.query()`
- **IDE 工作流**：Claude Code 生成代码 → IDEA+EC插件运行调试 → CLI 辅助自动化

---

## 调试工作流（Claude Code ↔ IDEA 联动）

### 核心原理

EC CLI（`ec-android-cli`）是 Claude Code 和 IDEA 之间的桥梁。CLI 通过 IDEA 的 EasyClick 插件与设备和脚本通信 —— **不需要自动化 IDEA GUI**。

```
Claude Code  →  ec-android-cli  →  IDEA(EC插件)  →  Android设备
     ↑                                                    ↓
     └──────── 日志/截图/OCR/UI节点 ←────────────────────┘
```

**前提：IDEA 必须保持运行，EC 插件已加载。**

### 调试命令

```bash
EC=./ec_work_config/android/bin/ec-android-cli

# 运行脚本（自动等待结束）
$EC run -m tengxun -f json

# 运行并写日志文件
$EC run -m tengxun -o /tmp/ec_run.log

# 停止脚本
$EC stop -m tengxun

# 截图（获取设备当前画面路径）
$EC capture-screen -m tengxun

# 抓 UI 节点树（XML）
$EC capture-node -m tengxun

# OCR 识别屏幕文字
$EC ocr-screen -m tengxun

# 预览 UI 界面
$EC preview -m tengxun

# 持续监控日志
$EC monitor -f json
```

### `-k` 停止关键字（重要）

`run`/`preview`/`stop`/`build`/`monitor` 都支持 `-k` 自动停止：

```bash
# 脚本运行结束后自动停止监控（默认）
$EC run -m tengxun

# 遇到特定日志时停止
$EC run -m tengxun -k "下载完成|||脚本异常"

# 自定义多个停止条件（或关系）
$EC monitor -k "ERROR|||FATAL|||采集完成"
```

### 典型调试流程

```
用户说: "调试采集脚本"
  ↓
1. 截图看设备当前状态
   $EC capture-screen -m tengxun
   → 返回截图路径 → Read 查看
  ↓
2. 抓 UI 节点分析界面
   $EC capture-node -m tengxun
   → 返回 XML 路径 → 分析控件
  ↓
3. 运行脚本 + 写日志
   $EC run -m tengxun -o ai_logs/run.log
  ↓
4. 分析日志（MCP 工具）
   mcp__easyclick__ec_log_parse(logPath="ai_logs/run.log")
   → 自动匹配已知错误 + 修复方案
  ↓
5. 修改代码 → 重新运行 → 重复 1~4
```

### 快速排错

遇到问题时，直接用 MCP 排错工具：

```
mcp__easyclick__ec_troubleshoot(problem="脚本闪退", platform="android")
```

### 一键调试命令（推荐）

适合 Claude Code 自动执行的标准调试流程：

```bash
# 1. 截图 + OCR 了解当前屏幕
./ec_work_config/android/bin/ec-android-cli capture-screen -m tengxun
./ec_work_config/android/bin/ec-android-cli ocr-screen -m tengxun

# 2. 运行脚本，写日志到 ai_logs/
./ec_work_config/android/bin/ec-android-cli run -m tengxun -r true

# 3. 运行结束后，分析 ai_logs/ 中最新的日志文件
```
