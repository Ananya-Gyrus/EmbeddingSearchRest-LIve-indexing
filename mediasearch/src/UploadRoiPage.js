import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { getApiBase } from './apiBase';

const styles = `
  .roi-upload-area {
    border: 3px dashed var(--primary);
    border-radius: 16px;
    padding: 2.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--card-bg);
  }
  .roi-upload-area:hover, .roi-upload-area.dragover {
    border-color: var(--primary);
    background: var(--primary-light);
    transform: scale(1.01);
  }
  .roi-video-container {
    position: relative;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
  }
  .roi-video-container video { width: 100%; display: block; }
  .roi-canvas {
    position: absolute; top: 0; left: 0;
    z-index: 10; pointer-events: none;
  }
  .roi-canvas.drawing-enabled { pointer-events: auto; cursor: crosshair; }
  .roi-instructions {
    background: var(--primary-light);
    border-left: 4px solid var(--primary);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 1rem;
  }
  .roi-item-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    margin-bottom: 10px;
    transition: all 0.2s;
    background: var(--card-bg);
    cursor: pointer;
  }
  .roi-item-registered {
    position: absolute;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.18);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.35);
    font-size: 0.9rem;
  }
  .roi-item-card:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); }
  .roi-preview-img {
    width: 72px; height: 54px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 12px;
    flex-shrink: 0;
  }
  .roi-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 640px) { .roi-grid-2 { grid-template-columns: 1fr; } }
  .char-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
  .char-img-item { position: relative; border-radius: 10px; overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s; }
  .char-img-item:hover { transform: scale(1.04); }
  .char-img-item img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .char-img-num {
    position: absolute; top: 6px; right: 6px;
    background: rgba(79,70,229,0.88); color: #fff;
    padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 700;
  }
`;

function Toast({ toasts }) {
  if (toasts.length === 0) return null;
  
  return ReactDOM.createPortal(
    <div style={{ position:'fixed', top:20, right:20, zIndex:99999, maxWidth: 400 }}>
      {toasts.map((t,i) => (
        <div key={i} className={`alert alert-${t.type} shadow-lg`} style={{ 
          minWidth:280, 
          borderRadius:12, 
          marginBottom:10,
          animation: 'slideInRight 0.3s ease-out',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)'
        }}>
          <strong>{t.title}</strong>: {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function UploadRoiPage({ backendConfig }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [rectInfo, setRectInfo] = useState('No rectangle drawn');
  const [savedRois, setSavedRois] = useState([]);
  const [roiName, setRoiName] = useState('');
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [clearDisabled, setClearDisabled] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [charImagesModal, setCharImagesModal] = useState({ open: false, name: '', images: [], loading: false });
  const [dragover, setDragover] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawRef = useRef({ drawing: false, startX: 0, startY: 0, endX: 0, endY: 0 });

  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const showToast = useCallback((title, message, type = 'info') => {
    const t = { title, message, type: type === 'danger' ? 'danger' : type };
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x !== t)), 4000);
  }, []);

  const loadCharacters = useCallback(async () => {
    try {
      const [savedRes, registeredRes] = await Promise.all([
        fetch(`${apiBase}/get_saved_characters`),
        fetch(`${apiBase}/get_registered_characters`)
      ]);
      const savedJson = await savedRes.json();
      const registeredJson = await registeredRes.json();
      const registeredSet = new Set((registeredJson.characters || []).map(ch => ch.name));
      if (savedJson && savedJson.characters) {
        setSavedRois(savedJson.characters.map(ch => ({
          ...ch,
          registered: registeredSet.has(ch.name)
        })));
      }
    } catch (err) {
      console.error('Error loading saved characters:', err);
      fetch(`${apiBase}/get_saved_characters`)
        .then(r => r.json())
        .then(j => { if (j && j.characters) setSavedRois(j.characters); })
        .catch(() => {});
    }
  }, [apiBase]);

  useEffect(() => { loadCharacters(); }, [loadCharacters]);

  // Sync canvas size
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const sync = () => {
      canvas.width = video.videoWidth || canvas.width;
      canvas.height = video.videoHeight || canvas.height;
      const r = video.getBoundingClientRect();
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
    };
    video.addEventListener('loadedmetadata', sync);
    window.addEventListener('resize', sync);
    return () => { video.removeEventListener('loadedmetadata', sync); window.removeEventListener('resize', sync); };
  }, [videoUrl]);

  function processFile(file) {
    if (!file || !file.type.startsWith('video/')) { showToast('Error', 'Please upload a valid video file', 'danger'); return; }
    setVideoUrl(URL.createObjectURL(file));
    setDrawingEnabled(false);
    setSaveDisabled(true);
    setClearDisabled(true);
    setRectInfo('No rectangle drawn');
  }

  function toCanvas(ev) {
    const cvs = canvasRef.current;
    const rect = cvs.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (cvs.width / rect.width),
      y: (ev.clientY - rect.top) * (cvs.height / rect.height)
    };
  }

  function onMouseDown(ev) {
    if (!drawingEnabled) return;
    const p = toCanvas(ev);
    drawRef.current = { drawing: true, startX: p.x, startY: p.y, endX: p.x, endY: p.y };
  }

  function onMouseMove(ev) {
    if (!drawRef.current.drawing) return;
    const p = toCanvas(ev);
    drawRef.current.endX = p.x; drawRef.current.endY = p.y;
    const cvs = canvasRef.current; const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(79,70,229,0.15)';
    const w = p.x - drawRef.current.startX, h = p.y - drawRef.current.startY;
    ctx.fillRect(drawRef.current.startX, drawRef.current.startY, w, h);
    ctx.strokeRect(drawRef.current.startX, drawRef.current.startY, w, h);
    setRectInfo(`${Math.abs(Math.round(w))} x ${Math.abs(Math.round(h))} px`);
  }

  function onMouseUp(ev) {
    if (!drawRef.current.drawing) return;
    const p = toCanvas(ev);
    drawRef.current.drawing = false; drawRef.current.endX = p.x; drawRef.current.endY = p.y;
    const w = Math.abs(drawRef.current.endX - drawRef.current.startX);
    const h = Math.abs(drawRef.current.endY - drawRef.current.startY);
    if (w > 10 && h > 10) { setSaveDisabled(false); setClearDisabled(false); } else { clearCanvas(); }
  }

  function clearCanvas() {
    const cvs = canvasRef.current; if (!cvs) return;
    cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height);
    setRectInfo('No rectangle drawn'); setSaveDisabled(true); setClearDisabled(true);
    drawRef.current = { drawing: false, startX: 0, startY: 0, endX: 0, endY: 0 };
  }

  function toggleDrawing(checked) {
    setDrawingEnabled(checked);
    const cvs = canvasRef.current; if (!cvs) return;
    if (checked) { cvs.classList.add('drawing-enabled'); showToast('Info', 'Drawing mode enabled. Click and drag on the video.', 'info'); }
    else { cvs.classList.remove('drawing-enabled'); clearCanvas(); }
  }

  function saveRoi() {
    if (!roiName.trim()) { showToast('Error', 'Please enter a character name', 'danger'); return; }
    const video = videoRef.current; const cvs = canvasRef.current;
    const temp = document.createElement('canvas'); temp.width = video.videoWidth; temp.height = video.videoHeight;
    temp.getContext('2d').drawImage(video, 0, 0);
    const { startX, startY, endX, endY } = drawRef.current;
    const x = Math.min(startX, endX), y = Math.min(startY, endY);
    const w = Math.abs(endX - startX), h = Math.abs(endY - startY);
    if (w < 10 || h < 10) { showToast('Error', 'No valid ROI drawn', 'danger'); return; }
    const roiCvs = document.createElement('canvas'); roiCvs.width = w; roiCvs.height = h;
    roiCvs.getContext('2d').drawImage(temp, x, y, w, h, 0, 0, w, h);
    roiCvs.toBlob(async (blob) => {
      const fd = new FormData();
      fd.append('image', blob, 'image.jpg');
      fd.append('character_name', roiName.trim());
      try {
        const res = await fetch(`${apiBase}/save_roi`, { method: 'POST', body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Save failed');
        showToast('Success', `Saved as ${j.filename} in "${roiName}" folder!`, 'success');
        clearCanvas(); setDrawingEnabled(false);
        if (cvs) cvs.classList.remove('drawing-enabled');
        loadCharacters();
      } catch (e) { showToast('Error', e.message, 'danger'); }
    }, 'image/jpeg', 0.9);
  }

  async function showCharacterImages(name) {
    setCharImagesModal({ open: true, name, images: [], loading: true });
    try {
      const res = await fetch(`${apiBase}/get_character_images/${encodeURIComponent(name)}`);
      const j = await res.json();
      setCharImagesModal({ open: true, name, images: j.images || [], loading: false });
    } catch { setCharImagesModal(prev => ({ ...prev, loading: false })); }
  }

  async function removeCharacter(name) {
    if (!window.confirm(`Remove "${name}" and all associated images?`)) return;
    try {
      const res = await fetch(`${apiBase}/remove-registered`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      showToast('Success', `"${name}" removed successfully`, 'success');
      loadCharacters();
    } catch (e) { showToast('Error', e.message, 'danger'); }
  }

  async function registerAllROIs() {
    setRegistering(true);
    try {
      const chRes = await fetch(`${apiBase}/get_saved_characters`);
      const chJson = await chRes.json();
      const characters = chJson.characters || [];
      if (!characters.length) { showToast('Warning', 'No characters to register', 'warning'); setRegistering(false); return; }
      const data = [];
      for (const ch of characters) {
        try {
          const imgRes = await fetch(`${apiBase}/get_character_images/${encodeURIComponent(ch.name)}`);
          const imgJson = await imgRes.json();
          const paths = (imgJson.images || []).map(p => ({ filepath: p.startsWith('/registered_images/') ? p.substring(1) : p, roi: null }));
          data.push({ name: ch.name, paths });
        } catch {}
      }
      const regRes = await fetch(`${apiBase}/register-images`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const regJson = await regRes.json();
      if (regJson.error) throw new Error(regJson.error);
      showToast('Success', regJson.registrationstatus || 'Registration started!', 'success');
    } catch (e) { showToast('Error', e.message, 'danger'); }
    setRegistering(false);
  }

  return (
    <div className="container-fluid fade-in">
      <style>{styles}</style>
      <Toast toasts={toasts} />

      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Register Characters
          </h2>
          <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Upload a video, draw regions of interest, and save them as characters.</p>
        </div>
      </div>

      <div className="modern-card mb-4">
        {/* Upload Area */}
        {!videoUrl && (
          <div
            className={`roi-upload-area${dragover ? ' dragover' : ''}`}
            onClick={() => document.getElementById('roiVideoFile').click()}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={e => { e.preventDefault(); setDragover(false); }}
            onDrop={e => { e.preventDefault(); setDragover(false); processFile(e.dataTransfer.files[0]); }}
          >
            <i className="bi bi-cloud-arrow-up-fill text-primary" style={{ fontSize: '3.5rem' }}></i>
            <h5 className="mt-3 fw-bold" style={{ color: 'var(--text-main)' }}>Upload Video</h5>
            <p className="text-muted mb-3">Click to browse or drag and drop a video file here</p>
            <button className="btn btn-primary rounded-pill px-4 py-2 fw-semibold" onClick={e => { e.stopPropagation(); document.getElementById('roiVideoFile').click(); }}>
              <i className="bi bi-folder2-open me-2"></i>Select Video
            </button>
            <input id="roiVideoFile" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
          </div>
        )}

        {/* Video Section */}
        {videoUrl && (
          <div>
            <div className="roi-instructions">
              <strong><i className="bi bi-info-circle me-2"></i>Instructions:</strong>
              <ol className="mb-0 mt-2 small" style={{ color: 'var(--text-main)' }}>
                <li>Play the video and pause at the desired frame</li>
                <li>Enable drawing mode and drag to draw a rectangle around the character</li>
                <li>Enter the character name and click "Save ROI"</li>
                <li>Images will be saved as 1.jpg, 2.jpg, etc. in character folders</li>
              </ol>
            </div>

            <div className="roi-video-container mb-3">
              <video ref={videoRef} controls src={videoUrl} style={{ width: '100%', display: 'block' }}></video>
              <canvas
                ref={canvasRef}
                className={`roi-canvas${drawingEnabled ? ' drawing-enabled' : ''}`}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </div>

            {/* Controls */}
            <div className="p-3 rounded-3" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <div className="mb-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="roiDrawToggle" checked={drawingEnabled} onChange={e => toggleDrawing(e.target.checked)} />
                  <label className="form-check-label fw-semibold" htmlFor="roiDrawToggle" style={{ color: 'var(--text-main)' }}>
                    <i className="bi bi-pen me-2"></i>Enable ROI Drawing Mode
                    <small className="d-block text-muted fw-normal">Turn on to draw rectangles on the video</small>
                  </label>
                </div>
              </div>
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold" style={{ color: 'var(--text-main)' }}>
                    <i className="bi bi-person me-1"></i>Character Name:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Enter character name..."
                    value={roiName}
                    onChange={e => setRoiName(e.target.value)}
                    disabled={!drawingEnabled}
                  />
                </div>
                <div className="col-md-7 d-flex gap-2 flex-wrap">
                  <button className="btn btn-primary rounded-pill px-3 fw-semibold" disabled={saveDisabled || !roiName.trim()} onClick={saveRoi}>
                    <i className="bi bi-floppy me-2"></i>Save ROI
                  </button>
                  <button className="btn btn-outline-secondary rounded-pill px-3" disabled={clearDisabled} onClick={clearCanvas}>
                    <i className="bi bi-eraser me-2"></i>Clear
                  </button>
                  <button className="btn btn-outline-primary rounded-pill px-3" onClick={() => { setVideoUrl(null); setDrawingEnabled(false); clearCanvas(); }}>
                    <i className="bi bi-arrow-repeat me-2"></i>Change Video
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  <i className="bi bi-cursor me-1"></i>Current Rectangle: <span className="fw-semibold">{rectInfo}</span>
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved ROIs */}
      {savedRois.length > 0 && (
        <div className="modern-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>
              <i className="bi bi-images me-2 text-primary"></i>Saved ROIs
            </h5>
            <button className="btn btn-primary rounded-pill px-4 fw-semibold" onClick={registerAllROIs} disabled={registering}>
              {registering
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Registering...</>
                : <><i className="bi bi-check-circle me-2"></i>Register Saved ROIs</>}
            </button>
          </div>
          <div className="roi-grid-2">
            {savedRois.map((c, i) => (
              <div key={i} className="roi-item-card" onClick={() => showCharacterImages(c.name)}>
                <div className="d-flex align-items-center flex-grow-1">
                  {c.preview
                    ? <img src={c.preview} alt={c.name} className="roi-preview-img" />
                    : <div className="roi-preview-img d-flex align-items-center justify-content-center rounded-3" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                        <i className="bi bi-person-fill text-white fs-4"></i>
                      </div>}
                  <div>
                    <div className="fw-bold" style={{ color: 'var(--text-main)' }}>{c.name}</div>
                    <small className="text-muted">{c.count} image(s)</small>
                  </div>
                </div>
                {c.registered && (
                  <span className="roi-item-registered" title="Already registered">
                    <i className="bi bi-check-lg"></i>
                  </span>
                )}
                {/* <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8 }}
                  onClick={e => { e.stopPropagation(); removeCharacter(c.name); }}>
                  <i className="bi bi-trash-fill"></i>
                </button> */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character Images Modal - Portal */}
      {charImagesModal.open && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setCharImagesModal({ open: false, name: '', images: [], loading: false }); }}
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
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--primary)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bolder mb-0 text-white">
                  <i className="bi bi-person-circle me-2"></i>{charImagesModal.name}
                </h5>
                <button className="btn-close btn-close-white shadow-none" onClick={() => setCharImagesModal({ open: false, name: '', images: [], loading: false })}></button>
              </div>
              <p className="mb-0 mt-2 small text-white opacity-75">
                <i className="bi bi-images me-1"></i>
                {charImagesModal.loading ? 'Loading...' : `${charImagesModal.images.length} saved image${charImagesModal.images.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--card-bg)' }}>
              {charImagesModal.loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                  <p className="mt-3 text-muted">Loading images...</p>
                </div>
              ) : charImagesModal.images.length === 0 ? (
                <div className="text-center py-5 rounded-4" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <i className="bi bi-image fs-1 text-muted opacity-50"></i>
                  <p className="mt-3 text-muted fw-medium">No images found for this character</p>
                </div>
              ) : (
                <div className="char-img-grid">
                  {charImagesModal.images.map((img, idx) => (
                    <div key={idx} className="char-img-item">
                      <img src={img} alt={`${charImagesModal.name} ${idx + 1}`} />
                      <span className="char-img-num">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
