/**
 * EC 截图取色工具
 * 自动解析图片色值、模板素材，生成精准图色识别代码
 */
export declare const imageColorTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            x: {
                type: string;
                description: string;
            };
            y: {
                type: string;
                description: string;
            };
            targetColor: {
                type: string;
                description: string;
            };
            tolerance: {
                type: string;
                description: string;
            };
            region: {
                type: string;
                description: string;
            };
            targetDescription: {
                type: string;
                description: string;
            };
            screenWidth: {
                type: string;
                description: string;
            };
            screenHeight: {
                type: string;
                description: string;
            };
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
        };
    };
    handler: (args: {
        action?: string;
        x?: number;
        y?: number;
        targetColor?: string;
        tolerance?: number;
        region?: string;
        targetDescription?: string;
        screenWidth?: number;
        screenHeight?: number;
        platform?: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
//# sourceMappingURL=image-color.d.ts.map