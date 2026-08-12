import React, { useState, useEffect, useMemo } from 'react';
import { useTestSession } from '../context/TestSessionContext';
import { getSessionsByStudentId } from '../utils/sessionHistory';
import type { PracticeGeneratorConfig, TopicConfig } from '../types/practice';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Printer,
  FileText,
  Sliders,
  BookOpen,
  Clock,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export function mapGradeToLevel(gradeLevel?: number | string): number {
  if (!gradeLevel) return 2;
  const g = typeof gradeLevel === 'number' ? gradeLevel : parseInt(String(gradeLevel), 10);
  if (isNaN(g)) return 2;
  if (g <= 4) return 1;
  if (g === 5) return 2;
  if (g === 6) return 3;
  if (g === 7) return 4;
  if (g === 8) return 5;
  if (g === 9) return 6;
  return 7;
}

export const DEFAULT_MATH_TOPICS = [
  { topicId: 'Addition', topicName: 'Addition', subject: 'math' as const, defaultLevel: 1 },
  { topicId: 'Subtraktion', topicName: 'Subtraktion', subject: 'math' as const, defaultLevel: 1 },
  { topicId: 'Zahlenverständnis', topicName: 'Zahlenverständnis', subject: 'math' as const, defaultLevel: 1 },
  { topicId: 'Multiplikation', topicName: 'Multiplikation', subject: 'math' as const, defaultLevel: 2 },
  { topicId: 'Division', topicName: 'Division', subject: 'math' as const, defaultLevel: 2 },
  { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math' as const, defaultLevel: 2 },
  { topicId: 'Bruchrechnung', topicName: 'Bruchrechnung', subject: 'math' as const, defaultLevel: 3 },
  { topicId: 'Dezimalrechnung', topicName: 'Dezimalrechnung', subject: 'math' as const, defaultLevel: 3 },
  { topicId: 'Prozentrechnung', topicName: 'Prozentrechnung', subject: 'math' as const, defaultLevel: 4 },
  { topicId: 'Gleichungen', topicName: 'Gleichungen', subject: 'math' as const, defaultLevel: 4 },
  { topicId: 'Statistik', topicName: 'Statistik', subject: 'math' as const, defaultLevel: 4 },
  { topicId: 'Negative Zahlen', topicName: 'Negative Zahlen', subject: 'math' as const, defaultLevel: 5 },
  { topicId: 'Potenzen', topicName: 'Potenzen', subject: 'math' as const, defaultLevel: 6 },
  { topicId: 'Wurzelrechnung', topicName: 'Wurzelrechnung', subject: 'math' as const, defaultLevel: 6 },
  { topicId: 'Terme', topicName: 'Terme', subject: 'math' as const, defaultLevel: 6 },
  { topicId: 'Binomische Formeln', topicName: 'Binomische Formeln', subject: 'math' as const, defaultLevel: 7 },
];

export const DEFAULT_ENGLISH_TOPICS = [
  { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english' as const, defaultLevel: 1 },
  { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english' as const, defaultLevel: 1 },
  { topicId: 'Zahlen', topicName: 'Zahlen', subject: 'english' as const, defaultLevel: 1 },
  { topicId: 'Zeiten', topicName: 'Zeiten', subject: 'english' as const, defaultLevel: 2 },
  { topicId: 'Präpositionen', topicName: 'Präpositionen', subject: 'english' as const, defaultLevel: 2 },
  { topicId: 'Steigerung', topicName: 'Steigerung', subject: 'english' as const, defaultLevel: 3 },
  { topicId: 'Modalverben', topicName: 'Modalverben', subject: 'english' as const, defaultLevel: 3 },
  { topicId: 'Leseverständnis', topicName: 'Leseverständnis', subject: 'english' as const, defaultLevel: 4 },
  { topicId: 'Relativsätze', topicName: 'Relativsätze', subject: 'english' as const, defaultLevel: 4 },
  { topicId: 'Passiv', topicName: 'Passiv', subject: 'english' as const, defaultLevel: 5 },
  { topicId: 'Conditionals', topicName: 'Conditionals', subject: 'english' as const, defaultLevel: 5 },
  { topicId: 'Indirekte Rede', topicName: 'Indirekte Rede', subject: 'english' as const, defaultLevel: 6 },
  { topicId: 'Phrasal Verbs', topicName: 'Phrasal Verbs', subject: 'english' as const, defaultLevel: 6 },
  { topicId: 'Inversion', topicName: 'Inversion', subject: 'english' as const, defaultLevel: 7 },
  { topicId: 'Gerund vs Infinitive', topicName: 'Gerund vs Infinitive', subject: 'english' as const, defaultLevel: 7 },
  { topicId: 'Modals in Past', topicName: 'Modals in Past', subject: 'english' as const, defaultLevel: 7 },
];

export interface PracticeConfigViewProps {
  initialConfig?: Partial<PracticeGeneratorConfig>;
  onChangeConfig?: (config: PracticeGeneratorConfig) => void;
  onStartPractice?: (config: PracticeGeneratorConfig) => void;
  onPrintWorksheet?: (config: PracticeGeneratorConfig) => void;
  onPrintSolution?: (config: PracticeGeneratorConfig) => void;
}

export const PracticeConfigView: React.FC<PracticeConfigViewProps> = ({
  initialConfig,
  onChangeConfig,
  onStartPractice,
  onPrintWorksheet,
  onPrintSolution,
}) => {
  const { currentStudent, state } = useTestSession();

  const studentId = currentStudent?.id || 'guest';
  const studentName = currentStudent?.name || state.studentName || 'Gastschüler';
  const gradeLevel = currentStudent?.gradeLevel || 5;

  const [subjectFilter, setSubjectFilter] = useState<'math' | 'english' | 'both'>(
    initialConfig?.subjectFilter || 'both'
  );
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15 | 20>(
    initialConfig?.questionCount || 10
  );
  const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(
    initialConfig?.isTimerDisabled ?? false
  );

  // Compute accuracy per topic from student history
  const topicStatsMap = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    if (!studentId || studentId === 'guest') return stats;

    const sessions = getSessionsByStudentId(studentId);
    sessions.forEach((sess) => {
      if (Array.isArray(sess.topicBreakdown)) {
        sess.topicBreakdown.forEach((item) => {
          if (!item.topic) return;
          if (!stats[item.topic]) stats[item.topic] = { correct: 0, total: 0 };
          stats[item.topic].correct += item.correct || 0;
          stats[item.topic].total += item.total || 0;
        });
      } else if (sess.topicBreakdown && typeof sess.topicBreakdown === 'object') {
        Object.values(sess.topicBreakdown).forEach((item: any) => {
          if (!item.topic) return;
          if (!stats[item.topic]) stats[item.topic] = { correct: 0, total: 0 };
          stats[item.topic].correct += item.correct || 0;
          stats[item.topic].total += item.total || 0;
        });
      } else if (sess.answers && Array.isArray(sess.answers)) {
        sess.answers.forEach((ans) => {
          if (!ans.topic) return;
          if (!stats[ans.topic]) stats[ans.topic] = { correct: 0, total: 0 };
          stats[ans.topic].total += 1;
          if (ans.isCorrect) stats[ans.topic].correct += 1;
        });
      }
    });

    return stats;
  }, [studentId]);

  // Build topics state based on active student and defaults
  const [topics, setTopics] = useState<TopicConfig[]>(() => {
    const baseStudentLevel = mapGradeToLevel(gradeLevel);
    const mathTarget = state.mathLevel || baseStudentLevel;
    const englishTarget = state.englishLevel || baseStudentLevel;

    const allDefs = [...DEFAULT_MATH_TOPICS, ...DEFAULT_ENGLISH_TOPICS];

    return allDefs.map((def) => {
      const stats = topicStatsMap[def.topicName] || { correct: 0, total: 0 };
      const totalAnswered = stats.total;
      const accuracyPercentage =
        totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : undefined;
      const isWeakSpot =
        totalAnswered > 0 && accuracyPercentage !== undefined && accuracyPercentage < 70;

      const targetLevel = def.subject === 'math' ? mathTarget : englishTarget;
      // Pre-select if it's a weak spot OR if default level fits student's grade/level
      const isGradeRelevant = def.defaultLevel <= baseStudentLevel;
      const selected = isWeakSpot || isGradeRelevant;

      return {
        topicId: def.topicId,
        topicName: def.topicName,
        subject: def.subject,
        selected,
        targetLevel,
        isWeakSpot,
        accuracyPercentage,
        totalAnswered,
      };
    });
  });

  // Re-evaluate topics whenever studentId, gradeLevel, or topicStatsMap change
  useEffect(() => {
    const baseStudentLevel = mapGradeToLevel(gradeLevel);
    const mathTarget = state.mathLevel || baseStudentLevel;
    const englishTarget = state.englishLevel || baseStudentLevel;

    const allDefs = [...DEFAULT_MATH_TOPICS, ...DEFAULT_ENGLISH_TOPICS];

    setTopics(
      allDefs.map((def) => {
        const stats = topicStatsMap[def.topicName] || { correct: 0, total: 0 };
        const totalAnswered = stats.total;
        const accuracyPercentage =
          totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : undefined;
        const isWeakSpot =
          totalAnswered > 0 && accuracyPercentage !== undefined && accuracyPercentage < 70;

        const targetLevel = def.subject === 'math' ? mathTarget : englishTarget;
        const isGradeRelevant = def.defaultLevel <= baseStudentLevel;
        const selected = isWeakSpot || isGradeRelevant;

        return {
          topicId: def.topicId,
          topicName: def.topicName,
          subject: def.subject,
          selected,
          targetLevel,
          isWeakSpot,
          accuracyPercentage,
          totalAnswered,
        };
      })
    );
  }, [studentId, gradeLevel, state.mathLevel, state.englishLevel, topicStatsMap]);

  // Construct final current config
  const currentConfig: PracticeGeneratorConfig = useMemo(
    () => ({
      studentId,
      studentName,
      gradeLevel,
      subjectFilter,
      topics,
      questionCount,
      isTimerDisabled,
    }),
    [studentId, studentName, gradeLevel, subjectFilter, topics, questionCount, isTimerDisabled]
  );

  // Notify parent component of config updates
  useEffect(() => {
    if (onChangeConfig) {
      onChangeConfig(currentConfig);
    }
  }, [currentConfig, onChangeConfig]);

  // Filtered topics based on subject filter
  const displayedTopics = useMemo(() => {
    return topics.filter((t) => {
      if (subjectFilter === 'both') return true;
      return t.subject === subjectFilter;
    });
  }, [topics, subjectFilter]);

  const weakSpotCount = useMemo(() => {
    return topics.filter((t) => t.isWeakSpot).length;
  }, [topics]);

  // Quick Action Handlers
  const handleSelectAll = () => {
    setTopics((prev) =>
      prev.map((t) => {
        const matches = subjectFilter === 'both' || t.subject === subjectFilter;
        return matches ? { ...t, selected: true } : t;
      })
    );
  };

  const handleSelectOnlyWeakness = () => {
    setTopics((prev) =>
      prev.map((t) => {
        const matches = subjectFilter === 'both' || t.subject === subjectFilter;
        if (!matches) return t;
        return { ...t, selected: t.isWeakSpot };
      })
    );
  };

  const handleSelectNone = () => {
    setTopics((prev) =>
      prev.map((t) => {
        const matches = subjectFilter === 'both' || t.subject === subjectFilter;
        return matches ? { ...t, selected: false } : t;
      })
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.topicId === topicId ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleLevelChange = (topicId: string, newLevel: number) => {
    setTopics((prev) =>
      prev.map((t) => (t.topicId === topicId ? { ...t, targetLevel: newLevel } : t))
    );
  };

  const selectedCount = displayedTopics.filter((t) => t.selected).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Student Profile & Grade Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#EEF2FF',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem',
            }}
          >
            <User size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>
                {studentName}
              </h3>
              <span
                style={{
                  backgroundColor: '#E0E7FF',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <GraduationCap size={14} />
                Klasse {gradeLevel}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Ziel-Niveau: Mathe Stufe {state.mathLevel || mapGradeToLevel(gradeLevel)} | Englisch Stufe {state.englishLevel || mapGradeToLevel(gradeLevel)}
            </p>
          </div>
        </div>

        {weakSpotCount > 0 ? (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#92400E',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} color="#D97706" />
            <span>{weakSpotCount} {weakSpotCount === 1 ? 'Thema' : 'Themen'} mit Ausbaubedarf (&lt; 70% Genauigkeit)</span>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#166534',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} color="#16A34A" />
            <span>Keine kritischen Schwachstellen erkannt</span>
          </div>
        )}
      </div>

      {/* Generator Settings Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          <Sliders size={20} />
          <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Übungs-Einstellungen</h4>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Subject Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                marginBottom: '0.5rem',
              }}
            >
              Fach auswählen
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['math', 'english', 'both'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: subjectFilter === sub ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: subjectFilter === sub ? '#EEF2FF' : '#F9FAFB',
                    color: subjectFilter === sub ? 'var(--primary)' : 'var(--text-color)',
                    fontWeight: subjectFilter === sub ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sub === 'math' ? 'Mathe' : sub === 'english' ? 'Englisch' : 'Beide'}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                marginBottom: '0.5rem',
              }}
            >
              Anzahl Aufgaben
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {([5, 10, 15, 20] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: questionCount === cnt ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: questionCount === cnt ? '#EEF2FF' : '#F9FAFB',
                    color: questionCount === cnt ? 'var(--primary)' : 'var(--text-color)',
                    fontWeight: questionCount === cnt ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Disable Switch */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                marginBottom: '0.5rem',
              }}
            >
              Timer-Option
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isTimerDisabled ? '#FEF3C7' : '#F9FAFB',
                border: isTimerDisabled ? '1px solid #FCD34D' : '1px solid var(--border)',
                fontSize: '0.88rem',
                color: 'var(--text-color)',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={isTimerDisabled}
                onChange={(e) => setIsTimerDisabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <Clock size={16} color={isTimerDisabled ? '#D97706' : 'var(--text-muted)'} />
              <span>Timer deaktivieren (entspanntes Üben)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Topic Selection & Level Prefill Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
              <BookOpen size={20} />
              <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Themenauswahl &amp; Ziel-Niveau</h4>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {selectedCount} von {displayedTopics.length} Themen ausgewählt für Klasse {gradeLevel}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Alle auswählen
            </button>
            <button
              type="button"
              onClick={handleSelectOnlyWeakness}
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FCD34D',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <AlertTriangle size={14} color="#D97706" />
              Nur Ausbaubedarf
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Alle abwählen
            </button>
          </div>
        </div>

        {/* Topic Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {displayedTopics.map((topic) => {
            return (
              <div
                key={topic.topicId}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: topic.selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: topic.selected ? '#F5F7FF' : '#FAFAFA',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: 'var(--text-color)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={topic.selected}
                      onChange={() => handleTopicToggle(topic.topicId)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span>{topic.topicName}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: topic.subject === 'math' ? '#2563EB' : '#7C3AED',
                        backgroundColor: topic.subject === 'math' ? '#DBEAFE' : '#EDE9FE',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {topic.subject === 'math' ? 'Mathe' : 'Eng'}
                    </span>
                  </label>

                  {/* Weakness / Accuracy Badge */}
                  {topic.isWeakSpot ? (
                    <span
                      title="Trefferquote unter 70% in bisherigen Tests"
                      style={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <AlertTriangle size={12} color="#D97706" />
                      Ausbaubedarf ({topic.accuracyPercentage}%)
                    </span>
                  ) : topic.accuracyPercentage !== undefined ? (
                    <span
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <CheckCircle2 size={12} color="#16A34A" />
                      Gefestigt ({topic.accuracyPercentage}%)
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        border: '1px solid #CBD5E1',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <HelpCircle size={12} />
                      Ungeprüft
                    </span>
                  )}
                </div>

                {/* Level Slider / Selector per Topic */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    paddingTop: '0.3rem',
                    borderTop: '1px dashed #E2E8F0',
                  }}
                >
                  <label
                    htmlFor={`level-select-${topic.topicId}`}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}
                  >
                    Ziel-Level:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="range"
                      min={1}
                      max={7}
                      value={topic.targetLevel}
                      onChange={(e) => handleLevelChange(topic.topicId, parseInt(e.target.value, 10))}
                      disabled={!topic.selected}
                      style={{ width: '90px', accentColor: 'var(--primary)', cursor: topic.selected ? 'pointer' : 'not-allowed' }}
                    />
                    <select
                      id={`level-select-${topic.topicId}`}
                      value={topic.targetLevel}
                      onChange={(e) => handleLevelChange(topic.topicId, parseInt(e.target.value, 10))}
                      disabled={!topic.selected}
                      style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        backgroundColor: topic.selected ? '#FFFFFF' : '#F1F5F9',
                        color: 'var(--text-color)',
                        cursor: topic.selected ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Stufe {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => onPrintWorksheet && onPrintWorksheet(currentConfig)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem' }}
        >
          <Printer size={18} />
          Arbeitsblatt drucken
        </button>

        <button
          type="button"
          onClick={() => onPrintSolution && onPrintSolution(currentConfig)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem' }}
        >
          <FileText size={18} />
          Lösungsblatt drucken
        </button>

        <button
          type="button"
          onClick={() => onStartPractice && onStartPractice(currentConfig)}
          className="btn btn-primary"
          disabled={selectedCount === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.4rem',
            fontWeight: 700,
            opacity: selectedCount === 0 ? 0.5 : 1,
            cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={18} />
          Übung starten ({questionCount} Aufgaben)
        </button>
      </div>
    </div>
  );
};

export default PracticeConfigView;
