import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { getApiBase } from './apiBase';

const modernLibraryStyles = `
  .library-wrapper {
    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .modern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  /* Animations */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stagger-fade-in {
    opacity: 0;
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Shimmer Skeleton */
  .sk-card-modern {
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .shimmer {
    background: linear-gradient(90deg, var(--border-color) 25%, var(--input-bg) 50%, var(--border-color) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
    border-radius: 8px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Modern Card */
  .lib-card-modern {
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .lib-card-modern:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
  }

  .lib-card-modern::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background-color: var(--primary);
    transform: scaleY(0); transform-origin: top;
    transition: transform 0.3s ease;
  }

  .lib-card-modern:hover::before { transform: scaleY(1); }

  .lib-icon-box {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    background-color: var(--primary-light);
    color: var(--primary);
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }

  .lib-card-modern:hover .lib-icon-box { transform: scale(1.05); }

  /* Badges & Inputs */
  .badge-db-modern {
    background-color: var(--input-bg);
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .modern-search-input {
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    transition: all 0.2s ease;
  }

  .modern-search-input:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .modern-search-input input {
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-weight: 500;
  }

  .modern-search-input input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
    opacity: 0.7;
  }

  .btn-delete-modern {
    background-color: transparent;
    color: var(--danger);
    border: 1px solid var(--danger-light);
    font-weight: 600;
    border-radius: 14px;
    transition: all 0.2s ease;
  }

  .btn-delete-modern:hover {
    background-color: var(--danger);
    color: white;
    border-color: var(--danger);
    box-shadow: 0 4px 15px var(--danger-light);
    transform: translateY(-2px);
  }

  /* Adaptive Header Buttons */
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

  /* Swal Customizations to match true dark theme */
  div:where(.swal2-container) div:where(.swal2-popup) {
    background-color: var(--card-bg);
    color: var(--text-main);
    border: 1px solid var(--border-color);
  }
  div:where(.swal2-container) h2:where(.swal2-title) { color: var(--text-main); }
  div:where(.swal2-container) div:where(.swal2-html-container) { color: var(--text-muted); }
  
  .btn-cancel-adaptive {
    background-color: var(--input-bg) !important;
    color: var(--text-main) !important;
    border: 1px solid var(--border-color) !important;
  }
  .btn-cancel-adaptive:hover {
    background-color: var(--border-color) !important;
  }
  .btn-confirm-danger {
    background-color: var(--danger) !important;
    color: white !important;
  }
  .btn-confirm-danger:hover {
    box-shadow: 0 4px 15px var(--danger-light) !important;
    transform: translateY(-1px);
  }
`;

const SkeletonCard = () => (
  <div className="sk-card-modern">
    <div className="d-flex gap-3">
      <div className="shimmer" style={{ width: '54px', height: '54px', borderRadius: '16px' }}></div>
      <div className="w-100 mt-1">
        <div className="shimmer mb-2" style={{ height: '18px', width: '80%' }}></div>
        <div className="shimmer mb-3" style={{ height: '14px', width: '50%' }}></div>
        <div className="shimmer" style={{ height: '26px', width: '35%', borderRadius: '50px' }}></div>
      </div>
    </div>
    <div className="shimmer mt-4" style={{ height: '42px', width: '100%', borderRadius: '14px' }}></div>
  </div>
);

export default function LibraryPage({ backendConfig, setShowSettings }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [error, setError] = useState(false);

  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${apiBase}/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      // console.log('Status data:', data);

      const indexedData = data.indexed_data;
      // Deduplicate by `${sourceId}__${dbName}`, merging index types
      const entryMap = new Map();

      if (indexedData && typeof indexedData === 'object') {
        Object.entries(indexedData).forEach(([dbName, indexTypes]) => {
          if (typeof indexTypes === 'object' && indexTypes !== null) {
            Object.entries(indexTypes).forEach(([indexType, ids]) => {
              if (Array.isArray(ids)) {
                ids.forEach(sourceId => {
                  const key = `${sourceId}__${dbName}`;
                  if (entryMap.has(key)) {
                    entryMap.get(key).indexTypes.push(indexType);
                  } else {
                    entryMap.set(key, { sourceId, name: sourceId, dbName, indexTypes: [indexType] });
                  }
                });
              }
            });
          }
        });
      }

      setVideos(Array.from(entryMap.values()));
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleDelete = async (sourceId, dbName, indexTypes) => {
    const result = await Swal.fire({
      title: 'Remove Video?',
      text: `Are you sure you want to remove "${sourceId}" from ${dbName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: '<i class="bi bi-trash3-fill me-2"></i>Yes, remove it',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-4 shadow-lg',
        confirmButton: 'btn btn-confirm-danger rounded-pill px-4 py-2 fw-bold shadow-sm ms-2',
        cancelButton: 'btn btn-cancel-adaptive rounded-pill px-4 py-2 fw-bold me-2'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${apiBase}/remove-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, dbName, indexType: indexTypes && indexTypes.length === 1 ? indexTypes[0] : 'both' })
        });

        if (!res.ok) throw new Error('Failed to remove video');

        setVideos(prev => prev.filter(v => v.sourceId !== sourceId));

        Swal.fire({
          title: 'Removed!',
          text: 'The video has been successfully removed from the database.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-4 shadow-lg' }
        });
      } catch (e) {
        Swal.fire({
          title: 'Error', 
          text: 'Failed to remove the video from the database.', 
          icon: 'error',
          buttonsStyling: false,
          confirmButtonText: 'Okay',
          customClass: { 
            popup: 'rounded-4 shadow-lg',
            confirmButton: 'btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm'
          }
        });
      }
    }
  };

  const filteredVideos = useMemo(() => {
    const term = filterTerm.toLowerCase();
    return videos.filter(v =>
      (v.name || '').toLowerCase().includes(term) ||
      (v.sourceId || '').toLowerCase().includes(term) ||
      (v.dbName || '').toLowerCase().includes(term) ||
      (v.indexTypes || []).some(it => it.toLowerCase().includes(term))
    );
  }, [videos, filterTerm]);

  return (
    <>
      <style>{modernLibraryStyles}</style>
      <div className="library-wrapper container-fluid px-0">

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-5">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Media Library</h2>
            <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Manage and monitor your indexed video databases.</p>
          </div>
          
          <div className="d-flex flex-wrap gap-2">
            <div className="modern-search-input d-flex align-items-center px-3 rounded-pill" style={{ width: '100%', maxWidth: '300px', height: '46px' }}>
              <i className="bi bi-search text-muted me-2"></i>
              <input
                type="text"
                className="w-100"
                placeholder="Search by name or ID..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-adaptive rounded-pill px-3 shadow-sm transition" onClick={fetchLibrary} title="Refresh Library" style={{ height: '46px' }}>
              <i className="bi bi-arrow-clockwise fs-5"></i>
            </button>
            <button className="btn btn-adaptive rounded-pill px-3 shadow-sm transition" onClick={() => setShowSettings(true)} title="Settings" style={{ height: '46px' }}>
              <i className="bi bi-sliders fs-5"></i>
            </button>
          </div>
        </div>

        <div className="w-100">

          {/* Loading State */}
          {loading && (
            <div className="modern-grid">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-5 mt-4 rounded-4 stagger-fade-in" style={{ border: '2px dashed var(--danger-light)', backgroundColor: 'var(--danger-light)' }}>
              <div className="text-danger mb-3"><i className="bi bi-hdd-network-fill" style={{ fontSize: '3.5rem' }}></i></div>
              <h5 className="fw-bold text-danger">Connection Error</h5>
              <p className="mb-4 text-danger fw-medium">We couldn't retrieve your status from the server.</p>
              <button className="btn btn-danger rounded-pill px-5 py-2 fw-bold shadow-sm" onClick={fetchLibrary}>
                <i className="bi bi-arrow-clockwise me-2"></i>Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-5 mt-4 rounded-4 stagger-fade-in" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
              <div className="mb-3 text-muted opacity-50">
                <i className="bi bi-folder-x" style={{ fontSize: '4.5rem' }}></i>
              </div>
              <h5 className="fw-bolder" style={{ color: 'var(--text-main)' }}>Your Databases are Empty</h5>
              <p className="mb-4 fw-medium" style={{ color: 'var(--text-muted)' }}>You haven't indexed any media files yet. Head over to Upload to get started.</p>
              <button className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm" onClick={() => document.querySelector('.nav-item-custom:nth-child(2)').click()}>
                <i className="bi bi-cloud-arrow-up-fill me-2"></i>Go to Upload
              </button>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && videos.length > 0 && (
            <div className="modern-grid">
              {filteredVideos.length === 0 ? (
                <div className="col-12 text-center py-5 w-100 stagger-fade-in rounded-4" style={{ gridColumn: '1 / -1', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <i className="bi bi-search text-muted fs-1 opacity-25 d-block mb-3"></i>
                  <span className="fs-5" style={{ color: 'var(--text-muted)' }}>No matches found for "<strong className="text-primary">{filterTerm}</strong>"</span>
                  <div className="mt-3">
                    <button className="btn btn-adaptive rounded-pill px-4 fw-medium" onClick={() => setFilterTerm('')}>Clear Search</button>
                  </div>
                </div>
              ) : (
                filteredVideos.map((v, i) => (
                  <div className="lib-card-modern stagger-fade-in" key={`${v.sourceId}-${v.dbName}-${i}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div>
                      <div className="d-flex gap-3 mb-3">
                        <div className="lib-icon-box shadow-sm">
                          <i className="bi bi-collection-play-fill"></i>
                        </div>
                        <div className="w-100 overflow-hidden d-flex flex-column justify-content-center">
                          <h6 className="fw-bold text-truncate mb-1" title={v.name || 'Unknown Video'} style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                            {v.name || 'Unknown Video'}
                          </h6>
                          <div className="small text-truncate fw-medium" title={v.sourceId} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <i className="bi bi-fingerprint me-1"></i>{v.sourceId}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Badges */}
                      <div className="mb-4 d-flex flex-wrap gap-2">
                        <span className="badge-db-modern shadow-sm" title="Database Name">
                          <i className="bi bi-database text-primary"></i>{v.dbName}
                        </span>
                        {v.indexTypes && v.indexTypes.map(it => (
                          <span key={it} className="badge-db-modern shadow-sm">
                            <i className={`bi ${it === 'video' ? 'bi-camera-video-fill text-primary' : 'bi-chat-text-fill text-info'}`}></i>
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn w-100 btn-delete-modern py-2 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleDelete(v.sourceId, v.dbName, v.indexTypes)}
                      title="Remove Video"
                    >
                      <i className="bi bi-trash3-fill"></i> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}