import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import { UserCheck } from 'lucide-react';

const ModuleWarmup: React.FC = () => {
  const navigate = useNavigate();
  const { state, currentStudent, setWarmupData, saveCurrentStudentProfile } = useTestSession();

  const [motivation, setMotivation] = useState<number>(state.motivation || 3);
  const [favoriteSubject, setFavoriteSubject] = useState<string>(
    state.favoriteSubject || currentStudent?.favoriteSubject || ''
  );
  const [hardestSubject, setHardestSubject] = useState<string>(
    state.problemSubject || currentStudent?.problemSubject || ''
  );
  const [updateProfileNotes, setUpdateProfileNotes] = useState<boolean>(false);

  useEffect(() => {
    if (currentStudent) {
      setFavoriteSubject((prev) => prev || currentStudent.favoriteSubject || '');
      setHardestSubject((prev) => prev || currentStudent.problemSubject || '');
    }
  }, [currentStudent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store in active session context
    setWarmupData({
      motivation,
      favoriteSubject: favoriteSubject.trim(),
      problemSubject: hardestSubject.trim(),
    });

    // Optionally sync back to student profile
    if (currentStudent && updateProfileNotes) {
      saveCurrentStudentProfile({
        favoriteSubject: favoriteSubject.trim(),
        problemSubject: hardestSubject.trim(),
      });
    }

    navigate('/cognition');
  };

  return (
    <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Active Student Info Header */}
      {(currentStudent || state.studentName) && (
        <div style={{
          backgroundColor: '#F0F7FF',
          border: '1px solid #BFDBFE',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={24} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-color)' }}>
                Aktiver Schüler: {currentStudent ? currentStudent.name : state.studentName}
              </div>
              {currentStudent && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Klasse {currentStudent.gradeLevel} {currentStudent.notes ? `• ${currentStudent.notes}` : ''}
                </div>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'white', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #DBEAFE', color: 'var(--primary)', fontWeight: 600 }}>
            Profil-Daten geladen
          </span>
        </div>
      )}

      <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
        Modul 1: Warm-up & Selbsteinschätzung
      </h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
        Bevor wir mit den Fachaufgaben starten, möchten wir deine Tagesmotivation und deine Fachpräferenzen erfassen.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            1. Wie motiviert bist du heute für die Nachhilfe? (1 = gar nicht, 5 = sehr)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="1"
              max="5"
              value={motivation}
              onChange={(e) => setMotivation(parseInt(e.target.value))}
              style={{ width: '100%', maxWidth: '300px' }}
            />
            <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>
              {'★'.repeat(motivation)}{'☆'.repeat(5 - motivation)} ({motivation} / 5)
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            2. Was ist dein Lieblingsfach in der Schule?
          </label>
          <input
            type="text"
            className="input"
            value={favoriteSubject}
            onChange={(e) => setFavoriteSubject(e.target.value)}
            placeholder="z.B. Sport, Kunst, Mathe..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            3. In welchem Fach fällt es dir momentan am schwersten, dich zu konzentrieren?
          </label>
          <input
            type="text"
            className="input"
            value={hardestSubject}
            onChange={(e) => setHardestSubject(e.target.value)}
            placeholder="z.B. Englisch, Physik..."
          />
        </div>

        {currentStudent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="syncProfile"
              checked={updateProfileNotes}
              onChange={(e) => setUpdateProfileNotes(e.target.checked)}
            />
            <label htmlFor="syncProfile" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Änderungen an Lieblings- & Problemfach im Schülerprofil dauerhaft speichern
            </label>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">
            Weiter zum Kognitionstest
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleWarmup;
