import re

with open('C:/Users/pc/AppData/Local/Temp/ec_docs/global-shortcut.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Find all IDs and their context
ids = re.findall(r'id="([a-zA-Z][^"]*)"', html)
print(f'Total IDs: {len(ids)}')

# Filter function-like IDs
func_ids = [i for i in ids if any(c.isalpha() for c in i) and len(i) > 3 and not i.startswith('__')]
print('\nFunction-like IDs:')
for i in func_ids[:100]:
    print(f'  {i}')

# Try searching for sections around "clickPoint" text
for term in ['clickPoint', '坐标点击', '点击函数']:
    idx = html.find(term)
    if idx >= 0:
        # Look back for nearest id
        before = html[max(0,idx-2000):idx]
        ids_before = re.findall(r'id="([^"]*)"', before)
        print(f'\n"{term}" found at {idx}, nearest IDs before: {ids_before[-3:] if ids_before else "none"}')

        # Look at chunk
        chunk = html[idx:idx+500]
        print(f'  Context: {chunk[:300]}')
