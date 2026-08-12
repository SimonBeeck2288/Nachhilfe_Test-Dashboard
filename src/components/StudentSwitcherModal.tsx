import React, { useState, useEffect } from 'react';
import { useTestSession } from '../context/TestSessionContext';
import { getStudentRoster, saveStudentProfile } from '../utils/studentRoster';
import type { StudentProfile } from '../types/student';
import {
  Users,
  UserPlus,
  UserCheck,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
  PlusCircle,
  ArrowRight,
  Pencil,
  Plus,
  Tag,
  Sparkles,
  Heart,
} from 'lucide-react';

export interface StudentSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (student: StudentProfile | null) => void;
}

const PRESET_HOBBIES = ['Gaming', 'Fußball', 'Minecraft', 'Musik', 'Lesen', 'Zeichnen', 'Sport'];
const PRESET_PREFERENCES = [
  'Mit Hobbys erklären',
  'Schritt-für-Schritt',
  'Visuell',
  'Beispiele aus Alltag',
  'Kurze Erklärungen',
];

export const StudentSwitcherModal: React.FC<StudentSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
}) => {
  const { state, selectStudent, clearSession } = useTestSession();

  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [confirmTarget, setConfirmTarget] = useState<StudentProfile | 'guest' | null>(null);

  // Form State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number | string>(7);
  const [favoriteSubject, setFavoriteSubject] = useState('');
  const [problemSubject, setProblemSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [learningPreferences, setLearningPreferences] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');

  // Custom Input Fields
  const [customHobbyInput, setCustomHobbyInput] = useState('');
  const [customPrefInput, setCustomPrefInput] = useState('');

  const refreshRoster = () => {
    setRoster(getStudentRoster());
  };

  const resetForm = () => {
    setEditingStudentId(null);
    setName('');
    setGradeLevel(7);
    setFavoriteSubject('');
    setProblemSubject('');
    setNotes('');
    setHobbies([]);
    setLearningPreferences([]);
    setCustomNotes('');
    setCustomHobbyInput('');
    setCustomPrefInput('');
  };

  useEffect(() => {
    if (isOpen) {
      refreshRoster();
      setMode('list');
      setConfirmTarget(null);
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveSession = state.answers && state.answers.length > 0;

  const executeSwitch = (target: StudentProfile | 'guest' | null) => {
    if (hasActiveSession) {
      clearSession();
    }
    const studentObj = target === 'guest' ? null : target;
    selectStudent(studentObj);
    if (onSelectStudent) {
      onSelectStudent(studentObj);
    }
    onClose();
  };

  const handleSelectStudentClick = (target: StudentProfile | 'guest') => {
    const isCurrent =
      target === 'guest'
        ? !state.currentStudent && (!state.studentId || state.studentId === 'guest')
        : state.currentStudent?.id === target.id || state.studentId === target.id;

    if (isCurrent) {
      if (target !== 'guest') {
        selectStudent(target);
      }
      onClose();
      return;
    }

    if (hasActiveSession) {
      setConfirmTarget(target);
    } else {
      executeSwitch(target);
    }
  };

  const startCreateProfile = () => {
    resetForm();
    setMode('create');
  };

  const startEditProfile = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setName(student.name);
    setGradeLevel(student.gradeLevel);
    setFavoriteSubject(student.favoriteSubject || '');
    setProblemSubject(student.problemSubject || '');
    setNotes(student.notes || '');
    setHobbies(student.hobbies || []);
    setLearningPreferences(student.learningPreferences || []);
    setCustomNotes(student.customNotes || '');
    setCustomHobbyInput('');
    setCustomPrefInput('');
    setMode('create');
  };

  const toggleHobbyTag = (tag: string) => {
    setHobbies((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomHobby = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customHobbyInput.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies((prev) => [...prev, trimmed]);
      setCustomHobbyInput('');
    }
  };

  const removeHobbyTag = (tag: string) => {
    setHobbies((prev) => prev.filter((t) => t !== tag));
  };

  const togglePrefTag = (tag: string) => {
    setLearningPreferences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomPref = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customPrefInput.trim();
    if (trimmed && !learningPreferences.includes(trimmed)) {
      setLearningPreferences((prev) => [...prev, trimmed]);
      setCustomPrefInput('');
    }
  };

  const removePrefTag = (tag: string) => {
    setLearningPreferences((prev) => prev.filter((t) => t !== tag));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedProfile = saveStudentProfile({
      id: editingStudentId || undefined,
      name: name.trim(),
      gradeLevel,
      favoriteSubject: favoriteSubject.trim(),
      problemSubject: problemSubject.trim(),
      notes: notes.trim(),
      hobbies,
      learningPreferences,
      customNotes: customNotes.trim(),
    });

    refreshRoster();
    handleSelectStudentClick(savedProfile);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--primary, #2563EB)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-color, #1E293B)' }}>
              {mode === 'create'
                ? editingStudentId
                  ? 'Schülerprofil bearbeiten'
                  : 'Neues Schülerprofil anlegen'
                : 'Schüler wechseln'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748B)',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
            title="Schließen"
          >
            <X size={22} />
          </button>
        </div>

        {/* Confirmation Overlay */}
        {confirmTarget && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#991B1B', fontSize: '1.05rem', fontWeight: 600 }}>
                  Aktiver Test im Gange!
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#7F1D1D', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Es läuft derzeit eine aktive Test-Sitzung ({state.answers.length} Antworten) für{' '}
                  <strong>{state.currentStudent?.name || state.studentName || 'Gast'}</strong>. Beim Profilwechsel
                  wird die laufende Sitzung beendet und der Fortschritt zurückgesetzt.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setConfirmTarget(null)}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => executeSwitch(confirmTarget)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#DC2626',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Ja, Schüler wechseln
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode: List */}
        {mode === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
                Wähle ein Profil aus oder erstelle ein neues:
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startCreateProfile}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={16} />
                Neues Profil
              </button>
            </div>

            {/* Current Active Indicator Banner */}
            {(state.currentStudent || state.studentName) && (
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} color="#2563EB" />
                  <span style={{ fontSize: '0.9rem', color: '#1E40AF' }}>
                    Aktiver Schüler:{' '}
                    <strong>
                      {state.currentStudent
                        ? `${state.currentStudent.name} (Kl. ${state.currentStudent.gradeLevel})`
                        : `${state.studentName} (Gast)`}
                    </strong>
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                  }}
                >
                  Aktiv
                </span>
              </div>
            )}

            {/* Roster List */}
            {roster.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1',
                  marginBottom: '1rem',
                }}
              >
                <GraduationCap size={40} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: '0 0 0.75rem 0', color: '#64748B', fontSize: '0.95rem' }}>
                  Noch keine gespeicherten Schülerprofile.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={startCreateProfile}
                  style={{ fontSize: '0.85rem' }}
                >
                  <PlusCircle size={16} /> Erstes Profil erstellen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {roster.map((student) => {
                  const isActive = state.currentStudent?.id === student.id || state.studentId === student.id;

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudentClick(student)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        backgroundColor: isActive ? '#F0F9FF' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#2563EB' : '#E2E8F0',
                            color: isActive ? '#FFFFFF' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                          }}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.95rem' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Klassenstufe {student.gradeLevel}
                            {student.favoriteSubject ? ` • Vorliebe: ${student.favoriteSubject}` : ''}
                          </div>
                          {((student.hobbies && student.hobbies.length > 0) ||
                            (student.learningPreferences && student.learningPreferences.length > 0)) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                              {student.hobbies?.map((h) => (
                                <span
                                  key={h}
                                  style={{
                                    fontSize: '0.7rem',
                                    backgroundColor: '#DBEAFE',
                                    color: '#1E40AF',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                  }}
                                >
                                  🎮 {h}
                                </span>
                              ))}
                              {student.learningPreferences?.map((p) => (
                                <span
                                  key={p}
                                  style={{
                                    fontSize: '0.7rem',
                                    backgroundColor: '#CCFBF1',
                                    color: '#0F766E',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                  }}
                                >
                                  💡 {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditProfile(student);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '0.3rem 0.5rem',
                            cursor: 'pointer',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                          }}
                          title="Profil bearbeiten"
                        >
                          <Pencil size={14} /> Bearbeiten
                        </button>

                        {isActive ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#2563EB',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            <Check size={18} /> Selected
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            Auswählen <ArrowRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Guest Option */}
            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                paddingTop: '0.85rem',
                marginTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Ohne Profil testen?</span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleSelectStudentClick('guest')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Als Gast wechseln
              </button>
            </div>
          </div>
        )}

        {/* Mode: Create / Edit Form */}
        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Name des Schülers *
              </label>
              <input
                type="text"
                className="input"
                placeholder="z. B. Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Klassenstufe
                </label>
                <select
                  className="input"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                    <option key={g} value={g}>
                      Klasse {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Lieblingsfach
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="z. B. Mathematik"
                  value={favoriteSubject}
                  onChange={(e) => setFavoriteSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Problemfach / Förderschwerpunkt
              </label>
              <input
                type="text"
                className="input"
                placeholder="z. B. Englisch Leseverständnis"
                value={problemSubject}
                onChange={(e) => setProblemSubject(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Notizen & Förderhinweise
              </label>
              <textarea
                className="input"
                placeholder="Besondere Schwerpunkte, Beobachtungen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
              />
            </div>

            {/* Section: Hobbys & Interessen */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.4rem' }}>
                <Heart size={16} color="#2563EB" /> Hobbys & Interessen (KI-Personalisierung)
              </label>
              
              {/* Preset Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                {PRESET_HOBBIES.map((preset) => {
                  const isSelected = hobbies.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => toggleHobbyTag(preset)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '16px',
                        border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom Hobby Input */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Eigenes Hobby (z. B. Skateboard)..."
                  value={customHobbyInput}
                  onChange={(e) => setCustomHobbyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomHobby();
                    }
                  }}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomHobby}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Plus size={14} /> Tag
                </button>
              </div>

              {/* Active Hobbies Tags */}
              {hobbies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {hobbies.map((h) => (
                    <span
                      key={h}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        padding: '0.2rem 0.52rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      <Tag size={12} /> {h}
                      <button
                        type="button"
                        onClick={() => removeHobbyTag(h)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#1E40AF',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Lernpräferenzen & Methode */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.4rem' }}>
                <Sparkles size={16} color="#0D9488" /> Lernpräferenzen & Methode
              </label>

              {/* Preset Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                {PRESET_PREFERENCES.map((preset) => {
                  const isSelected = learningPreferences.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => togglePrefTag(preset)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '16px',
                        border: isSelected ? '1px solid #0D9488' : '1px solid #CBD5E1',
                        backgroundColor: isSelected ? '#0D9488' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom Preference Input */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Eigene Präferenz (z. B. Viele Analogien)..."
                  value={customPrefInput}
                  onChange={(e) => setCustomPrefInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomPref();
                    }
                  }}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomPref}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Plus size={14} /> Tag
                </button>
              </div>

              {/* Active Preferences Tags */}
              {learningPreferences.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {learningPreferences.map((p) => (
                    <span
                      key={p}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: '#CCFBF1',
                        color: '#0F766E',
                        padding: '0.2rem 0.52rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      <Sparkles size={12} /> {p}
                      <button
                        type="button"
                        onClick={() => removePrefTag(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#0F766E',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section: customNotes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Individuelle KI-Anweisungen & Wünsche (customNotes)
              </label>
              <textarea
                className="input"
                placeholder="Individuelle Anweisungen für den KI-Tutor (z. B. Mag Harry Potter, mag visuelle Schritt-für-Schritt Erklärungen)..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setMode('list')}
                style={{ fontSize: '0.85rem' }}
              >
                Zurück zur Liste
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={16} /> {editingStudentId ? 'Profil aktualisieren & wählen' : 'Profil speichern & wählen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentSwitcherModal;
