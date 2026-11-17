from PIL import Image
import os

p = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites'

# Let's inspect block_grass and block_dirt
grass = Image.open(f'{p}/block_grass.png')
dirt = Image.open(f'{p}/block_dirt.png')
brick = Image.open(f'{p}/block_brick.png')
stone = Image.open(f'{p}/block_stone.png')
qblock = Image.open(f'{p}/block_question.png')

print("Grass:", grass.size, grass.mode)
print("Dirt :", dirt.size, dirt.mode)
print("Brick:", brick.size, brick.mode)
print("Stone:", stone.size, stone.mode)
print("QBlk :", qblock.size, qblock.mode)

# Check if there are transparent borders or dark borders around them
# Let's check non-transparent bounding box for each
for name, im in [('grass', grass), ('dirt', dirt), ('brick', brick), ('stone', stone), ('qblock', qblock)]:
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    print(f"{name:8} size={im.size} alpha_bbox={bbox}")
