from utils.base import *
from utils.licence import check_licence_validation
# from languagebind_utils import get_languagebind_image_model, get_image_embedding, get_audio_embedding, get_languagebind_audio_model, get_text_embedding, get_languagebind_model
from embedding_utils import get_embedding_model, get_image_embedding, get_text_embedding, get_text_embedding_batch
from config import get_config
import io

import copy
from embedding_utils import rerank_videos_by_text

# Get the global configuration instance
config = get_config()


def get_faiss_data(dbName, index_type): 
    db_manager = get_db_manager()
    index_files = get_index_files(dbName) 
    file_path = index_files[index_type]
    try:
        if os.path.exists(file_path):
            # Load FAISS index
            index = faiss.read_index(file_path)
            # Get metadata from PostgreSQL
            metadata = db_manager.get_metadata_by_database_dict(dbName,index_type)
            return [{'index': index, 'metadata': metadata}, os.path.basename(file_path)]
        else:
            print(f"FAISS index file not found: {file_path}")
            return [{'index': None, 'metadata': None}, None]
    except Exception as e:
        print(f"Error loading FAISS data from {file_path}: {e}")
        return [{'index': None, 'metadata': None}, None]


prevQuery = None
# config.prevResults = None
prevDbName = None
prevSourceIds = None
prevIndexType = None


def fetch_images_from_results(results, num_frames=8):
    images = []
    for result in results:
        metadata = result.get('metadata', {})
        video_path_relative = metadata.get('video_path_relative', '')
        video_path = os.path.join(config.WORKING_DIR, video_path_relative)
        start_frame = metadata.get('start_frame', 0)
        end_frame = metadata.get('end_frame', 0)
        #choose 8 frames between start and end frame
        frame_numbers = list(range(start_frame, end_frame+1))
        if len(frame_numbers) > num_frames:
            step = len(frame_numbers) // num_frames
            frame_numbers = frame_numbers[::step][:num_frames]
        else:
            frame_numbers = frame_numbers[:num_frames]
        # print(f"Extracting frames {frame_numbers} from video: {video_path}")
        if os.path.exists(video_path):
            try:
                vidcap = cv2.VideoCapture(video_path)
                for frame_num in frame_numbers:
                    vidcap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
                    success, image = vidcap.read()
                    if success:
                        image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
                    images.append(image)
                vidcap.release()
            except Exception as e:
                print(f"Error fetching image from {video_path}: {e}")
                images.append(None)
        else:
            print(f"Video file not found for image extraction: {video_path}")
            images.append(None)
    return images


def get_indices_distances(index, query_embedding_np, k, sourceIds, db_manager, db_name, index_type):
    if sourceIds is not None:
        try:
            faiss_ids_dict = db_manager.get_faiss_ids_by_source_ids_and_type(sourceIds, index_type, db_name)
            faiss_ids_exist = False
            for sid, fids in faiss_ids_dict.items():
                if fids:
                    faiss_ids_exist = True
                    break
            if faiss_ids_exist:
                #create empty faiss_ids_array 
                faiss_ids_array = []
                d = index.d 
                ids_array = faiss.vector_to_array(index.id_map)
                temp_index = faiss.IndexFlatIP(d) # Use L2 for Euclidean distance, IndexFlatIP for dot product/cosine
                for source_id in sourceIds:
                    curr_faiss_ids = faiss_ids_dict.get(source_id, [])
                    for fid in curr_faiss_ids:
                        internal_fid = np.where(ids_array == fid)[0]
                        if len(internal_fid) == 0:
                            continue
                        internal_fid = internal_fid[0]
                        vector = index.index.reconstruct(int(internal_fid)).reshape(1, -1)
                        temp_index.add(vector)
                        faiss_ids_array.append(fid)
                faiss_ids_array = np.array(faiss_ids_array, dtype='int64')
                distances, local_indices = temp_index.search(query_embedding_np, k)
                indices = [faiss_ids_array[local_indices[0]]]
            else:
                #if no faiss ids found for the sourceIds, return empty results instead of searching entire index
                distances = np.array([[]], dtype='float32')
                indices = np.array([[]], dtype='int64')
        except Exception as e:
            distances, indices = index.search(query_embedding_np, k)
    else:
        distances, indices = index.search(query_embedding_np, k)
    
    return indices, distances

def search_api(query, threshold, startIndex, limit, rerank, dbName, sourceIds=None, index_type='video'):
    """
    Search across embeddings with support for different index types (video/audio/text)
    Args:
        index_type: One of 'video', 'audio', or 'text' to determine which index to search
    """
    global prevQuery, prevDbName, prevSourceIds, prevIndexType
    start_time = time.time()
    n_images = 4
    if startIndex < 1:
        startIndex = 1
    if limit <= 0:
        limit = 20
    startIndex -= 1  # Convert to 0-based index
    
    if not os.listdir(os.path.join(config.WORKING_DIR, "database")) or not os.path.exists(os.path.join(config.WORKING_DIR, "database")):
        config.prevResults = None

    if sourceIds and isinstance(sourceIds, list):
        sourceIds = [str(sid) for sid in sourceIds]  # Ensure all are strings
    elif sourceIds is None or sourceIds == []:
        sourceIds = None  # Keep current logic
    
    if prevQuery != query:
        prevQuery = query
    elif config.prevResults is not None and prevQuery == query and (startIndex+limit) <= len(config.prevResults) and prevDbName == dbName and prevSourceIds == sourceIds and prevIndexType == index_type:
        results = config.prevResults

        # Apply sourceIds filtering to cached results if needed
        if sourceIds is not None:
            results = [result for result in results if result['metadata'].get('source_id') in sourceIds]

        results.sort(key=lambda x: x['score'], reverse=True)
        
        startIndex = max(0, startIndex)
        endIndex = min(startIndex + limit, len(results))
        results = results[startIndex:endIndex]
        for result in results:
            metadata = result['metadata']
            metadata["result_number"] = startIndex + results.index(result) + 1
            result = {
                "score": result['score'],
                "metadata": metadata
            }
        
        if rerank:
            images = fetch_images_from_results(results[:10], n_images)
            probs = rerank_videos_by_text(query, images, n_images)
            # print("Rerank probs:", probs)
            # probs is a list of relevance scores corresponding to each result, rearrage top 10 results based on probs
            top_results = results[:len(probs)]
            top_results_with_probs = []
            for i in range(len(top_results)):
                top_results_with_probs.append((top_results[i], probs[i]))
            # sort based on probs
            top_results_with_probs.sort(key=lambda x: x[1], reverse=True)
            # print("Top results after reranking:", top_results_with_probs)
            # rearrange results
            for i in range(len(top_results)):
                results[i] = top_results_with_probs[i][0]
                
        search_time = time.time() - start_time


        return {
            'query': query,
            'results': results,
            'total_results': len(results),
            'search_time': search_time
        }, 200
    
    if not check_licence_validation():
        return {'error': 'License expired or invalid'}, 403
    
    if not query:
        config.prevResults = None
        return {'error': 'Query cannot be empty'}, 400
    
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    db_manager = get_db_manager()
    all_db_names = db_manager.get_all_databases()
    if not all_db_names:
        return {'error': 'No databases found. Please index videos first.'}, 404
    
    query_embedding = get_text_embedding(query)
    if query_embedding is None:
        return {'error': 'Failed to generate query embedding'}, 500

    query_embedding_np = query_embedding.to(torch.float32).cpu().numpy()
    faiss.normalize_L2(query_embedding_np)

    results = []
    existing_scenes = []
    if index_type == 'video':
        db_names = all_db_names if dbName == "*" else [dbName]
        for db_name in db_names:
            data, dbFileName = get_faiss_data(db_name, index_type)
            # print(f"Searching in database: {db_name}, index file: {dbFileName}")
            index = data.get('index')
            metadata = data.get('metadata', {})
            # print(f"Index has {index.ntotal} entries and metadata has {len(metadata)} items")
            if index is None or not metadata:
                continue
            try:
                k = min(startIndex+limit, len(metadata)) + 100
                indices, distances = get_indices_distances(index, query_embedding_np, k, sourceIds, db_manager, db_name, index_type)
                for i, (idx, score) in enumerate(zip(indices[0], distances[0])):
                    # print(idx, score)
                    if idx < 0 :
                        continue  
                    if score > threshold:  
                        metadata_item = None
                        try:
                            metadata_item = metadata[idx]
                        except KeyError:
                            continue
                        if sourceIds is not None:
                            if metadata_item.get('source_id') not in sourceIds:
                                continue  # Skip this result if source_id not in allowed list

                        if metadata_item.get('embedding_filename', "") not in existing_scenes:
                            results.append({
                                "score": float(score),  
                                "metadata": metadata_item
                            })
                            existing_scenes.append(metadata_item['embedding_filename'])
            except Exception as e:
                print(f'Error searching with FAISS: {str(e)}')
    elif index_type == 'text':
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        db_names = all_db_names if dbName == "*" else [dbName]
        for db_name in db_names:
            data, dbFileName = get_faiss_data(db_name, index_type)
            # print(f"Searching in database: {db_name}, index file: {dbFileName}")
            index = data.get('index')
            metadata = data.get('metadata', {})
            # print(f"Index has {index.ntotal} entries and metadata has {len(metadata)} items")
            if index is None or not metadata:
                continue
                
            try:
                k = min(startIndex+limit, len(metadata)) + 100
                indices, distances = get_indices_distances(index, query_embedding_np, k, sourceIds, db_manager, db_name, index_type)
                for i, (idx, score) in enumerate(zip(indices[0], distances[0])):
                    if idx < 0 :
                        continue  
                    if score > threshold:  
                        metadata_item = None
                        try:
                            metadata_item = metadata[idx]
                        except KeyError:
                            continue
                        
                        if metadata_item is None:
                            metadata_item = metadata[idx].copy()

                        # Filter by sourceIds if provided
                        if sourceIds is not None:
                            if metadata_item.get('source_id') not in sourceIds:
                                continue  # Skip this result if source_id not in allowed list
                        if metadata_item.get('embedding_filename', "") not in existing_scenes:
                            results.append({
                                "score": float(score),  
                                "metadata": metadata_item
                            })
                            existing_scenes.append(metadata_item['embedding_filename'])
            except Exception as e:
                print(f'Error searching with FAISS: {str(e)}')

    config.prevResults = copy.deepcopy(results)
    prevDbName = dbName
    prevSourceIds = sourceIds
    prevIndexType = index_type

    results.sort(key=lambda x: x['score'], reverse=True)
    
    startIndex = max(0, startIndex)
    endIndex = min(startIndex + limit, len(results))
    results = results[startIndex:endIndex]
    for result in results:
        metadata = result['metadata']
        metadata["result_number"] = startIndex + results.index(result) + 1
        result = {
            "score": result['score'],
            "metadata": metadata
        }
    if rerank:
        images = fetch_images_from_results(results[:10], n_images)
        probs = rerank_videos_by_text(query, images, n_images)
        # print("Rerank probs:", probs)
        # probs is a list of relevance scores corresponding to each result, rearrage top 10 results based on probs
        top_results = results[:len(probs)]
        top_results_with_probs = []
        for i in range(len(top_results)):
            top_results_with_probs.append((top_results[i], probs[i]))
        # sort based on probs
        top_results_with_probs.sort(key=lambda x: x[1], reverse=True)
        # print("Top results after reranking:", top_results_with_probs)
        # rearrange results
        for i in range(len(top_results)):
            results[i] = top_results_with_probs[i][0]
    
    search_time = time.time() - start_time
    # print(results)
    return {
        'query': query,
        'results': results,
        'total_results': len(results),
        'search_time': search_time
    }, 200


prevImageQuery = None
# config.prevImageResults = None
prevImageDbName = None
prevImageSourceIds = None

prevAudioQuery = None
# config.prevAudioResults = None
prevAudioDbName = None
prevAudioSourceIds = None

def imagesearch_api(image_path,text, threshold, startIndex, limit, dbName, sourceIds=None):
    global prevImageQuery, prevImageDbName, prevImageSourceIds
    image_path = os.path.join(config.WORKING_DIR, image_path)
    start_time = time.time()
    filename = image_path.split("/")[-1]
    if startIndex < 1:
        startIndex = 1
    if limit <= 0:
        limit = 20
    startIndex -= 1  # Convert to 0-based index
    # if dbName != "*" and (not dbName.endswith(".pkl")):
    #     dbName = dbName + ".pkl"

    # Handle sourceIds filtering
    if sourceIds and isinstance(sourceIds, list):
        sourceIds = [str(sid) for sid in sourceIds]  # Ensure all are strings
    elif sourceIds is None or sourceIds == []:
        sourceIds = None  # Keep current logic

    if prevImageQuery != image_path:
        prevImageQuery = image_path
    elif prevImageQuery == image_path and config.prevImageResults is not None and (startIndex+limit) <= len(config.prevImageResults) and prevImageDbName == dbName and prevImageSourceIds == sourceIds:
        # print("Using cached results for query:", image_path)
        results = config.prevImageResults

        # Apply sourceIds filtering to cached results if needed
        if sourceIds is not None:
            results = [result for result in results if result['metadata'].get('source_id') in sourceIds]

        results.sort(key=lambda x: x['score'], reverse=True)
        startIndex = max(0, startIndex)
        endIndex = min(startIndex + limit, len(results))
        # print("Start Index:", startIndex, "End Index:", endIndex, "Total Results:", len(results), "limit:", limit)
        results = results[startIndex:endIndex]
        for result in results:
            metadata = result['metadata']
            metadata["result_number"] = startIndex + results.index(result) + 1
            result = {
                "score": result['score'],
                "metadata": metadata
            }
        search_time = time.time() - start_time
        return {
            'query': filename,
            'results': results,
            'total_results': len(results),
            'search_time': search_time
        }, 200
    with open(image_path, 'rb') as image_file:
        image_bytes = image_file.read()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # print("database name", dbName)
    if image_bytes:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img = img.convert("RGB")
            try:
                query_embedding = get_image_embedding(img,text)
                if query_embedding is None:
                    return {'error': 'Failed to generate query embedding'}, 500
            except Exception as e:
                return {'error': f'Error generating query embedding: {str(e)}'}, 500
            query_embedding_np = query_embedding.to(torch.float32).cpu().numpy()
            faiss.normalize_L2(query_embedding_np)
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            db_manager = get_db_manager()
            all_db_names = db_manager.get_all_databases()
            if not all_db_names:
                return {'error': 'No databases found. Please index videos first.'}, 404
            results = []
            existing_scenes = []
            db_names = all_db_names if dbName == "*" else [dbName]
            for db_name in db_names:
                data, dbFileName = get_faiss_data(db_name, "video")
                # print(f"Searching in database: {db_name}, index file: {dbFileName}")
                index = data.get('index')
                metadata = data.get('metadata', [])
                if index is None or not metadata:
                    continue
                k = min(startIndex+limit, len(metadata)) + 100
                indices, distances = get_indices_distances(index, query_embedding_np, k, sourceIds, db_manager, db_name, "video")
                res_no = 0
                for i, (idx, score) in enumerate(zip(indices[0], distances[0])):
                    # print(idx, score)
                    if idx < 0 or score <= threshold:
                        continue
                    metadata_item = None
                    try:
                        metadata_item = metadata[idx]
                    except KeyError:
                        continue
                    
                    if metadata_item is None:
                        metadata_item = metadata[idx].copy()
                    
                    # Filter by sourceIds if provided
                    if sourceIds is not None:
                        if metadata_item.get('source_id') not in sourceIds:
                            continue  # Skip this result if source_id not in allowed list
                    if float(metadata_item["duration_sec"]) < 2:
                        continue
                    res_no += 1
                    metadata_item['result_number'] = res_no
                    if metadata_item['embedding_filename'] not in existing_scenes:
                        results.append({
                            "score": float(score),
                            "metadata": metadata_item
                        })
                        existing_scenes.append(metadata_item['embedding_filename'])
            
            results.sort(key=lambda x: x['score'], reverse=True)
            config.prevImageResults = copy.deepcopy(results)
            prevImageDbName = dbName
            prevImageSourceIds = sourceIds
            startIndex = max(0, startIndex)
            endIndex = min(startIndex + limit, len(results))
            results = results[startIndex:endIndex]
            for result in results:
                metadata = result['metadata']
                metadata["result_number"] = startIndex + results.index(result) + 1
                result = {
                    "score": result['score'],
                    "metadata": metadata
                }
            search_time = time.time() - start_time
            return {
                'query': filename,
                'results': results,
                'total_results': len(results),
                'search_time': search_time
            }, 200
        except Exception as e:
            return {'error': f'Error in image search: {str(e)}'}, 500


def get_transcripts(sourceId, db_name=None):
    db_manager = get_db_manager()
    try:
        transcripts = db_manager.get_transcripts_by_source_id(sourceId, db_name)
        return transcripts, 200
    except Exception as e:
        return {'error': f'Error retrieving transcripts: {str(e)}'}, 500