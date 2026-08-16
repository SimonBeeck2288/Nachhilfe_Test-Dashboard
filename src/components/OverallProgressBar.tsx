import React from 'react';

export interface OverallProgressBarProps {
  elapsedMs?: number;
  totalMs?: number;
  progress?: number;
  isExceeded?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const OverallProgressBar: React.FC<OverallProgressBarProps> = ({
  elapsedMs,
  totalMs,
  progress,
  isExceeded = false,
  className = '',
  style = {},
}) => {
  let calculatedProgress = 0;

  if (typeof progress === 'number' && !isNaN(progress)) {
    calculatedProgress = Math.min(100, Math.max(0, progress));
  } else if (
    typeof elapsedMs === 'number' &&
    typeof totalMs === 'number' &&
    isFinite(totalMs) &&
    totalMs > 0
  ) {
    calculatedProgress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  }

  const barColor = isExceeded || calculatedProgress >= 100 ? '#F59E0B' : 'var(--primary, #4F46E5)';

  return (
    <div
      role="progressbar"
      aria-label="Gesamtfortschritt der Testzeit"
      aria-valuenow={Math.round(calculatedProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`overall-progress-bar-container ${className}`.trim()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: 'var(--border, #E5E7EB)',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: 'inherit',
        overflow: 'hidden',
        zIndex: 5,
        ...style,
      }}
    >
      <div
        className="overall-progress-bar-fill"
        style={{
          height: '100%',
          width: `${calculatedProgress}%`,
          backgroundColor: barColor,
          transition: 'width 0.4s ease, background-color 0.4s ease',
        }}
      />
    </div>
  );
};

export default OverallProgressBar;
