import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import {
  getStudentRoster,
  saveStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
} from '../utils/studentRoster';
import type { StudentProfile } from '../types/student';
import { StudentSwitcherModal } from '../components/StudentSwitcherModal';
import {
  Play,
  UserPlus,
  Edit3,
  Trash2,
  Users,
  GraduationCap,
  X,
  Check,
  UserCheck,
  Sliders,
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { state, currentStudent, selectStudent, startSession, clearSession } = useTestSession();

  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState<number | string>(7);
  const [formFavorite, setFormFavorite] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    const list = getStudentRoster();
    setRoster(list);
    if (list.length > 0) {
      setSelectedStudentId(list[0].id);
    }
  }, []);

  const loadRoster = () => {
    const list = getStudentRoster();
    setRoster(list);
    if (list.length > 0 && !selectedStudentId) {
      setSelectedStudentId(list[0].id);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormGrade(7);
    setFormFavorite('');
    setFormProblem('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(student);
    setFormName(student.name);
    setFormGrade(student.gradeLevel);
    setFormFavorite(student.favoriteSubject || '');
    setFormProblem(student.problemSubject || '');
    setFormNotes(student.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Möchtest du das Profil von "${name}" wirklich löschen?`)) {
      deleteStudentProfile(id);
      if (selectedStudentId === id) {
        setSelectedStudentId(null);
      }
      loadRoster();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      const updated = updateStudentProfile(editingStudent.id, {
        name: formName.trim(),
        gradeLevel: formGrade,
        favoriteSubject: formFavorite.trim(),
        problemSubject: formProblem.trim(),
        notes: formNotes.trim(),
      });
      if (updated) {
        setSelectedStudentId(updated.id);
      }
    } else {
      const created = saveStudentProfile({
        name: formName.trim(),
        gradeLevel: formGrade,
        favoriteSubject: formFavorite.trim(),
        problemSubject: formProblem.trim(),
        notes: formNotes.trim(),
      });
      setSelectedStudentId(created.id);
    }

    setIsModalOpen(false);
    loadRoster();
  };

  const handleStartTest = (student?: StudentProfile) => {
    clearSession();

    if (student) {
      selectStudent(student);
      startSession(student);
    } else if (selectedStudentId) {
      const target = roster.find((s) => s.id === selectedStudentId);
      if (target) {
        selectStudent(target);
        startSession(target);
      } else if (guestName.trim()) {
        selectStudent(null);
        startSession(guestName.trim());
      }
    } else if (guestName.trim()) {
      selectStudent(null);
      startSession(guestName.trim());
    } else {
      return;
    }

    navigate('/warmup');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)', borderColor: '#BFDBFE' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '2rem' }}>
          Willkommen zur Eingangsdiagnose
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto 1.5rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Wähle ein bestehendes Schülerprofil aus oder erstelle ein neues Profil, um die individuelle Lernstandserhebung in Mathe & Englisch zu starten.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <UserPlus size={18} />
            Neues Schülerprofil anlegen
          </button>
          <button className="btn btn-secondary" onClick={() => setIsSwitcherOpen(true)}>
            <UserCheck size={18} />
            Schüler wechseln
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/configurator')}>
            <Sliders size={18} />
            Custom Test Konfigurieren
          </button>
        </div>
      </div>

      {/* Active Student Profile Banner */}
      {(currentStudent || state.studentName) && (
        <div
          className="card"
          style={{
            backgroundColor: '#EFF6FF',
            borderColor: '#BFDBFE',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              {currentStudent ? currentStudent.name.charAt(0).toUpperCase() : state.studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563EB', letterSpacing: '0.05em' }}>
                  Aktives Schülerprofil
                </span>
                <UserCheck size={14} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: '0.1rem 0 0 0', color: '#1E293B', fontWeight: 700 }}>
                {currentStudent ? `${currentStudent.name} (Klasse ${currentStudent.gradeLevel})` : `${state.studentName} (Gast)`}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleStartTest(currentStudent || undefined)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Play size={18} />
              Diagnose-Test jetzt starten
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsSwitcherOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserCheck size={18} />
              Profil wechseln
            </button>
          </div>
        </div>
      )}

      {/* Roster Selection Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: 'var(--text-color)' }}>
            <Users color="var(--primary)" size={24} />
            Schüler-Roster ({roster.length})
          </h2>
          {roster.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Klicke auf ein Profil, um den Test zu starten
            </span>
          )}
        </div>

        {roster.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
            <GraduationCap size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Noch keine Schülerprofile vorhanden</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Lege ein Schülerprofil an, damit Notizen, Klassenstufe und Testergebnisse dauerhaft gespeichert bleiben.
            </p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <UserPlus size={18} />
              Erstes Profil anlegen
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {roster.map((student) => {
              const isSelected = student.id === selectedStudentId;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: isSelected ? '#F0F7FF' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: 0 }}>{student.name}</h3>
                        {isSelected && <UserCheck size={18} color="var(--primary)" />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Klasse {student.gradeLevel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(student, e)}
                        title="Profil bearbeiten"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(student.id, student.name, e)}
                        title="Profil löschen"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Fächer Badge */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
                    {student.favoriteSubject && (
                      <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        ★ {student.favoriteSubject}
                      </span>
                    )}
                    {student.problemSubject && (
                      <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        ⚠ {student.problemSubject}
                      </span>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {student.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{student.notes}"
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', justifyContent: 'center' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTest(student);
                    }}
                  >
                    <Play size={16} />
                    Test starten
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Option */}
      <div className="card" style={{ backgroundColor: '#FAFBFD' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
          Oder Test ohne Roster-Profil starten (Gast)
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="input"
            placeholder="Schüler-Name für diesen Test"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={{ maxWidth: '350px' }}
          />
          <button
            className="btn btn-secondary"
            disabled={!guestName.trim()}
            onClick={() => handleStartTest()}
          >
            <Play size={16} />
            Als Gast starten
          </button>
        </div>
      </div>

      {/* Profile Creation / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card fade-in"
            style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                {editingStudent ? 'Schülerprofil bearbeiten' : 'Neues Schülerprofil anlegen'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Name des Schülers *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="z.B. Max Mustermann"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Klassenstufe / Jahrgang
                </label>
                <select
                  className="input"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                    <option key={g} value={g}>
                      Klasse {g}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    Lieblingsfach
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="z.B. Sport, Mathe"
                    value={formFavorite}
                    onChange={(e) => setFormFavorite(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    Problemfach
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="z.B. Englisch"
                    value={formProblem}
                    onChange={(e) => setFormProblem(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Notizen / Besonderheiten für Nachhilfelehrer
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="z.B. LRS, braucht ruhiges Umfeld, Konzentrationsschwierigkeiten..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} />
                  {editingStudent ? 'Speichern' : 'Profil anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => {
          setIsSwitcherOpen(false);
          loadRoster();
        }}
      />
    </div>
  );
};

export default Home;
