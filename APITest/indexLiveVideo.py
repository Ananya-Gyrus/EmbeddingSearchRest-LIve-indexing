import requests

port_num = 5800

BASE_URL = f"http://127.0.0.1:{port_num}"

stream_url = "http://localhost:8000/hls_output/playlist.m3u8"

payload = {
    "data": [
        {"streamPath": stream_url, "sourceId": "live_cos","fps": 30,"useAudio": True}
    ],
    "isVideo": True,
    "dbName": "live"
}

response = requests.post(
    f"{BASE_URL}/index-live",
    json=payload
)

print(response.json())