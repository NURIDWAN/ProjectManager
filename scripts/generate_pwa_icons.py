#!/usr/bin/env python3
"""
Generate PWA icons for ManPro using custom source icon in public/icons/app_icon.png.
Creates crisp icons with correct dimensions, aspect ratios, and safe zones.
"""
import os
import base64
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(BASE_DIR, 'public', 'icons')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

def get_source_image():
    # Prefer app_icon.png, fallback to icon-app.png
    candidates = [
        os.path.join(ICONS_DIR, 'app_icon.png'),
        os.path.join(ICONS_DIR, 'icon-app.png'),
    ]
    for path in candidates:
        if os.path.exists(path):
            img = Image.open(path).convert('RGBA')
            # Ensure app_icon.png exists
            target_app_icon = os.path.join(ICONS_DIR, 'app_icon.png')
            if path != target_app_icon:
                img.save(target_app_icon, 'PNG')
            return img
    raise FileNotFoundError(f"Source icon not found in {ICONS_DIR}")

def make_square_icon(src_img, size, padding_ratio=0.08, bg_color=None):
    """
    Fits cropped src_img into a square canvas of `size x size`.
    padding_ratio: fraction of size left as padding.
    bg_color: RGBA tuple or None for transparent.
    """
    if bg_color:
        canvas = Image.new('RGBA', (size, size), bg_color)
    else:
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    usable_size = int(round(size * (1.0 - 2.0 * padding_ratio)))
    src_w, src_h = src_img.size
    scale = min(usable_size / src_w, usable_size / src_h)
    new_w = max(1, int(round(src_w * scale)))
    new_h = max(1, int(round(src_h * scale)))

    resample_filter = getattr(Image, 'Resampling', Image).LANCZOS if hasattr(getattr(Image, 'Resampling', Image), 'LANCZOS') else getattr(Image, 'ANTIALIAS', 1)
    resized = src_img.resize((new_w, new_h), resample_filter)

    pos_x = (size - new_w) // 2
    pos_y = (size - new_h) // 2
    canvas.paste(resized, (pos_x, pos_y), resized)
    return canvas

def main():
    os.makedirs(ICONS_DIR, exist_ok=True)
    raw_img = get_source_image()

    # Crop to transparent bounding box for perfect centering
    alpha = raw_img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        cropped = raw_img.crop(bbox)
    else:
        cropped = raw_img
    print(f"Source logo cropped to {cropped.size}")

    # 1. icon-192.png (PWA Standard)
    img192 = make_square_icon(cropped, 192, padding_ratio=0.06)
    img192_path = os.path.join(ICONS_DIR, 'icon-192.png')
    img192.save(img192_path, 'PNG', optimize=True)
    print("Created icon-192.png")

    # 2. icon-512.png (PWA Standard)
    img512 = make_square_icon(cropped, 512, padding_ratio=0.06)
    img512_path = os.path.join(ICONS_DIR, 'icon-512.png')
    img512.save(img512_path, 'PNG', optimize=True)
    print("Created icon-512.png")

    # 3. icon-maskable-512.png (Android Adaptive Icon - 80% Safe Zone circle)
    # Using 18% padding keeps the logo well inside the 80% safe zone circle (usable 64%)
    img512_maskable = make_square_icon(cropped, 512, padding_ratio=0.18, bg_color=(255, 255, 255, 255))
    img512_maskable_path = os.path.join(ICONS_DIR, 'icon-maskable-512.png')
    img512_maskable.save(img512_maskable_path, 'PNG', optimize=True)
    print("Created icon-maskable-512.png")

    # 4. apple-touch-icon.png (180x180 - iOS standard with solid white background)
    img180 = make_square_icon(cropped, 180, padding_ratio=0.12, bg_color=(255, 255, 255, 255))
    img180_path = os.path.join(ICONS_DIR, 'apple-touch-icon.png')
    img180.save(img180_path, 'PNG', optimize=True)
    print("Created apple-touch-icon.png")

    # 5. icon-48.png (Favicon size / shortcut)
    img48 = make_square_icon(cropped, 48, padding_ratio=0.04)
    img48_path = os.path.join(ICONS_DIR, 'icon-48.png')
    img48.save(img48_path, 'PNG', optimize=True)
    print("Created icon-48.png")

    # 6. favicon.ico (multi-size: 16, 32, 48)
    favicon_path = os.path.join(PUBLIC_DIR, 'favicon.ico')
    img48.save(favicon_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print("Created favicon.ico")

    # 7. icon.svg (Embeds 512x512 high-resolution icon in SVG format)
    with open(img512_path, 'rb') as f:
        png_b64 = base64.b64encode(f.read()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,{png_b64}"/>
</svg>'''
    with open(os.path.join(ICONS_DIR, 'icon.svg'), 'w') as f:
        f.write(svg_content)
    print("Created icon.svg")

    print("All icons successfully generated from app_icon.png!")

if __name__ == '__main__':
    main()
