import requests
import json


port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

index_url = f"{BASE_URL}/index-videos"
index_payload = {
    "data": [ 

        {"filepath": "meridian.mp4", "sourceId": "mer62", "fps": 30, "useAudio": False},
        #{"filepath": "tearsofsteel.mp4", "sourceId": "tos2", "fps": 30, "useAudio": False},
        {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos", "fps": 30, "useAudio": True},
    ],

    "isVideo": True,
    "dbName": "vllm"
}
index_resp = requests.post(index_url, json=index_payload)
print("Index Videos:", index_resp.json())
