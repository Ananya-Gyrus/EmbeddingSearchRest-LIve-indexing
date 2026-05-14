import requests
import json


port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

index_url = f"{BASE_URL}/index-videos"



"""index_payload = {
    "data": [
        {
            "filepath": "tos_images",
            "sourceId": "tosimg",
            "fps": 30,
            "sceneFrames": [0, 35, 130, 362, 458, 637, 825, 888],
            "useAudio": True
        }
    ],
    "isVideo": False,   
>>>>>>> 78df477 (mutex error resolved)
    "dbName": "vllm"
}"""
index_payload = {
    "data": [
        {"filepath": "uploads/BERITA_TENGAH_HARI_2026_MEI_4.mp4", "sourceId": "is1", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/WING.mp4", "sourceId": "wing", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/tearsofsteel.mp4", "sourceId": "tos", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/meridian.mp4", "sourceId": "mer", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/CosmosLaundromat.mp4", "sourceId": "cos", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/Spring.mp4", "sourceId": "spr", "fps": 30, "useAudio": True},
        # {"filepath": "uploads/Sprite.mp4", "sourceId": "sprite", "fps": 30, "useAudio": True},
     ],
    "isVideo": True,
    "dbName": "is_test"
}

index_resp = requests.post(index_url, json=index_payload)
print("Index Videos:", index_resp.json())
