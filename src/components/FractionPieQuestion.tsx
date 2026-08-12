import React, { useState, useEffect } from 'react';
import { Send, FastForward, RotateCcw, PieChart } from 'lucide-react';

interface FractionPieQuestionProps {
  targetFraction?: { numerator: number; denominator: number };
  onAnswerSubmit: (answer: string) => void;
  onSkip?: () => void;
}

export const FractionPieQuestion: React.FC<FractionPieQuestionProps> = ({
  targetFraction,
  onAnswerSubmit,
  onSkip,
}) => {
  const denominator = targetFraction?.denominator || 4;
  const [selectedSlices, setSelectedSlices] = useState<boolean[]>(
    Array(denominator).fill(false)
  );

  useEffect(() => {
    setSelectedSlices(Array(denominator).fill(false));
  }, [denominator, targetFraction]);

  const toggleSlice = (index: number) => {
    const updated = [...selectedSlices];
    updated[index] = !updated[index];
    setSelectedSlices(updated);
  };

  const selectedCount = selectedSlices.filter(Boolean).length;

  const handleReset = () => {
    setSelectedSlices(Array(denominator).fill(false));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAnswerSubmit(`${selectedCount}/${denominator}`);
  };

  const cx = 110;
  const cy = 110;
  const radius = 90;

  return (
    <div className="fraction-pie-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1rem' }}>
        💡 Klicke auf die Tortenstücke, um den gewünschten Bruch einzufärben.
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ cursor: 'pointer', overflow: 'visible' }}>
          {denominator === 1 ? (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={selectedSlices[0] ? '#4F46E5' : '#F1F5F9'}
              stroke="#6366F1"
              strokeWidth="3"
              onClick={() => toggleSlice(0)}
            />
          ) : (
            Array.from({ length: denominator }).map((_, i) => {
              const startAngle = (i * 2 * Math.PI) / denominator - Math.PI / 2;
              const endAngle = ((i + 1) * 2 * Math.PI) / denominator - Math.PI / 2;

              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);

              const isSelected = selectedSlices[i];
              const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={`pie_slice_${i}`}
                  d={pathD}
                  fill={isSelected ? '#4F46E5' : '#F1F5F9'}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  onClick={() => toggleSlice(i)}
                  style={{
                    transition: 'fill 0.2s ease, transform 0.15s ease',
                  }}
                />
              );
            })
          )}

          {/* Outer Ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#4F46E5" strokeWidth="3" pointerEvents="none" />
        </svg>

        <div
          style={{
            marginTop: '1.25rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <PieChart size={22} color="#4F46E5" />
          <span>
            Ausgewählt: <span style={{ color: '#4F46E5' }}>{selectedCount}</span> / {denominator}
          </span>
        </div>
      </div>

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
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
        >
          <Send size={18} />
          Bestätigen ({selectedCount}/{denominator})
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

export default FractionPieQuestion;
