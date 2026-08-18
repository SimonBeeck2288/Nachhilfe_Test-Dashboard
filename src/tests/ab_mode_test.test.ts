import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeAbComparisonMetrics } from '../utils/evaluation';
import type { AnswerRecord } from '../context/TestSessionContext';
import type { CustomTestConfig } from '../types/config';
import { defaultConfig } from '../types/config';
import {
  saveStudentProfile,
  getStudentRoster,
  updateStudentProfile,
  clearStudentRoster,
} from '../utils/studentRoster';
import { DIRECT_REDUCED_SENSORY_SETTINGS } from '../types/student';
import { generateMathQuestion } from '../data/questions';

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

describe('Neurodiversity A/B Comparison Diagnostic Test (R1 - R4)', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    clearStudentRoster();
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    clearStudentRoster();
  });

  describe('R1. A/B Diagnostic Test Mode Configuration & Preset', () => {
    it('initializes defaultConfig with isAbModeTest false by default', () => {
      expect(defaultConfig.isAbModeTest).toBe(false);
    });

    it('creates custom configuration with isAbModeTest flag and 5-10 min timer', () => {
      const config: CustomTestConfig = {
        subject: 'math',
        startingLevel: 3,
        maxDurationMinutes: 7.5,
        topics: ['Addition', 'Subtraktion'],
        questionTypes: ['multiple-choice', 'input'],
        isAbModeTest: true,
      };

      expect(config.isAbModeTest).toBe(true);
      expect(config.subject).toBe('math');
      expect(config.maxDurationMinutes).toBe(7.5);
      expect(config.startingLevel).toBe(3);
    });

    it('supports Math, English, and Combined subjects in A/B test mode', () => {
      const mathConfig: CustomTestConfig = {
        ...defaultConfig,
        subject: 'math',
        isAbModeTest: true,
      };
      const englishConfig: CustomTestConfig = {
        ...defaultConfig,
        subject: 'english',
        isAbModeTest: true,
      };
      const combinedConfig: CustomTestConfig = {
        ...defaultConfig,
        subject: 'all',
        isAbModeTest: true,
      };

      expect(mathConfig.isAbModeTest).toBe(true);
      expect(englishConfig.isAbModeTest).toBe(true);
      expect(combinedConfig.isAbModeTest).toBe(true);
    });
  });

  describe('R2. Interleaved Blind Question Delivery & modeVariant Tagging', () => {
    it('alternates between standard and direct mode variants based on question index', () => {
      const isAbMode = true;
      const getVariant = (index: number) =>
        isAbMode ? (index % 2 === 0 ? 'standard' : 'direct') : 'standard';

      expect(getVariant(0)).toBe('standard');
      expect(getVariant(1)).toBe('direct');
      expect(getVariant(2)).toBe('standard');
      expect(getVariant(3)).toBe('direct');
      expect(getVariant(4)).toBe('standard');
      expect(getVariant(5)).toBe('direct');
    });

    it('resolves directText for direct mode and standard text/story for standard mode', () => {
      const mathQ = generateMathQuestion(1, new Set());
      expect(mathQ).not.toBeNull();
      if (!mathQ) return;

      expect(mathQ.text).toBeDefined();
      expect(mathQ.directText).toBeDefined();
      expect(mathQ.storyContext).toBeDefined();

      // Standard mode text
      const standardText = mathQ.text;
      const standardStory = mathQ.storyContext;

      // Direct mode text
      const directText = mathQ.directText || mathQ.text;
      const directStory = mathQ.directStoryContext;

      expect(typeof standardText).toBe('string');
      expect(standardText.length).toBeGreaterThan(10);
      expect(typeof standardStory).toBe('string');
      expect(standardStory?.length).toBeGreaterThan(10);
      expect(typeof directText).toBe('string');
      expect(directText).toMatch(/Berechne|Wie viele/);
      expect(directStory).toBeUndefined();
    });

    it('correctly tags AnswerRecord with modeVariant property', () => {
      const record1: AnswerRecord = {
        questionId: 'm1_1',
        topic: 'Addition',
        subject: 'math',
        isCorrect: true,
        timeTaken: 12,
        usedExtraTime: false,
        modeVariant: 'standard',
      };

      const record2: AnswerRecord = {
        questionId: 'm1_2',
        topic: 'Addition',
        subject: 'math',
        isCorrect: true,
        timeTaken: 6,
        usedExtraTime: false,
        modeVariant: 'direct',
      };

      expect(record1.modeVariant).toBe('standard');
      expect(record2.modeVariant).toBe('direct');
    });
  });

  describe('R3. Comparative Analytics & Auto-Recommendation', () => {
    it('returns null when no answers are provided or none are tagged with modeVariant', () => {
      expect(computeAbComparisonMetrics([])).toBeNull();

      const untaggedAnswers: AnswerRecord[] = [
        {
          questionId: 'q1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
        },
      ];
      expect(computeAbComparisonMetrics(untaggedAnswers)).toBeNull();
    });

    it('computes accuracy, response time, and deltas accurately for standard vs direct questions', () => {
      const answers: AnswerRecord[] = [
        // Standard: 2 questions, 1 correct, 20s total (10s avg), 50% accuracy
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 8,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 's2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: false,
          timeTaken: 12,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        // Direct: 2 questions, 2 correct, 10s total (5s avg), 100% accuracy
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 4,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
        {
          questionId: 'd2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: true,
          timeTaken: 6,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      // Standard metrics
      expect(metrics.standard.total).toBe(2);
      expect(metrics.standard.correct).toBe(1);
      expect(metrics.standard.accuracy).toBe(0.5);
      expect(metrics.standard.avgTime).toBe(10);

      // Direct metrics
      expect(metrics.direct.total).toBe(2);
      expect(metrics.direct.correct).toBe(2);
      expect(metrics.direct.accuracy).toBe(1.0);
      expect(metrics.direct.avgTime).toBe(5);

      // Delta metrics
      // Accuracy gain: (1.0 - 0.5) * 100 = +50.0%
      expect(metrics.accuracyGainPercent).toBe(50);
      // Speedup: ((10 - 5) / 10) * 100 = +50.0%
      expect(metrics.speedupPercent).toBe(50);

      // Recommendation
      expect(metrics.recommendation).toBe('recommend_direct');
      expect(metrics.recommendationReason).toContain('Trefferquote');
    });

    it('triggers recommend_direct on significant speedup even with equivalent accuracy', () => {
      const answers: AnswerRecord[] = [
        // Standard: 100% accuracy, 20s avg
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 20,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        // Direct: 100% accuracy, 10s avg (50% speedup)
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.accuracyGainPercent).toBe(0);
      expect(metrics.speedupPercent).toBe(50);
      expect(metrics.recommendation).toBe('recommend_direct');
      expect(metrics.recommendationReason).toContain('Geschwindigkeitsvorteil');
    });

    it('triggers recommend_standard when narrative context results in significantly higher accuracy', () => {
      const answers: AnswerRecord[] = [
        // Standard: 100% accuracy, 10s avg
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 's2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        // Direct: 0% accuracy, 10s avg
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: false,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
        {
          questionId: 'd2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: false,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.accuracyGainPercent).toBe(-100);
      expect(metrics.recommendation).toBe('recommend_standard');
    });

    it('triggers neutral recommendation when accuracy and time are closely matched', () => {
      const answers: AnswerRecord[] = [
        // Standard: 100% accuracy, 10s avg
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        // Direct: 100% accuracy, 9.8s avg (~2% diff)
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 9.8,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.recommendation).toBe('neutral');
    });
  });

  describe('R3. 1-Click Profile Update Action', () => {
    it('updates student profile in local storage to DIRECT_REDUCED_SENSORY_SETTINGS upon 1-click action', () => {
      const profile = saveStudentProfile({
        name: 'Finn',
        gradeLevel: 6,
        favoriteSubject: 'Mathe',
        problemSubject: 'Englisch',
        notes: 'Konzentrationsschwierigkeiten bei Textaufgaben',
      });

      expect(profile.accessibilitySettings?.preset).toBe('standard');
      expect(profile.accessibilitySettings?.directQuestions).toBe(false);

      // Perform 1-click activation
      const updated = updateStudentProfile(profile.id, {
        accessibilitySettings: { ...DIRECT_REDUCED_SENSORY_SETTINGS },
      });

      expect(updated).not.toBeNull();
      expect(updated?.accessibilitySettings?.preset).toBe('direct_reduced_sensory');
      expect(updated?.accessibilitySettings?.directQuestions).toBe(true);
      expect(updated?.accessibilitySettings?.reducedSensory).toBe(true);

      // Verify persisted in roster
      const roster = getStudentRoster();
      const loaded = roster.find((s) => s.id === profile.id);
      expect(loaded?.accessibilitySettings?.directQuestions).toBe(true);
      expect(loaded?.accessibilitySettings?.reducedSensory).toBe(true);
    });
  });

  describe('R4. Printable Diagnostic Report Integration & Session History Persistence', () => {
    it('formats comparative A/B metrics and recommendation for printable reports', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 'e1',
          topic: 'Vokabeln',
          subject: 'english',
          isCorrect: false,
          timeTaken: 15,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'e2',
          topic: 'Vokabeln',
          subject: 'english',
          isCorrect: true,
          timeTaken: 5,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.accuracyGainPercent).toBe(100);
      expect(metrics.speedupPercent).toBe(66.7);
      expect(metrics.recommendation).toBe('recommend_direct');
    });

    it('handles mixed math & english answers in A/B diagnostic mode', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 'm1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'm2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: true,
          timeTaken: 5,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
        {
          questionId: 'e1',
          topic: 'Vokabeln',
          subject: 'english',
          isCorrect: false,
          timeTaken: 12,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'e2',
          topic: 'Grammatik',
          subject: 'english',
          isCorrect: true,
          timeTaken: 6,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.standard.total).toBe(2);
      expect(metrics.standard.correct).toBe(1);
      expect(metrics.standard.avgTime).toBe(11);
      expect(metrics.direct.total).toBe(2);
      expect(metrics.direct.correct).toBe(2);
      expect(metrics.direct.avgTime).toBe(5.5);

      expect(metrics.accuracyGainPercent).toBe(50);
      expect(metrics.speedupPercent).toBe(50);
      expect(metrics.recommendation).toBe('recommend_direct');
    });

    it('handles edge case when all answers in both modes are incorrect', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: false,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: false,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.standard.accuracy).toBe(0);
      expect(metrics.direct.accuracy).toBe(0);
      expect(metrics.accuracyGainPercent).toBe(0);
      expect(metrics.speedupPercent).toBe(0);
      expect(metrics.recommendation).toBe('neutral');
    });

    it('handles edge case when standard avgTime is 0 or answers have zero timeTaken', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 0,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 0,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.speedupPercent).toBe(0);
      expect(metrics.recommendation).toBe('neutral');
    });

    it('returns null when only standard answers are present (e.g. normal test mode)', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 's2',
          topic: 'Subtraktion',
          subject: 'math',
          isCorrect: true,
          timeTaken: 12,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
      ];

      expect(computeAbComparisonMetrics(answers)).toBeNull();
    });

    it('returns null when only direct answers are present', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 5,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      expect(computeAbComparisonMetrics(answers)).toBeNull();
    });

    it('correctly calculates 100% speedup when directAvgTime is 0s and standard is 10s', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 0,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.speedupPercent).toBe(100);
      expect(metrics.recommendation).toBe('recommend_direct');
    });
  });

  describe('R5. Sync & Serialization Validation of A/B Metrics', () => {
    it('preserves modeVariant and abComparisonMetrics during sync validation', async () => {
      const { validateAnswerRecord, validateTestSessionRecord } = await import('../utils/syncValidation');

      const ansRes = validateAnswerRecord(
        {
          questionId: 'm1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 8,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
        0
      );

      expect(ansRes.valid).toBe(true);
      expect(ansRes.answer?.modeVariant).toBe('direct');

      const sessRes = validateTestSessionRecord(
        {
          sessionId: 's_ab_1',
          studentId: 'stud_1',
          studentName: 'Lena',
          date: new Date().toISOString(),
          subject: 'math',
          mathLevelReached: 4,
          englishLevelReached: 4,
          score: 2,
          totalQuestions: 2,
          topicBreakdown: {},
          abComparisonMetrics: {
            standard: { total: 1, correct: 1, accuracy: 1, avgTime: 10 },
            direct: { total: 1, correct: 1, accuracy: 1, avgTime: 5 },
            accuracyGainPercent: 0,
            speedupPercent: 50,
            recommendation: 'recommend_direct',
            recommendationReason: 'Geschwindigkeitsvorteil',
          },
          answers: [
            {
              questionId: 'm1',
              topic: 'Addition',
              subject: 'math',
              isCorrect: true,
              timeTaken: 10,
              usedExtraTime: false,
              modeVariant: 'standard',
            },
            {
              questionId: 'm2',
              topic: 'Addition',
              subject: 'math',
              isCorrect: true,
              timeTaken: 5,
              usedExtraTime: false,
              modeVariant: 'direct',
            },
          ],
        },
        0
      );

      expect(sessRes.valid).toBe(true);
      expect(sessRes.session?.abComparisonMetrics?.recommendation).toBe('recommend_direct');
      expect(sessRes.session?.abComparisonMetrics?.speedupPercent).toBe(50);
      expect(sessRes.session?.answers[1].modeVariant).toBe('direct');
    });

    it('clamps out-of-range accuracy and avgTime in sync payloads', async () => {
      const { validateTestSessionRecord } = await import('../utils/syncValidation');

      const sessRes = validateTestSessionRecord(
        {
          sessionId: 's_ab_clamp',
          studentId: 'stud_2',
          studentName: 'Max',
          date: new Date().toISOString(),
          subject: 'math',
          mathLevelReached: 3,
          englishLevelReached: 3,
          score: 1,
          totalQuestions: 1,
          topicBreakdown: {},
          abComparisonMetrics: {
            standard: { total: -5, correct: -2, accuracy: 2.5, avgTime: -10 },
            direct: { total: 10, correct: 5, accuracy: -0.5, avgTime: 12 },
            accuracyGainPercent: 0,
            speedupPercent: 0,
            recommendation: 'neutral',
            recommendationReason: 'Test',
          },
          answers: [],
        },
        0
      );

      expect(sessRes.valid).toBe(true);
      expect(sessRes.session?.abComparisonMetrics?.standard.accuracy).toBe(1);
      expect(sessRes.session?.abComparisonMetrics?.standard.avgTime).toBe(0);
      expect(sessRes.session?.abComparisonMetrics?.standard.total).toBe(0);
      expect(sessRes.session?.abComparisonMetrics?.direct.accuracy).toBe(0);
      expect(sessRes.session?.abComparisonMetrics?.direct.avgTime).toBe(12);
    });
  });

  describe('R6. Robustness & Adversarial Edge Cases', () => {
    it('gracefully handles negative speedup and accurately calculates delta', () => {
      const answers: AnswerRecord[] = [
        // Standard: 10s
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        // Direct: 20s (direct was 100% slower)
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 20,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(metrics.speedupPercent).toBe(-100);
      expect(metrics.recommendation).toBe('recommend_standard');
      expect(metrics.recommendationReason).toContain('Standard-Modus');
    });

    it('gracefully handles answers with Infinity, NaN, and negative timeTaken values without crashing or producing NaN', () => {
      const answers: AnswerRecord[] = [
        {
          questionId: 's1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: Number.NaN,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 's2',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 10,
          usedExtraTime: false,
          modeVariant: 'standard',
        },
        {
          questionId: 'd1',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: -15, // Invalid negative time
          usedExtraTime: false,
          modeVariant: 'direct',
        },
        {
          questionId: 'd2',
          topic: 'Addition',
          subject: 'math',
          isCorrect: true,
          timeTaken: 5,
          usedExtraTime: false,
          modeVariant: 'direct',
        },
      ];

      const metrics = computeAbComparisonMetrics(answers);
      expect(metrics).not.toBeNull();
      if (!metrics) return;

      expect(Number.isFinite(metrics.standard.avgTime)).toBe(true);
      expect(Number.isFinite(metrics.direct.avgTime)).toBe(true);
      expect(Number.isFinite(metrics.accuracyGainPercent)).toBe(true);
      expect(Number.isFinite(metrics.speedupPercent)).toBe(true);
      expect(metrics.standard.avgTime).toBe(5); // (0 + 10) / 2 = 5
      expect(metrics.direct.avgTime).toBe(2.5); // (0 + 5) / 2 = 2.5
    });

    it('accurately computes exact threshold boundaries for auto-recommendation', () => {
      // 1. Exact 10% gain -> recommend_direct
      // standard: 9/10 = 90%, direct: 10/10 = 100%, avgTime equal
      const standard10: AnswerRecord[] = Array(9).fill({
        questionId: 's', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'standard'
      }).concat([{
        questionId: 's_fail', topic: 'T', subject: 'math', isCorrect: false, timeTaken: 10, usedExtraTime: false, modeVariant: 'standard'
      }]);
      const direct10: AnswerRecord[] = Array(10).fill({
        questionId: 'd', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'direct'
      });
      const m1 = computeAbComparisonMetrics([...standard10, ...direct10]);
      expect(m1?.accuracyGainPercent).toBe(10);
      expect(m1?.recommendation).toBe('recommend_direct');

      // 2. Exact -5% gain with exact 15% speedup -> recommend_direct
      // standard: 10s avg, 100% acc. direct: 8.5s avg (15% speedup), 95% acc (-5% gain)
      const standardSpeed: AnswerRecord[] = Array(20).fill({
        questionId: 's', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'standard'
      });
      const directSpeed: AnswerRecord[] = Array(19).fill({
        questionId: 'd', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 8.5, usedExtraTime: false, modeVariant: 'direct'
      }).concat([{
        questionId: 'd_fail', topic: 'T', subject: 'math', isCorrect: false, timeTaken: 8.5, usedExtraTime: false, modeVariant: 'direct'
      }]);
      const m2 = computeAbComparisonMetrics([...standardSpeed, ...directSpeed]);
      expect(m2?.accuracyGainPercent).toBe(-5);
      expect(m2?.speedupPercent).toBe(15);
      expect(m2?.recommendation).toBe('recommend_direct');

      // 3. Exact -10% gain -> recommend_standard
      const standardStd: AnswerRecord[] = Array(10).fill({
        questionId: 's', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'standard'
      });
      const directStd: AnswerRecord[] = Array(9).fill({
        questionId: 'd', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'direct'
      }).concat([{
        questionId: 'd_fail', topic: 'T', subject: 'math', isCorrect: false, timeTaken: 10, usedExtraTime: false, modeVariant: 'direct'
      }]);
      const m3 = computeAbComparisonMetrics([...standardStd, ...directStd]);
      expect(m3?.accuracyGainPercent).toBe(-10);
      expect(m3?.recommendation).toBe('recommend_standard');

      // 4. Exact 0% gain with -20% speedup (standard was faster) -> recommend_standard
      const standardFast: AnswerRecord[] = Array(10).fill({
        questionId: 's', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false, modeVariant: 'standard'
      });
      const directSlow: AnswerRecord[] = Array(10).fill({
        questionId: 'd', topic: 'T', subject: 'math', isCorrect: true, timeTaken: 12.5, usedExtraTime: false, modeVariant: 'direct'
      });
      const m4 = computeAbComparisonMetrics([...standardFast, ...directSlow]);
      expect(m4?.accuracyGainPercent).toBe(0);
      expect(m4?.speedupPercent).toBe(-25); // <= -20%
      expect(m4?.recommendation).toBe('recommend_standard');
    });

    it('fuzzes a high volume of 1,000 randomized answer records without performance degradation or precision error', () => {
      const largeAnswers: AnswerRecord[] = [];
      for (let i = 0; i < 1000; i++) {
        const isStandard = i % 2 === 0;
        largeAnswers.push({
          questionId: `q_${i}`,
          topic: 'Addition',
          subject: 'math',
          isCorrect: Math.random() > 0.3,
          timeTaken: Math.floor(Math.random() * 30) + 1,
          usedExtraTime: false,
          modeVariant: isStandard ? 'standard' : 'direct',
        });
      }

      const startTime = performance.now();
      const metrics = computeAbComparisonMetrics(largeAnswers);
      const elapsed = performance.now() - startTime;

      expect(metrics).not.toBeNull();
      expect(metrics?.standard.total).toBe(500);
      expect(metrics?.direct.total).toBe(500);
      expect(Number.isFinite(metrics?.accuracyGainPercent)).toBe(true);
      expect(Number.isFinite(metrics?.speedupPercent)).toBe(true);
      expect(elapsed).toBeLessThan(50); // Sub-50ms compute
    });
  });

  describe('R7. AbTestComparisonCard UI Component & 1-Click Interaction', () => {
    it('renders side-by-side comparative metrics and recommendation banner', async () => {
      const React = await import('react');
      const { render, screen } = await import('@testing-library/react');
      const { AbTestComparisonCard } = await import('../components/AbTestComparisonCard');

      const mockMetrics: AbTestComparisonMetrics = {
        standard: { total: 4, correct: 2, accuracy: 0.5, avgTime: 12 },
        direct: { total: 4, correct: 4, accuracy: 1.0, avgTime: 6 },
        accuracyGainPercent: 50,
        speedupPercent: 50,
        recommendation: 'recommend_direct',
        recommendationReason: 'Signifikant höhere Genauigkeit (+50%) bei sachlich-direkten Aufgabenstellungen.',
      };

      const { unmount } = render(
        React.createElement(AbTestComparisonCard, {
          metrics: mockMetrics,
          studentName: 'Lena',
          onActivateDirectMode: () => {},
        })
      );

      expect(screen.getByText(/Testergebnis: Welche Fragen passen besser zu dir\?/i)).toBeDefined();
      expect(screen.getByText(/Praxistipp: Direkte Aufgabenstellungen funktionieren besser/i)).toBeDefined();
      expect(screen.getByText('+50%')).toBeDefined();
      expect(screen.getByText('+50% schneller')).toBeDefined();
      expect(screen.getByText(/Direkt & Reizarm Modus dauerhaft für Lena aktivieren/i)).toBeDefined();

      unmount();
    });

    it('triggers onActivateDirectMode callback and toggles activation state on click', async () => {
      const React = await import('react');
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const { AbTestComparisonCard } = await import('../components/AbTestComparisonCard');

      let activated = false;
      const onActivate = () => {
        activated = true;
      };

      const mockMetrics: AbTestComparisonMetrics = {
        standard: { total: 2, correct: 1, accuracy: 0.5, avgTime: 10 },
        direct: { total: 2, correct: 2, accuracy: 1.0, avgTime: 5 },
        accuracyGainPercent: 50,
        speedupPercent: 50,
        recommendation: 'recommend_direct',
        recommendationReason: 'Vorteil',
      };

      const { unmount } = render(
        React.createElement(AbTestComparisonCard, {
          metrics: mockMetrics,
          studentName: 'Max',
          onActivateDirectMode: onActivate,
          isAlreadyActive: false,
        })
      );

      const button = screen.getByRole('button', { name: /Direkt & Reizarm Modus dauerhaft für Max aktivieren/i });
      fireEvent.click(button);

      expect(activated).toBe(true);
      expect(screen.getByText(/✓ Direkt & Reizarm Modus ist für Max aktiviert/i)).toBeDefined();

      unmount();
    });

    it('renders negative speedup correctly without double negative signs', async () => {
      const React = await import('react');
      const { render, screen } = await import('@testing-library/react');
      const { AbTestComparisonCard } = await import('../components/AbTestComparisonCard');

      const mockMetrics: AbTestComparisonMetrics = {
        standard: { total: 2, correct: 2, accuracy: 1.0, avgTime: 10 },
        direct: { total: 2, correct: 1, accuracy: 0.5, avgTime: 20 },
        accuracyGainPercent: -50,
        speedupPercent: -100,
        recommendation: 'recommend_standard',
        recommendationReason: 'Standard war besser',
      };

      const { unmount } = render(
        React.createElement(AbTestComparisonCard, {
          metrics: mockMetrics,
          studentName: 'Sam',
        })
      );

      // Verify clean formatting "100% langsamer" and not "-100% langsamer"
      expect(screen.getByText('100% langsamer')).toBeDefined();
      expect(screen.queryByText('-100% langsamer')).toBeNull();

      unmount();
    });
  });

  describe('R8. QuestionRenderer Blind Testing Verification', () => {
    it('hides [D/R] badge during active A/B blind test to prevent bias', async () => {
      const React = await import('react');
      const { render, screen } = await import('@testing-library/react');
      const { QuestionRenderer } = await import('../components/QuestionRenderer');
      const { TestSessionProvider } = await import('../context/TestSessionContext');

      const question: Question = {
        id: 'q_test_1',
        topic: 'Addition',
        subject: 'math',
        level: 1,
        text: 'Am Apfelbaum hängen 5 Äpfel. 3 fallen herunter. Wie viele Äpfel hängen noch am Baum?',
        directText: 'Berechne: 5 - 3 = ?',
        storyContext: 'Am Apfelbaum im Garten hängen Äpfel.',
        type: 'input',
        correctAnswer: '2',
        timeLimit: 45,
      };

      // Set customTestConfig with isAbModeTest in localStorage
      localStorage.setItem(
        'diagnosticSession',
        JSON.stringify({
          customTestConfig: {
            subject: 'math',
            startingLevel: 1,
            maxDurationMinutes: 5,
            topics: [],
            questionTypes: ['input'],
            isAbModeTest: true,
          },
        })
      );

      const { unmount } = render(
        React.createElement(
          TestSessionProvider,
          null,
          React.createElement(QuestionRenderer, {
            question,
            onAnswerSubmit: () => {},
            modeVariant: 'direct',
          })
        )
      );

      // In blind A/B mode, the direct text is rendered...
      expect(screen.getByText('Berechne: 5 - 3 = ?')).toBeDefined();
      // ...but the [D/R] badge is NOT shown
      expect(screen.queryByText('[D/R] Direkt')).toBeNull();
      // ...and the story context preamble is omitted
      expect(screen.queryByText(/Am Apfelbaum im Garten/i)).toBeNull();

      unmount();
    });

    it('renders standard story context and narrative question text when modeVariant is standard', async () => {
      const React = await import('react');
      const { render, screen } = await import('@testing-library/react');
      const { QuestionRenderer } = await import('../components/QuestionRenderer');
      const { TestSessionProvider } = await import('../context/TestSessionContext');

      const question: Question = {
        id: 'q_test_2',
        topic: 'Addition',
        subject: 'math',
        level: 1,
        text: 'Am Apfelbaum hängen 5 Äpfel. 3 fallen herunter. Wie viele Äpfel hängen noch am Baum?',
        directText: 'Berechne: 5 - 3 = ?',
        storyContext: 'Auf der Obstwiese wachsen saftige Äpfel.',
        type: 'input',
        correctAnswer: '2',
        timeLimit: 45,
      };

      const { unmount } = render(
        React.createElement(
          TestSessionProvider,
          null,
          React.createElement(QuestionRenderer, {
            question,
            onAnswerSubmit: () => {},
            modeVariant: 'standard',
          })
        )
      );

      expect(screen.getByText('Am Apfelbaum hängen 5 Äpfel. 3 fallen herunter. Wie viele Äpfel hängen noch am Baum?')).toBeDefined();
      expect(screen.getByText(/Auf der Obstwiese wachsen saftige Äpfel/i)).toBeDefined();

      unmount();
    });
  });
});
