/**
 * EasyClick 脚本模板库
 * 提供各类场景的标准模板，确保代码质量和防封能力
 */
export interface ScriptTemplate {
    name: string;
    category: string;
    description: string;
    platform: string;
    code: string;
    features: string[];
}
export declare const SCRIPT_TEMPLATES: ScriptTemplate[];
/**
 * 按分类获取模板
 */
export declare function getTemplates(category?: string): ScriptTemplate[];
/**
 * 获取模板分类列表
 */
export declare function getTemplateCategories(): string[];
//# sourceMappingURL=templates.d.ts.map