from utils.base import *
from utils.licence import check_licence_validation
from config import get_config

# Get the global configuration instance
config = get_config()

def reconstruct_index(sourceId, database_name, index_type='both'):
    db_manager = get_db_manager()
    index_files = get_index_files(database_name)
    if index_type in ['video', 'both']:
        video_index = load_index(index_files['video'])
        if video_index is not None:
            # Get all faiss_ids for the source from metadata
            faiss_ids = db_manager.get_faiss_ids_by_source_id_and_type(sourceId, 'video', database_name)
            if faiss_ids:
                fake_vector = np.zeros((1, video_index.d), dtype='float32')
                faiss.normalize_L2(fake_vector)
                new_index = faiss.IndexIDMap(faiss.IndexFlatIP(video_index.d))
                for i in range(video_index.ntotal):
                    if i in faiss_ids:
                        new_index.add_with_ids(fake_vector, np.array([i], dtype='int64'))
                    else:
                        vector = video_index.index.reconstruct(i).reshape(1, -1)
                        new_index.add_with_ids(vector, np.array([i], dtype='int64'))

                if not save_index(index_files['video'], new_index):
                    print(f"Error saving updated video index after replacing vectors for source {sourceId}")
    if index_type in ['text', 'both']:
        text_index = load_index(index_files['text'])
        if text_index is not None:
            faiss_ids = db_manager.get_faiss_ids_by_source_id_and_type(sourceId, 'text', database_name)
            if faiss_ids:
                
                fake_vector = np.zeros((1, text_index.d), dtype='float32')
                faiss.normalize_L2(fake_vector)
                new_index = faiss.IndexIDMap(faiss.IndexFlatIP(text_index.d))

                for i in range(text_index.ntotal):
                    
                    if i in faiss_ids:
                        new_index.add_with_ids(fake_vector, np.array([i], dtype='int64'))
                    else:
                        vector = text_index.index.reconstruct(i).reshape(1, -1)
                        new_index.add_with_ids(vector, np.array([i], dtype='int64'))

                if not save_index(index_files['text'], new_index):
                    print(f"Error saving updated text index after replacing vectors for source {sourceId}")

def remove_video(sourceId, db_name, index_type='both'):
    """
    Remove a video and its associated metadata from the database and note that the FAISS index needs rebuilding.
    Args:
        sourceId: The unique identifier of the video to remove
        db_name: The database name to remove from
        index_type: The type of indices to update ('video', 'text', or 'both')
    """
    # if db_name and not db_name.endswith(".index"):
    #     db_name = db_name + ".index"
    
    if not check_licence_validation():
        return {'error': 'License expired or invalid'}, 403
    if not sourceId:
        return {'error': 'No sourceId provided'}, 400
    if config.indexing_status['in_progress']:
        return {'error': 'Cannot remove videos while indexing is in progress'}, 409

    db_manager = get_db_manager()
    
    # Get database name from filename and handle type-specific deletions
    database_name = db_name.replace('.index', '') if db_name else None
    removed_count = 0
    
    try:
        # set the vectors of the removed indices to fake vector that won't be returned in search results
        if db_name is None:
            dbs = db_manager.get_all_databases()
            for db in dbs:
                reconstruct_index(sourceId, db, index_type)
        else:
            reconstruct_index(sourceId, db_name, index_type)

        if index_type == 'both':
            # Remove all metadata for the source
            removed_count = db_manager.remove_metadata_by_source_id_and_type(sourceId, database_name)
        else:
            # Only remove metadata of specific type
            removed_count = db_manager.remove_metadata_by_source_id_and_type(sourceId, database_name, index_type)

        if removed_count == 0:
            return {'message': f'No clips found for video with Source ID {sourceId} of type {index_type}', 'removed': 0}, 200

        # Reset search results cache
        config.prevResults = None
        config.prevAudioResults = None
        config.prevImageResults = None

        return {
            'success': True,
            'message': f'Removed {sourceId} from {index_type} index',
            'removed_clips': removed_count,
            # 'note': f'FAISS {index_type} index may need rebuilding for optimal performance'
        }, 200
        
    except Exception as e:
        return {'error': f'Error removing video: {str(e)}'}, 500 
    