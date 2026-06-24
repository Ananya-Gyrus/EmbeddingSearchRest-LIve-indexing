import os
import subprocess


def start_hls_stream(video_path):

    output_dir = "hls_output"
    os.makedirs(output_dir, exist_ok=True)
    playlist = os.path.join(
        output_dir,
        "playlist.m3u8",
    )
    cmd = [
        "ffmpeg",
        "-re",
        "-stream_loop",
        "-1",
        "-i",
        video_path,
        "-c:v",  
        "libx264",
        "-c:a",
        "aac",
        "-f",
        "hls",
        "-hls_time",
        "6",
        "-hls_list_size",
        "10",
        "-hls_flags",
        "append_list",
        "-hls_segment_filename",
        os.path.join(
            output_dir,
            "segment_%05d.ts",
        ),
        playlist,
    ]
    print("Starting HLS stream...")
    subprocess.run(cmd)
start_hls_stream("work_dir/CosmosLaundromat.mp4")