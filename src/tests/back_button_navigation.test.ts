import { describe, it, expect, beforeEach } from 'vitest';
import { clearSessionHistory } from '../utils/sessionHistory';
import { clearStudentRoster } from '../utils/studentRoster';
import type { AnswerRecord, Subject } from '../context/TestSessionContext';

// Polyfill localStorage in Node test environment if uninitialized
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStoragesetItem !== 'function') {
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

interface TestState {
  answers: AnswerRecord[];
  points: number;
  activeStreak: number;
}

const initialTestState: TestState = {
  answers: [],
  points: 0,
  activeStreak: 0,
};

function popLastAnswerState(state: TestState, subject: Subject): { newState: TestState; popped: AnswerRecord | null } {
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

describe('R4: Back Button Navigation & Step-Back History Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionHistory();
    clearStudentRoster();
  });

  it('returns popped = null and leaves state unchanged when stack has no answers for subject', () => {
    const state: TestState = { ...initialTestState };
    const result = popLastAnswerState(state, 'math');

    expect(result.popped).toBeNull();
    expect(result.newState.answers).toEqual([]);
    expect(result.newState.points).toBe(0);
    expect(result.newState.activeStreak).toBe(0);
  });

  it('pops the most recent answer for the target subject and restores previous state', () => {
    const state: TestState = {
      answers: [
        {
          questionId: 'm1_1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          pointsEarned: 100,
          userAnswer: '15',
        },
        {
          questionId: 'm1_2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: true,
          timeTaken: 12,
          usedExtraTime: false,
          pointsEarned: 100,
          userAnswer: '8',
        },
      ],
      points: 200,
      activeStreak: 2,
    };

    const { newState, popped } = popLastAnswerState(state, 'math');

    expect(popped).not.toBeNull();
    expect(popped?.questionId).toBe('m1_2');
    expect(popped?.userAnswer).toBe('8');
    expect(newState.answers.length).toBe(1);
    expect(newState.answers[0].questionId).toBe('m1_1');
    expect(newState.points).toBe(100);
    expect(newState.activeStreak).toBe(1);
  });

  it('leaves answers for other subjects intact when popping subject answers', () => {
    const state: TestState = {
      answers: [
        {
          questionId: 'm1_1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          pointsEarned: 100,
        },
        {
          questionId: 'e1_1',
          topic: 'Vokabeln',
          subject: 'english',
          isCorrect: true,
          timeTaken: 8,
          usedExtraTime: false,
          pointsEarned: 100,
        },
      ],
      points: 200,
      activeStreak: 2,
    };

    const { newState, popped } = popLastAnswerState(state, 'math');

    expect(popped?.questionId).toBe('m1_1');
    expect(newState.answers.length).toBe(1);
    expect(newState.answers[0].subject).toBe('english');
    expect(newState.answers[0].questionId).toBe('e1_1');
  });

  it('recalculates streak properly after popping a incorrect answer or streak ending answer', () => {
    const state: TestState = {
      answers: [
        {
          questionId: 'm1_1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          pointsEarned: 100,
        },
        {
          questionId: 'm1_2',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          pointsEarned: 100,
        },
        {
          questionId: 'm1_3',
          topic: 'Addition',
          subject: 'math',
          isCorrect: false,
          timeTaken: 10,
          usedExtraTime: false,
          pointsEarned: 0,
        },
      ],
      points: 200,
      activeStreak: 0,
    };

    // Popping the incorrect answer 'm1_3' should restore the streak to 2 (since m1_1 & m1_2 were correct)
    const { newState, popped } = popLastAnswerState(state, 'math');

    expect(popped?.questionId).toBe('m1_3');
    expect(newState.answers.length).toBe(2);
    expect(newState.activeStreak).toBe(2);
    expect(newState.points).toBe(200);
  });
});
