import { describe, it, expect } from './testRunner';
import { computeNextLevel, calculateStroopCalibration, type Streak } from './adaptive';

describe('Adaptive difficulty & Stroop calibration suite', () => {
  const initialStreak: Streak = { correct: 0, incorrect: 0 };

  it('1 correct answer does NOT increase level', () => {
    const step1 = computeNextLevel(1, true, initialStreak);
    expect(step1.level).toBe(1);
    expect(step1.streak.correct).toBe(1);
    expect(step1.streak.incorrect).toBe(0);
  });

  it('2 consecutive correct answers DO increase level (+1)', () => {
    const step1 = computeNextLevel(1, true, initialStreak);
    const step2 = computeNextLevel(step1.level, true, step1.streak);
    expect(step2.level).toBe(2);
    expect(step2.streak.correct).toBe(0);
    expect(step2.streak.incorrect).toBe(0);
  });

  it('1 wrong answer resets correct streak and increments incorrect streak', () => {
    const streakWithOneCorrect: Streak = { correct: 1, incorrect: 0 };
    const step3 = computeNextLevel(3, false, streakWithOneCorrect);
    expect(step3.level).toBe(3);
    expect(step3.streak.correct).toBe(0);
    expect(step3.streak.incorrect).toBe(1);
  });

  it('2 consecutive wrong answers DO decrease level (-1)', () => {
    const streakWithOneIncorrect: Streak = { correct: 0, incorrect: 1 };
    const step4 = computeNextLevel(4, false, streakWithOneIncorrect);
    expect(step4.level).toBe(3);
    expect(step4.streak.correct).toBe(0);
    expect(step4.streak.incorrect).toBe(0);
  });

  it('Clamps minimum level at Level 1', () => {
    const step = computeNextLevel(1, false, { correct: 0, incorrect: 1 });
    expect(step.level).toBe(1);
    expect(step.streak.incorrect).toBe(0);
  });

  it('Clamps maximum level at Level 7', () => {
    const step = computeNextLevel(7, true, { correct: 1, incorrect: 0 });
    expect(step.level).toBe(7);
    expect(step.streak.correct).toBe(0);
  });

  it('Stroop Calibration: Fast reaction & high accuracy -> Level 3', () => {
    const fastHighAcc = calculateStroopCalibration({ avgReactionTimeMs: 950, accuracy: 0.9 });
    expect(fastHighAcc.proposedLevel).toBe(3);
    expect(fastHighAcc.recommendedTimeMultiplier).toBe(0.9);
    expect(fastHighAcc.speedRating).toBe('sehr schnell');
  });

  it('Stroop Calibration: Medium reaction & accuracy -> Level 2', () => {
    const mediumPerf = calculateStroopCalibration({ avgReactionTimeMs: 1450, accuracy: 0.75 });
    expect(mediumPerf.proposedLevel).toBe(2);
    expect(mediumPerf.recommendedTimeMultiplier).toBe(1.0);
    expect(mediumPerf.speedRating).toBe('normal');
  });

  it('Stroop Calibration: Low accuracy or slow reaction -> Level 1', () => {
    const lowPerf = calculateStroopCalibration({ avgReactionTimeMs: 2100, accuracy: 0.5 });
    expect(lowPerf.proposedLevel).toBe(1);
    expect(lowPerf.recommendedTimeMultiplier).toBe(1.2);
    expect(lowPerf.speedRating).toBe('bedacht');
  });
});
