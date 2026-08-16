import re, sys

with open('C:/Users/pc/AppData/Local/Temp/ec_docs/global-shortcut.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Find key functions and show their HTML structure
for func_name in ['clickpoint', 'swipetopoint', 'longclickpoint', 'sleep', 'logd', 'openn']:
    idx = html.find(f'id="{func_name}"')
    if idx < 0:
        print(f'\n=== {func_name}: NOT FOUND ===')
        continue

    chunk = html[idx:idx+3000]

    # Extract all text content
    text_chunks = re.findall(r'>([^<]{3,200})<', chunk)

    print(f'\n=== {func_name} (pos {idx}) ===')
    for t in text_chunks[:20]:
        t = t.strip()
        if t and not t.startswith('function') and not t.startswith('var ') and not t.startswith('let '):
            print(f'  TEXT: {t[:120]}')

    # Look for parameters in list items
    lis = re.findall(r'<li[^>]*>(.*?)</li>', chunk[:2500], re.DOTALL)
    if lis:
        print(f'  LIs ({len(lis)}):')
        for li in lis[:10]:
            clean = re.sub(r'<[^>]*>', '', li).strip()
            if clean:
                print(f'    - {clean[:100]}')
