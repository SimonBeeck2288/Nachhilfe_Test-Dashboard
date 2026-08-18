import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import { getStudentRoster, updateStudentProfile } from '../utils/studentRoster';
import type { StudentProfile } from '../types/student';
import { DIRECT_REDUCED_SENSORY_SETTINGS } from '../types/student';
import { AB_TWIN_PAIRS, saveAbTestSession, getSavedAbTestSessions } from '../data/abTestPairs';
import type {
  AbTwinPair,
  AbTwinQuestion,
  AbQuestionResult,
  AbPairResult,
  AbTestSummary,
  AbTestSessionRecord,
  AttentionAnalysis,
} from '../types/abTest';
import { evaluateMathAnswer, evaluateEnglishAnswer } from '../utils/evaluation';
import { shuffleArray } from '../utils/shuffle';
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Compass,
  Activity,
} from 'lucide-react';

export const AbTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, selectStudent, startSession } = useTestSession();

  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(state.currentStudent?.id || null);
  const [guestName, setGuestName] = useState<string>(state.studentName || '');

  // Setup options
  const [subjectChoice, setSubjectChoice] = useState<'math' | 'english' | 'all'>('math');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [testPhase, setTestPhase] = useState<'intro' | 'testing' | 'results'>('intro');

  // Test execution state
  const [testQuestions, setTestQuestions] = useState<{ pair: AbTwinPair; question: AbTwinQuestion }[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [answeredList, setAnsweredList] = useState<AbQuestionResult[]>([]);
  const [elapsedQuestionTime, setElapsedQuestionTime] = useState<number>(0);
  const [remainingTestSeconds, setRemainingTestSeconds] = useState<number>(300);
  const [testStartTimestamp, setTestStartTimestamp] = useState<number>(Date.now());

  // Results state
  const [sessionRecord, setSessionRecord] = useState<AbTestSessionRecord | null>(null);
  const [isProfileUpdated, setIsProfileUpdated] = useState<boolean>(false);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});

  const questionTimerRef = useRef<number | null>(null);
  const testCountdownRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load roster
  useEffect(() => {
    const list = getStudentRoster();
    setRoster(list);
    if (list.length > 0 && !selectedStudentId) {
      setSelectedStudentId(list[0].id);
    }
  }, [selectedStudentId]);

  // Handle URL params for direct jump to latest results
  useEffect(() => {
    if (searchParams.get('results') === 'latest') {
      const saved = getSavedAbTestSessions();
      if (saved.length > 0) {
        setSessionRecord(saved[0]);
        setTestPhase('results');
      }
    }
  }, [searchParams]);

  // Overall Test Countdown Timer
  useEffect(() => {
    if (testPhase !== 'testing') return;

    testCountdownRef.current = window.setInterval(() => {
      setRemainingTestSeconds((prev) => {
        if (prev <= 1) {
          if (testCountdownRef.current) clearInterval(testCountdownRef.current);
          finishTest(answeredList);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (testCountdownRef.current) clearInterval(testCountdownRef.current);
    };
  }, [testPhase, answeredList]);

  // Per-Question Timer
  useEffect(() => {
    if (testPhase !== 'testing') return;

    setElapsedQuestionTime(0);
    questionTimerRef.current = window.setInterval(() => {
      setElapsedQuestionTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [currentIndex, testPhase]);

  // Focus input on question change
  useEffect(() => {
    if (testPhase === 'testing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, testPhase]);

  const activeQuestionItem = testQuestions[currentIndex];
  const activeQuestion = activeQuestionItem?.question;

  // Shuffled multiple choice options
  const shuffledOptions = useMemo(() => {
    if (activeQuestion?.type === 'multiple-choice' && activeQuestion.options) {
      return shuffleArray(activeQuestion.options);
    }
    return [];
  }, [activeQuestion]);

  const buildQuestionSequence = (subject: 'math' | 'english' | 'all') => {
    let eligiblePairs = AB_TWIN_PAIRS.filter((p) => {
      if (subject === 'all') return true;
      return p.subject === subject;
    });

    if (eligiblePairs.length === 0) eligiblePairs = AB_TWIN_PAIRS;

    // Shuffle pairs
    const shuffledPairs = shuffleArray([...eligiblePairs]);

    // Create spaced blocks so twins are separated by multiple questions
    const standardQuestions = shuffledPairs.map((pair) => ({ pair, question: pair.standard }));
    const directQuestions = shuffledPairs.map((pair) => ({ pair, question: pair.direct }));

    // Interleave with alternating order and spacing
    const sequence: { pair: AbTwinPair; question: AbTwinQuestion }[] = [];
    const maxLen = Math.max(standardQuestions.length, directQuestions.length);

    for (let i = 0; i < maxLen; i++) {
      if (i % 2 === 0) {
        if (standardQuestions[i]) sequence.push(standardQuestions[i]);
        if (directQuestions[(i + 2) % directQuestions.length]) {
          sequence.push(directQuestions[(i + 2) % directQuestions.length]);
        }
      } else {
        if (directQuestions[i]) sequence.push(directQuestions[i]);
        if (standardQuestions[(i + 2) % standardQuestions.length]) {
          sequence.push(standardQuestions[(i + 2) % standardQuestions.length]);
        }
      }
    }

    // Duplicate list if needed for longer tests
    return [...sequence, ...shuffleArray(sequence)];
  };

  const handleStartTest = () => {
    const studentObj = roster.find((s) => s.id === selectedStudentId) || null;
    const finalName = studentObj ? studentObj.name : guestName.trim() || 'Schüler/in';

    if (studentObj) {
      selectStudent(studentObj);
      startSession(studentObj);
    } else {
      selectStudent(null);
      startSession(finalName);
    }

    const sequence = buildQuestionSequence(subjectChoice);

    setTestQuestions(sequence);
    setCurrentIndex(0);
    setAnsweredList([]);
    setInputValue('');
    setRemainingTestSeconds(durationMinutes * 60);
    setTestStartTimestamp(Date.now());
    setTestPhase('testing');
  };

  const handleAnswerSubmit = (userAnswer: string) => {
    if (!activeQuestion) return;

    const timeTaken = Math.max(1, elapsedQuestionTime);
    const isMath = activeQuestionItem.pair.subject === 'math';
    const isCorrect = isMath
      ? evaluateMathAnswer(userAnswer, activeQuestion.correctAnswer)
      : evaluateEnglishAnswer(userAnswer, activeQuestion.correctAnswer);

    const result: AbQuestionResult = {
      questionId: activeQuestion.id,
      pairId: activeQuestionItem.pair.pairId,
      topic: activeQuestionItem.pair.topic,
      subject: activeQuestionItem.pair.subject,
      variant: activeQuestion.variant,
      text: activeQuestion.text,
      userAnswer,
      correctAnswer: activeQuestion.correctAnswer,
      isCorrect,
      timeTaken,
      answeredAtTimestamp: Date.now(),
    };

    const nextList = [...answeredList, result];
    setAnsweredList(nextList);
    setInputValue('');

    const nextIdx = currentIndex + 1;
    if (nextIdx < testQuestions.length) {
      setCurrentIndex(nextIdx);
    } else {
      // Loop with more questions if time remains
      const more = buildQuestionSequence(subjectChoice);
      setTestQuestions([...testQuestions, ...more]);
      setCurrentIndex(nextIdx);
    }
  };

  const handleFinishEarly = () => {
    if (answeredList.length < 2) {
      alert('Bitte beantworte mindestens 2 Aufgaben, um einen aussagekräftigen Vergleich zu sehen.');
      return;
    }
    finishTest(answeredList);
  };

  const finishTest = (finalAnsweredList: AbQuestionResult[]) => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    if (testCountdownRef.current) clearInterval(testCountdownRef.current);

    const allStandard = finalAnsweredList.filter((a) => a.variant === 'standard');
    const allDirect = finalAnsweredList.filter((a) => a.variant === 'direct');

    const stdTotal = allStandard.length;
    const stdCorrect = allStandard.filter((a) => a.isCorrect).length;
    const stdAcc = stdTotal > 0 ? stdCorrect / stdTotal : 0;
    const stdAvgTime = stdTotal > 0 ? allStandard.reduce((s, a) => s + a.timeTaken, 0) / stdTotal : 0;

    const dirTotal = allDirect.length;
    const dirCorrect = allDirect.filter((a) => a.isCorrect).length;
    const dirAcc = dirTotal > 0 ? dirCorrect / dirTotal : 0;
    const dirAvgTime = dirTotal > 0 ? allDirect.reduce((s, a) => s + a.timeTaken, 0) / dirTotal : 0;

    const accGainPercent = Math.round((dirAcc - stdAcc) * 1000) / 10;
    const speedupSec = Math.round((stdAvgTime - dirAvgTime) * 10) / 10;
    const speedupPercent = stdAvgTime > 0 ? Math.round(((stdAvgTime - dirAvgTime) / stdAvgTime) * 1000) / 10 : 0;

    // --- ATTENTION SPAN & FATIGUE ANALYSIS ---
    let attentionAnalysis: AttentionAnalysis | undefined = undefined;
    if (finalAnsweredList.length >= 4) {
      const halfIndex = Math.floor(finalAnsweredList.length / 2);
      const firstHalf = finalAnsweredList.slice(0, halfIndex);
      const secondHalf = finalAnsweredList.slice(halfIndex);

      const firstHalfCorrect = firstHalf.filter((a) => a.isCorrect).length;
      const firstHalfAcc = firstHalfCorrect / firstHalf.length;
      const firstHalfAvgT = firstHalf.reduce((s, a) => s + a.timeTaken, 0) / firstHalf.length;

      const secondHalfCorrect = secondHalf.filter((a) => a.isCorrect).length;
      const secondHalfAcc = secondHalfCorrect / secondHalf.length;
      const secondHalfAvgT = secondHalf.reduce((s, a) => s + a.timeTaken, 0) / secondHalf.length;

      const deltaAccPercent = Math.round((secondHalfAcc - firstHalfAcc) * 100);

      let textFatigueObservation = 'Die Konzentration und Lösungsgeschwindigkeit blieben über den gesamten Testverlauf stabil.';
      if (deltaAccPercent <= -15) {
        textFatigueObservation = `In der zweiten Testhälfte ließ die Genauigkeit spürbar nach (${deltaAccPercent}% Trefferquote). Kürzere, direkte Aufgaben können helfen, die Konzentration länger aufrechtzuerhalten.`;
      } else if (secondHalfAvgT > firstHalfAvgT + 3) {
        textFatigueObservation = 'Gegen Ende des Tests stieg die Bearbeitungszeit pro Aufgabe merklich an (Ermüdungszeichen bei langen Texten).';
      }

      attentionAnalysis = {
        firstHalfAccuracy: firstHalfAcc,
        firstHalfAvgTime: firstHalfAvgT,
        secondHalfAccuracy: secondHalfAcc,
        secondHalfAvgTime: secondHalfAvgT,
        accuracyDeltaPercent: deltaAccPercent,
        textFatigueObservation,
      };
    }

    // Pair Results mapping
    const pairMap: Record<string, { standard?: AbQuestionResult; direct?: AbQuestionResult; pair: AbTwinPair }> = {};
    AB_TWIN_PAIRS.forEach((p) => {
      pairMap[p.pairId] = { pair: p };
    });

    finalAnsweredList.forEach((ans) => {
      if (pairMap[ans.pairId]) {
        if (ans.variant === 'standard') pairMap[ans.pairId].standard = ans;
        else pairMap[ans.pairId].direct = ans;
      }
    });

    const pairResults: AbPairResult[] = [];
    Object.values(pairMap).forEach(({ pair, standard, direct }) => {
      if (standard || direct) {
        pairResults.push({
          pairId: pair.pairId,
          topic: pair.topic,
          subject: pair.subject,
          level: pair.level,
          conceptDescription: pair.conceptDescription,
          standard,
          direct,
        });
      }
    });

    // Determine practical verdict
    let verdict: 'recommend_direct' | 'recommend_standard' | 'neutral' = 'neutral';
    let verdictTitle = 'Beide Aufgabenformate funktionieren gut';
    let verdictDescription = 'Die Trefferquote und Bearbeitungszeit waren bei Textaufgaben und direkten Formeln ähnlich.';

    if (accGainPercent >= 10 || (speedupSec >= 2.5 && accGainPercent >= -5)) {
      verdict = 'recommend_direct';
      verdictTitle = '💡 Direkte Aufgabenstellungen funktionieren deutlich besser';
      verdictDescription = `Mit kurzen, direkten Aufgabenstellungen erzielte ${state.currentStudent?.name || guestName || 'der Schüler'} ${accGainPercent > 0 ? `+${accGainPercent}% höhere Treffergenauigkeit` : 'eine hohe Genauigkeit'} und sparte durchschnittlich ${Math.max(1, speedupSec)}s pro Aufgabe. Ohne Text-Ballast fällt das Lösen leichter.`;
    } else if (accGainPercent <= -10 || speedupSec <= -3) {
      verdict = 'recommend_standard';
      verdictTitle = 'Ausführliche Textaufgaben funktionieren gut';
      verdictDescription = 'Die Einbettung in Geschichten und Sachzusammenhänge hilft beim Verstehen der Aufgabenstellung.';
    }

    const summary: AbTestSummary = {
      standardTotal: stdTotal,
      standardCorrect: stdCorrect,
      standardAccuracy: stdAcc,
      standardAvgTime: stdAvgTime,
      directTotal: dirTotal,
      directCorrect: dirCorrect,
      directAccuracy: dirAcc,
      directAvgTime: dirAvgTime,
      accuracyGainPercent: accGainPercent,
      speedupSeconds: speedupSec,
      speedupPercent,
      attentionAnalysis,
      verdict,
      verdictTitle,
      verdictDescription,
    };

    const actualDurationSec = Math.round((Date.now() - testStartTimestamp) / 1000);

    const record: AbTestSessionRecord = {
      id: `ab_session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      studentId: state.currentStudent?.id || selectedStudentId || undefined,
      studentName: state.currentStudent?.name || guestName.trim() || 'Schüler/in',
      durationMinutes,
      actualDurationSeconds: actualDurationSec,
      subject: subjectChoice,
      pairResults,
      summary,
    };

    saveAbTestSession(record);
    setSessionRecord(record);
    setTestPhase('results');
  };

  const handleActivateDirectMode = () => {
    const studentId = sessionRecord?.studentId || state.currentStudent?.id || selectedStudentId;
    if (studentId) {
      updateStudentProfile(studentId, {
        accessibilitySettings: DIRECT_REDUCED_SENSORY_SETTINGS,
      });
      setIsProfileUpdated(true);
    } else {
      setIsProfileUpdated(true);
    }
  };

  const togglePairExpand = (pairId: string) => {
    setExpandedPairs((prev) => ({
      ...prev,
      [pairId]: !prev[pairId],
    }));
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER: INTRO SCREEN ---
  if (testPhase === 'intro') {
    return (
      <div className="card fade-in" style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '1rem',
              backgroundColor: '#EDE9FE',
              marginBottom: '1rem',
            }}
          >
            <Zap size={36} color="#7C3AED" />
          </div>
          <h1 style={{ fontSize: '1.85rem', color: '#5B21B6', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
            ⚡ Aufgaben-Check: Textaufgaben vs. Direkte Aufgaben
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#4B5563', maxWidth: '650px', margin: '0 auto', lineHeight: '1.55' }}>
            Finde heraus, mit welchem Aufgabenstil dein Schüler am besten lernt: <strong>Ausführliche Textaufgaben</strong> oder <strong>kurze, direkte Aufgabenstellungen</strong> ohne Schnickschnack.
          </p>
        </div>

        {/* How it works banner */}
        <div
          style={{
            backgroundColor: '#F5F3FF',
            border: '2px solid #DDD6FE',
            borderRadius: '0.85rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#6D28D9', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} color="#7C3AED" /> So funktioniert der Aufgaben-Check:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem', color: '#4C1D95' }}>
            <div>
              <strong>1. Durchmischte Aufgaben:</strong> Gleiche Themen werden abwechselnd als Textaufgabe und als kurze Formel gestellt.
            </div>
            <div>
              <strong>2. Volle Testzeit (5–10 Min):</strong> Der Test läuft über die gewählte Zeit und analysiert auch die Konzentration.
            </div>
            <div>
              <strong>3. Sofortiger Praxis-Tipp:</strong> Du erfährst, welches Format dem Schüler mehr Sicherheit & Tempo gibt.
            </div>
          </div>
        </div>

        {/* Configuration Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Student Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              1. Schüler auswählen:
            </label>
            {roster.length > 0 ? (
              <select
                className="input"
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ padding: '0.65rem' }}
              >
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Klasse {s.gradeLevel})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input"
                placeholder="Schüler-Name eingeben"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            )}
          </div>

          {/* Subject Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              2. Fachbereich:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {(
                [
                  { id: 'math', label: 'Mathematik', desc: 'Textaufgaben vs. Formeln' },
                  { id: 'english', label: 'Englisch', desc: 'Lange Fragen vs. Direkt' },
                  { id: 'all', label: 'Gemischt', desc: 'Mathe & Englisch kombiniert' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubjectChoice(sub.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${subjectChoice === sub.id ? '#7C3AED' : '#E5E7EB'}`,
                    backgroundColor: subjectChoice === sub.id ? '#F5F3FF' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, color: subjectChoice === sub.id ? '#6D28D9' : '#1F2937' }}>
                    {sub.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.2rem' }}>
                    {sub.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Duration */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              3. Testdauer:
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[5, 7.5, 10].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${durationMinutes === mins ? '#7C3AED' : '#E5E7EB'}`,
                    backgroundColor: durationMinutes === mins ? '#7C3AED' : '#FFFFFF',
                    color: durationMinutes === mins ? '#FFFFFF' : '#374151',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {mins} Minuten
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          className="btn"
          onClick={handleStartTest}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            fontWeight: 800,
            justifyContent: 'center',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Play size={22} />
          Aufgaben-Check jetzt starten
        </button>
      </div>
    );
  }

  // --- RENDER: ACTIVE TEST SCREEN ---
  if (testPhase === 'testing' && activeQuestion) {
    const isDirect = activeQuestion.variant === 'direct';

    return (
      <div className="card fade-in" style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem' }}>
        {/* Top bar with full test countdown & early finish */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                backgroundColor: isDirect ? '#DCFCE7' : '#EFF6FF',
                color: isDirect ? '#15803D' : '#1D4ED8',
                border: `1px solid ${isDirect ? '#86EFAC' : '#BFDBFE'}`,
              }}
            >
              {isDirect ? '⚡ Direkte Aufgabe' : '📖 Textaufgabe'}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
              Aufgabe #{answeredList.length + 1}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: remainingTestSeconds < 60 ? '#FEE2E2' : '#F1F5F9',
                color: remainingTestSeconds < 60 ? '#B91C1C' : '#334155',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              <Clock size={16} />
              <span>Verbleibende Zeit: {formatCountdown(remainingTestSeconds)}</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleFinishEarly}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              title="Test vorzeitig beenden und auswerten"
            >
              Test beenden & Auswerten
            </button>
          </div>
        </div>

        {/* Question Container */}
        <div
          style={{
            backgroundColor: isDirect ? '#FAFDFB' : '#FFFFFF',
            border: `2px solid ${isDirect ? '#86EFAC' : '#E2E8F0'}`,
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Story context box ONLY in standard mode */}
          {!isDirect && activeQuestion.storyContext && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderLeft: '4px solid #3B82F6',
                padding: '1rem 1.25rem',
                borderRadius: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Compass size={15} /> Sachaufgabe / Kontext
              </div>
              <div style={{ fontSize: '0.98rem', color: '#1E3A8A', lineHeight: '1.5' }}>
                {activeQuestion.storyContext}
              </div>
            </div>
          )}

          {/* Main Question Text */}
          <div
            style={{
              fontSize: isDirect ? '1.4rem' : '1.18rem',
              fontWeight: isDirect ? 700 : 600,
              color: '#1E293B',
              lineHeight: '1.5',
              fontFamily: isDirect ? 'monospace, sans-serif' : 'inherit',
            }}
          >
            {activeQuestion.text}
          </div>
        </div>

        {/* Answer Inputs */}
        {activeQuestion.type === 'multiple-choice' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {shuffledOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAnswerSubmit(opt)}
                style={{
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                  borderRadius: '0.75rem',
                  backgroundColor: '#F8FAFC',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) handleAnswerSubmit(inputValue.trim());
            }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <input
              ref={inputRef}
              type="text"
              className="input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Deine Antwort eingeben..."
              style={{ fontSize: '1.15rem', padding: '0.85rem 1rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim()}
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700 }}
            >
              Antworten <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    );
  }

  // --- RENDER: DEDICATED RESULTS SCREEN ---
  if (testPhase === 'results' && sessionRecord) {
    const { summary, pairResults, studentName, actualDurationSeconds } = sessionRecord;
    const isDirectWinner = summary.verdict === 'recommend_direct';

    return (
      <div className="card fade-in" style={{ maxWidth: '950px', margin: '0 auto', padding: '2rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ergebnis • Aufgaben-Check ({Math.round(actualDurationSeconds / 60)} Min. Testzeit)
            </span>
            <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.75rem', color: '#1E293B', fontWeight: 800 }}>
              Auswertung für {studentName}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Printer size={16} /> Drucken / PDF
            </button>
            <button className="btn btn-secondary" onClick={() => setTestPhase('intro')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RotateCcw size={16} /> Neuer Test
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <LayoutDashboard size={16} /> Zum Dashboard
            </button>
          </div>
        </div>

        {/* HERO VERDICT BANNER */}
        <div
          style={{
            backgroundColor: isDirectWinner ? '#ECFDF5' : '#EFF6FF',
            border: `2px solid ${isDirectWinner ? '#86EFAC' : '#BFDBFE'}`,
            borderRadius: '1rem',
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: isDirectWinner ? '#10B981' : '#3B82F6',
                color: '#FFF',
                borderRadius: '50%',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.35rem', fontWeight: 800, color: isDirectWinner ? '#065F46' : '#1E40AF' }}>
                {summary.verdictTitle}
              </h2>
              <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: isDirectWinner ? '#047857' : '#1E3A8A', lineHeight: '1.5' }}>
                {summary.verdictDescription}
              </p>

              {/* 1-Click Activate Button */}
              {isDirectWinner && (
                <div>
                  {isProfileUpdated ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#065F46', fontWeight: 700, backgroundColor: '#D1FAE5', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                      <CheckCircle2 size={18} color="#059669" />
                      Direkte Aufgabenstellungen dauerhaft für {studentName} aktiviert ✓
                    </div>
                  ) : (
                    <button
                      className="btn"
                      onClick={handleActivateDirectMode}
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        padding: '0.65rem 1.25rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                      }}
                    >
                      <Sparkles size={18} />
                      Direkte Aufgabenstellungen für {studentName} aktivieren
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ATTENTION SPAN & FATIGUE INSIGHT CARD */}
        {summary.attentionAnalysis && (
          <div
            style={{
              backgroundColor: '#FAF5FF',
              border: '2px solid #E9D5FF',
              borderRadius: '1rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Activity size={20} color="#7C3AED" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#6B21A8' }}>
                🧠 Konzentrations- & Ausdauer-Verlauf über die Testzeit
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #E9D5FF' }}>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>1. Testhälfte (Startphase):</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginTop: '0.2rem' }}>
                  {Math.round(summary.attentionAnalysis.firstHalfAccuracy * 100)}% Trefferquote
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Ø {summary.attentionAnalysis.firstHalfAvgTime.toFixed(1)}s pro Aufgabe
                </span>
              </div>

              <div style={{ backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #E9D5FF' }}>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>2. Testhälfte (Ausdauerphase):</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginTop: '0.2rem' }}>
                  {Math.round(summary.attentionAnalysis.secondHalfAccuracy * 100)}% Trefferquote
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Ø {summary.attentionAnalysis.secondHalfAvgTime.toFixed(1)}s pro Aufgabe
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', color: '#581C87', lineHeight: '1.45' }}>
              <strong>Beobachtung:</strong> {summary.attentionAnalysis.textFatigueObservation}
            </p>
          </div>
        )}

        {/* SIDE BY SIDE SUMMARY CARDS */}
        <h3 style={{ fontSize: '1.15rem', color: '#1E293B', marginBottom: '1rem', fontWeight: 800 }}>
          📊 Gegenüberstellung der beiden Aufgabenstile:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Standard Card */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#F8FAFC',
              border: '2px solid #E2E8F0',
              borderRadius: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#475569' }}>
                Ausführliche Textaufgaben
              </div>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#E2E8F0', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                {summary.standardTotal} Aufgaben
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: '#FFF', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Target size={15} /> Trefferquote
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginTop: '0.25rem' }}>
                  {Math.round(summary.standardAccuracy * 100)}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {summary.standardCorrect} von {summary.standardTotal} richtig
                </span>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={15} /> Ø Lösungszeit
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginTop: '0.25rem' }}>
                  {summary.standardAvgTime.toFixed(1)}s
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  pro Aufgabe
                </span>
              </div>
            </div>
          </div>

          {/* Direct Card */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#F0FDF4',
              border: '2px solid #86EFAC',
              borderRadius: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#166534' }}>
                Direkte & kurze Aufgaben
              </div>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                {summary.directTotal} Aufgaben
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: '#FFF', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Target size={15} /> Trefferquote
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', marginTop: '0.25rem' }}>
                  {Math.round(summary.directAccuracy * 100)}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  {summary.directCorrect} von {summary.directTotal} richtig
                </span>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={15} /> Ø Lösungszeit
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532D', marginTop: '0.25rem' }}>
                  {summary.directAvgTime.toFixed(1)}s
                </div>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  pro Aufgabe
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION-BY-QUESTION COMPARISON */}
        <h3 style={{ fontSize: '1.15rem', color: '#1E293B', marginBottom: '1rem', fontWeight: 800 }}>
          📋 Frage-für-Frage Gegenüberstellung:
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
          {pairResults.map((pr, idx) => {
            const isExpanded = expandedPairs[pr.pairId] ?? false;

            return (
              <div
                key={pr.pairId}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => togglePairExpand(pr.pairId)}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: '#6366F1' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{pr.topic}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>({pr.conceptDescription})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Status badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                      {pr.standard && (
                        <span style={{ color: pr.standard.isCorrect ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          Textaufgabe: {pr.standard.isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />} ({pr.standard.timeTaken}s)
                        </span>
                      )}
                      {pr.direct && (
                        <span style={{ color: pr.direct.isCorrect ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}>
                          Direkt: {pr.direct.isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />} ({pr.direct.timeTaken}s)
                        </span>
                      )}
                    </div>

                    {isExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Standard details */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                        Ausführliche Textaufgabe:
                      </div>
                      {pr.standard ? (
                        <>
                          <p style={{ fontSize: '0.9rem', color: '#1E293B', margin: '0 0 0.75rem 0', fontStyle: 'italic' }}>
                            "{pr.standard.text}"
                          </p>
                          <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div>Antwort: <strong>{pr.standard.userAnswer || 'Keine'}</strong> {pr.standard.isCorrect ? '✅' : '❌'}</div>
                            <div>Lösungszeit: <strong>{pr.standard.timeTaken} Sekunden</strong></div>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Im Test nicht beantwortet</span>
                      )}
                    </div>

                    {/* Direct details */}
                    <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem' }}>
                        Direkte Aufgabe:
                      </div>
                      {pr.direct ? (
                        <>
                          <p style={{ fontSize: '0.95rem', color: '#14532D', margin: '0 0 0.75rem 0', fontWeight: 600, fontFamily: 'monospace' }}>
                            {pr.direct.text}
                          </p>
                          <div style={{ fontSize: '0.82rem', color: '#166534', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div>Antwort: <strong>{pr.direct.userAnswer || 'Keine'}</strong> {pr.direct.isCorrect ? '✅' : '❌'}</div>
                            <div>Lösungszeit: <strong>{pr.direct.timeTaken} Sekunden</strong></div>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Im Test nicht beantwortet</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default AbTestPage;
