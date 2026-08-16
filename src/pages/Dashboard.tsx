import React, { useState, useEffect } from 'react';
import { useTestSession, type Subject, type AnswerRecord } from '../context/TestSessionContext';
import {
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  History,
  Eye,
  Trash2,
  Search,
  X,
  FileText,
  BarChart3,
  Sliders,
  User,
  Sparkles,
  Palette,
  Award,
  Bookmark,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSessionHistory, deleteSessionRecord } from '../utils/sessionHistory';
import { getStudentRoster } from '../utils/studentRoster';
import type { TestSessionRecord } from '../types/history';
import type { StudentProfile } from '../types/student';
import ProgressionChart from '../components/ProgressionChart';
import TopicAccuracyChart from '../components/TopicAccuracyChart';
import CognitionTrendChart from '../components/CognitionTrendChart';
import DiagnosticReportPrint from '../components/DiagnosticReportPrint';
import { StudentAvatar } from '../components/StudentAvatar';
import { AvatarCustomizerModal } from '../components/AvatarCustomizerModal';
import { AchievementBadgeGrid } from '../components/AchievementBadgeGrid';
import { AiPromptModal } from '../components/AiPromptModal';
import type { AiPromptContext, PromptMode } from '../utils/aiPromptGenerator';

interface TopicItem {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTime: number;
  records: AnswerRecord[];
}

const TopicAccordionList: React.FC<{
  subject: Subject;
  topics: TopicItem[];
  expandedTopics: Record<string, boolean>;
  onToggle: (key: string) => void;
  markedQuestionIds?: string[];
  onOpenAiModalTopic?: (topic: TopicItem, subject: Subject) => void;
  onOpenAiModalQuestion?: (rec: AnswerRecord, topicName: string, subject: Subject) => void;
}> = ({
  subject,
  topics,
  expandedTopics,
  onToggle,
  markedQuestionIds = [],
  onOpenAiModalTopic,
  onOpenAiModalQuestion,
}) => {
  if (topics.length === 0) return null;

  return (
    <div>
      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-color)' }}>
        Stärken & Schwächen (Klick für Details)
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {topics.map((t) => {
          const topicKey = `${subject}-${t.topic}`;
          const isExpanded = !!expandedTopics[topicKey];

          return (
            <div
              key={t.topic}
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              {/* Accordion Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: isExpanded ? '#F1F5F9' : 'white',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggle(topicKey)}
                  aria-expanded={isExpanded}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    flex: 1,
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp size={18} color="var(--primary)" />
                  ) : (
                    <ChevronDown size={18} color="var(--text-muted)" />
                  )}
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                    {t.topic}
                  </span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {onOpenAiModalTopic && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAiModalTopic(t, subject);
                      }}
                      title="KI-Tutor Gem Hilfestellung & Übungsaufgaben generieren"
                      data-testid={`ki-tutor-topic-btn-${t.topic}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
                      }}
                    >
                      <Sparkles size={13} />
                      <span>KI-Tutor Gem</span>
                    </button>
                  )}

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: t.accuracy >= 0.7 ? 'var(--success)' : t.accuracy >= 0.5 ? 'var(--warning)' : 'var(--danger)',
                      }}
                    >
                      {Math.round(t.accuracy * 100)}% ({t.correct}/{t.total})
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Ø {t.avgTime.toFixed(1)}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border)',
                    backgroundColor: '#FAFBFD',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {t.records.map((rec, index) => (
                      <div
                        key={rec.questionId || index}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: `4px solid ${rec.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.92rem' }}>
                            {rec.isCorrect ? (
                              <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                            ) : (
                              <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ color: 'var(--text-color)' }}>
                              {rec.questionText || `Frage ID: ${rec.questionId}`}
                            </span>
                            {rec.questionId && markedQuestionIds.includes(rec.questionId) && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                <Bookmark size={12} fill="#f59e0b" color="#b45309" /> Gemerkt
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                            <Clock size={14} />
                            <span>{rec.timeTaken.toFixed(1)}s {rec.usedExtraTime ? '(+30s Extra)' : ''}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '0.85rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            marginTop: '0.4rem',
                            backgroundColor: '#F8FAFC',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '4px',
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Schülerantwort
                            </span>
                            <span style={{ fontWeight: 600, color: rec.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                              {rec.userAnswer !== undefined && rec.userAnswer !== '' ? rec.userAnswer : '(Keine Antwort)'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Musterlösung
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>
                              {rec.correctAnswer || '-'}
                            </span>
                          </div>
                        </div>

                        {/* KI-Tutor Gem launcher for specific question */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px dashed #E2E8F0' }}>
                          {onOpenAiModalQuestion && (
                            <button
                              type="button"
                              onClick={() => onOpenAiModalQuestion(rec, t.topic, subject)}
                              data-testid={`ki-tutor-question-btn-${rec.questionId || index}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                backgroundColor: rec.isCorrect ? '#EFF6FF' : '#FEF2F2',
                                color: rec.isCorrect ? '#2563EB' : '#DC2626',
                                border: rec.isCorrect ? '1px solid #BFDBFE' : '1px solid #FECACA',
                                borderRadius: '6px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Sparkles size={13} />
                              <span>KI-Tutor Gem Hilfe</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { state, clearSession, saveSessionToHistory } = useTestSession();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'analytics'>('current');
  const [showPrintView, setShowPrintView] = useState(false);
  const [printableRecord, setPrintableRecord] = useState<TestSessionRecord | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Roster & Analytics Selection State
  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [analyticsStudentId, setAnalyticsStudentId] = useState<string>('all');

  // History State
  const [historyList, setHistoryList] = useState<TestSessionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingSession, setReviewingSession] = useState<TestSessionRecord | null>(null);

  // AI Prompt Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalContext, setAiModalContext] = useState<AiPromptContext>({ studentProfile: {} });
  const [aiModalMode, setAiModalMode] = useState<PromptMode>('socratic');

  // Auto-save current test session on mount if answers exist
  useEffect(() => {
    if (state.answers.length > 0 && !state.isSavedToHistory) {
      saveSessionToHistory();
    }
  }, [state.answers.length, state.isSavedToHistory, saveSessionToHistory]);

  // Load History list & Roster
  useEffect(() => {
    loadHistory();
    const studentList = getStudentRoster();
    setRoster(studentList);
    if (state.currentStudent && state.currentStudent.id) {
      setAnalyticsStudentId(state.currentStudent.id);
    }
  }, [activeTab, state.currentStudent]);

  const loadHistory = () => {
    const list = getSessionHistory();
    setHistoryList(list);
  };

  const toggleTopic = (topicKey: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
  };

  const getStats = (subject: Subject) => {
    const answers = state.answers.filter((a) => a.subject === subject);
    if (answers.length === 0) return null;

    const correct = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;
    const avgTime = answers.reduce((acc, curr) => acc + curr.timeTaken, 0) / total;

    return { correct, total, avgTime, answers };
  };

  const getTopicStats = (answers: AnswerRecord[]): TopicItem[] => {
    const topics: Record<string, { correct: number; total: number; time: number; records: AnswerRecord[] }> = {};
    answers.forEach((a) => {
      if (!a.topic) return;
      if (!topics[a.topic]) topics[a.topic] = { correct: 0, total: 0, time: 0, records: [] };
      topics[a.topic].total += 1;
      if (a.isCorrect) topics[a.topic].correct += 1;
      topics[a.topic].time += a.timeTaken;
      topics[a.topic].records.push(a);
    });
    return Object.entries(topics)
      .map(([topic, data]) => ({
        topic,
        correct: data.correct,
        total: data.total,
        accuracy: data.correct / data.total,
        avgTime: data.time / data.total,
        records: data.records,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  };

  const mathStats = getStats('math');
  const englishStats = getStats('english');
  const cogStats = getStats('cognition');

  const mathTopics = mathStats ? getTopicStats(mathStats.answers) : [];
  const englishTopics = englishStats ? getTopicStats(englishStats.answers) : [];

  const handleOpenAiModalTopic = (topicItem: TopicItem, subj: Subject) => {
    const activeStudent = state.currentStudent || getStudentRoster()[0] || { name: state.studentName || 'Schüler', gradeLevel: 5 };
    const allT = mathTopics.concat(englishTopics);
    setAiModalContext({
      studentProfile: activeStudent,
      performanceData: {
        strengths: allT.filter((t) => t.accuracy >= 0.7).map((t) => t.topic),
        weaknesses: allT.filter((t) => t.accuracy < 0.7).map((t) => t.topic),
        gradeLevel: activeStudent.gradeLevel || 5,
        topicAccuracy: {
          [topicItem.topic]: Math.round(topicItem.accuracy * 100),
        },
      },
      questionContext: {
        subject: subj === 'warmup' ? 'math' : (subj as 'math' | 'english'),
        topic: topicItem.topic,
        level: subj === 'math' ? state.mathLevel : state.englishLevel,
      },
    });
    setAiModalMode(topicItem.accuracy < 0.7 ? 'practice_tasks' : 'personalized');
    setIsAiModalOpen(true);
  };

  const handleOpenAiModalQuestion = (rec: AnswerRecord, topicName?: string, subj?: Subject) => {
    const activeStudent = state.currentStudent || getStudentRoster()[0] || { name: state.studentName || 'Schüler', gradeLevel: 5 };
    const corrAns = Array.isArray(rec.correctAnswer) ? rec.correctAnswer.join(', ') : (rec.correctAnswer || '');
    const actualSubj = (subj || rec.subject) === 'warmup' ? 'math' : ((subj || rec.subject) as 'math' | 'english');
    setAiModalContext({
      studentProfile: activeStudent,
      questionContext: {
        subject: actualSubj,
        topic: rec.topic || topicName || 'Allgemein',
        level: rec.difficultyLevel || (actualSubj === 'math' ? state.mathLevel : state.englishLevel),
        questionText: rec.questionText || `Aufgabe ${rec.questionId}`,
        userAnswer: rec.userAnswer || '',
        correctAnswer: corrAns,
      },
    });
    setAiModalMode(rec.isCorrect ? 'personalized' : 'socratic');
    setIsAiModalOpen(true);
  };

  let interpretation = 'Nicht genug Daten für eine Interpretation.';
  if (mathStats && englishStats && cogStats) {
    const mathAccuracy = mathStats.correct / mathStats.total;
    const engAccuracy = englishStats.correct / englishStats.total;
    const cogAccuracy = cogStats.correct / cogStats.total;
    const avgReactionTime = cogStats.answers.reduce((acc, curr) => acc + (curr.reactionTime || 0), 0) / cogStats.total;

    if (cogAccuracy < 0.7 || avgReactionTime > 2000) {
      if (mathAccuracy < 0.6 || engAccuracy < 0.6) {
        interpretation =
          '⚠️ Der Kognitionstest zeigt langsame Reaktionszeiten oder Flüchtigkeitsfehler. Die fachlichen Lücken könnten teilweise durch eine Überlastung der Aufmerksamkeit oder des Arbeitsgedächtnisses bedingt sein.';
      } else {
        interpretation =
          'Der Schüler hat gutes Fachwissen, zeigt aber im Kognitionstest leichte Konzentrationsschwächen. Kürzere Lernintervalle könnten helfen.';
      }
    } else {
      if (mathAccuracy < 0.6 || engAccuracy < 0.6) {
        interpretation =
          '📘 Der Schüler zeigt eine schnelle und präzise Auffassungsgabe (guter Kognitionstest), hat jedoch fachliche Defizite. Es handelt sich wahrscheinlich um reine Wissenslücken, die gezielt aufgearbeitet werden können.';
      } else {
        interpretation =
          '🌟 Sehr gutes Ergebnis! Sowohl kognitiv als auch fachlich stark. Der Schüler benötigt vermutlich nur Unterstützung bei komplexeren Themen.';
      }
    }
  }

  const handleRestart = () => {
    if (window.confirm('Möchtest du wirklich einen neuen Test starten? Das aktuelle Schülerprofil bleibt erhalten.')) {
      clearSession();
      navigate('/');
    }
  };

  const handlePrint = (rec?: TestSessionRecord) => {
    setPrintableRecord(rec || null);
    setShowPrintView(true);
  };

  const handleDeleteHistoryItem = (sessionId: string, name: string) => {
    if (window.confirm(`Möchtest du die Testergebnis-Aufzeichnung von "${name}" unwiderruflich löschen?`)) {
      deleteSessionRecord(sessionId);
      loadHistory();
    }
  };

  const filteredHistory = historyList.filter(
    (item) =>
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('current')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileText size={18} />
            Aktuelle Auswertung ({state.studentName || 'Gast'})
          </button>
          <button
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <BarChart3 size={18} />
            Lernfortschritt & Analysen
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <History size={18} />
            Session History Manager ({historyList.length})
          </button>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/configurator')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Sliders size={16} />
          Custom Test Konfigurieren
        </button>
      </div>

      {/* TAB 1: CURRENT TEST EVALUATION */}
      {activeTab === 'current' && (
        <>
          {showPrintView ? (
            <DiagnosticReportPrint
              sessionRecord={printableRecord || undefined}
              onClose={() => {
                setShowPrintView(false);
                setPrintableRecord(null);
              }}
            />
          ) : (
            <>
              {/* STUDENT AVATAR & GAMIFICATION PROFILE BAR */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-color, #f8fafc)',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <StudentAvatar
                    config={state.avatarConfig}
                    size={90}
                    onClick={() => setIsAvatarModalOpen(true)}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {state.studentName || 'Schüler/in'}
                      </h2>
                      {(state.accessibilitySettings?.directQuestions || state.accessibilitySettings?.reducedSensory) && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            border: '1px solid #BAE6FD',
                          }}
                          title="Direkt & Reizarm Modus [D/R]"
                        >
                          [D/R]
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '1rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        <Award size={16} color="#d97706" />
                        <span>{state.points || 0} Punkte</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Badges: <strong>{state.unlockedBadges?.length || 0} / 6</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsAvatarModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Palette size={18} color="#3b82f6" />
                    Avatar Anpassen
                  </button>
                  <button className="btn btn-primary" onClick={() => handlePrint()}>
                    <Printer size={20} />
                    Diagnosebericht als PDF / Drucken
                  </button>
                  <button className="btn btn-secondary" onClick={handleRestart}>
                    <RotateCcw size={20} />
                    Neuer Test
                  </button>
                </div>
              </div>

              {/* ACHIEVEMENTS & BADGES SHOWCASE */}
              <div
                style={{
                  backgroundColor: 'var(--bg-color, #f8fafc)',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Sparkles size={20} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                    Erreichte Badges & Erfolge
                  </h3>
                </div>
                <AchievementBadgeGrid unlockedBadgeIds={state.unlockedBadges} />
              </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* WARM-UP & SELBSTEINSCHÄTZUNG */}
            <div style={{ gridColumn: '1 / -1', padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Warm-up & Selbsteinschätzung
              </h3>
              {state.motivation !== undefined || state.favoriteSubject || state.problemSubject ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ backgroundColor: 'white', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Tagesmotivation
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {state.motivation !== undefined ? (
                        <>
                          <span>{'★'.repeat(state.motivation)}{'☆'.repeat(5 - state.motivation)}</span>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>({state.motivation}/5)</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Keine Angabe</span>
                      )}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'white', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Lieblingsfach
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: state.favoriteSubject ? 'var(--text-color)' : 'var(--text-muted)' }}>
                      {state.favoriteSubject && state.favoriteSubject.trim() ? state.favoriteSubject : 'Keine Angabe'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'white', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Problemfach
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: state.problemSubject ? 'var(--text-color)' : 'var(--text-muted)' }}>
                      {state.problemSubject && state.problemSubject.trim() ? state.problemSubject : 'Keine Angabe'}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Keine Warm-up-Daten ausgefüllt.</p>
              )}
            </div>

            {/* MATH */}
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Mathematik</h3>
              {mathStats ? (
                <div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: 0 }}>
                    <li><strong>Erreichtes Level:</strong> {state.mathLevel} / 7</li>
                    <li><strong>Richtige Antworten:</strong> {mathStats.correct} von {mathStats.total}</li>
                    <li><strong>Ø Antwortzeit gesamt:</strong> {mathStats.avgTime.toFixed(1)}s</li>
                  </ul>
                  <TopicAccordionList
                    subject="math"
                    topics={mathTopics}
                    expandedTopics={expandedTopics}
                    onToggle={toggleTopic}
                    markedQuestionIds={state.markedQuestionIds}
                    onOpenAiModalTopic={handleOpenAiModalTopic}
                    onOpenAiModalQuestion={handleOpenAiModalQuestion}
                  />
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Keine Daten für Mathematik.</p>
              )}
            </div>

            {/* ENGLISH */}
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Englisch</h3>
              {englishStats ? (
                <div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: 0 }}>
                    <li><strong>Erreichtes Level:</strong> {state.englishLevel} / 7</li>
                    <li><strong>Richtige Antworten:</strong> {englishStats.correct} von {englishStats.total}</li>
                    <li><strong>Ø Antwortzeit gesamt:</strong> {englishStats.avgTime.toFixed(1)}s</li>
                  </ul>
                  <TopicAccordionList
                    subject="english"
                    topics={englishTopics}
                    expandedTopics={expandedTopics}
                    onToggle={toggleTopic}
                    markedQuestionIds={state.markedQuestionIds}
                    onOpenAiModalTopic={handleOpenAiModalTopic}
                    onOpenAiModalQuestion={handleOpenAiModalQuestion}
                  />
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Keine Daten für Englisch.</p>
              )}
            </div>

            {/* COGNITION */}
            <div style={{ gridColumn: '1 / -1', padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Kognition (Stroop-Test)</h3>
              {cogStats ? (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px', padding: 0 }}>
                    <li><strong>Richtige Antworten:</strong> {cogStats.correct} von {cogStats.total}</li>
                    <li><strong>Genauigkeit:</strong> {Math.round((cogStats.correct / cogStats.total) * 100)}%</li>
                    <li><strong>Ø Reaktionszeit:</strong> {(cogStats.answers.reduce((a, c) => a + (c.reactionTime || 0), 0) / cogStats.total).toFixed(0)} ms</li>
                  </ul>
                  <div style={{ flex: 2, minWidth: '280px', backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Interpretation</h4>
                    <p style={{ lineHeight: 1.6 }}>{interpretation}</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Keine Kognitionsdaten.</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )}

      {/* TAB 2: SESSION HISTORY MANAGER */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem' }}>
                Session History Manager
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                Vergangene Testergebnisse einsehen, überprüfen oder veraltete Durchläufe löschen.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F1F5F9', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Schüler oder Fach suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={16} color="var(--text-muted)" />
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <History size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Keine gespeicherten Test-Sessions gefunden</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {searchTerm ? 'Keine Ergebnisse für deinen Suchbegriff.' : 'Sobald ein Schüler einen Test absolviert, werden die Ergebnisse hier dauerhaft archiviert.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Datum & Uhrzeit</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Schüler</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Test / Fach</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Erreichte Level</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Ergebnis / Score</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((rec) => {
                    const dateFormatted = new Date(rec.date).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const percentage = rec.totalQuestions > 0 ? Math.round((rec.score / rec.totalQuestions) * 100) : 0;

                    return (
                      <tr key={rec.sessionId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                          {dateFormatted}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          {rec.studentName}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{rec.subject}</span>
                            {(rec.accessibilitySettings?.directQuestions || rec.accessibilitySettings?.reducedSensory) && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: '#E0F2FE',
                                  color: '#0369A1',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  border: '1px solid #BAE6FD',
                                }}
                                title="Direkt & Reizarm Modus [D/R]"
                              >
                                [D/R]
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, marginRight: '0.4rem' }}>
                            Mathe Lvl {rec.mathLevelReached}
                          </span>
                          <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>
                            Eng Lvl {rec.englishLevelReached}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          {rec.score} / {rec.totalQuestions} ({percentage}%)
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                              onClick={() => handlePrint(rec)}
                              title="Diagnosebericht drucken / PDF exportieren"
                            >
                              <Printer size={16} />
                              PDF
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                              onClick={() => setReviewingSession(rec)}
                              title="Details / Review ansehen"
                            >
                              <Eye size={16} />
                              Review
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: '#FECACA' }}
                              onClick={() => handleDeleteHistoryItem(rec.sessionId, rec.studentName)}
                              title="Session löschen"
                            >
                              <Trash2 size={16} />
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROGRESS ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header & Student Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={22} color="var(--primary)" />
                Interaktive Schüler-Analysen
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Wähle ein Schülerprofil aus, um dessen historische Stufenkurve, Themen-Genauigkeit und Kognitions-Trends zu analysieren.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--text-muted)" />
              <select
                className="input"
                value={analyticsStudentId}
                onChange={(e) => setAnalyticsStudentId(e.target.value)}
                style={{ maxWidth: '280px', fontWeight: 600 }}
              >
                <option value="all">-- Alle Schüler (Gesamtübersicht) --</option>
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Klasse {s.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render 3 SVG Analytics Charts */}
          {(() => {
            const selectedSessions = analyticsStudentId === 'all'
              ? historyList
              : historyList.filter((s) => s.studentId === analyticsStudentId);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Stufen-Entwicklung über die Zeit */}
                <ProgressionChart sessions={selectedSessions} />

                {/* 2. Themen-Genauigkeit breakdown */}
                <TopicAccuracyChart sessions={selectedSessions} />

                {/* 3. Kognitions-Reaktionsgeschwindigkeit Trend */}
                <CognitionTrendChart sessions={selectedSessions} />
              </div>
            );
          })()}
        </div>
      )}

      {/* SESSION DRILLDOWN REVIEW MODAL */}
      {reviewingSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card fade-in"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--primary)', margin: 0 }}>
                    Test-Review: {reviewingSession.studentName}
                  </h2>
                  {(reviewingSession.accessibilitySettings?.directQuestions || reviewingSession.accessibilitySettings?.reducedSensory) && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid #BAE6FD',
                      }}
                      title="Direkt & Reizarm Modus [D/R]"
                    >
                      [D/R] Direkt & Reizarm
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Absolviert am: {new Date(reviewingSession.date).toLocaleString('de-DE')}
                </span>
              </div>
              <button
                onClick={() => setReviewingSession(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Summary Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Gesamtergebnis</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {reviewingSession.score} / {reviewingSession.totalQuestions} ({reviewingSession.totalQuestions > 0 ? Math.round((reviewingSession.score / reviewingSession.totalQuestions) * 100) : 0}%)
                </span>
              </div>
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Mathe Level</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Level {reviewingSession.mathLevelReached} / 7</span>
              </div>
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Englisch Level</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Level {reviewingSession.englishLevelReached} / 7</span>
              </div>
              {reviewingSession.cognitionStats && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Kognition Ø Zeit</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{reviewingSession.cognitionStats.avgReactionTime.toFixed(0)} ms</span>
                </div>
              )}
            </div>

            {/* Answer Drilldown List */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-color)' }}>
              Detaillierte Antwortliste ({reviewingSession.answers.length} Fragen)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {reviewingSession.answers.map((ans, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `4px solid ${ans.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                    backgroundColor: '#FAFBFD',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      [{ans.subject.toUpperCase()}] {ans.questionText || `Frage ${idx + 1}`}
                      {ans.questionId && (reviewingSession.markedQuestionIds || []).includes(ans.questionId) && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <Bookmark size={12} fill="#f59e0b" color="#b45309" /> Gemerkt
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ans.timeTaken.toFixed(1)}s
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                      <span>
                        Antwort: <strong style={{ color: ans.isCorrect ? 'var(--success)' : 'var(--danger)' }}>{ans.userAnswer || '(Keine)'}</strong>
                      </span>
                      <span>
                        Musterlösung: <strong>{ans.correctAnswer || '-'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAiModalQuestion(ans, ans.topic, ans.subject)}
                      data-testid={`ki-tutor-review-btn-${idx}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: ans.isCorrect ? '#EFF6FF' : '#FEF2F2',
                        color: ans.isCorrect ? '#2563EB' : '#DC2626',
                        border: ans.isCorrect ? '1px solid #BFDBFE' : '1px solid #FECACA',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={13} />
                      <span>KI-Tutor Gem Hilfe</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReviewingSession(null)}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR CUSTOMIZER MODAL */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      {/* AI TUTOR PROMPT MODAL */}
      <AiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        context={aiModalContext}
        initialMode={aiModalMode}
      />
    </div>
  );
};

export default Dashboard;
