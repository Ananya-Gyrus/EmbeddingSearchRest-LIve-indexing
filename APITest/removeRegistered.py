import requests
import json

port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

remove_url = f"{BASE_URL}/remove-registered"
remove_payload = {
    "name": "Jon"
}

remove_resp = requests.post(remove_url, json=remove_payload)
print("Remove Registered:", remove_resp.json())