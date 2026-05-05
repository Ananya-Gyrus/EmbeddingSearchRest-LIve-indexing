import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import { getApiBase } from './apiBase';

const modernSearchStyles = `
  .search-wrapper {
    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Segmented Tabs */
  .modern-tabs-container {
    background-color: var(--input-bg);
    padding: 8px;
    border-radius: 50px;
    display: inline-flex;
    border: 1px solid var(--border-color);
    margin-bottom: 2rem;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }

  .modern-tab {
    padding: 10px 32px;
    border-radius: 50px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 700;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
  }

  .modern-tab:hover:not(.active) {
    color: var(--text-main);
  }

  .modern-tab.active {
    background-color: var(--card-bg);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  /* Search Inputs & Filters */
  .modern-search-box {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
  }

  .modern-input {
    background-color: var(--input-bg) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-main) !important;
    border-radius: 14px !important;
    padding: 0.85rem 1.25rem !important;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .modern-input:focus {
    background-color: var(--card-bg) !important;
    box-shadow: 0 0 0 3px var(--primary-light) !important;
    border-color: var(--primary) !important;
  }

  .modern-input::placeholder {
    color: var(--text-muted) !important;
    opacity: 0.7;
  }

  /* Dropzone */
  .modern-dropzone {
    border: 2px dashed var(--border-color);
    border-radius: 20px;
    background-color: var(--input-bg);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .modern-dropzone:hover, .modern-dropzone.drag-active {
    border-color: var(--primary);
    background-color: var(--primary-light);
  }

  .modern-dropzone.drag-active {
    transform: scale(1.02);
  }

  /* Results Grid & Cards */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .result-card-modern {
    background-color: var(--card-bg);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    position: relative;
  }

  .result-card-modern:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
  }

  .result-card-modern::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: var(--primary);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s ease;
    z-index: 2;
  }

  .result-card-modern:hover::before { transform: scaleX(1); }

  .thumb-wrapper-modern {
    position: relative;
    aspect-ratio: 16/9;
    background-color: #000;
    overflow: hidden;
  }

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    transition: transform 0.5s ease, opacity 0.3s ease;
  }

  .result-card-modern:hover .thumb-img {
    transform: scale(1.08);
    opacity: 0.6;
  }

  .play-overlay-modern {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    border-radius: 50%;
    width: 64px; height: 64px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 2.5rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .result-card-modern:hover .play-overlay-modern {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .timestamp-badge {
    position: absolute; bottom: 10px; right: 10px;
    background: rgba(0, 0, 0, 0.75); color: white;
    padding: 4px 10px; border-radius: 8px;
    font-size: 0.75rem; font-weight: 700;
    backdrop-filter: blur(4px); letter-spacing: 0.5px;
  }

  /* Badges */
  .badge-soft-modern {
    padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;
  }
  
  .badge-db { background-color: var(--primary-light); color: var(--primary); }
  .badge-source { background-color: var(--success-light); color: var(--success); }
  .badge-score { background-color: var(--warning-light); color: var(--warning); }

  /* Adaptive Buttons */
  .btn-adaptive {
    background-color: var(--card-bg);
    color: var(--text-main);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }
  
  .btn-adaptive:hover {
    background-color: var(--input-bg);
    border-color: var(--border-color);
    color: var(--primary);
  }

  /* Immersive Modal - Adaptive */
  .cinematic-modal .modal-content {
    background-color: var(--bg-main);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  
  .cinematic-header {
    background: var(--card-bg);
    border-bottom: 1px solid var(--border-color);
    padding: 1.5rem 2rem;
  }

  .modal-detail-badge {
    background-color: var(--input-bg);
    color: var(--text-main);
    border: 1px solid var(--border-color);
  }

  .stagger-fade-in { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .btn-gradient-primary {
    background-color: var(--primary);
    border: none; color: white; font-weight: 700; transition: all 0.3s ease;
  }
  .btn-gradient-primary:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 8px 20px var(--primary-light); color: white;
  }
`;

export default function SearchPage({ backendConfig, setShowSettings }) {
  const PAGE_LIMIT = 12;
  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const [activeSearchTab, setActiveSearchTab] = useState('text');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [dbList, setDbList] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [filters, setFilters] = useState({ query: '', dbName: '*', sourceId: '*', index_type: '' });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [selectedAudio, setSelectedAudio] = useState(null);

  const [videoModal, setVideoModal] = useState({ 
    open: false, 
    url: '', 
    title: '', 
    startTime: 0, 
    endTime: 0, 
    dbName: '', 
    meta: {} 
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const videoRef = useRef(null);
  const videoBlobUrlRef = useRef(null);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/list-indexed`);
      const data = await res.json();
      if (data.videos) {
        setDbList([...new Set(data.videos.map(v => v.dbName))]);
        setSourceList([...new Set(data.videos.map(v => v.sourceId))]);
      }
    } catch (e) {
      console.warn("Failed to load filters", e);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handleTextSearch = useCallback(async (isLoadMore = false) => {
    if (!filters.query.trim()) {
      Swal.fire({ text: 'Please enter a search query', icon: 'warning', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      return;
    }

    const startIdx = isLoadMore ? (page * PAGE_LIMIT) + 1 : 1;
    if (!isLoadMore) { setResults([]); setPage(1); }
    setLoading(true);

    try {
      const payload = {
        query: filters.query,
        startIndex: startIdx,
        limit: PAGE_LIMIT,
        dbName: filters.dbName === '*' ? undefined : filters.dbName,
        indexType: filters.index_type ? filters.index_type : undefined
      };
      console.log('Search payload:', payload);

      const res = await fetch(`${apiBase}/textsearch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Search request failed to execute.');
      const data = await res.json();
      const newResults = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

      setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
      if (isLoadMore) setPage(prev => prev + 1);

    } catch (e) {
      Swal.fire({ title: 'Search Failed', text: e.message, icon: 'error', buttonsStyling: false, customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4' } });
    } finally {
      setLoading(false);
    }
  }, [apiBase, filters, page, PAGE_LIMIT]);

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('files[]', file, file.name);
    const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to upload reference media');
    const j = await res.json();
    return (j.uploaded && j.uploaded[0] && j.uploaded[0].storedPath) ? j.uploaded[0].storedPath : (j.saved && j.saved[0] && j.saved[0].saved);
  };

  const handleMediaSearch = async (type) => {
    const file = type === 'image' ? selectedImage : selectedAudio;
    if (!file) {
      Swal.fire({ text: `Please select an ${type} file first`, icon: 'warning', buttonsStyling: false, customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4' } });
      return;
    }

    setLoading(true); setResults([]);

    try {
      const savedPath = await uploadFile(file);
      const endpoint = type === 'image' ? '/imagesearch' : '/audiosearch';
      const payloadKey = type === 'image' ? 'image_path' : 'audio_path';

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: savedPath, startIndex: 1, limit: PAGE_LIMIT })
      });

      const data = await res.json();
      const mediaResults = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      setResults(mediaResults);
    } catch (e) {
      Swal.fire({ text: `${type} search failed: ${e.message}`, icon: 'error', buttonsStyling: false, customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4' } });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEvents = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
    else if (e.type === 'drop') {
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        setSelectedImage(file); setImagePreview(URL.createObjectURL(file));
      }
    }
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const openPlayer = async (r) => {
    const meta = r.metadata || {};
    const videoPath = meta.video_path_relative;

    if (!videoPath) {
      Swal.fire({ text: 'No accessible video path found in metadata', icon: 'error', customClass: { popup: 'rounded-4 shadow-lg' } }); 
      return;
    }

    const start = meta.start_time_sec || 0;
    const end = meta.end_time_sec || 0;
    const dbName = meta.database || '';
    const title = meta.video_filename || 'Indexed Video';

    // Revoke any previous blob URL
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }

    let clipUrl = '';

    if (videoPath.startsWith('http')) {
      clipUrl = videoPath;
    } else {
      const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
      const endpoint = `${apiBase}/video/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;
      setIsLoadingVideo(true);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end, db: dbName }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const blob = await response.blob();
        clipUrl = URL.createObjectURL(blob);
        videoBlobUrlRef.current = clipUrl;
      } catch (err) {
        console.error('Failed to load video clip:', err);
        Swal.fire({ text: 'Failed to load video clip.', icon: 'error', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
        setIsLoadingVideo(false);
        return;
      }
      setIsLoadingVideo(false);
    }

    setVideoModal({
      open: true,
      url: clipUrl,
      title: title,
      startTime: start,
      endTime: end,
      dbName: dbName,
      meta: meta
    });
  };

  const formatTime = (s) => {
    if (s == null) return '--:--';
    const sec = Math.floor(s);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  };

  const handleDownloadClip = async () => {
    setIsDownloading(true);
    try {
      // videoModal.url is already a blob URL (or direct http URL); fetch it to get the blob
      const response = await fetch(videoModal.url);
      const blob = await response.blob();
      const suggestedFilename = `${videoModal.title}_clip_${videoModal.startTime}_${videoModal.endTime}.mp4`;

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: suggestedFilename,
          types: [{
            description: 'Video File',
            accept: { 'video/mp4': ['.mp4'] },
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const a = document.createElement('a');
        a.href = videoModal.url;
        a.download = suggestedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Download failed:", err);
        Swal.fire({ text: 'Failed to download the clip.', icon: 'error', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseVideoModal = () => {
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }
    setVideoModal({ open: false, url: '', title: '', startTime: 0, endTime: 0, dbName: '', meta: {} });
  };

  return (
    <>
      <style>{modernSearchStyles}</style>
      <div className="search-wrapper container-fluid px-0">

        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Global Search</h2>
            <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Find specific moments across all indexed media using AI.</p>
          </div>
          <button className="btn btn-adaptive rounded-pill px-3 shadow-sm border transition" onClick={() => setShowSettings(true)} title="Settings" style={{ height: '46px' }}>
            <i className="bi bi-sliders fs-5" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>

        <div className="modern-search-box mb-5">
          <div className="text-center">
            <div className="modern-tabs-container">
              <button className={`modern-tab ${activeSearchTab === 'text' ? 'active' : ''}`} onClick={() => { setActiveSearchTab('text'); setResults([]); }}>
                <i className="bi bi-cursor-text fs-5"></i>Text Search
              </button>
              <button className={`modern-tab ${activeSearchTab === 'image' ? 'active' : ''}`} onClick={() => { setActiveSearchTab('image'); setResults([]); }}>
                <i className="bi bi-image fs-5"></i> Image Match
              </button>
              <button style={{ display: 'none' }} className={`modern-tab ${activeSearchTab === 'audio' ? 'active' : ''}`} onClick={() => { setActiveSearchTab('audio'); setResults([]); }}>
                <i className="bi bi-soundwave fs-5"></i> Audio Pattern
              </button>
            </div>
          </div>

          <div className="tab-content stagger-fade-in" key={activeSearchTab}>
            
            {activeSearchTab === 'text' && (
              <div>
                <div className="row g-3">
                  <div className="col-lg-6">
                    <label className="form-label small fw-bold text-uppercase ms-1" style={{ color: 'var(--text-muted)' }}>Search Query</label>
                    <div className="position-relative">
                      <input
                        className="form-control modern-input ps-4"
                        placeholder="Describe the scene (e.g., 'red car driving fast')..."
                        value={filters.query}
                        onChange={e => setFilters({ ...filters, query: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleTextSearch(false)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <label className="form-label small fw-bold text-uppercase ms-1" style={{ color: 'var(--text-muted)' }}>Database Filter</label>
                    <select className="form-select modern-input" value={filters.dbName} onChange={e => setFilters({ ...filters, dbName: e.target.value })}>
                      <option value="*">All Databases</option>
                      {dbList.map(db => <option key={db} value={db}>{db}</option>)}
                    </select>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <label className="form-label small fw-bold text-uppercase ms-1" style={{ color: 'var(--text-muted)' }}>Index Type</label>
                    {/* <select className="form-select modern-input" value={filters.sourceId} onChange={e => setFilters({ ...filters, sourceId: e.target.value })}>
                      <option value="*">All Sources</option>
                      {sourceList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select> */}

                    <select className="form-select modern-input" value={filters.index_type} onChange={e => setFilters({ ...filters, index_type: e.target.value })}>
                      <option value="">Select Index Type (default: video)</option>
                      <option value="text">Text Index</option>
                      <option value="video">Video Index</option>
                    </select>

                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-gradient-primary rounded-pill px-5 py-2 fs-6 shadow-sm d-flex align-items-center gap-2" onClick={() => handleTextSearch(false)}>
                    <i className="bi bi-search"></i> Search Library
                  </button>
                </div>
              </div>
            )}

            {activeSearchTab === 'image' && (
              <div className="row g-4 align-items-stretch">
                <div className="col-md-8">
                  <div 
                    className={`modern-dropzone h-100 p-4 ${isDragging ? 'drag-active' : ''}`}
                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents}
                    onDragLeave={handleDragEvents} onDrop={handleDragEvents}
                    onClick={() => document.getElementById('imageUploadInput').click()}
                  >
                    <i className={`bi ${isDragging ? 'bi-image-fill' : 'bi-cloud-arrow-up-fill'} text-primary mb-3`} style={{ fontSize: '3.5rem', opacity: 0.9 }}></i>
                    <h5 className="fw-bolder" style={{ color: 'var(--text-main)' }}>{isDragging ? 'Drop Image Now' : 'Drag & Drop Reference Image'}</h5>
                    <p className="small fw-medium mb-3" style={{ color: 'var(--text-muted)' }}>Or click to browse files from your computer</p>
                    <input id="imageUploadInput" type="file" accept="image/*" className="d-none" onChange={handleImageSelect} />
                    <button className="btn btn-adaptive border shadow-sm rounded-pill px-4 fw-bold text-primary">Browse Files</button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="h-100 p-4 rounded-4 text-center d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <div className="small fw-bold text-uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>Image Preview</div>
                    {imagePreview ? (
                      <div className="position-relative mb-4 w-100">
                        <img src={imagePreview} className="img-fluid rounded-4 shadow-sm" style={{ height: '160px', width: '100%', objectFit: 'cover' }} alt="Preview" />
                        <button className="btn btn-sm btn-danger position-absolute rounded-circle shadow" style={{ top: '-10px', right: '-10px', width: '30px', height: '30px', padding: '0' }} onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setImagePreview(null); }}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="mb-4 d-flex align-items-center justify-content-center rounded-4" style={{ height: '160px', width: '100%', border: '2px dashed var(--border-color)', backgroundColor: 'var(--card-bg)', opacity: 0.6 }}>
                        <i className="bi bi-image fs-1 text-muted"></i>
                      </div>
                    )}
                    <button className="btn btn-gradient-primary w-100 rounded-pill py-2 shadow-sm d-flex justify-content-center align-items-center gap-2" onClick={() => handleMediaSearch('image')} disabled={!selectedImage}>
                      <i className="bi bi-magic fs-5"></i> Find Image Matches
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSearchTab === 'audio' && (
              <div className="text-center p-5 rounded-4" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div className="mx-auto mb-4 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: 'var(--card-bg)' }}>
                  <i className="bi bi-soundwave text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h4 className="fw-bolder" style={{ color: 'var(--text-main)' }}>Upload Audio Reference</h4>
                <p className="fw-medium text-muted mb-4">Find video segments matching a specific audio pattern or fingerprint.</p>
                <p className="fw-medium text-muted mb-4">Feature coming soon</p>
              </div>
            )}

          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bolder mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
            Search Results 
            {results.length > 0 && <span className="badge rounded-pill px-3 py-1 fs-6" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>{results.length} Matches</span>}
          </h4>
        </div>

        <div className="results-grid mb-5">
          {loading && results.length === 0 && (
            <div className="col-12 text-center py-5 rounded-4" style={{ gridColumn: '1 / -1', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="spinner-border text-primary mb-3" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '0.25em' }}></div>
              <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Scanning Vector Databases...</h5>
              <p className="text-muted fw-medium mb-0">Our AI engine is processing your request.</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="col-12 text-center py-5 rounded-4 stagger-fade-in" style={{ gridColumn: '1 / -1', border: '2px dashed var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              <i className="bi bi-search text-muted opacity-50 d-block mb-3" style={{ fontSize: '4rem' }}></i>
              <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>No Results Found</h5>
              <p className="fw-medium text-muted mb-0">Try adjusting your search parameters or query terms.</p>
            </div>
          )}

          {results.map((r, idx) => {
            const score = Math.round((r.score || 0) * 100) / 100;
            const timeStr = `${formatTime(r.metadata.start_time_sec)} - ${formatTime(r.metadata.end_time_sec)}`;
            const filePath = r.metadata?.video_path_relative || '';
            
            const handleOpenPath = async (e) => {
              e.stopPropagation();
              try {
                await fetch(`${apiBase}/api/open-file-location`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath })
                });
              } catch (err) { console.error("Failed to open path:", err); }
            };

            const thumbnailUrl = r.metadata?.video_filename
              ? `${apiBase}/thumbnail/${encodeURIComponent(r.metadata.video_filename)}${r.metadata.start_time_sec != null ? `?t=${r.metadata.start_time_sec}` : ''}`
              : null;

            return (
              <div key={idx} className="result-card-modern stagger-fade-in" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => openPlayer(r)}>
                <div className="thumb-wrapper-modern">
                  <img
                    className="thumb-img"
                    src={thumbnailUrl || r.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZjFmNWY5Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiAvPjwvc3ZnPg=='} 
                    onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZjFmNWY5Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiAvPjwvc3ZnPg=='}
                    alt="thumbnail"
                  />
                  <div className="timestamp-badge shadow-sm"><i className="bi bi-clock-history me-2 text-warning"></i>{timeStr}</div>
                  <div className="play-overlay-modern"><i className="bi bi-play-fill"></i></div>
                </div>
                
                <div className="p-4 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <h6 className="fw-bolder text-truncate mb-3" title={r.metadata.video_filename} style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                      {r.metadata.video_filename || 'Unknown Video'}
                    </h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge-soft-modern badge-db" title={r.metadata.database}><i className="bi bi-database text-primary"></i>{r.metadata.database}</span>
                      <span className="badge-soft-modern badge-source" title={r.metadata.source_id}><i className="bi bi-fingerprint text-success"></i>{r.metadata.source_id}</span>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <span className="badge-soft-modern badge-score"><i className="bi bi-stars"></i> Match: {score}</span>
                    <button 
                      className="btn btn-sm btn-adaptive rounded-pill px-3 shadow-sm d-flex align-items-center gap-2 fw-semibold" 
                      title="Open local file location"
                      onClick={handleOpenPath}
                    >
                      <i className="bi bi-folder2-open text-primary"></i> Folder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length > 0 && activeSearchTab === 'text' && (
          <div className="text-center pb-5 stagger-fade-in" style={{ animationDelay: '0.2s' }}>
            <button className="btn btn-adaptive rounded-pill px-5 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2" onClick={() => handleTextSearch(true)} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm text-primary"></span> <span style={{ color: 'var(--text-main)' }}>Loading Data...</span></> : <><i className="bi bi-arrow-down-circle fs-5 text-primary"></i> <span style={{ color: 'var(--text-main)' }}>Load More Results</span></>}
            </button>
          </div>
        )}

      </div>

      {videoModal.open && ReactDOM.createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseVideoModal(); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(1px)',
            padding: '1rem',
          }}
        >
          <div className="stagger-fade-in" style={{
            width: '100%', maxWidth: '1100px',
            maxHeight: '95vh',
            display: 'flex', flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-main)',
          }}>
            {/* Header */}
            <div className="cinematic-header" style={{ flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="modal-title fw-bolder text-truncate pe-3" style={{ color: 'var(--text-main)' }}>{videoModal.title}</h4>
                <button type="button" className="btn-close shadow-none opacity-75" style={{ filter: 'var(--bs-btn-close-color)', flexShrink: 0 }} onClick={handleCloseVideoModal}></button>
              </div>
              <div className="d-flex flex-wrap gap-3 small fw-medium align-items-center" style={{ color: 'var(--text-muted)' }}>
                <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge">
                  <i className="bi bi-play-circle-fill text-primary"></i> Scene {videoModal.startTime?.toFixed(2)}s – {videoModal.endTime?.toFixed(2)}s
                </span>
                <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge">
                  <i className="bi bi-fingerprint text-success"></i> {videoModal.meta.source_id}
                </span>
                <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge">
                  <i className="bi bi-database-fill text-info"></i> {videoModal.dbName || 'Default'}
                </span>
                <button
                  onClick={handleDownloadClip}
                  disabled={isDownloading}
                  className="btn btn-sm btn-adaptive rounded-pill ms-auto d-flex align-items-center gap-2 px-3"
                >
                  {isDownloading
                    ? <><span className="spinner-border spinner-border-sm text-primary" role="status"></span> Saving...</>
                    : <><i className="bi bi-download text-primary"></i> Download Clip</>}
                </button>
              </div>
            </div>

            {/* Video body */}
            <div style={{ flex: 1, minHeight: 0, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                src={videoModal.url}
                controls autoPlay
                style={{ width: '100%', maxHeight: 'calc(95vh - 160px)', outline: 'none' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}