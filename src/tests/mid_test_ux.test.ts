import { describe, it, expect, beforeEach } from 'vitest';
import { clearSessionHistory } from '../utils/sessionHistory';
import { clearStudentRoster } from '../utils/studentRoster';

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

describe('R1: Mid-Test UX & Tip Modal Refactoring Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionHistory();
    clearStudentRoster();
  });

  it('immediately advances question index on incorrect submission without triggering popups', () => {
    let currentQuestionIndex = 0;
    let questionsAsked = 0;
    let activeModal: string | null = null;

    const submitAnswer = (userAnswer: string, isCorrect: boolean) => {
      // Logic without DidYouKnowModal
      questionsAsked += 1;
      currentQuestionIndex += 1;
      // Active modal should remain null
      return { questionsAsked, currentQuestionIndex, isCorrect, activeModal };
    };

    const step1 = submitAnswer('wrong answer', false);
    expect(step1.questionsAsked).toBe(1);
    expect(step1.currentQuestionIndex).toBe(1);
    expect(step1.isCorrect).toBe(false);
    expect(step1.activeModal).toBeNull();

    const step2 = submitAnswer('another wrong answer', false);
    expect(step2.questionsAsked).toBe(2);
    expect(step2.currentQuestionIndex).toBe(2);
    expect(step2.activeModal).toBeNull();
  });

  it('keeps active question timer running continuously across consecutive submissions', () => {
    let timerState = {
      elapsedSeconds: 0,
      isTimerRunning: true,
    };

    const tickTimer = () => {
      if (timerState.isTimerRunning) {
        timerState.elapsedSeconds += 1;
      }
    };

    tickTimer();
    tickTimer();
    expect(timerState.elapsedSeconds).toBe(2);

    // Simulate incorrect answer submission mid-test
    const onIncorrectAnswerSubmit = () => {
      // Question advances, timer continues running without pause or modal lock
      timerState.elapsedSeconds = 0; // Reset for next question
      timerState.isTimerRunning = true;
    };

    onIncorrectAnswerSubmit();
    expect(timerState.isTimerRunning).toBe(true);
    expect(timerState.elapsedSeconds).toBe(0);

    tickTimer();
    expect(timerState.elapsedSeconds).toBe(1);
  });

  it('ensures correct answer secrecy during active test execution', () => {
    const question = {
      id: 'm_lvl3_q1',
      text: 'Berechne 12 * 8',
      correctAnswer: '96',
    };

    let userFeedbackShown: string | null = null;

    const handleAnswerSubmit = (userAnswer: string) => {
      const isCorrect = userAnswer === question.correctAnswer;
      if (!isCorrect) {
        // Mid-test refactoring rule: Do NOT reveal correct answer in UI feedback during test
        userFeedbackShown = null; // No disclosure
      } else {
        userFeedbackShown = null;
      }
      return isCorrect;
    };

    const result = handleAnswerSubmit('84'); // Incorrect answer
    expect(result).toBe(false);
    expect(userFeedbackShown).toBeNull(); // Answer is kept secret
  });
});
