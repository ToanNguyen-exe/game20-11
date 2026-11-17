import json
import os

game_dir = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\gameforde'
with open(os.path.join(game_dir, 'slices.json'), 'r', encoding='utf-8') as f:
    slices = json.load(f)['slices']

slice_map = {s['name']: s for s in slices}

# Let's inspect props and misc specifically:
print("--- PROPS ---")
for s in slices:
    if 370 <= s['y'] < 650 and 690 <= s['x'] < 1180:
        print(f"{s['name']}: x={s['x']}, y={s['y']}, w={s['w']}, h={s['h']}")

print("\n--- MISC & UI ---")
for s in slices:
    if s['y'] >= 650 and s['x'] >= 1180:
        print(f"{s['name']}: x={s['x']}, y={s['y']}, w={s['w']}, h={s['h']}")
