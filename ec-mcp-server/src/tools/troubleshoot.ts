/**
 * EC 故障排查工具
 * 提供脚本常见问题的快速诊断与修复
 */

import { matchError } from "../knowledge/error-db.js";
import { queryApi } from "../knowledge/ec-api-db.js";

export const troubleshootTool = {
  name: "ec_troubleshoot",
  description:
    "快速诊断 EasyClick 脚本的常见问题（脚本闪退、找不到控件、卡屏、权限问题、网络错误等），提供针对性修复建议。",
  inputSchema: {
    type: "object",
    properties: {
      problem: {
        type: "string",
        description: "遇到的问题描述（用自然语言描述即可）",
      },
      platform: {
        type: "string",
        enum: ["android", "ios", "harmony"],
        description: "目标平台",
      },
      codeSnippet: {
        type: "string",
        description: "出问题的代码片段（可选，提供后能更精准定位）",
      },
    },
  },
  handler: async (args: {
    problem: string;
    platform?: string;
    codeSnippet?: string;
  }) => {
    // 匹配错误库
    const errorMatches = matchError(args.problem, args.platform);

    // 关键词诊断
    const problemLower = args.problem.toLowerCase();
    const diagnoses: any[] = [];

    if (
      problemLower.includes("闪退") ||
      problemLower.includes("crash") ||
      problemLower.includes("崩溃")
    ) {
      diagnoses.push({
        issue: "脚本闪退/崩溃",
        commonCauses: [
          "控件findOne返回null后直接调用click()",
          "权限未授予（无障碍/悬浮窗/存储）",
          "内存溢出（循环中未释放截图资源）",
          "EC版本与API不兼容",
        ],
        quickFixes: [
          "在所有findOne后添加判空逻辑：if(el) { el.click(); }",
          "脚本开头添加权限检查和引导",
          "使用image.keepScreen(true)复用截图，定期调用gc()",
          "检查EC版本并在开头做版本兼容判断",
        ],
        relevantApis: queryApi({ keyword: "permission requestPermission" }).slice(0, 3),
      });
    }

    if (
      problemLower.includes("卡") ||
      problemLower.includes("不动") ||
      problemLower.includes("stuck")
    ) {
      diagnoses.push({
        issue: "脚本卡住/页面无响应",
        commonCauses: [
          "弹窗未拦截，等待用户操作",
          "页面加载慢，超时时间不足",
          "目标控件不存在或已变更",
          "网络请求阻塞",
        ],
        quickFixes: [
          "使用setDialogInterceptor设置弹窗自动拦截",
          "增加findOne的timeout参数（如10000ms）",
          "添加isStuck卡屏检测逻辑",
          "为网络请求设置超时和重试机制",
        ],
        relevantApis: queryApi({ keyword: "stuck dialog" }).slice(0, 3),
      });
    }

    if (
      problemLower.includes("权限") ||
      problemLower.includes("permission")
    ) {
      diagnoses.push({
        issue: "权限问题",
        commonCauses: [
          "无障碍服务未开启",
          "悬浮窗权限被拒绝",
          "存储权限未授予",
          "电池优化导致后台被杀",
        ],
        quickFixes: [
          "android.requestPermission('accessibility') 检查并引导",
          "跳转系统设置页面引导用户手动开启",
          "添加电池优化白名单请求",
        ],
        relevantApis: queryApi({ keyword: "permission accessibility floaty" }).slice(0, 5),
      });
    }

    if (
      problemLower.includes("找图") ||
      problemLower.includes("识别") ||
      problemLower.includes("findimage") ||
      problemLower.includes("image")
    ) {
      diagnoses.push({
        issue: "图像/OCR识别问题",
        commonCauses: [
          "模板图片与目标分辨率不匹配",
          "tolerance容差设置过小",
          "图片路径错误",
          "OCR模型未下载或语言设置错误",
        ],
        quickFixes: [
          "调大tolerance容差（20-30）",
          "使用scale参数适配不同分辨率",
          "准备多套模板（720p/1080p/1440p）",
          "检查OCR语言参数: ocr.recognize(null, {language: 'zh'})",
        ],
        relevantApis: queryApi({ keyword: "image ocr findImage findText" }).slice(0, 5),
      });
    }

    if (
      problemLower.includes("网络") ||
      problemLower.includes("http") ||
      problemLower.includes("请求")
    ) {
      diagnoses.push({
        issue: "网络请求问题",
        commonCauses: [
          "设备无网络连接",
          "请求超时时间不足",
          "服务器SSL证书问题",
          "请求被防火墙/安全软件拦截",
        ],
        quickFixes: [
          "增加timeout参数: http.get(url, {}, 30000)",
          "添加请求重试机制（建议3次）",
          "检查url是否以http://或https://开头",
          "使用try-catch包裹网络请求",
        ],
        relevantApis: queryApi({ keyword: "http get postJSON" }).slice(0, 3),
      });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              problem: args.problem,
              platform: args.platform || "未指定",
              errorMatches: errorMatches.map((e) => ({
                title: e.title,
                cause: e.cause,
                solution: e.solution,
                codeFix: e.codeFix,
                severity: e.severity,
              })),
              diagnoses,
              summary:
                diagnoses.length > 0
                  ? `找到 ${diagnoses.length} 个匹配的诊断方案，${errorMatches.length} 个已知错误模式。`
                  : "未找到精确匹配。请提供更多细节（运行日志、报错截图、代码片段）。",
              tip: "如果以上方案未解决问题，请使用 ec_log_parse 工具分析完整运行日志。",
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
