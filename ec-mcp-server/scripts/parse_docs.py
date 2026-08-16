# ============================================================
# EC Docs HTML Parser — 从 Docusaurus HTML 提取 Android API 文档
# 用法: python scripts/parse_docs.py
# ============================================================

import os
import re
import json
import html as html_mod

DOCS_DIR = 'C:/Users/pc/AppData/Local/Temp/ec_docs'
OUTPUT_FILE = 'src/knowledge/ec-api-db.ts'

CATEGORY_MAP = {
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
}

NAMESPACE_MAP = {
    'global-shortcut': '',
    'acevent-api': '',
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
}

def strip_html(text):
    """Remove HTML tags and decode entities"""
    text = re.sub(r'<[^>]*>', '', text)
    text = html_mod.unescape(text)
    text = text.replace('\\n', '\n')
    # Remove zero-width characters and other invisible unicode
    text = re.sub(r'[​‌‍‎‏﻿ - ]', '', text)
    return text.strip()

def extract_code_blocks(html_text, start_pos=0):
    """Extract code blocks after a position"""
    after = html_text[start_pos:]
    # Find code block content (Docusaurus wraps code in complex spans)
    pattern = r'<code class="codeBlockLines[^"]*">(.*?)</code>'
    matches = list(re.finditer(pattern, after, re.DOTALL))
    results = []
    for m in matches:
        code = m.group(1)
        # Remove line numbers and spans
        code = re.sub(r'<span class="codeLineNumber[^"]*"></span>', '', code)
        code = re.sub(r'<span[^>]*>', '', code)
        code = re.sub(r'</span>', '', code)
        code = html_mod.unescape(code)
        code = re.sub(r'<br\s*/?>', '\n', code)
        # Clean up excessive blank lines
        code = re.sub(r'\n{3,}', '\n\n', code)
        results.append(code.strip())
    return results

def extract_h3_sections(html_text):
    """Extract all h3 sections (each is typically a function)"""
    sections = []
    h3_pattern = r'<h3 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)</h3>'

    for m in re.finditer(h3_pattern, html_text):
        func_id = m.group(1)
        func_title = strip_html(m.group(2))
        func_title = re.sub(r'\s*Direct link.*$', '', func_title).strip()

        # Find start of next section
        start = m.end()
        next_h3 = re.search(r'<h3 class="anchor', html_text[start:])
        next_h2 = re.search(r'<h2 class="anchor', html_text[start:])

        end_pos = len(html_text)
        if next_h3 and next_h2:
            end_pos = start + min(next_h3.start(), next_h2.start())
        elif next_h3:
            end_pos = start + next_h3.start()
        elif next_h2:
            end_pos = start + next_h2.start()

        section_html = html_text[start:end_pos]
        sections.append({
            'id': func_id,
            'title': func_title,
            'html': section_html,
            'pos': m.start()
        })

    return sections

def extract_h2_sections(html_text):
    """Extract h2 sections (may be API groups or individual functions)"""
    sections = []
    h2_pattern = r'<h2 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)</h2>'

    for m in re.finditer(h2_pattern, html_text):
        func_id = m.group(1)
        func_title = strip_html(m.group(2))
        func_title = re.sub(r'\s*Direct link.*$', '', func_title).strip()

        start = m.end()
        next_h2 = re.search(r'<h2 class="anchor', html_text[start:])
        end_pos = len(html_text)
        if next_h2:
            end_pos = start + next_h2.start()

        section_html = html_text[start:end_pos]
        sections.append({
            'id': func_id,
            'title': func_title,
            'html': section_html,
            'pos': m.start()
        })

    return sections

def extract_description(section_html):
    """Extract first paragraph as description"""
    p_match = re.search(r'<p[^>]*>(.*?)</p>', section_html, re.DOTALL)
    if p_match:
        desc = strip_html(p_match.group(1))
        if len(desc) > 300:
            desc = desc[:297] + '...'
        return desc
    return ''

def extract_params(section_html):
    """Extract parameter table"""
    params = []
    # Look for table rows with 3 columns
    tr_pattern = r'<tr[^>]*>.*?<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>.*?</tr>'
    for m in re.finditer(tr_pattern, section_html, re.DOTALL):
        name = strip_html(m.group(1))
        ptype = strip_html(m.group(2))
        desc = strip_html(m.group(3))
        if name and name not in ('参数', '名称', '属性', '字段', 'Parameter', 'Name'):
            params.append({'name': name, 'type': ptype, 'desc': desc})
    return params

def extract_warnings(section_html):
    """Extract blockquote warnings/cautions"""
    cautions = []
    bq_pattern = r'<blockquote[^>]*>\s*<p[^>]*>(.*?)</p>\s*</blockquote>'
    for m in re.finditer(bq_pattern, section_html, re.DOTALL):
        caution = strip_html(m.group(1))
        if caution and len(caution) < 200:
            cautions.append(caution)
    return cautions

def extract_func_name(func_id, func_title, ns=''):
    """Extract function name from id and title"""
    # First try to extract from title (more reliable for camelCase)
    # Title format: "device.tcDeviceId 三方统计唯一设备标识"
    if ns and func_title.startswith(ns):
        # Remove namespace prefix from title
        bare = func_title[len(ns):]
        # Extract the function name (before any Chinese/space)
        name_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)', bare)
        if name_match:
            return name_match.group(1)

    # Try from title without namespace consideration
    title_name = re.match(r'^([a-zA-Z_][a-zA-Z0-9_.]*)', func_title)
    if title_name:
        full_name = title_name.group(1)
        # Remove namespace if present
        if ns and full_name.startswith(ns):
            return full_name[len(ns):]
        return full_name

    # Fallback: try ID
    match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)', func_id)
    if match:
        return match.group(1)
    return func_id

def parse_page(filepath, page_name):
    """Parse a single documentation page"""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    category = CATEGORY_MAP.get(page_name, 'device')
    ns = NAMESPACE_MAP.get(page_name, '')

    apis = []

    # Try h3 sections first (individual functions)
    sections = extract_h3_sections(html)

    # If no h3 sections found, try h2
    if not sections:
        sections = extract_h2_sections(html)
        # Filter out category headers (Chinese-only IDs)
        sections = [s for s in sections if re.search(r'[a-zA-Z]', s['id'])]

    for sec in sections:
        func_id = sec['id']
        func_title = sec['title']

        func_name = extract_func_name(func_id, func_title, ns)

        # Skip internal/anchor links
        if not func_name or len(func_name) < 2:
            continue

        description = extract_description(sec['html'])
        params = extract_params(sec['html'])
        cautions = extract_warnings(sec['html'])

        # Extract code example
        examples = extract_code_blocks(html, sec['pos'])
        example = examples[0] if examples else ''

        # Also look for code in the section itself
        if not example:
            section_examples = extract_code_blocks(sec['html'], 0)
            example = section_examples[0] if section_examples else ''

        # Clean <br> tags from code examples
        example = re.sub(r'<br\s*/?>', '\n', example)

        # Build signature
        if ns:
            signature = ns + func_name
        else:
            signature = func_name
        if params:
            param_strs = [f"{p['name']}: {p['type']}" for p in params]
            signature += f"({', '.join(param_strs)})"
        else:
            signature += '()'

        # Skip entries with no useful content
        if not description and not example:
            continue

        entry = {
            'name': func_name,
            'platform': 'android',
            'category': category,
            'signature': signature,
            'description': description or sec['title'],
            'example': example,
        }

        if params:
            entry['params'] = params
        if cautions:
            entry['cautions'] = cautions

        apis.append(entry)

    return apis


def format_ts_value(val):
    """Format a value for TypeScript output"""
    if isinstance(val, str):
        return json.dumps(val, ensure_ascii=False)
    if isinstance(val, list):
        items = [json.dumps(item, ensure_ascii=False) if isinstance(item, str) else item for item in val]
        if all(isinstance(item, str) for item in val):
            return '[' + ', '.join(items) + ']'
        return json.dumps(val, ensure_ascii=False, indent=2)
    if isinstance(val, dict):
        return json.dumps(val, ensure_ascii=False, indent=2)
    return str(val)

def generate_ts(apis):
    """Generate TypeScript output file"""
    lines = []
    lines.append('''/**
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
  params?: { name: string; type: string; desc: string }[];
  returnType?: string;
  example: string;
  cautions?: string[];
}

export const EC_API_DATABASE: ApiEntry[] = [
''')

    # Group by category
    cats_order = ['device', 'image', 'ocr', 'file', 'shell', 'sqlite', 'util', 'storage', 'thread', 'event']
    for cat in cats_order:
        cat_apis = [a for a in apis if a['category'] == cat]
        if not cat_apis:
            continue

        lines.append(f'  // ===================== {cat} =====================')

        for api in cat_apis:
            lines.append('  {')
            lines.append(f'    name: {json.dumps(api["name"])},')
            lines.append(f'    platform: "{api["platform"]}",')
            lines.append(f'    category: "{api["category"]}",')
            lines.append(f'    signature: {json.dumps(api["signature"], ensure_ascii=False)},')
            lines.append(f'    description: {json.dumps(api["description"], ensure_ascii=False)},')

            if api.get('params'):
                lines.append('    params: [')
                for p in api['params']:
                    lines.append(f'      {{ name: {json.dumps(p["name"], ensure_ascii=False)}, type: {json.dumps(p["type"], ensure_ascii=False)}, desc: {json.dumps(p["desc"], ensure_ascii=False)} }},')
                lines.append('    ],')

            if api.get('returnType'):
                lines.append(f'    returnType: {json.dumps(api["returnType"])},')

            lines.append(f'    example: {json.dumps(api["example"], ensure_ascii=False)},')

            if api.get('cautions'):
                lines.append(f'    cautions: {json.dumps(api["cautions"], ensure_ascii=False)},')

            lines.append('  },')

    lines.append('];')
    lines.append('''
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
''')

    return '\n'.join(lines)


def main():
    print('开始解析 EC 文档...\n')

    all_apis = []

    if not os.path.isdir(DOCS_DIR):
        print(f'错误: 文档目录不存在 {DOCS_DIR}')
        return

    for fname in sorted(os.listdir(DOCS_DIR)):
        if not fname.endswith('.html'):
            continue

        page_name = fname.replace('.html', '')
        category = CATEGORY_MAP.get(page_name)
        if not category:
            print(f'跳过: {page_name} (无分类映射)')
            continue

        filepath = os.path.join(DOCS_DIR, fname)
        size_kb = os.path.getsize(filepath) / 1024
        print(f'解析: {page_name} → {category} ({size_kb:.0f}KB)')

        apis = parse_page(filepath, page_name)
        print(f'  提取到 {len(apis)} 个 API')

        for api in apis[:5]:
            print(f'    ✓ {api["name"]}: {api["description"][:60]}...')
        if len(apis) > 5:
            print(f'    ... 还有 {len(apis) - 5} 个')

        all_apis.extend(apis)

    print(f'\n总计: {len(all_apis)} 个 API')

    # Stats
    from collections import Counter
    stats = Counter(a['category'] for a in all_apis)
    print('\n分类统计:')
    for cat, count in stats.most_common():
        print(f'  {cat}: {count}')

    # Generate output
    print(f'\n生成 {OUTPUT_FILE}...')
    ts_content = generate_ts(all_apis)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    output_size = len(ts_content)
    print(f'输出: {OUTPUT_FILE} ({output_size:,} bytes)')
    print('完成!')

if __name__ == '__main__':
    main()
