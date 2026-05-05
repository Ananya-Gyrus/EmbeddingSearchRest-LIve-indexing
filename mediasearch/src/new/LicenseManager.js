import React, { useState, useEffect } from 'react';

/* ─── Styles (matches App.js design system) ──────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .lm-wrapper {
    min-height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    font-family: 'DM Sans', sans-serif;
  }

  .lm-card {
    width: 100%;
    max-width: 460px;
    background: var(--bg-surface, #0f1525);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 28px;
    overflow: hidden;
    position: relative;
    animation: lm-rise 0.5s cubic-bezier(0.34,1.2,0.64,1) both;
  }

  @keyframes lm-rise {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* top accent bar */
  .lm-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.6), rgba(167,139,250,0.6), transparent);
  }

  /* ambient glow */
  .lm-card::after {
    content: '';
    position: absolute;
    top: -80px; left: 50%;
    transform: translateX(-50%);
    width: 300px; height: 200px;
    background: radial-gradient(ellipse, rgba(79,142,247,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .lm-body { padding: 40px; position: relative; z-index: 1; }

  /* ── Icon ── */
  .lm-icon {
    width: 72px; height: 72px;
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin: 0 auto 24px;
    position: relative;
    transition: all 0.4s ease;
  }

  .lm-icon-checking {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(138,150,168,0.6);
  }

  .lm-icon-active {
    background: rgba(52,211,153,0.12);
    border: 1px solid rgba(52,211,153,0.25);
    color: #34d399;
    box-shadow: 0 0 32px rgba(52,211,153,0.15);
    animation: lm-pulse-green 3s ease-in-out infinite;
  }

  .lm-icon-inactive {
    background: rgba(251,146,60,0.1);
    border: 1px solid rgba(251,146,60,0.2);
    color: #fb923c;
  }

  .lm-icon-error {
    background: rgba(244,114,182,0.1);
    border: 1px solid rgba(244,114,182,0.2);
    color: #f472b6;
  }

  @keyframes lm-pulse-green {
    0%, 100% { box-shadow: 0 0 20px rgba(52,211,153,0.1); }
    50%       { box-shadow: 0 0 40px rgba(52,211,153,0.25); }
  }

  /* ── Header text ── */
  .lm-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 22px;
    letter-spacing: -0.5px;
    color: #e8eaf2;
    text-align: center; margin-bottom: 4px;
  }

  .lm-subtitle {
    font-size: 13px;
    color: rgba(138,150,168,0.7);
    text-align: center; margin-bottom: 32px;
  }

  /* ── Divider ── */
  .lm-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 0 -40px 28px;
  }

  /* ── Status chips ── */
  .lm-status-chip {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.6px; text-transform: uppercase;
    margin: 0 auto 24px; display: flex; justify-content: center; width: fit-content;
    margin-left: auto; margin-right: auto;
  }

  .lm-status-chip-active {
    background: rgba(52,211,153,0.12);
    border: 1px solid rgba(52,211,153,0.25);
    color: #34d399;
  }

  .lm-status-chip-inactive {
    background: rgba(251,146,60,0.1);
    border: 1px solid rgba(251,146,60,0.2);
    color: #fb923c;
  }

  .lm-chip-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor;
    animation: lm-dot-pulse 1.8s ease-in-out infinite;
  }

  @keyframes lm-dot-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* ── Credits display ── */
  .lm-credits-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
    transition: border-color 0.3s;
  }

  .lm-credits-box:hover { border-color: rgba(79,142,247,0.25); }

  .lm-credits-box::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.06) 0%, transparent 65%);
    pointer-events: none;
  }

  .lm-credits-label {
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: rgba(138,150,168,0.6); margin-bottom: 10px;
  }

  .lm-credits-value {
    font-family: 'Syne', sans-serif;
    font-size: 56px; font-weight: 800;
    letter-spacing: -3px; line-height: 1;
    background: linear-gradient(135deg, #4f8ef7 30%, #a78bfa 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; margin-bottom: 6px;
  }

  .lm-credits-unit {
    font-size: 13px; font-weight: 500;
    color: rgba(138,150,168,0.55);
  }

  /* ── Info banner ── */
  .lm-info-banner {
    background: rgba(251,146,60,0.07);
    border: 1px solid rgba(251,146,60,0.18);
    border-radius: 14px;
    padding: 14px 16px;
    display: flex; gap: 12px; align-items: flex-start;
    margin-bottom: 24px;
  }

  .lm-info-icon { color: #fb923c; font-size: 15px; flex-shrink: 0; margin-top: 1px; }

  .lm-info-text {
    font-size: 13px; line-height: 1.55;
    color: rgba(224,190,140,0.85);
  }

  /* ── Form field ── */
  .lm-field-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.8px; text-transform: uppercase;
    color: rgba(138,150,168,0.7); margin-bottom: 9px;
  }

  .lm-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    color: #e8eaf2;
    padding: 12px 16px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: all 0.22s ease;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }

  .lm-input::placeholder { color: rgba(138,150,168,0.35); }

  .lm-input:focus {
    border-color: rgba(79,142,247,0.55);
    background: rgba(79,142,247,0.05);
    box-shadow: 0 0 0 3px rgba(79,142,247,0.12);
  }

  .lm-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Activate button ── */
  .lm-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 24px;
    border-radius: 14px;
    background: linear-gradient(135deg, #4f8ef7, #7b6cf6);
    border: none; color: #fff;
    font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 6px 24px rgba(79,142,247,0.3);
  }

  .lm-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(79,142,247,0.45);
    background: linear-gradient(135deg, #6ba3ff, #9283f8);
  }

  .lm-btn:active:not(:disabled) { transform: translateY(0); }

  .lm-btn:disabled {
    opacity: 0.6; cursor: not-allowed;
    box-shadow: none; transform: none;
  }

  /* ── Retry button ── */
  .lm-btn-outline {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 22px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(138,150,168,0.9);
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.22s ease;
  }

  .lm-btn-outline:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.16);
    color: #e8eaf2;
  }

  /* ── Alert ── */
  .lm-alert {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 12px;
    font-size: 13.5px; font-weight: 500;
    margin-top: 20px;
    animation: lm-rise 0.35s ease both;
  }

  .lm-alert-success {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.22);
    color: #34d399;
  }

  .lm-alert-danger {
    background: rgba(244,114,182,0.1);
    border: 1px solid rgba(244,114,182,0.22);
    color: #f472b6;
  }

  /* ── Spinner ── */
  .lm-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.15);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lm-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .lm-spinner-lg {
    width: 40px; height: 40px;
    border: 3px solid rgba(79,142,247,0.15);
    border-top-color: #4f8ef7;
    border-radius: 50%;
    animation: lm-spin 0.9s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes lm-spin { to { transform: rotate(360deg); } }

  /* ── Fade helpers ── */
  .lm-fade { animation: lm-rise 0.4s ease both; }
`;

/* ─── LicenseManager ──────────────────────────────────────────────────── */
const LicenseManager = ({ onActivationSuccess }) => {
  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5801 });
  const [status, setStatus]   = useState('checking');
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
    }
  }, []);

  useEffect(() => { checkStatus(); }, [backendConfig]);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      const res  = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;
      if (info.status === 'License valid') {
        setStatus('active');
        if (info['Remaining Hourly Credits']) setCredits(info['Remaining Hourly Credits']);
      } else {
        setStatus('inactive');
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const handleActivate = async () => {
    if (!password) {
      setAlert({ show: true, message: 'Please enter your activation key', type: 'danger' });
      return;
    }
    setIsActivating(true);
    setAlert({ show: false, message: '', type: '' });
    try {
      const res  = await fetch(`${apiBase}/activate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ show: true, message: 'License activated successfully!', type: 'success' });
        setPassword('');
        checkStatus();
        if (onActivationSuccess) setTimeout(onActivationSuccess, 1000);
      } else {
        setAlert({ show: true, message: data.error || 'Invalid activation key', type: 'danger' });
      }
    } catch {
      setAlert({ show: true, message: 'Could not reach the server', type: 'danger' });
    } finally {
      setIsActivating(false);
    }
  };

  /* icon per state */
  const ICONS = {
    checking: 'bi-shield-lock',
    active:   'bi-shield-check',
    inactive: 'bi-shield-exclamation',
    error:    'bi-wifi-off',
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="lm-wrapper">
        <div className="lm-card">
          <div className="lm-body">

            {/* Icon */}
            <div className={`lm-icon lm-icon-${status}`}>
              <i className={`bi ${ICONS[status] || ICONS.checking}`}></i>
            </div>

            {/* Header */}
            <div className="lm-title">License Manager</div>
            <div className="lm-subtitle">Secure activation portal</div>

            <div className="lm-divider"></div>

            {/* ─── CHECKING ─── */}
            {status === 'checking' && (
              <div className="lm-fade" style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                <div className="lm-spinner-lg"></div>
                <div style={{ fontSize: 13.5, color: 'rgba(138,150,168,0.65)', fontWeight: 500 }}>
                  Verifying license integrity…
                </div>
              </div>
            )}

            {/* ─── ACTIVE ─── */}
            {status === 'active' && (
              <div className="lm-fade">
                <div className="lm-status-chip lm-status-chip-active">
                  <div className="lm-chip-dot"></div>
                  System Activated
                </div>

                <div className="lm-credits-box">
                  <div className="lm-credits-label">Available Balance</div>
                  <div className="lm-credits-value">{credits}</div>
                  <div className="lm-credits-unit">Compute Hours Remaining</div>
                </div>
              </div>
            )}

            {/* ─── INACTIVE ─── */}
            {status === 'inactive' && (
              <div className="lm-fade">
                <div className="lm-status-chip lm-status-chip-inactive">
                  <div className="lm-chip-dot"></div>
                  Not Activated
                </div>

                <div className="lm-info-banner">
                  <i className="bi bi-info-circle lm-info-icon"></i>
                  <div className="lm-info-text">
                    Your system requires activation. Enter your administrator password to unlock full access.
                  </div>
                </div>

                <label className="lm-field-label">
                  <i className="bi bi-key"></i> Activation Key
                </label>
                <input
                  type="password"
                  className="lm-input"
                  placeholder="Enter password…"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                  disabled={isActivating}
                />

                <button className="lm-btn" onClick={handleActivate} disabled={isActivating}>
                  {isActivating ? (
                    <>
                      <div className="lm-spinner"></div>
                      <span>Verifying…</span>
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

            {/* ─── ERROR ─── */}
            {status === 'error' && (
              <div className="lm-fade" style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 14, color: 'rgba(244,114,182,0.6)' }}>
                  <i className="bi bi-cloud-slash"></i>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e8eaf2', marginBottom: 8 }}>
                  Connection Failed
                </div>
                <div style={{ fontSize: 13, color: 'rgba(138,150,168,0.6)', marginBottom: 24, lineHeight: 1.55 }}>
                  Unable to reach the licensing server.<br />Check your backend configuration.
                </div>
                <button className="lm-btn-outline" onClick={checkStatus}>
                  <i className="bi bi-arrow-clockwise"></i> Retry
                </button>
              </div>
            )}

            {/* Alert */}
            {alert.show && (
              <div className={`lm-alert lm-alert-${alert.type}`}>
                <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                <span>{alert.message}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LicenseManager;
