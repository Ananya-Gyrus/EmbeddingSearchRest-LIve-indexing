import os
import warnings

# ── Silence everything before any heavy imports ──────────────────────────────
warnings.filterwarnings("ignore")

# vLLM
os.environ.setdefault("VLLM_LOGGING_LEVEL", "ERROR")
os.environ.setdefault("VLLM_DISABLE_RICH_LOGS", "1")

# Transformers / HuggingFace
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
os.environ.setdefault("HF_HUB_VERBOSITY", "error")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

# PyTorch
os.environ.setdefault("TORCH_CPP_LOG_LEVEL", "ERROR")
os.environ.setdefault("TORCH_DISTRIBUTED_DEBUG", "OFF")

# CUDA / NCCL
os.environ.setdefault("NCCL_DEBUG", "WARN")

import logging
logging.basicConfig(level=logging.ERROR)
for _noisy in (
    "transformers", "huggingface_hub", "vllm", "torch",
    "urllib3", "filelock", "PIL", "matplotlib",
):
    logging.getLogger(_noisy).setLevel(logging.ERROR)
# ─────────────────────────────────────────────────────────────────────────────

import datetime
import sys
sys.path.append('LanguageBind')
from flask import Flask, jsonify, request
import argparse
from utils.base import initialize_config, initialize_db_config
from utils.index import index_videos
from utils.search import search_api, imagesearch_api, get_transcripts
from utils.status import get_status
from utils.licence import check_licence_validation, create_licence_requirement, get_remaining_credit
from utils.remove import remove_video

import threading
app = Flask(__name__)
from setup_db import setup_database


def parse_directories():
    parser = argparse.ArgumentParser(description="Run Flask app, processing files from input_dir and saving results to output_dir.")

    parser.add_argument("-w", "--working_dir", dest="working_dir", default=os.environ.get("WORKING_DIR", "work_dir"),
                        help="Path to the working directory (default: work_dir)")

    parser.add_argument("-b", "--batch_size", type=int, dest="batch_size", default=int(os.environ.get("BATCH_SIZE", 6)),
                        help="Batch size for indexation (default: 6)")

    parser.add_argument("-p", "--port", type=int, dest="port", default=int(os.environ.get("PORT", 5800)),
                        help="Port to run the Flask app on (default: 5800)")

    parser.add_argument("-db", "--database_url", type=str, dest="database_url",
                        default=os.environ.get("DATABASE_URL"),
                        required=(os.environ.get("DATABASE_URL") is None),
                        help="Database connection URL")

    # Gunicorn passes no extra args; parse_known_args avoids errors from gunicorn internals
    args, _ = parser.parse_known_args()

    return args.working_dir, args.batch_size, args.port, args.database_url


working_dir, batch_size, port_num, database_url = parse_directories()
app.config['WORKING_DIR'] = working_dir
app.config['BATCH_SIZE'] = batch_size
app.config['DATABASE_URL'] = database_url
os.makedirs(working_dir, exist_ok=True)
os.makedirs(os.path.join(working_dir, "database"), exist_ok=True)
initialize_config(app)
initialize_db_config(app)
setup_database()

# Expose the WSGI callable at module level for Gunicorn
wsgi_app = app


@app.context_processor
def utility_processor():
    def now():
        return datetime.datetime.now()
    return dict(now=now)


@app.route('/licence-requirement', methods=['POST'])
def licence_requirement():
    working_dir = app.config.get('WORKING_DIR', 'work_dir')
    if check_licence_validation():
        Remaining_credit = get_remaining_credit()
        licensestatus = {"status": "License valid", "Remaining Hourly Credits": Remaining_credit}
    else:
        if not os.path.exists(os.path.join(working_dir, 'client_hardware_info.txt')):
            licensestatus, _ = create_licence_requirement()
        else:
            if os.path.exists(os.path.join(working_dir, 'licence_key.txt')):
                licensestatus = {"status": "User Key exists, Existing licence key is invalid."}
            else:
                licensestatus = {"status": "User Key exists, Please generate licence key."}
    return jsonify({"licensestatus": licensestatus}), 200


@app.route('/index-videos', methods=['POST'])
def index_videos_rest():
    data = request.get_json()
    video_data = data.get("data", [])

    filepaths = [item["filepath"].rstrip('/') for item in video_data]
    source_ids = [item.get("sourceId", os.path.basename(item["filepath"]).split(".")[0]) for item in video_data]
    video_fps_list = [item.get("fps", 30) for item in video_data]
    use_audio_list = [item.get("useAudio", False) for item in video_data]
    scene_frames = {item["sourceId"]: item["sceneFrames"] for item in video_data if "sceneFrames" in item}

    is_video = data.get("isVideo", True)
    db_name = data.get("dbName", "_default_db")
    index_status, statuscode = index_videos(filepaths, source_ids, video_fps_list, use_audio_list, is_video, scene_frames, db_name)
    return jsonify({"indexingstatus": index_status}), statuscode


@app.route('/remove-video', methods=['POST'])
def remove_video_rest():
    data = request.get_json()
    db_name = data.get("dbName", None)
    source_id = data.get("sourceId")
    index_type = data.get("indexType", "both")
    deletion_status, status_code = remove_video(source_id, db_name, index_type)
    return jsonify({"deletionstatus": deletion_status}), status_code


@app.route('/status', methods=['GET'])
def get_status_rest():
    status_data = get_status()
    return jsonify(status_data), 200


@app.route('/textsearch', methods=['POST'])
def textsearch():
    data = request.get_json()
    query = data.get("query")
    start_index = data.get("startIndex", 1)
    limit = data.get("limit", 20)
    db_name = data.get("dbName", "*")
    source_ids = data.get("sourceIds", None)
    index_type = data.get("indexType", "video")
    search_res, status_code = search_api(query, 0, start_index, limit, False, db_name, source_ids, index_type)
    return jsonify(search_res), status_code


@app.route('/imagesearch', methods=['POST'])
def imagesearch():
    data = request.get_json()
    image_path = data.get("image_path")
    text = data.get("text", "")
    start_index = data.get("startIndex", 1)
    limit = data.get("limit", 20)
    db_name = data.get("dbName", "*")
    source_ids = data.get("sourceIds", None)
    search_res, status_code = imagesearch_api(image_path, text, 0, start_index, limit, db_name, source_ids)
    return jsonify(search_res), status_code


@app.route('/stream-embeddings', methods=['POST'])
def stream_embeddings_rest():
    vec_results = {"message": "Streaming embeddings feature is currently disabled."}
    return jsonify(vec_results), 503


@app.route('/get-transcripts', methods=['POST'])
def get_transcripts_rest():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    source_id = data.get("sourceId")
    db_name = data.get("dbName", None)
    transcripts, status_code = get_transcripts(source_id, db_name)
    return jsonify({"transcripts": transcripts}), status_code


@app.route('/bulk-search', methods=['POST'])
def bulk_search_rest():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    queries = data.get("queries", [])
    start_index = data.get("startIndex", 1)
    limit = data.get("limit", 20)
    db_name = data.get("dbName", "*")
    source_ids = data.get("sourceIds", None)
    index_type = data.get("indexType", "video")
    search_results = []
    for query in queries:
        res, status_code = search_api(query, 0, start_index, limit, False, db_name, source_ids, index_type)
        if "error" in res:
            search_results.append({"query": query, "error": res["error"]})
        else:
            search_results.append(res)
    return jsonify({"searchResults": search_results}), 200


if __name__ == '__main__':
    # Dev fallback only – use Gunicorn in production
    app.run(debug=False, host='0.0.0.0', port=port_num)
