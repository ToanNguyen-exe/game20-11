import json
import os
from PIL import Image

slices_file = r'C:\Users\mcmap\Downloads\gameforde\slices.json'
with open(slices_file, encoding='utf-8') as f:
    data = json.load(f)

print("Total slices:", len(data['slices']))
blocks = [s for s in data['slices'] if s['x'] < 480 and s['y'] < 380]
for b in blocks:
    print(f"{b['name']}: pos=({b['x']}, {b['y']}), size=({b['w']}, {b['h']})")
