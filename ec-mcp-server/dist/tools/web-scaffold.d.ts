/**
 * EC Web 开发脚手架工具
 * 快速生成 Go/Gin、Node/Vue3、Python 技术栈的全栈项目
 */
export declare const webScaffoldTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            techStack: {
                type: string;
                enum: string[];
                description: string;
            };
            projectType: {
                type: string;
                enum: string[];
                description: string;
            };
            database: {
                type: string;
                enum: string[];
                description: string;
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            projectName: {
                type: string;
                description: string;
            };
        };
    };
    handler: (args: {
        techStack?: string;
        projectType?: string;
        database?: string;
        features?: string[];
        projectName?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=web-scaffold.d.ts.map