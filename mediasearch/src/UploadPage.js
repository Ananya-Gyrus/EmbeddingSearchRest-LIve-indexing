import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { getApiBase } from './apiBase';

const modernUploadStyles = `
  .upload-wrapper {
    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Modern Dropzone */
  .modern-dropzone {
    border: 2px dashed var(--border-color);
    border-radius: 24px;
    background-color: var(--input-bg);
    padding: 3.5rem 2rem;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .modern-dropzone:hover, .modern-dropzone.drag-active {
    border-color: var(--primary);
    background-color: var(--primary-light);
    transform: translateY(-2px);
  }

  .modern-dropzone.drag-active {
    transform: scale(1.01);
    box-shadow: 0 10px 30px rgba(79, 70, 229, 0.15);
  }

  .modern-dropzone .upload-icon {
    font-size: 4.5rem;
    color: var(--primary);
    opacity: 0.9;
    margin-bottom: 1rem;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-block;
  }

  .modern-dropzone:hover .upload-icon, .modern-dropzone.drag-active .upload-icon {
    transform: translateY(-10px) scale(1.05);
  }

  /* File Cards */
  .file-card-modern {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .file-card-modern:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
    transform: translateY(-4px);
  }

  .file-card-modern::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: var(--primary);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s ease;
    z-index: 2;
  }

  .file-card-modern:hover::before { transform: scaleX(1); }

  .file-preview-area {
    height: 150px;
    background-color: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
  }

  .file-preview-area video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-inputs .form-control-sm {
    background-color: var(--input-bg);
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
    color: var(--text-main);
  }
  
  .file-inputs .form-control-sm:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
    background-color: var(--card-bg);
  }

  /* Configuration Panels */
  .config-panel-modern {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 1.5rem;
    height: 100%;
    box-shadow: var(--shadow-sm);
  }

  /* Developer Console - Remains Dark for both modes */
  .terminal-wrapper {
    background-color: #0b0f19;
    border-radius: 20px;
    border: 1px solid #1f2937;
    box-shadow: inset 0 2px 15px rgba(0,0,0,0.5);
    overflow: hidden;
  }

  .terminal-header {
    background-color: #111827;
    padding: 0.5rem 1rem;
    display: flex;
    gap: 6px;
    border-bottom: 1px solid #1f2937;
  }
  
  .terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-r { background-color: #ef4444; }
  .dot-y { background-color: #f59e0b; }
  .dot-g { background-color: #10b981; }

  .terminal-box {
    padding: 1.25rem;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.85rem;
    color: #e2e8f0;
    overflow-y: auto;
    line-height: 1.5;
  }
  
  .terminal-box::-webkit-scrollbar { width: 6px; height: 6px; }
  .terminal-box::-webkit-scrollbar-track { background: transparent; }
  .terminal-box::-webkit-scrollbar-thumb { background-color: #374151; border-radius: 10px; }
  .terminal-box::-webkit-scrollbar-thumb:hover { background-color: #4b5563; }

  .json-preview { height: 250px; color: #38bdf8; }
  .log-area { height: 250px; color: #10b981; }

  .log-timestamp { color: #64748b; margin-right: 12px; font-size: 0.75rem; user-select: none; }

  /* Buttons & Utilities */
  .btn-gradient-primary {
    background-color: var(--primary);
    border: none; color: white; font-weight: 700; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .btn-gradient-primary:hover:not(:disabled) {
    transform: translateY(-3px); box-shadow: 0 8px 20px var(--primary-light); color: black;
  }
  .btn-gradient-primary:disabled { opacity: 0.7; cursor: not-allowed; }

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

  .stagger-fade-in { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .custom-switch .form-check-input { width: 2.8em; height: 1.4em; cursor: pointer; }
  .custom-switch .form-check-input:checked { background-color: var(--primary); border-color: var(--primary); }

  .glass-modal { backdrop-filter: blur(8px); background-color: rgba(0,0,0,0.6); }
  
  /* Swal Overrides */
  div:where(.swal2-container) div:where(.swal2-popup) { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); }
  div:where(.swal2-container) h2:where(.swal2-title) { color: var(--text-main); }
  div:where(.swal2-container) div:where(.swal2-html-container) { color: var(--text-muted); }
`;

export default function UploadPage({ backendConfig, mappings, setMappings, setShowSettings }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [batchConfig, setBatchConfig] = useState({ dbName: '_default_db', useAudio: true, fps: 30 });
  const [uploadToBackend, setUploadToBackend] = useState(true);
  const [autoGenerateSourceId, setAutoGenerateSourceId] = useState(true);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: 'System initialized and ready.' }]);
  const [jsonPreview, setJsonPreview] = useState({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null); 
  const logEndRef = useRef(null);
  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const log = useCallback((msg) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [logs]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (files.length === 0) return;

    const newFiles = files.map(f => ({
      fileObject: f,
      name: f.name,
      webkitRelativePath: f.webkitRelativePath || '',
      manualPath: '',
      sourceId: '',
      fps: '',
      useAudio: batchConfig.useAudio, // FIX: Initialize directly from batchConfig instead of hardcoded 'false'
      previewUrl: f.type.startsWith('video/') ? URL.createObjectURL(f) : null
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    log(`Queued ${newFiles.length} new files for indexing.`);
    setIsDragging(false);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, [log, batchConfig.useAudio]); // Added dependency

  const handleDragEvents = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
    else if (e.type === 'drop') handleFileSelect(e);
  }, [handleFileSelect]);

  const removeFile = useCallback((idx) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[idx].previewUrl) URL.revokeObjectURL(newFiles[idx].previewUrl);
      newFiles.splice(idx, 1);
      return newFiles;
    });
  }, []);

  const updateFileProp = useCallback((idx, prop, val) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[idx][prop] = val;
      return newFiles;
    });
  }, []);

  const mapToDockerPath = useCallback((localPath) => {
    if (!localPath) return localPath;
    let match = null, matchLen = -1;
    mappings.forEach(m => {
      if (!m.local || !m.docker) return;
      const normLocal = m.local.replace(/\\/g, '/').replace(/\/+/g, '/');
      const normPath = localPath.replace(/\\/g, '/').replace(/\/+/g, '/');
      if (normPath.toLowerCase().startsWith(normLocal.toLowerCase()) && normLocal.length > matchLen) {
        match = { m, normLocal }; matchLen = normLocal.length;
      }
    });

    if (match) {
      const normPath = localPath.replace(/\\/g, '/').replace(/\/+/g, '/');
      const rel = normPath.substring(match.normLocal.length).replace(/^\//, '');
      const dockerBase = match.m.docker.replace(/\/$/, '');
      return (dockerBase + '/' + rel).replace(/\/+/g, '/');
    }
    return localPath;
  }, [mappings]);

  const buildPayload = useCallback((uploadMap = null) => {
    const data = selectedFiles.map(f => {
      let raw = uploadMap && uploadMap[f.name] ? uploadMap[f.name] : (f.manualPath || (f.webkitRelativePath ? f.webkitRelativePath : f.name));
      let dockerPath = raw;
      
      if (/^(work_dir\|work_dir\/|work_dir$)/i.test(raw)) {
        dockerPath = raw.replace(/^work_dir[\/]+?/i, '/work_dir/');
      } else {
        dockerPath = mapToDockerPath(raw);
      }
      dockerPath = dockerPath.replace(/\\/g, '/').replace(/\/+/g, '/');

      const sourceId = f.sourceId || (autoGenerateSourceId ? f.name.split('.').slice(0, -1).join('.') : undefined);
      return {
        filepath: dockerPath,
        sourceId: sourceId,
        fps: Number(f.fps) || batchConfig.fps,
        useAudio: typeof f.useAudio === 'boolean' ? f.useAudio : batchConfig.useAudio
      };
    });

    return { data, isVideo: true, dbName: batchConfig.dbName };
  }, [selectedFiles, mapToDockerPath, autoGenerateSourceId, batchConfig]);

  const uploadFiles = async () => {
    if (!uploadToBackend || selectedFiles.length === 0) return {};

    const form = new FormData();
    selectedFiles.forEach(f => {
      if (f.fileObject) {
        form.append('files[]', f.fileObject, f.name);
        form.append('relpaths[]', f.webkitRelativePath || f.name);
      }
    });
    form.append('targetBase', 'work_dir');

    log(`Initiating upload of ${selectedFiles.length} files to workspace...`);

    try {
      const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());

      const j = await res.json();
      const map = {};
      if (j.uploaded) j.uploaded.forEach(it => { map[it.originalName || it.original] = it.storedPath || it.saved; });
      else if (j.saved) j.saved.forEach(it => { map[it.original || it.originalName] = it.saved || it.storedPath; });

      log('Workspace upload completed successfully.');
      return map;
    } catch (e) {
      log(`Upload error: ${e.message}`);
      return null;
    }
  };

  const handlePreview = useCallback(() => {
    let mockMap = null;
    if (uploadToBackend) {
      mockMap = {};
      selectedFiles.forEach(f => mockMap[f.name] = `/work_dir/uploads/${f.name}`);
    }
    setJsonPreview(buildPayload(mockMap));
  }, [uploadToBackend, selectedFiles, buildPayload]);

  const handleStartIndexing = async () => {
    if (selectedFiles.length === 0) {
      Swal.fire({ 
        title: "Queue is Empty", 
        text: "Please select media files to begin indexing.", 
        icon: "warning", 
        buttonsStyling: false,
        customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4 fw-bold' }
      });
      return;
    }

    setIsIndexing(true);
    let uploadMap = null;

    if (uploadToBackend) {
      uploadMap = await uploadFiles();
      if (uploadMap === null) {
        Swal.fire({ 
          title: "Upload Failed", text: "Check system logs for details.", icon: "error",
          buttonsStyling: false,
          customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4 fw-bold' }
        });
        setIsIndexing(false);
        return;
      }
    }

    const payload = buildPayload(uploadMap);
    setJsonPreview(payload);
    log('Dispatching indexing payload to engine...');

    try {
      const res = await fetch(`${apiBase}/index-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(data);
      log(`Indexing engine response: ${JSON.stringify(data)}`);
      if(data.indexingstatus.error){
         Swal.fire({
        title: "Indexing in progress",
        text: "Your media is already being indexed. Please wait for the current process to finish before starting a new one.",
        icon: "warning",
        buttonsStyling: false,
        customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4 fw-bold' }
      });
      }
      else{
      Swal.fire({
        title: "Process Started!",
        text: "Your media is now being indexed. Check the Dashboard for real-time progress.",
        icon: "success",
        buttonsStyling: false,
        customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4 fw-bold' }
      });
      }
    
      setSelectedFiles([]);
    } catch (e) {
      log(`Engine connection failed: ${e.message}`);
      Swal.fire({ 
        title: "Connection Failed", text: "Could not reach the backend indexing server.", icon: "error",
        buttonsStyling: false,
        customClass: { popup: 'rounded-4 shadow-lg', confirmButton: 'btn btn-primary rounded-pill px-4 fw-bold' }
      });
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <>
      <style>{modernUploadStyles}</style>
      <div className="upload-wrapper container-fluid px-0">
        
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Upload & Index</h2>
            <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Configure and upload videos for indexing.</p>
          </div>
          <button className="btn btn-adaptive rounded-pill px-3 shadow-sm transition" onClick={() => setShowSettings(true)} title="Settings" style={{ height: '46px' }}>
            <i className="bi bi-sliders fs-5" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-lg-12">
            <div className="modern-card h-100 p-4 p-md-5">
              
              <div 
                className={`modern-dropzone mb-5 ${isDragging ? 'drag-active' : ''}`}
                onClick={(e) => {
                  // FIX: If they clicked a label/button, do NOT trigger the background dropzone file picker
                  if (e.target.closest('.browse-btn-container')) return;
                  fileInputRef.current.click();
                }}
                onDragEnter={handleDragEvents}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragEvents}
                onDrop={handleDragEvents}
              >
                <i className={`bi ${isDragging ? 'bi-cloud-arrow-down-fill' : 'bi-cloud-arrow-up-fill'} upload-icon`}></i>
                <h4 className="fw-bolder mb-2" style={{ color: 'var(--text-main)' }}>
                  {isDragging ? 'Drop Media Here' : 'Drag & Drop Media'}
                </h4>
                <p className="fw-medium mb-4" style={{ color: 'var(--text-muted)' }}>Supports local directories, individual files, and mapped NAS paths.</p>

                {/* FIX: Explicit ID mapping and using <label> acting as buttons avoids browser conflation */}
                <input
                  id="fileInput"
                  ref={fileInputRef}
                  type="file"
                  className="d-none"
                  multiple
                  accept="video/*,audio/*"
                  onChange={handleFileSelect}
                />
                
                <input
                  id="folderInput"
                  ref={folderInputRef}
                  type="file"
                  className="d-none"
                  multiple
                  webkitdirectory="true"
                  onChange={handleFileSelect}
                />

                <div className="d-flex flex-wrap justify-content-center gap-3 browse-btn-container">
                  <label htmlFor="fileInput" className="btn btn-primary rounded-pill px-4 py-3 fw-bold shadow-sm d-flex align-items-center m-0" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-file-earmark-play-fill me-2 fs-5"></i> Browse Files
                  </label>
                  <label htmlFor="folderInput" className="btn btn-adaptive rounded-pill px-4 py-3 fw-bold shadow-sm d-flex align-items-center m-0" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-folder-plus me-2 fs-5 text-primary"></i> Browse Folder
                  </label>
                </div>
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="fw-bolder mb-3 mb-sm-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  Processing Queue 
                  <span className="badge rounded-pill px-3 py-2 fs-6" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>{selectedFiles.length}</span>
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-adaptive rounded-pill fw-semibold shadow-sm px-4" onClick={() => setShowConfigModal(true)}>
                    <i className="bi bi-gear-fill me-2 text-primary"></i> Batch Config
                  </button>
                  <button className="btn btn-adaptive rounded-pill fw-semibold shadow-sm px-4" onClick={handlePreview}>
                    <i className="bi bi-code-slash me-2 text-info"></i> Preview Payload
                  </button>
                  {selectedFiles.length > 0 && (
                    <button className="btn rounded-pill fw-semibold shadow-sm px-4" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', backgroundColor: 'transparent' }} onClick={() => setSelectedFiles([])}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5 pe-2" style={{ maxHeight: '550px', overflowY: 'auto', overflowX: 'hidden' }}>
                {selectedFiles.length === 0 ? (
                  <div className="text-center py-5 rounded-4" style={{ backgroundColor: 'var(--input-bg)', border: '2px dashed var(--border-color)' }}>
                    <i className="bi bi-inbox fs-1 text-muted opacity-50 mb-3 d-block"></i>
                    <span className="fw-medium" style={{ color: 'var(--text-muted)' }}>No files selected. Your queue is empty.</span>
                  </div>
                ) : (
                  <div className="row g-4">
                    {selectedFiles.map((f, idx) => (
                      <div className="col-12 col-sm-6 col-md-4 col-xl-3 stagger-fade-in" key={idx} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="file-card-modern">
                          <div className="file-preview-area">
                            {f.previewUrl ? (
                              <video src={f.previewUrl} controls />
                            ) : (
                              <div className="text-muted small d-flex flex-column align-items-center opacity-50">
                                <i className="bi bi-film fs-1 mb-2"></i>No Preview
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 file-inputs d-flex flex-column flex-grow-1" style={{ backgroundColor: 'var(--card-bg)' }}>
                            <h6 className="fw-bold text-truncate mb-1" title={f.name} style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{f.name}</h6>
                            <p className="text-truncate small mb-3 fw-medium" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><i className="bi bi-folder2-open me-2 text-primary"></i>{f.webkitRelativePath || "Root Directory"}</p>
                            
                            <div className="mt-auto d-flex flex-column gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                              <input className="form-control form-control-sm" placeholder="Manual path override..." value={f.manualPath} onChange={e => updateFileProp(idx, 'manualPath', e.target.value)} />
                              <div className="d-flex gap-2">
                                <input className="form-control form-control-sm w-50" placeholder="Source ID" value={f.sourceId} onChange={e => updateFileProp(idx, 'sourceId', e.target.value)} />
                                <input className="form-control form-control-sm w-50" placeholder="FPS (e.g. 30)" type="number" value={f.fps} onChange={e => updateFileProp(idx, 'fps', e.target.value)} />
                              </div>
                              
                              <div className="d-flex align-items-center justify-content-between mt-2 px-1 custom-switch">
                                <label className="form-check-label small fw-bold text-uppercase" htmlFor={`aud-${idx}`} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Index Audio</label>
                                <div className="form-check form-switch m-0">
                                  <input className="form-check-input m-0 shadow-none" type="checkbox" checked={f.useAudio} onChange={e => updateFileProp(idx, 'useAudio', e.target.checked)} id={`aud-${idx}`} />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-2 border-top d-flex justify-content-center" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
                            <button className="btn btn-sm fw-bold w-100 d-flex justify-content-center align-items-center gap-2 rounded-3 transition" style={{ color: 'var(--danger)', backgroundColor: 'transparent' }} onClick={() => removeFile(idx)}>
                              <i className="bi bi-trash3-fill"></i> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="config-panel-modern d-flex flex-column justify-content-center custom-switch">
                    <h6 className="fw-bolder mb-3 text-uppercase small d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>
                      <i className="bi bi-cpu-fill text-primary"></i> Pipeline Settings
                    </h6>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded-4 transition" style={{ backgroundColor: 'var(--input-bg)' }}>
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Auto-generate Source ID</div>
                        <div className="fw-medium mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Derive ID from filename if empty</div>
                      </div>
                      <div className="form-check form-switch m-0 fs-5">
                        <input className="form-check-input shadow-none" type="checkbox" checked={autoGenerateSourceId} onChange={e => setAutoGenerateSourceId(e.target.checked)} />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 rounded-4 transition" style={{ backgroundColor: 'var(--input-bg)' }}>
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Upload to Work Directory</div>
                        <div className="fw-medium mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Transfer files to backend before indexing</div>
                      </div>
                      <div className="form-check form-switch m-0 fs-5">
                        <input className="form-check-input shadow-none" type="checkbox" checked={uploadToBackend} onChange={e => setUploadToBackend(e.target.checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="config-panel-modern d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bolder mb-0 text-uppercase small d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>
                        <i className="bi bi-signpost-split-fill text-success"></i> Path Mappings
                      </h6>
                      <button className="btn btn-sm btn-adaptive rounded-pill px-3 fw-bold" onClick={() => setShowSettings(true)}>Manage Rules</button>
                    </div>
                    
                    <div className="p-3 rounded-4 flex-grow-1 overflow-auto" style={{ backgroundColor: 'var(--input-bg)', maxHeight: '150px' }}>
                      {mappings.length === 0 ? (
                        <div className="text-muted small text-center mt-3 fw-medium">No active docker path mappings.</div>
                      ) : (
                        <ul className="list-unstyled mb-0 small font-monospace">
                          {mappings.map((m, i) => (
                            <li key={i} className="mb-2 pb-2 border-bottom border-light d-flex align-items-center flex-wrap gap-2">
                              <span className="px-2 py-1 rounded shadow-sm text-truncate" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--primary)', maxWidth: '40%' }}>{m.local}</span>
                              <i className="bi bi-arrow-right text-muted"></i>
                              <span className="px-2 py-1 rounded shadow-sm text-truncate" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--success)', maxWidth: '40%' }}>{m.docker}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-gradient-primary w-100 py-3 rounded-pill fs-5 d-flex justify-content-center align-items-center gap-3 mt-4"
                onClick={handleStartIndexing}
                disabled={isIndexing || selectedFiles.length === 0}
              >
                {isIndexing ? (
                  <><span className="spinner-border" style={{ width: '1.5rem', height: '1.5rem', borderWidth: '3px' }}></span> Initializing Pipeline...</>
                ) : (
                  <><i className="bi bi-rocket-takeoff-fill fs-4"></i> Execute Indexing Job</>
                )}
              </button>

            </div>
          </div>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-lg-6 stagger-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="terminal-wrapper h-100 d-flex flex-column">
              <div className="terminal-header">
                <div className="terminal-dot dot-r"></div>
                <div className="terminal-dot dot-y"></div>
                <div className="terminal-dot dot-g"></div>
                <span className="ms-auto small fw-bold text-uppercase" style={{ color: '#94a3b8', fontSize: '0.7rem', letterSpacing: '1px' }}>Event Logs</span>
              </div>
              <div className="terminal-box log-area flex-grow-1" ref={logEndRef}>
                {logs.map((l, i) => (
                  <div key={i} className="mb-1 d-flex">
                    <span className="log-timestamp flex-shrink-0">[{l.time}]</span>
                    <span className="text-break">{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-lg-6 stagger-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="terminal-wrapper h-100 d-flex flex-column">
              <div className="terminal-header">
                <div className="terminal-dot dot-r"></div>
                <div className="terminal-dot dot-y"></div>
                <div className="terminal-dot dot-g"></div>
                <span className="ms-auto small fw-bold text-uppercase" style={{ color: '#94a3b8', fontSize: '0.7rem', letterSpacing: '1px' }}>Compiled Payload (JSON)</span>
              </div>
              <div className="terminal-box json-preview flex-grow-1">
                <pre className="mb-0 font-monospace">
                  {Object.keys(jsonPreview).length > 0 ? JSON.stringify(jsonPreview, null, 2) : '// Click "Preview Payload" to compile data'}
                </pre>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showConfigModal && (
        <div className="modal show d-block glass-modal" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered stagger-fade-in">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: 'var(--card-bg)' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <h4 className="modal-title fw-bolder" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Batch Defaults</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowConfigModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase ms-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Target Database</label>
                  <div className="position-relative">
                    <i className="bi bi-database-fill position-absolute text-primary" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }}></i>
                    <input className="form-control form-control-lg border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', paddingLeft: '2.5rem', fontWeight: '500' }} value={batchConfig.dbName} onChange={e => setBatchConfig({ ...batchConfig, dbName: e.target.value })} />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase ms-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Default FPS</label>
                  <div className="position-relative">
                    <i className="bi bi-speedometer position-absolute text-warning" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }}></i>
                    <input className="form-control form-control-lg border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', paddingLeft: '2.5rem', fontWeight: '500' }} type="number" value={batchConfig.fps} onChange={e => setBatchConfig({ ...batchConfig, fps: Number(e.target.value) })} />
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-3 rounded-4 mt-2" style={{ backgroundColor: 'var(--input-bg)' }}>
                  <div>
                    <span className="fw-bold d-block" style={{ color: 'var(--text-main)' }}>Process Audio Tracks</span>
                    <span className="small fw-medium" style={{ color: 'var(--text-muted)' }}>Apply to all newly added files</span>
                  </div>
                  <div className="form-check form-switch m-0 fs-4 custom-switch">
                    <input className="form-check-input shadow-none m-0" type="checkbox" checked={batchConfig.useAudio} onChange={e => setBatchConfig({ ...batchConfig, useAudio: e.target.checked })} />
                  </div>
                </div>

              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm fs-6" onClick={() => setShowConfigModal(false)}>Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}