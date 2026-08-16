/**
 * EasyClick API 知识库 — 自动生成，安卓平台 (acEvent/无障碍模式)
 * 数据来源: http://127.0.0.1:10089/docs/zh-cn/funcs/
 * 平台: Android only (不再包含 iOS/Harmony)
 * 注意: 所有API以 Android 无障碍(acEvent)模式下的实测结果为准
 */
export interface ApiEntry {
    name: string;
    platform: "android" | "common";
    category: string;
    signature: string;
    description: string;
    params?: {
        name: string;
        type: string;
        desc: string;
    }[];
    returnType?: string;
    example: string;
    cautions?: string[];
}
export declare const EC_API_DATABASE: ApiEntry[];
/**
 * 按平台和分类筛选API
 */
export declare function queryApi(options: {
    platform?: string;
    category?: string;
    keyword?: string;
}): ApiEntry[];
/**
 * 获取所有API分类
 */
export declare function getCategories(): string[];
/**
 * 获取API按分类的分组统计
 */
export declare function getApiStats(): Record<string, number>;
//# sourceMappingURL=ec-api-db.d.ts.map