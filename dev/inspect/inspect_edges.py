from PIL import Image
import os

p = r'C:\Users\mcmap\Downloads\gameforde'

# Let's inspect slice 168 (grass), 170 (dirt), 171 (stone), 173 (brick)
# Let's see what they look like if we inspect their edge alpha
def inspect_edges(img_path):
    im = Image.open(img_path)
    w, h = im.size
    top = [im.getpixel((x, 0))[3] for x in range(w)]
    bot = [im.getpixel((x, h-1))[3] for x in range(w)]
    left = [im.getpixel((0, y))[3] for y in range(h)]
    right = [im.getpixel((w-1, y))[3] for y in range(h)]
    print(f"{os.path.basename(img_path)} ({w}x{h}):")
    print(f"  Top non-zero alpha count: {sum(1 for a in top if a > 20)}/{w}")
    print(f"  Bot non-zero alpha count: {sum(1 for a in bot if a > 20)}/{w}")
    print(f"  Left non-zero alpha count: {sum(1 for a in left if a > 20)}/{h}")
    print(f"  Right non-zero alpha count: {sum(1 for a in right if a > 20)}/{h}")

inspect_edges(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_168.png')
inspect_edges(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_170.png')
inspect_edges(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_171.png')
inspect_edges(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_173.png')
