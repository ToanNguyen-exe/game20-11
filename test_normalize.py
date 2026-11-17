from PIL import Image
import numpy as np

# Let's write a function to normalize a block into a seamless square tile
def normalize_block(im, target_size=(64, 64), crop_margin=3):
    # If the image has transparent or fuzzy borders on the edge,
    # crop slightly into the solid area or clamp
    w, h = im.size
    # Crop inner region to remove fuzzy edges
    left = min(crop_margin, w // 8)
    top = min(crop_margin, h // 8)
    right = w - min(crop_margin, w // 8)
    bottom = h - min(crop_margin, h // 8)
    cropped = im.crop((left, top, right, bottom))
    # Resize to target_size using NEAREST (or BICUBIC/LANCZOS then sharp)
    # Since it's pixel art, NEAREST or BILINEAR:
    resized = cropped.resize(target_size, Image.Resampling.NEAREST)
    return resized

p = r'C:\Users\mcmap\Downloads\gameforde'
im_grass = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_168.png')
im_dirt = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_170.png')
im_brick = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_173.png')

norm_grass = normalize_block(im_grass, crop_margin=2)
norm_dirt = normalize_block(im_dirt, crop_margin=3)

# Test tiling: 3 grass blocks side by side, and 3 dirt blocks underneath
test_grid = Image.new('RGBA', (64 * 3, 64 * 2), (0, 0, 0, 0))
for i in range(3):
    test_grid.paste(norm_grass, (i * 64, 0))
    test_grid.paste(norm_dirt, (i * 64, 64))

test_grid.save(r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\test_seamless_grid.png')
print("Successfully generated test_seamless_grid.png!")
