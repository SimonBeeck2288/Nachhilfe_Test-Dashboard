import React, { useState } from 'react';
import type { AbTestComparisonMetrics } from '../types/history';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';

export interface AbTestComparisonCardProps {
  metrics: AbTestComparisonMetrics;
  studentName: string;
  studentId?: string;
  onActivateDirectMode?: () => void;
  isAlreadyActive?: boolean;
}

export const AbTestComparisonCard: React.FC<AbTestComparisonCardProps> = ({
  metrics,
  studentName,
  onActivateDirectMode,
  isAlreadyActive = false,
}) => {
  const [justActivated, setJustActivated] = useState(false);

  const handleActivate = () => {
    if (onActivateDirectMode) {
      onActivateDirectMode();
      setJustActivated(true);
    }
  };

  const isActive = isAlreadyActive || justActivated;

  const isRecommendDirect = metrics.recommendation === 'recommend_direct';
  const isRecommendStandard = metrics.recommendation === 'recommend_standard';

  const bannerBg = isRecommendDirect
    ? '#ECFDF5'
    : isRecommendStandard
    ? '#FEF3C7'
    : '#EFF6FF';
  const bannerBorder = isRecommendDirect
    ? '#A7F3D0'
    : isRecommendStandard
    ? '#FDE68A'
    : '#BFDBFE';
  const bannerText = isRecommendDirect
    ? '#065F46'
    : isRecommendStandard
    ? '#92400E'
    : '#1E40AF';

  return (
    <div
      className="card fade-in"
      style={{
        border: '2px solid #8B5CF6',
        borderRadius: '1rem',
        padding: '1.5rem',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.12)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #EDE9FE',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              backgroundColor: '#EDE9FE',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={24} color="#7C3AED" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#5B21B6',
              }}
            >
              Testergebnis: Welche Fragen passen besser zu dir?
            </h3>
            <span style={{ fontSize: '0.84rem', color: '#6B7280', fontWeight: 500 }}>
              Vergleich: Standard-Textaufgaben vs. Direkt & Reizarm (ohne Ablenkung / ohne Text-Ballast)
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.3rem 0.65rem',
            borderRadius: '20px',
            backgroundColor: '#F3E8FF',
            color: '#7C3AED',
            border: '1px solid #DDD6FE',
          }}
        >
          Aufgabenstil-Vergleich
        </span>
      </div>

      {/* Recommendation Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: bannerBg,
          border: `1px solid ${bannerBorder}`,
          color: bannerText,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        {isRecommendDirect ? (
          <Sparkles size={22} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : isRecommendStandard ? (
          <AlertCircle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <Info size={22} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', marginBottom: '0.2rem' }}>
            {isRecommendDirect
              ? '💡 Praxistipp: Direkte Aufgabenstellungen funktionieren besser'
              : isRecommendStandard
              ? '💡 Praxistipp: Textaufgaben beibehalten'
              : '💡 Praxistipp: Ausgeglichene Leistung in beiden Modi'}
          </div>
          <div style={{ fontSize: '0.88rem', lineHeight: '1.45', opacity: 0.95 }}>
            {metrics.recommendationReason}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Standard Variant Card */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#475569' }}>
              Standard-Modus (Narrativ)
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                backgroundColor: '#F1F5F9',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              {metrics.standard.total} Fragen
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Target size={14} /> Trefferquote
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', marginTop: '0.25rem' }}>
                {Math.round(metrics.standard.accuracy * 100)}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {metrics.standard.correct} von {metrics.standard.total} richtig
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> Ø Antwortzeit
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', marginTop: '0.25rem' }}>
                {metrics.standard.avgTime.toFixed(1)}s
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                pro Aufgabe
              </span>
            </div>
          </div>
        </div>

        {/* Direct & Reduced Variant Card */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#F0FDF4',
            borderRadius: '0.75rem',
            border: '2px solid #86EFAC',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#166534' }}>
              Direkt & Reizarm [D/R]
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#15803D',
                backgroundColor: '#DCFCE7',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontWeight: 700,
              }}
            >
              {metrics.direct.total} Fragen
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #BBF7D0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Target size={14} /> Trefferquote
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532D', marginTop: '0.25rem' }}>
                {Math.round(metrics.direct.accuracy * 100)}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                {metrics.direct.correct} von {metrics.direct.total} richtig
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #BBF7D0',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> Ø Antwortzeit
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532D', marginTop: '0.25rem' }}>
                {metrics.direct.avgTime.toFixed(1)}s
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                pro Aufgabe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Metrics Summary Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          padding: '0.85rem 1rem',
          borderRadius: '0.75rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            Genauigkeits-Differenz:
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: metrics.accuracyGainPercent >= 0 ? '#059669' : '#DC2626',
              backgroundColor: metrics.accuracyGainPercent >= 0 ? '#DCFCE7' : '#FEE2E2',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
            }}
          >
            {metrics.accuracyGainPercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {metrics.accuracyGainPercent >= 0 ? `+${metrics.accuracyGainPercent}%` : `${metrics.accuracyGainPercent}%`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            Geschwindigkeits-Vorteil:
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: metrics.speedupPercent >= 0 ? '#059669' : '#D97706',
              backgroundColor: metrics.speedupPercent >= 0 ? '#DCFCE7' : '#FEF3C7',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
            }}
          >
            {metrics.speedupPercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {metrics.speedupPercent >= 0
              ? `+${metrics.speedupPercent}% schneller`
              : `${Math.abs(metrics.speedupPercent)}% langsamer`}
          </span>
        </div>
      </div>

      {/* 1-Click Action Button */}
      {onActivateDirectMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActive}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isActive ? '#059669' : '#7C3AED',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: isActive ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: isActive ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {isActive ? <CheckCircle2 size={18} /> : <Zap size={18} />}
            {isActive
              ? `✓ Direkt & Reizarm Modus ist für ${studentName} aktiviert`
              : `Direkt & Reizarm Modus dauerhaft für ${studentName} aktivieren`}
          </button>
        </div>
      )}
    </div>
  );
};

export default AbTestComparisonCard;
