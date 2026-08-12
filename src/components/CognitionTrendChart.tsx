import React, { useState } from 'react';
import type { TestSessionRecord } from '../types/history';

interface CognitionTrendChartProps {
  sessions: TestSessionRecord[];
}

export const CognitionTrendChart: React.FC<CognitionTrendChartProps> = ({ sessions }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    reactionTimeMs: number;
    accuracy: number;
    x: number;
    y: number;
  } | null>(null);

  // Filter and sort sessions with cognition stats chronologically
  const cogSessions = [...sessions]
    .filter((s) => s.cognitionStats && s.cognitionStats.avgReactionTime > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (cogSessions.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        Keine bisherigen Kognitions-Testergebnisse (Stroop-Reaktionszeit) vorhanden.
      </div>
    );
  }

  // Summary Metrics
  const avgReactionTimeOverall = Math.round(
    cogSessions.reduce((acc, curr) => acc + (curr.cognitionStats?.avgReactionTime || 0), 0) / cogSessions.length
  );
  const avgAccuracyOverall = Math.round(
    (cogSessions.reduce((acc, curr) => acc + (curr.cognitionStats?.accuracy || 0), 0) / cogSessions.length) * 100
  );

  let speedRating = 'Normal';
  if (avgReactionTimeOverall < 1000) speedRating = 'Sehr schnell';
  else if (avgReactionTimeOverall > 1800) speedRating = 'Bedacht / Gründlich';

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 300;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 35;
  const paddingBottom = 55;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minMs = 500;
  const maxMs = 2500;

  const getY = (ms: number) => {
    const clamped = Math.max(minMs, Math.min(maxMs, ms));
    // Notice higher ms is worse (lower on chart or higher Y coord), so Y=paddingTop is minMs (faster), Y=paddingTop+chartHeight is maxMs (slower)
    const ratio = (clamped - minMs) / (maxMs - minMs);
    return paddingTop + ratio * chartHeight;
  };

  const getX = (index: number) => {
    if (cogSessions.length === 1) {
      return paddingLeft + chartWidth / 2;
    }
    const ratio = index / (cogSessions.length - 1);
    return paddingLeft + ratio * chartWidth;
  };

  const points = cogSessions.map((s, idx) => {
    const ms = Math.round(s.cognitionStats?.avgReactionTime || 1200);
    return {
      x: getX(idx),
      y: getY(ms),
      ms,
      accuracy: Math.round((s.cognitionStats?.accuracy || 1) * 100),
      date: s.date,
    };
  });

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      {/* Metric Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#F5F3FF', borderRadius: 'var(--radius-md)', border: '1px solid #DDD6FE' }}>
          <span style={{ fontSize: '0.78rem', color: '#6D28D9', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
            Ø Reaktionszeit
          </span>
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#5B21B6' }}>
            {avgReactionTimeOverall} ms
          </span>
        </div>

        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ECFDF5', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0' }}>
          <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
            Stroop-Genauigkeit
          </span>
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#065F46' }}>
            {avgAccuracyOverall}%
          </span>
        </div>

        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
          <span style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
            Tempo-Einstufung
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1E40AF' }}>
            {speedRating}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-color)' }}>
          Kognitions-Reaktionsgeschwindigkeit (ms) im Verlauf
        </h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          (Niedriger ist schneller)
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '450px' }}>
          {/* Reference lines & Labels */}
          {[500, 1000, 1500, 2000, 2500].map((msVal) => {
            const y = getY(msVal);
            return (
              <g key={msVal}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748B"
                  fontWeight="500"
                >
                  {msVal} ms
                </text>
              </g>
            );
          })}

          {/* Reference Zone Lines */}
          <line
            x1={paddingLeft}
            y1={getY(1000)}
            x2={svgWidth - paddingRight}
            y2={getY(1000)}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text x={svgWidth - paddingRight - 5} y={getY(1000) - 5} textAnchor="end" fontSize="10" fill="#10B981" fontWeight="600">
            Schnell-Schwelle (&lt;1000ms)
          </text>

          {/* X-Axis Dates */}
          {cogSessions.map((s, idx) => {
            const x = getX(idx);
            const d = new Date(s.date);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;
            return (
              <g key={s.sessionId || idx}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={svgHeight - paddingBottom}
                  stroke="#F1F5F9"
                />
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748B"
                >
                  {dateStr}
                </text>
              </g>
            );
          })}

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <circle
              key={`cog-pt-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="6"
              fill="#8B5CF6"
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              onMouseEnter={() =>
                setHoveredPoint({
                  date: pt.date,
                  reactionTimeMs: pt.ms,
                  accuracy: pt.accuracy,
                  x: pt.x,
                  y: pt.y,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -115%)',
              backgroundColor: '#1E293B',
              color: 'white',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              zIndex: 20,
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#A78BFA' }}>
              Ø Reaktionszeit: {hoveredPoint.reactionTimeMs} ms
            </div>
            <div>Genauigkeit: {hoveredPoint.accuracy}%</div>
            <div>Datum: {new Date(hoveredPoint.date).toLocaleDateString('de-DE')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitionTrendChart;
