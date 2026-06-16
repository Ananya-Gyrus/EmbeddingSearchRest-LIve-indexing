import os
import time
import gc
import threading
import subprocess
import queue
import m3u8
import requests
import io
from config import get_config
from app import app
from utils.status import get_status
from utils.index import index_videos

config = get_config()

def process_live_indexing(filepaths,source_id,video_fps,use_audio,is_video,db_name,scene_frames,):
    global live_indexing
    config.live_indexing = True

    if live_indexing:
        print("Live indexing already running")
        return
    live_indexing = True
    stream_url = filepaths[0]
    playlist = m3u8.load(stream_url)
    segment_queue = queue.Queue(maxsize=100)
    seen = set()
    while live_indexing:
        try:
            playlist = m3u8.load(stream_url)
            for segment in playlist.segments:
                seg_id = segment.uri
                if seg_id in seen:
                    continue
                seen.add(seg_id)
                headers = {}
                if segment.byterange:
                    length, offset = (
                        segment.byterange
                        .split("@"))
                    start = int(offset)
                    end = (start+ int(length)- 1)
                    headers["Range"] = (f"bytes="f"{start}-{end}")

                response = requests.get(
                    segment.absolute_uri,
                    headers=headers,
                    stream=True,
                )
                response.raise_for_status()
                segment_bytes = (
                    io.BytesIO(response.content)
                )
                segment_queue.put(segment_bytes)
                print(f"Queued "f"{seg_id}")
        except Exception as e:
            print(f"HLS error: {e}")
        # consumer
        while (
            not segment_queue.empty()
            and live_indexing
        ):
            stream = (segment_queue.get())
            while live_indexing:
                with app.app_context():
                    try:
                        status_resp, _ = (get_status())
                        if (not status_resp.get_json().get("in_progress",False,)):
                            break
                    except Exception:
                        pass
                time.sleep(2)
            try:
                (
                    config.indexing_status,
                    status_code,
                ) = index_videos(
                    [stream],
                    [source_id],
                    [video_fps],
                    [use_audio],
                    is_video,
                    scene_frames,
                    db_name,
                    True,
                )
                print("Indexed byte-range")
            except Exception as e:
                print(f"Index error: "f"{e}")
            segment_queue.task_done()
            gc.collect()
        time.sleep(playlist.target_duration)