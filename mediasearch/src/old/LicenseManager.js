import React, { useState, useEffect } from 'react';

// --- Embedded Modern CSS ---
const modernLicenseStyles = `
  .license-wrapper {
    min-height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .license-card {
    background-color: var(--card-bg, #ffffff);
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color, #e2e8f0);
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
  }

  .license-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 6px;
    background: linear-gradient(90deg, var(--primary, #4318FF), #868CFF);
  }

  .license-icon-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto;
    font-size: 2.5rem;
    background: var(--primary-light, #e9e3ff);
    color: var(--primary, #4318FF);
    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.1);
  }

  .license-icon-wrapper.active {
    background: var(--success-light, #e5f7ed);
    color: var(--success, #01B574);
    box-shadow: 0 10px 20px rgba(1, 181, 116, 0.1);
  }

  .license-icon-wrapper.inactive {
    background: var(--warning-light, #fff9e6);
    color: #B28F00;
  }

  .fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .credits-display {
    background: var(--bg-main, #f4f7fe);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    margin-top: 1.5rem;
    transition: transform 0.2s ease;
  }

  .credits-display:hover {
    transform: translateY(-2px);
  }

  .credits-number {
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--text-main, #2b3674);
    line-height: 1;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--primary, #4318FF), #868CFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .modern-input {
    background-color: var(--bg-main, #f4f7fe) !important;
    border: 1px solid var(--border-color, #e2e8f0) !important;
    color: var(--text-main, #2b3674) !important;
    border-radius: 12px !important;
    padding: 1rem 1.25rem !important;
  }
  
  .modern-input:focus {
    box-shadow: 0 0 0 4px var(--primary-light, #e9e3ff) !important;
    border-color: var(--primary, #4318FF) !important;
  }

  .btn-gradient {
    background: linear-gradient(135deg, var(--primary, #4318FF) 0%, #868CFF 100%);
    border: none;
    color: white;
    font-weight: 600;
    padding: 14px;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .btn-gradient:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(67, 24, 255, 0.25);
    color: white;
  }
  
  .btn-gradient:disabled {
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }
`;

const LicenseManager = ({ onActivationSuccess }) => {
  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5801 });
  const [mappings, setMappings] = useState([]);
  const [status, setStatus] = useState('checking'); 
  const [credits, setCredits] = useState(0);
  const [password, setPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;

  useEffect(() => {
    const saved = localStorage.getItem('gyrus_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.backendHost) setBackendConfig({ host: parsed.backendHost, port: parsed.backendPort });
      if (parsed.mappings) setMappings(parsed.mappings);
    }
  }, []);

  // Check status whenever config is loaded/updated
  useEffect(() => {
    checkStatus();
  }, [backendConfig]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;

      if (info.status === "License valid") {
        setStatus('active');
        if (info["Remaining Hourly Credits"]) {
          setCredits(info["Remaining Hourly Credits"]);
        }
      } else {
        setStatus('inactive');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleActivate = async () => {
    if (!password) {
      setAlert({ show: true, message: 'Please enter your activation password', type: 'danger' });
      return;
    }

    setIsActivating(true);
    setAlert({ show: false, message: '', type: '' });

    try {
      const res = await fetch(`${apiBase}/activate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (data.success) {
        setAlert({ show: true, message: 'Activation Successful!', type: 'success' });
        
        // Instead of a hard reload, update state gracefully
        setPassword('');
        checkStatus(); 
        
        // Notify parent component (App.js) to update sidebar global state
        if (onActivationSuccess) {
          setTimeout(() => {
            onActivationSuccess();
          }, 1000);
        }
      } else {
        setAlert({ show: true, message: data.error || "Invalid Password", type: 'danger' });
      }
    } catch (e) {
      setAlert({ show: true, message: 'Server Connection Failed', type: 'danger' });
    } finally {
      setIsActivating(false);
    }
  };

  const renderIcon = () => {
    if (status === 'checking') return <i className="bi bi-shield-lock text-muted spinner-border-sm"></i>;
    if (status === 'active') return <i className="bi bi-shield-check"></i>;
    if (status === 'inactive') return <i className="bi bi-shield-exclamation"></i>;
    return <i className="bi bi-wifi-off"></i>;
  };

  return (
    <>
      <style>{modernLicenseStyles}</style>
      <div className="license-wrapper">
        <div className="license-card fade-in-up">
          
          <div className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className={`license-icon-wrapper ${status}`}>
                {renderIcon()}
              </div>
              <h3 className="fw-bolder mb-1" style={{ color: 'var(--text-main)' }}>License Manager</h3>
              <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>Secure Activation Portal</p>
            </div>

            {/* --- STATE: CHECKING --- */}
            {status === 'checking' && (
              <div className="text-center py-4 fade-in-up">
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="fw-medium" style={{ color: 'var(--text-muted)' }}>Verifying license integrity...</p>
              </div>
            )}

            {/* --- STATE: ACTIVE --- */}
            {status === 'active' && (
              <div className="fade-in-up">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-3 text-success">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <span className="fw-bold fs-5 text-uppercase" style={{ letterSpacing: '0.5px' }}>System Activated</span>
                </div>
                
                <div className="credits-display shadow-sm">
                  <div className="text-uppercase fw-bold mb-2 small" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>Available Balance</div>
                  <div className="credits-number">{credits}</div>
                  <div className="fw-medium mt-2" style={{ color: 'var(--text-main)' }}>Compute Hours Remaining</div>
                </div>
              </div>
            )}

            {/* --- STATE: INACTIVE --- */}
            {status === 'inactive' && (
              <div className="fade-in-up">
                <div className="p-3 mb-4 rounded-3 d-flex gap-3 align-items-center" style={{ backgroundColor: 'var(--warning-light, #fff9e6)', border: '1px solid #ffe899' }}>
                  <i className="bi bi-info-circle-fill fs-4" style={{ color: '#B28F00' }}></i>
                  <span className="small fw-medium" style={{ color: '#8a6e00' }}>
                    Your system currently requires activation. Please enter your administrator password below.
                  </span>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase" style={{ color: 'var(--text-muted)' }}>
                    <i className="bi bi-key-fill me-2"></i>Activation Key
                  </label>
                  <input 
                    type="password" 
                    className="form-control modern-input shadow-sm" 
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                    disabled={isActivating}
                  />
                </div>

                <button 
                  className="btn btn-gradient w-100 shadow-sm d-flex align-items-center justify-content-center gap-2" 
                  onClick={handleActivate}
                  disabled={isActivating}
                >
                  {isActivating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-unlock-fill"></i>
                      <span>Activate License</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- STATE: ERROR --- */}
            {status === 'error' && (
              <div className="text-center py-4 fade-in-up">
                <div className="text-danger mb-3"><i className="bi bi-cloud-slash-fill" style={{ fontSize: '3rem' }}></i></div>
                <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Connection Failed</h5>
                <p className="small mb-4" style={{ color: 'var(--text-muted)' }}>Unable to reach the licensing server. Check your backend configuration.</p>
                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold" onClick={checkStatus}>
                  <i className="bi bi-arrow-clockwise me-2"></i>Retry
                </button>
              </div>
            )}

            {/* Alerts */}
            {alert.show && (
              <div className={`alert alert-${alert.type} mt-4 d-flex align-items-center gap-2 border-0 shadow-sm fade-in-up`} style={{ borderRadius: '12px' }} role="alert">
                <i className={`bi fs-5 ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                <span className="fw-medium">{alert.message}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LicenseManager;