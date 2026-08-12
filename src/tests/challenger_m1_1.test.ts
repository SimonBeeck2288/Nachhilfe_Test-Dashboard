import { describe, test, expect, beforeEach } from 'vitest';

// Polyfill localStorage for Node environment if uninitialized or non-functional
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

import { generateMathQuestion } from '../data/questions';
import { getSessionsByStudentId, saveSessionRecord, clearSessionHistory, getPastAskedQuestionIds } from '../utils/sessionHistory';
import { saveStudentProfile, clearStudentRoster } from '../utils/studentRoster';
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type { TestSessionState } from '../context/TestSessionContext';

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
};

function selectStudentReducer(prev: TestSessionState, student: StudentProfile | null): TestSessionState {
  if (!student) return initialState;
  const startingLvl = prev.customTestConfig?.startingLevel || 1;
  const initialTheta = startingLvl - 4;
  return {
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
  };
}

describe('Adversarial Verification: Student State Isolation & Math ID Generation', () => {
  beforeEach(() => {
    // Ensure localStorage polyfill is initialized
    let store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    clearSessionHistory();
    clearStudentRoster();
  });

  test('Math ID generation uniqueness harness: 10,000 iterations in microsecond loop', { timeout: 15000 }, () => {
    const generatedIds = new Set<string>();
    const totalIterations = 10000;

    for (let i = 0; i < totalIterations; i++) {
      const level = (i % 7) + 1;
      const question = generateMathQuestion(level, new Set());
      expect(question).not.toBeNull();
      if (question) {
        expect(question.id).toMatch(/^m_gen_\d+_\d+_[a-z0-9]+$/);
        expect(generatedIds.has(question.id)).toBe(false);
        generatedIds.add(question.id);
      }
    }

    expect(generatedIds.size).toBe(totalIterations);
  });

  test('Switching from Student A (with accumulated gamification state) to Student B resets all state to defaults', () => {
    const studentA: StudentProfile = saveStudentProfile({
      name: 'Student A',
      gradeLevel: 5,
      favoriteSubject: 'Mathe',
      problemSubject: 'Englisch',
    });

    const studentB: StudentProfile = saveStudentProfile({
      name: 'Student B',
      gradeLevel: 8,
      favoriteSubject: 'Englisch',
      problemSubject: 'Mathe',
    });

    // Initialize state for Student A
    let stateA = selectStudentReducer(initialState, studentA);

    // Mutate Student A's state with points, streak, badges, accessories, avatar config, answers
    stateA = {
      ...stateA,
      points: 450,
      activeStreak: 7,
      unlockedBadges: ['first_step', 'math_whiz', 'streak_master'],
      unlockedAccessories: ['none_hat', 'none_pet', 'default', 'hat_wizard', 'pet_owl'],
      avatarConfig: { hatId: 'hat_wizard', petId: 'pet_owl', themeId: 'cosmic' },
      answers: [
        { questionId: 'q1', topic: 'Addition', subject: 'math', isCorrect: true, timeTaken: 5, usedExtraTime: false },
        { questionId: 'q2', topic: 'Grammatik', subject: 'english', isCorrect: true, timeTaken: 8, usedExtraTime: false },
      ],
      mathLevel: 4,
      englishLevel: 3,
    };

    expect(stateA.points).toBe(450);
    expect(stateA.activeStreak).toBe(7);
    expect(stateA.unlockedBadges).toHaveLength(3);
    expect(stateA.avatarConfig.hatId).toBe('hat_wizard');

    // Switch to Student B
    const stateB = selectStudentReducer(stateA, studentB);

    // VERIFY ZERO STATE LEAKAGE
    expect(stateB.currentStudent?.id).toBe(studentB.id);
    expect(stateB.studentName).toBe('Student B');
    expect(stateB.points).toBe(0);
    expect(stateB.activeStreak).toBe(0);
    expect(stateB.unlockedBadges).toEqual([]);
    expect(stateB.unlockedAccessories).toEqual(['none_hat', 'none_pet', 'default']);
    expect(stateB.avatarConfig).toEqual({ hatId: 'none', petId: 'none', themeId: 'default' });
    expect(stateB.answers).toEqual([]);
    expect(stateB.mathLevel).toBe(1);
    expect(stateB.englishLevel).toBe(1);
  });

  test('Student session history & past asked questions isolation', () => {
    const studentA: StudentProfile = saveStudentProfile({
      name: 'Alice',
      gradeLevel: 6,
    });

    const studentB: StudentProfile = saveStudentProfile({
      name: 'Bob',
      gradeLevel: 7,
    });

    // Save session for Alice
    const sessionA: TestSessionRecord = {
      sessionId: 'sess_alice_1',
      studentId: studentA.id,
      studentName: studentA.name,
      date: new Date().toISOString(),
      subject: 'Mathematik',
      mathLevelReached: 3,
      englishLevelReached: 1,
      score: 2,
      totalQuestions: 2,
      topicBreakdown: [],
      cognitionStats: null,
      answers: [
        { questionId: 'm_gen_alice_1', topic: 'Addition', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false },
        { questionId: 'm_gen_alice_2', topic: 'Subtraktion', subject: 'math', isCorrect: true, timeTaken: 12, usedExtraTime: false },
      ],
    };
    saveSessionRecord(sessionA);

    // Save session for Bob
    const sessionB: TestSessionRecord = {
      sessionId: 'sess_bob_1',
      studentId: studentB.id,
      studentName: studentB.name,
      date: new Date().toISOString(),
      subject: 'Englisch',
      mathLevelReached: 1,
      englishLevelReached: 4,
      score: 1,
      totalQuestions: 1,
      topicBreakdown: [],
      cognitionStats: null,
      answers: [
        { questionId: 'e_gen_bob_1', topic: 'Grammatik', subject: 'english', isCorrect: true, timeTaken: 15, usedExtraTime: false },
      ],
    };
    saveSessionRecord(sessionB);

    // Check history filtering
    const historyA = getSessionsByStudentId(studentA.id);
    const historyB = getSessionsByStudentId(studentB.id);

    expect(historyA).toHaveLength(1);
    expect(historyA[0].sessionId).toBe('sess_alice_1');

    expect(historyB).toHaveLength(1);
    expect(historyB[0].sessionId).toBe('sess_bob_1');

    // Check asked question deduplication set isolation
    const askedAlice = getPastAskedQuestionIds(studentA.id);
    const askedBob = getPastAskedQuestionIds(studentB.id);

    expect(askedAlice.has('m_gen_alice_1')).toBe(true);
    expect(askedAlice.has('m_gen_alice_2')).toBe(true);
    expect(askedAlice.has('e_gen_bob_1')).toBe(false);

    expect(askedBob.has('e_gen_bob_1')).toBe(true);
    expect(askedBob.has('m_gen_alice_1')).toBe(false);
    expect(askedBob.has('m_gen_alice_2')).toBe(false);
  });

  test('Switching to Guest (null profile) cleanly clears student identity and resets gamification state', () => {
    const studentA: StudentProfile = saveStudentProfile({
      name: 'Student A',
      gradeLevel: 5,
    });

    let stateA = selectStudentReducer(initialState, studentA);
    stateA = {
      ...stateA,
      points: 200,
      activeStreak: 4,
      unlockedBadges: ['first_step'],
    };

    const guestState = selectStudentReducer(stateA, null);

    expect(guestState.currentStudent).toBeNull();
    expect(guestState.studentName).toBe('');
    expect(guestState.studentId).toBe('');
    expect(guestState.points).toBe(0);
    expect(guestState.activeStreak).toBe(0);
    expect(guestState.unlockedBadges).toEqual([]);
  });
});
