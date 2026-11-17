import json
import os
from PIL import Image

game_dir = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\gameforde'
with open(os.path.join(game_dir, 'slices.json'), 'r', encoding='utf-8') as f:
    slices = json.load(f)['slices']

print(f"Total slices: {len(slices)}")

# Let's inspect all slices by row & column
# Slices sorted by y then x
sorted_slices = sorted(slices, key=lambda s: (s['y'], s['x']))

# Let's group slices by category on the 1672x941 layout:
# 1. Blocks: y < 350, x < 690
blocks = [s for s in slices if s['y'] < 350 and s['x'] < 690 and s['w'] < 150]
# 2. Items: y < 350, 690 <= x < 1180 and s['w'] < 100
items = [s for s in slices if s['y'] < 350 and 690 <= s['x'] < 1180 and s['w'] < 120]
# 3. Enemies: y < 350, x >= 1180 and s['w'] < 120
enemies = [s for s in slices if s['y'] < 350 and s['x'] >= 1180 and s['w'] < 120]
# 4. Player: 370 <= y < 650, x < 690 and s['w'] < 150
player = [s for s in slices if 370 <= s['y'] < 650 and s['x'] < 690 and s['w'] < 150]
# 5. Props: 370 <= y < 650, 690 <= x < 1180 and s['w'] < 150
props = [s for s in slices if 370 <= s['y'] < 650 and 690 <= s['x'] < 1180 and s['w'] < 150]
# 6. Triggers: 370 <= y < 650, x >= 1180 and s['w'] < 180
triggers = [s for s in slices if 370 <= s['y'] < 650 and s['x'] >= 1180 and s['w'] < 180]
# 7. Effects: y >= 650, x < 600
effects = [s for s in slices if s['y'] >= 650 and s['x'] < 600 and s['w'] < 150]
# 8. UI & Misc: y >= 650, x >= 600
ui_misc = [s for s in slices if s['y'] >= 650 and s['x'] >= 600 and s['w'] < 150]

print(f"Blocks: {len(blocks)}")
print(f"Items: {len(items)}")
print(f"Enemies: {len(enemies)}")
print(f"Player: {len(player)}")
print(f"Props: {len(props)}")
print(f"Triggers: {len(triggers)}")
print(f"Effects: {len(effects)}")
print(f"UI/Misc: {len(ui_misc)}")

print("\n--- PLAYER SLICES (Sorted by y, x) ---")
for p in sorted(player, key=lambda s: (s['y'] // 60, s['x'])):
    print(f"{p['name']}: x={p['x']}, y={p['y']}, w={p['w']}, h={p['h']}")

print("\n--- ENEMIES SLICES ---")
for e in sorted(enemies, key=lambda s: (s['y'] // 60, s['x'])):
    print(f"{e['name']}: x={e['x']}, y={e['y']}, w={e['w']}, h={e['h']}")

print("\n--- BLOCKS SLICES ---")
for b in sorted(blocks, key=lambda s: (s['y'] // 50, s['x'])):
    print(f"{b['name']}: x={b['x']}, y={b['y']}, w={b['w']}, h={b['h']}")

print("\n--- ITEMS SLICES ---")
for it in sorted(items, key=lambda s: (s['y'] // 50, s['x'])):
    print(f"{it['name']}: x={it['x']}, y={it['y']}, w={it['w']}, h={it['h']}")
