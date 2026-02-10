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

from src.models.qwen3_vl_embedding import Qwen3VLEmbedder

# Global model instances (singleton pattern)
qwen3vl_model = None
device = None

def get_embedding_model(model_path="./checkpoints/models--Qwen--Qwen3-VL-Embedding-8B/snapshots/a12d6118f720ceb6d95f7d1cad4e8aeccddd9340"):
    """
    Get the Qwen3VLEmbedder model as a singleton
    
    Args:
        model_path: Path to the Qwen3-VL-Embedding model
    
    Returns:
        Tuple of (model, device)
    """
    global qwen3vl_model, device
    
    if qwen3vl_model is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        try:
            qwen3vl_model = Qwen3VLEmbedder(
                model_name_or_path=model_path,
                torch_dtype=torch.bfloat16,
                attn_implementation="flash_attention_2"
            )
            print(f"Qwen3VLEmbedder model loaded successfully on {device}")
        except Exception as e:
            print(f"Error loading Qwen3VLEmbedder model: {e}")
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


def get_video_embedding(
    video_frames_list = None,
    num_frames: int = 8,
    instruction: str = "Understand the content of the provided video."
) -> Optional[torch.Tensor]:
    """
    Generate embedding for a video using Qwen3VLEmbedder
    
    Args:
        video_frames_list: List of list of PIL Image frames
        num_frames: Number of frames (informational, frames should already be extracted)
        instruction: Instruction text to guide embedding generation
    
    Returns:
        Video embedding tensor or None on error
    """
    model, dev = get_embedding_model()
    if model is None:
        print("Error: Qwen3VLEmbedder model is not loaded")
        return None
    
    try:
        if video_frames_list is None:
            raise ValueError("video_frames_list must be provided")
        
        print(f"{len(video_frames_list)} frames received for embedding")

        inputs = []
        for frames in video_frames_list:
            inputs.append({
                "instruction": instruction,
                "video": frames
            })
        embedding = model.process(inputs)
        # all_embeddings = []
        # for video_frames in video_frames_list:
        #     inputs = [{
        #         "instruction": instruction,
        #         "video": video_frames  # Pass all frames as a list
        #     }]
        #     with torch.no_grad():
        #         embedding = model.process(inputs)
        #         all_embeddings.append(embedding.cpu())
        #         del embedding
        
        # embedding = torch.vstack(all_embeddings)

        torch.cuda.empty_cache()

        return embedding
    
    except Exception as e:
        print(f"Error generating video embedding: {e}")
        import traceback
        traceback.print_exc()
        return None

def get_text_embedding(
    text_query: str,
    instruction: str = "Find the video snippet that corresponds to the given caption: "
) -> Optional[torch.Tensor]:
    """
    Generate embedding for a text query using Qwen3VLEmbedder
    
    Args:
        text_query: Text string to embed
        instruction: Instruction text to guide embedding generation
    
    Returns:
        Text embedding tensor or None on error
    """
    model, dev = get_embedding_model()
    if model is None:
        print("Error: Qwen3VLEmbedder model is not loaded")
        return None
    
    try:
        # Prepare input for text
        inputs = [{
            "text": text_query,
            "instruction": instruction
        }]
        
        # Generate text embedding
        embedding = model.process(inputs)
        
        return embedding.cpu()[:,:4096]
    
    except Exception as e:
        print(f"Error generating text embedding: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_text_embedding_batch(
    text_batch: List[str],
    instruction: str = "Find the video snippet that corresponds to the given caption: ",
    batch_size: int = 32
) -> Optional[torch.Tensor]:
    """
    Generate embeddings for a batch of text queries using Qwen3VLEmbedder
    
    Args:
        text_batch: List of text strings to embed
        instruction: Instruction text to guide embedding generation
        batch_size: Batch size for processing (informational, handled internally)
    
    Returns:
        Batch of text embedding tensors or None on error
    """
    model, dev = get_embedding_model()
    if model is None:
        print("Error: Qwen3VLEmbedder model is not loaded")
        return None
    
    try:
        # Prepare inputs for batch of texts
        inputs = []
        for text in text_batch:
            inputs.append({
                "text": text,
                "instruction": instruction
            })
        
        # Generate text embeddings in batch
        embeddings = model.process(inputs)
        
        return embeddings.cpu()[:,:4096]
    
    except Exception as e:
        print(f"Error generating text embeddings: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_image_embedding(
    image: Union[str, Image.Image],
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
    model, dev = get_embedding_model()
    if model is None:
        print("Error: Qwen3VLEmbedder model is not loaded")
        return None
    
    try:
        # Prepare input for image
        if text:
            inputs = [{
                "image": image,
                "text": text,
                "instruction": instruction
            }]
        else:
            inputs = [{
                "image": image,
                "instruction": instruction
            }]
        
        # Generate image embedding
        embedding = model.process(inputs)
        
        return embedding.cpu()[:,:4096]
    
    except Exception as e:
        print(f"Error generating image embedding: {e}")
        import traceback
        traceback.print_exc()
        return None
from transformers import AutoProcessor, AutoModel, BitsAndBytesConfig


model = AutoModel.from_pretrained("google/siglip2-large-patch16-512", )
def get_reranker_model():
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        bnb_config = BitsAndBytesConfig(load_in_4bit=True)
        # model = AutoModel.from_pretrained("google/siglip2-base-patch32-256", quantization_config=bnb_config, device_map="auto", attn_implementation="flash_attention_2")
        # processor = AutoProcessor.from_pretrained("google/siglip2-base-patch32-256")
        model = AutoModel.from_pretrained("google/siglip2-so400m-patch14-384", device_map="auto", attn_implementation="flash_attention_2")
        processor = AutoProcessor.from_pretrained("google/siglip2-so400m-patch14-384")

        return model, processor, device
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
