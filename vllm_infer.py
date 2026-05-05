import unicodedata
import numpy as np
import logging
import argparse
from dataclasses import asdict
from typing import Dict
from typing import List, Dict, Any, Optional, List, Union, Dict, Any
from PIL import Image
import os
from vllm import LLM, EngineArgs
from vllm.multimodal.utils import fetch_image, fetch_video
from qwen_vl_utils.vision_process import process_vision_info

# Constants for configuration
MAX_LENGTH = 8192
IMAGE_BASE_FACTOR = 16
IMAGE_FACTOR = IMAGE_BASE_FACTOR * 2
MIN_PIXELS = 4 * IMAGE_FACTOR * IMAGE_FACTOR
MAX_PIXELS = 1800 * IMAGE_FACTOR * IMAGE_FACTOR
FPS = 1
MAX_FRAMES = 8
FRAME_MAX_PIXELS = 400 * 400
MAX_TOTAL_PIXELS = 10 * FRAME_MAX_PIXELS


def sample_frames(frames: List[Union[str, Image.Image]], num_segments: int, max_segments: int) -> List[str]:
    duration = len(frames)
    frame_id_array = np.linspace(0, duration - 1, num_segments, dtype=int)
    frame_id_list = frame_id_array.tolist()
    last_frame_id = frame_id_list[-1]

    # Create a list of sampled frames
    sampled_frames = []
    for frame_idx in frame_id_list:
        try:
            sampled_frames.append(frames[frame_idx])
        except:
            break
    # Ensure the sampled list meets the required segment count
    while len(sampled_frames) < num_segments:
        sampled_frames.append(frames[last_frame_id])
    return sampled_frames[:max_segments]


def format_input_to_conversation(
    input_dict: Dict[str, Any], 
    instruction: str = "Represent the user's input.",
    fps: float = FPS,
    max_frames: int = MAX_FRAMES
) -> List[Dict]:
    content = []
    # print(input_dict.keys())
    text = input_dict.get('text')
    image = input_dict.get('image')
    video = input_dict.get('video')

    if image:
        image_content = None
        if isinstance(image, str):
            if image.startswith(('http', 'https', 'oss')):
                image_content = image
            else:
                abs_image_path = os.path.abspath(image)
                image_content = 'file://' + abs_image_path
        else:
            image_content = image
        
        if image_content:
            content.append({
                'type': 'image', 
                'image': image_content,
            })

    if video:
        video_content = None
        video_kwargs = {}
        
        if isinstance(video, list):
            video_content = video
            if max_frames is not None:
                video_content = sample_frames(video_content, max_frames, max_frames)
            video_content = [
                ('file://' + ele if isinstance(ele, str) else ele) 
                for ele in video_content
            ]

        elif isinstance(video, str):
            if video.startswith(('http://', 'https://')):
                video_content = video
            else:
                abs_video_path = os.path.abspath(video)
                video_content = 'file://' + abs_video_path

            video_kwargs = {'fps': fps, 'max_frames': max_frames}
        else:
            video_content = None
        
        if video_content:
            content.append({
                'type': 'video',
                'video': video_content,
                'max_pixels': FRAME_MAX_PIXELS,
                **video_kwargs
            })

    if text:
        content.append({'type': 'text', 'text': text})
    
    if not content:
        content.append({'type': 'text', 'text': ""})
    
    conversation = [
        {"role": "system", "content": [{"type": "text", "text": instruction}]},
        {"role": "user", "content": content}
    ]
    
    return conversation


def print_embeddings(embeds: list[float]):
    embeds_trimmed = (str(embeds[:4])[:-1] + ", ...]") if len(embeds) > 4 else embeds
    print(f"Embeddings: {embeds_trimmed} (size={len(embeds)})")


def save_embeddings(embeds, output_file= "vllm_embeddings.txt"):
    output_path = os.path.abspath(output_file)
    
    with open(output_path, 'w') as f:
        f.write(','.join(str(x) for x in embeds))
    
    print(f"Embeddings saved to: {output_path}")



def prepare_vllm_inputs(
    input_dict: Dict[str, Any], 
    llm, 
    instruction: str = "Represent the user's input."
) -> Dict[str, Any]:
    
    conversation = format_input_to_conversation(input_dict, instruction)

    prompt_text = llm.llm_engine.tokenizer.apply_chat_template(
        conversation, 
        tokenize=False, 
        add_generation_prompt=True
    )
    images, video_inputs, video_kwargs = process_vision_info(
        [conversation],  # Pass as list of conversations
        image_patch_size=16,
        return_video_metadata=True,
        return_video_kwargs=True
    )
    
    videos = None
    video_metadata = None
    
    if images is not None and isinstance(images, list) and len(images) > 0:
        if isinstance(images[0], list):
            images = images[0] if len(images[0]) > 0 else None
    
    conv_video_inputs = video_inputs
    
    
    if conv_video_inputs and len(conv_video_inputs) > 0:
        videos, video_metadata = zip(*conv_video_inputs)
        videos = list(videos)
        video_metadata = list(video_metadata)
        
    # NOTE: error i had: used to pass images: None and send it but its wrong. only add if images or not None
    multi_modal_data = {}
    if images is not None:
        # just images
        multi_modal_data["image"] = images
    
    if videos is not None and video_metadata is not None and len(video_metadata) > 0:
        # with metadat vllm needs video as videoa dn metadata tuples (vid, met)
        video_with_metadata = [(v, m) for v, m in zip(videos, video_metadata)]
        multi_modal_data["video"] = video_with_metadata
    elif videos is not None:
        # without metadata
        multi_modal_data["video"] = videos
        

    result = {
        "prompt": prompt_text,
        "multi_modal_data": multi_modal_data if multi_modal_data else None,
    }

    if video_kwargs:
        result["video_kwargs"] = video_kwargs

    return result



# def run_qwen3_vl():
    
#     engine_args = EngineArgs(
#         model="checkpoints/models--Qwen--Qwen3-VL-Embedding-8B/snapshots/a12d6118f720ceb6d95f7d1cad4e8aeccddd9340",
#         runner="pooling",
#         max_model_len=8192,
#         trust_remote_code=True,
#     )

#     llm = LLM(**asdict(engine_args))

#     vllm_inputs = [prepare_vllm_inputs(inp, llm) for inp in all_inputs]

#     # Convert to TextPrompt format for vLLM
#     # vllm expects prompts to be strings or TextPrompt dictionaries
#     text_prompts = []
#     for inp in vllm_inputs:
#         text_prompt = {
#             "prompt": inp["prompt"],
#         }
        
#         # Only add multi_modal_data if present
#         if inp.get("multi_modal_data"):
#             text_prompt["multi_modal_data"] = inp["multi_modal_data"]
        
#         # Only add mm_processor_kwargs if present
#         if inp.get("video_kwargs"):
#             text_prompt["mm_processor_kwargs"] = inp["video_kwargs"]
        
#         text_prompts.append(text_prompt)

#     # Call embed with TextPrompt format
#     outputs = llm.embed(
#         text_prompts,
#         use_tqdm=False,
#     )
    
#     embedding = outputs[0].outputs.embedding
#     print_embeddings(embedding)
#     save_embeddings(embedding, "vllm_embeddings.txt")

# model_example_map = {
#     "qwen3_vl": run_qwen3_vl,
# }



# def main():
#     model = "qwen3_vl"
#     model_example_map[model]()



# main()

if __name__ == "__main__":
    pil_images_list = []
    # for i in range(8):
    #     img = Image.new('RGB', (100, 100), color = (i*30, i*30, i*30))
    #     pil_images_list.append(img)
    # # format_input_to_conversation({"video": pil_images_list})
    # from embedding_utils import prepare_vllm_inputs_worker, get_embedding_model
    # llm, _, _ = get_embedding_model()
    # tok = llm.get_tokenizer()
    # prepare_vllm_inputs_worker(pil_images_list, tok)
