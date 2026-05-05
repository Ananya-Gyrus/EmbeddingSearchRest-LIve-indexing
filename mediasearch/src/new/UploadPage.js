import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

/* ─── Styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .up-wrapper {
    font-family: 'DM Sans', sans-serif;
    animation: up-fade 0.4s ease both;
  }

  @keyframes up-fade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .up-header {
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 16px;
    margin-bottom: 32px; flex-wrap: wrap;
  }

  .up-title {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 28px; letter-spacing: -0.8px; line-height: 1;
    color: #e8eaf2; margin-bottom: 6px;
  }

  .up-subtitle { font-size: 13.5px; color: rgba(138,150,168,0.75); }

  .up-settings-btn {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(138,150,168,0.7); font-size: 14px; cursor: pointer;
    transition: all 0.22s ease;
  }

  .up-settings-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14); color: #e8eaf2;
  }

  /* ── Main card ── */
  .up-main-card {
    background: rgba(15,21,37,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px; padding: 28px;
    margin-bottom: 24px;
    position: relative; overflow: hidden;
  }

  .up-main-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.4), rgba(167,139,250,0.4), transparent);
  }

  /* ── Dropzone ── */
  .up-dropzone {
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 20px;
    background: rgba(255,255,255,0.02);
    padding: 44px 28px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative; overflow: hidden;
    margin-bottom: 28px;
  }

  .up-dropzone::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.05) 0%, transparent 65%);
    pointer-events: none;
  }

  .up-dropzone:hover, .up-dropzone.dz-over {
    border-color: rgba(79,142,247,0.45);
    background: rgba(79,142,247,0.04);
    transform: translateY(-2px);
  }

  .up-dropzone:hover .up-dz-icon, .up-dropzone.dz-over .up-dz-icon {
    transform: translateY(-8px);
    color: #4f8ef7;
  }

  .up-dz-icon {
    font-size: 44px; color: rgba(138,150,168,0.3);
    display: block; margin-bottom: 16px;
    transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }

  .up-dz-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px;
    color: #e8eaf2; margin-bottom: 6px;
  }

  .up-dz-sub { font-size: 13px; color: rgba(138,150,168,0.5); margin-bottom: 20px; }

  .up-btn-browse {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 22px; border-radius: 11px;
    background: rgba(79,142,247,0.12);
    border: 1px solid rgba(79,142,247,0.25);
    color: #4f8ef7; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.22s ease;
  }

  .up-btn-browse:hover {
    background: rgba(79,142,247,0.2); border-color: rgba(79,142,247,0.4);
    transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79,142,247,0.2);
  }

  /* ── Queue header ── */
  .up-queue-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
  }

  .up-queue-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
    color: #e8eaf2; display: flex; align-items: center; gap: 8px;
  }

  .up-count-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 22px; height: 22px; padding: 0 7px;
    border-radius: 20px; font-size: 11px; font-weight: 700;
    background: rgba(79,142,247,0.15);
    border: 1px solid rgba(79,142,247,0.25);
    color: #4f8ef7;
  }

  .up-toolbar { display: flex; gap: 8px; flex-wrap: wrap; }

  .up-btn-tool {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 9px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(138,150,168,0.75); font-size: 12.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.22s ease;
  }

  .up-btn-tool:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14); color: #e8eaf2;
  }

  .up-btn-tool-danger {
    color: rgba(244,114,182,0.7);
    border-color: rgba(244,114,182,0.15);
    background: rgba(244,114,182,0.06);
  }

  .up-btn-tool-danger:hover {
    background: rgba(244,114,182,0.14);
    border-color: rgba(244,114,182,0.3); color: #f472b6;
  }

  /* ── File grid ── */
  .up-file-scroll {
    max-height: 480px; overflow-y: auto; overflow-x: hidden;
    margin-bottom: 24px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  .up-file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 14px;
  }

  .up-file-card {
    background: rgba(22,29,48,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: all 0.25s ease;
    animation: up-card-in 0.35s ease both;
  }

  @keyframes up-card-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .up-file-card:hover {
    border-color: rgba(79,142,247,0.2);
    box-shadow: 0 8px 28px rgba(0,0,0,0.3);
  }

  .up-file-preview {
    height: 120px; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }

  .up-file-preview video {
    width: 100%; height: 100%; object-fit: cover;
  }

  .up-file-preview-icon {
    font-size: 32px; color: rgba(138,150,168,0.2);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }

  .up-file-preview-label {
    font-size: 10.5px; color: rgba(138,150,168,0.3); font-weight: 500;
  }

  .up-file-body { padding: 14px 14px 0; flex: 1; }

  .up-file-name {
    font-weight: 600; font-size: 13px; color: #e8eaf2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .up-file-path {
    font-size: 11px; color: rgba(138,150,168,0.45);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 5px;
  }

  /* File fields */
  .up-field {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; color: #e8eaf2;
    padding: 7px 10px; font-size: 12px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: all 0.2s ease; margin-bottom: 7px;
  }

  .up-field::placeholder { color: rgba(138,150,168,0.3); }
  .up-field:focus {
    border-color: rgba(79,142,247,0.4);
    background: rgba(79,142,247,0.04);
  }

  input[type=number].up-field::-webkit-inner-spin-button { -webkit-appearance: none; }

  .up-field-row { display: flex; gap: 7px; }
  .up-field-row .up-field { margin-bottom: 7px; }

  /* Per-file audio toggle */
  .up-file-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 8px;
  }

  .up-file-toggle-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; color: rgba(138,150,168,0.5);
  }

  .up-mini-switch { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .up-mini-switch input { opacity: 0; width: 0; height: 0; }
  .up-mini-track {
    position: absolute; cursor: pointer; inset: 0;
    background: rgba(255,255,255,0.07); border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08); transition: all 0.25s;
  }
  .up-mini-track::after {
    content: ''; position: absolute; left: 3px; top: 50%;
    transform: translateY(-50%); width: 12px; height: 12px;
    background: rgba(138,150,168,0.5); border-radius: 50%;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .up-mini-switch input:checked + .up-mini-track {
    background: rgba(79,142,247,0.25); border-color: rgba(79,142,247,0.4);
  }
  .up-mini-switch input:checked + .up-mini-track::after {
    left: calc(100% - 15px); background: #4f8ef7;
  }

  .up-file-footer { padding: 0 14px 12px; margin-top: 2px; }

  .up-btn-remove {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px; border-radius: 8px;
    background: rgba(244,114,182,0.06); border: 1px solid rgba(244,114,182,0.12);
    color: rgba(244,114,182,0.6); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s ease;
  }

  .up-btn-remove:hover {
    background: rgba(244,114,182,0.14); border-color: rgba(244,114,182,0.3);
    color: #f472b6;
  }

  /* ── Empty Queue ── */
  .up-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 40px 24px; text-align: center;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.07);
    border-radius: 16px;
  }

  .up-empty-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: rgba(138,150,168,0.25); margin-bottom: 14px;
  }

  .up-empty-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: rgba(138,150,168,0.4); margin-bottom: 4px; }
  .up-empty-sub   { font-size: 12px; color: rgba(138,150,168,0.25); }

  /* ── Config panels row ── */
  .up-config-row {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 24px;
  }

  @media (max-width: 780px) { .up-config-row { grid-template-columns: 1fr; } }

  .up-config-panel {
    background: rgba(22,29,48,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 20px;
  }

  .up-config-title {
    font-size: 10.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(138,150,168,0.5);
    margin-bottom: 16px; display: flex; align-items: center; gap: 7px;
  }

  /* Config toggle row */
  .up-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px; border-radius: 12px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 8px;
  }

  .up-toggle-row:last-child { margin-bottom: 0; }

  .up-toggle-info {}
  .up-toggle-name { font-weight: 600; font-size: 13px; color: #e8eaf2; margin-bottom: 2px; }
  .up-toggle-desc { font-size: 11.5px; color: rgba(138,150,168,0.5); }

  .up-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
  .up-switch input { opacity: 0; width: 0; height: 0; }
  .up-switch-track {
    position: absolute; cursor: pointer; inset: 0;
    background: rgba(255,255,255,0.07); border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08); transition: all 0.28s;
  }
  .up-switch-track::after {
    content: ''; position: absolute; left: 3px; top: 50%;
    transform: translateY(-50%); width: 14px; height: 14px;
    background: rgba(138,150,168,0.5); border-radius: 50%;
    transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .up-switch input:checked + .up-switch-track {
    background: rgba(79,142,247,0.28); border-color: rgba(79,142,247,0.45);
  }
  .up-switch input:checked + .up-switch-track::after {
    left: calc(100% - 17px); background: #4f8ef7;
  }

  /* Mappings list */
  .up-mappings-list { overflow-y: auto; max-height: 120px; }

  .up-mapping-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 9px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 6px; font-size: 12px; font-family: 'JetBrains Mono', monospace;
  }

  .up-mapping-local  { color: #4f8ef7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .up-mapping-arrow  { color: rgba(138,150,168,0.3); flex-shrink: 0; }
  .up-mapping-docker { color: #34d399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

  .up-manage-link {
    font-size: 12px; font-weight: 600; color: rgba(79,142,247,0.7);
    cursor: pointer; background: none; border: none;
    font-family: 'DM Sans', sans-serif; padding: 0; transition: color 0.2s;
  }
  .up-manage-link:hover { color: #4f8ef7; }

  /* ── Execute button ── */
  .up-btn-execute {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 9px;
    padding: 15px 32px; border-radius: 16px;
    background: linear-gradient(135deg, #4f8ef7, #7b6cf6);
    border: none; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
    cursor: pointer; transition: all 0.28s ease;
    box-shadow: 0 6px 28px rgba(79,142,247,0.32);
    letter-spacing: -0.2px;
  }

  .up-btn-execute:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 12px 36px rgba(79,142,247,0.48);
    background: linear-gradient(135deg, #6ba3ff, #9283f8);
  }

  .up-btn-execute:active:not(:disabled) { transform: translateY(0); }

  .up-btn-execute:disabled {
    opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none;
  }

  /* ── Terminal / Console ── */
  .up-console-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    margin-bottom: 12px;
  }

  @media (max-width: 780px) { .up-console-row { grid-template-columns: 1fr; } }

  .up-console-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }

  .up-console-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(138,150,168,0.45);
    display: flex; align-items: center; gap: 7px;
  }

  .up-console-clear {
    font-size: 11.5px; font-weight: 600; color: rgba(79,142,247,0.6);
    cursor: pointer; background: none; border: none;
    font-family: 'DM Sans', sans-serif; padding: 0; transition: color 0.2s;
  }
  .up-console-clear:hover { color: #4f8ef7; }

  .up-terminal {
    background: rgba(5,8,18,1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 16px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px; line-height: 1.7;
    overflow-y: auto; max-height: 200px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent;
  }

  .up-log-line { display: flex; gap: 0; }
  .up-log-time { color: rgba(100,116,139,0.7); margin-right: 10px; flex-shrink: 0; }
  .up-log-msg  { color: #10b981; }

  .up-json-content { color: #38bdf8; white-space: pre; }
  .up-json-placeholder { color: rgba(100,116,139,0.5); font-style: italic; }

  /* ── Modal ── */
  .up-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; animation: up-fade 0.2s ease;
  }

  .up-modal-box {
    background: rgba(15,21,37,1);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; width: 90%; max-width: 460px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6);
    animation: up-modal-in 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
    overflow: hidden;
  }

  @keyframes up-modal-in {
    from { opacity: 0; transform: scale(0.92) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .up-modal-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 26px; border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .up-modal-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: #e8eaf2;
  }

  .up-modal-close {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(138,150,168,0.7); font-size: 13px; transition: all 0.2s;
  }

  .up-modal-close:hover { background: rgba(255,255,255,0.1); color: #e8eaf2; }
  .up-modal-body { padding: 26px; display: flex; flex-direction: column; gap: 20px; }
  .up-modal-footer { padding: 18px 26px; border-top: 1px solid rgba(255,255,255,0.07); }

  .up-modal-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: rgba(138,150,168,0.55); margin-bottom: 8px; display: block;
  }

  .up-modal-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 11px;
    color: #e8eaf2; padding: 10px 14px; font-size: 13.5px;
    font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s;
  }

  .up-modal-input:focus {
    border-color: rgba(79,142,247,0.5); box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
  }

  .up-modal-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px; border-radius: 13px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  }

  .up-modal-toggle-name { font-weight: 600; font-size: 13.5px; color: #e8eaf2; }
  .up-modal-toggle-desc { font-size: 12px; color: rgba(138,150,168,0.5); }

  .up-btn-save {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 12px; border-radius: 12px;
    background: linear-gradient(135deg, #4f8ef7, #7b6cf6);
    border: none; color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.25s ease;
    box-shadow: 0 4px 18px rgba(79,142,247,0.3);
  }

  .up-btn-save:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(79,142,247,0.45); }

  /* Swal dark */
  .up-swal-popup {
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 20px !important;
    font-family: 'DM Sans', sans-serif !important;
  }

  /* Spinner inline */
  .up-spin {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: up-spin 0.7s linear infinite; display: inline-block; flex-shrink: 0;
  }

  @keyframes up-spin { to { transform: rotate(360deg); } }
`;

const swalDark = {
  background: '#0f1525', color: '#e8eaf2',
  confirmButtonColor: '#4f8ef7',
  customClass: { popup: 'up-swal-popup' },
};

/* ─── UploadPage ──────────────────────────────────────────────────────── */
export default function UploadPage({ backendConfig, mappings, setMappings, setShowSettings }) {
  const [selectedFiles, setSelectedFiles]         = useState([]);
  const [batchConfig, setBatchConfig]             = useState({ dbName: '_default_db', useAudio: false, fps: 30 });
  const [uploadToBackend, setUploadToBackend]     = useState(true);
  const [autoGenSourceId, setAutoGenSourceId]     = useState(true);
  const [logs, setLogs]                           = useState([{ time: new Date().toLocaleTimeString(), msg: 'System initialized and ready.' }]);
  const [jsonPreview, setJsonPreview]             = useState(null);
  const [showConfigModal, setShowConfigModal]     = useState(false);
  const [isIndexing, setIsIndexing]               = useState(false);
  const [isDragOver, setIsDragOver]               = useState(false);

  const fileInputRef = useRef(null);
  const logEndRef    = useRef(null);
  const apiBase      = `http://${backendConfig.host}:${backendConfig.port}`;

  const log = (msg) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
  }, [logs]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(f => ({
      fileObject: f, name: f.name,
      webkitRelativePath: f.webkitRelativePath || '',
      manualPath: '', sourceId: '', fps: '', useAudio: false,
      previewUrl: f.type.startsWith('video/') ? URL.createObjectURL(f) : null,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    log(`Queued ${newFiles.length} new file${newFiles.length !== 1 ? 's' : ''} for indexing.`);
  };

  const removeFile = (idx) => {
    const f = selectedFiles[idx];
    if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    setSelectedFiles(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
  };

  const updateFileProp = (idx, prop, val) => {
    setSelectedFiles(prev => { const n = [...prev]; n[idx] = { ...n[idx], [prop]: val }; return n; });
  };

  const mapToDockerPath = (localPath) => {
    if (!localPath) return localPath;
    let match = null, matchLen = -1;
    mappings.forEach(m => {
      if (!m.local || !m.docker) return;
      const normLocal = m.local.replace(/\\/g, '/').replace(/\/+/g, '/');
      const normPath  = localPath.replace(/\\/g, '/').replace(/\/+/g, '/');
      if (normPath.toLowerCase().startsWith(normLocal.toLowerCase()) && normLocal.length > matchLen) {
        match = { m, normLocal }; matchLen = normLocal.length;
      }
    });
    if (match) {
      const normPath  = localPath.replace(/\\/g, '/').replace(/\/+/g, '/');
      const rel       = normPath.substring(match.normLocal.length).replace(/^\//, '');
      const dockerBase = match.m.docker.replace(/\/$/, '');
      return (dockerBase + '/' + rel).replace(/\/+/g, '/');
    }
    return localPath;
  };

  const buildPayload = (uploadMap = null) => {
    const data = selectedFiles.map(f => {
      let raw = uploadMap?.[f.name] || f.manualPath || f.webkitRelativePath || f.name;
      let dockerPath = /^(work_dir[/\\])/i.test(raw)
        ? raw.replace(/^work_dir[/\\]+?/i, '/work_dir/')
        : mapToDockerPath(raw);
      dockerPath = dockerPath.replace(/\\/g, '/').replace(/\/+/g, '/');
      const sourceId = f.sourceId || (autoGenSourceId ? f.name.split('.').slice(0, -1).join('.') : undefined);
      return { filepath: dockerPath, sourceId, fps: Number(f.fps) || batchConfig.fps, useAudio: typeof f.useAudio === 'boolean' ? f.useAudio : batchConfig.useAudio };
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
    log(`Uploading ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} to workspace…`);
    try {
      const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const j   = await res.json();
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
      selectedFiles.forEach(f => { mockMap[f.name] = `/work_dir/uploads/${f.name}`; });
    }
    setJsonPreview(buildPayload(mockMap));
  };

  const handleStartIndexing = async () => {
    if (selectedFiles.length === 0) {
      Swal.fire({ ...swalDark, title: 'Queue is Empty', text: 'Please select files to index.', icon: 'warning' });
      return;
    }
    setIsIndexing(true);
    let uploadMap = null;
    if (uploadToBackend) {
      uploadMap = await uploadFiles();
      if (uploadMap === null) {
        Swal.fire({ ...swalDark, title: 'Upload Failed', text: 'Check system logs for details.', icon: 'error' });
        setIsIndexing(false); return;
      }
    }
    const payload = buildPayload(uploadMap);
    setJsonPreview(payload);
    log('Dispatching indexing payload to engine…');
    try {
      const res  = await fetch(`${apiBase}/index-videos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      log(`Engine response: ${JSON.stringify(data)}`);
      Swal.fire({ ...swalDark, title: 'Process Started!', text: 'Your media is being indexed. Check the Dashboard for live progress.', icon: 'success', confirmButtonColor: '#34d399' });
      setSelectedFiles([]);
    } catch (e) {
      log(`Engine connection failed: ${e.message}`);
      Swal.fire({ ...swalDark, title: 'Connection Failed', text: 'Could not reach the backend indexing server.', icon: 'error' });
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="up-wrapper">

        {/* ── Header ── */}
        <div className="up-header">
          <div>
            <h1 className="up-title">Upload & Index</h1>
            <p className="up-subtitle">Configure and push new media to your vector database</p>
          </div>
          <button className="up-settings-btn" onClick={() => setShowSettings(true)} title="Settings">
            <i className="bi bi-sliders"></i>
          </button>
        </div>

        {/* ── Main Card ── */}
        <div className="up-main-card">

          {/* Dropzone */}
          <div
            className={`up-dropzone ${isDragOver ? 'dz-over' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileSelect({ target: { files: e.dataTransfer.files } }); }}
          >
            <i className="bi bi-cloud-arrow-up up-dz-icon"></i>
            <div className="up-dz-title">Drag & Drop Media Folders</div>
            <div className="up-dz-sub">Supports local directories and mapped NAS paths</div>
            <div className="up-btn-browse" onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>
              <i className="bi bi-folder-plus"></i> Select Directory
            </div>
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple directory="" webkitdirectory="" onChange={handleFileSelect} />
          </div>

          {/* Queue Header */}
          <div className="up-queue-header">
            <div className="up-queue-title">
              Processing Queue
              <span className="up-count-badge">{selectedFiles.length}</span>
            </div>
            <div className="up-toolbar">
              <button className="up-btn-tool" onClick={() => setShowConfigModal(true)}>
                <i className="bi bi-sliders2"></i> Batch Config
              </button>
              <button className="up-btn-tool" onClick={handlePreview}>
                <i className="bi bi-code-square"></i> Preview Payload
              </button>
              {selectedFiles.length > 0 && (
                <button className="up-btn-tool up-btn-tool-danger" onClick={() => setSelectedFiles([])}>
                  <i className="bi bi-trash3"></i> Clear All
                </button>
              )}
            </div>
          </div>

          {/* File grid */}
          <div className="up-file-scroll">
            {selectedFiles.length === 0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><i className="bi bi-inbox"></i></div>
                <div className="up-empty-title">Queue is Empty</div>
                <div className="up-empty-sub">Select a directory or drag files above</div>
              </div>
            ) : (
              <div className="up-file-grid">
                {selectedFiles.map((f, idx) => (
                  <div className="up-file-card" key={idx} style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="up-file-preview">
                      {f.previewUrl
                        ? <video src={f.previewUrl} controls />
                        : <div className="up-file-preview-icon">
                            <i className="bi bi-film"></i>
                            <span className="up-file-preview-label">No preview</span>
                          </div>
                      }
                    </div>
                    <div className="up-file-body">
                      <div className="up-file-name" title={f.name}>{f.name}</div>
                      <div className="up-file-path">
                        <i className="bi bi-folder" style={{ flexShrink: 0 }}></i>
                        {f.webkitRelativePath || 'root'}
                      </div>
                      <input className="up-field" placeholder="Manual path override" value={f.manualPath} onChange={e => updateFileProp(idx, 'manualPath', e.target.value)} />
                      <div className="up-field-row">
                        <input className="up-field" placeholder="Source ID" value={f.sourceId} onChange={e => updateFileProp(idx, 'sourceId', e.target.value)} />
                        <input className="up-field" type="number" placeholder="FPS" value={f.fps} onChange={e => updateFileProp(idx, 'fps', e.target.value)} style={{ maxWidth: 64 }} />
                      </div>
                      <div className="up-file-toggle-row">
                        <span className="up-file-toggle-label">Index Audio</span>
                        <label className="up-mini-switch">
                          <input type="checkbox" checked={f.useAudio} onChange={e => updateFileProp(idx, 'useAudio', e.target.checked)} />
                          <span className="up-mini-track"></span>
                        </label>
                      </div>
                    </div>
                    <div className="up-file-footer">
                      <button className="up-btn-remove" onClick={() => removeFile(idx)}>
                        <i className="bi bi-trash3"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config panels */}
          <div className="up-config-row">
            <div className="up-config-panel">
              <div className="up-config-title"><i className="bi bi-toggles"></i> Pipeline Settings</div>
              <div className="up-toggle-row">
                <div className="up-toggle-info">
                  <div className="up-toggle-name">Auto-generate Source ID</div>
                  <div className="up-toggle-desc">Derive ID from filename if empty</div>
                </div>
                <label className="up-switch">
                  <input type="checkbox" checked={autoGenSourceId} onChange={e => setAutoGenSourceId(e.target.checked)} />
                  <span className="up-switch-track"></span>
                </label>
              </div>
              <div className="up-toggle-row">
                <div className="up-toggle-info">
                  <div className="up-toggle-name">Upload to Work Dir</div>
                  <div className="up-toggle-desc">Transfer files to backend before indexing</div>
                </div>
                <label className="up-switch">
                  <input type="checkbox" checked={uploadToBackend} onChange={e => setUploadToBackend(e.target.checked)} />
                  <span className="up-switch-track"></span>
                </label>
              </div>
            </div>

            <div className="up-config-panel">
              <div className="up-config-title" style={{ justifyContent: 'space-between' }}>
                <span><i className="bi bi-arrow-left-right" style={{ marginRight: 7 }}></i>Path Mappings</span>
                <button className="up-manage-link" onClick={() => setShowSettings(true)}>Manage →</button>
              </div>
              <div className="up-mappings-list">
                {mappings.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'rgba(138,150,168,0.3)', textAlign: 'center', padding: '16px 0' }}>
                    No active path mappings
                  </div>
                ) : mappings.map((m, i) => (
                  <div className="up-mapping-item" key={i}>
                    <span className="up-mapping-local">{m.local}</span>
                    <i className="bi bi-arrow-right up-mapping-arrow"></i>
                    <span className="up-mapping-docker">{m.docker}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Execute */}
          <button className="up-btn-execute" onClick={handleStartIndexing} disabled={isIndexing}>
            {isIndexing
              ? <><span className="up-spin"></span> Initializing Pipeline…</>
              : <><i className="bi bi-rocket-takeoff-fill"></i> Execute Indexing Job</>
            }
          </button>
        </div>

        {/* ── Developer Console ── */}
        <div className="up-console-row">
          <div>
            <div className="up-console-header">
              <div className="up-console-label"><i className="bi bi-terminal"></i> System Event Logs</div>
              <button className="up-console-clear" onClick={() => setLogs([])}>Clear</button>
            </div>
            <div className="up-terminal" ref={logEndRef}>
              {logs.map((l, i) => (
                <div className="up-log-line" key={i}>
                  <span className="up-log-time">[{l.time}]</span>
                  <span className="up-log-msg">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="up-console-header">
              <div className="up-console-label"><i className="bi bi-braces"></i> Compiled JSON Payload</div>
            </div>
            <div className="up-terminal">
              {jsonPreview
                ? <span className="up-json-content">{JSON.stringify(jsonPreview, null, 2)}</span>
                : <span className="up-json-placeholder">// Click "Preview Payload" to compile</span>
              }
            </div>
          </div>
        </div>

      </div>

      {/* ── Batch Config Modal ── */}
      {showConfigModal && (
        <div className="up-modal-overlay" onClick={e => e.target === e.currentTarget && setShowConfigModal(false)}>
          <div className="up-modal-box">
            <div className="up-modal-hdr">
              <span className="up-modal-title">Batch Defaults</span>
              <button className="up-modal-close" onClick={() => setShowConfigModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="up-modal-body">
              <div>
                <label className="up-modal-label">Target Database</label>
                <input className="up-modal-input" value={batchConfig.dbName} onChange={e => setBatchConfig({ ...batchConfig, dbName: e.target.value })} placeholder="_default_db" />
              </div>
              <div>
                <label className="up-modal-label">Default FPS</label>
                <input className="up-modal-input" type="number" value={batchConfig.fps} onChange={e => setBatchConfig({ ...batchConfig, fps: Number(e.target.value) })} placeholder="30" />
              </div>
              <div className="up-modal-toggle-row">
                <div>
                  <div className="up-modal-toggle-name">Process Audio Tracks</div>
                  <div className="up-modal-toggle-desc">Include audio in default indexing</div>
                </div>
                <label className="up-switch">
                  <input type="checkbox" checked={batchConfig.useAudio} onChange={e => setBatchConfig({ ...batchConfig, useAudio: e.target.checked })} />
                  <span className="up-switch-track"></span>
                </label>
              </div>
            </div>
            <div className="up-modal-footer">
              <button className="up-btn-save" onClick={() => setShowConfigModal(false)}>
                <i className="bi bi-check2"></i> Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
