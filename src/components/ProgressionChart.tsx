import React, { useState, useMemo } from 'react';
import type { TestSessionRecord, TopicBreakdownItem } from '../types/history';

interface ProgressionChartProps {
  sessions: TestSessionRecord[];
}

const COLOR_PALETTE = [
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#D97706', // Gold
  '#059669', // Emerald
];

export const ProgressionChart: React.FC<ProgressionChartProps> = ({ sessions }) => {
  // Sort sessions chronologically ascending
  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [sessions]);

  // Series visibility state
  const [showMathLevel, setShowMathLevel] = useState<boolean>(true);
  const [showEnglishLevel, setShowEnglishLevel] = useState<boolean>(true);
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    title: string;
    date: string;
    subtitle?: string;
    details?: { topic: string; accuracy: number; correct: number; total: number }[];
    x: number;
    y: number;
    color: string;
  } | null>(null);

  // Extract all distinct topics present in history
  const allAvailableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    sortedSessions.forEach((s) => {
      if (Array.isArray(s.topicBreakdown)) {
        s.topicBreakdown.forEach((tb) => {
          if (tb.topic) topicSet.add(tb.topic);
        });
      } else if (s.topicBreakdown && typeof s.topicBreakdown === 'object') {
        Object.values(s.topicBreakdown).forEach((tb) => {
          if (tb.topic) topicSet.add(tb.topic);
        });
      }
      if (s.answers) {
        s.answers.forEach((ans) => {
          if (ans.topic) topicSet.add(ans.topic);
        });
      }
    });
    return Array.from(topicSet);
  }, [sortedSessions]);

  // Assign consistent colors to topics
  const topicColors = useMemo(() => {
    const map: Record<string, string> = {};
    allAvailableTopics.forEach((t, i) => {
      map[t] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [allAvailableTopics]);

  const toggleTopic = (topic: string) => {
    setActiveTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  if (sortedSessions.length === 0) {
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
        Keine bisherigen Test-Ergebnisse für die Lernfortschritts-Kurve vorhanden.
      </div>
    );
  }

  // SVG Dimensions & Padding
  const svgWidth = 700;
  const svgHeight = 350;
  const paddingLeft = 55;
  const paddingRight = 60;
  const paddingTop = 35;
  const paddingBottom = 55;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Y1 Scale: Level 1 to 7
  const minLevel = 1;
  const maxLevel = 7;
  const getYLevel = (level: number) => {
    const clamped = Math.max(minLevel, Math.min(maxLevel, level));
    const ratio = (clamped - minLevel) / (maxLevel - minLevel);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Y2 Scale: Topic Accuracy 0% to 100%
  const getYAccuracy = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const ratio = clamped / 100;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getX = (index: number) => {
    if (sortedSessions.length === 1) {
      return paddingLeft + chartWidth / 2;
    }
    const ratio = index / (sortedSessions.length - 1);
    return paddingLeft + ratio * chartWidth;
  };

  // Helper to extract session's topic breakdown
  const getSessionTopicBreakdown = (s: TestSessionRecord): { topic: string; accuracy: number; correct: number; total: number }[] => {
    const items: Record<string, { correct: number; total: number }> = {};

    if (Array.isArray(s.topicBreakdown)) {
      s.topicBreakdown.forEach((tb: TopicBreakdownItem) => {
        if (!tb.topic) return;
        items[tb.topic] = { correct: tb.correct || 0, total: tb.total || 0 };
      });
    } else if (s.topicBreakdown && typeof s.topicBreakdown === 'object') {
      Object.values(s.topicBreakdown).forEach((tb: TopicBreakdownItem) => {
        if (!tb.topic) return;
        items[tb.topic] = { correct: tb.correct || 0, total: tb.total || 0 };
      });
    }

    if (Object.keys(items).length === 0 && s.answers) {
      s.answers.forEach((ans) => {
        if (!ans.topic) return;
        if (!items[ans.topic]) items[ans.topic] = { correct: 0, total: 0 };
        items[ans.topic].total += 1;
        if (ans.isCorrect) items[ans.topic].correct += 1;
      });
    }

    return Object.entries(items)
      .filter(([_, data]) => data.total > 0)
      .map(([topic, data]) => ({
        topic,
        correct: data.correct,
        total: data.total,
        accuracy: Math.round((data.correct / data.total) * 100),
      }));
  };

  // Build points for Math and English
  const mathPoints = sortedSessions.map((s, idx) => ({
    x: getX(idx),
    y: getYLevel(s.mathLevelReached || 1),
    level: s.mathLevelReached || 1,
    date: s.date,
    session: s,
  }));

  const englishPoints = sortedSessions.map((s, idx) => ({
    x: getX(idx),
    y: getYLevel(s.englishLevelReached || 1),
    level: s.englishLevelReached || 1,
    date: s.date,
    session: s,
  }));

  const mathPathD = mathPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const englishPathD = englishPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  // Active topic trend lines computation
  const topicLines = Array.from(activeTopics).map((topic) => {
    const points: { x: number; y: number; accuracy: number; session: TestSessionRecord; date: string }[] = [];

    sortedSessions.forEach((s, idx) => {
      const breakdown = getSessionTopicBreakdown(s);
      const match = breakdown.find((b) => b.topic === topic);
      if (match) {
        points.push({
          x: getX(idx),
          y: getYAccuracy(match.accuracy),
          accuracy: match.accuracy,
          session: s,
          date: s.date,
        });
      }
    });

    const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    return {
      topic,
      color: topicColors[topic] || '#3B82F6',
      points,
      pathD,
    };
  });

  const activeSessionDetails = selectedSessionId
    ? sortedSessions.find((s) => s.sessionId === selectedSessionId)
    : null;

  return (
    <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-color)' }}>
            Lernfortschritts-Kurve & Themen-Entwicklung
          </h4>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Klicke auf Themen-Buttons, um deren Verlauf (0–100%) in den Graph einzublenden. Klicke auf Datenpunkte für Details.
          </p>
        </div>

        {/* Global Level Toggles */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: 600 }}>
          <button
            type="button"
            onClick={() => setShowMathLevel(!showMathLevel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '20px',
              border: `1.5px solid ${showMathLevel ? '#3B82F6' : '#CBD5E1'}`,
              backgroundColor: showMathLevel ? '#EFF6FF' : '#F8FAFC',
              color: showMathLevel ? '#1E40AF' : '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></span>
            Mathe Stufe (Lvl 1–7)
          </button>

          <button
            type="button"
            onClick={() => setShowEnglishLevel(!showEnglishLevel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '20px',
              border: `1.5px solid ${showEnglishLevel ? '#10B981' : '#CBD5E1'}`,
              backgroundColor: showEnglishLevel ? '#ECFDF5' : '#F8FAFC',
              color: showEnglishLevel ? '#065F46' : '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '2px' }}></span>
            Englisch Stufe (Lvl 1–7)
          </button>
        </div>
      </div>

      {/* Topic Filter Chips for Graph Plotting */}
      {allAvailableTopics.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Themen-Verlauf im Graph einblenden ({activeTopics.size} aktiv):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {allAvailableTopics.map((topic) => {
              const isActive = activeTopics.has(topic);
              const color = topicColors[topic];
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '16px',
                    border: `1px solid ${isActive ? color : '#CBD5E1'}`,
                    backgroundColor: isActive ? `${color}20` : 'white',
                    color: isActive ? color : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: color, borderRadius: '50%' }}></span>
                  {topic} {isActive ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Chart Container */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '500px' }}>
          {/* Y1 Left Axis (Level 1–7) Grid Lines & Labels */}
          {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
            const y = getYLevel(lvl);
            return (
              <g key={`y1-${lvl}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748B"
                  fontWeight="600"
                >
                  Lvl {lvl}
                </text>
              </g>
            );
          })}

          {/* Y2 Right Axis (Topic Accuracy 0% - 100%) Labels if topics active */}
          {activeTopics.size > 0 &&
            [0, 25, 50, 75, 100].map((pct) => {
              const y = getYAccuracy(pct);
              return (
                <text
                  key={`y2-${pct}`}
                  x={svgWidth - paddingRight + 10}
                  y={y + 4}
                  textAnchor="start"
                  fontSize="11"
                  fill="#8B5CF6"
                  fontWeight="700"
                >
                  {pct}%
                </text>
              );
            })}

          {/* X-Axis Dates */}
          {sortedSessions.map((s, idx) => {
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

          {/* Math Level Line */}
          {showMathLevel && mathPathD && (
            <path d={mathPathD} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* English Level Line */}
          {showEnglishLevel && englishPathD && (
            <path d={englishPathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Toggled Topic Trend Lines */}
          {topicLines.map((tl) => (
            <path
              key={`line-${tl.topic}`}
              d={tl.pathD}
              fill="none"
              stroke={tl.color}
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Math Level Data Points */}
          {showMathLevel &&
            mathPoints.map((pt, idx) => {
              const breakdown = getSessionTopicBreakdown(pt.session);
              return (
                <circle
                  key={`math-pt-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={selectedSessionId === pt.session.sessionId ? '8' : '6'}
                  fill="#3B82F6"
                  stroke={selectedSessionId === pt.session.sessionId ? '#1E3A8A' : 'white'}
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => setSelectedSessionId(pt.session.sessionId)}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      index: idx,
                      title: `Mathematik: Level ${pt.level}`,
                      date: pt.date,
                      subtitle: `${pt.session.studentName} (${pt.session.score}/${pt.session.totalQuestions} Richtig)`,
                      details: breakdown,
                      x: pt.x,
                      y: pt.y,
                      color: '#3B82F6',
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

          {/* English Level Data Points */}
          {showEnglishLevel &&
            englishPoints.map((pt, idx) => {
              const breakdown = getSessionTopicBreakdown(pt.session);
              return (
                <rect
                  key={`eng-pt-${idx}`}
                  x={pt.x - 5}
                  y={pt.y - 5}
                  width="10"
                  height="10"
                  fill="#10B981"
                  stroke={selectedSessionId === pt.session.sessionId ? '#064E3B' : 'white'}
                  strokeWidth="2"
                  rx="2"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => setSelectedSessionId(pt.session.sessionId)}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      index: idx,
                      title: `Englisch: Level ${pt.level}`,
                      date: pt.date,
                      subtitle: `${pt.session.studentName} (${pt.session.score}/${pt.session.totalQuestions} Richtig)`,
                      details: breakdown,
                      x: pt.x,
                      y: pt.y,
                      color: '#10B981',
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

          {/* Topic Data Points */}
          {topicLines.map((tl) =>
            tl.points.map((pt, idx) => (
              <circle
                key={`topic-pt-${tl.topic}-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={tl.color}
                stroke="white"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSessionId(pt.session.sessionId)}
                onMouseEnter={() =>
                  setHoveredPoint({
                    index: idx,
                    title: `Thema "${tl.topic}": ${pt.accuracy}%`,
                    date: pt.date,
                    subtitle: `${pt.session.studentName}`,
                    x: pt.x,
                    y: pt.y,
                    color: tl.color,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -110%)',
              backgroundColor: '#0F172A',
              color: 'white',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              zIndex: 30,
              border: `1px solid ${hoveredPoint.color}`,
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: hoveredPoint.color }}>
              {hoveredPoint.title}
            </div>
            {hoveredPoint.subtitle && (
              <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>{hoveredPoint.subtitle}</div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
              Datum: {new Date(hoveredPoint.date).toLocaleDateString('de-DE')}
            </div>

            {hoveredPoint.details && hoveredPoint.details.length > 0 && (
              <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #334155' }}>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#F1F5F9', marginBottom: '0.2rem' }}>
                  Themen-Ergebnisse dieser Session:
                </div>
                {hoveredPoint.details.slice(0, 5).map((d) => (
                  <div key={d.topic} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem' }}>
                    <span>{d.topic}:</span>
                    <span style={{ fontWeight: 'bold', color: d.accuracy >= 70 ? '#4ADE80' : d.accuracy >= 50 ? '#FBBF24' : '#F87171' }}>
                      {d.accuracy}% ({d.correct}/{d.total})
                    </span>
                  </div>
                ))}
                {hoveredPoint.details.length > 5 && (
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>
                    + {hoveredPoint.details.length - 5} weitere Themen
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Click Drilldown Panel for Selected Session */}
      {activeSessionDetails && (
        <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)' }}>
              📊 Session-Themenanalyse vom {new Date(activeSessionDetails.date).toLocaleDateString('de-DE')} ({activeSessionDetails.studentName})
            </h5>
            <button
              onClick={() => setSelectedSessionId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Schließen ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {getSessionTopicBreakdown(activeSessionDetails).map((tb) => (
              <div key={tb.topic} style={{ padding: '0.6rem 0.85rem', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  <span>{tb.topic}</span>
                  <span style={{ color: tb.accuracy >= 70 ? 'var(--success)' : tb.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {tb.accuracy}% ({tb.correct}/{tb.total})
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${tb.accuracy}%`,
                      height: '100%',
                      backgroundColor: tb.accuracy >= 70 ? '#10B981' : tb.accuracy >= 50 ? '#F59E0B' : '#EF4444',
                      borderRadius: '3px',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressionChart;
