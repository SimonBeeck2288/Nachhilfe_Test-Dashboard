import React, { useState, useEffect, useMemo } from 'react';
import type { PracticeSheet, PracticeGeneratorConfig, GeneratedExerciseItem } from '../types/practice';
import { generatePracticeSheet } from '../utils/practiceGenerator';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sliders,
  ArrowRight,
  Award,
  Sparkles,
} from 'lucide-react';
import { AiPromptModal } from './AiPromptModal';
import type { AiPromptContext, PromptMode } from '../utils/aiPromptGenerator';
import { getStudentRoster } from '../utils/studentRoster';
import { useTestSession } from '../context/TestSessionContext';

export interface PracticeSessionResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpentSeconds: number;
  topicBreakdown: Array<{
    topicName: string;
    subject: 'math' | 'english';
    correct: number;
    total: number;
    percentage: number;
  }>;
}

export interface PracticeSessionViewProps {
  sheet?: PracticeSheet;
  config?: PracticeGeneratorConfig;
  onFinishSession?: (results: PracticeSessionResults) => void;
  onBackToConfig?: () => void;
}

const OwlMascotIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="55" r="35" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
    <circle cx="36" cy="45" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
    <circle cx="64" cy="45" r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
    <circle cx="36" cy="45" r="5" fill="#1e293b" />
    <circle cx="64" cy="45" r="5" fill="#1e293b" />
    <circle cx="34" cy="43" r="2" fill="#ffffff" />
    <circle cx="62" cy="43" r="2" fill="#ffffff" />
    <polygon points="50,52 44,60 56,60" fill="#f59e0b" />
    <polygon points="50,10 80,22 50,34 20,22" fill="#1e293b" />
    <rect x="36" y="24" width="28" height="10" fill="#334155" />
  </svg>
);

export function checkAnswerCorrect(userAns: string, exercise: GeneratedExerciseItem): boolean {
  if (!userAns || !userAns.trim()) return false;

  const normUser = userAns.trim().toLowerCase().replace(/\s+/g, ' ');
  const normCorrect = exercise.correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');

  if (normUser === normCorrect) return true;

  // Numeric equivalence check (e.g. 5,0 vs 5.0 or 5)
  const numUser = parseFloat(normUser.replace(',', '.'));
  const numCorrect = parseFloat(normCorrect.replace(',', '.'));
  if (!isNaN(numUser) && !isNaN(numCorrect) && Math.abs(numUser - numCorrect) < 0.001) {
    return true;
  }

  // Fraction equivalence check (e.g. "2/4" vs "1/2" or "0,5" or "0.5")
  if (normUser.includes('/') && !isNaN(numCorrect)) {
    const [num, den] = normUser.split('/').map((s) => parseFloat(s.trim()));
    if (!isNaN(num) && !isNaN(den) && den !== 0 && Math.abs(num / den - numCorrect) < 0.001) {
      return true;
    }
  }

  return false;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const PracticeSessionView: React.FC<PracticeSessionViewProps> = ({
  sheet: initialSheet,
  config,
  onFinishSession,
  onBackToConfig,
}) => {
  // Generate active sheet if not directly provided
  const activeSheet = useMemo(() => {
    if (initialSheet && initialSheet.exercises.length > 0) {
      return initialSheet;
    }
    if (config) {
      return generatePracticeSheet(config);
    }
    // Fallback config if neither sheet nor config is provided
    return generatePracticeSheet({
      studentId: 'guest',
      subjectFilter: 'both',
      topics: [
        { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
        { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
      ],
      questionCount: 5,
      isTimerDisabled: false,
    });
  }, [initialSheet, config]);

  const exercises = activeSheet.exercises;
  const isTimerDisabled = activeSheet.config.isTimerDisabled;

  // Session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showMascotTip, setShowMascotTip] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // AI Tutor Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalContext, setAiModalContext] = useState<AiPromptContext>({ studentProfile: {} });
  const [aiModalMode, setAiModalMode] = useState<PromptMode>('socratic');

  let sessionStudent = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const session = useTestSession();
    sessionStudent = session?.currentStudent || session?.state?.currentStudent;
  } catch {
    // Component used outside TestSessionProvider context
  }

  const handleOpenAiModal = (mode: PromptMode = 'socratic') => {
    let activeStudent = sessionStudent;
    if (!activeStudent) {
      const roster = getStudentRoster();
      activeStudent = roster[0] || { name: 'Schüler', gradeLevel: 5 };
    }

    const currentAns = currentExercise.options ? selectedOption : customInput;
    setAiModalContext({
      studentProfile: activeStudent,
      questionContext: {
        subject: currentExercise.subject,
        topic: currentExercise.topicName,
        level: currentExercise.level,
        questionText: currentExercise.questionText,
        userAnswer: currentAns || userAnswers[currentExercise.id]?.answer || '',
        correctAnswer: currentExercise.correctAnswer,
        explanation: currentExercise.explanation,
      },
    });
    setAiModalMode(mode);
    setIsAiModalOpen(true);
  };

  // Active Timer Tick
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const currentExercise = exercises[currentIndex] || exercises[0];

  // Answer Submission Handler
  const handleSubmitAnswer = () => {
    if (isAnswerSubmitted) return;

    const answerToValidate = currentExercise.options ? selectedOption : customInput;
    if (!answerToValidate.trim()) return;

    const correct = checkAnswerCorrect(answerToValidate, currentExercise);
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);

    // Save answer record
    setUserAnswers((prev) => ({
      ...prev,
      [currentExercise.id]: {
        answer: answerToValidate,
        isCorrect: correct,
      },
    }));
  };

  // Next Question or Finish Handler
  const handleNextQuestion = () => {
    if (currentIndex < exercises.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption('');
      setCustomInput('');
      setIsAnswerSubmitted(false);
      setIsCorrect(null);
      setShowMascotTip(false);
    } else {
      setIsCompleted(true);
    }
  };

  // Restart Session Handler
  const handleRestartSession = () => {
    setCurrentIndex(0);
    setSelectedOption('');
    setCustomInput('');
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    setShowMascotTip(false);
    setUserAnswers({});
    setElapsedSeconds(0);
    setIsCompleted(false);
  };

  // Summary Metrics Computation
  const summaryResults: PracticeSessionResults = useMemo(() => {
    const totalQuestions = exercises.length;
    let correctAnswers = 0;
    const topicStats: Record<string, { subject: 'math' | 'english'; correct: number; total: number }> = {};

    exercises.forEach((ex) => {
      const ansRec = userAnswers[ex.id];
      const isAnsCorrect = ansRec?.isCorrect || false;
      if (isAnsCorrect) correctAnswers++;

      if (!topicStats[ex.topicName]) {
        topicStats[ex.topicName] = { subject: ex.subject, correct: 0, total: 0 };
      }
      topicStats[ex.topicName].total += 1;
      if (isAnsCorrect) {
        topicStats[ex.topicName].correct += 1;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const topicBreakdown = Object.entries(topicStats).map(([topicName, data]) => ({
      topicName,
      subject: data.subject,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    return {
      totalQuestions,
      correctAnswers,
      percentage,
      timeSpentSeconds: elapsedSeconds,
      topicBreakdown,
    };
  }, [exercises, userAnswers, elapsedSeconds]);

  // Trigger onFinishSession when complete
  useEffect(() => {
    if (isCompleted && onFinishSession) {
      onFinishSession(summaryResults);
    }
  }, [isCompleted, summaryResults, onFinishSession]);

  // Render Session Summary Screen
  if (isCompleted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: summaryResults.percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
              color: summaryResults.percentage >= 70 ? '#16A34A' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <Award size={40} />
          </div>

          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: 'var(--text-color)' }}>
            Übung abgeschlossen! 🎉
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 0 1.5rem 0' }}>
            Du hast alle {summaryResults.totalQuestions} Aufgaben bearbeitet. Hier ist deine Auswertung:
          </p>

          {/* Stats Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {/* Score */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                padding: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Gesamtergebnis
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                {summaryResults.correctAnswers} / {summaryResults.totalQuestions}
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: summaryResults.percentage >= 70 ? '#16A34A' : '#D97706',
                }}
              >
                ({summaryResults.percentage}%)
              </span>
            </div>

            {/* Time Spent */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                padding: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Benötigte Zeit
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', marginTop: '0.2rem' }}>
                {formatTime(summaryResults.timeSpentSeconds)}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isTimerDisabled ? 'Entspanntes Üben (Timer aus)' : 'Mit aktivem Timer'}
              </span>
            </div>

            {/* Performance Badge */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                padding: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Bewertung
              </span>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: summaryResults.percentage >= 80 ? '#15803D' : summaryResults.percentage >= 60 ? '#B45309' : '#DC2626',
                  marginTop: '0.4rem',
                }}
              >
                {summaryResults.percentage >= 80 ? 'Hervorragend!' : summaryResults.percentage >= 60 ? 'Gut gemacht!' : 'Weiter üben!'}
              </div>
            </div>
          </div>

          {/* Breakdown per Topic */}
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-color)' }}>
              Auswertung nach Themen
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {summaryResults.topicBreakdown.map((tb, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: tb.subject === 'math' ? '#2563EB' : '#7C3AED',
                        backgroundColor: tb.subject === 'math' ? '#DBEAFE' : '#EDE9FE',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {tb.subject === 'math' ? 'Mathe' : 'Eng'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-color)' }}>{tb.topicName}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {tb.correct} von {tb.total} richtig
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        backgroundColor: tb.percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                        color: tb.percentage >= 70 ? '#15803D' : '#92400E',
                      }}
                    >
                      {tb.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleRestartSession}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
            >
              <RotateCcw size={18} />
              Übung wiederholen
            </button>

            <button
              type="button"
              onClick={onBackToConfig}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              <Sliders size={18} />
              Neue Übung konfigurieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Interactive Solve View
  const progressPercent = Math.round(((currentIndex + 1) / exercises.length) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
      }}
    >
      {/* Top Header Card: Progress & Timer */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                backgroundColor: '#EEF2FF',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Aufgabe {currentIndex + 1} von {exercises.length}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: currentExercise.subject === 'math' ? '#2563EB' : '#7C3AED',
                backgroundColor: currentExercise.subject === 'math' ? '#DBEAFE' : '#EDE9FE',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {currentExercise.subject === 'math' ? 'Mathe' : 'Englisch'} • {currentExercise.topicName} (Stufe {currentExercise.level})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Timer Display */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: isTimerDisabled ? 'var(--text-muted)' : 'var(--primary)',
                backgroundColor: isTimerDisabled ? '#F1F5F9' : '#EEF2FF',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: isTimerDisabled ? '1px solid #CBD5E1' : '1px solid #C7D2FE',
              }}
            >
              <Clock size={16} />
              <span>{isTimerDisabled ? 'Timer: Deaktiviert' : formatTime(elapsedSeconds)}</span>
            </div>

            {onBackToConfig && (
              <button
                type="button"
                onClick={onBackToConfig}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#E2E8F0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Exercise Question Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Story Context if available */}
        {currentExercise.storyContext && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderLeft: '4px solid var(--primary)',
              padding: '0.75rem 1rem',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            📖 {currentExercise.storyContext}
          </div>
        )}

        {/* Question Text */}
        <div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-color)',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {currentExercise.questionText}
          </h3>
        </div>

        {/* Options / Input Form */}
        <div>
          {currentExercise.options && currentExercise.options.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {currentExercise.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                let optionBg = '#F9FAFB';
                let optionBorder = '1px solid var(--border)';
                let optionTextColor = 'var(--text-color)';

                if (isAnswerSubmitted) {
                  const isOptionCorrect = checkAnswerCorrect(option, currentExercise);
                  if (isOptionCorrect) {
                    optionBg = '#DCFCE7';
                    optionBorder = '2px solid #16A34A';
                    optionTextColor = '#14532D';
                  } else if (isSelected && !isCorrect) {
                    optionBg = '#FEE2E2';
                    optionBorder = '2px solid #DC2626';
                    optionTextColor = '#7F1D1D';
                  }
                } else if (isSelected) {
                  optionBg = '#EEF2FF';
                  optionBorder = '2px solid var(--primary)';
                  optionTextColor = 'var(--primary)';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(option)}
                    style={{
                      padding: '0.9rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      border: optionBorder,
                      backgroundColor: optionBg,
                      color: optionTextColor,
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.95rem',
                      textAlign: 'left',
                      cursor: isAnswerSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--primary)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ maxWidth: '400px' }}>
              <label
                htmlFor="exercise-custom-input"
                style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}
              >
                Deine Lösung:
              </label>
              <input
                id="exercise-custom-input"
                type="text"
                disabled={isAnswerSubmitted}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAnswerSubmitted && customInput.trim()) {
                    handleSubmitAnswer();
                  }
                }}
                placeholder="Ergebnis eingeben..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isAnswerSubmitted
                    ? isCorrect
                      ? '2px solid #16A34A'
                      : '2px solid #DC2626'
                    : '1px solid var(--border)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  outline: 'none',
                  backgroundColor: isAnswerSubmitted
                    ? isCorrect
                      ? '#F0FDF4'
                      : '#FEF2F2'
                    : '#FFFFFF',
                }}
              />
            </div>
          )}
        </div>

        {/* Mascot Tip Trigger & Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowMascotTip((prev) => !prev)}
            style={{
              backgroundColor: showMascotTip ? '#FEF3C7' : '#F8FAFC',
              border: showMascotTip ? '1px solid #FCD34D' : '1px solid var(--border)',
              color: showMascotTip ? '#92400E' : 'var(--text-color)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <OwlMascotIcon size={22} />
            <span>{showMascotTip ? 'Tipp ausblenden' : '🦉 Tipp von Eule anzeigen'}</span>
          </button>

          {!isAnswerSubmitted && (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={currentExercise.options ? !selectedOption : !customInput.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.6rem 1.4rem',
                fontWeight: 700,
                opacity: (currentExercise.options ? selectedOption : customInput.trim()) ? 1 : 0.5,
                cursor: (currentExercise.options ? selectedOption : customInput.trim()) ? 'pointer' : 'not-allowed',
              }}
            >
              <CheckCircle2 size={18} />
              Antwort überprüfen
            </button>
          )}
        </div>

        {/* Mascot Tip Panel */}
        {showMascotTip && (
          <div
            style={{
              backgroundColor: '#FEFCE8',
              border: '1px solid #FEF08A',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              marginTop: '0.25rem',
            }}
          >
            <OwlMascotIcon size={36} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#B45309', marginBottom: '0.2rem' }}>
                Eules Schlauer Tipp:
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#713F12', lineHeight: 1.4 }}>
                {currentExercise.mascotTip || 'Lies die Aufgabe genau durch und beachte die Einheiten.'}
              </p>
            </div>
          </div>
        )}

        {/* Submission Instant Feedback Banner */}
        {isAnswerSubmitted && (
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
              border: isCorrect ? '1px solid #86EFAC' : '1px solid #FECACA',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {isCorrect ? (
                <CheckCircle2 size={24} color="#16A34A" />
              ) : (
                <XCircle size={24} color="#DC2626" />
              )}
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: isCorrect ? '#15803D' : '#991B1B',
                }}
              >
                {isCorrect ? 'Richtig! Gut gemacht! 🎉' : 'Leider nicht ganz richtig.'}
              </h4>
            </div>

            {!isCorrect && (
              <div style={{ fontSize: '0.9rem', color: '#7F1D1D' }}>
                Richtige Antwort: <strong style={{ color: '#15803D' }}>{currentExercise.correctAnswer}</strong>
              </div>
            )}

            <div style={{ fontSize: '0.88rem', color: isCorrect ? '#14532D' : '#7F1D1D', lineHeight: 1.45 }}>
              💡 <strong>Erklärung:</strong> {currentExercise.explanation}
            </div>

            {/* Actions: AI Tutor Gem Launcher & Next Question Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleOpenAiModal(isCorrect ? 'personalized' : 'socratic')}
                data-testid="ki-tutor-banner-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={16} />
                <span>KI-Tutor Gem Hilfe</span>
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.3rem', fontWeight: 700 }}
              >
                <span>{currentIndex < exercises.length - 1 ? 'Nächste Aufgabe' : 'Ergebnis anzeigen'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Tutor Prompt Modal */}
      <AiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        context={aiModalContext}
        initialMode={aiModalMode}
      />
    </div>
  );
};

export default PracticeSessionView;
