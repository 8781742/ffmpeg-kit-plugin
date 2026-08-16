/**
 * EC 截图取色工具
 * 自动解析图片色值、模板素材，生成精准图色识别代码
 */

import { queryApi } from "../knowledge/ec-api-db.js";

export const imageColorTool = {
  name: "ec_image_color",
  description:
    "EasyClick截图取色分析工具。分析指定坐标的颜色值，或根据颜色自动生成findImage/findImageByColor代码。也可以生成模板匹配策略和多分辨率适配方案。",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["color_at_point", "find_by_color", "template_strategy", "multi_resolution"],
        description: "操作类型：color_at_point=坐标取色, find_by_color=颜色查找代码生成, template_strategy=模板匹配策略, multi_resolution=多分辨率适配方案",
      },
      x: {
        type: "number",
        description: "X坐标（color_at_point时使用）",
      },
      y: {
        type: "number",
        description: "Y坐标（color_at_point时使用）",
      },
      targetColor: {
        type: "string",
        description: "目标颜色值，支持RGB(A)格式，如 #FF0000 或 255,0,0 或 rgba(255,0,0,1)",
      },
      tolerance: {
        type: "number",
        description: "颜色容差 0-255，默认10",
      },
      region: {
        type: "string",
        description: "搜索区域，格式: x,y,w,h，如 0,0,1080,1920",
      },
      targetDescription: {
        type: "string",
        description: "目标描述（例：红色按钮、绿色开始图标），用于生成完整的图色识别策略",
      },
      screenWidth: {
        type: "number",
        description: "屏幕宽度，用于多分辨率适配",
      },
      screenHeight: {
        type: "number",
        description: "屏幕高度，用于多分辨率适配",
      },
      platform: {
        type: "string",
        enum: ["android", "ios", "harmony"],
        description: "目标平台",
      },
    },
  },
  handler: async (args: {
    action?: string;
    x?: number;
    y?: number;
    targetColor?: string;
    tolerance?: number;
    region?: string;
    targetDescription?: string;
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
  }) => {
    const action = args.action || "template_strategy";
    const tolerance = args.tolerance || 10;
    let result: any = {};

    switch (action) {
      case "color_at_point":
        result = {
          action: "color_at_point",
          point: { x: args.x, y: args.y },
          tips: [
            "在 IDEA EasyClick 插件中使用截图工具，鼠标悬停即可查看坐标和颜色值",
            "使用 EC CLI 截图: ec-android-cli capture-screen -m tengxun",
            "颜色值格式: #RRGGBB (十六进制) 或 R,G,B (十进制)",
          ],
          codeSnippet: `// 检测指定坐标颜色是否存在
let color = image.getColor(${args.x || "x"}, ${args.y || "y"});
log.info("坐标(${args.x}, ${args.y})的颜色: {}", color);

// 等待指定颜色出现（用于页面判定）
let result = image.waitForColor(${args.x || 100}, ${args.y || 200}, "${args.targetColor || "#FFFFFF"}", ${tolerance}, 5000);
if (result) {
    log.info("颜色匹配成功！");
}`,
          colorFormatGuide: {
            hex: "#RRGGBB 或 #AARRGGBB",
            decimal: "R,G,B 如 255,0,0",
            rgba: "rgba(R,G,B,A) 如 rgba(255,0,0,1.0)",
          },
        };
        break;

      case "find_by_color":
        result = {
          action: "find_by_color",
          strategy: generateFindByColorStrategy(args),
          relevantApis: queryApi({ keyword: "findImage findImageByColor matchTemplate" }),
        };
        break;

      case "template_strategy":
        result = {
          action: "template_strategy",
          strategy: generateTemplateStrategy(args),
          codeTemplate: generateImageRecognitionTemplate(args),
          relevantApis: queryApi({ keyword: "findImage findImageByColor image screenshot" }),
        };
        break;

      case "multi_resolution":
        result = {
          action: "multi_resolution",
          strategy: generateMultiResolutionPlan(args),
        };
        break;

      default:
        result = {
          error: true,
          message: `未知操作: ${action}`,
          supported: ["color_at_point", "find_by_color", "template_strategy", "multi_resolution"],
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
};

/**
 * 生成按颜色查找策略
 */
function generateFindByColorStrategy(args: any) {
  const tolerance = args.tolerance || 10;

  return {
    description: args.targetDescription || "目标元素",
    methods: [
      {
        name: "findImageByColor — 多色点匹配",
        when: "目标有固定颜色特征（如纯色按钮/图标）",
        code: `// 多点颜色匹配（推荐，比单点更精准）
let points = [
    {x: 0, y: 0, color: "${args.targetColor || "#FF0000}"},    // 参照点
    {x: 10, y: 0, color: "${args.targetColor || "#FF0000}"},   // 横向验证点
    {x: 0, y: 10, color: "${args.targetColor || "#FF0000}"},   // 纵向验证点
];
let result = image.findImageByColor(points, {
    region: ${args.region ? `[${args.region}]` : "null"},
    tolerance: ${tolerance},
    threshold: 0.8
});
if (result) {
    device.click(result.x, result.y);
}`,
      },
      {
        name: "findImage — 模板匹配",
        when: "图标固定不随分辨率变化（如游戏图标）",
        code: `let p = image.findImage("${args.targetDescription || "template"}.png", {
    tolerance: ${tolerance},
    region: ${args.region ? `[${args.region}]` : "null"}
});
if (p) device.click(p.x + 5, p.y + 5);`,
      },
      {
        name: "matchTemplate — OpenCV模板匹配",
        when: "高级场景/需要高精度/图形变形",
        code: `let result = image.matchTemplate("${args.targetDescription || "template"}.png", {
    method: 5,         // TM_CCOEFF_NORMED 归一化相关系数
    threshold: 0.8,    // 相似度阈值
    limit: 1,          // 返回最佳匹配
    region: ${args.region ? `[${args.region}]` : "null"}
});
if (result && result.length > 0) {
    device.click(result[0].x, result[0].y);
}`,
      },
    ],
    toleranceGuide: {
      5: "精确匹配（同一设备、同一分辨率）",
      10: "精确保守（默认推荐）",
      15: "适度宽松（不同批次设备、轻微色差）",
      25: "宽松匹配（跨机型、屏幕老化）",
      35: "极宽松（游戏场景、动画效果、渐变背景）",
    },
  };
}

/**
 * 生成模板匹配策略
 */
function generateTemplateStrategy(args: any) {
  return {
    recommendation: "三模互补策略（按优先级）",
    strategies: [
      {
        priority: 1,
        name: "UI控件定位",
        reliability: "最高",
        speed: "最快",
        code: `// 优先用UI控件
let el = ui.findOne("text=${args.targetDescription || '目标'}", 2000);
if (el) { el.click(); return; }`,
      },
      {
        priority: 2,
        name: "OCR文字识别",
        reliability: "高",
        speed: "中等(200-500ms)",
        code: `// OCR找到文字后点击
let results = ocr.recognize(null, {timeout: 3000});
for (let r of results) {
    if (r.text.includes("${args.targetDescription || '目标文本'}")) {
        device.click(r.centerX, r.centerY);
        break;
    }
}`,
      },
      {
        priority: 3,
        name: "多色点匹配",
        reliability: "中高",
        speed: "快(50-100ms)",
        code: `// 多点颜色匹配
let points = [
    {x: 0, y: 0, color: "${args.targetColor || "#FF0000}"},
    {x: 10, y: 10, color: "${args.targetColor || "#FF0000}"},
];
let p = image.findImageByColor(points, {tolerance: ${args.tolerance || 10}});
if (p) device.click(p.x, p.y);`,
      },
      {
        priority: 4,
        name: "模板图片匹配",
        reliability: "中",
        speed: "慢(200-800ms)",
        code: `// 最后兜底：模板匹配
let p = image.findImage("${args.targetDescription || "target"}.png", {
    tolerance: ${(args.tolerance || 10) + 5}
});
if (p) device.click(p.x, p.y);`,
      },
    ],
    tip: "UI控件和OCR方案不需要预先准备素材，维护成本低，优先使用。图像方案作为兜底。",
  };
}

/**
 * 生成图像识别代码模板
 */
function generateImageRecognitionTemplate(args: any) {
  const desc = args.targetDescription || "目标元素";
  return `/**
 * ${desc} — 三模识别（UI → OCR → 图像兜底）
 */
function findAndClick${toPascalCase(desc)}(timeout) {
    timeout = timeout || 5000;
    let startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        // 策略1: UI控件
        ${desc.includes("按钮") || desc.includes("文字")
          ? `let el = ui.findOne("text=${desc}", 1000);\n        if (el) { el.click(); return true; }`
          : `// UI控件不适用于${desc}，跳过`}

        // 策略2: OCR
        try {
            let results = ocr.recognize(null, {timeout: 2000});
            for (let r of results) {
                if (r.text.includes("${desc}")) {
                    device.click(r.centerX + random(-3, 3), r.centerY + random(-3, 3));
                    return true;
                }
            }
        } catch(e) {}

        // 策略3: 图像模板
        let p = image.findImage("${desc.replace(/[^\w一-鿿]/g, "_")}.png", {
            tolerance: 15,
            region: ${args.region ? `[${args.region}]` : "null"}
        });
        if (p) {
            device.click(p.x + random(-3, 3), p.y + random(-3, 3));
            return true;
        }

        sleep(500);
    }
    log.warn("${desc} 未找到（已超时{}ms）", timeout);
    return false;
}`;
}

/**
 * 生成多分辨率适配方案
 */
function generateMultiResolutionPlan(args: any) {
  const w = args.screenWidth || 1080;
  const h = args.screenHeight || 1920;

  return {
    principle: "比例换算 + 多套模板 + 动态缩放",
    methods: [
      {
        name: "比例换算",
        description: "以设计分辨率(720x1280)为基准，运行时按比例换算坐标",
        code: `const BASE_W = 720;
const BASE_H = 1280;
let actualW = device.getScreenWidth();
let actualH = device.getScreenHeight();
let scaleX = actualW / BASE_W;
let scaleY = actualH / BASE_H;

function tap(x, y) {
    let realX = Math.round(x * scaleX);
    let realY = Math.round(y * scaleY);
    device.click(realX + random(-3, 3), realY + random(-3, 3));
}
// 后续统一用基准坐标：tap(360, 640);`,
      },
      {
        name: "多套模板",
        description: "为常见分辨率准备不同模板，运行时自动选择最接近的",
        code: `let resMap = {
    "720x1280": "btn_720p.png",
    "1080x1920": "btn_1080p.png",
    "1080x2400": "btn_1080p_tall.png",
    "1440x3200": "btn_1440p.png",
};
let w = device.getScreenWidth() + "x" + device.getScreenHeight();
let template = resMap[w] || "btn_default.png";
let p = image.findImage(template, {tolerance: 15});`,
      },
      {
        name: "动态缩放",
        description: "模板图片根据当前分辨率自动缩放后匹配",
        code: `let actualW = device.getScreenWidth();
let actualH = device.getScreenHeight();
let scale = Math.min(actualW / 1080, actualH / 1920);

let p = image.findImage("btn.png", {
    scale: scale,    // 动态缩放
    tolerance: 15
});`,
      },
    ],
    supportedResolutions: [
      { w: 720, h: 1280, devices: "低端机/小屏" },
      { w: 1080, h: 1920, devices: "主流机型(16:9)" },
      { w: 1080, h: 2340, devices: "全面屏(19.5:9)" },
      { w: 1080, h: 2400, devices: "长屏(20:9)" },
      { w: 1440, h: 3200, devices: "2K屏/旗舰机" },
    ],
    recommendation: `当前设备 ${w}x${h}，建议以 1080x1920 为基准分辨率`,
  };
}

function toPascalCase(str: string): string {
  return str.replace(/[^\w一-鿿]+/g, "").slice(0, 20);
}
