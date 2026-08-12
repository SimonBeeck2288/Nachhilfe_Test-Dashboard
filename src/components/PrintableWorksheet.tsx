import React, { useState } from 'react';
import type { PracticeSheet, PracticeGeneratorConfig } from '../types/practice';
import { generatePracticeSheet } from '../utils/practiceGenerator';
import { Printer, ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';

export interface PrintableWorksheetProps {
  sheet?: PracticeSheet;
  config?: PracticeGeneratorConfig;
  initialMode?: 'student' | 'teacher';
  onBackToConfig?: () => void;
}

export const PrintableWorksheet: React.FC<PrintableWorksheetProps> = ({
  sheet: initialSheet,
  config,
  initialMode = 'student',
  onBackToConfig,
}) => {
  const [activeMode, setActiveMode] = useState<'student' | 'teacher'>(initialMode);

  // Generate active sheet if not directly provided
  const activeSheet = React.useMemo(() => {
    if (initialSheet && initialSheet.exercises.length > 0) {
      return initialSheet;
    }
    if (config) {
      return generatePracticeSheet(config);
    }
    return generatePracticeSheet({
      studentId: 'guest',
      subjectFilter: 'both',
      topics: [
        { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
        { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
      ],
      questionCount: 10,
      isTimerDisabled: false,
    });
  }, [initialSheet, config]);

  const exercises = activeSheet.exercises;

  const formattedDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrintTrigger = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm;
          }
          body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, .no-print, button {
            display: none !important;
          }
          .printable-worksheet-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .printable-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .exercise-item-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding-bottom: 1.25rem !important;
            margin-bottom: 1.25rem !important;
          }
        }
      `}</style>

      {/* Screen Control Action Bar (Hidden when printing) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#334155', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setActiveMode('student')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: activeMode === 'student' ? 'var(--primary)' : 'transparent',
                color: '#FFFFFF',
                fontWeight: activeMode === 'student' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Schüler-Arbeitsblatt
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('teacher')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: activeMode === 'teacher' ? '#10B981' : 'transparent',
                color: '#FFFFFF',
                fontWeight: activeMode === 'teacher' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Lösungsblatt (Lehrkraft/Eltern)
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handlePrintTrigger}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}
          >
            <Printer size={18} />
            Drucken / Als PDF speichern
          </button>

          {onBackToConfig && (
            <button
              type="button"
              onClick={onBackToConfig}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.88rem' }}
            >
              <ArrowLeft size={16} />
              Zurück
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet Main Box */}
      <div
        className="printable-worksheet-wrapper printable-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-sm)',
          boxSizing: 'border-box',
          color: '#1E293B',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Document Header */}
        <div
          style={{
            borderBottom: activeMode === 'teacher' ? '3px solid #10B981' : '3px solid #4F46E5',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <BookOpen size={24} color={activeMode === 'teacher' ? '#10B981' : '#4F46E5'} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: activeMode === 'teacher' ? '#047857' : '#4F46E5' }}>
                {activeMode === 'teacher' ? 'LÖSUNGSBLATT & MUSTERLÖSUNG' : 'ÜBUNGSBLATT'}
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
              NachhilfeTest Übungs-Generator • {exercises.length} Aufgaben
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.88rem', color: '#475569' }}>
            <div><strong>Datum:</strong> {formattedDate}</div>
            <div><strong>Format:</strong> A4 Druckausgabe</div>
          </div>
        </div>

        {/* Student Metadata Fields Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '1rem',
            backgroundColor: '#F8FAFC',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #E2E8F0',
            marginBottom: '1.75rem',
            fontSize: '0.9rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Name des Schülers / der Schülerin
            </span>
            <strong style={{ fontSize: '0.98rem', color: '#0F172A' }}>
              {activeSheet.config.studentName || '________________________'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Klassenstufe
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              {activeSheet.config.gradeLevel ? `Klasse ${activeSheet.config.gradeLevel}` : '__________'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Erreichte Punkte
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              _____ / {exercises.length}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Bearbeitungszeit
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              ___ Min.
            </strong>
          </div>
        </div>

        {/* Exercises List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {exercises.map((ex, idx) => (
            <div
              key={ex.id || idx}
              className="exercise-item-block"
              style={{
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              {/* Exercise Index & Topic Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: activeMode === 'teacher' ? '#ECFDF5' : '#EEF2FF',
                      color: activeMode === 'teacher' ? '#047857' : '#4F46E5',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: activeMode === 'teacher' ? '1px solid #A7F3D0' : '1px solid #C7D2FE',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                    {ex.topicName} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748B' }}>(Stufe {ex.level})</span>
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: ex.subject === 'math' ? '#2563EB' : '#7C3AED',
                    backgroundColor: ex.subject === 'math' ? '#DBEAFE' : '#EDE9FE',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  {ex.subject === 'math' ? 'Mathematik' : 'Englisch'}
                </span>
              </div>

              {/* Story context if present */}
              {ex.storyContext && (
                <div style={{ fontSize: '0.88rem', color: '#475569', fontStyle: 'italic', paddingLeft: '0.5rem', borderLeft: '3px solid #CBD5E1' }}>
                  {ex.storyContext}
                </div>
              )}

              {/* Question Text */}
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                {ex.questionText}
              </div>

              {/* Student View Options & Answer Line */}
              {activeMode === 'student' && (
                <div style={{ marginTop: '0.35rem' }}>
                  {ex.options && ex.options.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                      {ex.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          style={{
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                          }}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '1.5px solid #64748B',
                              borderRadius: '3px',
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontWeight: 600, color: '#475569' }}>
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        border: '1px dashed #94A3B8',
                        borderRadius: '6px',
                        backgroundColor: '#FAFAFA',
                        fontSize: '0.9rem',
                        color: '#64748B',
                      }}
                    >
                      <strong>Lösung:</strong> __________________________________________________
                    </div>
                  )}
                </div>
              )}

              {/* Teacher / Answer Key Mode (Lösungsblatt) */}
              {activeMode === 'teacher' && (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginTop: '0.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#16A34A" />
                    <span>Richtige Antwort:</span>
                    <span style={{ backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #86EFAC', color: '#14532D' }}>
                      {ex.correctAnswer}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#14532D', lineHeight: 1.4 }}>
                    💡 <strong>Musterlösung / Erklärung:</strong> {ex.explanation}
                  </div>

                  {ex.mascotTip && (
                    <div style={{ fontSize: '0.84rem', color: '#713F12', backgroundColor: '#FEFCE8', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #FEF08A', marginTop: '0.2rem' }}>
                      🦉 <strong>Eulen-Tipp:</strong> {ex.mascotTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Worksheet Footer */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <div>NachhilfeTest Übungs-Generator • Seite 1 von 1</div>
          <div>Viel Erfolg beim Lernen &amp; Üben!</div>
        </div>
      </div>
    </div>
  );
};

export default PrintableWorksheet;
