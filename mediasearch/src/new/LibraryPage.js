import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

/* ─── Styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .lib-wrapper {
    font-family: 'DM Sans', sans-serif;
    animation: lib-fade 0.4s ease both;
  }

  @keyframes lib-fade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Page Header ── */
  .lib-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }

  .lib-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 28px;
    letter-spacing: -0.8px; line-height: 1;
    color: #e8eaf2; margin-bottom: 6px;
  }

  .lib-subtitle {
    font-size: 13.5px;
    color: rgba(138,150,168,0.75);
  }

  /* ── Toolbar ── */
  .lib-toolbar {
    display: flex; gap: 10px; align-items: center;
    flex-wrap: wrap;
  }

  .lib-search {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0 14px;
    height: 40px;
    width: 260px;
    transition: border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .lib-search:focus-within {
    border-color: rgba(79,142,247,0.5);
    box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
  }

  .lib-search-icon { color: rgba(138,150,168,0.5); font-size: 13px; flex-shrink: 0; }

  .lib-search input {
    background: transparent; border: none; outline: none;
    color: #e8eaf2; font-size: 13.5px;
    font-family: 'DM Sans', sans-serif; width: 100%;
  }

  .lib-search input::placeholder { color: rgba(138,150,168,0.35); }

  .lib-icon-btn {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(138,150,168,0.7); font-size: 14px;
    cursor: pointer;
    transition: all 0.22s ease;
  }

  .lib-icon-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14);
    color: #e8eaf2;
  }

  .lib-icon-btn.spinning i { animation: lib-spin 0.6s linear infinite; }
  @keyframes lib-spin { to { transform: rotate(360deg); } }

  /* ── Stats bar ── */
  .lib-stats-bar {
    display: flex; gap: 6px; align-items: center;
    margin-bottom: 24px;
  }

  .lib-count-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    background: rgba(79,142,247,0.1);
    border: 1px solid rgba(79,142,247,0.2);
    color: #4f8ef7;
  }

  .lib-filter-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    background: rgba(251,146,60,0.1);
    border: 1px solid rgba(251,146,60,0.2);
    color: #fb923c;
  }

  /* ── Grid ── */
  .lib-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  /* ── Skeleton ── */
  .lib-skeleton {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px;
    padding: 20px;
    height: 148px;
    display: flex; flex-direction: column; justify-content: space-between;
  }

  .lib-shimmer {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: lib-shimmer 1.6s infinite;
    border-radius: 6px;
  }

  @keyframes lib-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Library Card ── */
  .lib-card {
    background: rgba(22,29,48,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    padding: 20px;
    display: flex; flex-direction: column; justify-content: space-between;
    transition: all 0.25s ease;
    position: relative; overflow: hidden;
    animation: lib-card-in 0.4s ease both;
    cursor: default;
  }

  @keyframes lib-card-in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .lib-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.25), transparent);
    opacity: 0; transition: opacity 0.3s;
  }

  .lib-card:hover {
    border-color: rgba(79,142,247,0.2);
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  }

  .lib-card:hover::before { opacity: 1; }

  /* ── Card thumb ── */
  .lib-card-thumb {
    width: 46px; height: 46px;
    border-radius: 12px;
    background: rgba(79,142,247,0.12);
    border: 1px solid rgba(79,142,247,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #4f8ef7;
    flex-shrink: 0;
  }

  .lib-card-name {
    font-weight: 600; font-size: 14px;
    color: #e8eaf2; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .lib-card-id {
    font-size: 12px; color: rgba(138,150,168,0.6);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .lib-db-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.4px; text-transform: uppercase;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(138,150,168,0.7);
  }

  /* ── Delete button ── */
  .lib-btn-delete {
    width: 100%; display: flex; align-items: center;
    justify-content: center; gap: 7px;
    padding: 9px 16px; border-radius: 11px;
    background: rgba(244,114,182,0.07);
    border: 1px solid rgba(244,114,182,0.15);
    color: rgba(244,114,182,0.7);
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.22s ease;
  }

  .lib-btn-delete:hover {
    background: rgba(244,114,182,0.15);
    border-color: rgba(244,114,182,0.35);
    color: #f472b6;
    box-shadow: 0 4px 16px rgba(244,114,182,0.15);
  }

  /* ── Empty / Error states ── */
  .lib-state-box {
    grid-column: 1 / -1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 64px 24px; text-align: center;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 20px;
  }

  .lib-state-icon {
    width: 64px; height: 64px;
    border-radius: 18px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(138,150,168,0.4);
  }

  .lib-state-icon-error {
    background: rgba(244,114,182,0.08);
    border-color: rgba(244,114,182,0.15);
    color: rgba(244,114,182,0.6);
  }

  .lib-state-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 16px;
    color: rgba(232,234,242,0.8); margin-bottom: 8px;
  }

  .lib-state-desc {
    font-size: 13px;
    color: rgba(138,150,168,0.55);
    max-width: 280px; line-height: 1.6;
    margin-bottom: 24px;
  }

  .lib-btn-retry {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 20px; border-radius: 11px;
    background: rgba(244,114,182,0.1);
    border: 1px solid rgba(244,114,182,0.2);
    color: #f472b6; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.22s ease;
  }

  .lib-btn-retry:hover {
    background: rgba(244,114,182,0.18);
    border-color: rgba(244,114,182,0.35);
  }

  .lib-btn-upload {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 22px; border-radius: 12px;
    background: linear-gradient(135deg, #4f8ef7, #7b6cf6);
    border: none; color: #fff; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 18px rgba(79,142,247,0.3);
  }

  .lib-btn-upload:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 26px rgba(79,142,247,0.45);
  }

  .lib-no-match {
    grid-column: 1 / -1;
    text-align: center; padding: 48px 24px;
    color: rgba(138,150,168,0.5);
    font-size: 14px;
  }

  .lib-no-match i { font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.4; }
`;

/* ─── Swal Dark Theme ─────────────────────────────────────────────────── */
const swalDark = {
  background: '#0f1525',
  color: '#e8eaf2',
  confirmButtonColor: '#f472b6',
  cancelButtonColor: 'rgba(255,255,255,0.08)',
  customClass: {
    popup: 'swal2-dark-popup',
    confirmButton: 'swal2-dark-confirm',
    cancelButton: 'swal2-dark-cancel',
  }
};

const SWAL_STYLE = `
  .swal2-dark-popup {
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 20px !important;
    font-family: 'DM Sans', sans-serif !important;
  }
  .swal2-dark-confirm {
    border-radius: 10px !important; font-weight: 600 !important;
    padding: 10px 22px !important;
  }
  .swal2-dark-cancel {
    border-radius: 10px !important; font-weight: 600 !important;
    padding: 10px 22px !important; color: rgba(138,150,168,0.8) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
  }
`;

/* ─── Skeleton Card ───────────────────────────────────────────────────── */
const SkeletonCard = ({ delay = 0 }) => (
  <div className="lib-skeleton" style={{ animationDelay: `${delay}s` }}>
    <div style={{ display: 'flex', gap: 12 }}>
      <div className="lib-shimmer" style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }}></div>
      <div style={{ flex: 1 }}>
        <div className="lib-shimmer" style={{ height: 14, width: '70%', marginBottom: 8 }}></div>
        <div className="lib-shimmer" style={{ height: 11, width: '45%', marginBottom: 12 }}></div>
        <div className="lib-shimmer" style={{ height: 22, width: '35%', borderRadius: 20 }}></div>
      </div>
    </div>
    <div className="lib-shimmer" style={{ height: 36, borderRadius: 11 }}></div>
  </div>
);

/* ─── LibraryPage ─────────────────────────────────────────────────────── */
export default function LibraryPage({ backendConfig, setShowSettings }) {
  const [videos, setVideos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [error, setError]           = useState(false);

  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  const fetchLibrary = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${apiBase}/list-indexed`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLibrary(); }, [backendConfig]);

  const handleDelete = async (sourceId, dbName) => {
    const result = await Swal.fire({
      ...swalDark,
      title: 'Remove Index?',
      html: `<span style="font-size:14px;color:rgba(138,150,168,0.8)">This will permanently remove <strong style="color:#e8eaf2">${sourceId}</strong> from the index.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`${apiBase}/remove-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, dbName, indexType: 'both' }),
      });
      setVideos(prev => prev.filter(v => v.sourceId !== sourceId));
      Swal.fire({
        ...swalDark,
        title: 'Removed',
        html: '<span style="font-size:14px;color:rgba(138,150,168,0.8)">The index has been successfully removed.</span>',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        ...swalDark,
        title: 'Error',
        html: '<span style="font-size:14px;color:rgba(138,150,168,0.8)">Failed to delete the index. Please try again.</span>',
        icon: 'error',
      });
    }
  };

  const filteredVideos = videos.filter(v =>
    v.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
    v.sourceId.toLowerCase().includes(filterTerm.toLowerCase()) ||
    v.dbName.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const isFiltering = filterTerm.trim().length > 0;

  return (
    <>
      <style>{STYLES}</style>
      <style>{SWAL_STYLE}</style>

      <div className="lib-wrapper">

        {/* ── Header ── */}
        <div className="lib-header">
          <div>
            <h1 className="lib-title">Media Library</h1>
            <p className="lib-subtitle">Manage and monitor your indexed video databases</p>
          </div>
          <div className="lib-toolbar">
            <div className="lib-search">
              <i className="bi bi-search lib-search-icon"></i>
              <input
                type="text"
                placeholder="Search name, ID or DB…"
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
              />
              {filterTerm && (
                <i className="bi bi-x-lg lib-search-icon" style={{ cursor: 'pointer' }} onClick={() => setFilterTerm('')}></i>
              )}
            </div>
            <button className={`lib-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={() => fetchLibrary(true)} title="Refresh">
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button className="lib-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              <i className="bi bi-sliders"></i>
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        {!loading && !error && videos.length > 0 && (
          <div className="lib-stats-bar">
            <div className="lib-count-chip">
              <i className="bi bi-collection-play"></i>
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} indexed
            </div>
            {isFiltering && (
              <div className="lib-filter-chip">
                <i className="bi bi-funnel"></i>
                {filteredVideos.length} match{filteredVideos.length !== 1 ? 'es' : ''}
              </div>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="lib-grid">

          {/* Loading */}
          {loading && [...Array(8)].map((_, i) => (
            <SkeletonCard key={i} delay={i * 0.04} />
          ))}

          {/* Error */}
          {!loading && error && (
            <div className="lib-state-box">
              <div className="lib-state-icon lib-state-icon-error">
                <i className="bi bi-cloud-slash"></i>
              </div>
              <div className="lib-state-title">Connection Error</div>
              <div className="lib-state-desc">
                Couldn't retrieve your library from the server. Check your backend connection and try again.
              </div>
              <button className="lib-btn-retry" onClick={() => fetchLibrary()}>
                <i className="bi bi-arrow-clockwise"></i> Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && videos.length === 0 && (
            <div className="lib-state-box">
              <div className="lib-state-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <div className="lib-state-title">Library is Empty</div>
              <div className="lib-state-desc">
                You haven't indexed any media files yet. Upload and index a video to get started.
              </div>
              <button className="lib-btn-upload" onClick={() => setShowSettings(false)}>
                <i className="bi bi-cloud-upload"></i> Upload & Index
              </button>
            </div>
          )}

          {/* No search matches */}
          {!loading && !error && videos.length > 0 && isFiltering && filteredVideos.length === 0 && (
            <div className="lib-no-match">
              <i className="bi bi-search"></i>
              No results for <strong style={{ color: 'rgba(232,234,242,0.7)' }}>"{filterTerm}"</strong>
            </div>
          )}

          {/* Cards */}
          {!loading && !error && filteredVideos.map((v, i) => (
            <div
              className="lib-card"
              key={v.sourceId || i}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Top section */}
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div className="lib-card-thumb">
                    <i className="bi bi-play-circle-fill"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="lib-card-name" title={v.name}>{v.name}</div>
                    <div className="lib-card-id" title={v.sourceId}>
                      <i className="bi bi-fingerprint" style={{ marginRight: 4, opacity: 0.5 }}></i>
                      {v.sourceId}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <span className="lib-db-badge">
                    <i className="bi bi-database"></i>
                    {v.dbName}
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                className="lib-btn-delete"
                onClick={() => handleDelete(v.sourceId, v.dbName)}
              >
                <i className="bi bi-trash3"></i>
                Remove Index
              </button>
            </div>
          ))}

        </div>
      </div>
    </>
  );
}
