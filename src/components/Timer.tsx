import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  elapsedTime?: number;
  targetTime?: number;
  timeLeft?: number; // legacy fallback
  totalTime?: number; // legacy fallback
}

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = ({
  elapsedTime = 0,
  targetTime = 30,
  timeLeft,
  totalTime,
}) => {
  const currentElapsed = elapsedTime ?? (totalTime && timeLeft !== undefined ? totalTime - timeLeft : 0);
  const currentTarget = targetTime ?? totalTime ?? 30;

  const isExceeded = currentElapsed > currentTarget;
  const percentage = Math.min(100, Math.max(0, (currentElapsed / currentTarget) * 100));

  let color = '#10b981'; // Green (smooth start)
  if (isExceeded) {
    color = '#ef4444'; // Soft red when overtime
  } else if (percentage >= 75) {
    color = '#f97316'; // Orange (getting close)
  } else if (percentage >= 50) {
    color = '#eab308'; // Yellow (midway)
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        color,
        fontSize: '0.9rem',
        backgroundColor: isExceeded ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        border: `1px solid ${isExceeded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <Clock size={16} />
      <span>
        {formatTime(currentElapsed)} / {formatTime(currentTarget)} (Richtzeit)
      </span>
      <div
        style={{
          width: '60px',
          height: '8px',
          backgroundColor: 'var(--border, #e2e8f0)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>
    </div>
  );
};

export default Timer;

