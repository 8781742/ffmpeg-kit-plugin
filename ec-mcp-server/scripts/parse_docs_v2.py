# ============================================================
# EC Docs HTML Parser v2 — 基于已知的Docusaurus HTML结构
# ============================================================

import os, re, json
from html import unescape
from collections import Counter

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
    text = re.sub(r'<[^>]*>', '', text)
    text = unescape(text)
    text = re.sub(r'[​‌‍‎‏﻿ - ]', '', text)
    return text.strip()

def parse_code_from_chunk(chunk):
    """Extract clean code from a chunk of Docusaurus HTML"""
    # Find code block
    m = re.search(r'<code class="codeBlockLines[^"]*">(.*?)</code>', chunk, re.DOTALL)
    if not m:
        return ''
    code = m.group(1)
    code = re.sub(r'<span class="codeLineNumber[^"]*"></span>', '', code)
    code = re.sub(r'<span[^>]*>', '', code)
    code = re.sub(r'</span>', '', code)
    code = unescape(code)
    code = re.sub(r'<br\s*/?>', '\n', code)
    code = re.sub(r'\n{3,}', '\n\n', code)
    return code.strip()

def parse_params_from_ul(chunk):
    """Extract @param and @return from <ul><li> tags"""
    params = []
    return_type = None

    # Find <ul> blocks
    ul_match = re.search(r'<ul>(.*?)</ul>', chunk, re.DOTALL)
    if not ul_match:
        return params, return_type

    ul_content = ul_match.group(1)
    lis = re.findall(r'<li[^>]*>(.*?)</li>', ul_content, re.DOTALL)

    for li in lis:
        text = strip_html(li)

        # Match @param
        pm = re.match(r'@param\s+(\w+)\s+(.+)', text)
        if pm:
            params.append({
                'name': pm.group(1),
                'type': 'any',
                'desc': pm.group(2).strip()
            })
            continue

        # Match @return
        rm = re.match(r'@return\s+\{(\w+)\}\s*(.*)', text)
        if rm:
            return_type = rm.group(1)
            continue
        rm2 = re.match(r'@return\s+(\w+)\s*(.*)', text)
        if rm2:
            return_type = rm2.group(1)
            continue

        # Conditions/Meta
        if '执行条件' in text or '适用条件' in text:
            continue

    return params, return_type

def parse_page_v2(filepath, page_name):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    category = CATEGORY_MAP.get(page_name, 'device')
    ns = NAMESPACE_MAP.get(page_name, '')

    apis = []

    # Find all h3 sections with function IDs
    h3_pattern = r'<h3 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)</h3>'
    h3_matches = list(re.finditer(h3_pattern, html))

    # Also find h2 sections for functions that don't use h3
    h2_pattern = r'<h2 class="anchor[^"]*"[^>]*id="([^"]*)"[^>]*>(.*?)</h2>'

    all_sections = []

    for m in h3_matches:
        func_id = m.group(1)
        func_title = strip_html(m.group(2))
        if 'Direct link' in func_title:
            func_title = func_title.split('Direct link')[0].strip()

        start = m.end()
        next_h3 = re.search(r'<h3 class="anchor[^"]*"', html[start:])
        next_h2 = re.search(r'<h2 class="anchor[^"]*"', html[start:])

        end_pos = len(html)
        if next_h3 and next_h2:
            end_pos = start + min(next_h3.start(), next_h2.start())
        elif next_h3:
            end_pos = start + next_h3.start()
        elif next_h2:
            end_pos = start + next_h2.start()

        all_sections.append({
            'id': func_id,
            'title': func_title,
            'start': start,
            'end': end_pos,
            'level': 'h3'
        })

    # If no h3 sections, try h2 (some pages use h2 for each function)
    if not all_sections:
        for m in re.finditer(h2_pattern, html):
            func_id = m.group(1)
            # Skip category headers (Chinese-only)
            if not re.search(r'[a-zA-Z]', func_id):
                continue

            func_title = strip_html(m.group(2))
            if 'Direct link' in func_title:
                func_title = func_title.split('Direct link')[0].strip()

            start = m.end()
            next_h2 = re.search(r'<h2 class="anchor[^"]*"', html[start:])
            end_pos = len(html)
            if next_h2:
                end_pos = start + next_h2.start()

            all_sections.append({
                'id': func_id,
                'title': func_title,
                'start': start,
                'end': end_pos,
                'level': 'h2'
            })

    for sec in all_sections:
        func_id = sec['id']
        func_title = sec['title']

        # Extract function name from ID (remove Chinese suffix after dash)
        # e.g., "clickpoint-坐标点击" → "clickPoint"
        # e.g., "devicetcdeviceid" → "tcDeviceId" (from device-api)
        name_part = func_id.split('-')[0]

        # Try to get correct camelCase from title
        # Title format: "clickPoint 坐标点击" or "device.tcDeviceId 三方统计唯一设备标识"
        title_first_word = func_title.split()[0] if func_title else ''

        func_name = name_part
        if title_first_word:
            # If title starts with namespace prefix, use the rest
            if ns and title_first_word.startswith(ns):
                func_name = title_first_word[len(ns):]
            elif not ns:
                # Global function - title first word IS the function name
                # But ensure it matches what's in the ID
                if title_first_word.lower() == name_part.lower():
                    func_name = title_first_word

        # Skip entries that look like headings, not functions
        if not func_name or len(func_name) < 2:
            continue
        if func_name[0].isupper() and ns == '' and func_name[0] != func_name[0].upper():
            pass  # Allow mixed case

        chunk = html[sec['start']:sec['end']]

        # Extract description from first meaningful <p>
        desc = ''
        p_matches = re.findall(r'<p[^>]*>(.*?)</p>', chunk, re.DOTALL)
        for p in p_matches:
            p_text = strip_html(p)
            if p_text and len(p_text) > 5 and not p_text.startswith('上一页') and not p_text.startswith('下一页'):
                desc = p_text
                if len(desc) > 200:
                    desc = desc[:197] + '...'
                break

        if not desc:
            desc = func_title

        # Extract params and return type from <ul><li>
        params, return_type = parse_params_from_ul(chunk)

        # Extract code example
        example = parse_code_from_chunk(chunk)
        if not example:
            # Try from a wider range
            search_start = max(0, sec['start'] - 1000)
            search_chunk = html[search_start:sec['end']]
            example = parse_code_from_chunk(search_chunk)

        # Build signature
        if ns:
            signature = ns + func_name
        else:
            signature = func_name

        if params:
            param_parts = [f"{p['name']}: {p['type']}" for p in params]
            signature += f"({', '.join(param_parts)})"
        else:
            signature += '()'

        if return_type:
            signature += f': {return_type}'

        # Extract warnings from blockquotes
        cautions = []
        bq_matches = re.findall(r'<blockquote[^>]*>.*?<p[^>]*>(.*?)</p>.*?</blockquote>', chunk, re.DOTALL)
        for bq in bq_matches:
            c = strip_html(bq)
            if c and len(c) < 200:
                cautions.append(c)

        # Check for "执行条件" in list items as cautions
        cond_match = re.search(r'<li[^>]*>(执行条件[^<]*)</li>', chunk)
        if cond_match:
            cond = strip_html(cond_match.group(1))
            if cond:
                cautions.insert(0, cond)

        entry = {
            'name': func_name,
            'platform': 'android',
            'category': category,
            'signature': signature,
            'description': desc or func_title,
            'example': example,
        }
        if params:
            entry['params'] = params
        if return_type:
            entry['returnType'] = return_type
        if cautions:
            entry['cautions'] = cautions

        apis.append(entry)

    return apis


def generate_ts(apis):
    lines = ['''/**
 * EasyClick API 知识库 — Android 平台 (无障碍/acEvent 模式)
 * 数据来源: http://127.0.0.1:10089/docs/zh-cn/funcs/
 * 自动生成 + 手动验证
 * 注意: 标记为 "verified" 的API已在 APK 11.44.0 / Redmi M2012K11C / Android 14 上实测通过
 */

export interface ApiEntry {
  name: string;
  platform: "android";
  category: string;
  signature: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
  returnType?: string;
  example: string;
  cautions?: string[];
  /** 已在设备上实测可用 */
  verified?: boolean;
}

export const EC_API_DATABASE: ApiEntry[] = [
''']

    cats_order = ['device', 'image', 'ocr', 'file', 'shell', 'sqlite', 'util', 'storage', 'thread', 'event']
    for cat in cats_order:
        cat_apis = [a for a in apis if a['category'] == cat]
        if not cat_apis:
            continue
        lines.append(f'\n  // ===================== {cat} ({len(cat_apis)} APIs) =====================')

        for api in cat_apis:
            name = json.dumps(api['name'], ensure_ascii=False)
            sig = json.dumps(api['signature'], ensure_ascii=False)
            desc = json.dumps(api['description'], ensure_ascii=False)
            ex = json.dumps(api['example'], ensure_ascii=False)

            lines.append('  {')
            lines.append(f'    name: {name},')
            lines.append(f'    platform: "android",')
            lines.append(f'    category: "{api["category"]}",')
            lines.append(f'    signature: {sig},')
            lines.append(f'    description: {desc},')

            if api.get('params'):
                lines.append('    params: [')
                for p in api['params']:
                    lines.append(f'      {{ name: {json.dumps(p["name"], ensure_ascii=False)}, type: "{p["type"]}", desc: {json.dumps(p["desc"], ensure_ascii=False)} }},')
                lines.append('    ],')

            if api.get('returnType'):
                lines.append(f'    returnType: "{api["returnType"]}",')

            lines.append(f'    example: {ex},')

            if api.get('cautions'):
                cautions_str = json.dumps(api['cautions'], ensure_ascii=False)
                lines.append(f'    cautions: {cautions_str},')

            lines.append('  },')

    # Add verified marker notes as comments
    lines.append('  // ===================== Verified APIs (APK 11.44.0) =====================')
    lines.append('  // Working: clickPoint, swipeToPoint, longClickPoint, sleep,')
    lines.append('  //   device.getScreenWidth/Height, utils.openApp, logd/logi/loge,')
    lines.append('  //   image.requestScreenCapture, ocr.newOcr, ocr.initOcr')
    lines.append('  // NOT working in acEvent mode:')
    lines.append('  //   device.screenshot(), ui.findOne(), device.pressKey(),')
    lines.append('  //   setDialogInterceptor(), device.click(), device.swipe()')

  lines.append('];')
  lines.append('')

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
      (api) => api.platform === options.platform
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
    print('EC Docs Parser v2\n')

    all_apis = []
    for fname in sorted(os.listdir(DOCS_DIR)):
        if not fname.endswith('.html'):
            continue
        page_name = fname.replace('.html', '')
        category = CATEGORY_MAP.get(page_name)
        if not category:
            continue

        filepath = os.path.join(DOCS_DIR, fname)
        size_kb = os.path.getsize(filepath) / 1024
        print(f'Parse: {page_name} → {category} ({size_kb:.0f}KB)')

        apis = parse_page_v2(filepath, page_name)
        print(f'  → {len(apis)} APIs')

        # Show first few
        for a in apis[:3]:
            print(f'    {a["signature"]}')
        if len(apis) > 3:
            print(f'    ... ({len(apis) - 3} more)')

        all_apis.extend(apis)

    # Deduplicate by name within each category
    seen = set()
    deduped = []
    for a in all_apis:
        key = (a['category'], a['name'])
        if key not in seen:
            seen.add(key)
            deduped.append(a)
    all_apis = deduped

    print(f'\nTotal: {len(all_apis)} APIs (deduped)')

    stats = Counter(a['category'] for a in all_apis)
    for cat, count in stats.most_common():
        print(f'  {cat}: {count}')

    print(f'\nGenerating {OUTPUT_FILE}...')
    ts = generate_ts(all_apis)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts)
    print(f'Done! {len(ts):,} bytes written.')

if __name__ == '__main__':
    main()
