import { describe, it, expect } from 'vitest';
import { computeNextLevel, calculateStroopCalibration, type Streak } from '../utils/adaptive';

describe('Tier 1-4: IRT Scoring & Skill Adaptivity Engine (Feature F1)', () => {
  // --- TIER 1: UNIT & FEATURE COVERAGE ---
  describe('Tier 1: Feature Coverage (F1)', () => {
    it('initial state starts with zero streak and maintains level on single correct answer', () => {
      const initialStreak: Streak = { correct: 0, incorrect: 0 };
      const res = computeNextLevel(1, true, initialStreak);
      expect(res.level).toBe(1);
      expect(res.streak.correct).toBe(1);
      expect(res.streak.incorrect).toBe(0);
    });

    it('advances difficulty level by +1 after 2 consecutive correct answers', () => {
      const initialStreak: Streak = { correct: 0, incorrect: 0 };
      const step1 = computeNextLevel(2, true, initialStreak);
      expect(step1.level).toBe(2);
      expect(step1.streak.correct).toBe(1);

      const step2 = computeNextLevel(step1.level, true, step1.streak);
      expect(step2.level).toBe(3);
      expect(step2.streak.correct).toBe(0);
      expect(step2.streak.incorrect).toBe(0);
    });

    it('resets correct streak and increments incorrect streak on a single error without level jump', () => {
      const activeStreak: Streak = { correct: 1, incorrect: 0 };
      const res = computeNextLevel(4, false, activeStreak);
      expect(res.level).toBe(4);
      expect(res.streak.correct).toBe(0);
      expect(res.streak.incorrect).toBe(1);
    });

    it('decreases difficulty level by -1 after 2 consecutive incorrect answers', () => {
      const incorrectStreak: Streak = { correct: 0, incorrect: 1 };
      const res = computeNextLevel(5, false, incorrectStreak);
      expect(res.level).toBe(4);
      expect(res.streak.correct).toBe(0);
      expect(res.streak.incorrect).toBe(0);
    });
  });

  // --- TIER 2: BOUNDARY VALUE ANALYSIS & CORNER CASES ---
  describe('Tier 2: Boundary Values & Edge Cases', () => {
    it('clamps lower boundary level at Level 1 on repeated incorrect answers', () => {
      let currentLevel = 1;
      let streak: Streak = { correct: 0, incorrect: 0 };

      for (let i = 0; i < 10; i++) {
        const res = computeNextLevel(currentLevel, false, streak);
        currentLevel = res.level;
        streak = res.streak;
        expect(currentLevel).toBeGreaterThanOrEqual(1);
      }
      expect(currentLevel).toBe(1);
    });

    it('clamps upper boundary level at Level 7 on repeated correct answers', () => {
      let currentLevel = 6;
      let streak: Streak = { correct: 0, incorrect: 0 };

      for (let i = 0; i < 10; i++) {
        const res = computeNextLevel(currentLevel, true, streak);
        currentLevel = res.level;
        streak = res.streak;
        expect(currentLevel).toBeLessThanOrEqual(7);
      }
      expect(currentLevel).toBe(7);
    });

    it('handles out-of-range initial levels gracefully (<1 or >7)', () => {
      const lowBound = computeNextLevel(-5, true, { correct: 0, incorrect: 0 });
      expect(lowBound.level).toBe(1);

      const highBound = computeNextLevel(100, false, { correct: 0, incorrect: 0 });
      expect(highBound.level).toBe(7);
    });
  });

  // --- TIER 3: CROSS-FEATURE INTEGRATION ---
  describe('Tier 3: Integration with Cognitive Calibration', () => {
    it('integrates Stroop reaction speed calibration into initial adaptive level setting', () => {
      const fastCognition = calculateStroopCalibration({ avgReactionTimeMs: 800, accuracy: 0.95 });
      expect(fastCognition.proposedLevel).toBe(3);
      expect(fastCognition.recommendedTimeMultiplier).toBe(0.9);

      // Starting at calibrated proposed level 3
      const step1 = computeNextLevel(fastCognition.proposedLevel, true, { correct: 0, incorrect: 0 });
      expect(step1.level).toBe(3);
      const step2 = computeNextLevel(step1.level, true, step1.streak);
      expect(step2.level).toBe(4);
    });
  });

  // --- TIER 4: REAL-WORLD ADAPTIVITY WORKLOAD JOURNEY ---
  describe('Tier 4: Real-World Student Adaptive Journey Simulation', () => {
    it('simulates a complete 10-question adaptive trajectory without volatile jumps', () => {
      let level = 1;
      let streak: Streak = { correct: 0, incorrect: 0 };
      const levelsVisited: number[] = [level];

      const studentAnswers = [true, true, true, true, false, true, false, false, true, true];

      for (const isCorrect of studentAnswers) {
        const res = computeNextLevel(level, isCorrect, streak);
        level = res.level;
        streak = res.streak;
        levelsVisited.push(level);
      }

      // Assert smooth progression curve
      expect(levelsVisited[0]).toBe(1); // Start at level 1
      expect(levelsVisited[2]).toBe(2); // Level 2 after 2 correct answers (q0, q1)
      expect(levelsVisited[4]).toBe(3); // Level 3 after 4 correct answers (q2, q3)
      expect(levelsVisited[5]).toBe(3); // Single error (q4) does NOT drop level
      expect(levelsVisited[6]).toBe(3); // Correct answer (q5) keeps level 3
      expect(levelsVisited[7]).toBe(3); // First error (q6) keeps level 3
      expect(levelsVisited[8]).toBe(2); // Second consecutive error (q7) drops level to 2
      expect(levelsVisited[10]).toBe(3); // Recovery to Level 3 after q8 & q9
    });
  });
});
