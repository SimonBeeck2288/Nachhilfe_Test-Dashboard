import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import { getStudentRoster } from '../utils/studentRoster';
import type { StudentProfile } from '../types/student';
import type { CustomTestConfig } from '../types/config';
import { defaultConfig } from '../types/config';
import { Sliders, Play, RotateCcw, User, ArrowLeft, Check } from 'lucide-react';
import { AccessibilityModeSwitcher } from './AccessibilityModeSwitcher';

const MATH_TOPICS = [
  'Addition',
  'Subtraktion',
  'Zahlenverständnis',
  'Multiplikation',
  'Division',
  'Geometrie',
  'Bruchrechnung',
  'Dezimalrechnung',
  'Prozentrechnung',
  'Gleichungen',
  'Statistik',
  'Negative Zahlen',
  'Potenzen',
  'Wurzelrechnung',
  'Terme',
  'Binomische Formeln',
];

const ENGLISH_TOPICS = [
  'Vokabeln',
  'Grammatik',
  'Zahlen',
  'Zeiten',
  'Präpositionen',
  'Steigerung',
  'Modalverben',
  'Leseverständnis',
  'Relativsätze',
  'Passiv',
  'Conditionals',
  'Indirekte Rede',
  'Phrasal Verbs',
  'Inversion',
  'Gerund vs Infinitive',
  'Modals in Past',
];

export const TestConfigurator: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => {
  const navigate = useNavigate();
  const {
    state,
    setCustomTestConfig,
    selectStudent,
    startSession,
    clearSession,
    setMathLevel,
    setEnglishLevel,
  } = useTestSession();

  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(state.currentStudent?.id || null);
  const [guestName, setGuestName] = useState<string>(state.studentName || '');

  // Config State
  const [subject, setSubject] = useState<CustomTestConfig['subject']>(state.customTestConfig?.subject || 'all');
  const [startingLevel, setStartingLevel] = useState<number>(state.customTestConfig?.startingLevel || 1);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<number>(
    state.customTestConfig?.maxDurationMinutes ?? 5
  );
  const [topicModes, setTopicModes] = useState<Record<string, 'off' | 'optional' | 'forced'>>(
    state.customTestConfig?.topicModes || {}
  );
  const [questionTypes, setQuestionTypes] = useState<('multiple-choice' | 'input')[]>(
    state.customTestConfig?.questionTypes || ['multiple-choice', 'input']
  );

  useEffect(() => {
    const list = getStudentRoster();
    setRoster(list);
    if (list.length > 0) {
      setSelectedStudentId((prev) => prev || list[0].id);
    }
  }, []);

  const handleTopicCycle = (topic: string) => {
    setTopicModes((prev) => {
      const current = prev[topic] || 'optional';
      let next: 'off' | 'optional' | 'forced';
      if (current === 'optional') next = 'forced';
      else if (current === 'forced') next = 'off';
      else next = 'optional';

      return {
        ...prev,
        [topic]: next,
      };
    });
  };

  const handleBulkSetMode = (mode: 'optional' | 'forced' | 'off') => {
    const newModes: Record<string, 'off' | 'optional' | 'forced'> = {};
    const allTopics = [...MATH_TOPICS, ...ENGLISH_TOPICS];
    allTopics.forEach((t) => {
      newModes[t] = mode;
    });
    setTopicModes(newModes);
  };

  const handleTypeToggle = (type: 'multiple-choice' | 'input') => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least 1 type
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleResetToDefault = () => {
    setSubject(defaultConfig.subject);
    setStartingLevel(defaultConfig.startingLevel);
    setMaxDurationMinutes(defaultConfig.maxDurationMinutes);
    setTopicModes({});
    setQuestionTypes(defaultConfig.questionTypes);
  };

  const handleStartCustomTest = () => {
    // Derive topics array (all non-off topics) for backward compatibility
    const activeTopics = Object.entries(topicModes)
      .filter(([_, mode]) => mode !== 'off')
      .map(([t]) => t);

    const newConfig: CustomTestConfig = {
      subject,
      startingLevel,
      maxDurationMinutes,
      topics: activeTopics,
      topicModes,
      questionTypes,
    };

    setCustomTestConfig(newConfig);
    setMathLevel(startingLevel);
    setEnglishLevel(startingLevel);


    clearSession();

    // Student selection
    let activeStudent: StudentProfile | null = null;
    if (selectedStudentId) {
      activeStudent = roster.find((s) => s.id === selectedStudentId) || null;
    }

    if (activeStudent) {
      selectStudent(activeStudent);
      startSession(activeStudent);
    } else if (guestName.trim()) {
      selectStudent(null);
      startSession(guestName.trim());
    } else {
      selectStudent(null);
      startSession('Gast-Schüler');
    }

    // Navigation based on subject configuration
    if (subject === 'math') {
      navigate('/math');
    } else if (subject === 'english') {
      navigate('/english');
    } else if (subject === 'cognition') {
      navigate('/cognition');
    } else {
      navigate('/warmup');
    }
  };

  return (
    <div className="card fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={26} color="var(--primary)" />
            Individueller Test-Konfigurator
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Konfiguriere gezielte Diagnosetests mit benutzerdefinierten Fächern, Stufen, Themen und Zeitlimits.
          </p>
        </div>
        {onCancel && (
          <button className="btn btn-secondary" onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={18} /> Zurück
          </button>
        )}
      </div>

      {/* SECTION 1: Student Profile Selector */}
      <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-color)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--primary)" />
          Schülerprofil für diesen Test
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Aus Roster wählen
            </label>
            <select
              className="input"
              value={selectedStudentId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStudentId(val ? val : null);
              }}
            >
              <option value="">-- Keines (Gast) --</option>
              {roster.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Klasse {s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {!selectedStudentId && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Oder Gastname eingeben
              </label>
              <input
                type="text"
                className="input"
                placeholder="Schüler-Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Accessibility Mode Switcher */}
        <div style={{ marginTop: '1rem' }}>
          <AccessibilityModeSwitcher showDetails onSaveToProfile />
        </div>
      </div>

      {/* SECTION 2: Subject Selection */}
      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
          1. Test-Umfang / Fach-Auswahl
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { id: 'all', label: 'Vollständiger Test (Alle Module)', desc: 'Warm-up + Kognition + Mathe + Englisch' },
            { id: 'math', label: 'Nur Mathematik', desc: 'Gezielte Diagnose in Mathe' },
            { id: 'english', label: 'Nur Englisch', desc: 'Gezielte Diagnose in Englisch' },
            { id: 'cognition', label: 'Nur Kognition (Stroop)', desc: 'Reaktionszeit & Konzentration' },
          ].map((item) => {
            const isSelected = subject === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSubject(item.id as CustomTestConfig['subject'])}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? '#EFF6FF' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--primary)' : 'var(--text-color)', marginBottom: '0.25rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Starting Level Slider & Duration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
            2. Start-Schwierigkeitsstufe: Level {startingLevel}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={startingLevel}
              onChange={(e) => setStartingLevel(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', minWidth: '40px', textAlign: 'center' }}>
              Lvl {startingLevel}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            <span>Level 1 (Grundschule)</span>
            <span>Level 4 (Mittelstufe)</span>
            <span>Level 7 (Oberstufe)</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
            3. Max. Modul-Dauer (Minuten)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { val: 3, label: '3 Min' },
              { val: 5, label: '5 Min (Standard)' },
              { val: 10, label: '10 Min' },
              { val: 15, label: '15 Min' },
              { val: 0, label: 'Ohne Limit' },
            ].map((opt) => {
              const isSel = maxDurationMinutes === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMaxDurationMinutes(opt.val)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSel ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: isSel ? 'var(--primary)' : 'white',
                    color: isSel ? 'white' : 'var(--text-color)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: Question Type Filter */}
      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
          4. Erlaubte Fragentypen
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { id: 'multiple-choice', label: 'Multiple-Choice (Auswahl)' },
            { id: 'input', label: 'Freitext / Tastatur-Eingabe' },
          ].map((t) => {
            const isSel = questionTypes.includes(t.id as any);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeToggle(t.id as any)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isSel ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSel ? '#EFF6FF' : 'white',
                  color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {isSel && <Check size={16} color="var(--primary)" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: Topic Filter Cloud with 3 Modes */}
      {(subject === 'all' || subject === 'math' || subject === 'english') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)' }}>
              5. Themen-Steuerung (3 Modus-Auswahl per Klick)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
              <button
                type="button"
                onClick={() => handleBulkSetMode('optional')}
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Alle Optional
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetMode('forced')}
                style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Alle Garantiert ⭐
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetMode('off')}
                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#64748B', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Alle Deaktivieren 🚫
              </button>
            </div>
          </div>

          {/* Mode Legend */}
          <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#1E40AF', fontWeight: 600 }}>
              🔵 <strong>Optional:</strong> Standard (Wird bei passender Stufe abgefragt)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#B45309', fontWeight: 700 }}>
              ⭐ <strong>Garantiert:</strong> Prio-Modus (Wird garantiert abgefragt sobald Stufe erreicht wird)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B', textDecoration: 'line-through' }}>
              🚫 <strong>Deaktiviert:</strong> Thema wird im Test komplett ausgeschlossen
            </span>
          </div>

          {(subject === 'all' || subject === 'math') && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.4rem' }}>
                Mathematik-Themen:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {MATH_TOPICS.map((topic) => {
                  const mode = topicModes[topic] || 'optional';
                  
                  let styleConfig = {
                    border: '1px solid #BFDBFE',
                    bg: '#EFF6FF',
                    color: '#1E40AF',
                    prefix: '🔵 ',
                    fontWeight: 500,
                    textDecoration: 'none',
                  };
                  if (mode === 'forced') {
                    styleConfig = {
                      border: '2px solid #F59E0B',
                      bg: '#FEF3C7',
                      color: '#92400E',
                      prefix: '⭐ ',
                      fontWeight: 700,
                      textDecoration: 'none',
                    };
                  } else if (mode === 'off') {
                    styleConfig = {
                      border: '1px dashed #CBD5E1',
                      bg: '#F8FAFC',
                      color: '#94A3B8',
                      prefix: '🚫 ',
                      fontWeight: 400,
                      textDecoration: 'line-through',
                    };
                  }

                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicCycle(topic)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '20px',
                        border: styleConfig.border,
                        backgroundColor: styleConfig.bg,
                        color: styleConfig.color,
                        fontSize: '0.82rem',
                        fontWeight: styleConfig.fontWeight,
                        textDecoration: styleConfig.textDecoration,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Klicken zum Ändern (Aktuell: ${mode.toUpperCase()})`}
                    >
                      {styleConfig.prefix}{topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(subject === 'all' || subject === 'english') && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065F46', marginBottom: '0.4rem' }}>
                Englisch-Themen:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {ENGLISH_TOPICS.map((topic) => {
                  const mode = topicModes[topic] || 'optional';

                  let styleConfig = {
                    border: '1px solid #A7F3D0',
                    bg: '#ECFDF5',
                    color: '#065F46',
                    prefix: '🔵 ',
                    fontWeight: 500,
                    textDecoration: 'none',
                  };
                  if (mode === 'forced') {
                    styleConfig = {
                      border: '2px solid #F59E0B',
                      bg: '#FEF3C7',
                      color: '#92400E',
                      prefix: '⭐ ',
                      fontWeight: 700,
                      textDecoration: 'none',
                    };
                  } else if (mode === 'off') {
                    styleConfig = {
                      border: '1px dashed #CBD5E1',
                      bg: '#F8FAFC',
                      color: '#94A3B8',
                      prefix: '🚫 ',
                      fontWeight: 400,
                      textDecoration: 'line-through',
                    };
                  }

                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicCycle(topic)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '20px',
                        border: styleConfig.border,
                        backgroundColor: styleConfig.bg,
                        color: styleConfig.color,
                        fontSize: '0.82rem',
                        fontWeight: styleConfig.fontWeight,
                        textDecoration: styleConfig.textDecoration,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Klicken zum Ändern (Aktuell: ${mode.toUpperCase()})`}
                    >
                      {styleConfig.prefix}{topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={handleResetToDefault} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RotateCcw size={16} /> Auf Standard zurücksetzen
        </button>

        <button className="btn btn-primary" onClick={handleStartCustomTest} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          <Play size={18} />
          Konfigurierten Test jetzt starten
        </button>
      </div>
    </div>
  );
};

export default TestConfigurator;
