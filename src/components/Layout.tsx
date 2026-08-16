import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, UserCheck, Users, Wand2 } from 'lucide-react';
import { useTestSession } from '../context/TestSessionContext';
import { StudentSwitcherModal } from './StudentSwitcherModal';

const Layout: React.FC = () => {
  const location = useLocation();
  const { state, currentStudent } = useTestSession();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={32} color="var(--primary)" />
          <h2>DiagnoseTool</h2>
        </Link>
        
        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(currentStudent || state.studentName) && (
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              title="Aktiven Schüler ansehen / wechseln"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundColor: '#F0F7FF',
                border: '1px solid #BFDBFE',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem'
              }}>
                <UserCheck size={16} />
                {currentStudent ? `${currentStudent.name} (Kl. ${currentStudent.gradeLevel})` : state.studentName}
                {(state.accessibilitySettings?.directQuestions || state.accessibilitySettings?.reducedSensory) && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '10px',
                      marginLeft: '0.2rem',
                    }}
                    title="Direkt & Reizarm Modus aktiv"
                  >
                    D/R
                  </span>
                )}
              </span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsSwitcherOpen(true)}
            style={{ padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <UserCheck size={18} />
            Schüler wechseln
          </button>

          {location.pathname !== '/' && (
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <Users size={18} />
              Roster
            </Link>
          )}

          {location.pathname !== '/practice' && (
            <Link to="/practice" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wand2 size={18} />
              Übungs-Generator
            </Link>
          )}

          {location.pathname !== '/dashboard' && (
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          )}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <StudentSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </div>
  );
};

export default Layout;
