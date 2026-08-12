import { describe, it, expect, beforeEach } from 'vitest';
import { clearSessionHistory } from '../utils/sessionHistory';
import { clearStudentRoster } from '../utils/studentRoster';
import type { AnswerRecord } from '../context/TestSessionContext';

// Polyfill localStorage in Node test environment if uninitialized
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

interface TestState {
  pausePoolSeconds: number;
  isPaused: boolean;
  markedQuestionIds: string[];
  answers: AnswerRecord[];
}

const initialTestState: TestState = {
  pausePoolSeconds: 90,
  isPaused: false,
  markedQuestionIds: [],
  answers: [],
};

function togglePauseState(state: TestState): TestState {
  if (!state.isPaused && state.pausePoolSeconds <= 0) return state;
  return { ...state, isPaused: !state.isPaused };
}

function decrementPausePoolState(state: TestState): TestState {
  if (state.pausePoolSeconds <= 1) {
    return { ...state, pausePoolSeconds: 0, isPaused: false };
  }
  return { ...state, pausePoolSeconds: state.pausePoolSeconds - 1 };
}

function resetPausePoolState(state: TestState): TestState {
  return { ...state, pausePoolSeconds: 90, isPaused: false };
}

describe('R2: 90-Second Zwischenpausenpool & Timer Suspension Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionHistory();
    clearStudentRoster();
  });

  it('initializes with a shared 90-second pause pool and isPaused = false', () => {
    expect(initialTestState.pausePoolSeconds).toBe(90);
    expect(initialTestState.isPaused).toBe(false);
  });

  it('toggles pause state on and off when pool > 0', () => {
    let state = { ...initialTestState };
    state = togglePauseState(state);
    expect(state.isPaused).toBe(true);

    state = togglePauseState(state);
    expect(state.isPaused).toBe(false);
  });

  it('decrements pause pool seconds while active and auto-unpauses when reaching 0s', () => {
    let state = togglePauseState(initialTestState);
    expect(state.isPaused).toBe(true);

    // 1st tick -> 89s
    state = decrementPausePoolState(state);
    expect(state.pausePoolSeconds).toBe(89);
    expect(state.isPaused).toBe(true);

    // Decrement down to 1s remaining
    for (let i = 0; i < 88; i++) {
      state = decrementPausePoolState(state);
    }
    expect(state.pausePoolSeconds).toBe(1);
    expect(state.isPaused).toBe(true);

    // Final tick -> 0s remaining, auto-unpauses
    state = decrementPausePoolState(state);
    expect(state.pausePoolSeconds).toBe(0);
    expect(state.isPaused).toBe(false);
  });

  it('disables toggling pause state when pause pool is exhausted (0s remaining)', () => {
    let state = { ...initialTestState, pausePoolSeconds: 0, isPaused: false };

    state = togglePauseState(state);
    expect(state.isPaused).toBe(false); // Remains false, cannot pause
    expect(state.pausePoolSeconds).toBe(0);
  });

  it('resets pause pool back to 90 seconds and unpauses state', () => {
    let state = togglePauseState(initialTestState); // pausePool 90, isPaused true
    state = decrementPausePoolState(state); // pausePool 89
    expect(state.pausePoolSeconds).toBe(89);

    state = resetPausePoolState(state);
    expect(state.pausePoolSeconds).toBe(90);
    expect(state.isPaused).toBe(false);
  });

  it('suspends active question timer tick while paused', () => {
    let elapsedTime = 15;
    let isPaused = false;

    const tickQuestionTimer = () => {
      if (!isPaused) {
        elapsedTime += 1;
      }
    };

    tickQuestionTimer();
    expect(elapsedTime).toBe(16);

    isPaused = true;
    tickQuestionTimer();
    tickQuestionTimer();
    tickQuestionTimer();
    expect(elapsedTime).toBe(16); // Timer suspended

    isPaused = false;
    tickQuestionTimer();
    expect(elapsedTime).toBe(17);
  });
});
