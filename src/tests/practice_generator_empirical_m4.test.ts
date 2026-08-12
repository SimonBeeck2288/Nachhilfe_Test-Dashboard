// Safe localStorage polyfill for Node 22 test environment
const memoryStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, val: string) => { memoryStore.set(key, String(val)); },
  removeItem: (key: string) => { memoryStore.delete(key); },
  clear: () => { memoryStore.clear(); },
};

try {
  Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, configurable: true, writable: true });
} catch {
  // ignored
}

import { describe, it, expect, beforeEach } from 'vitest';
import { generatePracticeSheet, calculateTopicAccuracy } from '../utils/practiceGenerator';
import type { PracticeGeneratorConfig, TopicConfig } from '../types/practice';

describe('M4-1 Empirical Stress & Edge Case Verification: Practice Generator', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('Objective 2.1: Requested Question Count Exceeds Static Questions', () => {
    it('generates 100 dynamic variations when questionCount is 100 (exceeding static question bank)', () => {
      const config: PracticeGeneratorConfig = {
        studentId: 'stress_student_1',
        subjectFilter: 'both',
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 1 },
          { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 1 },
        ],
        questionCount: 100,
        isTimerDisabled: false,
        seed: 42,
      };

      const sheet = generatePracticeSheet(config);

      expect(sheet.exercises).toHaveLength(100);

      sheet.exercises.forEach((ex) => {
        expect(ex.id).toBeTruthy();
        expect(ex.questionText).toBeTruthy();
        expect(ex.correctAnswer).toBeDefined();
        expect(ex.explanation).toBeTruthy();
        expect(ex.mascotTip).toBeTruthy();
        expect(typeof ex.questionText).toBe('string');
        expect(ex.questionText).not.toContain('NaN');
        expect(ex.questionText).not.toContain('undefined');
        expect(ex.correctAnswer).not.toContain('NaN');
        expect(ex.correctAnswer).not.toContain('undefined');
      });
    });

    it('generates 50 English exercises when static bank for topic is exhausted without duplicate static IDs crashing generator', () => {
      const config: PracticeGeneratorConfig = {
        studentId: 'stress_student_2',
        subjectFilter: 'english',
        topics: [
          { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 1 },
        ],
        questionCount: 50,
        isTimerDisabled: false,
        seed: 999,
      };

      const sheet = generatePracticeSheet(config);

      expect(sheet.exercises).toHaveLength(50);
      sheet.exercises.forEach((ex) => {
        expect(ex.subject).toBe('english');
        expect(ex.questionText).toBeTruthy();
        expect(ex.correctAnswer).toBeTruthy();
      });
    });
  });

  describe('Objective 2.2: 0 Topics Selected & Empty/Undefined Configs', () => {
    it('handles empty topics array [] cleanly with fallbacks for both subjectFilter=math, english, and both', () => {
      const filters: ('math' | 'english' | 'both')[] = ['math', 'english', 'both'];

      filters.forEach((filter) => {
        const sheet = generatePracticeSheet({
          studentId: 'student_no_topics',
          subjectFilter: filter,
          topics: [],
          questionCount: 10,
          isTimerDisabled: false,
          seed: 123,
        });

        expect(sheet.exercises).toHaveLength(10);
        expect(sheet.exercises.every((ex) => ex.id && ex.questionText && ex.correctAnswer)).toBe(true);
        if (filter === 'math') {
          expect(sheet.exercises.every((ex) => ex.subject === 'math')).toBe(true);
        } else if (filter === 'english') {
          expect(sheet.exercises.every((ex) => ex.subject === 'english')).toBe(true);
        }
      });
    });

    it('handles all topics having selected=false by using topic list fallbacks', () => {
      const topics: TopicConfig[] = [
        { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math', selected: false, targetLevel: 2 },
        { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english', selected: false, targetLevel: 2 },
      ];

      const sheet = generatePracticeSheet({
        studentId: 'student_unselected_topics',
        subjectFilter: 'both',
        topics,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 456,
      });

      expect(sheet.exercises).toHaveLength(10);
      expect(sheet.exercises.every((ex) => ex.id && ex.questionText && ex.correctAnswer)).toBe(true);
    });

    it('handles undefined topics property gracefully without throwing an error', () => {
      const sheet = generatePracticeSheet({
        studentId: 'student_undefined_topics',
        subjectFilter: 'both',
        topics: undefined as any,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 789,
      });

      expect(sheet.exercises).toHaveLength(10);
    });
  });

  describe('Objective 2.3: Invalid Level Ranges & Boundary Testing', () => {
    it('clamps negative, zero, out-of-bound, NaN, and undefined targetLevel values to valid [1, 7] range', () => {
      const invalidLevels = [-10, 0, 8, 999, NaN, undefined as any];

      invalidLevels.forEach((invalidLevel, idx) => {
        const topics: TopicConfig[] = [
          { topicId: 'Subtraktion', topicName: 'Subtraktion', subject: 'math', selected: true, targetLevel: invalidLevel },
          { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english', selected: true, targetLevel: invalidLevel },
        ];

        const sheet = generatePracticeSheet({
          studentId: `student_invalid_lvl_${idx}`,
          subjectFilter: 'both',
          topics,
          questionCount: 10,
          isTimerDisabled: false,
          seed: 100 + idx,
        });

        expect(sheet.exercises).toHaveLength(10);
        sheet.exercises.forEach((ex) => {
          expect(ex.level).toBeGreaterThanOrEqual(1);
          expect(ex.level).toBeLessThanOrEqual(7);
          expect(Number.isNaN(ex.level)).toBe(false);
        });
      });
    });
  });

  describe('Objective 2.4: Empty Student History', () => {
    it('calculateTopicAccuracy returns 100% default accuracy for student with no history', () => {
      const acc = calculateTopicAccuracy('non_existent_student_99', 'Addition');
      expect(acc).toBe(100);
    });

    it('calculateTopicAccuracy returns 100% when studentId or topicId is empty or null', () => {
      expect(calculateTopicAccuracy('', 'Addition')).toBe(100);
      expect(calculateTopicAccuracy('student_1', '')).toBe(100);
      expect(calculateTopicAccuracy('', '')).toBe(100);
    });

    it('generatePracticeSheet executes smoothly with new student ID with zero session history', () => {
      const sheet = generatePracticeSheet({
        studentId: 'brand_new_student',
        subjectFilter: 'both',
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 1 },
        ],
        questionCount: 10,
        isTimerDisabled: false,
        seed: 333,
      });

      expect(sheet.exercises).toHaveLength(10);
    });
  });

  describe('Objective 3: Seed Determinism Verification', () => {
    it('produces 100% identical sheets for identical PRNG seeds across multiple runs and seeds', () => {
      const seeds = [0, 1, 42, 123456, 999999, -50];
      const baseTopics: TopicConfig[] = [
        { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2 },
        { topicId: 'Division', topicName: 'Division', subject: 'math', selected: true, targetLevel: 3 },
        { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math', selected: true, targetLevel: 4 },
        { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 2 },
        { topicId: 'Zeiten', topicName: 'Zeiten', subject: 'english', selected: true, targetLevel: 3 },
      ];

      seeds.forEach((seed) => {
        const config: PracticeGeneratorConfig = {
          studentId: 'seed_test_student',
          subjectFilter: 'both',
          topics: baseTopics,
          questionCount: 20,
          isTimerDisabled: false,
          seed,
        };

        const sheet1 = generatePracticeSheet(config);
        const sheet2 = generatePracticeSheet(config);

        expect(sheet1).toEqual(sheet2);
        expect(sheet1.id).toBe(sheet2.id);
        expect(sheet1.exercises).toEqual(sheet2.exercises);
      });
    });

    it('produces different sheets when PRNG seeds differ', () => {
      const config1: PracticeGeneratorConfig = {
        studentId: 'seed_test_student',
        subjectFilter: 'math',
        topics: [{ topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2 }],
        questionCount: 10,
        isTimerDisabled: false,
        seed: 111,
      };

      const config2: PracticeGeneratorConfig = {
        ...config1,
        seed: 222,
      };

      const sheet1 = generatePracticeSheet(config1);
      const sheet2 = generatePracticeSheet(config2);

      expect(sheet1.id).not.toBe(sheet2.id);
      expect(sheet1.exercises).not.toEqual(sheet2.exercises);
    });
  });

  describe('Math Formula & Numerical Correctness Stress Test', () => {
    it('verifies non-negative results and positive integers for Subtraktion and Division across 1,000 iterations', () => {
      const mathTopics: TopicConfig[] = [
        { topicId: 'Subtraktion', topicName: 'Subtraktion', subject: 'math', selected: true, targetLevel: 2 },
        { topicId: 'Division', topicName: 'Division', subject: 'math', selected: true, targetLevel: 2 },
      ];

      for (let s = 1; s <= 100; s++) {
        const sheet = generatePracticeSheet({
          studentId: 'math_stress',
          subjectFilter: 'math',
          topics: mathTopics,
          questionCount: 10,
          isTimerDisabled: false,
          seed: s,
        });

        sheet.exercises.forEach((ex) => {
          const val = Number(ex.correctAnswer);
          expect(Number.isNaN(val)).toBe(false);
          expect(Number.isInteger(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('verifies geometry and algebra formulas (Bruch, Prozent, Gleichungen, Geometrie, Binom) produce valid answers', () => {
      const advancedTopics: TopicConfig[] = [
        { topicId: 'Bruchrechnung', topicName: 'Bruchrechnung', subject: 'math', selected: true, targetLevel: 4 },
        { topicId: 'Prozentrechnung', topicName: 'Prozentrechnung', subject: 'math', selected: true, targetLevel: 4 },
        { topicId: 'Gleichungen', topicName: 'Gleichungen', subject: 'math', selected: true, targetLevel: 5 },
        { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math', selected: true, targetLevel: 7 },
        { topicId: 'Binomische Formeln', topicName: 'Binomische Formeln', subject: 'math', selected: true, targetLevel: 7 },
      ];

      for (let s = 1; s <= 20; s++) {
        const sheet = generatePracticeSheet({
          studentId: 'advanced_math_stress',
          subjectFilter: 'math',
          topics: advancedTopics,
          questionCount: 25,
          isTimerDisabled: false,
          seed: s,
        });

        sheet.exercises.forEach((ex) => {
          expect(ex.correctAnswer).toBeDefined();
          expect(ex.questionText).toBeTruthy();
          expect(ex.questionText).not.toContain('NaN');
          expect(ex.correctAnswer).not.toContain('NaN');
          if (ex.options) {
            expect(ex.options).toContain(ex.correctAnswer);
          }
        });
      }
    });
  });
});
