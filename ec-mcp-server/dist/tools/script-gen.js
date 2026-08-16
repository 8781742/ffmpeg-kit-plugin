/**
 * EC 脚本生成工具
 * 基于模板和需求描述，生成完整的 EasyClick 脚本
 */
import { getTemplates } from "../knowledge/templates.js";
import { queryApi } from "../knowledge/ec-api-db.js";
export const scriptGenTool = {
    name: "ec_script_gen",
    description: "根据需求描述和场景类型，生成完整的 EasyClick 自动化脚本。可以选择模板类型（基础框架/游戏挂机/授权系统/云控通信），也可以自由描述需求来自定义生成。",
    inputSchema: {
        type: "object",
        properties: {
            template: {
                type: "string",
                enum: ["基础框架", "游戏挂机", "授权验证系统", "云端群控通信", "自定义"],
                description: "脚本模板类型",
            },
            platform: {
                type: "string",
                enum: ["android", "ios", "harmony"],
                description: "目标平台，默认android",
            },
            targetApp: {
                type: "string",
                description: "目标应用包名或名称",
            },
            requirements: {
                type: "string",
                description: "自由描述你的自动化需求（模板选'自定义'时必填）",
            },
            features: {
                type: "array",
                items: { type: "string" },
                description: "需要的特性：弹窗拦截、卡屏恢复、断点续跑、错误上报、网络验证、云控通信等",
            },
        },
    },
    handler: async (args) => {
        const platform = args.platform || "android";
        let generatedScript = "";
        let templateInfo = null;
        if (args.template && args.template !== "自定义") {
            const templates = getTemplates();
            templateInfo = templates.find((t) => t.name === args.template);
            if (templateInfo) {
                generatedScript = templateInfo.code;
                // 替换平台特定内容
                if (args.targetApp) {
                    generatedScript = generatedScript.replace(/com\.example\.(app|game)/g, args.targetApp);
                }
            }
        }
        // 如果是自定义或没找到模板，生成基础框架
        if (!generatedScript) {
            const baseTemplate = getTemplates().find((t) => t.name === "基础自动化模板");
            if (baseTemplate) {
                generatedScript = baseTemplate.code;
                if (args.targetApp) {
                    generatedScript = generatedScript.replace(/com\.example\.app/g, args.targetApp);
                }
            }
        }
        // 获取相关 API
        const relevantApis = queryApi({
            platform: platform,
            keyword: args.requirements || "",
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        template: args.template || "基础自动化模板",
                        platform,
                        targetApp: args.targetApp || "未指定",
                        requirements: args.requirements || "",
                        features: args.features || [],
                        generatedScript,
                        relevantApis: relevantApis.slice(0, 10).map((api) => ({
                            name: api.name,
                            signature: api.signature,
                            description: api.description,
                            example: api.example,
                        })),
                        availableTemplates: getTemplates().map((t) => ({
                            name: t.name,
                            category: t.category,
                            description: t.description,
                            features: t.features,
                        })),
                        instruction: `
========================================
脚本已生成，请复制到 EC IDE 中运行。

注意事项：
1. 替换 CONFIG.targetPackage 为实际包名
2. 根据具体页面调整选择器（text/id/class）
3. 首次运行建议逐步调试，观察日志输出
4. 发布前启用代码加密和混淆

如果有报错，请使用 ec_log_parse 工具分析日志。
========================================`,
                    }, null, 2),
                },
            ],
        };
    },
};
//# sourceMappingURL=script-gen.js.map