import React from 'react';
import { useTestSession } from '../context/TestSessionContext';
import { Zap, Eye, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { DEFAULT_ACCESSIBILITY_SETTINGS, type AccessibilitySettings } from '../types/student';

interface AccessibilityModeSwitcherProps {
  compact?: boolean;
  showDetails?: boolean;
  onSaveToProfile?: boolean;
  className?: string;
}

export const AccessibilityModeSwitcher: React.FC<AccessibilityModeSwitcherProps> = ({
  compact = false,
  showDetails = false,
  onSaveToProfile = false,
  className = '',
}) => {
  const { state, setAccessibilityPreset, setAccessibilitySettings, saveCurrentStudentProfile } = useTestSession();
  const settings = state?.accessibilitySettings || DEFAULT_ACCESSIBILITY_SETTINGS;
  const [detailsOpen, setDetailsOpen] = React.useState(showDetails);

  const isDirectAndReduced = Boolean(settings?.directQuestions && settings?.reducedSensory);
  const isStandard = Boolean(!settings?.directQuestions && !settings?.reducedSensory);

  const handleSelectPreset = (preset: 'standard' | 'direct_reduced_sensory') => {
    setAccessibilityPreset(preset);
    if (onSaveToProfile && state?.currentStudent) {
      const nextSettings: AccessibilitySettings = preset === 'direct_reduced_sensory'
        ? { preset: 'direct_reduced_sensory', directQuestions: true, reducedSensory: true }
        : { preset: 'standard', directQuestions: false, reducedSensory: false };
      saveCurrentStudentProfile({ accessibilitySettings: nextSettings });
    }
  };

  const handleToggleDirect = () => {
    const nextDirect = !settings?.directQuestions;
    const nextReduced = Boolean(settings?.reducedSensory);
    const nextPreset = nextDirect && nextReduced
      ? 'direct_reduced_sensory'
      : (!nextDirect && !nextReduced ? 'standard' : 'custom');
    const updated: AccessibilitySettings = {
      preset: nextPreset,
      directQuestions: nextDirect,
      reducedSensory: nextReduced,
    };
    setAccessibilitySettings(updated);
    if (onSaveToProfile && state?.currentStudent) {
      saveCurrentStudentProfile({ accessibilitySettings: updated });
    }
  };

  const handleToggleReducedSensory = () => {
    const nextDirect = Boolean(settings?.directQuestions);
    const nextReduced = !settings?.reducedSensory;
    const nextPreset = nextDirect && nextReduced
      ? 'direct_reduced_sensory'
      : (!nextDirect && !nextReduced ? 'standard' : 'custom');
    const updated: AccessibilitySettings = {
      preset: nextPreset,
      directQuestions: nextDirect,
      reducedSensory: nextReduced,
    };
    setAccessibilitySettings(updated);
    if (onSaveToProfile && state?.currentStudent) {
      saveCurrentStudentProfile({ accessibilitySettings: updated });
    }
  };

  if (compact) {
    return (
      <div className={`accessibility-switcher-compact ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            borderRadius: '24px',
            padding: '3px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectPreset('standard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: isStandard ? 700 : 500,
              borderRadius: '20px',
              border: 'none',
              backgroundColor: isStandard ? '#FFFFFF' : 'transparent',
              color: isStandard ? '#1E293B' : '#64748B',
              boxShadow: isStandard ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Standardmodus mit narrativen Kontexten und Standard-UI"
          >
            <Sparkles size={14} color={isStandard ? '#4F46E5' : '#94A3B8'} />
            <span>Standard</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('direct_reduced_sensory')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: isDirectAndReduced ? 700 : 500,
              borderRadius: '20px',
              border: 'none',
              backgroundColor: isDirectAndReduced ? '#0284C7' : 'transparent',
              color: isDirectAndReduced ? '#FFFFFF' : '#64748B',
              boxShadow: isDirectAndReduced ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Direkt & Reizarm: Sachlich-präzise Fragestellungen, reizreduzierte ruhige UI"
          >
            <Zap size={14} color={isDirectAndReduced ? '#FFFFFF' : '#0284C7'} />
            <span>Direkt & Reizarm [D/R]</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`accessibility-switcher-card ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--border, #E2E8F0)',
        padding: '1.1rem 1.25rem',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Eye size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Lern- & Darstellungsmodus
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Angepasste Modi für neurodivergente Lernende (Autismus / ADHS)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
          }}
          title="Details anpassen"
        >
          <SlidersHorizontal size={14} />
          <span>{detailsOpen ? 'Weniger' : 'Anpassen'}</span>
        </button>
      </div>

      {/* Preset Quick Switcher */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: detailsOpen ? '0.85rem' : '0' }}>
        <button
          type="button"
          onClick={() => handleSelectPreset('standard')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.25rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '8px',
            border: isStandard ? '2px solid #6366F1' : '1px solid #E2E8F0',
            backgroundColor: isStandard ? '#EEF2FF' : '#F8FAFC',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isStandard ? '#4338CA' : '#1E293B' }}>
              Standard
            </span>
            {isStandard && <Check size={16} color="#4F46E5" />}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
            Alltags-Kontexte & reguläre Animationen
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('direct_reduced_sensory')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.25rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '8px',
            border: isDirectAndReduced ? '2px solid #0284C7' : '1px solid #E2E8F0',
            backgroundColor: isDirectAndReduced ? '#F0F9FF' : '#F8FAFC',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isDirectAndReduced ? '#0369A1' : '#1E293B' }}>
                Direkt & Reizarm
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: isDirectAndReduced ? '#0284C7' : '#E2E8F0',
                  color: isDirectAndReduced ? '#FFFFFF' : '#475569',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                }}
              >
                D/R
              </span>
            </div>
            {isDirectAndReduced && <Check size={16} color="#0284C7" />}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
            Sachliche Fragen, keine störenden Effekte
          </span>
        </button>
      </div>

      {/* Detail Toggles */}
      {detailsOpen && (
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              fontSize: '0.84rem',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={settings.directQuestions}
              onChange={handleToggleDirect}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <div>
              <span style={{ fontWeight: 600, display: 'block', color: '#0F172A' }}>
                Direkt-Fragen (ohne Ausschmückung)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>
                Formuliert Aufgaben präzise und sachlich direkt ohne narrative Umwege (z. B. keine Äpfel-Geschichten).
              </span>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              fontSize: '0.84rem',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={settings.reducedSensory}
              onChange={handleToggleReducedSensory}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <div>
              <span style={{ fontWeight: 600, display: 'block', color: '#0F172A' }}>
                Reizreduzierte Darstellung
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>
                Deaktiviert visuelle Bounces, Animationen und aufdringliche Übergänge für maximale Konzentration.
              </span>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
