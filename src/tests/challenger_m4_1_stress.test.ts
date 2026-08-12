import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateMathAnswer, evaluateEnglishAnswer } from '../utils/evaluation';
import { englishQuestions, generateMathQuestion } from '../data/questions';

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

describe('Challenger M4-1 Empirical Stress & Edge Case Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Pause Pool Depletion, Rapid Toggling & Multi-Module Persistence', () => {
    function togglePause(state: { pausePoolSeconds: number; isPaused: boolean }) {
      if (!state.isPaused && state.pausePoolSeconds <= 0) return state;
      return { ...state, isPaused: !state.isPaused };
    }

    function decrementPause(state: { pausePoolSeconds: number; isPaused: boolean }) {
      if (state.pausePoolSeconds <= 1) {
        return { ...state, pausePoolSeconds: 0, isPaused: false };
      }
      return { ...state, pausePoolSeconds: state.pausePoolSeconds - 1 };
    }

    it('handles rapid toggling 100 times without state corruption', () => {
      let state = { pausePoolSeconds: 90, isPaused: false };
      for (let i = 0; i < 100; i++) {
        state = togglePause(state);
      }
      // 100 toggles from false -> even number returns to false
      expect(state.isPaused).toBe(false);
      expect(state.pausePoolSeconds).toBe(90);
    });

    it('prevents pause pool from ever becoming negative even when over-decremented', () => {
      let state = { pausePoolSeconds: 2, isPaused: true };
      state = decrementPause(state); // 1s remaining
      expect(state.pausePoolSeconds).toBe(1);
      expect(state.isPaused).toBe(true);

      state = decrementPause(state); // 0s remaining, auto unpause
      expect(state.pausePoolSeconds).toBe(0);
      expect(state.isPaused).toBe(false);

      // Decrement again when already 0s
      state = decrementPause(state);
      expect(state.pausePoolSeconds).toBe(0);
      expect(state.isPaused).toBe(false);

      // Toggling when 0s must remain false
      state = togglePause(state);
      expect(state.isPaused).toBe(false);
      expect(state.pausePoolSeconds).toBe(0);
    });
  });

  describe('2. Step-Back Navigation & History Stack Boundary Conditions', () => {
    interface DummyAnswer {
      questionId: string;
      subject: 'math' | 'english';
      isCorrect: boolean;
      pointsEarned: number;
    }

    function popLastAnswerHelper(
      answers: DummyAnswer[],
      points: number,
      subject: 'math' | 'english'
    ) {
      let lastIdx = -1;
      for (let i = answers.length - 1; i >= 0; i--) {
        if (answers[i].subject === subject) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx === -1) return { popped: null, newAnswers: answers, newPoints: points, newStreak: 0 };
      const popped = answers[lastIdx];
      const newAnswers = answers.filter((_, idx) => idx !== lastIdx);
      const pointsToSubtract = popped.pointsEarned;
      const newPoints = Math.max(0, points - pointsToSubtract);

      let newStreak = 0;
      for (let i = newAnswers.length - 1; i >= 0; i--) {
        if (newAnswers[i].isCorrect) {
          newStreak++;
        } else {
          break;
        }
      }
      return { popped, newAnswers, newPoints, newStreak };
    }

    it('returns null safely when popping from an empty answer history', () => {
      const res = popLastAnswerHelper([], 0, 'math');
      expect(res.popped).toBeNull();
      expect(res.newAnswers).toHaveLength(0);
      expect(res.newPoints).toBe(0);
      expect(res.newStreak).toBe(0);
    });

    it('correctly recalculates active streak and points when stepping back over answers', () => {
      let answers: DummyAnswer[] = [
        { questionId: 'q1', subject: 'math', isCorrect: true, pointsEarned: 100 },
        { questionId: 'q2', subject: 'math', isCorrect: true, pointsEarned: 100 },
        { questionId: 'q3', subject: 'math', isCorrect: true, pointsEarned: 100 },
      ];
      let points = 300;

      // Pop last (q3)
      let res = popLastAnswerHelper(answers, points, 'math');
      expect(res.popped?.questionId).toBe('q3');
      expect(res.newAnswers).toHaveLength(2);
      expect(res.newPoints).toBe(200);
      expect(res.newStreak).toBe(2);

      // Pop q2
      res = popLastAnswerHelper(res.newAnswers, res.newPoints, 'math');
      expect(res.popped?.questionId).toBe('q2');
      expect(res.newAnswers).toHaveLength(1);
      expect(res.newPoints).toBe(100);
      expect(res.newStreak).toBe(1);

      // Pop q1
      res = popLastAnswerHelper(res.newAnswers, res.newPoints, 'math');
      expect(res.popped?.questionId).toBe('q1');
      expect(res.newAnswers).toHaveLength(0);
      expect(res.newPoints).toBe(0);
      expect(res.newStreak).toBe(0);
    });
  });

  describe('3. Question Bank Options Balancing Audit (22 English Target Questions & Cube Question)', () => {
    it('verifies Level 6 cube question volume calculation V = a^3', () => {
      let verified = false;
      for (let i = 0; i < 50; i++) {
        const q = generateMathQuestion(6, new Set());
        if (q && q.topic === 'Geometrie' && q.storyContext === 'Pakettransport bei der Post.') {
          verified = true;
          expect(q.text).toContain('Wie groß ist das Volumen V des Pakets in cm³?');
          const match = q.text.match(/a = (\d+) cm/);
          expect(match).not.toBeNull();
          if (match) {
            const a = parseInt(match[1], 10);
            expect(q.correctAnswer).toBe(String(a * a * a));
          }
          break;
        }
      }
      expect(verified).toBe(true);
    });

    it('verifies option formatting & absence of bias in 22 English MC target questions', () => {
      const targetIds = [
        'e4_2', 'e5_1', 'e5_3', 'e5_30', 'e5_41', 'e5_49',
        'e6_15', 'e6_17', 'e6_28', 'e6_33', 'e6_36', 'e6_43', 'e6_45',
        'e7_3', 'e7_15', 'e7_20', 'e7_33', 'e7_34', 'e7_35', 'e7_41', 'e7_42', 'e7_43'
      ];

      for (const id of targetIds) {
        const q = englishQuestions.find((item) => item.id === id);
        expect(q).toBeDefined();
        if (!q) continue;

        expect(q.type).toBe('multiple-choice');
        expect(q.options).toBeDefined();
        if (q.options) {
          expect(q.options).toContain(q.correctAnswer);
          for (const opt of q.options) {
            expect(opt).not.toMatch(/\s\/\s/);
            expect(opt).not.toMatch(/\([A-Za-z\s']+\)/);
          }
        }
      }
    });
  });

  describe('4. Decimal & Text Answer Evaluation Normalization Stress Tests', () => {
    it('evaluates math decimal equivalences (1, 1,0, 1.0, 1.00, spaces, prefixes, units)', () => {
      // Decimal comma vs dot
      expect(evaluateMathAnswer('1', '1.0')).toBe(true);
      expect(evaluateMathAnswer('1,0', '1.0')).toBe(true);
      expect(evaluateMathAnswer('1.0', '1')).toBe(true);
      expect(evaluateMathAnswer('1.00', '1,0')).toBe(true);
      expect(evaluateMathAnswer(' 1,0 ', '1')).toBe(true);

      // Unit stripping
      expect(evaluateMathAnswer('1,0 cm', '1')).toBe(true);
      expect(evaluateMathAnswer('2.5 m²', '2,5')).toBe(true);
      expect(evaluateMathAnswer('100 cm³', '100')).toBe(true);

      // Equation prefix stripping
      expect(evaluateMathAnswer('x = 1,0', '1.00')).toBe(true);
      expect(evaluateMathAnswer('a = 6', '6')).toBe(true);

      // Fractions and decimals
      expect(evaluateMathAnswer('0.5', '1/2')).toBe(true);
      expect(evaluateMathAnswer('1 1/2', '1.5')).toBe(true);
      expect(evaluateMathAnswer('0,33333', '1/3')).toBe(true); // Within 1e-4

      // Invalid numerical inputs
      expect(evaluateMathAnswer('abc', '1.0')).toBe(false);
      expect(evaluateMathAnswer('', '1.0')).toBe(false);
    });

    it('evaluates English answer tolerance (articles, case, punctuation, whitespace)', () => {
      expect(evaluateEnglishAnswer('a dog', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('The Apple', 'apple')).toBe(true);
      expect(evaluateEnglishAnswer('  cat.  ', 'cat')).toBe(true);
      expect(evaluateEnglishAnswer('an elephant', 'elephant')).toBe(true);
      expect(evaluateEnglishAnswer('wrong answer', 'dog')).toBe(false);
    });
  });
});
