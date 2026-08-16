/**
 * EC 脚本生成工具
 * 基于模板和需求描述，生成完整的 EasyClick 脚本
 */
export declare const scriptGenTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            template: {
                type: string;
                enum: string[];
                description: string;
            };
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
            targetApp: {
                type: string;
                description: string;
            };
            requirements: {
                type: string;
                description: string;
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
    };
    handler: (args: {
        template?: string;
        platform?: string;
        targetApp?: string;
        requirements?: string;
        features?: string[];
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=script-gen.d.ts.map