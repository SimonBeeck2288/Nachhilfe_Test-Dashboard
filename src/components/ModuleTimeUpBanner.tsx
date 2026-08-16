import React from 'react';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ModuleTimeUpBannerProps {
  onFinishNow: () => void;
  onFinishCurrentQuestion?: () => void;
  message?: string;
  isFinishingCurrent?: boolean;
}

export const ModuleTimeUpBanner: React.FC<ModuleTimeUpBannerProps> = ({
  onFinishNow,
  onFinishCurrentQuestion,
  message = 'Die Testzeit für dieses Modul ist abgelaufen. Du kannst diese Frage noch in Ruhe fertig beantworten oder das Modul jetzt beenden.',
  isFinishingCurrent = false,
}) => {
  return (
    <div
      role="alert"
      className="module-timeup-banner fade-in"
      style={{
        marginTop: '0.75rem',
        marginBottom: '1.25rem',
        padding: '0.9rem 1.2rem',
        backgroundColor: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: 'var(--radius-md, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        color: '#92400E',
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Clock size={20} color="#D97706" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.4 }}>
          {isFinishingCurrent
            ? 'Zeit abgelaufen: Du beantwortest noch diese Frage, danach geht es automatisch weiter.'
            : message}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.15rem' }}>
        {onFinishCurrentQuestion && !isFinishingCurrent && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onFinishCurrentQuestion}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              borderColor: '#F59E0B',
              color: '#B45309',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Diese Frage noch fertig machen</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onFinishNow}
          style={{
            padding: '0.4rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            backgroundColor: '#D97706',
            borderColor: '#D97706',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>Jetzt beenden</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ModuleTimeUpBanner;
