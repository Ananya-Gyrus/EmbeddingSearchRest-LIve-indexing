import os
import glob
import time
import subprocess
import requests

PORT = 5800
VIDEO_PATH = "work_dir/CosmosLaundromat.mp4"
STREAM_URL = "http://localhost:8000/hls_output/playlist.m3u8"

# Start ffmpeg
output_dir = "work_dir/hls_output"
os.makedirs(output_dir, exist_ok=True)

# Remove old HLS files
for file in glob.glob(os.path.join(output_dir, "*")):
    try:
        os.remove(file)
    except OSError:
        pass

playlist = os.path.join(output_dir, "playlist.m3u8")

cmd = [
    "ffmpeg",
    "-re",
    "-stream_loop", "-1",
    "-i", VIDEO_PATH,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-f", "hls",
    "-hls_time", "6",
    "-hls_list_size", "10",
    "-hls_flags", "append_list",
    "-hls_segment_filename",
    os.path.join(output_dir, "segment_%05d.ts"),
    playlist,
]

print("Starting HLS stream...")
ffmpeg_process = subprocess.Popen(cmd)

# Wait until playlist exists
print("Waiting for playlist...")
while not os.path.exists(playlist):
    time.sleep(1)

# Give ffmpeg a couple more seconds to generate segments
time.sleep(2)

print("Calling /index-live API...")

payload = {
    "data": [
        {"streamPath": STREAM_URL, "sourceId": "live_cos", "fps": 30, "useAudio": True}
    ],
    "isVideo": True,
    "dbName": "live"
}

response = requests.post(
    f"http://127.0.0.1:{PORT}/index-live",
    json=payload,
)

print(response.json())

try:
    ffmpeg_process.wait()
except KeyboardInterrupt:
    print("\nStopping stream...")
    ffmpeg_process.terminate()