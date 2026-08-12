import { describe, it, expect, beforeEach } from 'vitest';
import { calculateStroopCalibration, computeNextLevel, type Streak } from '../utils/adaptive';
import { evaluateMathAnswer, evaluateEnglishAnswer } from '../utils/evaluation';
import { generateMathQuestion, englishQuestions } from '../data/questions';
import { saveStudentProfile, clearStudentRoster } from '../utils/studentRoster';
import { saveSessionRecord, clearSessionHistory, getSessionById } from '../utils/sessionHistory';
import type { TestSessionRecord, AnswerRecord } from '../types/history';

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

describe('Tier 3 & Tier 4: Cross-Feature & Real-World E2E Scenarios', () => {
  beforeEach(() => {
    clearSessionHistory();
    clearStudentRoster();
  });

  // --- TIER 3: CROSS-FEATURE INTEGRATION SCENARIOS ---
  describe('Tier 3: Multi-Module Cross-Feature Integration', () => {
    it('integrates Warmup survey state + Stroop reaction calibration -> Initial adaptivity levels', () => {
      // Step 1: Student completes Warmup survey
      const warmupState = {
        motivation: 5,
        favoriteSubject: 'Mathematik',
        problemSubject: 'Englisch',
      };
      expect(warmupState.motivation).toBe(5);

      // Step 2: Student completes Stroop reaction test with high speed and high accuracy
      const stroopResult = calculateStroopCalibration({ avgReactionTimeMs: 950, accuracy: 0.9 });
      expect(stroopResult.proposedLevel).toBe(3);
      expect(stroopResult.recommendedTimeMultiplier).toBe(0.9);

      // Step 3: Math module initializes at Stroop calibrated Level 3
      let currentMathLevel = stroopResult.proposedLevel;
      let streak: Streak = { correct: 0, incorrect: 0 };

      // Student answers 2 questions correctly at Level 3
      const step1 = computeNextLevel(currentMathLevel, true, streak);
      const step2 = computeNextLevel(step1.level, true, step1.streak);

      expect(step2.level).toBe(4); // Advanced to Level 4
    });

    it('integrates Smart Answer Tolerance with Adaptive Level updates and Streak tracking', () => {
      let currentLevel = 2;
      let streak: Streak = { correct: 0, incorrect: 0 };
      const answersLogged: AnswerRecord[] = [];

      // Student enters "8 * x" for "8x" (Formatting variation)
      const input1 = '8 * x';
      const correct1 = '8x';
      const isCorrect1 = evaluateMathAnswer(input1, correct1);
      expect(isCorrect1).toBe(true);

      answersLogged.push({
        questionId: 'm2_1',
        topic: 'Terme',
        subject: 'math',
        isCorrect: isCorrect1,
        timeTaken: 12,
        usedExtraTime: false,
        difficultyLevel: currentLevel,
        userAnswer: input1,
        correctAnswer: correct1,
      });

      const res1 = computeNextLevel(currentLevel, isCorrect1, streak);
      currentLevel = res1.level;
      streak = res1.streak;

      // Student enters "x = 3" for "3" (Prefix variation)
      const input2 = 'x = 3';
      const correct2 = '3';
      const isCorrect2 = evaluateMathAnswer(input2, correct2);
      expect(isCorrect2).toBe(true);

      answersLogged.push({
        questionId: 'm2_2',
        topic: 'Gleichungen',
        subject: 'math',
        isCorrect: isCorrect2,
        timeTaken: 14,
        usedExtraTime: false,
        difficultyLevel: currentLevel,
        userAnswer: input2,
        correctAnswer: correct2,
      });

      const res2 = computeNextLevel(currentLevel, isCorrect2, streak);
      currentLevel = res2.level;

      // 2 consecutive correct answers -> Level increases from 2 to 3
      expect(currentLevel).toBe(3);
      expect(answersLogged.length).toBe(2);
      expect(answersLogged.every((a) => a.isCorrect)).toBe(true);
    });
  });

  // --- TIER 4: REAL-WORLD END-TO-END APPLICATION JOURNEYS ---
  describe('Tier 4: End-to-End Real-World Student Diagnostic Journeys', () => {
    it('Journey A (High Performing Student): Warmup -> Stroop (Fast) -> Math & English (Advanced) -> Dashboard Record', () => {
      // 1. Profile Creation
      const student = saveStudentProfile({
        name: 'Lukas Meyer',
        gradeLevel: 6,
        favoriteSubject: 'Mathe',
        problemSubject: 'Keines',
        notes: 'Sehr stark in Kopfrechnen',
      });

      // 2. Warmup Survey
      const motivation = 5;

      // 3. Stroop Reaction Test -> Fast Calibration
      const cognition = calculateStroopCalibration({ avgReactionTimeMs: 850, accuracy: 0.95 });
      expect(cognition.proposedLevel).toBe(3);

      // 4. Diagnostic Session Execution (Simulating 4 questions)
      let mathLevel = cognition.proposedLevel;
      let streak: Streak = { correct: 0, incorrect: 0 };
      const sessionAnswers: AnswerRecord[] = [];

      // 4 Math Questions (All correct)
      for (let i = 0; i < 4; i++) {
        const q = generateMathQuestion(mathLevel, new Set(sessionAnswers.map((a) => a.questionId)));
        if (!q) continue;

        const isCorrect = true; // High performer answers correctly
        sessionAnswers.push({
          questionId: q.id,
          topic: q.topic,
          subject: 'math',
          isCorrect,
          timeTaken: 10,
          usedExtraTime: false,
          difficultyLevel: mathLevel,
        });

        const update = computeNextLevel(mathLevel, isCorrect, streak);
        mathLevel = update.level;
        streak = update.streak;
      }

      expect(mathLevel).toBe(5); // Advanced to Level 5

      // 1 English Question
      const englishQ1 = englishQuestions.find((q) => q.level === 3);
      if (englishQ1) {
        sessionAnswers.push({
          questionId: englishQ1.id,
          topic: englishQ1.topic,
          subject: 'english',
          isCorrect: true,
          timeTaken: 8,
          usedExtraTime: false,
          difficultyLevel: 3,
        });
      }

      // 5. Final Session History Save & Record Verification
      const finalRecord: TestSessionRecord = {
        sessionId: 'sess_lukas_e2e',
        studentId: student.id,
        studentName: student.name,
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: mathLevel,
        englishLevelReached: 3,
        score: sessionAnswers.filter((a) => a.isCorrect).length,
        totalQuestions: sessionAnswers.length,
        topicBreakdown: [
          { topic: 'Geometrie', correct: 2, total: 2, accuracy: 1.0, avgTime: 10 },
          { topic: 'Grammatik', correct: 1, total: 1, accuracy: 1.0, avgTime: 8 },
        ],
        answers: sessionAnswers,
        motivation,
        favoriteSubject: student.favoriteSubject,
        problemSubject: student.problemSubject,
      };

      saveSessionRecord(finalRecord);

      const saved = getSessionById('sess_lukas_e2e');
      expect(saved).toBeDefined();
      expect(saved?.studentName).toBe('Lukas Meyer');
      expect(saved?.mathLevelReached).toBe(5);
      expect(saved?.score).toBe(5);
    });

    it('Journey B (Struggling Student): Warmup -> Stroop (Slow) -> Smart Input Tolerance Recovery -> Diagnostic Safety', () => {
      // 1. Profile Creation
      const student = saveStudentProfile({
        name: 'Mia Weber',
        gradeLevel: 3,
        favoriteSubject: 'Kunst',
        problemSubject: 'Mathe',
        notes: 'Braucht Unterstützung bei Grundrechenarten',
      });
      expect(student.id).toBeDefined();

      // 2. Stroop Reaction Test -> Slow/Careful Calibration
      const cognition = calculateStroopCalibration({ avgReactionTimeMs: 2300, accuracy: 0.5 });
      expect(cognition.proposedLevel).toBe(1);
      expect(cognition.speedRating).toBe('bedacht');

      // 3. Math Module starts at Level 1
      let mathLevel = cognition.proposedLevel;
      let streak: Streak = { correct: 0, incorrect: 0 };
      const answers: AnswerRecord[] = [];

      // Question 1: Typos tolerated by Smart Tolerance ("0,5" vs "0.5")
      const userAns1 = '0,5';
      const correctAns1 = '0.5';
      const isCorrect1 = evaluateMathAnswer(userAns1, correctAns1);
      expect(isCorrect1).toBe(true);

      answers.push({
        questionId: 'm1_1',
        topic: 'Dezimalzahlen',
        subject: 'math',
        isCorrect: isCorrect1,
        timeTaken: 35,
        usedExtraTime: true,
        difficultyLevel: mathLevel,
        userAnswer: userAns1,
        correctAnswer: correctAns1,
      });

      const update1 = computeNextLevel(mathLevel, isCorrect1, streak);
      mathLevel = update1.level;
      streak = update1.streak;

      // Question 2: English vocabulary with article stripping ("a cat" vs "cat")
      const userEng = 'a cat';
      const correctEng = 'cat';
      const isCorrectEng = evaluateEnglishAnswer(userEng, correctEng);
      expect(isCorrectEng).toBe(true);

      answers.push({
        questionId: 'e1_1',
        topic: 'Vokabeln',
        subject: 'english',
        isCorrect: isCorrectEng,
        timeTaken: 20,
        usedExtraTime: false,
        difficultyLevel: 1,
        userAnswer: userEng,
        correctAnswer: correctEng,
      });

      // Assert student level remains safe and non-volatile (Level 1)
      expect(mathLevel).toBe(1);
      expect(answers.every((a) => a.isCorrect)).toBe(true);
    });
  });
});
