/**
 * 日志解析工具
 * 读取EC运行日志，自动定位错误并匹配解决方案
 */

import { matchError, getAllErrors } from "../knowledge/error-db.js";
import { readEcLogs, findEcProject } from "../utils/file-utils.js";

export const logParserTool = {
  name: "ec_log_parse",
  description:
    "读取 EasyClick 脚本运行日志，自动分析错误信息，匹配已知错误库并输出修复方案。可以指定日志文件路径，也可以自动搜索项目中的日志文件。",
  inputSchema: {
    type: "object",
    properties: {
      logPath: {
        type: "string",
        description: "日志文件的完整路径。不填则自动搜索项目日志文件",
      },
      platform: {
        type: "string",
        enum: ["android", "ios", "harmony"],
        description: "目标平台，用于精确匹配平台专属错误",
      },
      lines: {
        type: "number",
        description: "读取日志的最后N行，默认200行",
      },
      projectDir: {
        type: "string",
        description: "EC项目目录路径，用于自动搜索日志文件",
      },
    },
  },
  handler: async (args: {
    logPath?: string;
    platform?: string;
    lines?: number;
    projectDir?: string;
  }) => {
    let logContent = "";

    if (args.logPath) {
      const { readFileSafe } = await import("../utils/file-utils.js");
      logContent = readFileSafe(args.logPath) || "";
      if (!logContent) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: true,
                  message: `日志文件不存在或无法读取: ${args.logPath}`,
                  suggestion: "请检查文件路径是否正确",
                },
                null,
                2
              ),
            },
          ],
        };
      }
    } else {
      // 自动搜索
      const projectDir = args.projectDir || findEcProject(process.cwd());
      if (projectDir) {
        logContent = readEcLogs(projectDir, args.lines || 200);
      }

      if (!logContent) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: true,
                  message: "未找到EC日志文件",
                  suggestion:
                    "请提供日志文件路径(--logPath)，或确保在EC项目目录下运行",
                  searchedDirs: projectDir ? [projectDir] : [process.cwd()],
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    // 按行分割
    const logLines = logContent.split("\n");
    const lastNLines = logLines.slice(-(args.lines || 200));

    // 提取错误行
    const errorLines = lastNLines.filter(
      (line) =>
        line.toLowerCase().includes("error") ||
        line.toLowerCase().includes("fail") ||
        line.toLowerCase().includes("exception") ||
        line.toLowerCase().includes("crash") ||
        line.toLowerCase().includes("timeout") ||
        line.toLowerCase().includes("null") ||
        line.toLowerCase().includes("undefined")
    );

    // 匹配已知错误库
    let matchedErrors: any[] = [];
    for (const line of errorLines) {
      const matches = matchError(line, args.platform);
      for (const m of matches) {
        // 去重
        if (!matchedErrors.find((e) => e.title === m.title)) {
          matchedErrors.push({
            matchedLine: line.trim(),
            title: m.title,
            cause: m.cause,
            solution: m.solution,
            codeFix: m.codeFix,
            severity: m.severity,
            platform: m.platform,
          });
        }
      }
    }

    // 未匹配的错误行
    const unmatchedErrors = errorLines.filter(
      (line) =>
        !matchedErrors.some((m) => line.includes(m.matchedLine.split(":")[0] || ""))
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              logFile: args.logPath || "自动搜索",
              totalLines: logLines.length,
              analyzedLines: lastNLines.length,
              errorLinesFound: errorLines.length,
              matchedSolutions: matchedErrors,
              unmatchedErrors:
                unmatchedErrors.length > 0
                  ? unmatchedErrors.slice(0, 10).map((l) => l.trim())
                  : [],
              allKnownErrors: getAllErrors().map((e) => ({
                pattern: e.pattern,
                title: e.title,
                severity: e.severity,
              })),
              summary:
                matchedErrors.length > 0
                  ? `找到 ${matchedErrors.length} 个已知错误模式，已提供修复方案。`
                  : "未匹配到已知错误模式。如果是新错误，请将错误信息提供给开发者以添加到错误库。",
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
