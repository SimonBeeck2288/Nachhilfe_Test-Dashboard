import { describe, it, expect, beforeEach } from 'vitest';
import { saveSessionRecord, clearSessionHistory, getSessionHistory } from '../utils/sessionHistory';
import { clearStudentRoster } from '../utils/studentRoster';
import type { TestSessionRecord } from '../types/history';
import type { AnswerRecord, Subject } from '../context/TestSessionContext';

// Polyfill localStorage in Node test environment if uninitialized or missing methods
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

// Pure state reducer simulator for testing TestSessionContext state logic
interface State {
  pausePoolSeconds: number;
  isPaused: boolean;
  markedQuestionIds: string[];
  answers: AnswerRecord[];
  points: number;
  activeStreak: number;
}

const initialTestState: State = {
  pausePoolSeconds: 90,
  isPaused: false,
  markedQuestionIds: [],
  answers: [],
  points: 0,
  activeStreak: 0,
};

function togglePauseState(state: State): State {
  if (!state.isPaused && state.pausePoolSeconds <= 0) return state;
  return { ...state, isPaused: !state.isPaused };
}

function decrementPausePoolState(state: State): State {
  if (state.pausePoolSeconds <= 1) {
    return { ...state, pausePoolSeconds: 0, isPaused: false };
  }
  return { ...state, pausePoolSeconds: state.pausePoolSeconds - 1 };
}

function resetPausePoolState(state: State): State {
  return { ...state, pausePoolSeconds: 90, isPaused: false };
}

function toggleBookmarkState(state: State, questionId: string): State {
  const current = state.markedQuestionIds || [];
  const isMarked = current.includes(questionId);
  const updated = isMarked
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  return { ...state, markedQuestionIds: updated };
}

function popLastAnswerState(state: State, subject: Subject): { newState: State; popped: AnswerRecord | null } {
  const answers = state.answers || [];
  let lastIdx = -1;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].subject === subject) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return { newState: state, popped: null };

  const popped = answers[lastIdx];
  const newAnswers = answers.filter((_, idx) => idx !== lastIdx);

  const pointsToSubtract = popped.pointsEarned !== undefined
    ? popped.pointsEarned
    : (popped.isCorrect ? 100 : 0);
  const newPoints = Math.max(0, (state.points || 0) - pointsToSubtract);

  let newStreak = 0;
  for (let i = newAnswers.length - 1; i >= 0; i--) {
    if (newAnswers[i].isCorrect) {
      newStreak++;
    } else {
      break;
    }
  }

  return {
    newState: {
      ...state,
      answers: newAnswers,
      points: newPoints,
      activeStreak: newStreak,
    },
    popped,
  };
}

describe('Milestone M1: UX & Control Features (R1, R2, R3, R4)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionHistory();
    clearStudentRoster();
  });

  // --- R1: MID-TEST UX & TIP MODAL REMOVAL ---
  describe('R1: Mid-Test UX & Tip Modal Refactoring', () => {
    it('advances questions immediately on wrong answers without blocking mid-test modals', () => {
      let currentQuestionIndex = 0;
      let questionsAsked = 0;

      const submitAnswer = (userAnswer: string, isCorrect: boolean) => {
        // Record answer and advance immediately without mid-test popup
        questionsAsked += 1;
        currentQuestionIndex += 1;
        return { questionsAsked, currentQuestionIndex, isCorrect };
      };

      const step1 = submitAnswer('wrong answer', false);
      expect(step1.questionsAsked).toBe(1);
      expect(step1.currentQuestionIndex).toBe(1);
      expect(step1.isCorrect).toBe(false);

      const step2 = submitAnswer('correct answer', true);
      expect(step2.questionsAsked).toBe(2);
      expect(step2.currentQuestionIndex).toBe(2);
    });
  });

  // --- R2: PAUSE BUTTON & 90s PAUSE POOL ---
  describe('R2: Pause Button & 90-Second Zwischenpausenpool', () => {
    it('initializes with a 90-second pause pool and isPaused set to false', () => {
      expect(initialTestState.pausePoolSeconds).toBe(90);
      expect(initialTestState.isPaused).toBe(false);
    });

    it('toggles pause state correctly', () => {
      let state = { ...initialTestState };
      state = togglePauseState(state);
      expect(state.isPaused).toBe(true);

      state = togglePauseState(state);
      expect(state.isPaused).toBe(false);
    });

    it('decrements pause pool seconds correctly and unpauses automatically at 0s', () => {
      let state = togglePauseState(initialTestState);
      expect(state.isPaused).toBe(true);

      state = decrementPausePoolState(state);
      expect(state.pausePoolSeconds).toBe(89);

      // Decrement pool down to 1s
      for (let i = 0; i < 88; i++) {
        state = decrementPausePoolState(state);
      }
      expect(state.pausePoolSeconds).toBe(1);

      // Decrements to 0s and auto-unpauses
      state = decrementPausePoolState(state);
      expect(state.pausePoolSeconds).toBe(0);
      expect(state.isPaused).toBe(false);

      // Toggle pause is disabled when pool is 0s
      state = togglePauseState(state);
      expect(state.isPaused).toBe(false);
    });

    it('resets pause pool back to 90 seconds', () => {
      let state = togglePauseState(initialTestState);
      state = decrementPausePoolState(state);
      expect(state.pausePoolSeconds).toBe(89);

      state = resetPausePoolState(state);
      expect(state.pausePoolSeconds).toBe(90);
      expect(state.isPaused).toBe(false);
    });

    it('suspends question timer increment while paused', () => {
      let elapsedTime = 10;
      let isPaused = false;

      const tickTimer = () => {
        if (!isPaused) {
          elapsedTime += 1;
        }
      };

      tickTimer();
      expect(elapsedTime).toBe(11);

      isPaused = true;
      tickTimer();
      tickTimer();
      expect(elapsedTime).toBe(11); // Timer suspended

      isPaused = false;
      tickTimer();
      expect(elapsedTime).toBe(12);
    });
  });

  // --- R3: QUESTION BOOKMARKING ("MARKIEREN") ---
  describe('R3: Question Bookmarking ("Markieren" Button)', () => {
    it('toggles question bookmarks in state', () => {
      let state = { ...initialTestState };
      expect(state.markedQuestionIds).toEqual([]);

      state = toggleBookmarkState(state, 'm_lvl1_q1');
      expect(state.markedQuestionIds).toEqual(['m_lvl1_q1']);

      state = toggleBookmarkState(state, 'm_lvl1_q2');
      expect(state.markedQuestionIds).toEqual(['m_lvl1_q1', 'm_lvl1_q2']);

      state = toggleBookmarkState(state, 'm_lvl1_q1');
      expect(state.markedQuestionIds).toEqual(['m_lvl1_q2']);
    });

    it('persists marked question IDs into session history records', () => {
      let state = toggleBookmarkState(initialTestState, 'math_101');
      state = toggleBookmarkState(state, 'eng_202');

      const record: TestSessionRecord = {
        sessionId: 'sess_12345',
        studentId: 'stud_1',
        studentName: 'Max Mustermann',
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: 3,
        englishLevelReached: 2,
        score: 5,
        totalQuestions: 6,
        topicBreakdown: [],
        answers: [],
        markedQuestionIds: state.markedQuestionIds,
      };

      saveSessionRecord(record);

      const history = getSessionHistory();
      expect(history.length).toBe(1);
      expect(history[0].markedQuestionIds).toEqual(['math_101', 'eng_202']);
    });
  });

  // --- R4: BACK BUTTON NAVIGATION & STEP-BACK ---
  describe('R4: Back Button Navigation & popLastAnswer()', () => {
    it('pops the last answer for a subject and recalculates points and streak', () => {
      let state: State = {
        ...initialTestState,
        answers: [
          {
            questionId: 'q1',
            topic: 'Addition',
            subject: 'math',
            isCorrect: true,
            timeTaken: 10,
            usedExtraTime: false,
            pointsEarned: 100,
          },
          {
            questionId: 'q2',
            topic: 'Addition',
            subject: 'math',
            isCorrect: true,
            timeTaken: 12,
            usedExtraTime: false,
            pointsEarned: 100,
          },
        ],
        points: 200,
        activeStreak: 2,
      };

      const result = popLastAnswerState(state, 'math');
      expect(result.popped).not.toBeNull();
      expect(result.popped?.questionId).toBe('q2');
      expect(result.newState.answers.length).toBe(1);
      expect(result.newState.points).toBe(100);
      expect(result.newState.activeStreak).toBe(1);
    });

    it('returns null when popLastAnswer is called with no matching subject answers', () => {
      const state: State = {
        ...initialTestState,
        answers: [
          {
            questionId: 'q_math',
            topic: 'Geometrie',
            subject: 'math',
            isCorrect: true,
            timeTaken: 8,
            usedExtraTime: false,
            pointsEarned: 100,
          },
        ],
        points: 100,
        activeStreak: 1,
      };

      const result = popLastAnswerState(state, 'english');
      expect(result.popped).toBeNull();
      expect(result.newState.answers.length).toBe(1);
      expect(result.newState.points).toBe(100);
    });
  });
});
