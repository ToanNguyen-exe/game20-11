from PIL import Image
import numpy as np

p = r'C:\Users\mcmap\Downloads\gameforde'

for sid in ['168', '169', '170', '171', '172', '173', '002', '005', '007']:
    im = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_{sid}.png')
    arr = np.array(im)
    # average RGB of solid pixels
    solid = arr[arr[:, :, 3] > 100]
    mean_rgb = solid[:, :3].mean(axis=0) if len(solid) > 0 else [0, 0, 0]
    print(f"Slice {sid} ({im.size}): avg solid RGB = {mean_rgb.round(1)}")
