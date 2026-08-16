# MCP Server Rebuild Script
# Merges new auto-generated API data into existing knowledge base
import re, json, os

# Read the old hand-curated file (which MCP currently uses)
old_path = 'src/knowledge/ec-api-db.ts'

# We'll make a backup
os.system(f'copy "{old_path}" "{old_path}.bak" 2>nul')

# Read the auto-generated file
with open(old_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add verified markers to the existing hand-curated entries
# These entries were tested on APK 11.44.0 in acEvent mode
verified_names = [
    'clickPoint', 'swipeToPoint', 'longClickPoint', 'sleep',
    'click', 'swipe', 'press', 'drag',
    'openApp', 'logd', 'logi', 'loge',
]

# Add verified field after cautions
for name in verified_names:
    # Find the entry and add verified marker
    pattern = f'(name: "{name}",.*?cautions: \\[[\\s\\S]*?\\].*?\\n  )'
    replacement = f'\\1  verified: true,  // tested on APK 11.44.0 acEvent\\n  '
    # Use simple replacement
    pass  # will do this more carefully

# Actually, let's just add a verified field to the interface and a few entries
# Then rebuild

print("Reading current file...")

# Count current entries
entries = re.findall(r'{\s*name:', content)
print(f'Current entries: {len(entries)}')

# Add verified field to interface
content = content.replace(
    '  cautions?: string[];\n}',
    '  cautions?: string[];\n  /** 已在设备(APK 11.44.0)上实测可用 */\n  verified?: boolean;\n}'
)

print("Done!")
