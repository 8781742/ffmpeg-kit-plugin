/**
 * EC API 查询工具
 * 提供自然语言查询EC API文档的能力
 */
export declare const apiQueryTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            keyword: {
                type: string;
                description: string;
            };
        };
    };
    handler: (args: {
        platform?: string;
        category?: string;
        keyword?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=api-query.d.ts.map