import os
import warnings
import subprocess

from db_utils import get_db_manager
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
from flask import Flask, jsonify, request, send_file, Response, current_app, abort
import argparse
from utils.base import initialize_config, initialize_db_config
from utils.index import index_videos
from utils.search import search_api, imagesearch_api, get_transcripts
from utils.status import get_status
from utils.licence import check_licence_validation, create_licence_requirement, get_remaining_credit
from utils.remove import remove_video
from embedding_utils import get_embedding_model
from utils.imageRegister import register_images_api, remove_registered_character, search_registered_api, get_registration_status
from flask_cors import CORS
import tempfile
from werkzeug.utils import secure_filename, safe_join

import threading
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
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


from dotenv import set_key, load_dotenv

# Load existing environment variables when the app starts
load_dotenv()

@app.route('/activate-license', methods=['POST'])
def activate_license():
    data = request.json
    user_password = data.get('password')

    if not user_password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    try:
        # Define the path to your .env file (assuming it's in the same directory as this script)
        env_file_path = os.path.join(os.path.dirname(__file__), '.env')
        
        # Create the .env file if it doesn't already exist
        if not os.path.exists(env_file_path):
            open(env_file_path, 'a').close()

        # 1. Persist it: Write the key to the .env file so it survives reboots
        set_key(env_file_path, 'LICENSE_KEY', user_password)
        
        # 2. Immediate use: Set it in the current running process 
        os.environ['LICENSE_KEY'] = user_password
        
        return jsonify({"success": True, "message": "License key permanently saved."})

    except Exception as e:
        print(f"Activation Error: {e}")
        return jsonify({"success": False, "error": "System Error during activation"}), 500

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        working_dir = app.config.get('WORKING_DIR', 'work_dir')
        upload_root = os.path.join(working_dir, 'uploads')
        os.makedirs(upload_root, exist_ok=True)

        files = request.files.getlist('files[]') or request.files.getlist('files') or []
        relpaths = request.form.getlist('relpaths[]') or request.form.getlist('relpaths') or []

        saved = []
        for idx, f in enumerate(files):
            rel = relpaths[idx] if idx < len(relpaths) and relpaths[idx] else f.filename
            rel = rel.replace('\\', '/').lstrip('/')

            parts = [secure_filename(p) for p in rel.split('/') if p != '']
            if not parts:
                parts = [secure_filename(f.filename)]
            dest_dir = os.path.join(upload_root, *parts[:-1]) if len(parts) > 1 else upload_root
            os.makedirs(dest_dir, exist_ok=True)
            dest_name = parts[-1]
            dest_path = os.path.join(dest_dir, dest_name)

            f.save(dest_path)

            rel_to_workdir = os.path.relpath(dest_path, working_dir).replace('\\', '/')
            saved.append({ 'original': f.filename, 'saved': rel_to_workdir })

        uploaded = [{'originalName': s['original'], 'storedPath': s['saved']} for s in saved]
        return jsonify({'success': True, 'uploaded': uploaded, 'saved': saved}), 200

    except Exception as e:
        app.logger.exception("Upload error")
        return jsonify({'error': str(e)}), 500

OUTPUT_DIR = working_dir 
@app.route('/list-indexed', methods=['GET'])
def list_indexed_videos():
    videos = []

    for filename in os.listdir(OUTPUT_DIR):
        if filename.endswith("_video.index"):
            
            base = filename.replace("_video.index", "")

            videos.append({
                "sourceId": base,
                "name": base + ".mp4", 
                "dbName": base 
            })

    return jsonify({"videos": videos})


@app.route('/video/<path:video_path>',methods = ['GET','POST'])
def serve_video(video_path):
    """Serve a video clip between start and end timestamps"""
    # print(f"Request to serve video: {video_path} with args: {request.args}")
    try:
        # print(request.json)
        start_time = float(request.json.get('start', 0) if request.json else 0)
        end_time = float(request.json.get('end', 0) if request.json else 0)
        db_name = request.json.get('db', '') if request.json else ''
       
        # Construct the full video path
        full_video_path = os.path.join(working_dir, video_path)
        # print(f"Full video path: {full_video_path}, start_time: {start_time}, end_time: {end_time}, db_name: {db_name}")
        # Check if file exists
        if not os.path.exists(full_video_path):
            return Response(f"Video file not found: {full_video_path}", status=404)
        # print(f"Serving video: {full_video_path}, start_time: {start_time}, end_time: {end_time}")
        if start_time == 0 or end_time == 0:
            #send whole video if start or end time is not provided
            return send_file(
                "../"+full_video_path,
                mimetype='video/mp4',
                as_attachment=False,
                download_name=os.path.basename(full_video_path)
            )

        # Calculate duration
        duration = end_time - start_time
        
        if duration <= 0:
            return Response("Invalid time range", status=400)
        
        # Create a temporary file for the clipped video
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_file.close()
        
        try:
            # Use ffmpeg to extract the video segment
            # -ss: start time, -t: duration, -c copy: copy codec without re-encoding for speed
            # If you want to re-encode for better compatibility, use -c:v libx264 -c:a aac
            command = [
                'ffmpeg',
                '-ss', str(start_time),
                '-i', full_video_path,
                '-t', str(duration),
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-preset', 'ultrafast',
                '-y',
                temp_file.name
            ]
            # print("Running ffmpeg command:", ' '.join(command))
            # Run ffmpeg
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30
            )
            # print("start time:", start_time)
            # print("end time:", end_time)
            # print("duration:", duration)

            if result.returncode != 0:
                # If copy codec fails, try re-encoding
                command = [
                    'ffmpeg',
                    '-ss', str(start_time),
                    '-i', full_video_path,
                    '-t', str(duration),
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-preset', 'ultrafast',
                    '-y',
                    temp_file.name
                ]
                
                result = subprocess.run(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=60
                )
                
                if result.returncode != 0:
                    return Response(f"Error processing video: {result.stderr.decode()}", status=500)
            
            # Send the video file
            return send_file(
                temp_file.name,
                mimetype='video/mp4',
                as_attachment=False,
                download_name=f'clip_{start_time}_{end_time}.mp4'
            )
            
        finally:
            # Clean up temp file after a delay (Flask will handle this)
            # We can't delete immediately as send_file needs to read it
            pass
            
    except subprocess.TimeoutExpired:
        return Response("Video processing timeout", status=500)
    except Exception as e:
        print(f"Error serving video clip: {e}")
        return Response(f"Error serving video clip: {str(e)}", status=500)

@app.route('/thumbnail/<path:filename>')
def get_thumbnail(filename):
    """Generate or retrieve thumbnail for a video"""
    working_dir = current_app.config.get('WORKING_DIR', 'work_dir')
    upload_folder = os.path.join(working_dir, 'uploads')
    output_dir = os.path.join(working_dir, 'database')

    # Secure the filename
    secure_name = secure_filename(os.path.basename(filename))
    
    # Try to find the video
    video_path = os.path.join(upload_folder, secure_name)
    
    if not os.path.exists(video_path):
        # If not found, try to find it using the database manager
        db_manager = get_db_manager()
        try:
            # Search for the video in database
            metadata = db_manager.get_video_metadata(secure_name)
            if metadata and metadata.get('video_path_relative'):
                relative_path = metadata['video_path_relative']
                # Construct absolute path from working_dir
                video_path = os.path.join(working_dir, relative_path)
        except Exception as e:
            print(f"Error finding video in database: {e}")
    
    if not os.path.exists(video_path):
        abort(404)
    
    # Check for timestamp to extract specific frame
    timestamp = request.args.get('t', None)
    # Create thumbnails directory if it doesn't exist
    thumbnails_dir = os.path.join(output_dir, 'thumbnails')
    os.makedirs(thumbnails_dir, exist_ok=True)
    
    # Generate thumbnail filename
    thumbnail_suffix = f"_t{timestamp}" if timestamp else ""
    thumbnail_filename = f"{os.path.splitext(secure_name)[0]}{thumbnail_suffix}.jpg"
    thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
    # Generate thumbnail if it doesn't exist
    if not os.path.exists(thumbnail_path):
        # Use ffmpeg to extract a frame
        time_param = ['-ss', str(timestamp)] if timestamp else ['-ss', '1']  # Default to 1s if not specified
        cmd = [
            'ffmpeg',
            *time_param,
            '-i', video_path,
            '-vframes', '1',
            '-vf', 'scale=320:-1',  # Rescale to width 320, maintain aspect ratio
            '-q:v', '2',  # High quality
            thumbnail_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"Error generating thumbnail: {e.stderr.decode()[:500]}")
            abort(500)
        except Exception as e:
            print(f"Error generating thumbnail: {str(e)}")
            abort(500)
    
    # Serve the thumbnail
    return send_file(os.path.abspath(thumbnail_path))

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
    query = data.get("query", "")
    start_index = data.get("startIndex", 1)
    limit = data.get("limit", 20)
    db_name = data.get("dbName", "*")
    source_ids = data.get("sourceIds", None)
    index_type = data.get("indexType", "video")
    search_res, status_code = search_api(str(query), 0, start_index, limit, False, db_name, source_ids, index_type)
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

@app.route('/register-images', methods=['POST'])
def register_images_rest():
    data = request.get_json()
    data_list = data.get("data", []) if data else []
    status, status_code = register_images_api(data_list)
    return jsonify(status), status_code

@app.route('/remove-registered', methods=['POST'])
def remove_registered_rest():
    data = request.get_json()
    name = data.get("name").strip() if data else None
    if not name:
        return jsonify({"error": "Name is required"}), 400
    # print(f"Received request to remove registered character: {name}")
    name = name.strip().casefold()
    status, status_code = remove_registered_character(name)
    return jsonify(status), status_code

@app.route('/search-registered', methods=['POST'])
def search_registered_rest():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    character = data.get("character", "")
    action = data.get("action", "")
    threshold = data.get("threshold", 0)
    start_index = data.get("startIndex", 1)
    limit = data.get("limit", 20)
    db_name = data.get("dbName", "*")
    source_ids = data.get("sourceIds", None)
    image_sim_threshold = data.get("imageSimThreshold", 0.3)
    character_weight = data.get("characterWeight", 0.6)
    search_res, status_code = search_registered_api(
        character,
        action,
        threshold,
        start_index,
        limit,
        db_name,
        source_ids,
        image_sim_threshold,
        character_weight
    )
    return jsonify(search_res), status_code

@app.route('/registration-status', methods=['GET'])
def registration_status_rest():
    status, status_code = get_registration_status()
    return jsonify(status), status_code


os.environ['VLLM_WORKER_MULTIPROC_METHOD'] = 'spawn'
from embedding_utils import get_embedding_model
model,_,_ = get_embedding_model()
if model:
    print("Embedding model loaded successfully.")

if __name__ == '__main__':
    # Dev fallback only – use Gunicorn in production
    app.run(debug=False, host='0.0.0.0', port=port_num)
