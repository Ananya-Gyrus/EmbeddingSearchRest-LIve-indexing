import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// --- Embedded Modern CSS ---
const modernLibraryStyles = `
  .library-wrapper {
    animation: fadeIn 0.4s ease-out forwards;
  }

  .modern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  /* Shimmer Skeleton */
  .sk-card-modern {
    background-color: var(--card-bg, #ffffff);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, #e2e8f0);
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .shimmer {
    background: linear-gradient(90deg, var(--border-color, #e2e8f0) 25%, var(--bg-main, #f4f7fe) 50%, var(--border-color, #e2e8f0) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Modern Card */
  .lib-card-modern {
    background-color: var(--card-bg, #ffffff);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, #e2e8f0);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .lib-card-modern:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.08);
    border-color: var(--primary-light, #e9e3ff);
  }

  .lib-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    background-color: var(--primary-light, #e9e3ff);
    color: var(--primary, #4318FF);
    flex-shrink: 0;
  }

  /* Badges & Inputs */
  .badge-db-modern {
    background-color: var(--bg-main, #f4f7fe);
    color: var(--text-muted, #a3aed1);
    border: 1px solid var(--border-color, #e2e8f0);
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .modern-search-input {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-main, #2b3674);
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  }

  .modern-search-input:focus-within {
    border-color: var(--primary, #4318FF);
    box-shadow: 0 0 0 4px var(--primary-light, #e9e3ff);
  }

  .modern-search-input input {
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
  }

  .modern-search-input input::placeholder {
    color: var(--text-muted, #a3aed1);
  }

  .btn-delete-modern {
    background-color: transparent;
    color: var(--danger, #EE5D50);
    border: 1px solid var(--danger-light, #fdeeee);
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .btn-delete-modern:hover {
    background-color: var(--danger, #EE5D50);
    color: white;
    border-color: var(--danger, #EE5D50);
    box-shadow: 0 4px 12px rgba(238, 93, 80, 0.2);
  }
`;

const SkeletonCard = () => (
  <div className="sk-card-modern">
    <div className="d-flex gap-3">
      <div className="shimmer" style={{ width: '50px', height: '50px', borderRadius: '14px' }}></div>
      <div className="w-100 mt-1">
        <div className="shimmer mb-2" style={{ height: '16px', width: '80%' }}></div>
        <div className="shimmer mb-3" style={{ height: '12px', width: '50%' }}></div>
        <div className="shimmer" style={{ height: '24px', width: '30%', borderRadius: '50px' }}></div>
      </div>
    </div>
    <div className="shimmer mt-4" style={{ height: '38px', width: '100%', borderRadius: '12px' }}></div>
  </div>
);

export default function LibraryPage({ backendConfig, setShowSettings }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [error, setError] = useState(false);

  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  const fetchLibrary = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${apiBase}/list-indexed`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [backendConfig]);

  const handleDelete = async (sourceId, dbName) => {
    const result = await Swal.fire({
      title: 'Remove Index?',
      text: `Are you sure you want to remove "${sourceId}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EE5D50',
      cancelButtonColor: '#a3aed1',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'rounded-4 border-0 shadow-lg',
        confirmButton: 'rounded-pill px-4 fw-bold shadow-sm',
        cancelButton: 'rounded-pill px-4 fw-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        await fetch(`${apiBase}/remove-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, dbName, indexType: 'both' })
        });

        setVideos(prev => prev.filter(v => v.sourceId !== sourceId));

        Swal.fire({
          title: 'Deleted!',
          text: 'The index has been successfully removed.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-4 border-0 shadow-lg' }
        });
      } catch (e) {
        Swal.fire({
          title: 'Error', 
          text: 'Failed to delete the index from the database.', 
          icon: 'error',
          customClass: { popup: 'rounded-4 border-0 shadow-lg' }
        });
      }
    }
  };

  const filteredVideos = videos.filter(v =>
    v.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
    v.sourceId.toLowerCase().includes(filterTerm.toLowerCase()) ||
    v.dbName.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <>
      <style>{modernLibraryStyles}</style>
      <div className="library-wrapper container-fluid px-0">

        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-5">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Media Library</h2>
            <p className="mb-0" style={{ color: 'var(--text-muted)' }}>Manage and monitor your indexed video databases.</p>
          </div>
          
          <div className="d-flex flex-wrap gap-2">
            <div className="modern-search-input d-flex align-items-center px-3 rounded-pill" style={{ width: '280px', height: '42px' }}>
              <i className="bi bi-search text-muted me-2"></i>
              <input
                type="text"
                className="w-100"
                placeholder="Search by name or ID..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-light rounded-pill px-3 shadow-sm border" onClick={fetchLibrary} title="Refresh Library" style={{ height: '42px' }}>
              <i className="bi bi-arrow-clockwise" style={{ color: 'var(--text-main)' }}></i>
            </button>
            <button className="btn btn-light rounded-pill px-3 shadow-sm border" onClick={() => setShowSettings(true)} title="Settings" style={{ height: '42px' }}>
              <i className="bi bi-sliders" style={{ color: 'var(--text-main)' }}></i>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-100">

          {/* Loading State */}
          {loading && (
            <div className="modern-grid">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-5 mt-4 lib-card-modern border-danger" style={{ borderStyle: 'dashed' }}>
              <div className="text-danger mb-3"><i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem' }}></i></div>
              <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Connection Error</h5>
              <p style={{ color: 'var(--text-muted)' }}>We couldn't retrieve your library from the server.</p>
              <button className="btn btn-outline-danger rounded-pill px-4 fw-bold mt-2" onClick={fetchLibrary}>
                <i className="bi bi-arrow-clockwise me-2"></i>Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-5 mt-4 lib-card-modern" style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}>
              <div className="mb-3" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                <i className="bi bi-folder-x" style={{ fontSize: '4rem' }}></i>
              </div>
              <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Your Library is Empty</h5>
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>You haven't indexed any media files yet.</p>
              <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => document.querySelector('.nav-item-custom:nth-child(2)').click()}>
                <i className="bi bi-cloud-arrow-up-fill me-2"></i>Go to Upload
              </button>
            </div>
          )}

          {/* Data Grid */}
          {!loading && !error && videos.length > 0 && (
            <div className="modern-grid">
              {filteredVideos.length === 0 ? (
                <div className="col-12 text-center py-5 w-100" style={{ gridColumn: '1 / -1' }}>
                  <i className="bi bi-search text-muted fs-1 opacity-50 d-block mb-3"></i>
                  <span style={{ color: 'var(--text-muted)' }}>No matches found for "<strong>{filterTerm}</strong>"</span>
                </div>
              ) : (
                filteredVideos.map((v, i) => (
                  <div className="lib-card-modern" key={i} style={{ animationDelay: `${i * 0.05}s`, animation: 'fadeInUp 0.4s ease-out forwards' }}>
                    <div>
                      <div className="d-flex gap-3 mb-3">
                        <div className="lib-icon-box shadow-sm">
                          <i className="bi bi-play-circle-fill"></i>
                        </div>
                        <div className="w-100 overflow-hidden d-flex flex-column justify-content-center">
                          <h6 className="fw-bold text-truncate mb-1" title={v.name} style={{ color: 'var(--text-main)' }}>{v.name}</h6>
                          <div className="small text-truncate" title={v.sourceId} style={{ color: 'var(--text-muted)' }}>
                            <i className="bi bi-fingerprint me-1"></i>{v.sourceId}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <span className="badge-db-modern"><i className="bi bi-database me-1"></i>{v.dbName}</span>
                      </div>
                    </div>

                    <button
                      className="btn w-100 btn-delete-modern py-2 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleDelete(v.sourceId, v.dbName)}
                      title="Delete Index"
                    >
                      <i className="bi bi-trash3-fill"></i> Remove Index
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