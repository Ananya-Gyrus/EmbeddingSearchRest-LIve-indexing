import React, { useState, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { getApiBase } from './apiBase';

const styles = `
  .sr-video-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .sr-video-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
  .sr-thumb-wrap {
    position: relative;
    background: #000;
    aspect-ratio: 16/9;
    overflow: hidden;
  }
  .sr-thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sr-play-overlay {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    background: rgba(0,0,0,0.65);
    border-radius: 50%;
    width: 56px; height: 56px;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.25s;
  }
  .sr-video-card:hover .sr-play-overlay { opacity: 1; }
  .sr-score-badge {
    position: absolute; top: 10px; right: 10px;
    font-size: 0.8rem; padding: 4px 10px;
    border-radius: 8px; font-weight: 700;
  }
  .sr-filter-panel {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.2rem 1.4rem;
    margin-bottom: 1.25rem;
  }
  .sr-results-header {
    background: var(--primary-light);
    padding: 12px 18px;
    border-radius: 12px;
    margin-bottom: 1rem;
    color: var(--primary);
    font-weight: 600;
  }
  .sr-pagination .page-link {
    border-radius: 10px;
    margin: 0 3px;
    border: 2px solid var(--primary);
    color: var(--primary);
    background: var(--card-bg);
  }
  .sr-pagination .page-item.active .page-link { background: var(--primary); border-color: var(--primary); color: #fff; }
  .sr-pagination .page-item.disabled .page-link { opacity: 0.5; }
  .sr-spinner {
    width: 48px; height: 48px;
    border: 5px solid var(--primary-light);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: sr-spin 0.9s linear infinite;
  }
  @keyframes sr-spin { to { transform: rotate(360deg); } }
`;

const RESULTS_PER_PAGE = 12;

function formatTime(sec) {
  if (!sec && sec !== 0) return '--:--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

function scoreBadgeClass(score) {
  if (score > 0.23) return 'bg-success text-white';
  if (score >= 0.13) return 'bg-warning text-dark';
  return 'bg-danger text-white';
}

export default function SearchRegisteredPage({ backendConfig }) {
  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const [character, setCharacter] = useState('');
  const [action, setAction] = useState('');
  const [dbName, setDbName] = useState('');
  const [sourceIds, setSourceIds] = useState('');
  const [imgSimThresh, setImgSimThresh] = useState(0.3);
  const [characterWeight, setCharacterWeight] = useState(0.6);
  const [limit, setLimit] = useState(20);
  const [startIndex, setStartIndex] = useState(1);

  const [results, setResults] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [videoModal, setVideoModal] = useState({ open: false, url: '', title: '', meta: {} });
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoBlobUrlRef = useRef(null);
  const videoRef = useRef(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((title, message, type = 'info') => {
    const t = { title, message, type };
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function doSearch() {
    if (!character.trim()) { showToast('Error', 'Please enter a character name', 'danger'); return; }
    setLoading(true); setResults([]); setPage(1); setSearchMeta(null);
    try {
      const payload = {
        character: character.trim(),
        action: action.trim(),
        startIndex: Number(startIndex) || 1,
        limit: Number(limit) || 20,
        dbName: dbName.trim() || '*',
        sourceIds: sourceIds.trim() ? sourceIds.split(',').map(s => s.trim()) : null,
        imgSimThresh: Number(imgSimThresh) || 0.3,
        characterWeight: Number(characterWeight) || 0.6,
      };
      const res = await fetch(`${apiBase}/search-registered`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setResults(j.results || []);
      setSearchMeta(j);
      if ((j.results || []).length === 0) {
        showToast('Info', 'No results found', 'info');
      } else {
        showToast('Success', `Found ${j.results.length} results${j.search_time ? ` in ${Number(j.search_time).toFixed(2)}s` : ''}`, 'success');
      }
    } catch (e) { showToast('Error', e.message, 'danger'); }
    setLoading(false);
  }

  const openPlayer = useCallback(async (result) => {
    const meta = result.metadata || {};
    const videoPath = meta.video_path_relative || meta.video_filename;
    if (!videoPath) { showToast('Error', 'No video path in result metadata', 'danger'); return; }

    const start = meta.start_time_sec || 0;
    const end   = meta.end_time_sec   || 0;
    const dbName = meta.database || '';
    const title  = meta.video_filename || 'Clip';

    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }

    const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
    const endpoint  = `${apiBase}/video/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;

    setIsLoadingVideo(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, db: dbName }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      videoBlobUrlRef.current = blobUrl;
      setVideoModal({ open: true, url: blobUrl, title, meta });
    } catch (err) {
      showToast('Error', `Failed to load video clip: ${err.message}`, 'danger');
    }
    setIsLoadingVideo(false);
  }, [apiBase, showToast]);

  const closePlayer = useCallback(() => {
    if (videoRef.current) videoRef.current.pause();
    if (videoBlobUrlRef.current) { URL.revokeObjectURL(videoBlobUrlRef.current); videoBlobUrlRef.current = null; }
    setVideoModal({ open: false, url: '', title: '', meta: {} });
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoModal.url);
      const blob = await response.blob();
      const filename = `${videoModal.title}_clip.mp4`;
      if (window.showSaveFilePicker) {
        const fh = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Video', accept: { 'video/mp4': ['.mp4'] } }] });
        const w = await fh.createWritable(); await w.write(blob); await w.close();
      } else {
        const a = document.createElement('a'); a.href = videoModal.url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { if (err.name !== 'AbortError') showToast('Error', 'Download failed', 'danger'); }
    setIsDownloading(false);
  }, [videoModal, showToast]);

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const pageResults = results.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

  function goToPage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function paginationItems() {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        items.push(<li key={i} className={`page-item${i === page ? ' active' : ''}`}>
          <button className="page-link" onClick={() => goToPage(i)}>{i}</button>
        </li>);
      } else if (i === page - 3 || i === page + 3) {
        items.push(<li key={i} className="page-item disabled"><span className="page-link">…</span></li>);
      }
    }
    return items;
  }

  return (
    <div className="container-fluid fade-in">
      <style>{styles}</style>

      {/* Toast - Portal to document.body */}
      {toast && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, maxWidth: 400 }}>
          <div className={`alert alert-${toast.type} shadow-lg`} style={{ 
            minWidth: 280, 
            borderRadius: 12, 
            marginBottom: 10,
            animation: 'slideInRight 0.3s ease-out',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)'
          }}>
            <strong>{toast.title}</strong>: {toast.message}
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>,
        document.body
      )}

      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Character Search
          </h2>
          <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Search through your video library by character and action.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="modern-card mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-person me-1"></i>Character
            </label>
            <input className="form-control" placeholder="Enter character name..." value={character}
              onChange={e => setCharacter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()} />
          </div>
          <div className="col-md-7">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-lightning me-1"></i>Action
            </label>
            <input className="form-control" placeholder="Enter action description..." value={action}
              onChange={e => setAction(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary rounded-pill w-100 fw-semibold py-2" onClick={doSearch} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-search me-2"></i>Search</>}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sr-filter-panel">
        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-database me-1"></i>Database
            </label>
            <input className="form-control form-control-sm" placeholder="Database name" value={dbName} onChange={e => setDbName(e.target.value)} />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-list-ul me-1"></i>Source IDs
            </label>
            <input className="form-control form-control-sm" placeholder="Comma-separated" value={sourceIds} onChange={e => setSourceIds(e.target.value)} />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-funnel me-1"></i>Threshold
            </label>
            <input className="form-control form-control-sm" type="number" step="0.1" min="0" max="1" value={imgSimThresh} onChange={e => setImgSimThresh(e.target.value)} />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold d-flex justify-content-between" style={{ color: 'var(--text-main)' }}>
              <span><i className="bi bi-bar-chart me-1"></i>Char Weight</span>
              <span className="badge" style={{ background: 'var(--primary)', color: '#fff', borderRadius: 6 }}>{Number(characterWeight).toFixed(2)}</span>
            </label>
            <input type="range" className="form-range" min="0" max="1" step="0.05" value={characterWeight} onChange={e => setCharacterWeight(e.target.value)} />
            <div className="d-flex justify-content-between" style={{ fontSize: '0.68rem' }}>
              <span className="text-muted">Action</span><span className="text-muted">Character</span>
            </div>
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-sort-down me-1"></i>Limit
            </label>
            <input className="form-control form-control-sm" type="number" min="1" max="100" value={limit} onChange={e => setLimit(e.target.value)} />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-arrow-down me-1"></i>Start Index
            </label>
            <input className="form-control form-control-sm" type="number" min="1" value={startIndex} onChange={e => setStartIndex(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Loading */}
      {(loading || isLoadingVideo) && (
        <div className="text-center py-5">
          <div className="sr-spinner mx-auto"></div>
          <p className="text-muted mt-3">{isLoadingVideo ? 'Loading video clip…' : 'Searching…'}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && searchMeta !== null && (
        <div className="modern-card text-center p-5">
          <i className="bi bi-search fs-1 text-muted opacity-50"></i>
          <p className="mt-3 text-muted fw-medium">No results found for "{character}"</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <>
          <div className="sr-results-header">
            <i className="bi bi-film me-2"></i>
            Showing {((page - 1) * RESULTS_PER_PAGE) + 1}–{Math.min(page * RESULTS_PER_PAGE, results.length)} of {results.length} results
          </div>
          <div className="row g-3">
            {pageResults.map((result, idx) => {
              const meta = result.metadata || {};
              const score = parseFloat(result.score) || 0;
              const thumbTime = (meta.start_time_sec || 0) + ((meta.duration_sec || 0) / 2);
              const thumbUrl = `${apiBase}/thumbnail/${encodeURIComponent(meta.video_filename || '')}?t=${thumbTime}`;
              return (
                <div key={idx} className="col-md-4 col-sm-6">
                  <div className="sr-video-card" onClick={() => openPlayer(result)}>
                    <div className="sr-thumb-wrap">
                      <img src={thumbUrl} alt={`Clip ${meta.result_number}`}
                        onError={e => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%23222' width='400' height='225'/%3E%3Ctext fill='%23888' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='18'%3ENo Preview%3C/text%3E%3C/svg%3E"; }} />
                      <span className={`sr-score-badge ${scoreBadgeClass(score)}`}>{score.toFixed(4)}</span>
                      <div className="sr-play-overlay">
                        <i className="bi bi-play-fill text-white fs-3"></i>
                      </div>
                    </div>
                    <div className="p-3 flex-grow-1">
                      <h6 className="fw-bold mb-2" style={{ color: 'var(--text-main)' }}>
                        <i className="bi bi-film me-2 text-primary"></i>Clip {meta.result_number}
                      </h6>
                      <div className="small text-muted mb-1"><i className="bi bi-file-earmark-play me-2"></i>{meta.video_filename}</div>
                      <div className="small text-muted mb-1"><i className="bi bi-clock me-2"></i>{formatTime(meta.start_time_sec)} – {formatTime(meta.end_time_sec)}</div>
                      <div className="small text-muted mb-1"><i className="bi bi-hourglass-split me-2"></i>Duration: {formatTime(meta.duration_sec)}</div>
                      <div className="small text-muted mb-1"><i className="bi bi-database me-2"></i>{meta.database}</div>
                      <div className="small text-muted"><i className="bi bi-tag me-2"></i>{meta.source_id}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination sr-pagination justify-content-center">
                <li className={`page-item${page === 1 ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => goToPage(page - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {paginationItems()}
                <li className={`page-item${page === totalPages ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => goToPage(page + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Fullscreen video portal — same pattern as SearchPage */}
      {videoModal.open && ReactDOM.createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) closePlayer(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '1rem',
          }}
        >
          <div style={{
            width: '100%', maxWidth: '1100px', maxHeight: '95vh',
            display: 'flex', flexDirection: 'column',
            borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-main)',
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="fw-bolder mb-0 text-truncate pe-3" style={{ color: 'var(--text-main)' }}>
                  {videoModal.title}
                </h5>
                <button className="btn-close shadow-none" onClick={closePlayer}></button>
              </div>
              <div className="d-flex flex-wrap gap-2 small fw-medium align-items-center" style={{ color: 'var(--text-muted)' }}>
                <span className="px-3 py-1 rounded-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <i className="bi bi-play-circle-fill me-1"></i>
                  {formatTime(videoModal.meta.start_time_sec)} – {formatTime(videoModal.meta.end_time_sec)}
                </span>
                {videoModal.meta.source_id && (
                  <span className="px-3 py-1 rounded-pill" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                    <i className="bi bi-fingerprint me-1"></i>{videoModal.meta.source_id}
                  </span>
                )}
                {videoModal.meta.database && (
                  <span className="px-3 py-1 rounded-pill" style={{ background: 'rgba(13,202,240,0.15)', color: '#0dcaf0' }}>
                    <i className="bi bi-database-fill me-1"></i>{videoModal.meta.database}
                  </span>
                )}
                <button
                  className="btn btn-sm rounded-pill ms-auto d-flex align-items-center gap-2 px-3"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}
                  onClick={handleDownload} disabled={isDownloading}
                >
                  {isDownloading
                    ? <><span className="spinner-border spinner-border-sm"></span> Saving…</>
                    : <><i className="bi bi-download"></i> Download Clip</>}
                </button>
              </div>
            </div>

            {/* Video */}
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
    </div>
  );
}
