from PIL import Image

# Let's inspect the original sprite sheet if available or check the slices in gameforde
# We have 190 PNG files in C:\Users\mcmap\Downloads\gameforde\
# Let's see what each of _168 to _185 looks like
slice_dir = r'C:\Users\mcmap\Downloads\gameforde'
slices = ['168', '169', '170', '171', '172', '173', '002', '005', '007', 
          '182', '183', '184', '185', '174', '175', '025', '028',
          '034', '176', '178', '035',
          '180', '181', '177', '179', '045']

for s in slices:
    fn = f'21466470-ba04-4a9a-8dcf-f968ff7f561d_{s}.png'
    p = f'{slice_dir}/{fn}'
    try:
        im = Image.open(p)
        print(f"Slice {s}: size={im.size}, mode={im.mode}")
    except Exception as e:
        print(f"Slice {s} not found: {e}")
