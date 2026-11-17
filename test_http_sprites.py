import urllib.request
import re

with open(r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\game.js', encoding='utf-8') as f:
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
