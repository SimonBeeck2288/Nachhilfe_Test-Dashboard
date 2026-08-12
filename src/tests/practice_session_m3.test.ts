import { describe, it, expect } from 'vitest';
import { checkAnswerCorrect, formatTime } from '../components/PracticeSessionView';
import type { GeneratedExerciseItem, PracticeGeneratorConfig } from '../types/practice';
import { generatePracticeSheet } from '../utils/practiceGenerator';

describe('Milestone 3 — Interactive Practice & Print View Unit & Integration Tests', () => {
  describe('checkAnswerCorrect utility function', () => {
    const sampleExercise: GeneratedExerciseItem = {
      id: 'ex_test_1',
      originalQuestionId: 'orig_1',
      subject: 'math',
      topicId: 'Addition',
      topicName: 'Addition',
      level: 2,
      questionText: 'Was ist 12 + 15?',
      options: ['25', '27', '30'],
      correctAnswer: '27',
      explanation: '12 + 15 = 27',
      isVariation: false,
    };

    it('validates exact string match case-insensitively', () => {
      expect(checkAnswerCorrect('27', sampleExercise)).toBe(true);
      expect(checkAnswerCorrect(' 27 ', sampleExercise)).toBe(true);
      expect(checkAnswerCorrect('28', sampleExercise)).toBe(false);
    });

    it('supports comma and period decimal variations', () => {
      const decExercise: GeneratedExerciseItem = {
        ...sampleExercise,
        correctAnswer: '3,5',
      };
      expect(checkAnswerCorrect('3.5', decExercise)).toBe(true);
      expect(checkAnswerCorrect('3,50', decExercise)).toBe(true);
      expect(checkAnswerCorrect('3,4', decExercise)).toBe(false);
    });

    it('supports fraction answers matching numeric equivalents', () => {
      const fracExercise: GeneratedExerciseItem = {
        ...sampleExercise,
        correctAnswer: '0.5',
      };
      expect(checkAnswerCorrect('1/2', fracExercise)).toBe(true);
      expect(checkAnswerCorrect('2/4', fracExercise)).toBe(true);
    });
  });

  describe('formatTime utility function', () => {
    it('formats seconds into MM:SS format', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(3599)).toBe('59:59');
    });
  });

  describe('Practice Sheet Generation for Interactive & Print Views', () => {
    const testConfig: PracticeGeneratorConfig = {
      studentId: 'test_student_m3',
      subjectFilter: 'both',
      topics: [
        { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: true },
        { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 3, isWeakSpot: false },
      ],
      questionCount: 10,
      isTimerDisabled: true,
      seed: 12345,
    };

    it('generates a practice sheet ready for PracticeSessionView and PrintableWorksheet', () => {
      const sheet = generatePracticeSheet(testConfig);
      expect(sheet).toBeDefined();
      expect(sheet.exercises.length).toBe(10);
      expect(sheet.config.isTimerDisabled).toBe(true);

      const mathExercises = sheet.exercises.filter((e) => e.subject === 'math');
      const englishExercises = sheet.exercises.filter((e) => e.subject === 'english');

      expect(mathExercises.length).toBeGreaterThan(0);
      expect(englishExercises.length).toBeGreaterThan(0);

      sheet.exercises.forEach((ex) => {
        expect(ex.questionText).toBeTruthy();
        expect(ex.correctAnswer).toBeTruthy();
        expect(ex.explanation).toBeTruthy();
      });
    });

    it('handles timer toggle configuration cleanly', () => {
      const disabledTimerConfig: PracticeGeneratorConfig = {
        ...testConfig,
        isTimerDisabled: true,
      };
      const enabledTimerConfig: PracticeGeneratorConfig = {
        ...testConfig,
        isTimerDisabled: false,
      };

      const sheetDisabled = generatePracticeSheet(disabledTimerConfig);
      const sheetEnabled = generatePracticeSheet(enabledTimerConfig);

      expect(sheetDisabled.config.isTimerDisabled).toBe(true);
      expect(sheetEnabled.config.isTimerDisabled).toBe(false);
    });
  });
});
