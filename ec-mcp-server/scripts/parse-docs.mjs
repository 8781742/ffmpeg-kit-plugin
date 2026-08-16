// ============================================================
// EC Docs HTML Parser — 从 Docusaurus HTML 提取 Android API 文档
// 用法: node scripts/parse-docs.mjs
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = '/tmp/ec_docs';
const OUTPUT_FILE = 'src/knowledge/ec-api-db.ts';

// 页面 → 分类映射
const CATEGORY_MAP = {
  'global-shortcut': 'device',
  'acevent-api': 'device',
  'device-api': 'device',
  'image-api': 'image',
  'ocr-api': 'ocr',
  'file-api': 'file',
  'shell-api': 'shell',
  'sqlite-api': 'sqlite',
  'utils-api': 'util',
  'storage-api': 'storage',
  'thread-api': 'thread',
  'event-api': 'event',
};

// 页面 → 命名空间
const NAMESPACE_MAP = {
  'global-shortcut': '',        // 全局函数，无命名空间
  'acevent-api': '',            // 无障碍模式也是全局
  'device-api': 'device.',
  'image-api': 'image.',
  'ocr-api': 'ocr.',
  'file-api': 'file.',
  'shell-api': 'shell.',
  'sqlite-api': 'sqlite.',
  'utils-api': 'utils.',
  'storage-api': 'storage.',
  'thread-api': 'thread.',
  'event-api': 'event.',
};

function stripHtml(str) {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\\n/g, '\n')
    .trim();
}

// 提取代码示例
function extractCodeExample(html, headingPos) {
  // 找到 heading 后的第一个 code block
  const afterHeading = html.substring(headingPos);
  const codeBlockMatch = afterHeading.match(/<code class="codeBlockLines[^"]*">([\s\S]*?)<\/code>/);
  if (!codeBlockMatch) return '';

  let code = codeBlockMatch[1]
    .replace(/<span class="codeLineNumber[^"]*"><\/span>/g, '')
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<br\s*\/?>/g, '\n')
    .trim();

  // 清理多余的空白行
  code = code.replace(/\n{3,}/g, '\n\n');
  return code;
}

// 提取参数信息
function extractParams(sectionHtml) {
  const params = [];
  // 查找参数表格
  const paramRegex = /<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]*)<\/td>/g;
  let match;
  while ((match = paramRegex.exec(sectionHtml)) !== null) {
    params.push({
      name: stripHtml(match[1]).trim(),
      type: stripHtml(match[2]).trim(),
      desc: stripHtml(match[3]).trim()
    });
  }
  return params;
}

// 提取返回值
function extractReturnType(sectionHtml) {
  const returnMatch = sectionHtml.match(/返[回同]值?[：:]\s*[【<]?(\w+)[】>]?/i);
  if (returnMatch) return returnMatch[1];

  const returnMatch2 = sectionHtml.match(/返回值[：:]\s*(\w+)/i);
  if (returnMatch2) return returnMatch2[1];

  return undefined;
}

// 解析每个页面
function parseDocPage(filePath, pageName) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const category = CATEGORY_MAP[pageName] || 'device';
  const ns = NAMESPACE_MAP[pageName] || '';

  const apis = [];

  // 找出所有 h3 heading (每个函数一个)
  const h3Regex = /<h3 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)<\/h3>/g;
  let h3Match;

  while ((h3Match = h3Regex.exec(html)) !== null) {
    const funcId = h3Match[1];
    const funcTitle = stripHtml(h3Match[2]).replace(/ Direct link.*$/, '').trim();
    const headingPos = h3Match.index;

    // 提取函数名
    let funcName = funcId;
    // 去掉中文后缀 (e.g. "clickpoint-坐标点击" → "clickpoint")
    const nameMatch = funcId.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (nameMatch) funcName = nameMatch[1];

    // 提取这一段的内容 (到下一个 h3 或 h2 结束)
    let sectionEnd = html.indexOf('<h3 class="anchor', headingPos + 1);
    if (sectionEnd === -1) sectionEnd = html.indexOf('<h2 class="anchor', headingPos + 1);
    if (sectionEnd === -1) sectionEnd = html.length;
    const sectionHtml = html.substring(headingPos, sectionEnd);

    // 提取描述
    const descMatch = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    let description = descMatch ? stripHtml(descMatch[1]) : funcTitle;
    // 清理太长的描述
    if (description.length > 200) description = description.substring(0, 197) + '...';

    // 提取代码示例
    const example = extractCodeExample(html, headingPos);

    // 提取参数
    const params = extractParams(sectionHtml);

    // 提取返回值
    const returnType = extractReturnType(sectionHtml);

    // 提取注意事项
    const cautions = [];
    const cautionRegex = /<blockquote[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/blockquote>/g;
    let cautionMatch;
    while ((cautionMatch = cautionRegex.exec(sectionHtml)) !== null) {
      cautions.push(stripHtml(cautionMatch[1]));
    }

    // 构建完整签名
    let signature = ns ? ns + funcName : funcName;
    if (params.length > 0) {
      const paramStrs = params.map(p => `${p.name}: ${p.type}`).join(', ');
      signature += `(${paramStrs})`;
    } else {
      signature += '()';
    }
    if (returnType) signature += `: ${returnType}`;

    apis.push({
      name: funcName,
      platform: 'android',
      category,
      signature,
      description: description || funcTitle,
      params: params.length > 0 ? params : undefined,
      returnType,
      example,
      cautions: cautions.length > 0 ? cautions : undefined,
    });
  }

  // 如果没有 h3, 尝试提取 h2 级别的函数
  if (apis.length === 0) {
    const h2Regex = /<h2 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/g;
    let h2Match;
    while ((h2Match = h2Regex.exec(html)) !== null) {
      const funcId = h2Match[1];
      if (funcId === '点击函数' || funcId === '滑动函数' || funcId === '获取节点函数' ||
          funcId.includes('-') === false) continue; // 跳过分类标题

      const funcTitle = stripHtml(h2Match[2]).replace(/ Direct link.*$/, '').trim();
      let funcName = funcId;
      const nameMatch = funcId.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (nameMatch) funcName = nameMatch[1];

      const headingPos = h2Match.index;
      let sectionEnd = html.indexOf('<h2 class="anchor', headingPos + 1);
      if (sectionEnd === -1) sectionEnd = html.length;
      const sectionHtml = html.substring(headingPos, sectionEnd);

      const descMatch = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      let description = descMatch ? stripHtml(descMatch[1]) : funcTitle;
      if (description.length > 200) description = description.substring(0, 197) + '...';

      const example = extractCodeExample(html, headingPos);
      const params = extractParams(sectionHtml);
      const returnType = extractReturnType(sectionHtml);

      let signature = ns ? ns + funcName : funcName;
      if (params.length > 0) {
        signature += '(' + params.map(p => `${p.name}: ${p.type}`).join(', ') + ')';
      } else {
        signature += '()';
      }
      if (returnType) signature += `: ${returnType}`;

      apis.push({
        name: funcName,
        platform: 'android',
        category,
        signature,
        description: description || funcTitle,
        params: params.length > 0 ? params : undefined,
        returnType,
        example,
        cautions: undefined,
      });
    }
  }

  return apis;
}

// ====== 主流程 ======

console.log('开始解析 EC 文档...\n');

let allApis = [];

const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.html'));

for (const file of files) {
  const pageName = file.replace('.html', '');
  const category = CATEGORY_MAP[pageName];
  if (!category) {
    console.log(`跳过: ${pageName} (无分类映射)`);
    continue;
  }

  console.log(`解析: ${pageName} → ${category}`);
  const apis = parseDocPage(path.join(DOCS_DIR, file), pageName);
  console.log(`  提取到 ${apis.length} 个 API`);

  // 显示 API 名称
  for (const api of apis) {
    console.log(`    - ${api.signature}`);
  }

  allApis = allApis.concat(apis);
}

console.log(`\n总计: ${allApis.length} 个 API`);

// 按分类分组统计
const stats = {};
for (const api of allApis) {
  stats[api.category] = (stats[api.category] || 0) + 1;
}
console.log('\n分类统计:');
for (const [cat, count] of Object.entries(stats)) {
  console.log(`  ${cat}: ${count}`);
}

// 生成 TypeScript 文件
console.log('\n生成 ec-api-db.ts...');

let tsContent = `/**
 * EasyClick API 知识库 — 自动生成，安卓平台 (acEvent/无障碍模式)
 * 数据来源: http://127.0.0.1:10089/docs/zh-cn/funcs/
 * 生成时间: ${new Date().toISOString()}
 * 平台: Android only (不再包含 iOS/Harmony)
 */

export interface ApiEntry {
  name: string;
  platform: "android" | "common";
  category: string;
  signature: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
  returnType?: string;
  example: string;
  cautions?: string[];
}

export const EC_API_DATABASE: ApiEntry[] = [
`;

// 按分类组织
const cats = [...new Set(allApis.map(a => a.category))].sort();
for (const cat of cats) {
  tsContent += `  // ===================== ${cat} =====================\n`;
  const catApis = allApis.filter(a => a.category === cat);

  for (const api of catApis) {
    // 跳过没有示例代码的（可能是分类标题）
    if (!api.example && !api.description) continue;

    tsContent += `  {\n`;
    tsContent += `    name: "${api.name}",\n`;
    tsContent += `    platform: "${api.platform}",\n`;
    tsContent += `    category: "${api.category}",\n`;
    tsContent += `    signature: ${JSON.stringify(api.signature)},\n`;
    tsContent += `    description: ${JSON.stringify(api.description)},\n`;

    if (api.params && api.params.length > 0) {
      tsContent += `    params: [\n`;
      for (const p of api.params) {
        tsContent += `      { name: ${JSON.stringify(p.name)}, type: ${JSON.stringify(p.type)}, desc: ${JSON.stringify(p.desc)} },\n`;
      }
      tsContent += `    ],\n`;
    }

    if (api.returnType) {
      tsContent += `    returnType: ${JSON.stringify(api.returnType)},\n`;
    }

    tsContent += `    example: ${JSON.stringify(api.example)},\n`;

    if (api.cautions && api.cautions.length > 0) {
      tsContent += `    cautions: ${JSON.stringify(api.cautions)},\n`;
    }

    tsContent += `  },\n`;
  }
}

tsContent += `];

/**
 * 按平台和分类筛选API
 */
export function queryApi(options: {
  platform?: string;
  category?: string;
  keyword?: string;
}): ApiEntry[] {
  let results = EC_API_DATABASE;

  if (options.platform && options.platform !== "all") {
    results = results.filter(
      (api) =>
        api.platform === options.platform || api.platform === "common"
    );
  }

  if (options.category) {
    results = results.filter((api) => api.category === options.category);
  }

  if (options.keyword) {
    const kw = options.keyword.toLowerCase();
    results = results.filter(
      (api) =>
        api.name.toLowerCase().includes(kw) ||
        api.description.toLowerCase().includes(kw) ||
        api.signature.toLowerCase().includes(kw) ||
        api.category.toLowerCase().includes(kw)
    );
  }

  return results;
}

/**
 * 获取所有API分类
 */
export function getCategories(): string[] {
  const cats = new Set(EC_API_DATABASE.map((api) => api.category));
  return Array.from(cats).sort();
}

/**
 * 获取API按分类的分组统计
 */
export function getApiStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const api of EC_API_DATABASE) {
    stats[api.category] = (stats[api.category] || 0) + 1;
  }
  return stats;
}
`;

fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
console.log(`\n输出: ${OUTPUT_FILE}`);
console.log('完成!');
