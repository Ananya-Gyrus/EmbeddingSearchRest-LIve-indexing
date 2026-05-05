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
         {"filepath": "WING.mp4", "sourceId": "wing2", "fps": 30, "useAudio": True},
         #{"filepath": "tearsofsteel.mp4", "sourceId": "tos2", "fps": 30, "useAudio": True},
        # {"filepath": "meridian.mp4", "sourceId": "mer2", "fps": 30, "useAudio": True},
        # {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos2", "fps": 30, "useAudio": True},
         #{"filepath": "Spring.mp4", "sourceId": "spr", "fps": 30, "useAudio": True},
         #{"filepath": "Sprite.mp4", "sourceId": "ite", "fps": 30, "useAudio": True},

     ],
    "isVideo": True,
    "dbName": "sa2"
}

index_resp = requests.post(index_url, json=index_payload)
print("Index Videos:", index_resp.json())
