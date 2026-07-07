import os
import time
import gc
import threading
import subprocess
import queue
import m3u8

from config import get_config
from utils.status import get_status
from utils.index import index_videos

config = get_config()

def process_live_indexing(app, source_id, video_fps, use_audio, is_video, db_name, scene_frames,):
    if config.live_indexing:
        print("Live indexing already running")
        return
    config.live_indexing = True
    stream_url = os.path.abspath("hls_output/playlist.m3u8")    
    stream_name = os.path.splitext(os.path.basename(stream_url))[0]

    if not stream_name:
        stream_name = source_id

    chunk_dir = os.path.join(config.WORKING_DIR, f"{source_id}_live_chunks")
    os.makedirs(chunk_dir, exist_ok=True)

    playlist = m3u8.load(stream_url)

    print(f"Target duration: {playlist.target_duration}")
    print(f"Initial segments: {len(playlist.segments)}")

    chunk_queue = queue.Queue(maxsize=100)
    # FFmpeg chunk creation
    ffmpeg_cmd = [
        "ffmpeg",
        "-re",
        "-i", stream_url,
        "-map", "0",
        "-c:v", "libx264",
        "-preset", "veryfast",
        # GOP = 60 seconds (24 fps × 60)
        "-g", "1440",
        "-keyint_min", "1440",
        "-sc_threshold", "0",
        # Force an I-frame every 60 seconds
        "-force_key_frames", "expr:gte(t,n_forced*60)",
        "-c:a", "aac",
        "-f", "segment",
        "-segment_time", "60",
        "-segment_time_delta", "0.5",
        "-reset_timestamps", "1",

        os.path.join(
            chunk_dir,
            f"{stream_name}_%03d.ts"
        ),
    ]
    ffmpeg_thread = threading.Thread(
        target=lambda: subprocess.run(
            ffmpeg_cmd    
                ),
        daemon=True,    
    )
    ffmpeg_thread.start()
    print("Started FFmpeg chunking thread")
    detected_chunks = set()
    def chunk_watcher():
        chunk_counter = 0
        wait_time = 0

        while config.live_indexing:

            chunk_filename = f"{stream_name}_{chunk_counter:03d}.ts"
            chunk_path = os.path.join(chunk_dir, chunk_filename)

            if not os.path.exists(chunk_path):
                time.sleep(2)
                wait_time += 2

                try:
                    playlist = m3u8.load(stream_url)
                    print(
                        f"Playlist refresh: "
                        f"{len(playlist.segments)} segments available"
                    )
                except Exception as e:
                    print(f"Playlist refresh failed: {e}")
                if wait_time > 120:
                    print(f"Still waiting for {chunk_filename}")
                    wait_time = 0
                continue
            wait_time = 0
            # wait until FFmpeg finishes writing
            prev_size = -1
            stable_count = 0
            while config.live_indexing:
                try:
                    current_size = os.path.getsize(chunk_path)
                    if current_size > 0 and current_size == prev_size:
                        stable_count += 1
                    else:
                        stable_count = 0
                    prev_size = current_size
                    # file size stable for ~3 checks
                    if stable_count >= 3:
                        result = subprocess.run(
                            [
                                "ffprobe",
                                "-v",
                                "error",
                                chunk_path,
                            ],
                            capture_output=True, text=True,)
                        if result.returncode == 0:
                            print(f"{chunk_filename} validated")
                            break
                except Exception as e:
                    print(f"Validation failed: {e}")
                time.sleep(2)
            # enqueue AFTER validation
            if (config.live_indexing and chunk_path not in detected_chunks):
                print(f"{chunk_filename} validated")
                chunk_queue.put(chunk_path)
                detected_chunks.add(chunk_path)
                print(f"Queued {chunk_filename} "f"(queue size={chunk_queue.qsize()})")
                chunk_counter += 1
    watcher_thread = threading.Thread(
        target=chunk_watcher,
        daemon=True,
    )
    watcher_thread.start()
    print("Started chunk watcher thread")
    try:
        while config.live_indexing:
            try:
                chunk_path = chunk_queue.get(timeout=5)
            except queue.Empty:
                continue
            chunk_filename = os.path.basename(chunk_path)
            print(f"Dequeued {chunk_filename} "f"for indexing")
            while config.live_indexing:
                with app.app_context():
                    try:
                        status = get_status()
                        if isinstance(status, tuple):
                            status = status[0]
                        print("STATUS =", status)
                        if not status.get("in_progress", False):
                            break
                    except Exception as e:
                        print(f"Status error: {e}")
                time.sleep(2)
            chunk_path_in_wd = os.path.relpath(chunk_path, start=config.WORKING_DIR,)
            try:
                mp4_chunk = chunk_path.replace(".ts", ".mp4")
                subprocess.run([
                    "ffmpeg",
                    "-y",
                    "-i", chunk_path,
                    "-c", "copy",
                    "-movflags", "+faststart",
                    mp4_chunk])
                if not os.path.exists(mp4_chunk):
                    raise Exception("Converted MP4 not created")
                chunk_path_in_wd = os.path.relpath(mp4_chunk, start=config.WORKING_DIR)
                index_videos([chunk_path_in_wd], [source_id], [video_fps], [use_audio], is_video, scene_frames, db_name, True,)
                print(f"Started indexing "f"{chunk_filename}")
                while config.live_indexing:
                    time.sleep(2)
                    with app.app_context():
                        try:
                            status = get_status()
                            if isinstance(status, tuple):
                                status = status[0]
                            print("STATUS =", status)
                            if not status.get("in_progress", False):
                                break
                        except Exception as e:
                            print(f"Status error: {e}")   
                print(f"Finished indexing {chunk_filename}")
                try:
                    # remove original TS
                    os.remove(chunk_path)
                    # remove converted MP4
                    if os.path.exists(mp4_chunk):
                        os.remove(mp4_chunk)
                    print(f"Deleted {chunk_filename} and converted mp4")
                except Exception as e:
                    print(f"Delete failed: {e}")
                chunk_queue.task_done()
                gc.collect()
            except Exception as e:
                print(f"Error indexing "f"{chunk_filename}: {e}")
                chunk_queue.task_done()
                gc.collect()
                time.sleep(5)
    finally:
        print("Stopping live indexing")
        config.live_indexing = False
