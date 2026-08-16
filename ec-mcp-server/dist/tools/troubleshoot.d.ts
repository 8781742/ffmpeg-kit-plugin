/**
 * EC 故障排查工具
 * 提供脚本常见问题的快速诊断与修复
 */
export declare const troubleshootTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            problem: {
                type: string;
                description: string;
            };
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
            codeSnippet: {
                type: string;
                description: string;
            };
        };
    };
    handler: (args: {
        problem: string;
        platform?: string;
        codeSnippet?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=troubleshoot.d.ts.map