from PIL import Image
import os

p = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites'

block_names = [
    'block_grass', 'block_dirt', 'block_stone', 'block_ice', 
    'block_brick', 'block_question', 'block_exclamation', 'block_coin_box',
    'block_wood_crate', 'block_wood_plank', 'block_lava', 'block_fire',
    'pipe_green'
]

for name in block_names:
    fn = f'{p}/{name}.png'
    if os.path.exists(fn):
        im = Image.open(fn)
        # Check non-transparent bounding box
        alpha = im.split()[-1]
        bbox = alpha.getbbox()
        print(f"{name:20}: size={im.size}, alpha_bbox={bbox}")
