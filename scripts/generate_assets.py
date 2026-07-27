import os
import math
import base64
from PIL import Image

src_path = r'C:\Users\sing6\.gemini\antigravity-ide\brain\19061fff-135e-422a-9e9c-7cbb978b8e66\media__1785165952139.png'
img = Image.open(src_path).convert('RGBA')

w, h = img.size
pixels = img.load()

# Step 1: Remove white background smoothly
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        dist = math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2)
        if dist < 25:
            pixels[x, y] = (0, 0, 0, 0)
        elif dist < 55:
            alpha = int(255 * (dist - 25) / 30.0)
            pixels[x, y] = (r, g, b, alpha)

bbox = img.getbbox()
logo_light = img.crop(bbox)

# Create logo-dark by recoloring dark/black pixels to white/light silver and dark blue to bright blue
logo_dark = logo_light.copy()
dark_pixels = logo_dark.load()
dw, dh = logo_dark.size

for y in range(dh):
    for x in range(dw):
        r, g, b, a = dark_pixels[x, y]
        if a > 20:
            # Tagline script text (black -> crisp white #f8fafc)
            if r < 60 and g < 60 and b < 60:
                dark_pixels[x, y] = (248, 250, 252, a)
            # Dark blue text A P E -> vibrant sky blue #38bdf8 / #60a5fa
            elif r < 40 and g < 80 and b > 100:
                dark_pixels[x, y] = (96, 165, 250, a)

os.makedirs('public', exist_ok=True)
logo_light.save(r'public\logo-light.png')
logo_light.save(r'public\logo.png')
logo_dark.save(r'public\logo-dark.png')

# Icon marks
dw, dh = logo_light.size
mark_light = logo_light.crop((0, 0, int(dw * 0.48), dh))
mark_light = mark_light.crop(mark_light.getbbox())
mark_light.save(r'public\logo-mark.png')

dw, dh = logo_dark.size
mark_dark = logo_dark.crop((0, 0, int(dw * 0.48), dh))
mark_dark = mark_dark.crop(mark_dark.getbbox())
mark_dark.save(r'public\logo-mark-dark.png')

# 1. Favicon 16x16 and 32x32
f16 = mark_light.copy()
f16.thumbnail((16, 16), Image.Resampling.LANCZOS)
f16_sq = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
f16_sq.paste(f16, ((16 - f16.width) // 2, (16 - f16.height) // 2))
f16_sq.save(r'public\favicon-16x16.png')

f32 = mark_light.copy()
f32.thumbnail((32, 32), Image.Resampling.LANCZOS)
f32_sq = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
f32_sq.paste(f32, ((32 - f32.width) // 2, (32 - f32.height) // 2))
f32_sq.save(r'public\favicon-32x32.png')

# Save multi-size favicon.ico
f48 = mark_light.copy()
f48.thumbnail((48, 48), Image.Resampling.LANCZOS)
f48_sq = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
f48_sq.paste(f48, ((48 - f48.width) // 2, (48 - f48.height) // 2))

f16_sq.save(r'public\favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48)], append_images=[f32_sq, f48_sq])

# Apple Touch Icon (180x180 with sleek dark slate background)
apple_icon = Image.new('RGBA', (180, 180), (15, 23, 42, 255))
m_app = mark_light.copy()
m_app.thumbnail((140, 140), Image.Resampling.LANCZOS)
apple_icon.paste(m_app, ((180 - m_app.width) // 2, (180 - m_app.height) // 2), m_app)
apple_icon.save(r'public\apple-touch-icon.png')

# Android Chrome 192x192
ac192 = Image.new('RGBA', (192, 192), (15, 23, 42, 255))
m192 = mark_light.copy()
m192.thumbnail((150, 150), Image.Resampling.LANCZOS)
ac192.paste(m192, ((192 - m192.width) // 2, (192 - m192.height) // 2), m192)
ac192.save(r'public\android-chrome-192x192.png')

# Android Chrome 512x512
ac512 = Image.new('RGBA', (512, 512), (15, 23, 42, 255))
m512 = mark_light.copy()
m512.thumbnail((420, 420), Image.Resampling.LANCZOS)
ac512.paste(m512, ((512 - m512.width) // 2, (512 - m512.height) // 2), m512)
ac512.save(r'public\android-chrome-512x512.png')

# Save transparent favicon.svg with embedded base64 PNG for SVG favicon support
with open(r'public\favicon-32x32.png', 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <image href="data:image/png;base64,{b64_data}" width="32" height="32"/>
</svg>'''

with open(r'public\favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('All branding assets, favicons, and PWA icons generated successfully!')
