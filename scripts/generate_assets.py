import os, sys, time, base64, requests
from PIL import Image

env_vars = {}
with open('/home/ubuntu/.hermes/.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

or_key = env_vars.get('OPENROUTER_API_KEY')
if not or_key:
    print("Error: No OPENROUTER_API_KEY found")
    sys.exit(1)

ASSETS = [
    {
        "id": "storm_heavy_rain_day",
        "prompt": "Cinematic dramatic stormy day sky with dark churning cumulonimbus storm clouds, rain streaks and water droplets on glass window in foreground, moody lighting, dark overcast atmosphere, highly detailed, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "storm_heavy_rain_night",
        "prompt": "Cinematic dark moody nighttime storm, deep midnight dark navy clouds, subtle distant ambient lightning glow, water droplets and heavy rain streams on window glass, atmospheric depth, photorealistic, 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "rain_moderate_day",
        "prompt": "Cinematic overcast rainy day, soft diffuse gray sky with gentle rain streaks and fine mist droplets on glass window, melancholic serene mood, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "rain_moderate_night",
        "prompt": "Cinematic dark night rain, glistening wet window glass with delicate raindrops, deep charcoal and midnight blue ambient sky, atmospheric bokeh reflections, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "cloudy_overcast_day",
        "prompt": "Cinematic dramatic overcast gray clouds, thick textured stratocumulus cloudscape, atmospheric depth, soft moody daylight, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "cloudy_overcast_night",
        "prompt": "Cinematic moody overcast midnight sky, textured dark slate clouds drifting under faint moonlit rim lighting, atmospheric, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "partly_cloudy_day",
        "prompt": "Cinematic partly cloudy sky, majestic silver and white clouds with golden sunbeams breaking through, rich sky gradient, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "partly_cloudy_night",
        "prompt": "Cinematic nighttime sky, dark velvet blue with scattered glowing clouds and faint stars visible between cloud gaps, ethereal nocturnal lighting, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "clear_sky_day",
        "prompt": "Cinematic clear bright day sky, pristine deep celestial azure blue gradient, subtle golden warmth on horizon, lens flare, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "clear_sky_night",
        "prompt": "Cinematic clear dark starry night sky, deep void indigo, countless crystalline sharp stars and subtle cosmic nebula haze, quiet serenity, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "snow_blizzard_day",
        "prompt": "Cinematic winter snow day, icy frost crystals forming on glass edges, swirling white snowflakes against pale misty gray sky, cold crisp atmospheric depth, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "snow_blizzard_night",
        "prompt": "Cinematic dark winter blizzard at night, illuminated falling snow particles and frozen ice vignette on glass window, deep midnight blue, eerie beautiful silence, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "fog_mist_day",
        "prompt": "Cinematic dense atmospheric morning fog, ethereal misty layers obscuring horizon, soft diffuse silver lighting, tranquil and mysterious, photorealistic 8k, aspect ratio 16:9, clean no text"
    },
    {
        "id": "fog_mist_night",
        "prompt": "Cinematic dense night mist and fog, dark atmospheric smoke-like vapor swirls, mysterious deep shadows with subtle diffuse luminescence, photorealistic 8k, aspect ratio 16:9, clean no text"
    }
]

out_dir = '/home/ubuntu/projects/weather-dashboard/public/weather-bg'
os.makedirs(out_dir, exist_ok=True)

ref_img_path = '/home/ubuntu/.hermes/cache/images/img_fb3ee8507736.jpeg'
if os.path.exists(ref_img_path):
    try:
        ref = Image.open(ref_img_path)
        ref.save(os.path.join(out_dir, 'reference_original.webp'), 'WEBP', quality=92)
        print("Saved reference_original.webp")
    except Exception as e:
        print("Ref error:", e)

for item in ASSETS:
    target_webp = os.path.join(out_dir, f"{item['id']}.webp")
    if os.path.exists(target_webp):
        print(f"[{item['id']}] already exists, skipping.")
        continue
    
    print(f"Generating [{item['id']}]...")
    payload = {
        'model': 'google/gemini-2.5-flash-image',
        'messages': [
            {'role': 'user', 'content': item['prompt']}
        ],
        'modalities': ['text', 'image']
    }
    
    success = False
    for attempt in range(3):
        try:
            r = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={'Authorization': f"Bearer {or_key}"},
                json=payload,
                timeout=50
            )
            if r.status_code == 200:
                data = r.json()
                msg = data['choices'][0]['message']
                images = msg.get('images', [])
                if images:
                    img_data = images[0]['image_url']['url']
                    if ',' in img_data:
                        b64_str = img_data.split(',', 1)[1]
                        raw_bytes = base64.b64decode(b64_str)
                        tmp_png = f"/tmp/{item['id']}.png"
                        with open(tmp_png, 'wb') as f_img:
                            f_img.write(raw_bytes)
                        im = Image.open(tmp_png)
                        im.save(target_webp, 'WEBP', quality=88, method=6)
                        os.remove(tmp_png)
                        print(f"Saved {target_webp} ({os.path.getsize(target_webp) // 1024} KB)")
                        success = True
                        break
            else:
                print(f"Attempt {attempt+1} failed: {r.status_code} - {r.text[:200]}")
                time.sleep(2)
        except Exception as ex:
            print(f"Attempt {attempt+1} exception: {ex}")
            time.sleep(2)
            
    if not success:
        print(f"Failed to generate {item['id']}")
    time.sleep(1)

print("Asset generation loop completed.")
