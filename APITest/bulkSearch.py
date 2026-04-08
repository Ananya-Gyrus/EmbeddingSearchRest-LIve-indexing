import requests
import json


port_num = 5801
BASE_URL = f"http://127.0.0.1:{port_num}"

search_url = f"{BASE_URL}/bulk-search"
search_payload = {
    "queries": ["tears of steel", "", "man with read hair", "smoking"],
    # "sortBy": "relevance",
    # "startIndex": 1,
    "limit": 10,
    "dbName": "ei2",
    "sourceIds" : ["cos", "tos"],
    # "indexType": "text"
}

search_resp = requests.post(search_url, json=search_payload)
print("Search Videos:", search_resp.json())