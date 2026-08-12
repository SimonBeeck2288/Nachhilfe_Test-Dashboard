import React, { useState } from 'react';
import PracticeConfigView from './PracticeConfigView';
import PracticeSessionView from './PracticeSessionView';
import PrintableWorksheet from './PrintableWorksheet';
import type { PracticeGeneratorConfig, PracticeSheet } from '../types/practice';
import { generatePracticeSheet } from '../utils/practiceGenerator';
import { Wand2, Sparkles, ArrowLeft } from 'lucide-react';

export type PracticeViewMode = 'config' | 'interactive' | 'session' | 'print-student' | 'print_worksheet' | 'print-teacher' | 'print_solution';

export const PracticeView: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<PracticeGeneratorConfig | null>(null);
  const [currentSheet, setCurrentSheet] = useState<PracticeSheet | null>(null);
  const [activeMode, setActiveMode] = useState<PracticeViewMode>('config');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleConfigChange = (config: PracticeGeneratorConfig) => {
    setCurrentConfig(config);
  };

  const handleStartPractice = (config: PracticeGeneratorConfig) => {
    const generated = generatePracticeSheet(config);
    setCurrentConfig(config);
    setCurrentSheet(generated);
    setActiveMode('interactive');
    const selectedTopicsCount = config.topics.filter((t) => t.selected).length;
    setStatusMessage(`Übung gestartet mit ${config.questionCount} Aufgaben aus ${selectedTopicsCount} Themen.`);
  };

  const handlePrintWorksheet = (config: PracticeGeneratorConfig) => {
    const generated = generatePracticeSheet(config);
    setCurrentConfig(config);
    setCurrentSheet(generated);
    setActiveMode('print-student');
    setStatusMessage('Arbeitsblatt wird für den Druck vorbereitet...');
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.print) {
        window.print();
      }
    }, 100);
  };

  const handlePrintSolution = (config: PracticeGeneratorConfig) => {
    const generated = generatePracticeSheet(config);
    setCurrentConfig(config);
    setCurrentSheet(generated);
    setActiveMode('print-teacher');
    setStatusMessage('Lösungsblatt wird für den Druck vorbereitet...');
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.print) {
        window.print();
      }
    }, 100);
  };

  const handleBackToConfig = () => {
    setActiveMode('config');
    setStatusMessage(null);
  };

  const isPrintMode = activeMode === 'print-student' || activeMode === 'print_worksheet' || activeMode === 'print-teacher' || activeMode === 'print_solution';
  const isInteractiveMode = activeMode === 'interactive' || activeMode === 'session';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Title & Overview Header (Screen only) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)' }}>
            <Wand2 size={28} />
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Übungs-Generator</h1>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Generiere individuelle Übungsblätter &amp; interaktive Lerneinheiten basierend auf Schülerniveau und Schwachstellen.
          </p>
        </div>

        {activeMode !== 'config' && (
          <button
            type="button"
            onClick={handleBackToConfig}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <ArrowLeft size={16} />
            Zurück zur Konfiguration
          </button>
        )}
      </div>

      {/* Status Notice if in active state */}
      {statusMessage && activeMode === 'config' && (
        <div
          className="no-print"
          style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#3730A3',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={18} color="var(--primary)" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Configuration View Container */}
      {activeMode === 'config' && (
        <PracticeConfigView
          initialConfig={currentConfig || undefined}
          onChangeConfig={handleConfigChange}
          onStartPractice={handleStartPractice}
          onPrintWorksheet={handlePrintWorksheet}
          onPrintSolution={handlePrintSolution}
        />
      )}

      {/* Interactive Session Mode View */}
      {isInteractiveMode && (
        <PracticeSessionView
          sheet={currentSheet || undefined}
          config={currentConfig || undefined}
          onBackToConfig={handleBackToConfig}
        />
      )}

      {/* Printable Worksheet View (Student & Teacher modes) */}
      {isPrintMode && (
        <PrintableWorksheet
          sheet={currentSheet || undefined}
          config={currentConfig || undefined}
          initialMode={activeMode === 'print-teacher' || activeMode === 'print_solution' ? 'teacher' : 'student'}
          onBackToConfig={handleBackToConfig}
        />
      )}
    </div>
  );
};

export default PracticeView;
