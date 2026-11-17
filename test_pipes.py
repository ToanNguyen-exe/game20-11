from PIL import Image

p = r'C:\Users\mcmap\Downloads\gameforde'
im174 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_174.png')
im175 = Image.open(f'{p}/21466470-ba04-4a9a-8dcf-f968ff7f561d_175.png')
print("174 size:", im174.size)
print("175 size:", im175.size)

# Let's save a composite of top blocks so we can understand their look
comp = Image.new('RGBA', (400, 200), (0,0,0,0))
comp.paste(im174, (0, 0))
comp.paste(im175, (100, 0))
comp.save(r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\pipe_check.png')
print("Saved pipe_check.png")
