from PIL import Image
import numpy as np

p = r'C:\Users\mcmap\Downloads\gameforde'

# Let's inspect slice 168, 169, 170
im168 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_168.png')
im169 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_169.png')
im170 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_170.png')
im171 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_171.png')
im172 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_172.png')
im173 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_173.png')

print("168:", im168.size)
print("169:", im169.size)
print("170:", im170.size)
print("171:", im171.size)
print("172:", im172.size)
print("173:", im173.size)

# Let's check why they have different sizes. In slices.json:
# 168: x=13, y=48, w=68, h=74
# 169: x=81, y=48, w=84, h=74
# 170: x=165, y=48, w=77, h=74
# 171: x=250, y=44, w=74, h=71
# 172: x=324, y=44, w=86, h=78
# 173: x=410, y=44, w=67, h=67

# Let's check what is in 168 vs 169 vs 170:
# Is 168 the left edge of a grass platform?
# Is 169 the middle?
# Is 170 the right edge or dirt?
