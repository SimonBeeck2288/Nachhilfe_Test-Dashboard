import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import { useQuestionTimer } from '../hooks/useQuestionTimer';
import { getPastAskedQuestionIds } from '../utils/sessionHistory';
import { englishQuestions, type Question } from '../data/questions';
import { evaluateEnglishAnswer, calculateSoftScore } from '../utils/evaluation';
import { computeNextLevel, type Streak } from '../utils/adaptive';
import QuestionRenderer from '../components/QuestionRenderer';
import Timer from '../components/Timer';
import { Flame, Award, Pause, Play } from 'lucide-react';

const ModuleEnglish: React.FC = () => {
  const navigate = useNavigate();
  const { state, recordAnswer, updateEnglishLevel, togglePause, popLastAnswer } = useTestSession();

  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(state.englishLevel || 1);
  const [streak, setStreak] = useState<Streak>({ correct: 0, incorrect: 0 });
  const [askedIds, setAskedIds] = useState<Set<string>>(() => getPastAskedQuestionIds(state.studentId));
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  const [historyStack, setHistoryStack] = useState<{
    question: Question;
    level: number;
    streak: Streak;
    questionsAsked: number;
    userAnswer: string;
  }[]>([]);

  const moduleStartTime = useRef<number>(Date.now());
  const [moduleTimeUp, setModuleTimeUp] = useState(false);

  const maxDurationMins = state.customTestConfig?.maxDurationMinutes;
  const timeLimitMs = useMemo(() => {
    if (maxDurationMins === 0) return Infinity;
    if (typeof maxDurationMins === 'number' && maxDurationMins > 0) return maxDurationMins * 60 * 1000;
    return 5 * 60 * 1000;
  }, [maxDurationMins]);

  useEffect(() => {
    if (!isFinite(timeLimitMs) || state.isPaused) return;
    const interval = setInterval(() => {
      if (Date.now() - moduleStartTime.current >= timeLimitMs) {
        setModuleTimeUp(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLimitMs, state.isPaused]);

  useEffect(() => {
    if (!state.isPaused) return;
    const interval = setInterval(() => {
      moduleStartTime.current += 1000;
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPaused]);

  const nextQuestion = useMemo(() => {
    if (moduleTimeUp) return null;

    const config = state.customTestConfig;
    const topicModes = config?.topicModes || {};
    let pool = englishQuestions;

    pool = pool.filter((q) => topicModes[q.topic] !== 'off');

    if (config?.topics && config.topics.length > 0) {
      pool = pool.filter((q) => config.topics.includes(q.topic));
    }
    if (config?.questionTypes && config.questionTypes.length > 0) {
      pool = pool.filter((q) => config.questionTypes.includes(q.type));
    }

    let available = pool.filter((q) => q.level === currentLevel && !askedIds.has(q.id));

    const forcedAvailable = available.filter((q) => topicModes[q.topic] === 'forced');
    if (forcedAvailable.length > 0) {
      const randomIndex = Math.floor(Math.random() * forcedAvailable.length);
      return forcedAvailable[randomIndex];
    }

    if (available.length === 0) {
      available = pool.filter((q) => q.level === currentLevel);
    }

    // Pool Exhaustion Fallback: If all available questions in pool have been asked,
    // reset tracking for this pool so questions loop with random shuffle (spaced repetition)
    if (available.length === 0 && pool.length > 0) {
      available = pool;
    }

    if (available.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }, [currentLevel, askedIds, moduleTimeUp, state.customTestConfig]);

  const { elapsedTime, targetTime, isExceeded, resetTimer, stopTimer } = useQuestionTimer(
    nextQuestion?.timeLimit || 45,
    state.isPaused
  );

  useEffect(() => {
    if (nextQuestion && nextQuestion.id !== currentQuestion?.id) {
      setCurrentQuestion(nextQuestion);
      resetTimer(nextQuestion.timeLimit);
    } else if (!nextQuestion && askedIds.size > 0) {
      setCurrentQuestion(null);
    }
  }, [nextQuestion, currentQuestion, resetTimer, askedIds.size]);

  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion) return;

    stopTimer();

    setHistoryStack((prev) => [
      ...prev,
      {
        question: currentQuestion,
        level: currentLevel,
        streak,
        questionsAsked,
        userAnswer: answer,
      },
    ]);

    const isCorrect = evaluateEnglishAnswer(answer, currentQuestion.correctAnswer);
    const pointsEarned = calculateSoftScore(isCorrect, elapsedTime, targetTime);

    const isDirectMode = Boolean(state.accessibilitySettings?.directQuestions);
    const activeQuestionText = (isDirectMode && currentQuestion.directText) ? currentQuestion.directText : currentQuestion.text;

    recordAnswer({
      questionId: currentQuestion.id,
      topic: currentQuestion.topic,
      subject: 'english',
      isCorrect,
      timeTaken: elapsedTime,
      usedExtraTime: isExceeded,
      pointsEarned,
      difficultyLevel: currentLevel,
      questionText: activeQuestionText,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
    });

    setAskedIds((prev) => new Set(prev).add(currentQuestion.id));
    const updatedAsked = questionsAsked + 1;
    setQuestionsAsked(updatedAsked);

    const { level: newLevel, streak: newStreak } = computeNextLevel(currentLevel, isCorrect, streak);
    setCurrentLevel(newLevel);
    setStreak(newStreak);
    updateEnglishLevel(newLevel);

    if (moduleTimeUp || !nextQuestion) {
      navigate('/dashboard');
    }
  };

  const handleStepBack = () => {
    if (historyStack.length === 0) return;
    const lastItem = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    popLastAnswer('english');

    setAskedIds((prev) => {
      const next = new Set(prev);
      next.delete(lastItem.question.id);
      return next;
    });

    setCurrentQuestion(lastItem.question);
    setCurrentLevel(lastItem.level);
    setStreak(lastItem.streak);
    setQuestionsAsked(lastItem.questionsAsked);
    updateEnglishLevel(lastItem.level);
  };

  if (moduleTimeUp) {
    return (
      <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}>Alle Test-Module Abgeschlossen!</h2>
        <p>Super gemacht! Du hast alle Diagnose-Module erfolgreich abgeschlossen.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '2rem' }}
        >
          Weiter zu den Ergebnissen (Dashboard)
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}>Alle Test-Module Abgeschlossen!</h2>
        <p>Super gemacht! Du hast alle Diagnose-Module erfolgreich abgeschlossen.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '2rem' }}
        >
          Weiter zu den Ergebnissen (Dashboard)
        </button>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {/* PAUSE OVERLAY MODAL */}
      {state.isPaused && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '1rem',
              textAlign: 'center',
              maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Pause size={56} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--primary)', margin: '0 0 0.5rem' }}>Test Pausiert</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Verbleibender Pausenpool für diesen Testdurchlauf:
            </p>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '1rem 0' }}>
              {state.pausePoolSeconds} Sek.
            </div>
            <button className="btn btn-primary" onClick={togglePause} style={{ minWidth: '160px' }}>
              Test Fortsetzen
            </button>
          </div>
        </div>
      )}

      {/* STICKY MODULE HEADER */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--bg-card, #ffffff)',
          paddingTop: '0.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ color: 'var(--primary)', margin: 0 }}>Modul 3: Englisch</h2>
            {state.activeStreak > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #ffedd5',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <Flame size={16} color="#ea580c" />
                <span>Serie: {state.activeStreak}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.25rem 0.6rem',
                borderRadius: '1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <Award size={16} color="#d97706" />
              <span>{state.points} Pkt.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={togglePause}
              disabled={state.pausePoolSeconds <= 0 && !state.isPaused}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
            >
              {state.isPaused ? <Play size={15} /> : <Pause size={15} />}
              <span>{state.isPaused ? 'Fortsetzen' : `Pause (${state.pausePoolSeconds}s)`}</span>
            </button>
            <Timer elapsedTime={elapsedTime} targetTime={targetTime} />
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Frage {questionsAsked + 1} • Schwierigkeit: Level {currentLevel}
        </div>
      </div>

      <QuestionRenderer
        question={currentQuestion}
        onAnswerSubmit={handleAnswerSubmit}
        isExceeded={isExceeded}
        onStepBack={handleStepBack}
        canStepBack={historyStack.length > 0}
        initialAnswer={historyStack[historyStack.length - 1]?.question.id === currentQuestion.id ? historyStack[historyStack.length - 1]?.userAnswer : ''}
      />
    </div>
  );
};

export default ModuleEnglish;
