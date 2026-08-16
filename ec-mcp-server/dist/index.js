#!/usr/bin/env node
/**
 * EasyClick MCP Server
 * =====================
 * AI 驱动的 EasyClick 自动化脚本开发工具集
 *
 * 功能：
 * - EC API 智能查询（40+ 核心API文档）
 * - 脚本模板生成（基础框架/游戏/授权/云控）
 * - 日志分析与排错（12+ 常见错误模式）
 * - 项目结构分析（平台检测/配置检查）
 * - 故障快速诊断（闪退/卡屏/权限/网络等）
 * - 截图取色分析（颜色提取/模板策略/多分辨率适配）
 * - Web开发脚手架（Go/Node/Python全栈项目生成）
 *
 * 使用方式：
 * 1. 在 Claude Code settings.json 中配置：
 *    "mcpServers": {
 *      "easyclick": {
 *        "command": "node",
 *        "args": ["D:/ec/tengxun/ec-mcp-server/dist/index.js"]
 *      }
 *    }
 *
 * 2. 在 Claude Code 中直接对话即可调用所有工具
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// ====== 导入工具 ======
import { apiQueryTool } from "./tools/api-query.js";
import { logParserTool } from "./tools/log-parser.js";
import { scriptGenTool } from "./tools/script-gen.js";
import { projectTool } from "./tools/project-tool.js";
import { troubleshootTool } from "./tools/troubleshoot.js";
import { imageColorTool } from "./tools/image-color.js";
import { webScaffoldTool } from "./tools/web-scaffold.js";
// ====== 注册工具列表 ======
const TOOLS = [
    apiQueryTool,
    logParserTool,
    scriptGenTool,
    projectTool,
    troubleshootTool,
    imageColorTool,
    webScaffoldTool,
];
// ====== 创建 MCP Server ======
const server = new Server({
    name: "easyclick-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// ====== 工具列表处理器 ======
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});
// ====== 工具调用处理器 ======
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: true,
                        message: `未知工具: ${name}`,
                        availableTools: TOOLS.map((t) => t.name),
                    }),
                },
            ],
            isError: true,
        };
    }
    try {
        const result = await tool.handler((args || {}));
        return result;
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: true,
                        message: `工具 ${name} 执行出错: ${error.message}`,
                        stack: error.stack,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
// ====== 启动服务 ======
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // 输出启动信息到 stderr（不影响 stdio 通信）
    console.error("=".repeat(50));
    console.error("🟢 EasyClick MCP Server v1.0.0 已启动");
    console.error("📦 已加载工具:");
    for (const tool of TOOLS) {
        console.error(`   • ${tool.name} — ${tool.description.split("。")[0]}。`);
    }
    console.error("=".repeat(50));
}
main().catch((error) => {
    console.error("❌ MCP Server 启动失败:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map