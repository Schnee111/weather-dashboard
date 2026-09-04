import os, math, random
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw
import numpy as np

bg_dir = '/home/ubuntu/projects/weather-dashboard/public/weather-bg'
os.makedirs(bg_dir, exist_ok=True)

# Base sources
base_day_path = os.path.join(bg_dir, 'storm_heavy_rain_day.webp')
base_night_path = os.path.join(bg_dir, 'storm_heavy_rain_night.webp')
ref_path = os.path.join(bg_dir, 'reference_original.webp')

img_day = Image.open(base_day_path if os.path.exists(base_day_path) else ref_path).convert('RGB')
img_night = Image.open(base_night_path if os.path.exists(base_night_path) else ref_path).convert('RGB')
w, h = img_day.size

def apply_color_tint(img, tint_rgb, factor=0.5):
    arr = np.array(img, dtype=np.float32)
    tint = np.array(tint_rgb, dtype=np.float32)
    blended = arr * (1.0 - factor) + (arr * (tint / 255.0)) * factor * 1.5
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    return Image.fromarray(blended)

# 1. rain_moderate_day
rain_mod_day = img_day.copy()
rain_mod_day = ImageEnhance.Contrast(rain_mod_day).enhance(0.85)
rain_mod_day = ImageEnhance.Brightness(rain_mod_day).enhance(1.1)
rain_mod_day = apply_color_tint(rain_mod_day, (190, 205, 220), 0.35)
rain_mod_day.save(os.path.join(bg_dir, 'rain_moderate_day.webp'), 'WEBP', quality=88)

# 2. rain_moderate_night
rain_mod_night = img_night.copy()
rain_mod_night = ImageEnhance.Contrast(rain_mod_night).enhance(0.9)
rain_mod_night = apply_color_tint(rain_mod_night, (110, 130, 170), 0.4)
rain_mod_night.save(os.path.join(bg_dir, 'rain_moderate_night.webp'), 'WEBP', quality=88)

# 3. cloudy_overcast_day
cloudy_day = img_day.copy()
cloudy_day = cloudy_day.filter(ImageFilter.GaussianBlur(1.2))
cloudy_day = ImageEnhance.Color(cloudy_day).enhance(0.4)
cloudy_day = ImageEnhance.Contrast(cloudy_day).enhance(1.15)
cloudy_day = apply_color_tint(cloudy_day, (180, 185, 195), 0.3)
cloudy_day.save(os.path.join(bg_dir, 'cloudy_overcast_day.webp'), 'WEBP', quality=88)

# 4. cloudy_overcast_night
cloudy_night = img_night.copy()
cloudy_night = cloudy_night.filter(ImageFilter.GaussianBlur(1.0))
cloudy_night = ImageEnhance.Color(cloudy_night).enhance(0.3)
cloudy_night = ImageEnhance.Brightness(cloudy_night).enhance(0.85)
cloudy_night = apply_color_tint(cloudy_night, (90, 95, 115), 0.45)
cloudy_night.save(os.path.join(bg_dir, 'cloudy_overcast_night.webp'), 'WEBP', quality=88)

# 5. partly_cloudy_day
partly_day = img_day.copy()
partly_day = ImageEnhance.Brightness(partly_day).enhance(1.2)
partly_day = ImageEnhance.Contrast(partly_day).enhance(1.1)
# Warm sunbeam tint
partly_day = apply_color_tint(partly_day, (255, 230, 190), 0.35)
partly_day.save(os.path.join(bg_dir, 'partly_cloudy_day.webp'), 'WEBP', quality=88)

# 6. partly_cloudy_night
partly_night = img_night.copy()
partly_night = apply_color_tint(partly_night, (120, 140, 190), 0.3)
partly_night.save(os.path.join(bg_dir, 'partly_cloudy_night.webp'), 'WEBP', quality=88)

# 7. clear_sky_day
clear_day = Image.new('RGB', (w, h), (26, 75, 140))
# Create sky gradient
draw = ImageDraw.Draw(clear_day)
for y in range(h):
    r = int(24 + (160 - 24) * (y / h)**1.8)
    g = int(70 + (195 - 70) * (y / h)**1.5)
    b = int(140 + (225 - 140) * (y / h))
    draw.line([(0, y), (w, y)], fill=(r, g, b))
# Blend with subtle soft cloud texture from day
soft_clouds = img_day.convert('L').filter(ImageFilter.GaussianBlur(15))
clear_day = Image.composite(clear_day, img_day, ImageOps.invert(soft_clouds).point(lambda p: p * 0.25))
clear_day.save(os.path.join(bg_dir, 'clear_sky_day.webp'), 'WEBP', quality=88)

# 8. clear_sky_night
clear_night = Image.new('RGB', (w, h), (10, 12, 22))
draw = ImageDraw.Draw(clear_night)
for y in range(h):
    r = int(8 + (24 - 8) * (y / h))
    g = int(12 + (30 - 12) * (y / h))
    b = int(24 + (50 - 24) * (y / h))
    draw.line([(0, y), (w, y)], fill=(r, g, b))
# Add subtle stars
np_night = np.array(clear_night)
random.seed(42)
num_stars = 350
for _ in range(num_stars):
    sx = random.randint(0, w - 1)
    sy = random.randint(0, int(h * 0.85))
    brightness = random.randint(140, 255)
    sz = random.choice([1, 1, 1, 2])
    b_val = min(255, int(brightness * 1.05))
    np_night[sy:sy+sz, sx:sx+sz] = [brightness, brightness, b_val]
clear_night = Image.fromarray(np_night)
clear_night = Image.blend(clear_night, img_night, 0.2)
clear_night.save(os.path.join(bg_dir, 'clear_sky_night.webp'), 'WEBP', quality=88)

# 9. snow_blizzard_day
snow_day = img_day.copy()
snow_day = ImageEnhance.Color(snow_day).enhance(0.2)
snow_day = ImageEnhance.Brightness(snow_day).enhance(1.25)
snow_day = apply_color_tint(snow_day, (210, 225, 245), 0.45)
# Add falling snow flakes overlay
draw = ImageDraw.Draw(snow_day)
for _ in range(600):
    sx = random.randint(0, w - 1)
    sy = random.randint(0, h - 1)
    r_flake = random.randint(1, 3)
    opacity = random.randint(120, 230)
    draw.ellipse([sx, sy, sx + r_flake, sy + r_flake], fill=(opacity, opacity, int(opacity * 1.05)))
snow_day = snow_day.filter(ImageFilter.GaussianBlur(0.6))
snow_day.save(os.path.join(bg_dir, 'snow_blizzard_day.webp'), 'WEBP', quality=88)

# 10. snow_blizzard_night
snow_night = img_night.copy()
snow_night = ImageEnhance.Color(snow_night).enhance(0.2)
snow_night = apply_color_tint(snow_night, (160, 180, 220), 0.3)
draw = ImageDraw.Draw(snow_night)
for _ in range(500):
    sx = random.randint(0, w - 1)
    sy = random.randint(0, h - 1)
    r_flake = random.randint(1, 3)
    opacity = random.randint(100, 220)
    draw.ellipse([sx, sy, sx + r_flake, sy + r_flake], fill=(opacity, opacity, int(opacity * 1.1)))
snow_night = snow_night.filter(ImageFilter.GaussianBlur(0.6))
snow_night.save(os.path.join(bg_dir, 'snow_blizzard_night.webp'), 'WEBP', quality=88)

# 11. fog_mist_day
fog_day = img_day.copy()
fog_day = fog_day.filter(ImageFilter.GaussianBlur(6.0))
fog_day = ImageEnhance.Contrast(fog_day).enhance(0.6)
fog_day = ImageEnhance.Brightness(fog_day).enhance(1.15)
fog_day = apply_color_tint(fog_day, (215, 220, 228), 0.4)
fog_day.save(os.path.join(bg_dir, 'fog_mist_day.webp'), 'WEBP', quality=88)

# 12. fog_mist_night
fog_night = img_night.copy()
fog_night = fog_night.filter(ImageFilter.GaussianBlur(5.0))
fog_night = ImageEnhance.Contrast(fog_night).enhance(0.7)
fog_night = apply_color_tint(fog_night, (95, 105, 125), 0.4)
fog_night.save(os.path.join(bg_dir, 'fog_mist_night.webp'), 'WEBP', quality=88)

print("All 14 weather background assets successfully prepared!")
for f in sorted(os.listdir(bg_dir)):
    p = os.path.join(bg_dir, f)
    print(f"  {f}: {os.path.getsize(p) // 1024} KB")
