import os, subprocess

video_dir = '/home/ubuntu/projects/weather-dashboard/public/weather-videos'

for f in os.listdir(video_dir):
    if f.endswith('.mp4'):
        mp4_path = os.path.join(video_dir, f)
        webm_path = os.path.join(video_dir, f.replace('.mp4', '.webm'))
        
        # Convert to WebM VP9 with ultra fast preset and lightweight footprint
        cmd = [
            'ffmpeg', '-y',
            '-i', mp4_path,
            '-c:v', 'libvpx-vp9',
            '-crf', '32',
            '-b:v', '0',
            '-deadline', 'realtime',
            '-cpu-used', '4',
            webm_path
        ]
        subprocess.run(cmd, capture_output=True)
        print(f"WebM: {f.replace('.mp4', '.webm')} created ({os.path.getsize(webm_path)//1024} KB)")

print("All WebM videos encoded.")
