import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// --- Embedded Modern CSS ---
const modernUploadStyles = `
  .upload-wrapper {
    animation: fadeIn 0.4s ease-out forwards;
  }

  /* Modern Dropzone */
  .modern-dropzone {
    border: 2px dashed var(--border-color, #e2e8f0);
    border-radius: 24px;
    background-color: var(--bg-main, #f4f7fe);
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .modern-dropzone:hover {
    border-color: var(--primary, #4318FF);
    background-color: var(--primary-light, #e9e3ff);
    transform: translateY(-2px);
  }

  .modern-dropzone .upload-icon {
    font-size: 4rem;
    color: var(--primary, #4318FF);
    opacity: 0.8;
    margin-bottom: 1rem;
    transition: transform 0.3s ease;
  }

  .modern-dropzone:hover .upload-icon {
    transform: translateY(-10px);
  }

  /* File Cards */
  .file-card-modern {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .file-card-modern:hover {
    box-shadow: 0 12px 25px rgba(0,0,0,0.06);
    border-color: var(--primary-light, #e9e3ff);
  }

  .file-preview-area {
    height: 140px;
    background-color: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-preview-area video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-inputs .form-control-sm {
    background-color: var(--bg-main, #f4f7fe);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .file-inputs .form-control-sm:focus {
    border-color: var(--primary, #4318FF);
    box-shadow: 0 0 0 3px var(--primary-light, #e9e3ff);
    background-color: var(--card-bg, #ffffff);
  }

  /* Configuration Panels */
  .config-panel-modern {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 16px;
    padding: 1.25rem;
    height: 100%;
  }

  .terminal-box {
    background-color: #0f172a;
    border-radius: 16px;
    padding: 1rem;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.85rem;
    color: #e2e8f0;
    overflow-y: auto;
    border: 1px solid #1e293b;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
  }
  
  .terminal-box::-webkit-scrollbar { width: 8px; }
  .terminal-box::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 4px; }

  .json-preview {
    max-height: 250px;
    color: #38bdf8;
  }

  .log-area {
    max-height: 200px;
    color: #10b981;
  }

  .log-timestamp {
    color: #64748b;
    margin-right: 12px;
    font-size: 0.75rem;
  }

  /* Buttons */
  .btn-gradient-primary {
    background: linear-gradient(135deg, var(--primary, #4318FF) 0%, #868CFF 100%);
    border: none;
    color: white;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  .btn-gradient-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.3);
    color: white;
  }

  .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* Custom Switch */
  .custom-switch .form-check-input {
    width: 2.5em;
    height: 1.25em;
    cursor: pointer;
  }
  .custom-switch .form-check-input:checked {
    background-color: var(--primary, #4318FF);
    border-color: var(--primary, #4318FF);
  }

  .glass-modal {
    backdrop-filter: blur(8px);
    background-color: rgba(0,0,0,0.4);
  }
`;

export default function UploadPage({ backendConfig, mappings, setMappings, setShowSettings }) {
  const [activeTab, setActiveTab] = useState('index');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [batchConfig, setBatchConfig] = useState({ dbName: '_default_db', useAudio: false, fps: 30 });
  const [uploadToBackend, setUploadToBackend] = useState(true);
  const [autoGenerateSourceId, setAutoGenerateSourceId] = useState(true);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: 'System initialized and ready.' }]);
  const [jsonPreview, setJsonPreview] = useState({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const fileInputRef = useRef(null);
  const logEndRef = useRef(null);
  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  const log = (msg) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [logs]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(f => ({
      fileObject: f,
      name: f.name,
      webkitRelativePath: f.webkitRelativePath || '',
      manualPath: '',
      sourceId: '',
      fps: '',
      useAudio: false,
      previewUrl: f.type.startsWith('video/') ? URL.createObjectURL(f) : null
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    log(`Queued ${newFiles.length} new files for indexing.`);
  };

  const removeFile = (idx) => {
    const fileToRemove = selectedFiles[idx];
    if (fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
    const newFiles = [...selectedFiles];
    newFiles.splice(idx, 1);
    setSelectedFiles(newFiles);
  };

  const updateFileProp = (idx, prop, val) => {
    const newFiles = [...selectedFiles];
    newFiles[idx][prop] = val;
    setSelectedFiles(newFiles);
  };

  const mapToDockerPath = (localPath) => {
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
  };

  const buildPayload = (uploadMap = null) => {
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
  };

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

  const handlePreview = () => {
    let mockMap = null;
    if (uploadToBackend) {
      mockMap = {};
      selectedFiles.forEach(f => mockMap[f.name] = `/work_dir/uploads/${f.name}`);
    }
    setJsonPreview(buildPayload(mockMap));
  };

  const handleStartIndexing = async () => {
    if (selectedFiles.length === 0) {
      Swal.fire({ title: "Queue is Empty", text: "Please select files to index.", icon: "warning", confirmButtonColor: '#4318FF' });
      return;
    }

    setIsIndexing(true);
    let uploadMap = null;

    if (uploadToBackend) {
      uploadMap = await uploadFiles();
      if (uploadMap === null) {
        Swal.fire({ title: "Upload Failed", text: "Check system logs for details.", icon: "error", confirmButtonColor: '#EE5D50' });
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

      log(`Indexing engine response: ${JSON.stringify(data)}`);
      Swal.fire({
        title: "Process Started!",
        text: "Your media is now being indexed. Check the Dashboard for real-time progress.",
        icon: "success",
        confirmButtonColor: '#01B574',
        customClass: { popup: 'rounded-4' }
      });
      
      // Clear queue after successful dispatch
      setSelectedFiles([]);

    } catch (e) {
      log(`Engine connection failed: ${e.message}`);
      Swal.fire({ title: "Connection Failed", text: "Could not reach the backend indexing server.", icon: "error", confirmButtonColor: '#EE5D50' });
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <>
      <style>{modernUploadStyles}</style>
      <div className="upload-wrapper container-fluid px-0">
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Upload & Index</h2>
            <p className="mb-0" style={{ color: 'var(--text-muted)' }}>Configure and push new media to your vector database.</p>
          </div>
          <button className="btn btn-light rounded-pill px-3 shadow-sm border" onClick={() => setShowSettings(true)} title="Settings">
            <i className="bi bi-sliders" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-12">
            <div className="card shadow-sm border-0 h-100" style={{ padding: '24px', borderRadius: '24px' }}>
              
              {/* Dropzone */}
              <div 
                className="modern-dropzone mb-4"
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  // Note: Simple file drop handling. Directory drop needs deeper handling, but keeping original logic flow.
                  handleFileSelect({ target: { files: e.dataTransfer.files }}); 
                }}
              >
                <i className="bi bi-cloud-arrow-up-fill upload-icon d-block"></i>
                <h4 className="fw-bolder" style={{ color: 'var(--text-main)' }}>Drag & Drop Media Folders</h4>
                <p style={{ color: 'var(--text-muted)' }}>Supports local directories and mapped NAS paths.</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="d-none"
                  multiple
                  directory=""
                  webkitdirectory=""
                  onChange={handleFileSelect}
                />
                <button className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm mt-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                  <i className="bi bi-folder-plus me-2"></i>Select Directory
                </button>
              </div>

              {/* Queue Header */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 pb-3 border-bottom">
                <h5 className="fw-bold mb-3 mb-sm-0" style={{ color: 'var(--text-main)' }}>
                  Processing Queue <span className="badge bg-primary rounded-pill ms-2">{selectedFiles.length}</span>
                </h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light border rounded-pill fw-medium shadow-sm px-3" onClick={() => setShowConfigModal(true)}>
                    <i className="bi bi-sliders2 me-1"></i> Batch Config
                  </button>
                  <button className="btn btn-sm btn-light border rounded-pill fw-medium shadow-sm px-3" onClick={handlePreview}>
                    <i className="bi bi-code-square me-1"></i> Preview Payload
                  </button>
                  {selectedFiles.length > 0 && (
                    <button className="btn btn-sm btn-outline-danger rounded-pill fw-medium shadow-sm px-3" onClick={() => setSelectedFiles([])}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* File Grid */}
              <div className="mb-4 pe-2" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden' }}>
                {selectedFiles.length === 0 ? (
                  <div className="text-center py-5 rounded-4" style={{ backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)' }}>
                    <i className="bi bi-inbox fs-1 text-muted opacity-50 mb-2 d-block"></i>
                    <span style={{ color: 'var(--text-muted)' }}>No files selected. Queue is empty.</span>
                  </div>
                ) : (
                  <div className="row g-3">
                    {selectedFiles.map((f, idx) => (
                      <div className="col-12 col-sm-6 col-md-4 col-xl-3 fade-in-up" key={idx} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="file-card-modern">
                          <div className="file-preview-area">
                            {f.previewUrl ? (
                              <video src={f.previewUrl} controls />
                            ) : (
                              <div className="text-muted small"><i className="bi bi-film fs-1 d-block text-center mb-2"></i>No Preview</div>
                            )}
                          </div>
                          <div className="p-3 file-inputs d-flex flex-column flex-grow-1">
                            <h6 className="fw-bold text-truncate mb-1" title={f.name} style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{f.name}</h6>
                            <p className="text-truncate small mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><i className="bi bi-folder me-1"></i>{f.webkitRelativePath || "root"}</p>
                            
                            <div className="mt-auto d-flex flex-column gap-2">
                              <input className="form-control form-control-sm" placeholder="Manual path override" value={f.manualPath} onChange={e => updateFileProp(idx, 'manualPath', e.target.value)} />
                              <div className="d-flex gap-2">
                                <input className="form-control form-control-sm w-50" placeholder="Source ID" value={f.sourceId} onChange={e => updateFileProp(idx, 'sourceId', e.target.value)} />
                                <input className="form-control form-control-sm w-50" placeholder="FPS (e.g. 30)" type="number" value={f.fps} onChange={e => updateFileProp(idx, 'fps', e.target.value)} />
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-1 px-1 custom-switch">
                                <label className="form-check-label small fw-bold text-uppercase" htmlFor={`aud-${idx}`} style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Index Audio</label>
                                <div className="form-check form-switch m-0">
                                  <input className="form-check-input m-0 shadow-none" type="checkbox" checked={f.useAudio} onChange={e => updateFileProp(idx, 'useAudio', e.target.checked)} id={`aud-${idx}`} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-2 pt-0 mt-auto bg-white border-top-0">
                            <button className="btn btn-sm btn-light w-100 text-danger rounded-pill fw-medium border" onClick={() => removeFile(idx)}>
                              <i className="bi bi-trash3-fill me-1"></i> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configurations */}
              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="config-panel-modern d-flex flex-column justify-content-center custom-switch">
                    <h6 className="fw-bold mb-3 text-uppercase small" style={{ color: 'var(--text-muted)' }}>Pipeline Settings</h6>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style={{ backgroundColor: 'var(--bg-main)' }}>
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Auto-generate Source ID</div>
                        <div className="small" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Derive ID from filename if empty</div>
                      </div>
                      <div className="form-check form-switch m-0">
                        <input className="form-check-input shadow-none" type="checkbox" checked={autoGenerateSourceId} onChange={e => setAutoGenerateSourceId(e.target.checked)} />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: 'var(--bg-main)' }}>
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Upload to Work Dir</div>
                        <div className="small" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Transfer files to backend before indexing</div>
                      </div>
                      <div className="form-check form-switch m-0">
                        <input className="form-check-input shadow-none" type="checkbox" checked={uploadToBackend} onChange={e => setUploadToBackend(e.target.checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="config-panel-modern">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-uppercase small" style={{ color: 'var(--text-muted)' }}>Path Mappings</h6>
                      <button className="btn btn-sm btn-link text-decoration-none p-0 fw-bold" onClick={() => setShowSettings(true)}>Manage</button>
                    </div>
                    <div className="p-3 rounded h-75 overflow-auto" style={{ backgroundColor: 'var(--bg-main)' }}>
                      {mappings.length === 0 ? (
                        <div className="text-muted small text-center mt-3">No active docker mappings.</div>
                      ) : (
                        <ul className="list-unstyled mb-0 small font-monospace">
                          {mappings.map((m, i) => (
                            <li key={i} className="mb-2 pb-2 border-bottom border-light">
                              <span style={{ color: 'var(--primary)' }}>{m.local}</span>
                              <i className="bi bi-arrow-right mx-2 text-muted"></i>
                              <span style={{ color: 'var(--success)' }}>{m.docker}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-gradient-primary w-100 py-3 rounded-pill fs-5 d-flex justify-content-center align-items-center gap-2"
                onClick={handleStartIndexing}
                disabled={isIndexing}
              >
                {isIndexing ? (
                  <><span className="spinner-border spinner-border-sm" style={{ width: '1.5rem', height: '1.5rem' }}></span> Initializing Pipeline...</>
                ) : (
                  <><i className="bi bi-rocket-takeoff-fill"></i> Execute Indexing Job</>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Developer Console Area */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <h6 className="fw-bold mb-2 ms-1 text-uppercase small d-flex justify-content-between" style={{ color: 'var(--text-muted)' }}>
              <span><i className="bi bi-terminal me-2"></i>System Event Logs</span>
              <span className="cursor-pointer text-primary" onClick={() => setLogs([])} style={{ cursor: 'pointer' }}>Clear</span>
            </h6>
            <div className="terminal-box log-area" ref={logEndRef}>
              {logs.map((l, i) => (
                <div key={i} className="mb-1">
                  <span className="log-timestamp">[{l.time}]</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-lg-6">
            <h6 className="fw-bold mb-2 ms-1 text-uppercase small" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-braces me-2"></i>Compiled JSON Payload
            </h6>
            <div className="terminal-box json-preview">
              <pre className="mb-0">
                {Object.keys(jsonPreview).length > 0 ? JSON.stringify(jsonPreview, null, 2) : '// Click "Preview Payload" to generate'}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* Batch Config Modal */}
      {showConfigModal && (
        <div className="modal show d-block glass-modal">
          <div className="modal-dialog modal-dialog-centered fade-in-up">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: 'var(--card-bg)' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <h4 className="modal-title fw-bold" style={{ color: 'var(--text-main)' }}>Batch Defaults</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowConfigModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Target Database</label>
                  <input className="form-control form-control-lg bg-light border-0 shadow-sm rounded-3" value={batchConfig.dbName} onChange={e => setBatchConfig({ ...batchConfig, dbName: e.target.value })} />
                </div>
                
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Default FPS</label>
                  <input className="form-control form-control-lg bg-light border-0 shadow-sm rounded-3" type="number" value={batchConfig.fps} onChange={e => setBatchConfig({ ...batchConfig, fps: Number(e.target.value) })} />
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ backgroundColor: 'var(--bg-main)' }}>
                  <span className="fw-bold" style={{ color: 'var(--text-main)' }}>Process Audio Tracks</span>
                  <div className="form-check form-switch m-0 fs-5 custom-switch">
                    <input className="form-check-input shadow-none m-0" type="checkbox" checked={batchConfig.useAudio} onChange={e => setBatchConfig({ ...batchConfig, useAudio: e.target.checked })} />
                  </div>
                </div>

              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm" onClick={() => setShowConfigModal(false)}>Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}