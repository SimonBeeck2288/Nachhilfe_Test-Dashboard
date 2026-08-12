import React from 'react';
import type { TestSessionRecord, TopicBreakdownItem } from '../types/history';

interface TopicAccuracyChartProps {
  sessions: TestSessionRecord[];
}

export const TopicAccuracyChart: React.FC<TopicAccuracyChartProps> = ({ sessions }) => {
  // Aggregate topic stats across all sessions
  const topicMap: Record<string, { topic: string; correct: number; total: number }> = {};

  sessions.forEach((session) => {
    // Check if topicBreakdown is array or object
    if (Array.isArray(session.topicBreakdown)) {
      session.topicBreakdown.forEach((item: TopicBreakdownItem) => {
        if (!item.topic) return;
        if (!topicMap[item.topic]) {
          topicMap[item.topic] = { topic: item.topic, correct: 0, total: 0 };
        }
        topicMap[item.topic].correct += item.correct || 0;
        topicMap[item.topic].total += item.total || 0;
      });
    } else if (session.topicBreakdown && typeof session.topicBreakdown === 'object') {
      Object.values(session.topicBreakdown).forEach((item: TopicBreakdownItem) => {
        if (!item.topic) return;
        if (!topicMap[item.topic]) {
          topicMap[item.topic] = { topic: item.topic, correct: 0, total: 0 };
        }
        topicMap[item.topic].correct += item.correct || 0;
        topicMap[item.topic].total += item.total || 0;
      });
    }

    // Also fallback to inspecting raw answers if topicBreakdown wasn't structured
    if ((!session.topicBreakdown || (Array.isArray(session.topicBreakdown) && session.topicBreakdown.length === 0)) && session.answers) {
      session.answers.forEach((ans) => {
        if (!ans.topic) return;
        if (!topicMap[ans.topic]) {
          topicMap[ans.topic] = { topic: ans.topic, correct: 0, total: 0 };
        }
        topicMap[ans.topic].total += 1;
        if (ans.isCorrect) topicMap[ans.topic].correct += 1;
      });
    }
  });

  const aggregatedTopics = Object.values(topicMap)
    .filter((t) => t.total > 0)
    .map((t) => ({
      ...t,
      accuracy: Math.round((t.correct / t.total) * 100),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (aggregatedTopics.length === 0) {
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
        Keine Themen-Statistiken für diesen Schüler vorhanden.
      </div>
    );
  }

  const barHeight = 24;
  const gap = 16;
  const paddingLeft = 160;
  const paddingRight = 90;
  const paddingTop = 30;
  const svgWidth = 650;
  const svgHeight = paddingTop + aggregatedTopics.length * (barHeight + gap) + 20;
  const maxBarWidth = svgWidth - paddingLeft - paddingRight;

  return (
    <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-color)' }}>
          Themen-Genauigkeit (%) über alle historischen Tests
        </h4>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ color: '#10B981' }}>■ ≥ 70% Stark</span>
          <span style={{ color: '#F59E0B' }}>■ 50–69% Mittel</span>
          <span style={{ color: '#EF4444' }}>■ &lt; 50% Übungsbedarf</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '450px' }}>
          {aggregatedTopics.map((t, idx) => {
            const y = paddingTop + idx * (barHeight + gap);
            const fillWidth = Math.max(8, (t.accuracy / 100) * maxBarWidth);
            const barColor = t.accuracy >= 70 ? '#10B981' : t.accuracy >= 50 ? '#F59E0B' : '#EF4444';

            return (
              <g key={t.topic}>
                {/* Topic Name */}
                <text
                  x={paddingLeft - 12}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="600"
                  fill="#334155"
                >
                  {t.topic.length > 20 ? `${t.topic.substring(0, 18)}...` : t.topic}
                </text>

                {/* Background Track */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={maxBarWidth}
                  height={barHeight}
                  rx="4"
                  fill="#F1F5F9"
                />

                {/* Filled Accuracy Bar */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={fillWidth}
                  height={barHeight}
                  rx="4"
                  fill={barColor}
                  style={{ transition: 'width 0.5s ease-out' }}
                />

                {/* Percentage & Fraction Label */}
                <text
                  x={paddingLeft + maxBarWidth + 10}
                  y={y + barHeight / 2 + 4}
                  fontSize="12"
                  fontWeight="700"
                  fill={barColor}
                >
                  {t.accuracy}% ({t.correct}/{t.total})
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default TopicAccuracyChart;
