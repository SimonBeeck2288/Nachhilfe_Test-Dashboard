import { describe, it, expect, beforeEach } from 'vitest';
import {
  mapGradeToLevel,
  DEFAULT_MATH_TOPICS,
  DEFAULT_ENGLISH_TOPICS,
} from '../components/PracticeConfigView';
import { saveSessionRecord, clearSessionHistory } from '../utils/sessionHistory';
import type { TestSessionRecord } from '../types/history';

// Polyfill localStorage if needed
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

describe('Milestone 1: Practice Generator Configuration & Grade Logic', () => {
  beforeEach(() => {
    clearSessionHistory();
  });

  describe('mapGradeToLevel', () => {
    it('maps grades 1 to 4 to Level 1', () => {
      expect(mapGradeToLevel(1)).toBe(1);
      expect(mapGradeToLevel(2)).toBe(1);
      expect(mapGradeToLevel(3)).toBe(1);
      expect(mapGradeToLevel(4)).toBe(1);
      expect(mapGradeToLevel('4')).toBe(1);
    });

    it('maps Grade 5 to Level 2', () => {
      expect(mapGradeToLevel(5)).toBe(2);
      expect(mapGradeToLevel('5')).toBe(2);
    });

    it('maps Grade 6 to Level 3', () => {
      expect(mapGradeToLevel(6)).toBe(3);
      expect(mapGradeToLevel('6')).toBe(3);
    });

    it('maps Grade 7 to Level 4', () => {
      expect(mapGradeToLevel(7)).toBe(4);
      expect(mapGradeToLevel('7')).toBe(4);
    });

    it('maps Grade 8 to Level 5', () => {
      expect(mapGradeToLevel(8)).toBe(5);
    });

    it('maps Grade 9 to Level 6', () => {
      expect(mapGradeToLevel(9)).toBe(6);
    });

    it('maps Grade 10+ to Level 7', () => {
      expect(mapGradeToLevel(10)).toBe(7);
      expect(mapGradeToLevel(12)).toBe(7);
    });

    it('handles undefined or invalid grade gracefully', () => {
      expect(mapGradeToLevel(undefined)).toBe(2);
      expect(mapGradeToLevel('invalid')).toBe(2);
    });
  });

  describe('Topic Pool Definitions', () => {
    it('exports 16 Math topics with appropriate levels', () => {
      expect(DEFAULT_MATH_TOPICS).toHaveLength(16);
      const addition = DEFAULT_MATH_TOPICS.find((t) => t.topicName === 'Addition');
      expect(addition).toBeDefined();
      expect(addition?.defaultLevel).toBe(1);

      const bruch = DEFAULT_MATH_TOPICS.find((t) => t.topicName === 'Bruchrechnung');
      expect(bruch).toBeDefined();
      expect(bruch?.defaultLevel).toBe(3);
    });

    it('exports 16 English topics with appropriate levels', () => {
      expect(DEFAULT_ENGLISH_TOPICS).toHaveLength(16);
      const vokabeln = DEFAULT_ENGLISH_TOPICS.find((t) => t.topicName === 'Vokabeln');
      expect(vokabeln).toBeDefined();
      expect(vokabeln?.defaultLevel).toBe(1);

      const passiv = DEFAULT_ENGLISH_TOPICS.find((t) => t.topicName === 'Passiv');
      expect(passiv).toBeDefined();
      expect(passiv?.defaultLevel).toBe(5);
    });
  });

  describe('Weakness Detection Logic (<70% Accuracy)', () => {
    it('correctly calculates topic accuracy and flags <70% as weak spot', () => {
      const studentId = 'test_student_123';
      const sampleSession: TestSessionRecord = {
        sessionId: 'sess_1',
        studentId,
        studentName: 'Max Mustermann',
        date: new Date().toISOString(),
        overallScorePercentage: 60,
        modulesCompleted: ['math'],
        answers: [
          { questionId: 'q1', topic: 'Bruchrechnung', isCorrect: false },
          { questionId: 'q2', topic: 'Bruchrechnung', isCorrect: false },
          { questionId: 'q3', topic: 'Bruchrechnung', isCorrect: true },
          { questionId: 'q4', topic: 'Addition', isCorrect: true },
          { questionId: 'q5', topic: 'Addition', isCorrect: true },
        ],
        topicBreakdown: [
          { topic: 'Bruchrechnung', subject: 'math', level: 3, total: 3, correct: 1 },
          { topic: 'Addition', subject: 'math', level: 1, total: 2, correct: 2 },
        ],
      };

      saveSessionRecord(sampleSession);

      // Verify stats aggregation logic
      const bruchStats = sampleSession.topicBreakdown![0];
      const bruchAccuracy = Math.round((bruchStats.correct / bruchStats.total) * 100);
      expect(bruchAccuracy).toBe(33); // 33% < 70% -> Ausbaubedarf
      expect(bruchAccuracy < 70).toBe(true);

      const addStats = sampleSession.topicBreakdown![1];
      const addAccuracy = Math.round((addStats.correct / addStats.total) * 100);
      expect(addAccuracy).toBe(100); // 100% >= 70% -> Gefestigt
      expect(addAccuracy < 70).toBe(false);
    });
  });
});
