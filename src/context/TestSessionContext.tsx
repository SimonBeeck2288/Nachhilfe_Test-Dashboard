/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord, TopicBreakdownItem, CognitionStatsRecord } from '../types/history';
import type { CustomTestConfig } from '../types/config';
import type { AvatarConfig } from '../types/gamification';
import { saveSessionRecord } from '../utils/sessionHistory';
import { saveStudentProfile, updateStudentProfile } from '../utils/studentRoster';

export type Subject = 'math' | 'english' | 'cognition' | 'warmup';

export interface AnswerRecord {
  questionId: string;
  topic: string;
  subject: Subject;
  isCorrect: boolean;
  timeTaken: number;
  usedExtraTime: boolean;
  pointsEarned?: number;
  difficultyLevel?: number;
  reactionTime?: number;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string | string[];
}

export interface TestSessionState {
  currentStudent: StudentProfile | null;
  studentName: string;
  studentId?: string;
  sessionId?: string;
  answers: AnswerRecord[];
  mathLevel: number;
  englishLevel: number;
  mathTheta?: number;
  englishTheta?: number;
  motivation?: number;
  favoriteSubject?: string;
  problemSubject?: string;
  stroopCalibratedLevel?: number;
  recommendedTimeMultiplier?: number;
  isSavedToHistory?: boolean;
  customTestConfig?: CustomTestConfig | null;
  avatarConfig: AvatarConfig;
  unlockedAccessories: string[];
  activeStreak: number;
  points: number;
  unlockedBadges: string[];
  pausePoolSeconds: number;
  isPaused: boolean;
  markedQuestionIds: string[];
}

export interface TestSessionContextType {
  state: TestSessionState;
  currentStudent: StudentProfile | null;
  customTestConfig?: CustomTestConfig | null;
  selectStudent: (student: StudentProfile | null) => void;
  saveCurrentStudentProfile: (profile: Partial<StudentProfile>) => void;
  startSession: (nameOrStudent: string | StudentProfile) => void;
  recordAnswer: (answer: AnswerRecord) => void;
  updateMathLevel: (newLevel: number, theta?: number) => void;
  updateEnglishLevel: (newLevel: number, theta?: number) => void;
  setMathLevel: (newLevel: number, theta?: number) => void;
  setEnglishLevel: (newLevel: number, theta?: number) => void;
  setStroopCalibration: (calibratedLevel: number, timeMultiplier: number) => void;
  setWarmupData: (data: { motivation: number; favoriteSubject: string; problemSubject: string }) => void;
  setCustomTestConfig: (config: CustomTestConfig | null) => void;
  updateAvatarConfig: (config: AvatarConfig) => void;
  unlockAccessory: (accessoryId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addPoints: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
  togglePause: () => void;
  setIsPaused: (paused: boolean) => void;
  decrementPausePool: () => void;
  resetPausePool: () => void;
  toggleBookmarkQuestion: (questionId: string) => void;
  popLastAnswer: (subject: Subject) => AnswerRecord | null;
  finishTest: () => void;
  clearSession: () => void;
  saveSessionToHistory: () => TestSessionRecord | null;
}

const initialState: TestSessionState = {
  currentStudent: null,
  studentName: '',
  studentId: '',
  sessionId: '',
  answers: [],
  mathLevel: 1,
  englishLevel: 1,
  mathTheta: -3.0,
  englishTheta: -3.0,
  stroopCalibratedLevel: 1,
  recommendedTimeMultiplier: 1.0,
  isSavedToHistory: false,
  avatarConfig: { hatId: 'none', petId: 'none', themeId: 'default' },
  unlockedAccessories: ['none_hat', 'none_pet', 'default'],
  activeStreak: 0,
  points: 0,
  unlockedBadges: [],
  pausePoolSeconds: 90,
  isPaused: false,
  markedQuestionIds: [],
};

const TestSessionContext = createContext<TestSessionContextType | undefined>(undefined);

export const TestSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TestSessionState>(() => {
    try {
      const saved = localStorage.getItem('diagnosticSession');
      return saved ? JSON.parse(saved) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('diagnosticSession', JSON.stringify(state));
    } catch (err) {
      console.error('Failed to serialize diagnosticSession state:', err);
    }
  }, [state]);

  useEffect(() => {
    if (!state.isPaused) return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.pausePoolSeconds <= 1) {
          return { ...prev, pausePoolSeconds: 0, isPaused: false };
        }
        return { ...prev, pausePoolSeconds: prev.pausePoolSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPaused]);

  const selectStudent = (student: StudentProfile | null) => {
    if (!student) {
      setState(initialState);
      return;
    }
    const startingLvl = state.customTestConfig?.startingLevel || 1;
    const initialTheta = startingLvl - 4;
    setState((prev) => ({
      ...initialState,
      currentStudent: student,
      studentName: student.name,
      studentId: student.id,
      favoriteSubject: student.favoriteSubject || '',
      problemSubject: student.problemSubject || '',
      customTestConfig: prev.customTestConfig,
      mathLevel: startingLvl,
      englishLevel: startingLvl,
      mathTheta: initialTheta,
      englishTheta: initialTheta,
      answers: [],
      activeStreak: 0,
      points: 0,
      unlockedBadges: [],
      unlockedAccessories: initialState.unlockedAccessories,
      avatarConfig: initialState.avatarConfig,
    }));
  };

  const saveCurrentStudentProfile = (updates: Partial<StudentProfile>) => {
    if (!state.currentStudent) {
      if (updates.name) {
        const created = saveStudentProfile({
          name: updates.name,
          gradeLevel: updates.gradeLevel || 5,
          favoriteSubject: updates.favoriteSubject || '',
          problemSubject: updates.problemSubject || '',
          notes: updates.notes || '',
        });
        setState((prev) => ({
          ...prev,
          currentStudent: created,
          studentName: created.name,
          studentId: created.id,
        }));
      }
      return;
    }

    const updated = updateStudentProfile(state.currentStudent.id, updates);
    if (updated) {
      setState((prev) => ({
        ...prev,
        currentStudent: updated,
        studentName: updated.name,
      }));
    }
  };

  const setCustomTestConfig = (config: CustomTestConfig | null) => {
    setState((prev) => ({
      ...prev,
      customTestConfig: config,
      mathLevel: config?.startingLevel || prev.mathLevel,
      englishLevel: config?.startingLevel || prev.englishLevel,
      mathTheta: (config?.startingLevel || prev.mathLevel) - 4,
      englishTheta: (config?.startingLevel || prev.englishLevel) - 4,
    }));
  };

  const startSession = (nameOrStudent: string | StudentProfile) => {
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startingLvl = state.customTestConfig?.startingLevel || 1;
    const initialTheta = startingLvl - 4;

    if (typeof nameOrStudent === 'string') {
      const studentMatch = state.currentStudent?.name === nameOrStudent ? state.currentStudent : null;
      setState({
        ...initialState,
        sessionId: newSessionId,
        studentName: nameOrStudent,
        currentStudent: studentMatch,
        studentId: studentMatch ? studentMatch.id : 'guest',
        favoriteSubject: studentMatch?.favoriteSubject || '',
        problemSubject: studentMatch?.problemSubject || '',
        customTestConfig: state.customTestConfig,
        mathLevel: startingLvl,
        englishLevel: startingLvl,
        mathTheta: initialTheta,
        englishTheta: initialTheta,
        answers: [],
        activeStreak: 0,
        points: 0,
        unlockedBadges: [],
        unlockedAccessories: initialState.unlockedAccessories,
        avatarConfig: initialState.avatarConfig,
      });
    } else {
      setState({
        ...initialState,
        sessionId: newSessionId,
        currentStudent: nameOrStudent,
        studentName: nameOrStudent.name,
        studentId: nameOrStudent.id,
        favoriteSubject: nameOrStudent.favoriteSubject || '',
        problemSubject: nameOrStudent.problemSubject || '',
        customTestConfig: state.customTestConfig,
        mathLevel: startingLvl,
        englishLevel: startingLvl,
        mathTheta: initialTheta,
        englishTheta: initialTheta,
        answers: [],
        activeStreak: 0,
        points: 0,
        unlockedBadges: [],
        unlockedAccessories: initialState.unlockedAccessories,
        avatarConfig: initialState.avatarConfig,
      });
    }
  };

  const recordAnswer = (answer: AnswerRecord) => {
    setState((prev) => {
      const pointsEarned = answer.pointsEarned !== undefined ? answer.pointsEarned : (answer.isCorrect ? 100 : 0);
      const newPoints = (prev.points || 0) + pointsEarned;
      const newStreak = answer.isCorrect ? (prev.activeStreak || 0) + 1 : 0;
      const newUnlockedBadges = [...(prev.unlockedBadges || [])];

      // Automatic badge checking
      if (!newUnlockedBadges.includes('first_step')) {
        newUnlockedBadges.push('first_step');
      }

      if (answer.isCorrect && answer.subject === 'math') {
        const mathCorrect = prev.answers.filter((a) => a.subject === 'math' && a.isCorrect).length + 1;
        if (mathCorrect >= 5 && !newUnlockedBadges.includes('math_whiz')) {
          newUnlockedBadges.push('math_whiz');
        }
      }

      if (answer.isCorrect && answer.subject === 'english') {
        const englishCorrect = prev.answers.filter((a) => a.subject === 'english' && a.isCorrect).length + 1;
        if (englishCorrect >= 5 && !newUnlockedBadges.includes('vocab_master')) {
          newUnlockedBadges.push('vocab_master');
        }
      }

      if (answer.subject === 'cognition' && !newUnlockedBadges.includes('fast_thinker')) {
        newUnlockedBadges.push('fast_thinker');
      }

      if (newStreak >= 3 && !newUnlockedBadges.includes('streak_master')) {
        newUnlockedBadges.push('streak_master');
      }

      if (newPoints >= 300 && !newUnlockedBadges.includes('star_student')) {
        newUnlockedBadges.push('star_student');
      }

      return {
        ...prev,
        answers: [...prev.answers, { ...answer, pointsEarned }],
        points: newPoints,
        activeStreak: newStreak,
        unlockedBadges: newUnlockedBadges,
      };
    });
  };

  const updateAvatarConfig = (config: AvatarConfig) => {
    setState((prev) => ({
      ...prev,
      avatarConfig: config,
    }));
  };

  const unlockAccessory = (accessoryId: string) => {
    setState((prev) => ({
      ...prev,
      unlockedAccessories: prev.unlockedAccessories?.includes(accessoryId)
        ? prev.unlockedAccessories
        : [...(prev.unlockedAccessories || []), accessoryId],
    }));
  };

  const incrementStreak = () => {
    setState((prev) => ({ ...prev, activeStreak: (prev.activeStreak || 0) + 1 }));
  };

  const resetStreak = () => {
    setState((prev) => ({ ...prev, activeStreak: 0 }));
  };

  const addPoints = (amount: number) => {
    setState((prev) => ({ ...prev, points: (prev.points || 0) + amount }));
  };

  const unlockBadge = (badgeId: string) => {
    setState((prev) => ({
      ...prev,
      unlockedBadges: prev.unlockedBadges?.includes(badgeId)
        ? prev.unlockedBadges
        : [...(prev.unlockedBadges || []), badgeId],
    }));
  };

  const updateMathLevel = (newLevel: number, theta?: number) => {
    setState((prev) => ({
      ...prev,
      mathLevel: newLevel,
      mathTheta: theta !== undefined ? theta : newLevel - 4,
    }));
  };

  const updateEnglishLevel = (newLevel: number, theta?: number) => {
    setState((prev) => ({
      ...prev,
      englishLevel: newLevel,
      englishTheta: theta !== undefined ? theta : newLevel - 4,
    }));
  };

  const setMathLevel = (newLevel: number, theta?: number) => {
    setState((prev) => ({
      ...prev,
      mathLevel: newLevel,
      mathTheta: theta !== undefined ? theta : newLevel - 4,
    }));
  };

  const setEnglishLevel = (newLevel: number, theta?: number) => {
    setState((prev) => ({
      ...prev,
      englishLevel: newLevel,
      englishTheta: theta !== undefined ? theta : newLevel - 4,
    }));
  };

  const setStroopCalibration = (calibratedLevel: number, timeMultiplier: number) => {
    const calibratedTheta = calibratedLevel - 4;
    setState((prev) => ({
      ...prev,
      stroopCalibratedLevel: calibratedLevel,
      recommendedTimeMultiplier: timeMultiplier,
      mathLevel: calibratedLevel,
      englishLevel: calibratedLevel,
      mathTheta: calibratedTheta,
      englishTheta: calibratedTheta,
    }));
  };

  const setWarmupData = (data: { motivation: number; favoriteSubject: string; problemSubject: string }) => {
    setState((prev) => ({
      ...prev,
      motivation: data.motivation,
      favoriteSubject: data.favoriteSubject,
      problemSubject: data.problemSubject,
    }));
  };

  const togglePause = () => {
    setState((prev) => {
      if (!prev.isPaused && prev.pausePoolSeconds <= 0) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  };

  const setIsPaused = (paused: boolean) => {
    setState((prev) => {
      if (paused && prev.pausePoolSeconds <= 0) return prev;
      return { ...prev, isPaused: paused };
    });
  };

  const decrementPausePool = () => {
    setState((prev) => {
      if (prev.pausePoolSeconds <= 1) {
        return { ...prev, pausePoolSeconds: 0, isPaused: false };
      }
      return { ...prev, pausePoolSeconds: prev.pausePoolSeconds - 1 };
    });
  };

  const resetPausePool = () => {
    setState((prev) => ({ ...prev, pausePoolSeconds: 90, isPaused: false }));
  };

  const toggleBookmarkQuestion = (questionId: string) => {
    setState((prev) => {
      const current = prev.markedQuestionIds || [];
      const isMarked = current.includes(questionId);
      const updated = isMarked
        ? current.filter((id) => id !== questionId)
        : [...current, questionId];
      return { ...prev, markedQuestionIds: updated };
    });
  };

  const popLastAnswer = (subject: Subject): AnswerRecord | null => {
    let popped: AnswerRecord | null = null;
    setState((prev) => {
      const answers = prev.answers || [];
      let lastIdx = -1;
      for (let i = answers.length - 1; i >= 0; i--) {
        if (answers[i].subject === subject) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx === -1) return prev;
      popped = answers[lastIdx];
      const newAnswers = answers.filter((_, idx) => idx !== lastIdx);

      const pointsToSubtract = popped.pointsEarned !== undefined
        ? popped.pointsEarned
        : (popped.isCorrect ? 100 : 0);
      const newPoints = Math.max(0, (prev.points || 0) - pointsToSubtract);

      let newStreak = 0;
      for (let i = newAnswers.length - 1; i >= 0; i--) {
        if (newAnswers[i].isCorrect) {
          newStreak++;
        } else {
          break;
        }
      }

      return {
        ...prev,
        answers: newAnswers,
        points: newPoints,
        activeStreak: newStreak,
      };
    });
    return popped;
  };

  const saveSessionToHistory = (): TestSessionRecord | null => {
    if (state.answers.length === 0) return null;

    const correctAnswers = state.answers.filter((a) => a.isCorrect).length;

    const topicsMap: Record<string, { topic: string; correct: number; total: number; totalTime: number }> = {};
    state.answers.forEach((a) => {
      if (!a.topic) return;
      if (!topicsMap[a.topic]) {
        topicsMap[a.topic] = { topic: a.topic, correct: 0, total: 0, totalTime: 0 };
      }
      topicsMap[a.topic].total += 1;
      if (a.isCorrect) topicsMap[a.topic].correct += 1;
      topicsMap[a.topic].totalTime += a.timeTaken;
    });

    const topicBreakdown: TopicBreakdownItem[] = Object.values(topicsMap).map((t) => ({
      topic: t.topic,
      correct: t.correct,
      total: t.total,
      accuracy: t.correct / t.total,
      avgTime: t.totalTime / t.total,
    }));

    const cogAnswers = state.answers.filter((a) => a.subject === 'cognition');
    let cognitionStats: CognitionStatsRecord | null = null;
    if (cogAnswers.length > 0) {
      const cogCorrect = cogAnswers.filter((a) => a.isCorrect).length;
      const avgReactionTime = cogAnswers.reduce((acc, curr) => acc + (curr.reactionTime || 0), 0) / cogAnswers.length;
      cognitionStats = {
        correct: cogCorrect,
        total: cogAnswers.length,
        accuracy: cogCorrect / cogAnswers.length,
        avgReactionTime,
      };
    }

    const record: TestSessionRecord = {
      sessionId: state.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: state.studentId || state.currentStudent?.id || 'guest',
      studentName: state.studentName || state.currentStudent?.name || 'Unbekannt',
      date: new Date().toISOString(),
      subject: 'Mathematik & Englisch',
      mathLevelReached: state.mathLevel,
      englishLevelReached: state.englishLevel,
      score: correctAnswers,
      totalQuestions: state.answers.length,
      topicBreakdown,
      cognitionStats,
      answers: state.answers,
      motivation: state.motivation,
      favoriteSubject: state.favoriteSubject,
      problemSubject: state.problemSubject,
      notes: state.currentStudent?.notes,
      markedQuestionIds: state.markedQuestionIds || [],
    };

    saveSessionRecord(record);

    setState((prev) => ({
      ...prev,
      sessionId: record.sessionId,
      isSavedToHistory: true,
    }));

    return record;
  };

  const finishTest = () => {
    saveSessionToHistory();
  };

  const clearSession = () => {
    setState(initialState);
    try {
      localStorage.removeItem('diagnosticSession');
    } catch (err) {
      console.error('Failed to remove diagnosticSession:', err);
    }
  };

  return (
    <TestSessionContext.Provider
      value={{
        state,
        currentStudent: state.currentStudent,
        customTestConfig: state.customTestConfig,
        selectStudent,
        saveCurrentStudentProfile,
        startSession,
        recordAnswer,
        updateMathLevel,
        updateEnglishLevel,
        setMathLevel,
        setEnglishLevel,
        setStroopCalibration,
        setWarmupData,
        setCustomTestConfig,
        updateAvatarConfig,
        unlockAccessory,
        incrementStreak,
        resetStreak,
        addPoints,
        unlockBadge,
        togglePause,
        setIsPaused,
        decrementPausePool,
        resetPausePool,
        toggleBookmarkQuestion,
        popLastAnswer,
        finishTest,
        clearSession,
        saveSessionToHistory,
      }}
    >
      {children}
    </TestSessionContext.Provider>
  );
};

export const useTestSession = () => {
  const context = useContext(TestSessionContext);
  if (context === undefined) {
    throw new Error('useTestSession must be used within a TestSessionProvider');
  }
  return context;
};
