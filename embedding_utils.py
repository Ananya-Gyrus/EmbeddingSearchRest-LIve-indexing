import gc
import time
import cv2
import numpy as np
import torch
from PIL import Image
from typing import List, Optional, Union
import io
import whisper
from transformers import AutoProcessor
import torchaudio
from PIL import Image
from transformers import AutoProcessor, AutoModel

from src.models.embedding import Qwen3VLEmbedder
from vllm_infer import *
import requests
import base64

from transformers import AutoProcessor
from vllm import LLM, SamplingParams
import decord
import numpy as np
import torch
import torch.nn.functional as F
from concurrent.futures import ThreadPoolExecutor
import threading

# Global model instances (singleton pattern)
qwen3vl_model = None
processor = None
device = None
NUM_FRAMES = 8


# Mutex that serialises every call to model.embed() so that indexing and
# search threads never call into vLLM concurrently (vLLM's LLM is not
# thread-safe for concurrent embed() calls).
vllm_inference_lock = threading.Lock()

def get_embedding_model(model_path="./checkpoints/embedding_model/snapshots/a12d6118f720ceb6d95f7d1cad4e8aeccddd9340"):

    """
    Get the Model as a singleton
    
    Args:
        model_path: Path to the Qwen3-VL-Embedding model
    
    Returns:
        Tuple of (model, device)
    """
    global qwen3vl_model, processor, device
    
    if qwen3vl_model is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        try:
            qwen3vl_model = LLM(
                model=model_path,
                runner="pooling",
                max_model_len=4096+(4096//2), 
                dtype="bfloat16",
                kv_cache_dtype="auto",
                enforce_eager=False,
                distributed_executor_backend="mp",
                gpu_memory_utilization=0.75,
                # limit_mm_per_prompt={"video": 4},
                max_num_seqs=4//2,
                max_num_batched_tokens=4096+(4096//2),
            )
            processor = AutoProcessor.from_pretrained(model_path)
        except Exception as e:
            print(f"Error loading Model")
            qwen3vl_model = None
            device = None
            processor = None

    return qwen3vl_model, processor, device

def get_audio_text_model(download_root="checkpoints/cache_dir/whisper"):
    global text_model
    if text_model is None:
        text_model = whisper.load(whisper.load_model("medium", download_root=download_root))
    return text_model

def extract_frames(video_path: str, num_frames: int = 8) -> List[Image.Image]:
    """
    Extract evenly spaced frames from a video file
    
    Args:
        video_path: Path to the video file
        num_frames: Number of frames to extract
    
    Returns:
        List of PIL Image frames
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    frames = []
    
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frames.append(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
        else:
            break
    
    cap.release()
    return frames

import os
import base64

from pathlib import Path


def generate_video_from_frames(frames, fps=1, video_path=None):
    #frames is list of pil images, save it work_dir/cach/video_name and return video_path
    if video_path is None:
        video_path = os.path.join("work_dir", "cache_clips", f"video_{time.time()}.mp4")
    os.makedirs(os.path.dirname(video_path), exist_ok=True)

    # Use OpenCV to write the video
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    height, width = frames[0].shape[:2]
    video_writer = cv2.VideoWriter(video_path, fourcc, fps, (width, height))

    for frame in frames:
        # Convert PIL Image to NumPy array
        frame_np = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        video_writer.write(frame_np)

    video_writer.release()

    # video_b64 = load_video_as_base64(video_path)
    return video_path


def prepare_vllm_inputs_worker(video_path, tokenizer, instruction: str = "Represent the user's input.") -> Dict[str, Any]:
    """
    Worker function to be run in threads. 
    Handles the heavy lifting of video decoding and pixel processing.
    """
    # try:
    input_dict = {"video": video_path}
    conversation = format_input_to_conversation(input_dict, instruction, FPS, MAX_FRAMES)
    
    # Apply chat template
    prompt_text = tokenizer.apply_chat_template(conversation, tokenize=False, add_generation_prompt=True)
    
    # Process pixels (CPU intensive)
    images, video_inputs, video_kwargs = process_vision_info(
        [conversation],
        image_patch_size=16,
        return_video_metadata=True,
        return_video_kwargs=True,
    )  

    # print("processed vision info")
    multi_modal_data = {}
    if video_inputs:
        videos, video_metadata = zip(*video_inputs)
        multi_modal_data["video"] = [(v, m) for v, m in zip(list(videos), list(video_metadata))]
        print("len of videos:", len(videos))
        print("videos[0] shape:", videos[0].shape)

    # Explicitly free the conversation dict and PIL image references now that
    # process_vision_info has already converted them to tensors.
    # This prevents the PIL images (passed in as video_path list) from being
    # held alive by the conversation structure until the caller cleans up.
    for turn in conversation:
        content = turn.get("content", [])
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    item.clear()
            content.clear()
    conversation.clear()
    del conversation, input_dict, images, video_inputs

    result = {
        "prompt": prompt_text,
        "multi_modal_data": multi_modal_data if multi_modal_data else None,
        "mm_processor_kwargs": video_kwargs,
        "status": "success"
    }
    # Free local refs — caller holds the tensors via result["multi_modal_data"]
    del multi_modal_data
    gc.collect()
    return result
    # except Exception as e:
    #     return {"video_path": video_path, "status": "failed", "error": str(e)}


def process_videos_batch(video_paths, llm, batch_size: int = 8):

    embeddings = []
    tokenizer = llm.get_tokenizer()
    
    total_videos = len(video_paths)
    
    for batch_idx in range(0, total_videos, batch_size):
        batch_end = min(batch_idx + batch_size, total_videos)
        batch_video_paths = video_paths[batch_idx:batch_end]
        
        print(f"\n[Batch {batch_idx//batch_size + 1}] Preparing {len(batch_video_paths)} videos in parallel...")
        
        # Recreate ThreadPoolExecutor per batch so worker threads and their
        # memory (large pixel tensors from process_vision_info) are fully
        # released when the context manager exits before inference starts.
        t_prep_start = time.perf_counter()
        prep_results = []
        max_workers = min(4, len(batch_video_paths))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(prepare_vllm_inputs_worker, path, tokenizer) for path in batch_video_paths]
            for future in futures:
                prep_results.append(future.result())
        # All worker threads have exited here; their local frame/pixel data
        # can now be collected.
        del futures
        t_prep_end = time.perf_counter()

        batch_prompts = []
        for prep_res in prep_results:
            if prep_res["status"] == "success":
                input_data = {"prompt": prep_res["prompt"]}
                if prep_res["multi_modal_data"]:
                    input_data["multi_modal_data"] = prep_res["multi_modal_data"]
                if prep_res["mm_processor_kwargs"]:
                    input_data["mm_processor_kwargs"] = prep_res["mm_processor_kwargs"]
                batch_prompts.append(input_data)
            else:
                print(f"  ⚠ Failed preparation: {prep_res['error']}")

        # Release the raw prep_results (contains large pixel tensors) before inference
        del prep_results
        gc.collect()

        # GPU Inference
        if batch_prompts:
            t_inf_start = time.perf_counter()
            outputs = llm.embed(batch_prompts, use_tqdm=False)
            t_inf_end = time.perf_counter()

            inf_ms = (t_inf_end - t_inf_start) * 1000

            for i, output in enumerate(outputs):
                emb = output.outputs.embedding
                vllm_emb = torch.tensor(emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
                vllm_emb = F.normalize(vllm_emb, p=2, dim=-1)
                embeddings.append(vllm_emb)

            print(f"  ✓ Prep: {(t_prep_end - t_prep_start):.2f}s | Inference: {inf_ms:.2f}ms")

            # Explicitly drop outputs so vLLM's internal result objects are freed
            del outputs

            try:
                flush_vllm_caches()
            except Exception:
                pass

        # --- CRITICAL: Memory Management ---
        # Drop batch_prompts which hold large multi_modal_data pixel tensors
        for prompt in batch_prompts:
            mm = prompt.get("multi_modal_data")
            if mm:
                # Each entry may be (tensor, metadata) tuples; clear them
                for key in list(mm.keys()):
                    del mm[key]
                mm.clear()
        del batch_prompts

        # Explicitly close PIL images in the input frame lists to release
        # their internal memory buffers (Pillow holds uncompressed pixel data).
        for frame_list in batch_video_paths:
            if isinstance(frame_list, list):
                for img in frame_list:
                    if hasattr(img, 'close'):
                        img.close()
                frame_list.clear()

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        gc.collect()
        # -----------------------------------

    return torch.cat(embeddings, dim=0)

def get_video_embedding(
    video_frames_list = None,
    num_frames: int = 8,
    instruction: str = "Understand the content of the provided video."
) -> Optional[torch.Tensor]:

    model, processor, device = get_embedding_model()

    #print("len of input: ", len(video_frames_list))
    
    try:
        with vllm_inference_lock:
            print("lock acquired")
            embeddings = process_videos_batch(video_frames_list, model, len(video_frames_list))
            # time.sleep(10)
        #print("len of embeddings: ", len(embeddings))
        print("lock released")

        return embeddings
    
    except Exception as e:
        print(f"Error generating video embedding: {e}")
        import traceback
        traceback.print_exc()
        return None


def flush_vllm_caches():
    """
    Flush vLLM's internal multimodal pixel-tensor cache and KV/prefix cache.
    Call this once after all batches for a single video are done so that
    per-batch caching (for speed) is preserved but memory is freed per-video.
    Also calls malloc_trim to return freed heap pages back to the OS on Linux,
    which is necessary because Python's allocator holds onto pages by default.
    """
    model, _, _ = get_embedding_model()
    if model is None:
        return
    try:
        model.reset_mm_cache()
        model.reset_prefix_cache()
        # print("vLLM MM and prefix caches flushed.")

    except Exception as e:
        print(f"Warning: could not reset vLLM caches: {e}")

    gc.collect()
    gc.collect()

    # Force the glibc allocator to return freed memory to the OS.
    # Without this, RSS stays high even after Python objects are freed,
    # because glibc holds onto the heap for reuse.
    try:
        import ctypes
        ctypes.CDLL("libc.so.6").malloc_trim(0)
        print("malloc_trim called: freed heap pages returned to OS.")
    except Exception as e:
        print(f"Warning: malloc_trim failed: {e}")

def get_text_embedding(
    text_query: str,
    instruction: str = "Represent the user's input."
) -> Optional[torch.Tensor]:
    model, processor, device = get_embedding_model()
    try:
        with vllm_inference_lock:
            print("lock acquired for text embedding")
            vllm_inputs = [prepare_vllm_inputs({"text": text_query}, model, instruction=instruction)]
            llm_input = [{"prompt": inp["prompt"]} for inp in vllm_inputs]
            outputs = model.embed(
                llm_input,
                use_tqdm=False,
            )
            #print("len of outputs: ", len(outputs))
            raw_emb = outputs[0].outputs.embedding
            #print("len of raw_emb: ", len(raw_emb))
            #print("type of raw_emb[0]: ", type(raw_emb[0]))
            vllm_emb_last = torch.tensor(raw_emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
            # normalize vllm_emb_last
            vllm_emb_last = F.normalize(vllm_emb_last, p=2, dim=-1)
            del outputs
        print("lock released for text embedding")
        return vllm_emb_last
        
    except:
        print("Error generating text embedding")
        return None


def get_text_embedding_batch(
    text_batch: List[str],
    instruction: str = "Represent the user's input.",
    batch_size: int = 4
) -> Optional[torch.Tensor]:    
    
    model, processor, device = get_embedding_model()
    embeddings = []    
    total_texts = len(text_batch)

    for batch_idx in range(0, total_texts, batch_size):
        with vllm_inference_lock:
            print("acquired lock for text embedding batch")
            batch_end = min(batch_idx + batch_size, total_texts)
            batch_texts = text_batch[batch_idx:batch_end]

            # Recreate executor per batch so threads and their memory are released
            # before GPU inference runs.
            prep_results = []
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(prepare_vllm_inputs, {"text": text_query}, model, instruction=instruction) for text_query in batch_texts]
                for future in futures:
                    prep_results.append(future.result())
            del futures
            gc.collect()


            batch_prompts = []
            for prep_res in prep_results:
                if prep_res:
                    input_data = {"prompt": prep_res["prompt"]}
                    # if prep_res["multi_modal_data"]:
                    #     input_data["multi_modal_data"] = prep_res["multi_modal_data"]
                    # if prep_res["mm_processor_kwargs"]:
                    #     input_data["mm_processor_kwargs"] = prep_res["mm_processor_kwargs"]
                    batch_prompts.append(input_data)

            del prep_results
            gc.collect()

            # GPU Inference
            if batch_prompts:
                outputs = model.embed(batch_prompts, use_tqdm=False)
                for i, output in enumerate(outputs):
                    emb = output.outputs.embedding
                    vllm_emb = torch.tensor(emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
                    # normalize vllm_emb
                    # vllm_emb = F.normalize(vllm_emb, p=2, dim=-1)
                    embeddings.append(vllm_emb)
                del outputs

            for prompt in batch_prompts:
                mm = prompt.get("multi_modal_data")
                if mm:
                    for key in list(mm.keys()):
                        del mm[key]
                    mm.clear()
            del batch_prompts

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
        print("lock released for text embedding batch")

    return torch.cat(embeddings, dim=0)


def get_image_embedding(
    image: Union[str, Image.Image],
    img_path: str,
    text: str = "",
    instruction: str = "Represent the given input."
) -> Optional[torch.Tensor]:
    """
    Generate embedding for a single image using Qwen3VLEmbedder
    
    Args:
        image: PIL Image or path to image file
        text: Optional text to accompany the image
        instruction: Instruction text to guide embedding generation
    
    Returns:
        Image embedding tensor or None on error
    """
    model, proc, dev = get_embedding_model()
    if model is None:
        print("Error: Model is not loaded")
        return None
    
    try:
        with vllm_inference_lock:
            # Prepare input for image
            vllm_inputs = [prepare_vllm_inputs({"image": img_path, "text": text}, model, instruction=instruction)]

            # Convert to TextPrompt format for vLLM
            # vllm expects prompts to be strings or TextPrompt dictionaries
            text_prompts = []
            for inp in vllm_inputs:
                text_prompt = {
                    "prompt": inp["prompt"],
                }
                
                # Only add multi_modal_data if present
                if inp.get("multi_modal_data"):
                    text_prompt["multi_modal_data"] = inp["multi_modal_data"]
                
                # Only add mm_processor_kwargs if present
                if inp.get("video_kwargs"):
                    text_prompt["mm_processor_kwargs"] = inp["video_kwargs"]
                
                text_prompts.append(text_prompt)

            # Call embed with TextPrompt format
            outputs = model.embed(
                text_prompts,
                use_tqdm=False,
            )
            embedding = outputs[0].outputs.embedding      
            vllm_emb_last = torch.tensor(embedding, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
            # normalize vllm_emb_last
            vllm_emb_last = F.normalize(vllm_emb_last, p=2, dim=-1)
            del outputs
            
            # Clear the pixel tensors from the prepared prompt
            for tp in text_prompts:
                mm = tp.get("multi_modal_data")
                if mm:
                    for key in list(mm.keys()):
                        del mm[key]
                    mm.clear()
            del text_prompts
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
        return vllm_emb_last.cpu()
    
    except Exception as e:
        print(f"Error generating image embedding: {e}")
        import traceback
        traceback.print_exc()
        return None
from transformers import AutoProcessor, AutoModel, BitsAndBytesConfig

reranking_model = None
reranking_processor = None

def get_reranker_model():
    global reranking_model, reranking_processor
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if reranking_model is None or reranking_processor is None:
            # model = AutoModel.from_pretrained("google/siglip2-base-patch32-256", quantization_config=bnb_config, device_map="auto", attn_implementation="flash_attention_2")
            # processor = AutoProcessor.from_pretrained("google/siglip2-base-patch32-256")
            reranking_model = AutoModel.from_pretrained("google/siglip2-so400m-patch14-384", device_map="auto", attn_implementation="flash_attention_2")
            reranking_processor = AutoProcessor.from_pretrained("google/siglip2-so400m-patch14-384")

        return reranking_model, reranking_processor, device
    except Exception as e:
        print(f"Error loading reranker model: {e}")
        return None, None, None


def rerank_videos_by_text(
        query: str,
        images_list: List[Image.Image],
        n_images: int = 4
    ):
    t1 = time.time()
    model, processor, device = get_reranker_model()
    if model is None or processor is None:
        print("Error: Reranker model is not loaded")
        return None
    try:
        inputs = processor(text=[query], images=images_list, padding="max_length", return_tensors="pt").to(device)

        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            text_features = model.get_text_features(**inputs)

        # normalized features
        image_embeds = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
        video_features = image_embeds.view(-1, n_images, image_embeds.size(-1)).mean(dim=1)
        text_embeds = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
        # cosine similarity as logits
        logits_per_text = torch.matmul(text_embeds, video_features.t().to(text_embeds.device))
        logit_bias, logit_scale = model.logit_bias, model.logit_scale
        # print(logit_scale, logit_bias)
        logit_scale, logit_bias = logit_scale.to(text_embeds.device), logit_bias.to(text_embeds.device)
        logits_per_text = logits_per_text * logit_scale.exp() + logit_bias

        probs = torch.softmax(logits_per_text, dim=-1)
        print(f"Probabilities: {probs}")
        t2 = time.time()
        print("Time taken for reranking:", t2 - t1)
        return probs[0].cpu().tolist()
    except Exception as e:
        print(f"Error during reranking: {e}")
        import traceback
        traceback.print_exc()
        return None



if __name__ == '__main__':
    # Example: Video retrieval
    #test video_embedding

    #create 8*8 frames

    frames = np.random.randint(0, 255, (8, 224, 224, 3), dtype=np.uint8)
    pil_frames = [Image.fromarray(frame) for frame in frames] * 4
    video_embedding = get_video_embedding(video_frames=pil_frames, num_frames=8)
    print("Video embedding shape:", video_embedding.shape)