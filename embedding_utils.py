import time
import cv2
import numpy as np
import torch
from PIL import Image
from typing import List, Optional, Union
import io

from transformers import AutoProcessor
import torchaudio
from PIL import Image
from transformers import AutoProcessor, AutoModel

from src.models.embedding import Qwen3VLEmbedder
from vllm_infer import *
import numpy as np
import torch
import torch.nn.functional as F
from concurrent.futures import ThreadPoolExecutor 
from vllm import LLM, SamplingParams
import gc

# Global model instances (singleton pattern)
qwen3vl_model = None
device = None
NUM_FRAMES = 8

def get_embedding_model(model_path="checkpoints/embedding_model/snapshots/a12d6118f720ceb6d95f7d1cad4e8aeccddd9340"):
    """
    Get the Model as a singleton
    
    Args:
        model_path: Path to the Qwen3-VL-Embedding model
    
    Returns:
        Tuple of (model, device)
    """
    global qwen3vl_model, device
    
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
                # distributed_executor_backend="mp",
                gpu_memory_utilization=0.75,
                # limit_mm_per_prompt={"video": 1},
                max_num_seqs=4//2,
                max_num_batched_tokens=4096+(4096//2),
            )
        except Exception as e:
            print(f"Error loading Model")
            qwen3vl_model = None
            device = None

    return qwen3vl_model, device


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


def prepare_vllm_inputs_worker(video_path, tokenizer, instruction: str = "Represent the user's input.") -> Dict[str, Any]:
    """
    Worker function to be run in threads. 
    Handles the heavy lifting of video decoding and pixel processing.
    """
    try:
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
        print("processed vision info")
        multi_modal_data = {}
        if video_inputs:
            videos, video_metadata = zip(*video_inputs)
            multi_modal_data["video"] = [(v, m) for v, m in zip(list(videos), list(video_metadata))]
            print("len of videos:", len(videos))
            print("videos[0] shape:", videos[0].shape)

        return {
            "prompt": prompt_text,
            "multi_modal_data": multi_modal_data if multi_modal_data else None,
            "mm_processor_kwargs": video_kwargs,
            "status": "success"
        }
    except Exception as e:
        return {"status": "failed"}


def process_videos_batch(video_frames_list, llm, batch_size: int = 8):

    embeddings = []
    tokenizer = llm.get_tokenizer()

    total_videos = len(video_frames_list)
    
    # We use a ThreadPool to fetch and process videos in parallel
    # max_workers=4 is usually plenty for IO/Decoding without overwhelming RAM
    with ThreadPoolExecutor(max_workers=4) as executor:
        for batch_idx in range(0, total_videos, batch_size):
            batch_end = min(batch_idx + batch_size, total_videos)
            batch_video_frames = video_frames_list[batch_idx:batch_end]
            # Parallel preparation
            t_prep_start = time.perf_counter()
            # map passes the video paths to the worker function
            futures = [executor.submit(prepare_vllm_inputs_worker, frames, tokenizer) for frames in batch_video_frames]

            batch_prompts = []
            
            for future in futures:
                prep_res = future.result()
                if prep_res["status"] == "success":
                    input_data = {"prompt": prep_res["prompt"]}
                    if prep_res["multi_modal_data"]:
                        input_data["multi_modal_data"] = prep_res["multi_modal_data"]
                    if prep_res["mm_processor_kwargs"]:
                        input_data["mm_processor_kwargs"] = prep_res["mm_processor_kwargs"]
                    
                    batch_prompts.append(input_data)

            # GPU Inference
            if batch_prompts:
                outputs = llm.embed(batch_prompts, use_tqdm=False)                
                for i, output in enumerate(outputs):
                    # v_name = os.path.basename(valid_metadata[i])
                    emb = output.outputs.embedding
                    vllm_emb = torch.tensor(emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
                    # normalize vllm_emb
                    # vllm_emb = F.normalize(vllm_emb, p=2, dim=-1)
                    embeddings.append(vllm_emb)

            del batch_prompts
            del futures
            gc.collect()

    return torch.cat(embeddings, dim=0)

def get_video_embedding(
    video_frames_list = None,
    num_frames: int = 8,
    instruction: str = "Understand the content of the provided video."
) -> Optional[torch.Tensor]:

    model, device = get_embedding_model()
    print("len of input: ", len(video_frames_list))
    try:
        embeddings = process_videos_batch(video_frames_list, model, len(video_frames_list))
        print("len of embeddings: ", len(embeddings))
        return embeddings

    except Exception as e:
        print(f"Error generating video embedding")
        # import traceback
        # traceback.print_exc()
        return None

def get_text_embedding(
    text_query: str,
    instruction: str = "Represent the user's input."
) -> Optional[torch.Tensor]:
    model, device = get_embedding_model()
    try:
        vllm_inputs = [prepare_vllm_inputs({"text": text_query}, model, instruction=instruction)]
        llm_input = [{"prompt": inp["prompt"]} for inp in vllm_inputs]
        outputs = model.embed(
            llm_input,
            use_tqdm=False,
        )
        raw_emb = outputs[0].outputs.embedding         
        vllm_emb_last = torch.tensor(raw_emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
        # normalize vllm_emb_last
        # vllm_emb_last = F.normalize(vllm_emb_last, p=2, dim=-1)
        return vllm_emb_last
        
    except:
        print("Error generating text embedding")
        return None

def get_text_embedding_batch(
    text_batch: List[str],
    instruction: str = "Represent the user's input.",
    batch_size: int = 4
) -> Optional[torch.Tensor]:    
    
    model, device = get_embedding_model()
    embeddings = []    
    total_texts = len(text_batch)
    # We use a ThreadPool to fetch and process videos in parallel
    # max_workers=4 is usually plenty for IO/Decoding without overwhelming RAM
    with ThreadPoolExecutor(max_workers=4) as executor:
        for batch_idx in range(0, total_texts, batch_size):
            batch_end = min(batch_idx + batch_size, total_texts)
            batch_texts = text_batch[batch_idx:batch_end]
            # Parallel preparation
            # map passes the video paths to the worker function
            futures = [executor.submit(prepare_vllm_inputs, {"text": text_query}, model, instruction=instruction) for text_query in batch_texts]

            batch_prompts = []
            
            for future in futures:
                prep_res = future.result()
                if prep_res:
                    input_data = {"prompt": prep_res["prompt"]}
                    if prep_res.get("multi_modal_data"):
                        input_data["multi_modal_data"] = prep_res["multi_modal_data"]
                    if prep_res.get("mm_processor_kwargs"):
                        input_data["mm_processor_kwargs"] = prep_res["mm_processor_kwargs"]
                    
                    batch_prompts.append(input_data)

            # GPU Inference
            if batch_prompts:
                outputs = model.embed(batch_prompts, use_tqdm=False)                
                for i, output in enumerate(outputs):
                    # v_name = os.path.basename(valid_metadata[i])
                    emb = output.outputs.embedding
                    vllm_emb = torch.tensor(emb, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
                    # normalize vllm_emb
                    # vllm_emb = F.normalize(vllm_emb, p=2, dim=-1)
                    embeddings.append(vllm_emb)

            del batch_prompts
            del futures
            gc.collect()

    return torch.cat(embeddings, dim=0)

def get_image_embedding(
    img_path: str,
    text: str = "",
    instruction: str = "Represent the given input."
) -> Optional[torch.Tensor]:
    model, dev = get_embedding_model()
    if model is None:
        print("Error: Model is not loaded")
        return None
    
    try:
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
        # print("len of raw_emb: ", len(raw_emb))
        # print("type of raw_emb[0]: ", type(raw_emb[0]))
        vllm_emb_last = torch.tensor(embedding, dtype=torch.float32).unsqueeze(0).cpu()   # (1, D)
        # normalize vllm_emb_last
        # vllm_emb_last = F.normalize(vllm_emb_last, p=2, dim=-1)
        
        return vllm_emb_last.cpu()
    
    except Exception as e:
        print(f"Error generating image embedding")
        # import traceback
        # traceback.print_exc()
        return None

from transformers import AutoProcessor, AutoModel
# model = AutoModel.from_pretrained("google/siglip2-large-patch16-512", cache_dir = "checkpoints/google/siglip2-large-patch16-512" )
reranking_model = None
reranking_processor = None

def get_reranker_model():
    global reranking_model, reranking_processor
    device = "cuda" if torch.cuda.is_available() else "cpu"
    try:
        if reranking_model is None or reranking_processor is None:
            # bnb_config = BitsAndBytesConfig(load_in_4bit=True)
            # model = AutoModel.from_pretrained("google/siglip2-base-patch32-256", quantization_config=bnb_config, device_map="auto", attn_implementation="flash_attention_2")
            # processor = AutoProcessor.from_pretrained("google/siglip2-base-patch32-256")
            reranking_model = AutoModel.from_pretrained("google/siglip2-so400m-patch14-384", device_map="auto", attn_implementation="flash_attention_2", cache_dir = "checkpoints")
            reranking_processor = AutoProcessor.from_pretrained("google/siglip2-so400m-patch14-384")

        return reranking_model, reranking_processor, device
    except Exception as e:
        print(f"Error loading reranker model")
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
        # print(f"Probabilities: {probs}")
        t2 = time.time()
        # print("Time taken for reranking:", t2 - t1)
        return probs[0].cpu().tolist()
    except Exception as e:
        print(f"Error during reranking")
        # import traceback
        # traceback.print_exc()
        return None



if __name__ == '__main__':
    # Example: Video retrieval
    #test video_embedding

    #create 8*8 frames

    frames = np.random.randint(0, 255, (8, 224, 224, 3), dtype=np.uint8)
    pil_frames = [Image.fromarray(frame) for frame in frames] * 4
    video_embedding = get_video_embedding(video_frames=pil_frames, num_frames=8)
    print("Video embedding shape:", video_embedding.shape)
