import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  FileJson,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import * as syncExportImport from '../utils/syncExportImport';
import * as gistSync from '../utils/gistSync';
import { getStudentRoster } from '../utils/studentRoster';
import { getSessionHistory } from '../utils/sessionHistory';
import { MergePreviewDialog } from './MergePreviewDialog';
import type { SyncPayload, ImportMode } from '../types/sync';

export interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (stats?: any) => void;
  onDataChanged?: () => void;
  reducedSensory?: boolean;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  onDataChanged,
  reducedSensory = false,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'gist'>('file');

  // Stats
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  // GitHub Config
  const [pat, setPat] = useState('');
  const [gistId, setGistId] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Merge Preview Dialog State
  const [previewPayload, setPreviewPayload] = useState<SyncPayload | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<'file' | 'gist'>('file');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const refreshLocalCounts = useCallback(() => {
    setStudentCount(getStudentRoster().length);
    setSessionCount(getSessionHistory().length);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshLocalCounts();
      const config = gistSync.getGistConfig();
      if (config) {
        setPat(config.pat || '');
        setGistId(config.gistId || '');
        setLastSyncedAt(config.lastSyncedAt || null);
        setGistUrl(config.gistUrl || null);
        setConnectedUser(config.username || null);
      }
      setFeedback(null);
    }
  }, [isOpen, refreshLocalCounts]);

  // Keyboard navigation & Focus Trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const success = syncExportImport.downloadBackupFile();
      if (success) {
        setFeedback({
          type: 'success',
          message: 'Sicherungsdatei erfolgreich heruntergeladen!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Fehler beim Herunterladen der Sicherungsdatei.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Fehler beim Exportieren.',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await syncExportImport.readBackupFile(file);
      const val = syncExportImport.parseAndValidateBackupFile(content);

      if (!val.isValid || !val.payload) {
        setFeedback({
          type: 'error',
          message: val.errors[0] || 'Ungültige Sicherungsdatei.',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPreviewPayload(val.payload);
      setPreviewSource('file');
      setIsPreviewOpen(true);
      setFeedback(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'error',
        message: `Fehler beim Lesen der Datei: ${msg}`,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmMerge = (mode: ImportMode) => {
    if (!previewPayload) return;

    const result = syncExportImport.applySyncPayloadToStorage(previewPayload, mode);
    setIsPreviewOpen(false);
    setPreviewPayload(null);
    refreshLocalCounts();

    if (onSyncComplete) onSyncComplete(result.stats);
    if (onDataChanged) onDataChanged();

    setFeedback({
      type: 'success',
      message: `Erfolgreich importiert: ${result.stats.studentsAdded} Schüler neu, ${result.stats.studentsUpdated} aktualisiert, ${result.stats.sessionsAdded} Sitzungen hinzugefügt.`,
    });
  };

  // GitHub Actions
  const handleTestConnection = async () => {
    if (!pat.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib einen GitHub Token ein.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    const res = await gistSync.testGistConnection(pat, gistId);
    setLoading(false);

    if (res.success) {
      if (res.username) setConnectedUser(res.username);
      setFeedback({
        type: 'success',
        message: res.username ? `Verbunden als @${res.username}!` : res.message,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handlePushGist = async () => {
    if (!pat.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib einen GitHub Token ein.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    const res = await gistSync.pushToGist({ pat, gistId });
    setLoading(false);

    if (res.success) {
      if (res.gistId) setGistId(res.gistId);
      if (res.gistUrl) setGistUrl(res.gistUrl);
      setLastSyncedAt(new Date().toISOString());
      setFeedback({ type: 'success', message: res.message });
      if (onSyncComplete) onSyncComplete();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handlePullGist = async () => {
    if (!pat.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib einen GitHub Token ein.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    const res = await gistSync.pullFromGist({ pat, gistId }, 'merge');
    setLoading(false);

    if (res.success) {
      refreshLocalCounts();
      setLastSyncedAt(new Date().toISOString());
      setFeedback({ type: 'success', message: res.message || 'Daten erfolgreich von Gist abgerufen.' });
      if (onSyncComplete) onSyncComplete(res.stats);
      if (onDataChanged) onDataChanged();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSaveConfig = () => {
    if (!pat.trim()) {
      setFeedback({ type: 'error', message: 'Bitte Token eingeben.' });
      return;
    }
    gistSync.saveGistConfig({
      pat: pat.trim(),
      gistId: gistId.trim(),
      username: connectedUser || undefined,
      lastSyncedAt: lastSyncedAt || undefined,
      gistUrl: gistUrl || undefined,
    });
    setFeedback({ type: 'success', message: 'Gist-Konfiguration lokal gespeichert.' });
  };

  const handleClearConfig = () => {
    gistSync.clearGistConfig();
    setPat('');
    setGistId('');
    setConnectedUser(null);
    setLastSyncedAt(null);
    setGistUrl(null);
    setFeedback({ type: 'info', message: 'Gist-Konfiguration entfernt.' });
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-modal-title"
        data-testid="sync-modal-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: reducedSensory ? 'none' : 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={dialogRef}
          style={{
            background: 'var(--surface, #ffffff)',
            color: 'var(--text-main, #1e293b)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, rgba(79, 70, 229, 0.05), transparent)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cloud size={22} />
              </div>
              <div>
                <h2 id="sync-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                  Synchronisation & Backup
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                  Profile und Testergebnisse sichern und geräteübergreifend synchronisieren
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
                padding: '0.5rem',
                borderRadius: '8px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Status info */}
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(241, 245, 249, 0.6)',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <strong>Lokal:</strong> {studentCount} Schüler • {sessionCount} Testergebnisse
            </div>
            {lastSyncedAt && (
              <div style={{ color: 'var(--text-muted, #64748b)' }}>
                Letzter Sync: {new Date(lastSyncedAt).toLocaleString('de-DE')}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div
            role="tablist"
            aria-label="Synchronisations-Optionen"
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              padding: '0 1.5rem',
              gap: '1rem',
            }}
          >
            <button
              role="tab"
              aria-selected={activeTab === 'file'}
              onClick={() => {
                setActiveTab('file');
                setFeedback(null);
              }}
              style={{
                padding: '0.85rem 0.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'file' ? '2px solid #4F46E5' : '2px solid transparent',
                color: activeTab === 'file' ? '#4F46E5' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'file' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              <FileJson size={18} />
              JSON-Datei Backup
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'gist'}
              onClick={() => {
                setActiveTab('gist');
                setFeedback(null);
              }}
              style={{
                padding: '0.85rem 0.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'gist' ? '2px solid #4F46E5' : '2px solid transparent',
                color: activeTab === 'gist' ? '#4F46E5' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'gist' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              <Cloud size={18} />
              GitHub Gist Cloud Sync
            </button>
          </div>

          {/* Modal Content Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {feedback && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  backgroundColor:
                    feedback.type === 'success'
                      ? '#ecfdf5'
                      : feedback.type === 'error'
                      ? '#fef2f2'
                      : '#eff6ff',
                  color:
                    feedback.type === 'success'
                      ? '#065f46'
                      : feedback.type === 'error'
                      ? '#991b1b'
                      : '#1e40af',
                  border: `1px solid ${
                    feedback.type === 'success'
                      ? '#a7f3d0'
                      : feedback.type === 'error'
                      ? '#fecaca'
                      : '#bfdbfe'
                  }`,
                }}
              >
                {feedback.type === 'success' && <CheckCircle2 size={18} />}
                {feedback.type === 'error' && <AlertCircle size={18} />}
                {feedback.type === 'info' && <RefreshCw size={18} />}
                <span>{feedback.message}</span>
              </div>
            )}

            {activeTab === 'file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Export Section */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} color="#4F46E5" />
                    Backup exportieren
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '1rem' }}>
                    Erstellt eine vollständige Sicherungsdatei (.json) mit allen Schülerprofilen und Sitzungsverläufen.
                  </p>
                  <button
                    onClick={handleExport}
                    style={{
                      backgroundColor: '#4F46E5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.25rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Download size={16} />
                    Backup-Datei herunterladen
                  </button>
                </div>

                {/* Import Section */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={18} color="#10B981" />
                    Sicherungsdatei laden
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '1rem' }}>
                    Stellt Profile und Testergebnisse aus einer zuvor exportierten Datei wieder her.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.25rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Upload size={16} />
                    Datei auswählen
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Gist Config Box */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={18} color="#4F46E5" />
                    GitHub Authentifizierung
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '1rem' }}>
                    Benötigt einen GitHub Zugriffsschlüssel mit dem Scope <code>gist</code> für den geräteübergreifenden Abgleich.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Personal Access Key / PAT:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type={showPat ? 'text' : 'password'}
                          value={pat}
                          onChange={(e) => setPat(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border, #cbd5e1)',
                            fontSize: '0.9rem',
                          }}
                        />
                        <button
                          type="button"
                          data-testid="pat-toggle"
                          aria-label={showPat ? 'Passwort verbergen' : 'Passwort anzeigen'}
                          onClick={() => setShowPat(!showPat)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border, #cbd5e1)',
                            borderRadius: '8px',
                            padding: '0.6rem',
                            cursor: 'pointer',
                            color: 'var(--text-muted, #64748b)',
                          }}
                        >
                          {showPat ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Gist ID (Optional):
                      </label>
                      <input
                        type="text"
                        value={gistId}
                        onChange={(e) => setGistId(e.target.value)}
                        placeholder="z.B. 1a2b3c4d5e..."
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #cbd5e1)',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={handleTestConnection}
                      disabled={loading}
                      style={{
                        backgroundColor: '#4F46E5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Verbindung testen
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#4F46E5',
                        border: '1px solid #4F46E5',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      Speichern
                    </button>
                    {pat && (
                      <button
                        onClick={handleClearConfig}
                        aria-label="Verbindung trennen"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          padding: '0.55rem 1rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Trash2 size={14} />
                        Verbindung trennen
                      </button>
                    )}
                    {gistUrl && (
                      <a
                        href={gistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.85rem',
                          color: '#4F46E5',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          textDecoration: 'none',
                          marginLeft: 'auto',
                        }}
                      >
                        Gist ansehen <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Cloud Push / Pull */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    Cloud Aktionen
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handlePushGist}
                      disabled={loading || !pat}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.65rem 1.25rem',
                        fontWeight: '600',
                        cursor: loading || !pat ? 'not-allowed' : 'pointer',
                        opacity: loading || !pat ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CloudUpload size={16} />
                      Auf Gist hochladen (Push)
                    </button>

                    <button
                      onClick={handlePullGist}
                      disabled={loading || !pat}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.65rem 1.25rem',
                        fontWeight: '600',
                        cursor: loading || !pat ? 'not-allowed' : 'pointer',
                        opacity: loading || !pat ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CloudDownload size={16} />
                      Von Gist laden (Pull)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'var(--bg-color, #f1f5f9)',
                color: 'var(--text-main, #334155)',
                border: '1px solid var(--border, #cbd5e1)',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>

      <MergePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewPayload(null);
        }}
        onConfirm={handleConfirmMerge}
        payload={previewPayload}
        source={previewSource}
        reducedSensory={reducedSensory}
      />
    </>
  );
};
