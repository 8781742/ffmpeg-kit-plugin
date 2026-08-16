/**
 * 文件操作工具 — 读取EC项目文件、日志、配置等
 */
/**
 * 安全读取文件（带错误处理）
 */
export declare function readFileSafe(filePath: string): string | null;
/**
 * 查找EC项目根目录（向上查找包含 ec_work_config 或 obfuscator.json 的目录）
 */
export declare function findEcProject(startDir: string): string | null;
/**
 * 读取EC项目的日志文件
 */
export declare function readEcLogs(projectDir: string, maxLines?: number): string;
/**
 * 获取EC项目结构概览
 */
export declare function getProjectOverview(projectDir: string): string;
/**
 * 检测项目目标平台
 */
export declare function detectPlatform(projectDir: string): string[];
//# sourceMappingURL=file-utils.d.ts.map