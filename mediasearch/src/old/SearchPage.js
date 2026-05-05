import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// --- Embedded Modern CSS ---
const modernSearchStyles = `
  .search-wrapper {
    animation: fadeIn 0.4s ease-out forwards;
  }

  /* Segmented Tabs */
  .modern-tabs-container {
    background-color: var(--bg-main, #f4f7fe);
    padding: 6px;
    border-radius: 50px;
    display: inline-flex;
    border: 1px solid var(--border-color, #e2e8f0);
    margin-bottom: 2rem;
  }

  .modern-tab {
    padding: 10px 32px;
    border-radius: 50px;
    border: none;
    background: transparent;
    color: var(--text-muted, #a3aed1);
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modern-tab:hover:not(.active) {
    color: var(--text-main, #2b3674);
  }

  .modern-tab.active {
    background-color: var(--card-bg, #ffffff);
    color: var(--primary, #4318FF);
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  /* Search Inputs & Filters */
  .modern-search-box {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }

  .modern-input {
    background-color: var(--bg-main, #f4f7fe) !important;
    border: 1px solid var(--border-color, #e2e8f0) !important;
    color: var(--text-main, #2b3674) !important;
    border-radius: 12px !important;
    padding: 0.8rem 1.25rem !important;
    transition: all 0.2s ease;
  }
  
  .modern-input:focus {
    box-shadow: 0 0 0 4px var(--primary-light, #e9e3ff) !important;
    border-color: var(--primary, #4318FF) !important;
  }

  /* Dropzone */
  .modern-dropzone {
    border: 2px dashed var(--border-color, #e2e8f0);
    border-radius: 20px;
    background-color: var(--bg-main, #f4f7fe);
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .modern-dropzone:hover {
    border-color: var(--primary, #4318FF);
    background-color: var(--primary-light, #e9e3ff);
  }

  /* Results Grid & Cards */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .result-card-modern {
    background-color: var(--card-bg, #ffffff);
    border-radius: 16px;
    border: 1px solid var(--border-color, #e2e8f0);
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .result-card-modern:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    border-color: var(--primary-light, #e9e3ff);
  }

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
    transform: scale(1.05);
    opacity: 0.6;
  }

  .play-overlay-modern {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
  }

  .result-card-modern:hover .play-overlay-modern {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .timestamp-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }

  /* Badges */
  .badge-soft-modern {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  
  .badge-db { background-color: var(--primary-light, #e9e3ff); color: var(--primary, #4318FF); }
  .badge-source { background-color: var(--success-light, #e5f7ed); color: var(--success, #01B574); }
  .badge-score { background-color: var(--warning-light, #fff9e6); color: #B28F00; }

  /* Immersive Modal */
  .cinematic-modal .modal-content {
    background-color: #0a0a0a;
    border: 1px solid #333;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  
  .cinematic-header {
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    border-bottom: 1px solid #222;
    padding: 1.5rem;
  }

  .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function SearchPage({ backendConfig, setShowSettings }) {
  const PAGE_LIMIT = 12;
  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  const [activeSearchTab, setActiveSearchTab] = useState('text');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [dbList, setDbList] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [filters, setFilters] = useState({ query: '', dbName: '*', sourceId: '*' });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const [videoModal, setVideoModal] = useState({ open: false, url: '', title: '', meta: {} });
  const videoRef = useRef(null);

  useEffect(() => {
    fetchFilters();
  }, [backendConfig]);

  const fetchFilters = async () => {
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
  };

  const handleTextSearch = async (isLoadMore = false) => {
    const startIdx = isLoadMore ? (page * PAGE_LIMIT) + 1 : 1;
    if (!isLoadMore) { setResults([]); setPage(1); }
    setLoading(true);

    try {
      const payload = {
        query: filters.query,
        startIndex: startIdx,
        limit: PAGE_LIMIT,
        dbName: filters.dbName === '*' ? undefined : filters.dbName
      };

      const res = await fetch(`${apiBase}/textsearch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const newResults = data.results || data;

      setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
      if (isLoadMore) setPage(prev => prev + 1);

    } catch (e) {
      Swal.fire({ title: 'Search Failed', text: e.message, icon: 'error', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('files[]', file, file.name);
    const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const j = await res.json();
    return (j.uploaded && j.uploaded[0] && j.uploaded[0].storedPath) ? j.uploaded[0].storedPath : (j.saved && j.saved[0] && j.saved[0].saved);
  };

  const handleMediaSearch = async (type) => {
    const file = type === 'image' ? selectedImage : selectedAudio;
    if (!file) {
      Swal.fire({ text: `Please select an ${type} file first`, icon: 'warning', confirmButtonColor: '#4318FF' });
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
      setResults(data.results || data);
    } catch (e) {
      Swal.fire({ text: `${type} search failed: ${e.message}`, icon: 'error', confirmButtonColor: '#EE5D50' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file); setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const openPlayer = (r) => {
    let url = null;
    if (r.metadata && r.metadata.video_path_relative) {
      url = r.metadata.video_path_relative.startsWith('http')
        ? r.metadata.video_path_relative
        : `${apiBase}${r.metadata.video_path_relative.startsWith('/') ? '' : '/'}${r.metadata.video_path_relative}`;
    }

    if (!url) {
      Swal.fire({ text: 'No video URL found in metadata', icon: 'error' }); return;
    }

    setVideoModal({
      open: true, url: url, title: r.metadata.video_filename || 'Video',
      startTime: r.metadata.start_time_sec || 0, meta: r.metadata
    });
  };

  const formatTime = (s) => {
    if (s == null) return '--:--';
    const sec = Math.floor(s);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <>
      <style>{modernSearchStyles}</style>
      <div className="search-wrapper container-fluid px-0">

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Global Search</h2>
            <p className="mb-0" style={{ color: 'var(--text-muted)' }}>Find specific moments across all indexed media.</p>
          </div>
          <button className="btn btn-light rounded-pill px-3 shadow-sm border" onClick={() => setShowSettings(true)} title="Settings">
            <i className="bi bi-sliders" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>

        {/* Search Controls Container */}
        <div className="modern-search-box mb-5">
          <div className="text-center">
            <div className="modern-tabs-container">
              <button className={`modern-tab ${activeSearchTab === 'text' ? 'active' : ''}`} onClick={() => setActiveSearchTab('text')}>
                <i className="bi bi-fonts"></i> Semantic Text
              </button>
              <button className={`modern-tab ${activeSearchTab === 'image' ? 'active' : ''}`} onClick={() => setActiveSearchTab('image')}>
                <i className="bi bi-image"></i> Image Match
              </button>
              <button className={`modern-tab ${activeSearchTab === 'audio' ? 'active' : ''}`} onClick={() => setActiveSearchTab('audio')}>
                <i className="bi bi-mic"></i> Audio Pattern
              </button>
            </div>
          </div>

          <div className="tab-content fade-in-up">
            
            {/* TEXT SEARCH */}
            {activeSearchTab === 'text' && (
              <div>
                <div className="row g-3">
                  <div className="col-lg-6">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Search Query</label>
                    <div className="position-relative">
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <input
                        className="form-control modern-input ps-5"
                        placeholder="Describe the scene (e.g., 'red car driving fast')..."
                        value={filters.query}
                        onChange={e => setFilters({ ...filters, query: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleTextSearch(false)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Database</label>
                    <select className="form-select modern-input" value={filters.dbName} onChange={e => setFilters({ ...filters, dbName: e.target.value })}>
                      <option value="*">All Databases</option>
                      {dbList.map(db => <option key={db} value={db}>{db}</option>)}
                    </select>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Source ID</label>
                    <select className="form-select modern-input" value={filters.sourceId} onChange={e => setFilters({ ...filters, sourceId: e.target.value })}>
                      <option value="*">All Sources</option>
                      {sourceList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={() => handleTextSearch(false)}>
                    <i className="bi bi-search"></i> Search Library
                  </button>
                </div>
              </div>
            )}

            {/* IMAGE SEARCH */}
            {activeSearchTab === 'image' && (
              <div className="row g-4 align-items-stretch">
                <div className="col-md-8">
                  <div 
                    className="modern-dropzone h-100 p-4"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleImageDrop}
                    onClick={() => document.getElementById('imageUploadInput').click()}
                  >
                    <i className="bi bi-cloud-arrow-up-fill text-primary mb-3" style={{ fontSize: '3rem', opacity: 0.8 }}></i>
                    <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Drag & Drop Image</h5>
                    <p className="small mb-3" style={{ color: 'var(--text-muted)' }}>Or click to browse files from your computer</p>
                    <input id="imageUploadInput" type="file" accept="image/*" className="d-none" onChange={handleImageSelect} />
                    <button className="btn btn-outline-primary rounded-pill px-4">Browse Files</button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="h-100 p-4 rounded-4 text-center d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <div className="small fw-bold text-uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Preview</div>
                    {imagePreview ? (
                      <img src={imagePreview} className="img-fluid rounded-3 shadow-sm mb-4" style={{ maxHeight: '140px', objectFit: 'contain' }} alt="Preview" />
                    ) : (
                      <div className="mb-4 d-flex align-items-center justify-content-center border rounded-3" style={{ height: '140px', width: '100%', borderStyle: 'dashed !important', opacity: 0.3 }}>
                        <i className="bi bi-image fs-1"></i>
                      </div>
                    )}
                    <button className="btn btn-primary w-100 rounded-pill fw-bold shadow-sm" onClick={() => handleMediaSearch('image')} disabled={!selectedImage}>
                      <i className="bi bi-search me-2"></i>Find Matches
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIO SEARCH */}
            {activeSearchTab === 'audio' && (
              <div className="text-center p-5 rounded-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="v-icon-box mx-auto mb-3 shadow-sm bg-white" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
                  <i className="bi bi-music-note-beamed text-primary fs-3"></i>
                </div>
                <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Upload Audio Reference</h5>
                <p className="small text-muted mb-4">Find video segments matching this specific audio fingerprint.</p>
                <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3">
                  <input type="file" accept="audio/*" className="form-control modern-input shadow-sm" style={{ maxWidth: '300px' }} onChange={e => setSelectedAudio(e.target.files[0])} />
                  <button className="btn btn-primary rounded-pill px-4 py-2 shadow-sm fw-bold" onClick={() => handleMediaSearch('audio')} disabled={!selectedAudio}>
                    <i className="bi bi-magic me-2"></i>Analyze & Search
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Results Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>
            Search Results {results.length > 0 && <span className="text-muted fs-6 ms-2">({results.length} matches)</span>}
          </h4>
        </div>

        <div className="results-grid mb-5">
          {loading && results.length === 0 && (
            <div className="col-12 text-center py-5" style={{ gridColumn: '1 / -1' }}>
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
              <p className="mt-3 fw-medium" style={{ color: 'var(--text-muted)' }}>Scanning databases...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="col-12 text-center py-5 rounded-4 border" style={{ gridColumn: '1 / -1', borderStyle: 'dashed !important', backgroundColor: 'transparent' }}>
              <i className="bi bi-search text-muted fs-1 opacity-25 d-block mb-3"></i>
              <p className="fw-medium mb-0" style={{ color: 'var(--text-muted)' }}>No results found. Adjust your search parameters.</p>
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

            return (
              <div key={idx} className="result-card-modern fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => openPlayer(r)}>
                <div className="thumb-wrapper-modern">
                  <img
                    className="thumb-img"
                    src={r.thumbnail || 'data:image/svg+xml;base64,...'} 
                    onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZjFmNWY5Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiAvPjwvc3ZnPg=='}
                    alt="thumbnail"
                  />
                  <div className="timestamp-badge"><i className="bi bi-clock me-1"></i>{timeStr}</div>
                  <div className="play-overlay-modern"><i className="bi bi-play-fill"></i></div>
                </div>
                
                <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <h6 className="fw-bold text-truncate mb-2" title={r.metadata.video_filename} style={{ color: 'var(--text-main)' }}>
                      {r.metadata.video_filename || 'Unknown Video'}
                    </h6>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge-soft-modern badge-db" title={r.metadata.database}><i className="bi bi-database"></i>{r.metadata.database}</span>
                      <span className="badge-soft-modern badge-source" title={r.metadata.source_id}><i className="bi bi-fingerprint"></i>{r.metadata.source_id}</span>
                      <span className="badge-soft-modern badge-score"><i className="bi bi-star-fill"></i>{score}</span>
                    </div>
                  </div>
                  
                  <div 
                    className="small mt-2 p-2 rounded text-truncate" 
                    style={{ backgroundColor: 'var(--bg-main)', color: 'var(--primary)', cursor: 'pointer' }}
                    title="Click to open file location"
                    onClick={handleOpenPath}
                  >
                    <i className="bi bi-folder2-open me-2"></i>{filePath}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length > 0 && activeSearchTab === 'text' && (
          <div className="text-center pb-5">
            <button className="btn btn-outline-primary rounded-pill px-5 py-2 fw-bold bg-white" onClick={() => handleTextSearch(true)} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</> : 'Load More Results'}
            </button>
          </div>
        )}

      </div>

      {/* Cinematic Video Player Modal */}
      {videoModal.open && (
        <div className="modal show d-block cinematic-modal" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered fade-in-up">
            <div className="modal-content">
              <div className="modal-header cinematic-header border-0 pb-3">
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="modal-title fw-bold text-white text-truncate pe-3">{videoModal.title}</h5>
                    <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setVideoModal({ ...videoModal, open: false })}></button>
                  </div>
                  <div className="d-flex gap-3 text-white-50 small">
                    <span><i className="bi bi-play-circle me-1"></i>Starts @ {formatTime(videoModal.startTime)}</span>
                    <span><i className="bi bi-fingerprint me-1"></i>{videoModal.meta.source_id}</span>
                    <span><i className="bi bi-database me-1"></i>{videoModal.meta.database}</span>
                  </div>
                </div>
              </div>
              <div className="modal-body p-0 bg-black text-center d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <video
                  ref={videoRef}
                  src={videoModal.url}
                  controls autoPlay
                  style={{ maxHeight: '75vh', maxWidth: '100%', outline: 'none' }}
                  onLoadedMetadata={(e) => { e.target.currentTime = Number(videoModal.startTime); }}
                ></video>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}