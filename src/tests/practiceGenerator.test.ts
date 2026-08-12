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
import { generatePracticeSheet, calculateTopicAccuracy, createPRNG } from '../utils/practiceGenerator';
import type { PracticeGeneratorConfig, TopicConfig } from '../types/practice';
import { saveSessionRecord, clearSessionHistory } from '../utils/sessionHistory';
import type { TestSessionRecord } from '../types/history';

describe('practiceGenerator Core & Dynamic Variations Engine', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    try {
      clearSessionHistory();
    } catch {
      // ignored
    }
  });

  describe('Mulberry32 PRNG', () => {
    it('produces deterministic output for the same seed', () => {
      const rng1 = createPRNG(42);
      const rng2 = createPRNG(42);

      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createPRNG(42);
      const rng2 = createPRNG(99);

      expect(rng1()).not.toEqual(rng2());
    });
  });

  describe('calculateTopicAccuracy', () => {
    it('returns 100% when no session history exists', () => {
      const accuracy = calculateTopicAccuracy('student_1', 'Addition');
      expect(accuracy).toBe(100);
    });

    it('calculates topic accuracy correctly from session topicBreakdown', () => {
      const session: TestSessionRecord = {
        sessionId: 'sess_1',
        studentId: 'student_1',
        studentName: 'Max',
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 1,
        score: 5,
        totalQuestions: 10,
        topicBreakdown: [
          { topic: 'Addition', correct: 8, total: 10, accuracy: 0.8, avgTime: 10 },
          { topic: 'Subtraktion', correct: 3, total: 10, accuracy: 0.3, avgTime: 12 },
        ],
        answers: [],
      };

      saveSessionRecord(session);

      const additionAcc = calculateTopicAccuracy('student_1', 'Addition');
      const subtraktionAcc = calculateTopicAccuracy('student_1', 'Subtraktion');

      expect(additionAcc).toBe(80);
      expect(subtraktionAcc).toBe(30);
    });

    it('handles topicBreakdown as an object record as well', () => {
      const session: TestSessionRecord = {
        sessionId: 'sess_2',
        studentId: 'student_2',
        studentName: 'Lisa',
        date: new Date().toISOString(),
        subject: 'Englisch',
        mathLevelReached: 1,
        englishLevelReached: 4,
        score: 6,
        totalQuestions: 10,
        topicBreakdown: {
          Vokabeln: { topic: 'Vokabeln', correct: 6, total: 10, accuracy: 0.6, avgTime: 8 },
        },
        answers: [],
      };

      saveSessionRecord(session);

      const vocabAcc = calculateTopicAccuracy('student_2', 'Vokabeln');
      expect(vocabAcc).toBe(60);
    });

    it('falls back to inspecting raw answers if topicBreakdown is not populated', () => {
      const session: TestSessionRecord = {
        sessionId: 'sess_3',
        studentId: 'student_3',
        studentName: 'Tom',
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 2,
        englishLevelReached: 2,
        score: 2,
        totalQuestions: 4,
        topicBreakdown: [],
        answers: [
          { questionId: 'q1', isCorrect: true, topic: 'Geometrie', subject: 'math', level: 2, timeTaken: 5 },
          { questionId: 'q2', isCorrect: false, topic: 'Geometrie', subject: 'math', level: 2, timeTaken: 5 },
          { questionId: 'q3', isCorrect: true, topic: 'Geometrie', subject: 'math', level: 2, timeTaken: 5 },
          { questionId: 'q4', isCorrect: false, topic: 'Geometrie', subject: 'math', level: 2, timeTaken: 5 },
        ],
      };

      saveSessionRecord(session);

      const geomAcc = calculateTopicAccuracy('student_3', 'Geometrie');
      expect(geomAcc).toBe(50);
    });
  });

  describe('generatePracticeSheet Deterministic Seeded Generation', () => {
    const sampleTopics: TopicConfig[] = [
      { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
      { topicId: 'Subtraktion', topicName: 'Subtraktion', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: true, accuracyPercentage: 50 },
      { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 1, isWeakSpot: false },
      { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
    ];

    it('produces 100% reproducible practice sheets when passing the same seed', () => {
      const config: PracticeGeneratorConfig = {
        studentId: 'student_test',
        subjectFilter: 'both',
        topics: sampleTopics,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 12345,
      };

      const sheet1 = generatePracticeSheet(config);
      const sheet2 = generatePracticeSheet(config);

      expect(sheet1.exercises.length).toBe(10);
      expect(sheet2.exercises.length).toBe(10);
      expect(sheet1).toEqual(sheet2);
    });

    it('generates the exact requested question count', () => {
      const counts: (5 | 10 | 15 | 20)[] = [5, 10, 15, 20];
      counts.forEach((count) => {
        const sheet = generatePracticeSheet({
          studentId: 'student_test',
          subjectFilter: 'both',
          topics: sampleTopics,
          questionCount: count,
          isTimerDisabled: false,
          seed: 42,
        });
        expect(sheet.exercises.length).toBe(count);
      });
    });

    it('filters exercises by subjectFilter when requested', () => {
      const mathSheet = generatePracticeSheet({
        studentId: 'student_test',
        subjectFilter: 'math',
        topics: sampleTopics,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 777,
      });

      expect(mathSheet.exercises.every((e) => e.subject === 'math')).toBe(true);

      const englishSheet = generatePracticeSheet({
        studentId: 'student_test',
        subjectFilter: 'english',
        topics: sampleTopics,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 888,
      });

      expect(englishSheet.exercises.every((e) => e.subject === 'english')).toBe(true);
    });
  });

  describe('Math Dynamic Variation Engine', () => {
    it('ensures positive integer results for subtraction and division exercises', () => {
      const mathTopics: TopicConfig[] = [
        { topicId: 'Subtraktion', topicName: 'Subtraktion', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
        { topicId: 'Division', topicName: 'Division', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
      ];

      for (let seed = 1; seed <= 20; seed++) {
        const sheet = generatePracticeSheet({
          studentId: 'student_test',
          subjectFilter: 'math',
          topics: mathTopics,
          questionCount: 10,
          isTimerDisabled: false,
          seed,
        });

        sheet.exercises.forEach((ex) => {
          if (ex.topicName === 'Subtraktion' || ex.topicName === 'Division') {
            const answerNum = Number(ex.correctAnswer);
            expect(Number.isInteger(answerNum)).toBe(true);
            expect(answerNum).toBeGreaterThanOrEqual(0);
          }
        });
      }
    });

    it('supports advanced levels 1-7 for Math topics', () => {
      const advancedMathTopics: TopicConfig[] = [
        { topicId: 'Bruchrechnung', topicName: 'Bruchrechnung', subject: 'math', selected: true, targetLevel: 3, isWeakSpot: false },
        { topicId: 'Prozentrechnung', topicName: 'Prozentrechnung', subject: 'math', selected: true, targetLevel: 4, isWeakSpot: false },
        { topicId: 'Gleichungen', topicName: 'Gleichungen', subject: 'math', selected: true, targetLevel: 4, isWeakSpot: false },
        { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math', selected: true, targetLevel: 7, isWeakSpot: false },
        { topicId: 'Binomische Formeln', topicName: 'Binomische Formeln', subject: 'math', selected: true, targetLevel: 7, isWeakSpot: false },
      ];

      const sheet = generatePracticeSheet({
        studentId: 'student_test',
        subjectFilter: 'math',
        topics: advancedMathTopics,
        questionCount: 15,
        isTimerDisabled: false,
        seed: 999,
      });

      expect(sheet.exercises.length).toBe(15);
      sheet.exercises.forEach((ex) => {
        expect(ex.correctAnswer).toBeDefined();
        expect(ex.questionText).toBeTruthy();
        expect(ex.explanation).toBeTruthy();
      });
    });
  });

  describe('English Dynamic Variation Engine', () => {
    it('applies name/noun substitutions and option shuffling while keeping answer keys synchronized', () => {
      const englishTopics: TopicConfig[] = [
        { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 1, isWeakSpot: false },
        { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
        { topicId: 'Zeiten', topicName: 'Zeiten', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
      ];

      const sheet = generatePracticeSheet({
        studentId: 'student_test',
        subjectFilter: 'english',
        topics: englishTopics,
        questionCount: 10,
        isTimerDisabled: false,
        seed: 456,
      });

      expect(sheet.exercises.length).toBe(10);
      sheet.exercises.forEach((ex) => {
        expect(ex.subject).toBe('english');
        if (ex.options && ex.options.length > 0) {
          expect(ex.options).toContain(ex.correctAnswer);
        }
      });
    });
  });
});
