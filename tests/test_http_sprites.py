import urllib.request
import re

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

with open(str(ROOT / 'game.js'), encoding='utf-8') as f:
    code = f.read()

# Extract all assets/sprites/... paths
paths = re.findall(r'assets/sprites/[\w/]+\.png', code)
paths = sorted(list(set(paths)))

print(f"Testing {len(paths)} unique sprite paths via HTTP...")
failed = []
for p in paths:
    url = f"http://127.0.0.1:8003/{p}"
    try:
        res = urllib.request.urlopen(url)
        if res.status != 200:
            failed.append((p, res.status))
    except Exception as e:
        failed.append((p, str(e)))

if not failed:
    print(f"ALL {len(paths)} SPRITES RETURNED HTTP 200 OK! Perfect!")
else:
    print("Failed paths:", failed)
