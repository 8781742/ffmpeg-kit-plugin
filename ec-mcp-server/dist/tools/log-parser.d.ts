/**
 * 日志解析工具
 * 读取EC运行日志，自动定位错误并匹配解决方案
 */
export declare const logParserTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            logPath: {
                type: string;
                description: string;
            };
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
            lines: {
                type: string;
                description: string;
            };
            projectDir: {
                type: string;
                description: string;
            };
        };
    };
    handler: (args: {
        logPath?: string;
        platform?: string;
        lines?: number;
        projectDir?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=log-parser.d.ts.map