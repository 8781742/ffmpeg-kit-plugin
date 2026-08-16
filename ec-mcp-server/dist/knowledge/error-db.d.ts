/**
 * EasyClick 常见错误归档与解决方案库
 * 持续沉淀排错经验，提升AI输出代码质量
 */
export interface ErrorEntry {
    pattern: string;
    title: string;
    platform: string;
    cause: string;
    solution: string;
    codeFix: string;
    severity: "fatal" | "error" | "warn";
}
export declare const ERROR_DATABASE: ErrorEntry[];
/**
 * 根据错误日志匹配解决方案
 */
export declare function matchError(logText: string, platform?: string): ErrorEntry[];
/**
 * 获取所有已知错误模式
 */
export declare function getAllErrors(): ErrorEntry[];
//# sourceMappingURL=error-db.d.ts.map