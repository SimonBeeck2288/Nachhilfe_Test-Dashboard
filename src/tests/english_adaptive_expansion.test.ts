import { describe, it, expect } from 'vitest';
import {
  computeNextLevel,
  calculateStroopCalibration,
  type Streak,
} from '../utils/adaptive';
import {
  evaluateEnglishAnswer,
  normalizeEnglishString,
} from '../utils/evaluation';
import { englishQuestions } from '../data/questions';

describe('English Adaptive Progression & Question Pool Expansion', () => {
  describe('2-Hit Adaptive Level Transition Rules & Clamping', () => {
    it('keeps level unchanged and increments correct streak to 1 on first correct answer', () => {
      const initialStreak: Streak = { correct: 0, incorrect: 0 };
      const res = computeNextLevel(3, true, initialStreak);

      expect(res.level).toBe(3);
      expect(res.streak).toEqual({ correct: 1, incorrect: 0 });
    });

    it('advances level by +1 and resets streak to 0 on second consecutive correct answer', () => {
      const streak1: Streak = { correct: 1, incorrect: 0 };
      const res = computeNextLevel(3, true, streak1);

      expect(res.level).toBe(4);
      expect(res.streak).toEqual({ correct: 0, incorrect: 0 });
    });

    it('keeps level unchanged and increments incorrect streak to 1 on first incorrect answer', () => {
      const initialStreak: Streak = { correct: 0, incorrect: 0 };
      const res = computeNextLevel(4, false, initialStreak);

      expect(res.level).toBe(4);
      expect(res.streak).toEqual({ correct: 0, incorrect: 1 });
    });

    it('decreases level by -1 and resets streak to 0 on second consecutive incorrect answer', () => {
      const streak1: Streak = { correct: 0, incorrect: 1 };
      const res = computeNextLevel(4, false, streak1);

      expect(res.level).toBe(3);
      expect(res.streak).toEqual({ correct: 0, incorrect: 0 });
    });

    it('clamps level at upper bound (Level 7) on 2 consecutive correct answers at maximum level', () => {
      const streak1: Streak = { correct: 1, incorrect: 0 };
      const res = computeNextLevel(7, true, streak1);

      expect(res.level).toBe(7);
      expect(res.streak).toEqual({ correct: 0, incorrect: 0 });
    });

    it('clamps level at lower bound (Level 1) on 2 consecutive incorrect answers at minimum level', () => {
      const streak1: Streak = { correct: 0, incorrect: 1 };
      const res = computeNextLevel(1, false, streak1);

      expect(res.level).toBe(1);
      expect(res.streak).toEqual({ correct: 0, incorrect: 0 });
    });

    it('resets streak counter when answer outcome toggles (correct -> incorrect -> correct)', () => {
      let level = 2;
      let streak: Streak = { correct: 0, incorrect: 0 };

      // Answer 1: Correct -> streak correct: 1
      let res = computeNextLevel(level, true, streak);
      level = res.level;
      streak = res.streak;
      expect(level).toBe(2);
      expect(streak).toEqual({ correct: 1, incorrect: 0 });

      // Answer 2: Incorrect -> resets correct streak, incorrect streak: 1
      res = computeNextLevel(level, false, streak);
      level = res.level;
      streak = res.streak;
      expect(level).toBe(2);
      expect(streak).toEqual({ correct: 0, incorrect: 1 });

      // Answer 3: Correct -> resets incorrect streak, correct streak: 1
      res = computeNextLevel(level, true, streak);
      level = res.level;
      streak = res.streak;
      expect(level).toBe(2);
      expect(streak).toEqual({ correct: 1, incorrect: 0 });
    });
  });

  describe('Adaptive Level Preservation & Stroop Calibration Integration', () => {
    it('calibrates starting level and target time multiplier based on fast reaction speed and high accuracy', () => {
      const result = calculateStroopCalibration({ avgReactionTimeMs: 1100, accuracy: 0.85 });
      expect(result.proposedLevel).toBe(3);
      expect(result.recommendedTimeMultiplier).toBe(0.9);
      expect(result.speedRating).toBe('sehr schnell');
    });

    it('calibrates starting level to Level 2 for moderate speed and accuracy', () => {
      const result = calculateStroopCalibration({ avgReactionTimeMs: 1500, accuracy: 0.75 });
      expect(result.proposedLevel).toBe(2);
      expect(result.recommendedTimeMultiplier).toBe(1.0);
      expect(result.speedRating).toBe('normal');
    });

    it('calibrates starting level to Level 1 for slower or lower accuracy responses', () => {
      const result = calculateStroopCalibration({ avgReactionTimeMs: 2100, accuracy: 0.6 });
      expect(result.proposedLevel).toBe(1);
      expect(result.recommendedTimeMultiplier).toBe(1.2);
      expect(result.speedRating).toBe('bedacht');
    });

    it('computes continuous IRT theta and standard error during level adaptation', () => {
      const res = computeNextLevel(3, true, { correct: 0, incorrect: 0 }, -1.0);
      expect(res.theta).toBeDefined();
      expect(res.standardError).toBeDefined();
      expect(typeof res.theta).toBe('number');
    });
  });

  describe('Question Pool Scaffolding & Exhaustion Fallback Logic', () => {
    it('contains comprehensive CEFR question pool across all levels 1 through 7', () => {
      for (let level = 1; level <= 7; level++) {
        const levelQuestions = englishQuestions.filter((q) => q.level === level);
        expect(levelQuestions.length).toBeGreaterThanOrEqual(10);
      }
    });

    it('filters available questions by target level and unasked ID tracking', () => {
      const targetLevel = 2;
      const pool = englishQuestions.filter((q) => q.level === targetLevel);
      const askedIds = new Set<string>([pool[0].id, pool[1].id]);

      const available = pool.filter((q) => q.level === targetLevel && !askedIds.has(q.id));
      expect(available.length).toBe(pool.length - 2);
      expect(available.some((q) => askedIds.has(q.id))).toBe(false);
    });

    it('executes pool exhaustion fallback to level questions when all level questions have been asked', () => {
      const targetLevel = 1;
      const level1Pool = englishQuestions.filter((q) => q.level === targetLevel);
      const askedIds = new Set<string>(level1Pool.map((q) => q.id));

      // Simulate nextQuestion filtering logic from ModuleEnglish.tsx:
      // 1. Available unasked level match
      let available = level1Pool.filter((q) => q.level === targetLevel && !askedIds.has(q.id));
      expect(available.length).toBe(0);

      // 2. Fallback to all level match questions (ignoring askedIds constraint for spaced repetition)
      if (available.length === 0) {
        available = level1Pool.filter((q) => q.level === targetLevel);
      }
      expect(available.length).toBe(level1Pool.length);
    });

    it('executes global pool fallback if level pool is empty', () => {
      const nonExistentLevel = 99;
      const levelPool = englishQuestions.filter((q) => q.level === nonExistentLevel);
      let available = levelPool;

      if (available.length === 0 && englishQuestions.length > 0) {
        available = englishQuestions;
      }
      expect(available.length).toBe(englishQuestions.length);
    });
  });

  describe('English Answer Evaluation & Smart Normalization', () => {
    it('normalizes string case, punctuation, and surrounding whitespace', () => {
      const raw = '  "Hello, World!"  ';
      expect(normalizeEnglishString(raw)).toBe('hello world');
    });

    it('evaluates answers with case-insensitivity and punctuation tolerance', () => {
      expect(evaluateEnglishAnswer('Apple', 'apple')).toBe(true);
      expect(evaluateEnglishAnswer('children.', 'children')).toBe(true);
      expect(evaluateEnglishAnswer('WENT', 'went')).toBe(true);
    });

    it('strips leading articles (a, an, the) when target does not strictly require them', () => {
      expect(evaluateEnglishAnswer('a dog', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('an apple', 'apple')).toBe(true);
      expect(evaluateEnglishAnswer('the school', 'school')).toBe(true);
    });

    it('supports array of correct answers (string[])', () => {
      const correctOptions = ['pen', 'pencil'];
      expect(evaluateEnglishAnswer('pen', correctOptions)).toBe(true);
      expect(evaluateEnglishAnswer('a pencil', correctOptions)).toBe(true);
      expect(evaluateEnglishAnswer('eraser', correctOptions)).toBe(false);
    });

    it('supports synonym dictionary matching', () => {
      const synonyms = {
        dinner: ['supper', 'evening meal'],
      };
      expect(evaluateEnglishAnswer('supper', 'dinner', synonyms)).toBe(true);
      expect(evaluateEnglishAnswer('evening meal', 'dinner', synonyms)).toBe(true);
    });
  });
});
