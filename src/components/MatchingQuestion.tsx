import React, { useState, useEffect, useMemo } from 'react';
import type { MatchingPair } from '../data/questions';
import { shuffleArray } from '../utils/shuffle';
import { Send, FastForward, RotateCcw, Check, X } from 'lucide-react';

interface MatchingQuestionProps {
  pairs: MatchingPair[];
  onAnswerSubmit: (answer: string) => void;
  onSkip?: () => void;
}

export const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  pairs,
  onAnswerSubmit,
  onSkip,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});

  const leftItems = useMemo(() => pairs.map((p) => p.left), [pairs]);

  const shuffledRightItems = useMemo(() => {
    return shuffleArray(pairs.map((p) => p.right));
  }, [pairs]);

  useEffect(() => {
    setUserMatches({});
    setSelectedLeft(null);
  }, [pairs]);

  const handleLeftClick = (left: string) => {
    setSelectedLeft(left);
  };

  const handleRightClick = (right: string) => {
    if (!selectedLeft) return;

    // If another left item was already mapped to this right item, remove that mapping
    const nextMatches = { ...userMatches };
    Object.keys(nextMatches).forEach((key) => {
      if (nextMatches[key] === right) {
        delete nextMatches[key];
      }
    });

    nextMatches[selectedLeft] = right;
    setUserMatches(nextMatches);
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (left: string) => {
    const nextMatches = { ...userMatches };
    delete nextMatches[left];
    setUserMatches(nextMatches);
  };

  const handleReset = () => {
    setUserMatches({});
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const formatted = Object.keys(userMatches)
      .sort()
      .map((k) => `${k}:${userMatches[k]}`)
      .join(';');
    onAnswerSubmit(formatted);
  };

  const isComplete = Object.keys(userMatches).length === pairs.length;

  return (
    <div className="matching-question-container" style={{ width: '100%', maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1rem', textAlign: 'center' }}>
        💡 Klicke zuerst ein Wort in der linken Spalte an und dann das passende Gegenstück in der rechten Spalte.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569', textAlign: 'center', marginBottom: '0.25rem' }}>
            Spalte A
          </div>
          {leftItems.map((left) => {
            const isSelected = selectedLeft === left;
            const matchedRight = userMatches[left];

            return (
              <button
                key={`left_${left}`}
                type="button"
                className="btn"
                onClick={() => handleLeftClick(left)}
                style={{
                  padding: '0.85rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isSelected ? '#4F46E5' : matchedRight ? '#EEF2FF' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : matchedRight ? '#312E81' : '#1E293B',
                  border: isSelected ? '2px solid #4338CA' : matchedRight ? '1.5px solid #818CF8' : '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{left}</span>
                {matchedRight && (
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#6366F1', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                    ✓ Paart
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569', textAlign: 'center', marginBottom: '0.25rem' }}>
            Spalte B
          </div>
          {shuffledRightItems.map((right) => {
            const isAssigned = Object.values(userMatches).includes(right);
            const isAssignedToSelected = selectedLeft && userMatches[selectedLeft] === right;

            return (
              <button
                key={`right_${right}`}
                type="button"
                className="btn"
                onClick={() => handleRightClick(right)}
                style={{
                  padding: '0.85rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isAssignedToSelected ? '#10B981' : isAssigned ? '#ECFDF5' : selectedLeft ? '#F0FDF4' : '#FFFFFF',
                  color: isAssignedToSelected ? '#FFFFFF' : isAssigned ? '#065F46' : '#1E293B',
                  border: isAssignedToSelected ? '2px solid #059669' : isAssigned ? '1.5px solid #34D399' : selectedLeft ? '1.5px dashed #10B981' : '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  cursor: selectedLeft ? 'pointer' : 'default',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{right}</span>
                {isAssigned && <Check size={16} color={isAssignedToSelected ? '#FFF' : '#10B981'} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE PAIRS SUMMARY */}
      {Object.keys(userMatches).length > 0 && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Erstellte Zuordnungen ({Object.keys(userMatches).length} von {pairs.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.keys(userMatches).map((left) => (
              <span
                key={`pair_summary_${left}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: '#EEF2FF',
                  color: '#3730A3',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '16px',
                  border: '1px solid #C7D2FE',
                }}
              >
                {left} ➔ {userMatches[left]}
                <button
                  type="button"
                  onClick={() => handleRemoveMatch(left)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#6366F1',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  title="Zuordnung entfernen"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CONTROL BUTTONS */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ fontSize: '0.9rem', gap: '0.35rem' }}
        >
          <RotateCcw size={16} />
          Zurücksetzen
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!isComplete}
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', gap: '0.5rem', opacity: isComplete ? 1 : 0.6 }}
        >
          <Send size={18} />
          Bestätigen
        </button>
        {onSkip && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSkip}
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gap: '0.35rem' }}
          >
            <FastForward size={16} />
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchingQuestion;
