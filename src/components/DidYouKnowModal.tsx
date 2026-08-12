import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface DidYouKnowModalProps {
  isOpen: boolean;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string | string[];
  explanation?: string;
  hint?: string;
  onContinue: () => void;
}

export const DidYouKnowModal: React.FC<DidYouKnowModalProps> = ({
  isOpen,
  questionText,
  userAnswer,
  correctAnswer,
  explanation,
  hint,
  onContinue,
}) => {
  if (!isOpen) return null;

  const displayCorrect = Array.isArray(correctAnswer) ? correctAnswer.join(' oder ') : correctAnswer;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '1.25rem',
          maxWidth: '520px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '2px solid #fde047',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        {/* Mascot & Icon Header */}
        <div style={{ position: 'relative', marginTop: '-0.5rem' }}>
          <svg width="80" height="80" viewBox="0 0 100 100">
            {/* Friendly Owl Mascot */}
            <circle cx="50" cy="55" r="35" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="36" cy="45" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="64" cy="45" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="36" cy="45" r="5" fill="#1e293b" />
            <circle cx="64" cy="45" r="5" fill="#1e293b" />
            <circle cx="34" cy="43" r="2" fill="#ffffff" />
            <circle cx="62" cy="43" r="2" fill="#ffffff" />
            <polygon points="50,52 44,60 56,60" fill="#f59e0b" />
            {/* Graduation Cap */}
            <polygon points="50,10 80,22 50,34 20,22" fill="#1e293b" />
            <rect x="36" y="24" width="28" height="10" fill="#334155" />
          </svg>
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '-8px',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              borderRadius: '50%',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lightbulb size={20} />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#b45309' }}>
            Wusstest du schon?
          </h2>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
            Kein Problem! Aus jedem Fehler lernen wir dazu.
          </p>
        </div>

        {/* Explanation / Hint Body */}
        <div
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '0.75rem',
            padding: '1rem',
            width: '100%',
            textAlign: 'left',
            fontSize: '0.95rem',
            color: '#713f12',
            lineHeight: 1.5,
          }}
        >
          {hint && (
            <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
              💡 Tipp: {hint}
            </div>
          )}
          {explanation ? (
            <div>{explanation}</div>
          ) : (
            <div>
              {questionText && <div style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>"{questionText}"</div>}
              {userAnswer && (
                <div style={{ fontSize: '0.88rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                  Deine Antwort: <span style={{ textDecoration: 'line-through' }}>{userAnswer}</span>
                </div>
              )}
              {displayCorrect && (
                <div>
                  Die richtige Antwort lautet: <strong style={{ color: '#15803d' }}>{displayCorrect}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '0.8rem 1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          <span>Weiter geht's!</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
