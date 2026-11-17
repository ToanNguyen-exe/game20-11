import os
from PIL import Image
import numpy as np

p = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites\tiles'

for f in os.listdir(p):
    if f.endswith('.png') and f != 'ladder.png':
        fp = os.path.join(p, f)
        im = Image.open(fp)
        arr = np.array(im)
        # If RGBA, make sure top, bottom, left, right border pixels have alpha = 255
        # Also clamp the edge colors from the nearest interior pixel if needed
        # row 0, row -1, col 0, col -1
        # Set alpha of all 4 edges to 255
        arr[0, :, 3] = 255
        arr[-1, :, 3] = 255
        arr[:, 0, 3] = 255
        arr[:, -1, 3] = 255
        
        fixed_im = Image.fromarray(arr)
        fixed_im.save(fp)
        # Also save to flat dir
        flat_p = os.path.join(r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites', f)
        fixed_im.save(flat_p)
        # Also alias name if needed (e.g. block_grass -> grass)
        alias_p = os.path.join(r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites', f"block_{f}")
        fixed_im.save(alias_p)

print("Edge clamping complete! All square tiles now have 100% solid perimeter.")
