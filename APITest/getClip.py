import requests
import os

# Simple test script to request a clip from the local server and save it
port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

# Configure these variables for your test
VIDEO_PATH = "CosmosLaundromat.mp4"  # example path relative to server working dir
START = 90.0
END = 120.0
OUT_FILE = os.path.join(os.path.dirname(__file__), "clip_out.mp4")

from urllib.parse import quote
parts = [quote(p, safe='') for p in VIDEO_PATH.split('/')]
encoded_path = '/'.join(parts)
url = f"{BASE_URL}/video/{encoded_path}"

payload = {"start": START, "end": END}

print(f"Requesting: {url} json={payload}")
with requests.post(url, json=payload, stream=True, timeout=120) as r:
    if r.status_code != 200:
        print(f"Server returned {r.status_code}: {r.text}")
        exit()

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    written = 0
    with open(OUT_FILE, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            if not chunk:
                continue
            f.write(chunk)
            written += len(chunk)

    print(f"Saved {written} bytes to {OUT_FILE}")

