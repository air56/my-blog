#!/usr/bin/env python3
"""Generate favicon files from an anime portrait photo.

Crops the head area from the upper portion of the image and creates:
- favicon.ico (multi-size: 16, 32, 48)
- apple-touch-icon.png (180x180)
- icon-192.png, icon-512.png (PWA)
"""
import os, sys
from PIL import Image

# ── Config ──
PICS_DIR = r"C:\Users\lenovo\Pictures\美图"
TARGET = "20250412_004050.jpg"
PUBLIC_DIR = r"C:\Users\lenovo\my-blog\public"
SRC_PATH = os.path.join(PICS_DIR, TARGET)

# ── Open source ──
img = Image.open(SRC_PATH).convert("RGB")
w, h = img.size
print(f"Source: {w}x{h}")

# ── Crop to head area ──
# Image is 832x1216 portrait. Head is in upper portion, centered.
# Estimate: head occupies ~35-40% of height, roughly from 4% to 42% vertically.
top_pct, bottom_pct = 0.04, 0.42
head_top = int(h * top_pct)
head_bottom = int(h * bottom_pct)
head_height = head_bottom - head_top

# Square crop: use head_height as the square size, centered horizontally
square_size = min(head_height, w)
left = (w - square_size) // 2
right = left + square_size

# Fine-tune: shift crop up slightly to focus on face
face_crop = img.crop((left, head_top, right, head_top + square_size))
print(f"Crop: {left},{head_top} -> {right},{head_top + square_size} ({square_size}x{square_size})")

# ── Generate favicon sizes ──
os.makedirs(PUBLIC_DIR, exist_ok=True)

# favicon.ico (multi-size: 16, 32, 48)
sizes_ico = [(16, 16), (32, 32), (48, 48)]
ico_frames = [face_crop.resize(s, Image.LANCZOS) for s in sizes_ico]
ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
ico_frames[0].save(ico_path, format="ICO", sizes=[(32, 32), (16, 16)])
print(f"Created: {ico_path}")

# apple-touch-icon.png (180x180)
apple_path = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
apple_icon = face_crop.resize((180, 180), Image.LANCZOS)
apple_icon.save(apple_path, "PNG")
print(f"Created: {apple_path}")

# icon-192.png
icon192_path = os.path.join(PUBLIC_DIR, "icon-192.png")
icon192 = face_crop.resize((192, 192), Image.LANCZOS)
icon192.save(icon192_path, "PNG")
print(f"Created: {icon192_path}")

# icon-512.png
icon512_path = os.path.join(PUBLIC_DIR, "icon-512.png")
icon512 = face_crop.resize((512, 512), Image.LANCZOS)
icon512.save(icon512_path, "PNG")
print(f"Created: {icon512_path}")

print("\nDone! Favicon files generated in public/")
