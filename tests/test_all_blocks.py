from PIL import Image
import numpy as np

p = r'C:\Users\mcmap\Downloads\gameforde'

# Let's inspect other blocks in Tileset
for sid in ['182', '183', '184', '185', '174', '175', '025', '028',
            '034', '176', '178', '035', '072',
            '180', '181', '177', '179', '046', '047']:
    fn = f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_{sid}.png'
    try:
        im = Image.open(fn)
        arr = np.array(im)
        solid = arr[arr[:, :, 3] > 100]
        mean_rgb = solid[:, :3].mean(axis=0) if len(solid) > 0 else [0, 0, 0]
        print(f"Slice {sid:3} ({im.size[0]:3}x{im.size[1]:3}): avg RGB = {mean_rgb.round(1).tolist()}")
    except Exception as e:
        print(f"Slice {sid}: {e}")
