import React, { useState } from 'react';
import type { SyncPayload } from '../types/sync';
import { Check, X, FileText, Users, Clock } from 'lucide-react';

export interface MergePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'merge' | 'replace') => void;
  payload?: SyncPayload | null;
  stats?: {
    studentsAdded?: number;
    studentsUpdated?: number;
    studentsUnchanged?: number;
    sessionsAdded?: number;
    sessionsExisting?: number;
    conflictsResolved?: number;
  };
  source?: 'file' | 'gist';
  reducedSensory?: boolean;
}

export const MergePreviewDialog: React.FC<MergePreviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payload,
  stats,
  source = 'file',
  reducedSensory = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen) return null;

  const rosterCount = payload?.data?.roster?.length ?? payload?.data?.students?.length ?? 0;
  const historyCount = payload?.data?.history?.length ?? payload?.data?.sessions?.length ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-preview-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: reducedSensory ? 'none' : 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          color: 'var(--text-main, #1e293b)',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.5rem',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="merge-preview-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="#4F46E5" />
            Daten-Import Vorschau
          </h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', marginBottom: '1.25rem' }}>
          {source === 'gist'
            ? 'Aus GitHub Gist geladene Daten:'
            : 'Aus der Sicherungsdatei geladene Daten:'}
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(79, 70, 229, 0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(79, 70, 229, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>
              <Users size={16} /> Schülerprofile
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {rosterCount}
            </div>
            {stats?.studentsAdded !== undefined && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                +{stats.studentsAdded} neu, {stats.studentsUpdated || 0} aktualisiert
              </div>
            )}
          </div>

          <div
            style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(16, 185, 129, 0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#10B981', fontWeight: 600 }}>
              <Clock size={16} /> Testergebnisse
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {historyCount}
            </div>
            {stats?.sessionsAdded !== undefined && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                +{stats.sessionsAdded} neu
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Import-Strategie wählen:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedMode === 'merge' ? '2px solid #4F46E5' : '1px solid var(--border, #e2e8f0)',
                backgroundColor: selectedMode === 'merge' ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="mergeMode"
                value="merge"
                checked={selectedMode === 'merge'}
                onChange={() => setSelectedMode('merge')}
                style={{ marginTop: '0.2rem' }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                  Zusammenführen (Empfohlen)
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                  Neue Schüler und Tests werden hinzugefügt. Bestehende Schüler werden bei neuerem Datum aktualisiert.
                </span>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: selectedMode === 'replace' ? '2px solid #ef4444' : '1px solid var(--border, #e2e8f0)',
                backgroundColor: selectedMode === 'replace' ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="mergeMode"
                value="replace"
                checked={selectedMode === 'replace'}
                onChange={() => setSelectedMode('replace')}
                style={{ marginTop: '0.2rem' }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                  Ersetzen (Überschreiben)
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                  Achtung: Löscht alle aktuellen lokalen Daten und ersetzt sie vollständig durch den Import.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-muted, #64748b)',
              border: '1px solid var(--border, #cbd5e1)',
              borderRadius: '8px',
              padding: '0.6rem 1.2rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(selectedMode)}
            style={{
              backgroundColor: selectedMode === 'replace' ? '#ef4444' : '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Check size={16} />
            {selectedMode === 'replace' ? 'Daten ersetzen & importieren' : 'Importieren'}
          </button>
        </div>
      </div>
    </div>
  );
};
