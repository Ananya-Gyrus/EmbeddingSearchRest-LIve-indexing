import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

/* ─── Styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .sp-wrapper {
    font-family: 'DM Sans', sans-serif;
    animation: sp-fade 0.4s ease both;
  }

  @keyframes sp-fade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .sp-header {
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 16px;
    margin-bottom: 32px; flex-wrap: wrap;
  }

  .sp-title {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 28px; letter-spacing: -0.8px; line-height: 1;
    color: #e8eaf2; margin-bottom: 6px;
  }

  .sp-subtitle { font-size: 13.5px; color: rgba(138,150,168,0.75); }

  .sp-settings-btn {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(138,150,168,0.7); font-size: 14px; cursor: pointer;
    transition: all 0.22s ease;
  }

  .sp-settings-btn:hover {
    background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); color: #e8eaf2;
  }

  /* ── Search Panel ── */
  .sp-panel {
    background: rgba(15,21,37,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; overflow: hidden;
    margin-bottom: 36px;
    position: relative;
  }

  .sp-panel::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.4), rgba(167,139,250,0.4), transparent);
  }

  /* ── Tabs ── */
  .sp-tabs {
    display: flex; padding: 20px 24px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    gap: 2px;
  }

  .sp-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 10px 10px 0 0;
    background: transparent; border: 1px solid transparent;
    border-bottom: none; cursor: pointer;
    color: rgba(138,150,168,0.55); font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.22s ease; position: relative;
    bottom: -1px;
  }

  .sp-tab:hover:not(.sp-tab-active) {
    color: rgba(138,150,168,0.9);
    background: rgba(255,255,255,0.03);
  }

  .sp-tab.sp-tab-active {
    background: rgba(22,29,48,1);
    border-color: rgba(255,255,255,0.08);
    border-bottom-color: rgba(22,29,48,1);
    color: var(--accent-color, #4f8ef7);
  }

  .sp-tab.sp-tab-active .sp-tab-icon {
    color: var(--accent-color, #4f8ef7);
  }

  .sp-tab-text { font-size: 13px; }

  /* ── Tab Body ── */
  .sp-tab-body {
    background: rgba(22,29,48,1);
    padding: 28px 28px 24px;
    animation: sp-tab-in 0.3s ease both;
  }

  @keyframes sp-tab-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Field Label ── */
  .sp-label {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: 0.8px; text-transform: uppercase;
    color: rgba(138,150,168,0.6); margin-bottom: 8px;
  }

  /* ── Inputs ── */
  .sp-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 11px; color: #e8eaf2;
    padding: 10px 14px 10px 40px;
    font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: all 0.22s ease;
  }

  .sp-input-bare {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 11px; color: #e8eaf2;
    padding: 10px 14px;
    font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: all 0.22s ease;
  }

  .sp-input::placeholder,
  .sp-input-bare::placeholder { color: rgba(138,150,168,0.3); }

  .sp-input:focus,
  .sp-input-bare:focus {
    border-color: rgba(79,142,247,0.5);
    background: rgba(79,142,247,0.05);
    box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
  }

  .sp-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 11px; color: #e8eaf2;
    padding: 10px 14px; font-size: 13.5px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: all 0.22s ease; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238892a4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }

  .sp-select:focus {
    border-color: rgba(79,142,247,0.5); box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
  }

  .sp-select option { background: #0f1525; }

  .sp-input-icon-wrap { position: relative; }

  .sp-input-icon {
    position: absolute; left: 13px; top: 50%;
    transform: translateY(-50%);
    color: rgba(138,150,168,0.4); font-size: 13px;
    pointer-events: none;
  }

  /* ── Search button ── */
  .sp-btn-search {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 28px; border-radius: 12px;
    background: linear-gradient(135deg, #4f8ef7, #7b6cf6);
    border: none; color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 18px rgba(79,142,247,0.3);
  }

  .sp-btn-search:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,142,247,0.45);
    background: linear-gradient(135deg, #6ba3ff, #9283f8);
  }

  .sp-btn-search:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

  /* ── Dropzone ── */
  .sp-dropzone {
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 18px;
    background: rgba(255,255,255,0.02);
    min-height: 200px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s ease;
    padding: 32px 24px; text-align: center;
  }

  .sp-dropzone:hover, .sp-dropzone.drag-over {
    border-color: rgba(79,142,247,0.45);
    background: rgba(79,142,247,0.05);
  }

  .sp-dropzone-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: rgba(79,142,247,0.1); border: 1px solid rgba(79,142,247,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #4f8ef7; margin-bottom: 16px;
  }

  .sp-dropzone-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
    color: #e8eaf2; margin-bottom: 6px;
  }

  .sp-dropzone-sub { font-size: 12.5px; color: rgba(138,150,168,0.55); margin-bottom: 16px; }

  .sp-browse-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 18px; border-radius: 10px;
    background: rgba(79,142,247,0.1);
    border: 1px solid rgba(79,142,247,0.2);
    color: #4f8ef7; font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.22s ease;
  }

  .sp-browse-btn:hover { background: rgba(79,142,247,0.18); border-color: rgba(79,142,247,0.35); }

  /* ── Image preview pane ── */
  .sp-preview-pane {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 20px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    min-height: 200px;
  }

  .sp-preview-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(138,150,168,0.45);
    align-self: flex-start;
  }

  .sp-preview-img {
    width: 100%; max-height: 130px; object-fit: contain;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
  }

  .sp-preview-empty {
    width: 100%; height: 120px; border-radius: 10px;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    color: rgba(138,150,168,0.2); font-size: 28px;
  }

  /* ── Audio search ── */
  .sp-audio-panel {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 36px 28px;
    text-align: center;
  }

  .sp-audio-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: #a78bfa; margin: 0 auto 16px;
  }

  .sp-audio-row {
    display: flex; gap: 12px; align-items: center;
    justify-content: center; flex-wrap: wrap; margin-top: 20px;
  }

  /* ── Results ── */
  .sp-results-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px;
  }

  .sp-results-title {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 16px; letter-spacing: -0.3px; color: #e8eaf2;
  }

  .sp-results-count {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 20px; font-size: 12px; font-weight: 600;
    background: rgba(79,142,247,0.1); border: 1px solid rgba(79,142,247,0.2);
    color: #4f8ef7;
  }

  .sp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 16px; margin-bottom: 32px;
  }

  /* ── Result Card ── */
  .sp-card {
    background: rgba(22,29,48,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; overflow: hidden;
    cursor: pointer; transition: all 0.25s ease;
    display: flex; flex-direction: column;
    animation: sp-card-in 0.4s ease both;
  }

  @keyframes sp-card-in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sp-card:hover {
    border-color: rgba(79,142,247,0.25);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.35);
  }

  /* Thumbnail */
  .sp-thumb-wrap {
    position: relative; aspect-ratio: 16/9;
    background: #000; overflow: hidden;
  }

  .sp-thumb-img {
    width: 100%; height: 100%; object-fit: cover;
    opacity: 0.8; transition: transform 0.5s ease, opacity 0.3s ease;
    display: block;
  }

  .sp-card:hover .sp-thumb-img { transform: scale(1.06); opacity: 0.55; }

  .sp-play-overlay {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.7);
    opacity: 0; transition: all 0.3s ease;
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 22px;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .sp-card:hover .sp-play-overlay {
    opacity: 1; transform: translate(-50%, -50%) scale(1);
  }

  .sp-ts-badge {
    position: absolute; bottom: 8px; right: 8px;
    background: rgba(0,0,0,0.72); color: #fff;
    padding: 3px 8px; border-radius: 6px;
    font-size: 11.5px; font-weight: 600;
    backdrop-filter: blur(4px);
    display: flex; align-items: center; gap: 5px;
  }

  /* Card body */
  .sp-card-body { padding: 14px 16px 16px; flex: 1; display: flex; flex-direction: column; }

  .sp-card-filename {
    font-weight: 600; font-size: 13.5px; color: #e8eaf2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 10px;
  }

  .sp-badge-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

  .sp-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 6px;
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.3px; text-transform: uppercase;
  }

  .sp-badge-db      { background: rgba(79,142,247,0.12);  color: #4f8ef7;  border: 1px solid rgba(79,142,247,0.2); }
  .sp-badge-source  { background: rgba(52,211,153,0.1);   color: #34d399;  border: 1px solid rgba(52,211,153,0.18); }
  .sp-badge-score   { background: rgba(251,146,60,0.1);   color: #fb923c;  border: 1px solid rgba(251,146,60,0.18); }

  .sp-filepath {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    font-size: 11.5px; color: rgba(138,150,168,0.55);
    cursor: pointer; transition: all 0.22s ease;
    margin-top: auto; overflow: hidden;
  }

  .sp-filepath:hover {
    background: rgba(79,142,247,0.07);
    border-color: rgba(79,142,247,0.2);
    color: #4f8ef7;
  }

  .sp-filepath-text {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
  }

  /* ── Load more ── */
  .sp-load-more-wrap { text-align: center; padding-bottom: 32px; }

  .sp-btn-loadmore {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 32px; border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(138,150,168,0.8); font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.22s ease;
  }

  .sp-btn-loadmore:hover:not(:disabled) {
    background: rgba(255,255,255,0.08); color: #e8eaf2; border-color: rgba(255,255,255,0.16);
  }

  .sp-btn-loadmore:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Empty/Loading states ── */
  .sp-state-box {
    grid-column: 1 / -1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 56px 24px; text-align: center;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.07);
    border-radius: 20px;
  }

  .sp-state-icon {
    font-size: 36px; color: rgba(138,150,168,0.2);
    margin-bottom: 16px;
  }

  .sp-state-text { font-size: 14px; color: rgba(138,150,168,0.5); }

  /* ── Grid row layout ── */
  .sp-grid-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px; margin-bottom: 20px;
  }

  @media (max-width: 900px) { .sp-grid-row { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .sp-grid-row { grid-template-columns: 1fr; } }

  .sp-image-search-grid {
    display: grid; grid-template-columns: 1fr 280px;
    gap: 16px; align-items: stretch;
  }

  @media (max-width: 700px) { .sp-image-search-grid { grid-template-columns: 1fr; } }

  /* ── Spinner ── */
  .sp-spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(79,142,247,0.15);
    border-top-color: #4f8ef7;
    border-radius: 50%;
    animation: sp-spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes sp-spin { to { transform: rotate(360deg); } }

  /* ── Video Modal ── */
  .sp-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.88); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
    animation: sp-fade 0.25s ease;
  }

  .sp-modal-box {
    background: #080c18; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; overflow: hidden;
    width: 100%; max-width: 900px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.7);
    animation: sp-modal-in 0.3s cubic-bezier(0.34,1.3,0.64,1) both;
  }

  @keyframes sp-modal-in {
    from { opacity: 0; transform: scale(0.93) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .sp-modal-header {
    padding: 18px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: linear-gradient(to bottom, rgba(255,255,255,0.03), transparent);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  }

  .sp-modal-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
    color: #e8eaf2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .sp-modal-meta {
    display: flex; gap: 16px; margin-top: 5px; flex-wrap: wrap;
  }

  .sp-modal-meta-item {
    font-size: 12px; color: rgba(138,150,168,0.55);
    display: flex; align-items: center; gap: 5px;
  }

  .sp-modal-close {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(138,150,168,0.7); font-size: 13px;
    transition: all 0.22s ease;
  }

  .sp-modal-close:hover { background: rgba(255,255,255,0.1); color: #e8eaf2; }
`;

/* ─── Swal dark config ────────────────────────────────────────────────── */
const swalDark = {
  background: '#0f1525',
  color: '#e8eaf2',
  confirmButtonColor: '#4f8ef7',
  customClass: { popup: 'sp-swal-popup' }
};

const SWAL_STYLE = `
  .sp-swal-popup {
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 20px !important;
    font-family: 'DM Sans', sans-serif !important;
  }
`;

/* ─── Tab config ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'text',  label: 'Semantic Text',   icon: 'bi-fonts',     accentColor: '#4f8ef7' },
  { id: 'image', label: 'Image Match',     icon: 'bi-image',     accentColor: '#a78bfa' },
  { id: 'audio', label: 'Audio Pattern',   icon: 'bi-mic',       accentColor: '#34d399' },
];

/* ─── SearchPage ──────────────────────────────────────────────────────── */
export default function SearchPage({ backendConfig, setShowSettings }) {
  const PAGE_LIMIT = 12;
  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  const [activeTab, setActiveTab]   = useState('text');
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const [dbList, setDbList]         = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [filters, setFilters]       = useState({ query: '', dbName: '*', sourceId: '*' });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isDragOver, setIsDragOver]       = useState(false);

  const [videoModal, setVideoModal] = useState({ open: false, url: '', title: '', startTime: 0, meta: {} });
  const videoRef = useRef(null);

  useEffect(() => { fetchFilters(); }, [backendConfig]);

  const fetchFilters = async () => {
    try {
      const res = await fetch(`${apiBase}/list-indexed`);
      const data = await res.json();
      if (data.videos) {
        setDbList([...new Set(data.videos.map(v => v.dbName))]);
        setSourceList([...new Set(data.videos.map(v => v.sourceId))]);
      }
    } catch (e) { console.warn('Failed to load filters', e); }
  };

  const handleTextSearch = async (isLoadMore = false) => {
    const startIdx = isLoadMore ? (page * PAGE_LIMIT) + 1 : 1;
    if (!isLoadMore) { setResults([]); setPage(1); }
    setLoading(true); setHasSearched(true);

    try {
      const payload = {
        query: filters.query,
        startIndex: startIdx,
        limit: PAGE_LIMIT,
        dbName: filters.dbName === '*' ? undefined : filters.dbName,
      };
      const res = await fetch(`${apiBase}/textsearch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const newResults = data.results || data;
      setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
      if (isLoadMore) setPage(prev => prev + 1);
    } catch (e) {
      Swal.fire({ ...swalDark, title: 'Search Failed', text: e.message, icon: 'error', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
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
    return (j.uploaded?.[0]?.storedPath) || (j.saved?.[0]?.saved);
  };

  const handleMediaSearch = async (type) => {
    const file = type === 'image' ? selectedImage : selectedAudio;
    if (!file) {
      Swal.fire({ ...swalDark, text: `Please select an ${type} file first`, icon: 'warning' });
      return;
    }
    setLoading(true); setResults([]); setHasSearched(true);
    try {
      const savedPath = await uploadFile(file);
      const endpoint  = type === 'image' ? '/imagesearch' : '/audiosearch';
      const payloadKey = type === 'image' ? 'image_path' : 'audio_path';
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: savedPath, startIndex: 1, limit: PAGE_LIMIT }),
      });
      const data = await res.json();
      setResults(data.results || data);
    } catch (e) {
      Swal.fire({ ...swalDark, text: `${type} search failed: ${e.message}`, icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
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
    if (r.metadata?.video_path_relative) {
      url = r.metadata.video_path_relative.startsWith('http')
        ? r.metadata.video_path_relative
        : `${apiBase}${r.metadata.video_path_relative.startsWith('/') ? '' : '/'}${r.metadata.video_path_relative}`;
    }
    if (!url) { Swal.fire({ ...swalDark, text: 'No video URL found in metadata', icon: 'error' }); return; }
    setVideoModal({ open: true, url, title: r.metadata.video_filename || 'Video', startTime: r.metadata.start_time_sec || 0, meta: r.metadata });
  };

  const formatTime = (s) => {
    if (s == null) return '--:--';
    const sec = Math.floor(s);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <>
      <style>{STYLES}</style>
      <style>{SWAL_STYLE}</style>

      <div className="sp-wrapper">

        {/* ── Header ── */}
        <div className="sp-header">
          <div>
            <h1 className="sp-title">Global Search</h1>
            <p className="sp-subtitle">Find specific moments across all indexed media</p>
          </div>
          <button className="sp-settings-btn" onClick={() => setShowSettings(true)} title="Settings">
            <i className="bi bi-sliders"></i>
          </button>
        </div>

        {/* ── Search Panel ── */}
        <div className="sp-panel" style={{ '--accent-color': activeTabData?.accentColor }}>

          {/* Tabs */}
          <div className="sp-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`sp-tab ${activeTab === tab.id ? 'sp-tab-active' : ''}`}
                style={{ '--accent-color': tab.accentColor }}
                onClick={() => { setActiveTab(tab.id); setResults([]); setHasSearched(false); }}
              >
                <i className={`bi ${tab.icon} sp-tab-icon`}></i>
                <span className="sp-tab-text">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab: Text */}
          {activeTab === 'text' && (
            <div className="sp-tab-body">
              <div className="sp-grid-row">
                <div style={{ gridColumn: '1 / 2' }}>
                  <label className="sp-label">Search Query</label>
                  <div className="sp-input-icon-wrap">
                    <i className="bi bi-search sp-input-icon"></i>
                    <input
                      className="sp-input"
                      placeholder="Describe a scene (e.g. red car driving fast)…"
                      value={filters.query}
                      onChange={e => setFilters({ ...filters, query: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleTextSearch(false)}
                    />
                  </div>
                </div>
                <div>
                  <label className="sp-label">Database</label>
                  <select className="sp-select" value={filters.dbName} onChange={e => setFilters({ ...filters, dbName: e.target.value })}>
                    <option value="*">All Databases</option>
                    {dbList.map(db => <option key={db} value={db}>{db}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sp-label">Source ID</label>
                  <select className="sp-select" value={filters.sourceId} onChange={e => setFilters({ ...filters, sourceId: e.target.value })}>
                    <option value="*">All Sources</option>
                    {sourceList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="sp-btn-search" onClick={() => handleTextSearch(false)} disabled={loading || !filters.query.trim()}>
                  {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.7s linear infinite' }}></span> Searching…</> : <><i className="bi bi-search"></i> Search Library</>}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Image */}
          {activeTab === 'image' && (
            <div className="sp-tab-body">
              <div className="sp-image-search-grid">
                <div
                  className={`sp-dropzone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleImageDrop}
                  onClick={() => document.getElementById('sp-image-input').click()}
                >
                  <div className="sp-dropzone-icon"><i className="bi bi-cloud-arrow-up"></i></div>
                  <div className="sp-dropzone-title">Drag & Drop Image</div>
                  <div className="sp-dropzone-sub">or click to browse files from your computer</div>
                  <div className="sp-browse-btn"><i className="bi bi-folder2-open"></i> Browse Files</div>
                  <input id="sp-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                </div>

                <div className="sp-preview-pane">
                  <div className="sp-preview-label">Preview</div>
                  {imagePreview
                    ? <img src={imagePreview} className="sp-preview-img" alt="Preview" />
                    : <div className="sp-preview-empty"><i className="bi bi-image"></i></div>
                  }
                  <button className="sp-btn-search" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleMediaSearch('image')} disabled={!selectedImage || loading}>
                    {loading ? 'Searching…' : <><i className="bi bi-search"></i> Find Matches</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Audio */}
          {activeTab === 'audio' && (
            <div className="sp-tab-body">
              <div className="sp-audio-panel">
                <div className="sp-audio-icon"><i className="bi bi-music-note-beamed"></i></div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e8eaf2', marginBottom: 6 }}>
                  Upload Audio Reference
                </div>
                <div style={{ fontSize: 13, color: 'rgba(138,150,168,0.55)', marginBottom: 20 }}>
                  Find video segments matching this specific audio fingerprint
                </div>
                <div className="sp-audio-row">
                  <input type="file" accept="audio/*" className="sp-input-bare" style={{ maxWidth: 300 }}
                    onChange={e => setSelectedAudio(e.target.files[0])} />
                  <button className="sp-btn-search" onClick={() => handleMediaSearch('audio')} disabled={!selectedAudio || loading}>
                    {loading ? 'Analyzing…' : <><i className="bi bi-magic"></i> Analyze &amp; Search</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {(hasSearched || results.length > 0) && (
          <div className="sp-results-header">
            <span className="sp-results-title">Results</span>
            {results.length > 0 && (
              <span className="sp-results-count">
                <i className="bi bi-collection-play"></i>
                {results.length} match{results.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        )}

        <div className="sp-grid">
          {/* Loading */}
          {loading && results.length === 0 && (
            <div className="sp-state-box">
              <div className="sp-spinner"></div>
              <div className="sp-state-text">Scanning databases…</div>
            </div>
          )}

          {/* Empty */}
          {!loading && hasSearched && results.length === 0 && (
            <div className="sp-state-box">
              <div className="sp-state-icon"><i className="bi bi-search"></i></div>
              <div className="sp-state-text">No results found. Try adjusting your search parameters.</div>
            </div>
          )}

          {/* Cards */}
          {results.map((r, idx) => {
            const score   = Math.round((r.score || 0) * 100) / 100;
            const timeStr = `${formatTime(r.metadata.start_time_sec)} – ${formatTime(r.metadata.end_time_sec)}`;
            const filePath = r.metadata?.video_path_relative || '';

            const handleOpenPath = async (e) => {
              e.stopPropagation();
              try {
                await fetch(`${apiBase}/api/open-file-location`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }),
                });
              } catch (err) { console.error('Failed to open path:', err); }
            };

            return (
              <div
                key={idx}
                className="sp-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => openPlayer(r)}
              >
                {/* Thumbnail */}
                <div className="sp-thumb-wrap">
                  <img
                    className="sp-thumb-img"
                    src={r.thumbnail || ''}
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    alt="thumbnail"
                  />
                  <div className="sp-play-overlay"><i className="bi bi-play-fill"></i></div>
                  <div className="sp-ts-badge"><i className="bi bi-clock"></i>{timeStr}</div>
                </div>

                {/* Body */}
                <div className="sp-card-body">
                  <div className="sp-card-filename" title={r.metadata.video_filename}>
                    {r.metadata.video_filename || 'Unknown Video'}
                  </div>
                  <div className="sp-badge-row">
                    <span className="sp-badge sp-badge-db" title={r.metadata.database}>
                      <i className="bi bi-database"></i>{r.metadata.database}
                    </span>
                    <span className="sp-badge sp-badge-source" title={r.metadata.source_id}>
                      <i className="bi bi-fingerprint"></i>{r.metadata.source_id}
                    </span>
                    <span className="sp-badge sp-badge-score">
                      <i className="bi bi-star-fill"></i>{score}
                    </span>
                  </div>
                  <div className="sp-filepath" onClick={handleOpenPath} title="Open file location">
                    <i className="bi bi-folder2-open" style={{ flexShrink: 0 }}></i>
                    <span className="sp-filepath-text">{filePath}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {results.length > 0 && activeTab === 'text' && (
          <div className="sp-load-more-wrap">
            <button className="sp-btn-loadmore" onClick={() => handleTextSearch(true)} disabled={loading}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.7s linear infinite' }}></span> Loading…</>
                : <><i className="bi bi-chevron-down"></i> Load More Results</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Video Player Modal ── */}
      {videoModal.open && (
        <div className="sp-modal-overlay" onClick={e => e.target === e.currentTarget && setVideoModal({ ...videoModal, open: false })}>
          <div className="sp-modal-box">
            <div className="sp-modal-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sp-modal-title">{videoModal.title}</div>
                <div className="sp-modal-meta">
                  <span className="sp-modal-meta-item">
                    <i className="bi bi-play-circle"></i> Starts @ {formatTime(videoModal.startTime)}
                  </span>
                  <span className="sp-modal-meta-item">
                    <i className="bi bi-fingerprint"></i> {videoModal.meta.source_id}
                  </span>
                  <span className="sp-modal-meta-item">
                    <i className="bi bi-database"></i> {videoModal.meta.database}
                  </span>
                </div>
              </div>
              <button className="sp-modal-close" onClick={() => setVideoModal({ ...videoModal, open: false })}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '45vh' }}>
              <video
                ref={videoRef}
                src={videoModal.url}
                controls autoPlay
                style={{ maxHeight: '72vh', maxWidth: '100%', outline: 'none', display: 'block' }}
                onLoadedMetadata={e => { e.target.currentTime = Number(videoModal.startTime); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
