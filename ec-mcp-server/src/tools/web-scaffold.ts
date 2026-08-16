/**
 * EC Web 开发脚手架工具
 * 快速生成 Go/Gin、Node/Vue3、Python 技术栈的全栈项目
 */

export const webScaffoldTool = {
  name: "ec_web_scaffold",
  description:
    "EasyClick配套Web开发脚手架。根据需求快速生成授权系统、云控后台、代理分销系统的完整项目代码。支持Go/Gin、Node/Vue3、Python/Flask技术栈。",
  inputSchema: {
    type: "object",
    properties: {
      techStack: {
        type: "string",
        enum: ["go-gin", "node-vue3", "python-flask", "all"],
        description: "技术栈选择",
      },
      projectType: {
        type: "string",
        enum: ["auth-system", "cloud-control", "distributor", "full-platform"],
        description: "项目类型：auth-system=授权系统, cloud-control=云控后台, distributor=代理分销, full-platform=全功能平台",
      },
      database: {
        type: "string",
        enum: ["sqlite", "postgresql", "mysql", "mongodb"],
        description: "数据库类型",
      },
      features: {
        type: "array",
        items: { type: "string" },
        description: "需要的功能：device-manage, card-code, realtime-monitor, remote-control, finance-report, multi-tier-distribution, script-market",
      },
      projectName: {
        type: "string",
        description: "项目名称，默认 easyclick-platform",
      },
    },
  },
  handler: async (args: {
    techStack?: string;
    projectType?: string;
    database?: string;
    features?: string[];
    projectName?: string;
  }) => {
    const stack = args.techStack || "go-gin";
    const type = args.projectType || "full-platform";
    const db = args.database || "sqlite";
    const features = args.features || [];
    const name = args.projectName || "easyclick-platform";

    const result: any = {
      projectName: name,
      techStack: stack,
      projectType: type,
      database: db,
      architecture: generateArchitecture(type, stack),
    };

    switch (stack) {
      case "go-gin":
        result.projectStructure = generateGoGinProject(name, type, db, features);
        result.backendCode = generateGoGinCode(type, features);
        break;
      case "node-vue3":
        result.projectStructure = generateNodeVueProject(name, type, db, features);
        result.backendCode = generateNodeCode(type, features);
        break;
      case "python-flask":
        result.projectStructure = generatePythonProject(name, type, db, features);
        result.backendCode = generatePythonCode(type, features);
        break;
      case "all":
        result.recommendation = getTechStackRecommendation(type);
        result.projectStructures = {
          "go-gin": generateGoGinProject(name, type, db, features),
          "node-vue3": generateNodeVueProject(name, type, db, features),
          "python-flask": generatePythonProject(name, type, db, features),
        };
        break;
    }

    result.ecIntegration = generateEcIntegration(type, features);
    result.deployment = generateDeploymentGuide(stack, db);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
};

function generateArchitecture(type: string, stack: string) {
  const diagrams: Record<string, string> = {
    "auth-system": `
┌──────────┐    HTTP     ┌──────────────┐    SQL     ┌──────────┐
│  EC设备   │──────────▶│  ${stack}后端  │──────────▶│  数据库   │
│ (手机端)  │◀──────────│  (授权API)    │◀──────────│ (卡密/设备)│
└──────────┘    JSON      └──────┬───────┘           └──────────┘
                                 │
                                 │ HTTP
                        ┌───────▼──────┐
                        │  Web管理面板  │
                        │  (Vue3)      │
                        └──────────────┘`,
    "cloud-control": `
┌──────────┐  WebSocket  ┌──────────────┐   ┌──────────┐
│ EC设备1   │◀──────────▶│              │   │ PostgreSQL│
├──────────┤             │  ${stack}   │◀──│ /MySQL   │
│ EC设备2   │◀──────────▶│  云控服务器   │   └──────────┘
├──────────┤             │              │   ┌──────────┐
│ EC设备N   │◀──────────▶│              │◀──│  Redis   │
└──────────┘             └──────┬───────┘   └──────────┘
                                │
                        ┌───────▼──────┐
                        │  Web管理面板  │
                        └──────────────┘`,
    "distributor": `
┌──────────┐   HTTP    ┌───────────────┐   ┌──────────┐
│  总代理    │─────────▶│               │   │  PostgreSQL│
├──────────┤           │  ${stack}    │◀──│ /MySQL   │
│ 一级代理   │─────────▶│  分销+授权API  │   └──────────┘
├──────────┤           │               │
│  用户设备  │─────────▶│               │
└──────────┘           └───────────────┘`,
    "full-platform": `
┌──────────┐  MQTT/WS  ┌─────────────────────────────────┐
│ EC设备群  │◀────────▶│                                  │
└──────────┘           │          ${stack} 全功能平台      │
                       │  ┌─────┐ ┌─────┐ ┌───────────┐  │
                       │  │授权  │ │云控  │ │代理分销   │  │
                       │  └─────┘ └─────┘ └───────────┘  │
                       │  ┌─────┐ ┌─────┐ ┌───────────┐  │
                       │  │统计  │ │脚本  │ │开放API    │  │
                       │  └─────┘ └─────┘ └───────────┘  │
                       └─────────────────────────────────┘`,
  };
  return diagrams[type] || diagrams["full-platform"];
}

function generateGoGinCode(type: string, features: string[]): string {
  const codes: string[] = [];

  codes.push(`// main.go — ${type} 服务入口
package main

import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "gorm.io/driver/sqlite"
)

var db *gorm.DB

func main() {
    // 初始化数据库
    var err error
    db, err = gorm.Open(sqlite.Open("ec_data.db"), &gorm.Config{})
    if err != nil { panic("数据库初始化失败") }

    // 自动迁移
    db.AutoMigrate(&Device{}, &CardCode{}, &Heartbeat{})

    r := gin.Default()

    // ====== 授权接口 ======
    auth := r.Group("/api/auth")
    {
        auth.POST("/activate", handleActivate)   // 激活设备
        auth.POST("/heartbeat", handleHeartbeat) // 心跳上报
        auth.GET("/check", handleCheckAuth)      // 检查授权状态
    }`);

  if (features.includes("device-manage") || features.includes("remote-control")) {
    codes.push(`
    // ====== 设备管理 ======
    device := r.Group("/api/device")
    {
        device.GET("/list", handleDeviceList)       // 设备列表
        device.POST("/command", handleSendCommand)  // 远程指令
        device.GET("/screenshot/:id", handleScreenshot) // 截屏回传
    }`);
  }

  if (features.includes("card-code") || features.includes("finance-report")) {
    codes.push(`
    // ====== 卡密管理 ======
    card := r.Group("/api/admin")
    {
        card.POST("/generate-codes", handleGenerateCodes)  // 批量生成卡密
        card.GET("/code-stats", handleCodeStats)            // 卡密统计
        card.GET("/revenue", handleRevenueReport)           // 财务报表
    }`);
  }

  if (features.includes("multi-tier-distribution")) {
    codes.push(`
    // ====== 代理分销 ======
    dist := r.Group("/api/distributor")
    {
        dist.POST("/create-child", handleCreateChildAgent)  // 创建下级代理
        dist.GET("/commission", handleCommissionReport)     // 佣金报表
        dist.POST("/settle", handleSettleCommission)        // 结算佣金
    }`);
  }

  codes.push(`
    r.Run(":8080")
}`);

  return codes.join("\n");
}

function generateNodeCode(type: string, features: string[]): string {
  return `// server.js — ${type} 服务入口
const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const db = new Database('ec_data.db');
const SECRET = process.env.JWT_SECRET || 'ec-secret-key';

// 中间件: JWT认证
function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) return res.status(401).json({error: '未授权'});
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch(e) {
        res.status(401).json({error: 'Token无效'});
    }
}

// ====== 初始化数据库 ======
db.exec(\`
    CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE NOT NULL,
        card_code TEXT,
        status TEXT DEFAULT 'offline',
        expire_time INTEGER,
        activated_at INTEGER,
        last_heartbeat INTEGER
    );
    CREATE TABLE IF NOT EXISTS card_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        plan TEXT DEFAULT 'monthly',
        duration_days INTEGER DEFAULT 30,
        max_devices INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now'))
    );
\`);

// ====== API 路由 ======
app.post('/api/auth/activate', (req, res) => {
    const { deviceId, cardCode } = req.body;
    // 验证卡密 → 绑定设备 → 返回token
    const card = db.prepare('SELECT * FROM card_codes WHERE code=?').get(cardCode);
    if (!card) return res.json({success: false, message: '卡密无效'});
    if (card.used_count >= card.max_devices) return res.json({success: false, message: '卡密已用完'});

    const token = jwt.sign({deviceId, cardCode}, SECRET, {expiresIn: card.duration_days + 'd'});
    db.prepare('INSERT OR REPLACE INTO devices (device_id, card_code, status, expire_time, activated_at) VALUES (?,?,?,?,?)')
        .run(deviceId, cardCode, 'online', Date.now() + card.duration_days * 86400000, Date.now());
    db.prepare('UPDATE card_codes SET used_count=used_count+1 WHERE code=?').run(cardCode);

    res.json({success: true, token, expireTime: Date.now() + card.duration_days * 86400000});
});

app.post('/api/auth/heartbeat', authMiddleware, (req, res) => {
    db.prepare('UPDATE devices SET last_heartbeat=?, status=? WHERE device_id=?')
        .run(Date.now(), 'online', req.user.deviceId);
    res.json({success: true});
});

app.listen(3000, () => console.log('Server running on :3000'));`;
}

function generatePythonCode(type: string, features: string[]): string {
  return `# app.py — ${type} 服务入口
from flask import Flask, request, jsonify
import sqlite3
import jwt
import datetime

app = Flask(__name__)
SECRET = 'ec-secret-key'

def get_db():
    db = sqlite3.connect('ec_data.db')
    db.row_factory = sqlite3.Row
    return db

# ====== 初始化 ======
def init_db():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT UNIQUE NOT NULL,
            card_code TEXT,
            status TEXT DEFAULT 'offline',
            expire_time INTEGER,
            last_heartbeat INTEGER
        );
        CREATE TABLE IF NOT EXISTS card_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            plan TEXT DEFAULT 'monthly',
            duration_days INTEGER DEFAULT 30,
            max_devices INTEGER DEFAULT 1,
            used_count INTEGER DEFAULT 0
        );
    ''')
    db.commit()
    db.close()

# ====== 授权 ======
@app.route('/api/auth/activate', methods=['POST'])
def activate():
    data = request.json
    device_id = data.get('deviceId')
    card_code = data.get('cardCode')

    db = get_db()
    card = db.execute('SELECT * FROM card_codes WHERE code=?', [card_code]).fetchone()
    if not card:
        return jsonify(success=False, message='卡密无效')
    if card['used_count'] >= card['max_devices']:
        return jsonify(success=False, message='卡密已用完')

    expire_time = datetime.datetime.now() + datetime.timedelta(days=card['duration_days'])
    token = jwt.encode({
        'deviceId': device_id,
        'exp': expire_time
    }, SECRET, algorithm='HS256')

    db.execute('''INSERT OR REPLACE INTO devices
        (device_id, card_code, status, expire_time) VALUES (?,?,?,?)''',
        [device_id, card_code, 'online', int(expire_time.timestamp() * 1000)])
    db.execute('UPDATE card_codes SET used_count=used_count+1 WHERE code=?', [card_code])
    db.commit()
    db.close()

    return jsonify(success=True, token=token, expireTime=int(expire_time.timestamp() * 1000))

@app.route('/api/auth/heartbeat', methods=['POST'])
def heartbeat():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET, algorithms=['HS256'])
        db = get_db()
        db.execute('UPDATE devices SET last_heartbeat=? WHERE device_id=?',
            [int(datetime.datetime.now().timestamp() * 1000), payload['deviceId']])
        db.commit()
        db.close()
        return jsonify(success=True)
    except:
        return jsonify(success=False, message='Token无效'), 401

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)`;
}

function generateEcIntegration(type: string, features: string[]): string {
  const parts: string[] = [];

  parts.push(`
// ============================================
// EC 脚本端集成代码
// 将此模块放到 tengxun/src/js/ 目录下
// ============================================`);

  if (type === "auth-system" || type === "full-platform") {
    parts.push(`
// 授权验证（脚本启动时调用）
function ecAuthCheck(cardCode) {
    let deviceId = android.getDeviceId();
    let res = http.postJSON(SERVER_URL + "/api/auth/activate", {
        deviceId: deviceId,
        cardCode: cardCode
    });
    if (res.code === 200) {
        let data = JSON.parse(res.body);
        if (data.success) {
            AUTH_TOKEN = data.token;
            EXPIRE_TIME = data.expireTime;
            file.writeFile("__token__.dat", AUTH_TOKEN);
            log.info("授权验证成功");
            return true;
        }
    }
    log.error("授权失败");
    return false;
}

// 心跳上报（定时器中调用）
function ecHeartbeat() {
    let res = http.postJSON(SERVER_URL + "/api/auth/heartbeat", {},
        {"Authorization": "Bearer " + AUTH_TOKEN});
    return res.code === 200;
}`);
  }

  if (features.includes("remote-control") || type === "cloud-control") {
    parts.push(`
// 云控 WebSocket 连接
let ws = new WebSocket("ws://" + SERVER_HOST + "/ws");
ws.onmessage = function(event) {
    let cmd = JSON.parse(event.data);
    switch(cmd.type) {
        case "start": startScript(); break;
        case "stop": stopScript(); break;
        case "screenshot": sendScreenshot(cmd.requestId); break;
        case "update": updateConfig(cmd.config); break;
    }
};

function sendScreenshot(requestId) {
    let img = device.screenshot();
    let base64 = util.base64Encode(img);
    ws.send(JSON.stringify({type: "screenshot_resp", requestId, image: base64}));
}`);
  }

  return parts.join("\n");
}

function generateDeploymentGuide(stack: string, db: string): string {
  if (stack === "go-gin") {
    return `# 部署指南 (Go/Gin)

## Docker Compose 部署（推荐）
\`\`\`yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    restart: unless-stopped
\`\`\`

## 手动部署
1. go build -o ec-platform .
2. ./ec-platform
3. 默认监听 :8080

## 宝塔面板部署
1. 上传编译好的二进制文件
2. 在软件商店中启动 PM2 管理器
3. 添加项目: 可执行文件路径 → ec-platform`;
  }

  if (stack === "node-vue3") {
    return `# 部署指南 (Node/Vue3)

## Docker Compose 部署
\`\`\`yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports: ["3000:3000"]
  frontend:
    build: ./client
    ports: ["80:80"]
    depends_on: [backend]
\`\`\`

## 宝塔面板部署
1. 网站 → Node项目 → 添加Node项目
2. 项目目录: /www/wwwroot/easyclick/server
3. 启动选项: node server.js
4. 前端: 网站 → HTML项目 → 上传 dist/ 目录`;
  }

  return `# 部署指南 (${stack})
1. 安装依赖 → 配置数据库 → 启动服务
2. 推荐使用 Docker Compose 一键部署
3. 宝塔面板用户可使用 PM2/Node项目管理器`;
}

function getTechStackRecommendation(type: string): string {
  if (type === "auth-system") {
    return "推荐 Node+Vue3（开发快、部署简单、SQLite免维护）";
  }
  if (type === "cloud-control") {
    return "推荐 Go/Gin（高并发WebSocket、低内存占用、编译单文件部署）";
  }
  if (type === "distributor") {
    return "推荐 Node+Vue3（快速迭代、丰富npm生态、Ant Design Vue现成组件）";
  }
  return "推荐 Go/Gin + Vue3（高性能后端 + 现代前端，适合全功能平台）";
}

function generateGoGinProject(name: string, type: string, db: string, features: string[]): any {
  return {
    directories: [
      `${name}/`,
      `${name}/cmd/       # 入口`,
      `${name}/internal/handler/  # API处理器`,
      `${name}/internal/model/    # 数据模型`,
      `${name}/internal/middleware/ # 中间件`,
      `${name}/web/               # Vue3前端`,
      `Dockerfile`,
      `docker-compose.yml`,
    ],
    modelExample: `// internal/model/device.go
type Device struct {
    ID            uint   \`gorm:"primaryKey"\`
    DeviceID      string \`gorm:"uniqueIndex"\`
    CardCode      string
    Status        string \`gorm:"default:offline"\`
    ExpireTime    int64
    LastHeartbeat int64
}`,
    handlerExample: `// internal/handler/auth.go
func handleActivate(c *gin.Context) {
    var req struct {
        DeviceID string // 对应json:deviceId
        CardCode string // 对应json:cardCode
    }
    c.BindJSON(&req)
    // ... 验证逻辑
    c.JSON(200, gin.H{"success": true})
}`,
  };
}

function generateNodeVueProject(name: string, type: string, db: string, features: string[]): any {
  return {
    directories: [
      `${name}/`,
      `${name}/server/          # Express后端`,
      `${name}/server/routes/   # API路由`,
      `${name}/server/models/   # 数据模型`,
      `${name}/client/          # Vue3前端(vite)`,
      `${name}/client/src/views/`,
      `${name}/client/src/components/`,
      `docker-compose.yml`,
    ],
  };
}

function generatePythonProject(name: string, type: string, db: string, features: string[]): any {
  return {
    directories: [
      `${name}/`,
      `${name}/app.py           # 主入口`,
      `${name}/models.py        # 数据模型`,
      `${name}/auth.py          # 认证模块`,
      `${name}/requirements.txt`,
      `${name}/templates/       # Jinja2模板 (可选)`,
      `docker-compose.yml`,
    ],
  };
}
