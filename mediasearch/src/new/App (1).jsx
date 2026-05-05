import 'bootstrap-icons/font/bootstrap-icons.css';
import UploadPage from './UploadPage';
import SearchPage from './SearchPage';
import LibraryPage from './LibraryPage';
import LicenseManager from './LicenseManager';
import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0a0a0f;
      --surface:   #111118;
      --surface2:  #16161f;
      --surface3:  #1c1c28;
      --border:    rgba(255,255,255,0.07);
      --border2:   rgba(255,255,255,0.12);
      --text:      #e8e8f0;
      --text-muted:#8888a8;
      --text-dim:  #555570;
      --accent:    #7c6ef5;
      --accent2:   #5b4ef0;
      --teal:      #2dd4bf;
      --amber:     #f59e0b;
      --rose:      #f43f5e;
      --green:     #10b981;
      --radius:    14px;
      --radius-sm: 8px;
      --shadow:    0 8px 32px rgba(0,0,0,0.4);
      --shadow-lg: 0 20px 60px rgba(0,0,0,0.6);
      --glow:      0 0 40px rgba(124,110,245,0.15);
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      overflow: hidden;
    }

    /* ── Scrollbars ── */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    /* ── Layout ── */
    .app-shell { display: flex; height: 100vh; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 24px 0;
      position: relative;
      overflow: hidden;
      transition: width 0.3s ease;
    }
    .sidebar::before {
      content: '';
      position: absolute;
      top: -80px; left: -80px;
      width: 240px; height: 240px;
      background: radial-gradient(circle, rgba(124,110,245,0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 20px 28px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-brand img { width: 30px; height: 30px; object-fit: contain; }
    .sidebar-brand-name {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 17px;
      letter-spacing: -0.3px;
      background: linear-gradient(135deg, #fff 40%, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sidebar-nav { flex: 1; padding: 20px 12px; display: flex; flex-direction: column; gap: 2px; }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-muted);
      font-size: 13.5px;
      font-weight: 500;
      letter-spacing: 0.1px;
      transition: all 0.2s ease;
      position: relative;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .sidebar-item:hover {
      color: var(--text);
      background: var(--surface3);
    }
    .sidebar-item.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(124,110,245,0.25), rgba(91,78,240,0.15));
      border-color: rgba(124,110,245,0.3);
      box-shadow: inset 0 0 20px rgba(124,110,245,0.05);
    }
    .sidebar-item.active .nav-icon { color: var(--accent); }
    .sidebar-item .nav-icon { font-size: 15px; width: 18px; flex-shrink: 0; transition: color 0.2s; }
    .sidebar-item .active-dot {
      position: absolute;
      right: 10px;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }

    .sidebar-section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--text-dim);
      padding: 14px 12px 6px;
    }

    .sidebar-footer {
      padding: 16px 16px;
      border-top: 1px solid var(--border);
      margin: 0 12px;
    }
    .license-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface3);
      border: 1px solid var(--border2);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .license-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      flex-shrink: 0;
    }
    .license-dot.inactive { background: var(--text-dim); box-shadow: none; }
    .license-text { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .license-credits { font-size: 11px; font-weight: 700; color: var(--teal); }

    /* ── Main Content ── */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 40px 44px;
      background: var(--bg);
      animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .page-title {
      font-family: 'Syne', sans-serif;
      font-size: 30px;
      font-weight: 800;
      letter-spacing: -1px;
      color: #fff;
      line-height: 1.1;
    }
    .page-subtitle {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-top: 4px;
      font-weight: 400;
    }

    .btn-primary-custom {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 20px rgba(124,110,245,0.35);
    }
    .btn-primary-custom:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(124,110,245,0.5);
    }
    .btn-primary-custom:active { transform: translateY(0); }

    /* ── Stat Cards ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      animation: slideUp 0.5s ease both;
    }
    .stat-card:hover {
      border-color: var(--border2);
      transform: translateY(-3px);
      box-shadow: var(--shadow);
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      border-radius: var(--radius) var(--radius) 0 0;
    }
    .stat-card.purple::after { background: linear-gradient(90deg, var(--accent), transparent); }
    .stat-card.teal::after   { background: linear-gradient(90deg, var(--teal), transparent); }
    .stat-card.green::after  { background: linear-gradient(90deg, var(--green), transparent); }
    .stat-card.amber::after  { background: linear-gradient(90deg, var(--amber), transparent); }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .stat-card:nth-child(1) { animation-delay: 0.05s; }
    .stat-card:nth-child(2) { animation-delay: 0.10s; }
    .stat-card:nth-child(3) { animation-delay: 0.15s; }
    .stat-card:nth-child(4) { animation-delay: 0.20s; }

    .stat-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-bottom: 16px;
    }
    .stat-icon-wrap.purple { background: rgba(124,110,245,0.15); color: var(--accent); }
    .stat-icon-wrap.teal   { background: rgba(45,212,191,0.15);  color: var(--teal); }
    .stat-icon-wrap.green  { background: rgba(16,185,129,0.15);  color: var(--green); }
    .stat-icon-wrap.amber  { background: rgba(245,158,11,0.15);  color: var(--amber); }

    .stat-label {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 4px;
    }
    .stat-value {
      font-family: 'Syne', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      margin-top: 6px;
    }
    .stat-badge.running { background: rgba(16,185,129,0.15); color: var(--green); }
    .stat-badge.idle    { background: rgba(255,255,255,0.06); color: var(--text-dim); }
    .pulse {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 1.5s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.7); }
    }

    /* ── Status Panel ── */
    .status-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      animation: slideUp 0.5s 0.25s ease both;
    }
    .status-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .status-panel-title {
      font-family: 'Syne', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-panel-title .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
    }
    .status-panel-body { padding: 20px 24px; }

    /* ── Summary Row ── */
    .summary-row {
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
      padding: 14px 20px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      margin-bottom: 24px;
    }
    .summary-item { display: flex; flex-direction: column; gap: 2px; }
    .summary-item-label { font-size: 10px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: var(--text-dim); }
    .summary-item-value { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #fff; }

    /* ── Video Section Heading ── */
    .section-heading {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-heading::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    /* ── Video Card ── */
    .video-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: var(--surface2);
      border: 1px solid var(--border);
      margin-bottom: 8px;
      transition: all 0.2s ease;
      animation: slideUp 0.3s ease both;
    }
    .video-card:hover { border-color: var(--border2); background: var(--surface3); }
    .video-card.is-active {
      border-color: rgba(124,110,245,0.3);
      background: linear-gradient(135deg, rgba(124,110,245,0.08), var(--surface2));
    }

    .video-thumb {
      width: 48px; height: 48px;
      border-radius: 8px;
      background: var(--surface3);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      border: 1px solid var(--border);
      color: var(--text-dim);
      font-size: 18px;
      position: relative;
      overflow: hidden;
    }
    .video-thumb.shimmer::after {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      to { left: 100%; }
    }

    .video-info { flex: 1; min-width: 0; }
    .video-name {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .video-meta { display: flex; align-items: center; gap: 8px; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .status-badge.processing { background: rgba(124,110,245,0.18); color: var(--accent); }
    .status-badge.queued     { background: rgba(255,255,255,0.07); color: var(--text-muted); }
    .status-badge.indexed    { background: rgba(16,185,129,0.15);  color: var(--green); }
    .status-badge.failed     { background: rgba(244,63,94,0.15);   color: var(--rose); }
    .status-badge .dot-sm {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: currentColor;
    }
    .status-badge.processing .dot-sm { animation: pulse 1.2s infinite; }

    .scenes-text { font-size: 11.5px; color: var(--text-dim); }

    .video-progress-wrap { margin-top: 8px; }
    .progress-track {
      height: 3px;
      background: var(--surface3);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--accent), var(--teal));
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      height: 100%;
      width: 20px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
      animation: sweep 1.5s ease infinite;
    }
    @keyframes sweep {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }

    .video-pct {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      flex-shrink: 0;
    }

    /* ── Settings Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    .modal-box {
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 18px;
      width: 560px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.94) translateY(12px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 26px;
      border-bottom: 1px solid var(--border);
    }
    .modal-title-custom {
      font-family: 'Syne', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: #fff;
    }
    .modal-close {
      width: 30px; height: 30px;
      border-radius: 8px;
      border: 1px solid var(--border2);
      background: var(--surface3);
      color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    .modal-close:hover { background: var(--rose); color: #fff; border-color: var(--rose); }
    .modal-body-custom { padding: 24px 26px; }
    .modal-footer-custom {
      padding: 18px 26px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    /* ── Form Elements ── */
    .form-section { margin-bottom: 24px; }
    .form-section-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 10px;
      display: block;
    }
    .form-input {
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 8px;
      padding: 9px 13px;
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(124,110,245,0.15);
    }
    .input-group-row { display: flex; gap: 8px; }
    .input-group-prefix {
      background: var(--surface3);
      border: 1px solid var(--border2);
      border-radius: 8px;
      padding: 9px 13px;
      color: var(--text-muted);
      font-size: 13px;
      white-space: nowrap;
      display: flex; align-items: center;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .toggle-label { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; }
    .toggle-icon { font-size: 16px; color: var(--amber); }
    .toggle-switch {
      width: 42px; height: 24px;
      background: var(--surface3);
      border-radius: 12px;
      position: relative;
      cursor: pointer;
      border: 1px solid var(--border2);
      transition: background 0.25s;
      flex-shrink: 0;
    }
    .toggle-switch.on { background: var(--accent); border-color: var(--accent); }
    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: left 0.25s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .toggle-switch.on::after { left: calc(100% - 19px); }

    .mapping-row { display: flex; gap: 6px; margin-bottom: 8px; align-items: center; }

    .btn-ghost {
      background: var(--surface3);
      border: 1px solid var(--border2);
      color: var(--text-muted);
      border-radius: 8px;
      padding: 8px 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover { color: var(--text); border-color: var(--border2); background: var(--surface2); }

    .btn-danger-ghost {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-dim);
      border-radius: 7px;
      padding: 7px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .btn-danger-ghost:hover { background: rgba(244,63,94,0.1); color: var(--rose); border-color: var(--rose); }

    .btn-save {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border: none;
      color: #fff;
      border-radius: 8px;
      padding: 9px 20px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(124,110,245,0.3);
    }
    .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(124,110,245,0.45); }

    /* ── Batch Modal ── */
    .form-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-dim);
    }
    .empty-state i { font-size: 36px; margin-bottom: 12px; opacity: 0.4; display: block; }
    .empty-state p { font-size: 13.5px; }

    /* ── Utility ── */
    .no-select { user-select: none; }
  `}</style>
);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const roundToDecimal = (num, places) => {
  const factor = Math.pow(10, places);
  return Math.round((num || 0) * factor) / factor;
};

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'Dashboard',       label: 'Dashboard',       icon: 'bi-grid-1x2' },
  { id: 'Upload & Index',  label: 'Upload & Index',  icon: 'bi-cloud-upload' },
  { id: 'Search Media',    label: 'Search Media',    icon: 'bi-search' },
  { id: 'Library',         label: 'Library',         icon: 'bi-collection-play' },
  { id: 'LicenseManager',  label: 'License',         icon: 'bi-shield-lock' },
];

const Sidebar = ({ activeTab, setActiveTab, licenseStatus, setShowSettings }) => (
  <nav className="sidebar no-select">
    <div className="sidebar-brand">
      <img src="https://gyrus.ai/assets/homepageAssets/gyrus-fav-blue.png" alt="logo" />
      <span className="sidebar-brand-name">MediaSearch</span>
    </div>

    <div className="sidebar-nav">
      <span className="sidebar-section-label">Navigation</span>
      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <i className={`bi ${item.icon} nav-icon`}></i>
          <span>{item.label}</span>
          {activeTab === item.id && <span className="active-dot" />}
        </div>
      ))}

      <span className="sidebar-section-label" style={{ marginTop: 8 }}>System</span>
      <div className="sidebar-item" onClick={() => setShowSettings(true)}>
        <i className="bi bi-sliders nav-icon"></i>
        <span>Settings</span>
      </div>
    </div>

    <div className="sidebar-footer">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
        License
      </div>
      <div className="license-pill">
        <span className={`license-dot ${licenseStatus.valid ? '' : 'inactive'}`} />
        <span className="license-text">{licenseStatus.text}</span>
        {licenseStatus.credits && (
          <span className="license-credits">{licenseStatus.credits}</span>
        )}
      </div>
    </div>
  </nav>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ title, value, icon, color, isStatus, isRunning }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon-wrap ${color}`}>
      <i className={`bi ${icon}`}></i>
    </div>
    <div className="stat-label">{title}</div>
    {isStatus ? (
      <>
        <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
        <div className={`stat-badge ${isRunning ? 'running' : 'idle'}`}>
          {isRunning && <span className="pulse" />}
          {isRunning ? 'Live' : 'Idle'}
        </div>
      </>
    ) : (
      <div className="stat-value">{value}</div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   VIDEO STATUS LIST
───────────────────────────────────────────── */
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

  const activeAndQueuedCount = activeJobs.filter(j => {
    const s = (j.status || '').toLowerCase();
    return s === 'processing' || s === 'queued';
  }).length;
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
  } catch (e) { /* skip */ }

  activeJobs.sort((a, b) => {
    const order = { processing: 0, queued: 1, error: 2, done: 3 };
    return (order[a.status] || 9) - (order[b.status] || 9);
  });

  const renderCard = (item, index, isPlaceholder = false) => {
    const done = item.scenes_processed || 0;
    const total = item.total_scenes || 1;
    const pct = isPlaceholder ? 0 : Math.min(100, Math.floor((done / total) * 100));
    const s = (item.status || 'queued').toLowerCase();

    let badgeClass = 'queued';
    let badgeText = 'Queued';
    if (s === 'processing')         { badgeClass = 'processing'; badgeText = 'Processing'; }
    else if (['indexed','done'].includes(s)) { badgeClass = 'indexed'; badgeText = 'Indexed'; }
    else if (['error','failed'].includes(s)) { badgeClass = 'failed';  badgeText = 'Failed'; }

    const isActive = s === 'processing';

    return (
      <div
        className={`video-card ${isActive ? 'is-active' : ''}`}
        key={`${item.filename}-${index}`}
        style={{ animationDelay: `${index * 0.04}s` }}
      >
        <div className={`video-thumb ${isActive ? 'shimmer' : ''}`}>
          <i className="bi bi-play-circle"></i>
        </div>
        <div className="video-info">
          <div className="video-name" title={item.filename}>{item.filename}</div>
          <div className="video-meta">
            <span className={`status-badge ${badgeClass}`}>
              <span className="dot-sm" />
              {badgeText}
            </span>
            {!isPlaceholder && s !== 'done' && (
              <span className="scenes-text">{done}/{total} scenes</span>
            )}
          </div>
          {s !== 'done' && s !== 'error' && !isPlaceholder && (
            <div className="video-progress-wrap">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          {item.error_message && (
            <div style={{ color: 'var(--rose)', fontSize: 11.5, marginTop: 4 }}>{item.error_message}</div>
          )}
        </div>
        {s !== 'done' && (
          <div className="video-pct">{pct}%</div>
        )}
      </div>
    );
  };

  const hasActive = activeJobs.length > 0 || missingQueue > 0;
  const hasCompleted = completedItems.length > 0;

  return (
    <div>
      {/* Summary Row */}
      <div className="summary-row">
        {[
          { label: 'Credits',   value: roundToDecimal(remaining_credits, 2) },
          { label: 'Elapsed',   value: formatDuration(elapsed_time) },
          { label: 'Processed', value: processed_videos },
          { label: 'In Queue',  value: video_queue },
        ].map(item => (
          <div className="summary-item" key={item.label}>
            <span className="summary-item-label">{item.label}</span>
            <span className="summary-item-value">{item.value}</span>
          </div>
        ))}
      </div>

      {hasActive && (
        <>
          <div className="section-heading">In Progress & Queue</div>
          {activeJobs.map((job, i) => renderCard(job, i))}
          {[...Array(missingQueue)].map((_, i) =>
            renderCard({ status: 'queued', filename: `Queued Video #${i + 1}` }, `q-${i}`, true)
          )}
        </>
      )}

      {hasCompleted && (
        <div style={{ marginTop: hasActive ? 28 : 0 }}>
          <div className="section-heading">Library — Indexed</div>
          {completedItems.map((item, i) => renderCard(item, i))}
        </div>
      )}

      {!hasActive && !hasCompleted && (
        <div className="empty-state">
          <i className="bi bi-film"></i>
          <p>No videos indexed yet.<br/>Upload files to get started.</p>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SETTINGS MODAL
───────────────────────────────────────────── */
const SettingsModal = ({ backendConfig, setBackendConfig, mappings, setMappings, theme, setTheme, onSave, onClose }) => (
  <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal-box">
      <div className="modal-header-custom">
        <span className="modal-title-custom">Settings</span>
        <button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button>
      </div>
      <div className="modal-body-custom">

        {/* Appearance */}
        <div className="form-section">
          <span className="form-section-label">Appearance</span>
          <div className="toggle-row">
            <div className="toggle-label">
              <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill' : 'sun-fill'} toggle-icon`}></i>
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div
              className={`toggle-switch ${theme === 'dark' ? 'on' : ''}`}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            />
          </div>
        </div>

        {/* Backend */}
        <div className="form-section">
          <span className="form-section-label">Backend Connection</span>
          <div className="input-group-row">
            <span className="input-group-prefix">http://</span>
            <input
              className="form-input"
              value={backendConfig.host}
              onChange={e => setBackendConfig(c => ({ ...c, host: e.target.value }))}
              placeholder="127.0.0.1"
            />
            <input
              className="form-input"
              type="number"
              value={backendConfig.port}
              onChange={e => setBackendConfig(c => ({ ...c, port: e.target.value }))}
              placeholder="5801"
              style={{ maxWidth: 90 }}
            />
          </div>
        </div>

        {/* Path Mappings */}
        <div className="form-section">
          <span className="form-section-label">Path Mappings</span>
          {mappings.map((m, i) => (
            <div className="mapping-row" key={i}>
              <input
                className="form-input"
                placeholder="Local (Z:\videos)"
                value={m.local}
                onChange={e => { const n = [...mappings]; n[i].local = e.target.value; setMappings(n); }}
              />
              <input
                className="form-input"
                placeholder="Docker (/work_dir)"
                value={m.docker}
                onChange={e => { const n = [...mappings]; n[i].docker = e.target.value; setMappings(n); }}
              />
              <button className="btn-danger-ghost" onClick={() => { const n = [...mappings]; n.splice(i, 1); setMappings(n); }}>
                <i className="bi bi-trash3"></i>
              </button>
            </div>
          ))}
          <button className="btn-ghost" style={{ marginTop: 4 }} onClick={() => setMappings([...mappings, { local: '', docker: '' }])}>
            <i className="bi bi-plus-lg" style={{ marginRight: 6 }}></i>Add Mapping
          </button>
        </div>
      </div>
      <div className="modal-footer-custom">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-save" onClick={onSave}>Save Settings</button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('gyrus_theme') || 'light');
  const [showSettings, setShowSettings] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [backendConfig, setBackendConfig] = useState({ host: '127.0.0.1', port: 5801 });
  const [mappings, setMappings] = useState([]);

  const [batchConfig, setBatchConfig] = useState({ dbName: '_default_db', useAudio: false, fps: 30 });
  const [statusData, setStatusData] = useState({});
  const [licenseStatus, setLicenseStatus] = useState({ valid: false, text: 'Checking', credits: '' });

  const apiBase = `http://${backendConfig.host}:${backendConfig.port}`;
  const pollTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gyrus_theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('gyrus_settings');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.backendHost) setBackendConfig({ host: p.backendHost, port: p.backendPort });
        if (p.mappings)    setMappings(p.mappings);
      } catch (e) { /* skip */ }
    }
  }, []);

  const fetchStatus = async () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    try {
      const res = await fetch(`${apiBase}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.in_progress) {
          pollTimer.current = setTimeout(fetchStatus, 10000);
        }
      } else {
        setStatusData(prev => ({ ...prev, current_video: 'Offline' }));
      }
    } catch (e) { console.warn('Poll failed', e); }
  };

  const checkLicense = async () => {
    try {
      const res = await fetch(`${apiBase}/licence-requirement`, { method: 'POST' });
      const data = await res.json();
      const info = data.licensestatus;
      if (info.status === 'License valid') {
        setLicenseStatus({ valid: true, text: 'Active', credits: `${info['Remaining Hourly Credits']} Hrs` });
      } else {
        const txt = info.status?.includes('Key exists') ? 'Activation Required' : 'Inactive';
        setLicenseStatus({ valid: false, text: txt, credits: '' });
      }
    } catch {
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
      backendHost: backendConfig.host,
      backendPort: backendConfig.port,
      mappings
    }));
    setShowSettings(false);
    alert('Settings saved');
  };

  return (
    <>
      <GlobalStyles />
      <div className="app-shell">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          licenseStatus={licenseStatus}
          setShowSettings={setShowSettings}
        />

        <main className="main-content" key={activeTab}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'Dashboard' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Dashboard</h1>
                  <p className="page-subtitle">Overview of your video indexing pipeline</p>
                </div>
                <button className="btn-primary-custom" onClick={() => setActiveTab('Upload & Index')}>
                  <i className="bi bi-plus-lg"></i> New Index
                </button>
              </div>

              <div className="stats-grid">
                <StatCard title="Videos Indexed"  value={statusData.processed_videos || 0}  icon="bi-film"              color="purple" />
                <StatCard title="Audio Indexed"   value={statusData.processed_audios || 0}  icon="bi-music-note-beamed" color="teal" />
                <StatCard
                  title="Pipeline"
                  value={statusData.in_progress ? 'Running' : 'Idle'}
                  icon="bi-activity"
                  color="green"
                  isStatus
                  isRunning={statusData.in_progress}
                />
                <StatCard title="Credits Left"    value={roundToDecimal(statusData.remaining_credits, 2)} icon="bi-coin" color="amber" />
              </div>

              <div className="status-panel">
                <div className="status-panel-header">
                  <div className="status-panel-title">
                    <span className="dot" />
                    Indexing Status
                  </div>
                  {statusData.in_progress && (
                    <span className="stat-badge running" style={{ fontSize: 11.5 }}>
                      <span className="pulse" /> Live
                    </span>
                  )}
                </div>
                <div className="status-panel-body">
                  <VideoStatusList statusData={statusData} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'Upload & Index' && (
            <UploadPage backendConfig={backendConfig} mappings={mappings} setMappings={setMappings} setShowSettings={setShowSettings} />
          )}
          {activeTab === 'Search Media' && (
            <SearchPage backendConfig={backendConfig} setShowSettings={setShowSettings} />
          )}
          {activeTab === 'Library' && (
            <LibraryPage backendConfig={backendConfig} setShowSettings={setShowSettings} />
          )}
          {activeTab === 'LicenseManager' && (
            <LicenseManager onActivationSuccess={checkLicense} />
          )}
        </main>

        {/* ── SETTINGS MODAL ── */}
        {showSettings && (
          <SettingsModal
            backendConfig={backendConfig}
            setBackendConfig={setBackendConfig}
            mappings={mappings}
            setMappings={setMappings}
            theme={theme}
            setTheme={setTheme}
            onSave={saveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* ── BATCH MODAL ── */}
        {showBatchModal && (
          <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowBatchModal(false)}>
            <div className="modal-box" style={{ width: 440 }}>
              <div className="modal-header-custom">
                <span className="modal-title-custom">Batch Configuration</span>
                <button className="modal-close" onClick={() => setShowBatchModal(false)}><i className="bi bi-x"></i></button>
              </div>
              <div className="modal-body-custom">
                <div className="form-section">
                  <span className="form-section-label">Database Name</span>
                  <input className="form-input" value={batchConfig.dbName} onChange={e => setBatchConfig(c => ({ ...c, dbName: e.target.value }))} />
                </div>
                <div className="form-section">
                  <span className="form-section-label">Default FPS</span>
                  <input className="form-input" type="number" value={batchConfig.fps} onChange={e => setBatchConfig(c => ({ ...c, fps: Number(e.target.value) }))} />
                </div>
                <div className="form-section">
                  <span className="form-section-label">Audio Processing</span>
                  <div className="toggle-row">
                    <div className="toggle-label">
                      <i className="bi bi-mic toggle-icon"></i>
                      <span>Use Audio</span>
                    </div>
                    <div
                      className={`toggle-switch ${batchConfig.useAudio ? 'on' : ''}`}
                      onClick={() => setBatchConfig(c => ({ ...c, useAudio: !c.useAudio }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer-custom">
                <button className="btn-ghost" onClick={() => setShowBatchModal(false)}>Cancel</button>
                <button className="btn-save" onClick={() => setShowBatchModal(false)}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
