/**
 * 文件操作工具 — 读取EC项目文件、日志、配置等
 */
import * as fs from "fs";
import * as path from "path";
/**
 * 安全读取文件（带错误处理）
 */
export function readFileSafe(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return fs.readFileSync(filePath, "utf-8");
    }
    catch (e) {
        return null;
    }
}
/**
 * 查找EC项目根目录（向上查找包含 ec_work_config 或 obfuscator.json 的目录）
 */
export function findEcProject(startDir) {
    let current = startDir;
    for (let i = 0; i < 10; i++) {
        if (fs.existsSync(path.join(current, "ec_work_config")) ||
            fs.existsSync(path.join(current, "obfuscator.json"))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current)
            break;
        current = parent;
    }
    return null;
}
/**
 * 读取EC项目的日志文件
 */
export function readEcLogs(projectDir, maxLines = 200) {
    // EC日志通常在项目根目录或logs子目录
    const logPaths = [
        path.join(projectDir, "log.txt"),
        path.join(projectDir, "logs", "log.txt"),
        path.join(projectDir, "ec_log.txt"),
        path.join(projectDir, "logs", "latest.log"),
    ];
    for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, "utf-8");
            const lines = content.split("\n");
            const recent = lines.slice(-maxLines);
            return recent.join("\n");
        }
    }
    return "";
}
/**
 * 获取EC项目结构概览
 */
export function getProjectOverview(projectDir) {
    const items = [];
    const listDir = (dir, indent = "") => {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith(".") || entry.name === "node_modules")
                    continue;
                if (entry.isDirectory()) {
                    items.push(`${indent}📁 ${entry.name}/`);
                    listDir(path.join(dir, entry.name), indent + "  ");
                }
                else {
                    const size = fs.statSync(path.join(dir, entry.name)).size;
                    items.push(`${indent}📄 ${entry.name} (${formatSize(size)})`);
                }
            }
        }
        catch {
            // skip inaccessible dirs
        }
    };
    listDir(projectDir);
    return items.join("\n");
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
}
/**
 * 检测项目目标平台
 */
export function detectPlatform(projectDir) {
    const platforms = [];
    const configDir = path.join(projectDir, "ec_work_config");
    if (fs.existsSync(configDir)) {
        try {
            const entries = fs.readdirSync(configDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const name = entry.name.toLowerCase();
                    if (name === "android")
                        platforms.push("android");
                    if (name === "ios")
                        platforms.push("ios");
                    if (name === "harmony" || name === "harmonyos")
                        platforms.push("harmony");
                }
            }
        }
        catch {
            // ignore
        }
    }
    return platforms;
}
//# sourceMappingURL=file-utils.js.map