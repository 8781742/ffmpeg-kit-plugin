/**
 * EC API 查询工具
 * 提供自然语言查询EC API文档的能力
 */

import { queryApi, getCategories, getApiStats } from "../knowledge/ec-api-db.js";

export const apiQueryTool = {
  name: "ec_api_query",
  description:
    "查询 EasyClick API 文档。根据平台(android/ios/harmony)、分类(device/ui/image/ocr/app/http等)和关键词搜索 EC API，返回匹配的 API 签名、参数说明和示例代码。",
  inputSchema: {
    type: "object",
    properties: {
      platform: {
        type: "string",
        enum: ["android", "ios", "harmony", "common", "all"],
        description: "目标平台，默认all查询全部",
      },
      category: {
        type: "string",
        description: "API分类：device(设备操作)、ui(UI控件)、image(图像识别)、ocr(文字识别)、app(应用操作)、floaty(悬浮窗)、http(网络)、log(日志)、file(文件)、control(全局控制)、util(工具)",
      },
      keyword: {
        type: "string",
        description: "搜索关键词，匹配API名称、描述、签名",
      },
    },
  },
  handler: async (args: { platform?: string; category?: string; keyword?: string }) => {
    const results = queryApi({
      platform: args.platform || "all",
      category: args.category,
      keyword: args.keyword,
    });

    const categories = getCategories();
    const stats = getApiStats();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: results.length,
              results: results.map((api) => ({
                name: api.name,
                platform: api.platform,
                category: api.category,
                signature: api.signature,
                description: api.description,
                params: api.params || [],
                example: api.example,
                cautions: api.cautions || [],
              })),
              availableCategories: categories,
              stats,
              tip: "需要某个API的详细用法或遇到报错，请继续追问。",
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
