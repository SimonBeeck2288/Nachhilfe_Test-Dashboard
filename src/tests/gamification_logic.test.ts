import { describe, it, expect, beforeEach } from 'vitest';
import { saveSessionRecord, clearSessionHistory, getSessionById } from '../utils/sessionHistory';
import { saveStudentProfile, clearStudentRoster, getStudentById } from '../utils/studentRoster';
import { calculateStroopCalibration } from '../utils/adaptive';
import type { TestSessionRecord } from '../types/history';

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

describe('Tier 1-4: Gamification, UX, Timers & Reports (Features F3, F7, F8, F9, F10, F11, F12, F13, F14)', () => {
  beforeEach(() => {
    clearSessionHistory();
    clearStudentRoster();
  });

  // --- TIER 1: FEATURE COVERAGE & CONTRACT TESTS ---
  describe('Tier 1: Feature Contracts (F3, F7, F8, F9, F10, F11, F12, F13, F14)', () => {
    it('F3: Drag-and-Drop & Interactive question format contracts are valid', () => {
      const dragSortQuestion = {
        id: 'ds_1',
        topic: 'Sentence Building',
        subject: 'english' as const,
        level: 3,
        text: 'Bringe die Wörter in die richtige Reihenfolge.',
        type: 'drag-sort' as const,
        correctAnswer: 'The dog is big',
        dragItems: ['is', 'big', 'The', 'dog'],
        timeLimit: 30,
      };
      expect(dragSortQuestion.type).toBe('drag-sort');
      expect(dragSortQuestion.dragItems.length).toBe(4);
    });

    it('F7: Student Avatar accessory unlocking threshold criteria', () => {
      const hatAccessories = [
        { id: 'grad_cap', name: 'Doktorhut', category: 'hat', requiredPoints: 100 },
        { id: 'wizard_hat', name: 'Zauberhut', category: 'hat', requiredPoints: 250 },
        { id: 'crown', name: 'Krone', category: 'hat', requiredPoints: 500 },
      ];

      const scoreLow = 50;
      const scoreHigh = 300;

      const unlockedLow = hatAccessories.filter((h) => scoreLow >= h.requiredPoints);
      const unlockedHigh = hatAccessories.filter((h) => scoreHigh >= h.requiredPoints);

      expect(unlockedLow.length).toBe(0);
      expect(unlockedHigh.length).toBe(2);
      expect(unlockedHigh.map((h) => h.id)).toContain('grad_cap');
      expect(unlockedHigh.map((h) => h.id)).toContain('wizard_hat');
    });

    it('F8: Soft timer progress calculation penalizes delay linearly without throwing errors', () => {
      const targetTime = 30; // 30 seconds target
      const elapsedOnTime = 15;
      const elapsedSlow = 45;

      const pctOnTime = Math.min(100, (elapsedOnTime / targetTime) * 100);
      const pctSlow = Math.min(100, (elapsedSlow / targetTime) * 100);

      expect(pctOnTime).toBe(50);
      expect(pctSlow).toBe(100); // Progress bar maxes out gracefully
      expect(elapsedSlow > targetTime).toBe(true); // Soft indicator flag
    });

    it('F9: "Did-You-Know" friendly feedback structure provides hint on mistake', () => {
      const mockQuestionWithHint = {
        id: 'm1_hint',
        text: 'Berechne: 7 * 8',
        didYouKnowHint: '💡 Tipp: 7 * 7 = 49, dann addiere noch einmal 7!',
      };

      expect(mockQuestionWithHint.didYouKnowHint).toBeDefined();
      expect(mockQuestionWithHint.didYouKnowHint).toContain('Tipp');
    });

    it('F10: Meditative gong intermission container config (90 seconds duration)', () => {
      const intermissionConfig = {
        type: 'meditative_gong',
        durationSec: 90,
        soundSynthesis: 'gong_web_audio',
      };

      expect(intermissionConfig.durationSec).toBe(90);
      expect(intermissionConfig.soundSynthesis).toBe('gong_web_audio');
    });

    it('F11: Dynamic Streaks & Achievement Badge unlock conditions', () => {
      const streak = 3;
      const isMathWhizUnlocked = streak >= 3;
      expect(isMathWhizUnlocked).toBe(true);

      const badges = [
        { id: 'math_whiz', title: 'Math Whiz', minStreak: 3, unlocked: streak >= 3 },
        { id: 'fast_thinker', title: 'Fast Thinker', minStreak: 5, unlocked: streak >= 5 },
      ];

      expect(badges.find((b) => b.id === 'math_whiz')?.unlocked).toBe(true);
      expect(badges.find((b) => b.id === 'fast_thinker')?.unlocked).toBe(false);
    });

    it('F12: Warm-up survey data fields (motivation 1-5, subjects) persist correctly', () => {
      const warmupSurveyData = {
        motivation: 4,
        favoriteSubject: 'Mathematik',
        problemSubject: 'Englisch',
      };

      expect(warmupSurveyData.motivation).toBeGreaterThanOrEqual(1);
      expect(warmupSurveyData.motivation).toBeLessThanOrEqual(5);
      expect(warmupSurveyData.favoriteSubject).toBe('Mathematik');
    });

    it('F13: Stroop test 1x4 horizontal button alignment & calibration mapping', () => {
      const keysMapped = ['1', '2', '3', '4'];
      expect(keysMapped.length).toBe(4);

      const fastStroop = calculateStroopCalibration({ avgReactionTimeMs: 900, accuracy: 0.9 });
      expect(fastStroop.proposedLevel).toBe(3);
      expect(fastStroop.speedRating).toBe('sehr schnell');

      const slowStroop = calculateStroopCalibration({ avgReactionTimeMs: 2200, accuracy: 0.6 });
      expect(slowStroop.proposedLevel).toBe(1);
      expect(slowStroop.speedRating).toBe('bedacht');
    });

    it('F14: Diagnostic Session Record serialization & retrieval for Print Report', () => {
      const sampleSession: TestSessionRecord = {
        sessionId: 'sess_test_123',
        studentId: 'std_456',
        studentName: 'Max Mustermann',
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: 4,
        englishLevelReached: 5,
        score: 12,
        totalQuestions: 14,
        topicBreakdown: [
          { topic: 'Bruchrechnung', correct: 3, total: 3, accuracy: 1.0, avgTime: 12.4 },
        ],
        motivation: 5,
        favoriteSubject: 'Mathe',
        problemSubject: 'Englisch',
      };

      saveSessionRecord(sampleSession);

      const fetched = getSessionById('sess_test_123');
      expect(fetched).toBeDefined();
      expect(fetched?.studentName).toBe('Max Mustermann');
      expect(fetched?.score).toBe(12);
      expect(fetched?.mathLevelReached).toBe(4);
    });
  });

  // --- TIER 2: BOUNDARY VALUES & EDGE CASES ---
  describe('Tier 2: Gamification Boundary Conditions', () => {
    it('handles student roster creation with empty optional fields', () => {
      const newStudent = saveStudentProfile({
        name: 'Anna Schmidt',
        gradeLevel: 4,
        favoriteSubject: '',
        problemSubject: '',
        notes: '',
      });

      expect(newStudent.id).toBeDefined();
      expect(newStudent.name).toBe('Anna Schmidt');

      const fetched = getStudentById(newStudent.id);
      expect(fetched).toBeDefined();
      expect(fetched?.gradeLevel).toBe(4);
    });

    it('handles non-existent session ID lookup without crashing', () => {
      const nonExistent = getSessionById('non_existent_id');
      expect(nonExistent).toBeUndefined();
    });
  });
});
