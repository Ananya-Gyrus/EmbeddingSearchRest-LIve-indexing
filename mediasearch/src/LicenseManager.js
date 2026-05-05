import React, { useState, useEffect, useCallback } from 'react';
import { getApiBase } from './apiBase';

const modernLicenseStyles = `
  .license-wrapper {
    min-height: calc(100vh - 120px);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .license-card {
    background-color: var(--card-bg);
    border-radius: 24px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .license-card:hover {
    transform: translateY(-5px);
  }

  .license-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 6px;
    background: var(--primary);
  }

  .license-icon-wrapper {
    width: 88px;
    height: 88px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto;
    font-size: 2.8rem;
    background: var(--primary-light);
    color: var(--primary);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .license-icon-wrapper.active {
    background: var(--success-light);
    color: var(--success);
    animation: successPulse 2.5s infinite;
  }

  @keyframes successPulse {
    0% { box-shadow: 0 0 0 0 var(--success-light); }
    70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .license-icon-wrapper.inactive {
    background: var(--danger-light);
    color: var(--danger);
  }

  .fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .credits-display {
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    text-align: center;
    margin-top: 2rem;
    transition: transform 0.3s ease;
  }

  .credits-display:hover {
    transform: translateY(-3px);
  }

  .credits-number {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 0.5rem;
    color: var(--primary);
    letter-spacing: -2px;
  }

  .modern-input-group {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
  }

  .modern-input-group .bi {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    z-index: 5;
  }

  .modern-input {
    background-color: var(--input-bg) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-main) !important;
    border-radius: 14px !important;
    padding: 1.15rem 1.25rem 1.15rem 3rem !important;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .modern-input:focus {
    background-color: var(--card-bg) !important;
    box-shadow: 0 0 0 3px var(--primary-light) !important;
    border-color: var(--primary) !important;
  }

  .btn-gradient {
    background-color: var(--primary);
    border: none;
    color: white;
    font-weight: 700;
    padding: 16px;
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    letter-spacing: 0.5px;
  }

  .btn-gradient:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px var(--primary-light);
    color: white;
  }
  
  .btn-gradient:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const roundToDecimal = (num, places) => {
  const parsedNum = parseFloat(num);
  if (isNaN(parsedNum)) return num || 0; 
  const factor = Math.pow(10, places);
  return Math.round(parsedNum * factor) / factor;
};

const LicenseManager = ({ onActivationSuccess }) => {
  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5800 });
  const [status, setStatus] = useState('checking'); 
  const [inactiveReason, setInactiveReason] = useState('invalid or expired');
  const [credits, setCredits] = useState(0);
  const [licenseKey, setLicenseKey] = useState(''); 
  const [isActivating, setIsActivating] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const apiBase = getApiBase(backendConfig);

  useEffect(() => {
    const saved = localStorage.getItem('gyrus_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.backendHost) setBackendConfig({ host: parsed.backendHost, port: parsed.backendPort });
      } catch(e) { console.warn("Could not parse settings"); }
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;

      if (info.status === "License valid") {
        setStatus('active');
        if (info["Remaining Hourly Credits"] !== undefined) {
          setCredits(info["Remaining Hourly Credits"]);
        }
      } else {
        setStatus('inactive');
        setInactiveReason(info.status && info.status !== "License valid" ? info.status.toLowerCase() : 'invalid or expired');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }, [apiBase]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setAlert({ show: true, message: 'Please enter a license key.', type: 'danger' });
      return;
    }

    setIsActivating(true);
    setAlert({ show: false, message: '', type: '' });

    try {
      const res = await fetch(`${apiBase}/activate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: licenseKey }) 
      });

      const data = await res.json();

      if (data.success) {
        setAlert({ show: true, message: 'License successfully updated and activated!', type: 'success' });
        setLicenseKey('');
        checkStatus(); 
        
        if (onActivationSuccess) {
          setTimeout(() => { onActivationSuccess(); }, 1000);
        }
      } else {
        setAlert({ show: true, message: data.error || "Invalid license key. Please check and try again.", type: 'danger' });
      }
    } catch (e) {
      setAlert({ show: true, message: 'Could not connect to the licensing server.', type: 'danger' });
    } finally {
      setIsActivating(false);
    }
  };

  const renderIcon = () => {
    if (status === 'checking') return <i className="bi bi-shield-lock spinner-border-sm text-opacity-75"></i>;
    if (status === 'active') return <i className="bi bi-shield-check"></i>;
    if (status === 'inactive') return <i className="bi bi-shield-x"></i>; 
    return <i className="bi bi-wifi-off"></i>;
  };

  return (
    <>
      <style>{modernLicenseStyles}</style>
      <div className="license-wrapper">
        <div className="license-card fade-in-up">
          
          <div className="p-4 p-md-5">
            <div className="text-center mb-4 pb-2">
              <div className={`license-icon-wrapper ${status}`}>
                {renderIcon()}
              </div>
              <h3 className="fw-bolder mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>License Manager</h3>
              <p className="small mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Secure System Activation Portal</p>
            </div>

            {status === 'checking' && (
              <div className="text-center py-5 fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '0.25em', color: 'var(--primary)' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Verifying Integrity</h5>
                <p className="small fw-medium" style={{ color: 'var(--text-muted)' }}>Communicating with the licensing server...</p>
              </div>
            )}

            {status === 'active' && (
              <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2 py-2 rounded-pill w-75 mx-auto" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                  <i className="bi bi-check-circle-fill"></i>
                  <span className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '0.85rem' }}>License Active</span>
                </div>
                
                <div className="credits-display shadow-sm mb-4">
                  <div className="text-uppercase fw-bold mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px', fontSize: '0.8rem' }}>Available Balance</div>
                  <div className="credits-number">{roundToDecimal(credits, 3)} Hours</div>
                  <div className="fw-semibold mt-3 p-2 rounded-3 shadow-sm d-inline-block" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                    <i className="bi bi-clock-history me-2" style={{ color: 'var(--primary)' }}></i>Compute Hours Remaining
                  </div>
                </div>
              </div>
            )}

            {status === 'inactive' && (
              <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="p-3 mb-4 rounded-4 d-flex gap-3 align-items-center" style={{ backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
                  <div className="p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', flexShrink: 0, backgroundColor: 'var(--card-bg)' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-5" style={{ color: 'var(--danger)' }}></i>
                  </div>
                  <span className="small fw-semibold" style={{ color: 'var(--danger)', lineHeight: '1.5' }}>
                    Current license is {inactiveReason}. Please enter a new valid license key to restore system access.
                  </span>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="mb-3 d-inline-block p-4 rounded-circle" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                  <i className="bi bi-hdd-network-fill" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold mt-2" style={{ color: 'var(--text-main)' }}>Connection Failed</h5>
                <p className="small mb-4 px-3" style={{ color: 'var(--text-muted)' }}>Unable to reach the licensing server. Please check your backend network configuration in Settings.</p>
                <button className="btn rounded-pill px-5 py-2 fw-bold mb-4" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', backgroundColor: 'transparent' }} onClick={checkStatus}>
                  <i className="bi bi-arrow-clockwise me-2"></i>Retry Connection
                </button>
              </div>
            )}

            {status !== 'checking' && (
              <div className={`fade-in-up ${status === 'active' || status === 'error' ? 'pt-4 border-top mt-4' : ''}`} style={{ borderColor: 'var(--border-color)', animationDelay: '0.2s' }}>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase mb-2 ms-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    {status === 'active' ? 'Apply New License Key' : 'License Key'}
                  </label>
                  <div className="modern-input-group">
                    <i className="bi bi-key-fill fs-5"></i>
                    <input 
                      type="password" 
                      className="form-control modern-input w-100" 
                      placeholder="Enter new license key..."
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                      disabled={isActivating}
                    />
                  </div>
                </div>

                <button 
                  className="btn btn-gradient w-100 d-flex align-items-center justify-content-center gap-2" 
                  onClick={handleActivate}
                  disabled={isActivating || !licenseKey.trim()}
                >
                  {isActivating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Verifying Key...</span>
                    </>
                  ) : (
                    <>
                      <i className={status === 'active' ? "bi bi-arrow-repeat fs-5" : "bi bi-unlock-fill fs-5"}></i>
                      <span>{status === 'active' ? 'Update License' : 'Activate License'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {alert.show && (
              <div className={`mt-4 p-3 d-flex align-items-center gap-3 border-0 shadow-sm fade-in-up`} style={{ borderRadius: '16px', backgroundColor: alert.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)', color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)' }} role="alert">
                <i className={`bi fs-4 ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                <span className="fw-semibold small">{alert.message}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LicenseManager;