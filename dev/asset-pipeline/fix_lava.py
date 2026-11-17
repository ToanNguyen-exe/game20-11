from PIL import Image
import os
import numpy as np

p = r'C:\Users\mcmap\Downloads\gameforde'
im047 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_047.png')
im048 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_048.png')

def normalize_tile(im):
    mask = im.split()[-1].point(lambda a: 255 if a > 180 else 0)
    bbox = mask.getbbox()
    if bbox:
        im = im.crop(bbox)
    resized = im.resize((64, 64), Image.Resampling.NEAREST)
    arr = np.array(resized)
    arr[0, :, 3] = 255
    arr[-1, :, 3] = 255
    arr[:, 0, 3] = 255
    arr[:, -1, 3] = 255
    return Image.fromarray(arr)

norm_lava = normalize_tile(im047)
norm_fire = normalize_tile(im048)

dest_tiles = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites\tiles'
dest_flat = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites'

norm_lava.save(os.path.join(dest_tiles, 'lava.png'))
norm_lava.save(os.path.join(dest_flat, 'lava.png'))
norm_lava.save(os.path.join(dest_flat, 'block_lava.png'))

norm_fire.save(os.path.join(dest_tiles, 'fire.png'))
norm_fire.save(os.path.join(dest_flat, 'fire.png'))
norm_fire.save(os.path.join(dest_flat, 'block_fire.png'))

print("Updated lava and fire sprites successfully!")
