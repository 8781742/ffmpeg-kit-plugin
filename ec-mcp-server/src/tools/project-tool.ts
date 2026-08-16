/**
 * EC 项目工具
 * 项目结构分析、平台检测、配置检查
 */

import { getProjectOverview, detectPlatform, findEcProject, readEcLogs } from "../utils/file-utils.js";

export const projectTool = {
  name: "ec_project_info",
  description:
    "分析 EasyClick 项目结构，检测目标平台，读取项目配置，获取项目概览。用于了解当前EC项目的整体情况。",
  inputSchema: {
    type: "object",
    properties: {
      projectDir: {
        type: "string",
        description: "EC项目目录路径，不填则自动检测",
      },
      action: {
        type: "string",
        enum: ["overview", "platform", "config", "all"],
        description: "操作类型：overview=项目结构, platform=检测平台, config=读取配置, all=全部",
      },
    },
  },
  handler: async (args: { projectDir?: string; action?: string }) => {
    const projectDir = args.projectDir || findEcProject(process.cwd());

    if (!projectDir) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: true,
                message: "未找到EC项目目录",
                suggestion:
                  "请在EC项目目录下运行，或通过 --projectDir 指定项目路径。\nEC项目特征：包含 ec_work_config/ 目录 或 obfuscator.json 文件",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const action = args.action || "all";
    const result: any = { projectDir };

    if (action === "overview" || action === "all") {
      result.structure = getProjectOverview(projectDir);
    }

    if (action === "platform" || action === "all") {
      result.platforms = detectPlatform(projectDir);
    }

    if (action === "config" || action === "all") {
      const { readFileSafe } = await import("../utils/file-utils.js");
      const obfuscatorConfig = readFileSafe(
        projectDir + "/obfuscator.json"
      );
      const libConfig = readFileSafe(projectDir + "/lib.json");

      if (obfuscatorConfig) {
        try {
          result.obfuscatorConfig = JSON.parse(obfuscatorConfig);
        } catch {
          result.obfuscatorConfig = { raw: obfuscatorConfig };
        }
      }

      if (libConfig) {
        try {
          result.libConfig = JSON.parse(libConfig);
        } catch {
          result.libConfig = { raw: libConfig };
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
