import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getApiBase } from './apiBase';
import UploadPage from './UploadPage'; 
import SearchPage from './SearchPage';
import LibraryPage from './LibraryPage';
import LicenseManager from './LicenseManager';

const modernStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  :root {
    --bg-main: #f8fafc;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --card-bg: #ffffff;
    --sidebar-bg: #ffffff;
    --primary: #4f46e5;
    --primary-light: #e0e7ff;
    --success: #10b981;
    --success-light: #d1fae5;
    --warning: #f59e0b;
    --warning-light: #fef3c7;
    --danger: #ef4444;
    --danger-light: #fee2e2;
    --border-color: #e2e8f0;
    --glass-bg: rgba(255, 255, 255, 0.85);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --input-bg: #f1f5f9;
  }

  [data-theme='dark'] {
    --bg-main: #0b0f19;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --card-bg: #111827;
    --sidebar-bg: #111827;
    --border-color: #1f2937;
    --glass-bg: rgba(17, 24, 39, 0.85);
    --shadow-sm: 0 4px 20px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 8px 25px rgba(0, 0, 0, 0.5);
    --primary-light: rgba(79, 70, 229, 0.15);
    --success-light: rgba(16, 185, 129, 0.15);
    --warning-light: rgba(245, 158, 11, 0.15);
    --danger-light: rgba(239, 68, 68, 0.15);
    --input-bg: #1f2937;
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow-x: hidden;
  }

  /* Core Overrides for Dark Mode Adaptability */
  .text-muted { color: var(--text-muted) !important; }
  
  .form-control, .input-group-text {
    background-color: var(--input-bg) !important;
    color: var(--text-main) !important;
    border-color: var(--border-color) !important;
    transition: all 0.2s ease;
  }
  
  .form-control::placeholder {
    color: var(--text-muted) !important;
    opacity: 0.7;
  }
  
  .form-control:focus {
    box-shadow: 0 0 0 0.25rem var(--primary-light) !important;
    border-color: var(--primary) !important;
  }

  [data-theme='dark'] .btn-close {
    filter: invert(1) grayscale(100%) brightness(200%);
    color: var(--text-main) !;
  }

  /* Layout */
  .app-layout { 
    display: flex; 
    min-height: 100vh; 
  }

  /* Responsive Sidebar */
  .sidebar {
    width: 280px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1040;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 1030;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  @media (max-width: 991px) {
    .sidebar {
      position: fixed;
      transform: translateX(-100%);
    }
    .sidebar.open {
      transform: translateX(0);
    }
    .mobile-overlay.open {
      display: block;
      opacity: 1;
    }
    .main-content {
      padding-top: 80px !important; 
    }
  }

  .mobile-header {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 70px;
    background-color: var(--glass-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    z-index: 1020;
    padding: 0 1.5rem;
    align-items: center;
    justify-content: space-between;
  }
  @media (max-width: 991px) { .mobile-header { display: flex; } }

  .nav-item-custom {
    padding: 0.85rem 1.2rem;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }
  .nav-item-custom:hover { background-color: var(--primary-light); color: var(--primary); }
  .nav-item-custom.active { background-color: var(--primary); color: white; box-shadow: 0 4px 15px var(--primary-light); }

  /* Cards & Animations */
  .modern-card {
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .modern-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  
  .fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .video-list-item {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.25rem;
    align-items: center;
    transition: all 0.2s ease;
  }
  .video-list-item:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); transform: translateX(4px); }
  
  .v-icon-box {
    width: 50px; height: 50px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; flex-shrink: 0;
  }

  /* Progress Bar */
  .modern-progress-bg {
    background-color: var(--border-color);
    border-radius: 8px; height: 6px; width: 100%; overflow: hidden;
  }
  .modern-progress-fill {
    height: 100%; border-radius: 8px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(90deg, var(--primary), #868CFF);
    position: relative;
    overflow: hidden;
  }
  .modern-progress-fill::after {
    content: ""; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

  .processing-pulse { animation: pulseIcon 2s infinite cubic-bezier(0.4, 0, 0.6, 1); }
  @keyframes pulseIcon { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }

  /* Badges */
  .modern-badge { padding: 0.4em 0.8em; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-processing { background-color: var(--primary-light); color: var(--primary); }
  .badge-queued { background-color: var(--warning-light); color: var(--warning); }
  .badge-success { background-color: var(--success-light); color: var(--success); }
  .badge-error { background-color: var(--danger-light); color: var(--danger); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
`;

const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const roundToDecimal = (num, places) => {
  const parsedNum = parseFloat(num);
  if (isNaN(parsedNum)) return num || 0; 
  const factor = Math.pow(10, places);
  return Math.round(parsedNum * factor) / factor;
};

const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem('gyrus_theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gyrus_theme', theme);
  }, [theme]);
  return [theme, setTheme];
};

const useSettings = () => {
  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5800 });
  const [mappings, setMappings] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem('gyrus_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.backendHost) setBackendConfig({ host: parsed.backendHost, port: parsed.backendPort });
        if (parsed.mappings) setMappings(parsed.mappings);
      } catch (e) { console.warn("Failed to parse settings"); }
    }
  }, []);
  const saveSettings = useCallback((newConfig, newMappings) => {
    setBackendConfig(newConfig);
    setMappings(newMappings);
    localStorage.setItem('gyrus_settings', JSON.stringify({
      backendHost: newConfig.host, backendPort: newConfig.port, mappings: newMappings
    }));
  }, []);
  return { backendConfig, mappings, saveSettings };
};

// --- Components ---
const Sidebar = ({ activeTab, setActiveTab, licenseStatus, setShowSettings, isOpen, setIsOpen }) => {
  const tabs = [
    { name: 'Dashboard', icon: 'grid-1x2-fill' },
    { name: 'Upload & Index', icon: 'cloud-arrow-up-fill' },
    { name: 'Search Media', icon: 'search' },
    { name: 'Library', icon: 'collection-play-fill' },
    { name: 'LicenseManager', icon: 'shield-lock-fill', label: 'License Manager' }
  ];

  return (
    <>
      <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>
      <nav className={`sidebar shadow-sm ${isOpen ? 'open' : ''}`}>
        <div className="d-flex align-items-center justify-content-between mb-5 mt-2 px-2">
          <div className="d-flex align-items-center gap-3">
            <img src='https://gyrus.ai/assets/homepageAssets/gyrus-fav-blue.png' alt="Logo" width={40} className="shadow-sm rounded-circle" />
            <span className="fs-5 fw-bold text-truncate" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>MediaSearch</span>
          </div>
          <button className="btn btn-sm d-lg-none" onClick={() => setIsOpen(false)}>
            <i className="bi bi-x-lg fs-5" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>
        
        <div className="d-flex flex-column gap-1 flex-grow-1">
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className={`nav-item-custom ${activeTab === tab.name ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.name); setIsOpen(false); }}
            >
              <i className={`bi bi-${tab.icon} fs-5`}></i> 
              <span>{tab.label || tab.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="nav-item-custom mb-4" onClick={() => { setShowSettings(true); setIsOpen(false); }}>
            <i className="bi bi-gear-fill fs-5"></i>
            <span>Settings</span>
          </div>

          <div className="modern-card p-3" style={{ borderRadius: '16px' }}>
            <h6 className="small fw-bold text-uppercase mb-2 text-muted" style={{ fontSize: '0.7rem' }}>License Status</h6>
            <div className="d-flex align-items-center justify-content-between">
              <span className={`modern-badge ${licenseStatus.valid ? 'badge-success' : 'badge-error'}`}>
                {licenseStatus.text}
              </span>
              <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>
                {licenseStatus.credits === 'Conn Fail' ? 'Conn Fail' : `${roundToDecimal(licenseStatus.credits, 2)} HRS`}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

const StatCard = ({ title, value, icon, colorClass, delay = 0 }) => (
  <div className="col-12 col-sm-6 col-xl-3">
    <div className="modern-card d-flex align-items-center gap-3 fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="v-icon-box" style={{ backgroundColor: `var(--${colorClass}-light)`, color: `var(--${colorClass})` }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>{title}</div>
        <div className="fs-3 fw-bolder mt-1" style={{ color: 'var(--text-main)', lineHeight: '1' }}>{value}</div>
      </div>
    </div>
  </div>
);

const VideoJobCard = ({ item, index, isPlaceholder }) => {
  const done = item.scenes_processed || 0;
  const total = item.total_scenes || 1;
  const pct = isPlaceholder ? 0 : Math.floor((done / total) * 100);
  const s = (item.status || 'queued').toLowerCase();

  const configs = {
    processing: { class: 'badge-processing', text: 'Processing', icon: 'bi-arrow-repeat processing-pulse', color: 'primary' },
    indexed: { class: 'badge-success', text: 'Indexed', icon: 'bi-check-circle-fill', color: 'success' },
    done: { class: 'badge-success', text: 'Indexed', icon: 'bi-check-circle-fill', color: 'success' },
    error: { class: 'badge-error', text: 'Failed', icon: 'bi-exclamation-triangle-fill', color: 'danger' },
    failed: { class: 'badge-error', text: 'Failed', icon: 'bi-exclamation-triangle-fill', color: 'danger' },
    default: { class: 'badge-queued', text: 'Queued', icon: 'bi-hourglass-split', color: 'warning' }
  };
  const config = configs[s] || configs.default;

  return (
    <div className="video-list-item fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="v-icon-box" style={{ backgroundColor: `var(--${config.color}-light)`, color: `var(--${config.color})` }}>
        <i className={`bi ${config.icon}`}></i>
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h6 className="mb-0 fw-bold text-truncate pe-3" style={{ color: 'var(--text-main)' }} title={item.filename}>{item.filename}</h6>
          <span className={`modern-badge ${config.class}`}>{config.text}</span>
        </div>
        
        {!['done', 'error', 'failed', 'indexed'].includes(s) && (
          <div className="mt-2">
            <div className="d-flex justify-content-between small mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
              <span>{done} of {total} scenes</span>
              <span className="fw-bold" style={{ color: 'var(--text-main)' }}>{pct}%</span>
            </div>
            <div className="modern-progress-bg">
              <div className="modern-progress-fill" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        )}
        {item.error_message && (
          <div className="text-danger small mt-2 fw-medium p-2 rounded-2" style={{ backgroundColor: 'var(--danger-light)' }}>
            <i className="bi bi-bug me-1"></i>{item.error_message}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardView = ({ statusData, setActiveTab }) => {
  const { activeJobs, completedItems, missingQueue } = useMemo(() => {
    const { 
      video_progress = {}, 
      indexed_data = {}, 
      current_video, 
      cv_scenes_processed = 0, 
      cv_total_scenes = 0, 
      video_queue = 0,
      in_progress
    } = statusData;
    
    const active = [];
    const processedIds = new Set();

    Object.entries(video_progress).forEach(([key, info]) => {
      const actualFilename = info.filename || key;
      if (!in_progress && info.status === 'processing') return; 
      
      active.push({ filename: actualFilename, ...info });
      processedIds.add(actualFilename);
    });

    if (in_progress && current_video && !processedIds.has(current_video)) {
      active.push({ 
        filename: current_video, 
        status: 'processing', 
        scenes_processed: cv_scenes_processed, 
        total_scenes: cv_total_scenes 
      });
      processedIds.add(current_video);
    }

    const activeCount = active.filter(j => ['processing', 'queued'].includes((j.status || '').toLowerCase())).length;
    const actualQueue = in_progress ? video_queue : 0; 
    const missing = Math.max(0, actualQueue - activeCount);
    const completed = [];

    try {
      for (const db in indexed_data) {
        (indexed_data[db].video || []).forEach(v => {
          if (!processedIds.has(v)) {
            completed.push({ filename: v, status: 'done', scenes_processed: 1, total_scenes: 1 });
            processedIds.add(v);
          }
        });
      }
    } catch (e) { console.error(e); }

    active.sort((a, b) => ({ 'processing': 0, 'queued': 1, 'error': 2, 'done': 3 }[a.status] || 9) - ({ 'processing': 0, 'queued': 1, 'error': 2, 'done': 3 }[b.status] || 9));
    completed.sort((a, b) => a.filename.localeCompare(b.filename));

    return { activeJobs: active, completedItems: completed, missingQueue: missing };
  }, [statusData]);

  return (
    <div className="fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 mb-lg-5 gap-3">
        <div>
          <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Intelligent Media Search</h2>
          <p className="mb-0 text-muted">Here is the overview of your video indexing pipeline.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2 transition" onClick={() => setActiveTab('Upload & Index')}>
          <i className="bi bi-cloud-arrow-up-fill"></i> New Index
        </button>
      </div>

      <div className="row g-4 mb-4 mb-lg-5">
        <StatCard title="Videos Indexed" value={statusData.processed_videos || 0} icon="bi-film" colorClass="primary" delay={0.1} />
        <StatCard title="Audio Indexed" value={statusData.processed_audios || 0} icon="bi-music-note-beamed" colorClass="info" delay={0.2} />
        <StatCard title="Pipeline Status" value={statusData.in_progress ? 'Active' : 'Idle'} icon="bi-activity" colorClass="success" delay={0.3} />
        <StatCard title="Credits Left" value={roundToDecimal(statusData.remaining_credits, 2)} icon="bi-lightning-charge-fill" colorClass="warning" delay={0.4} />
      </div>

      {/* Mini Summary Strip */}
      <div className="modern-card mb-4 p-3 d-flex flex-wrap gap-4 align-items-center fade-in" style={{ borderRadius: '16px', animationDelay: '0.5s' }}>
        <div className="d-flex align-items-center gap-2 text-main"><div className="p-2 rounded text-warning" style={{ backgroundColor: 'var(--warning-light)' }}><i className="bi bi-coin"></i></div> <strong>Credits:</strong> {roundToDecimal(statusData.remaining_credits, 2)}</div>
        <div className="d-flex align-items-center gap-2 text-main"><div className="p-2 rounded text-primary" style={{ backgroundColor: 'var(--primary-light)' }}><i className="bi bi-stopwatch"></i></div> <strong>Elapsed:</strong> {formatDuration(statusData.elapsed_time)}</div>
        <div className="d-flex align-items-center gap-2 text-main"><div className="p-2 rounded text-success" style={{ backgroundColor: 'var(--success-light)' }}><i className="bi bi-film"></i></div> <strong>Processed:</strong> {statusData.processed_videos || 0}</div>
        <div className="d-flex align-items-center gap-2 text-main"><div className="p-2 rounded text-info" style={{ backgroundColor: 'rgba(13, 202, 240, 0.15)' }}><i className="bi bi-list-task"></i></div> <strong>Queue:</strong> {statusData.video_queue || 0}</div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="modern-card h-100 p-4 fade-in" style={{ animationDelay: '0.6s' }}>
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-main">
              <i className="bi bi-activity text-primary p-2 rounded" style={{ backgroundColor: 'var(--primary-light)' }}></i> In Progress & Queue
            </h5>
            <div className="pe-1" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {activeJobs.length === 0 && missingQueue === 0 && (
                <div className="text-center p-5 rounded-4" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <i className="bi bi-inbox fs-1 text-muted opacity-50"></i>
                  <p className="mt-3 fw-medium text-muted mb-0">No active jobs in the queue.</p>
                </div>
              )}
              {activeJobs.map((job, i) => <VideoJobCard key={job.filename || i} item={job} index={i} />)}
              {[...Array(missingQueue)].map((_, i) => <VideoJobCard key={`q-${i}`} item={{ status: 'queued', filename: `Queued Video #${i + 1}` }} index={activeJobs.length + i} isPlaceholder />)}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="modern-card h-100 p-4 fade-in" style={{ animationDelay: '0.7s' }}>
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-main">
              <i className="bi bi-collection-play-fill text-success p-2 rounded" style={{ backgroundColor: 'var(--success-light)' }}></i> Library (Indexed)
            </h5>
            <div className="pe-1" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {completedItems.length === 0 ? (
                <div className="text-center p-5 rounded-4" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <i className="bi bi-journal-x fs-1 text-muted opacity-50"></i>
                  <p className="mt-3 fw-medium text-muted mb-0">No indexed items yet.</p>
                </div>
              ) : (
                completedItems.map((item, i) => <VideoJobCard key={item.filename || i} item={item} index={i} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [theme, setTheme] = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { backendConfig, mappings, saveSettings } = useSettings();
  const [tempConfig, setTempConfig] = useState(backendConfig);
  const [tempMappings, setTempMappings] = useState(mappings);

  const [statusData, setStatusData] = useState({});
  const [licenseStatus, setLicenseStatus] = useState({ valid: false, text: 'Checking...', credits: '-' });
  const pollTimer = useRef(null);

  useEffect(() => {
    if (showSettings) {
      setTempConfig(backendConfig);
      setTempMappings(mappings);
    }
  }, [showSettings, backendConfig, mappings]);

  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  const fetchStatus = useCallback(async () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    try {
      const res = await fetch(`${apiBase}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        // console.log('Status data:', data);
        if (data.in_progress) pollTimer.current = setTimeout(fetchStatus, 2000); 
      } else {
        setStatusData(prev => ({ ...prev, current_video: 'Offline' }));
      }
    } catch (e) {
      console.warn('Poll failed', e);
    }
  }, [apiBase]);

  const checkLicense = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;
      if (info.status === 'License valid') {
        setLicenseStatus({ valid: true, text: 'Active', credits: `${info["Remaining Hourly Credits"]} Hrs` });
      } else {
        setLicenseStatus({ valid: false, text: info.status?.includes('Key exists') ? 'Activation Required' : 'Inactive', credits: '' });
      }
    } catch (e) {
      setLicenseStatus({ valid: false, text: 'Offline', credits: 'Conn Fail' });
    }
  }, [apiBase]);

  useEffect(() => {
    const licenseTimer = setInterval(checkLicense, 60000); 
    checkLicense();
    fetchStatus();
    return () => {
      clearInterval(licenseTimer);
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [checkLicense, fetchStatus]);

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchStatus();
    }
  }, [activeTab, fetchStatus]);

  const handleSaveSettings = () => {
    saveSettings(tempConfig, tempMappings);
    setShowSettings(false);
  };

  return (
    <>
      <style>{modernStyles}</style>
      <div className="app-layout">
        
        {/* Mobile Header */}
        <div className="mobile-header shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <img src='https://gyrus.ai/assets/homepageAssets/gyrus-fav-blue.png' alt="Logo" width={32} />
            <span className="fw-bold text-truncate" style={{ color: 'var(--text-main)' }}>MediaSearch</span>
          </div>
          <button className="btn shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }} onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list fs-5" style={{ color: 'var(--text-main)' }}></i>
          </button>
        </div>

        <Sidebar 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          licenseStatus={licenseStatus} setShowSettings={setShowSettings} 
          isOpen={sidebarOpen} setIsOpen={setSidebarOpen} 
        />

        <main className="main-content flex-grow-1 p-4 p-md-5 w-100">
          {activeTab === 'Dashboard' && <DashboardView statusData={statusData} setActiveTab={setActiveTab} />}
          {activeTab === 'Upload & Index' && <div className="fade-in"><UploadPage backendConfig={backendConfig} mappings={mappings} setMappings={(newM) => saveSettings(backendConfig, newM)} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'Search Media' && <div className="fade-in"><SearchPage backendConfig={backendConfig} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'Library' && <div className="fade-in"><LibraryPage backendConfig={backendConfig} setShowSettings={setShowSettings} /></div>}
          {activeTab === 'LicenseManager' && <div className="fade-in"><LicenseManager onActivationSuccess={checkLicense} /></div>}
        </main>

        {/* Modernized Settings Modal */}
        {showSettings && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered fade-in">
              <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: '24px', backgroundColor: 'var(--card-bg)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>
                
                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4 px-md-5">
                  <h4 className="modal-title fw-bolder text-main">Platform Settings</h4>
                  <button type="button" className="btn-close shadow-none" onClick={() => setShowSettings(false)}></button>
                </div>
                
                <div className="modal-body p-4 p-md-5">
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Appearance</label>
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-4 transition" style={{ backgroundColor: 'var(--bg-main)' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="v-icon-box shadow-sm" style={{ width: '45px', height:'45px', backgroundColor: 'var(--card-bg)' }}>
                          <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill text-primary' : 'sun-fill text-warning'}`}></i>
                        </div>
                        <div>
                          <span className="fw-bold d-block" style={{ color: 'var(--text-main)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                          <span className="small text-muted">Adjust the visual theme</span>
                        </div>
                      </div>
                      <div className="form-check form-switch fs-4 mb-0">
                        <input className="form-check-input shadow-none" type="checkbox" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Backend Connection</label>
                    <div className="input-group input-group-lg shadow-sm" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <span className="input-group-text border-0"><i className="bi bi-hdd-network"></i></span>
                      <input className="form-control border-0 bg-transparent" value={tempConfig.host} onChange={e => setTempConfig({ ...tempConfig, host: e.target.value })} placeholder="Host (e.g., 127.0.0.1)" />
                      <span className="input-group-text border-0">:</span>
                      <input className="form-control border-0 bg-transparent" style={{ maxWidth: '120px' }} type="number" value={tempConfig.port} onChange={e => setTempConfig({ ...tempConfig, port: e.target.value })} placeholder="Port" />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Path Mappings</label>
                    <div className="p-3 p-md-4 rounded-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                      {tempMappings.length === 0 && <div className="text-muted small mb-3 text-center">No volume mappings configured.</div>}
                      {tempMappings.map((m, i) => (
                        <div className="d-flex flex-column flex-md-row gap-2 mb-3" key={i}>
                          <input className="form-control form-control-lg shadow-sm border-0" placeholder="Local (e.g., C:\Videos)" value={m.local} onChange={e => {
                            const newM = [...tempMappings]; newM[i].local = e.target.value; setTempMappings(newM);
                          }} />
                          <div className="d-none d-md-flex align-items-center text-muted"><i className="bi bi-arrow-right"></i></div>
                          <div className="d-md-none text-center text-muted"><i className="bi bi-arrow-down"></i></div>
                          <input className="form-control form-control-lg shadow-sm border-0" placeholder="Docker (e.g., /app/data)" value={m.docker} onChange={e => {
                            const newM = [...tempMappings]; newM[i].docker = e.target.value; setTempMappings(newM);
                          }} />
                          <button className="btn shadow-sm text-danger px-3 rounded-3" style={{ backgroundColor: 'var(--danger-light)' }} onClick={() => {
                            const newM = [...tempMappings]; newM.splice(i, 1); setTempMappings(newM);
                          }}><i className="bi bi-trash-fill"></i></button>
                        </div>
                      ))}
                      <button className="btn btn-outline-primary rounded-pill mt-2 fw-semibold px-4 py-2 w-100 w-md-auto" onClick={() => setTempMappings([...tempMappings, { local: '', docker: '' }])}>
                        <i className="bi bi-plus-lg me-2"></i> Add Path Rule
                      </button>
                    </div>
                  </div>

                </div>
                <div className="modal-footer border-top-0 pt-0 pb-4 px-4 px-md-5 d-flex justify-content-between">
                  <button className="btn rounded-pill px-4 py-2 fw-semibold" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)' }} onClick={() => setShowSettings(false)}>Cancel</button>
                  <button className="btn btn-primary rounded-pill px-5 py-2 fw-semibold shadow-sm" onClick={handleSaveSettings}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}