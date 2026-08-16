/**
 * EC 项目工具
 * 项目结构分析、平台检测、配置检查
 */
export declare const projectTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectDir: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
        };
    };
    handler: (args: {
        projectDir?: string;
        action?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=project-tool.d.ts.map