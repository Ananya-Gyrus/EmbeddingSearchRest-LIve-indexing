import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import React, { useState, useEffect, useRef } from 'react';
import UploadPage from './UploadPage'; // Assuming these exist in your project
import SearchPage from './SearchPage';
import LibraryPage from './LibraryPage';
import LicenseManager from './LicenseManager';

// --- Embedded Modern CSS (Move to App.css if preferred) ---
const modernStyles = `
  :root {
    --bg-main: #f4f7fe;
    --text-main: #2b3674;
    --text-muted: #a3aed1;
    --card-bg: #ffffff;
    --sidebar-bg: #ffffff;
    --primary: #4318FF;
    --primary-light: #e9e3ff;
    --success: #01B574;
    --success-light: #e5f7ed;
    --warning: #FFCE20;
    --warning-light: #fff9e6;
    --danger: #EE5D50;
    --danger-light: #fdeeee;
    --border-color: #e2e8f0;
    --glass-bg: rgba(255, 255, 255, 0.7);
  }

  [data-theme='dark'] {
    --bg-main: #0b1437;
    --text-main: #ffffff;
    --text-muted: #8f9bba;
    --card-bg: #111c44;
    --sidebar-bg: #111c44;
    --border-color: #2b3674;
    --glass-bg: rgba(17, 28, 68, 0.7);
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .app-container { min-height: 100vh; display: flex; }
  
  /* Sidebar */
  .sidebar {
    width: 280px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    z-index: 10;
  }
  .nav-item-custom {
    padding: 0.8rem 1rem;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
  }
  .nav-item-custom:hover { background-color: var(--primary-light); color: var(--primary); }
  .nav-item-custom.active { background-color: var(--primary); color: white; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.3); }

  /* Cards & Animations */
  .modern-card {
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .modern-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06); }
  
  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Video List Items */
  .video-list-item {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.5rem;
    align-items: center;
    transition: all 0.2s ease;
  }
  .video-list-item:hover { border-color: var(--primary); box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
  
  .v-icon-box {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
  }

  /* Progress Bar */
  .modern-progress-bg {
    background-color: var(--border-color);
    border-radius: 8px; height: 8px; width: 100%; overflow: hidden;
  }
  .modern-progress-fill {
    height: 100%; border-radius: 8px; transition: width 0.4s ease;
    background: linear-gradient(90deg, var(--primary), #868CFF);
  }
  .processing-pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }

  /* Badges */
  .modern-badge { padding: 0.4em 0.8em; border-radius: 8px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-processing { background-color: var(--primary-light); color: var(--primary); }
  .badge-queued { background-color: var(--warning-light); color: #B28F00; }
  .badge-success { background-color: var(--success-light); color: var(--success); }
  .badge-error { background-color: var(--danger-light); color: var(--danger); }

  /* Glass Modal */
  .glass-modal {
    backdrop-filter: blur(8px);
    background-color: rgba(0,0,0,0.4);
  }
  .modal-content-modern {
    background-color: var(--card-bg);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
`;

// --- Utility Functions ---
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const roundToDecimal = (num, places) => {
  const factor = Math.pow(10, places);
  return Math.round(num * factor) / factor;
};

// --- Components ---
const Sidebar = ({ activeTab, setActiveTab, licenseStatus, setShowSettings }) => {
  const getIcon = (item) => {
    if (item === 'Dashboard') return 'grid-1x2-fill';
    if (item.includes('Upload')) return 'cloud-arrow-up-fill';
    if (item.includes('Search')) return 'search';
    if (item === 'LicenseManager') return 'shield-lock-fill';
    return 'collection-play-fill';
  };

  return (
    <nav className="sidebar shadow-sm">
      <div className="d-flex align-items-center gap-3 mb-5 mt-2 px-2">
        <img src='https://gyrus.ai/assets/homepageAssets/gyrus-fav-blue.png' alt="Logo" width={40} className="shadow-sm rounded-circle" />
        <span className="fs-5 fw-bold" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>MediaSearch</span>
      </div>
      
      <div className="d-flex flex-column gap-1 flex-grow-1">
        {['Dashboard', 'Upload & Index', 'Search Media', 'Library', 'LicenseManager'].map((item) => (
          <div
            key={item}
            className={`nav-item-custom ${activeTab === item ? 'active' : ''}`}
            onClick={() => setActiveTab(item)}
            style={{ cursor: 'pointer' }}
          >
            <i className={`bi bi-${getIcon(item)} fs-5`}></i> 
            <span>{item === 'LicenseManager' ? 'License Manager' : item}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <div 
          className="nav-item-custom mb-4" 
          onClick={() => setShowSettings(true)} 
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-gear-fill fs-5"></i>
          <span>Settings</span>
        </div>

        <div className="modern-card p-3" style={{ borderRadius: '16px' }}>
          <h6 className="small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>License Status</h6>
          <div className="d-flex align-items-center justify-content-between mt-2">
            <span className={`modern-badge ${licenseStatus.valid ? 'badge-success' : 'badge-error'}`}>
              {licenseStatus.text}
            </span>
            <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>{licenseStatus.credits}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="col-xl-3 col-md-6 fade-in">
    <div className="modern-card d-flex align-items-center gap-3">
      <div className="v-icon-box" style={{ backgroundColor: `var(--${colorClass}-light)`, color: `var(--${colorClass})` }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div className="small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>{title}</div>
        <div className="fs-3 fw-bold mt-1" style={{ color: 'var(--text-main)', lineHeight: '1' }}>{value}</div>
      </div>
    </div>
  </div>
);

const VideoStatusList = ({ statusData }) => {
  const {
    video_progress = {}, indexed_data = {}, current_video,
    cv_scenes_processed = 0, cv_total_scenes = 0, video_queue = 0,
    processed_videos = 0, remaining_credits = 0, elapsed_time = 0
  } = statusData;

  const activeJobs = [];
  const processedIds = new Set();

  Object.entries(video_progress).forEach(([key, info]) => {
    const actualFilename = info.filename || key;
    activeJobs.push({ filename: actualFilename, ...info });
    processedIds.add(actualFilename);
  });

  if (current_video && !processedIds.has(current_video)) {
    activeJobs.push({
      filename: current_video, status: 'processing',
      scenes_processed: cv_scenes_processed, total_scenes: cv_total_scenes
    });
    processedIds.add(current_video);
  }

  const activeAndQueuedCount = activeJobs.filter(j => ['processing', 'queued'].includes((j.status || '').toLowerCase())).length;
  const missingQueue = Math.max(0, video_queue - activeAndQueuedCount);
  const completedItems = [];

  try {
    for (const db in indexed_data) {
      (indexed_data[db].video || []).forEach(v => {
        if (!processedIds.has(v)) {
          completedItems.push({ filename: v, status: 'done', scenes_processed: 1, total_scenes: 1 });
          processedIds.add(v);
        }
      });
    }
  } catch (e) { console.error("Error parsing indexed_data", e); }

  activeJobs.sort((a, b) => {
    const order = { 'processing': 0, 'queued': 1, 'error': 2, 'done': 3 };
    return (order[a.status] || 9) - (order[b.status] || 9);
  });
  completedItems.sort((a, b) => a.filename.localeCompare(b.filename));

  const renderCard = (item, index, isPlaceholder = false) => {
    const done = item.scenes_processed || 0;
    const total = item.total_scenes || 1;
    const pct = isPlaceholder ? 0 : Math.floor((done / total) * 100);
    const s = (item.status || 'queued').toLowerCase();

    let badgeClass = 'badge-queued';
    let badgeText = 'Queued';
    let icon = 'bi-hourglass-split';
    let iconColor = 'warning';

    if (s === 'processing') { badgeClass = 'badge-processing'; badgeText = 'Processing'; icon = 'bi-arrow-repeat processing-pulse'; iconColor = 'primary'; }
    else if (['indexed', 'done'].includes(s)) { badgeClass = 'badge-success'; badgeText = 'Indexed'; icon = 'bi-check-circle-fill'; iconColor = 'success'; }
    else if (['error', 'failed'].includes(s)) { badgeClass = 'badge-error'; badgeText = 'Failed'; icon = 'bi-exclamation-triangle-fill'; iconColor = 'danger'; }

    return (
      <div className="video-list-item fade-in" key={`${item.filename}-${index}`} style={{ animationDelay: `${index * 0.05}s` }}>
        <div className="v-icon-box" style={{ backgroundColor: `var(--${iconColor}-light)`, color: `var(--${iconColor})` }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '60%' }} title={item.filename}>{item.filename}</h6>
            <span className={`modern-badge ${badgeClass}`}>{badgeText}</span>
          </div>
          
          {s !== 'done' && s !== 'error' && (
            <div className="mt-2">
              <div className="d-flex justify-content-between small mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>{done} of {total} scenes</span>
                <span className="fw-bold">{pct}%</span>
              </div>
              <div className="modern-progress-bg">
                <div className="modern-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          )}
          {item.error_message && <div className="text-danger small mt-2 fw-medium"><i className="bi bi-bug me-1"></i>{item.error_message}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {/* Mini Stats Summary */}
      <div className="modern-card mb-4 d-flex gap-4 flex-wrap align-items-center p-3" style={{ borderRadius: '16px' }}>
        <div className="d-flex align-items-center gap-2"><i className="bi bi-coin text-warning"></i> <strong>Credits:</strong> {roundToDecimal(remaining_credits, 2)}</div>
        <div className="d-flex align-items-center gap-2"><i className="bi bi-stopwatch text-primary"></i> <strong>Elapsed:</strong> {formatDuration(elapsed_time)}</div>
        <div className="d-flex align-items-center gap-2"><i className="bi bi-film text-success"></i> <strong>Processed:</strong> {processed_videos}</div>
        <div className="d-flex align-items-center gap-2"><i className="bi bi-list-task text-info"></i> <strong>Queue:</strong> {video_queue}</div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-activity text-primary"></i> In Progress & Queue
          </h5>
          {activeJobs.length === 0 && missingQueue === 0 && (
            <div className="text-center p-5 modern-card" style={{ borderStyle: 'dashed' }}>
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-2 text-muted mb-0">No active jobs in the queue.</p>
            </div>
          )}
          {activeJobs.map((job, i) => renderCard(job, i))}
          {[...Array(missingQueue)].map((_, i) => renderCard({ status: 'queued', filename: `Queued Video #${i + 1}` }, `q-${i}`, true))}
        </div>

        <div className="col-lg-6 mt-4 mt-lg-0">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-collection text-success"></i> Library (Indexed)
          </h5>
          {completedItems.length === 0 ? (
            <div className="text-center p-5 modern-card" style={{ borderStyle: 'dashed' }}>
              <i className="bi bi-journal-x fs-1 text-muted"></i>
              <p className="mt-2 text-muted mb-0">No indexed items yet.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
              {completedItems.map((item, i) => renderCard(item, i))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('gyrus_theme') || 'light');
  const [showSettings, setShowSettings] = useState(false);
  
  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5801 });
  const [mappings, setMappings] = useState([]);
  const [statusData, setStatusData] = useState({});
  const [licenseStatus, setLicenseStatus] = useState({ valid: false, text: 'Checking...', credits: '-' });

  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;
  const pollTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gyrus_theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('gyrus_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.backendHost) setBackendConfig({ host: parsed.backendHost, port: parsed.backendPort });
      if (parsed.mappings) setMappings(parsed.mappings);
    }
  }, []);

  const fetchStatus = async () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    try {
      const res = await fetch(`${apiBase}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.in_progress) pollTimer.current = setTimeout(fetchStatus, 10000); 
      } else {
        setStatusData(prev => ({ ...prev, current_video: 'Offline' }));
      }
    } catch (e) {
      console.warn('Poll failed', e);
    }
  };

  const checkLicense = async () => {
    try {
      const res = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;

      if (info.status === 'License valid') {
        setLicenseStatus({ valid: true, text: 'Active', credits: `${info["Remaining Hourly Credits"]} Hrs` });
      } else {
        let statusText = info.status && info.status.includes('Key exists') ? 'Activation Required' : 'Inactive';
        setLicenseStatus({ valid: false, text: statusText, credits: '' });
      }
    } catch (e) {
      setLicenseStatus({ valid: false, text: 'Error', credits: 'Conn Fail' });
    }
  };

  useEffect(() => {
    const licenseTimer = setInterval(checkLicense, 60000); 
    checkLicense();
    fetchStatus();
    return () => {
      clearInterval(licenseTimer);
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [backendConfig]);

  const saveSettings = () => {
    localStorage.setItem('gyrus_settings', JSON.stringify({
      backendHost: backendConfig.host, backendPort: backendConfig.port, mappings
    }));
    setShowSettings(false);
  };

  return (
    <>
      <style>{modernStyles}</style>
      <div className="app-container">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} licenseStatus={licenseStatus} setShowSettings={setShowSettings} />

        <main className="flex-grow-1 p-4 p-md-5 overflow-auto" style={{ height: '100vh' }}>
          {activeTab === 'Dashboard' && (
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                  <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Welcome back!</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Here is the overview of your video indexing pipeline.</p>
                </div>
                <button className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm" onClick={() => setActiveTab('Upload & Index')}>
                  <i className="bi bi-cloud-arrow-up-fill me-2"></i> New Index
                </button>
              </div>

              <div className="row g-4 mb-5">
                <StatCard title="Videos Indexed" value={statusData.processed_videos || 0} icon="bi-film" colorClass="primary" />
                <StatCard title="Audio Indexed" value={statusData.processed_audios || 0} icon="bi-music-note-beamed" colorClass="info" />
                <StatCard title="Pipeline Status" value={`${statusData.in_progress ? 'Active' : 'Idle'}`} icon="bi-activity" colorClass="success" />
                <StatCard title="Credits Left" value={roundToDecimal(statusData.remaining_credits, 2)} icon="bi-lightning-charge-fill" colorClass="warning" />
              </div>

              <div className="modern-card p-4">
                <h4 className="fw-bold mb-1">Indexing Activity</h4>
                <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>Real-time progress of your media processing tasks.</p>
                <VideoStatusList statusData={statusData} />
              </div>
            </div>
          )}

          {activeTab === 'Upload & Index' && <div className="fade-in"><UploadPage backendConfig={backendConfig} mappings={mappings} setMappings={setMappings} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'Search Media' && <div className="fade-in"><SearchPage backendConfig={backendConfig} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'Library' && <div className="fade-in"><LibraryPage backendConfig={backendConfig} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'LicenseManager' && <div className="fade-in"><LicenseManager onActivationSuccess={checkLicense} /></div>}
        </main>

        {/* Modernized Settings Modal */}
        {showSettings && (
          <div className="modal show d-block glass-modal" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered fade-in">
              <div className="modal-content modal-content-modern overflow-hidden">
                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                  <h4 className="modal-title fw-bold">Platform Settings</h4>
                  <button type="button" className="btn-close shadow-none" onClick={() => setShowSettings(false)}></button>
                </div>
                <div className="modal-body p-4">
                  
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Appearance</label>
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-4" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="v-icon-box bg-white shadow-sm" style={{ width: '40px', height:'40px' }}>
                          <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill text-primary' : 'sun-fill text-warning'}`}></i>
                        </div>
                        <div>
                          <span className="fw-bold d-block">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                          <span className="small" style={{ color: 'var(--text-muted)' }}>Adjust the visual theme</span>
                        </div>
                      </div>
                      <div className="form-check form-switch fs-4">
                        <input className="form-check-input shadow-none" type="checkbox" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Backend Connection</label>
                    <div className="input-group input-group-lg shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                      <span className="input-group-text bg-light border-0"><i className="bi bi-hdd-network"></i></span>
                      <input className="form-control border-0" value={backendConfig.host} onChange={e => setBackendConfig({ ...backendConfig, host: e.target.value })} placeholder="Host (e.g., 127.0.0.1)" />
                      <span className="input-group-text bg-light border-0">:</span>
                      <input className="form-control border-0" type="number" style={{ maxWidth: '120px' }} value={backendConfig.port} onChange={e => setBackendConfig({ ...backendConfig, port: e.target.value })} placeholder="Port" />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>Path Mappings</label>
                    <div className="p-3 rounded-4" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                      {mappings.length === 0 && <div className="text-muted small mb-2">No mappings added.</div>}
                      {mappings.map((m, i) => (
                        <div className="d-flex gap-2 mb-2" key={i}>
                          <input className="form-control shadow-sm border-0" placeholder="Local (e.g., C:\Videos)" value={m.local} onChange={e => {
                            const newM = [...mappings]; newM[i].local = e.target.value; setMappings(newM);
                          }} />
                          <i className="bi bi-arrow-right d-flex align-items-center text-muted"></i>
                          <input className="form-control shadow-sm border-0" placeholder="Docker (e.g., /app/data)" value={m.docker} onChange={e => {
                            const newM = [...mappings]; newM[i].docker = e.target.value; setMappings(newM);
                          }} />
                          <button className="btn btn-light shadow-sm text-danger" onClick={() => {
                            const newM = [...mappings]; newM.splice(i, 1); setMappings(newM);
                          }}><i className="bi bi-trash-fill"></i></button>
                        </div>
                      ))}
                      <button className="btn btn-outline-primary btn-sm rounded-pill mt-2 fw-semibold px-3" onClick={() => setMappings([...mappings, { local: '', docker: '' }])}>
                        <i className="bi bi-plus-lg me-1"></i> Add Rule
                      </button>
                    </div>
                  </div>

                </div>
                <div className="modal-footer border-top-0 pt-0 pb-4 px-4 d-flex justify-content-between">
                  <button className="btn btn-light rounded-pill px-4 fw-semibold" onClick={() => setShowSettings(false)}>Cancel</button>
                  <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={saveSettings}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}