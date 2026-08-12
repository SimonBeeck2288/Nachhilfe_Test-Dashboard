import React from 'react';
import { Clock } from 'lucide-react';

interface TimeUpBannerProps {
  message?: string;
  onExtraTime?: () => void;
  onSkip?: () => void;
}

export const TimeUpBanner: React.FC<TimeUpBannerProps> = ({
  message = 'Richtzeit überschritten – Du kannst weiterknobeln oder zur nächsten Aufgabe wechseln'
}) => {
  return (
    <div
      className="soft-recommendation-pill fade-in"
      style={{
        marginTop: '1rem',
        marginBottom: '1rem',
        padding: '0.55rem 1rem',
        backgroundColor: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        color: '#92400E',
        fontSize: '0.88rem',
        fontWeight: 500,
        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)'
      }}
    >
      <Clock size={16} color="#D97706" style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
};

export default TimeUpBanner;

