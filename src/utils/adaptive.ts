import { updateSkillEstimate, levelToTheta, type StudentSkillEstimate } from './irt';

export interface Streak {
  correct: number;
  incorrect: number;
}

export interface AdaptiveResult {
  level: number;
  streak: Streak;
  theta?: number;
  standardError?: number;
  irtEstimate?: StudentSkillEstimate;
}

/**
 * Computes the next difficulty level, streak state, and IRT continuous skill estimate based on answer correctness.
 *
 * Rules:
 * - Computes continuous IRT theta and SE update using updateSkillEstimate.
 * - If isCorrect:
 *   - incorrect resets to 0.
 *   - correct increments by 1.
 *   - If correct >= 2: level increases by 1 (max 7), and correct resets to 0.
 * - If not isCorrect:
 *   - correct resets to 0.
 *   - incorrect increments by 1.
 *   - If incorrect >= 2: level decreases by 1 (min 1), and incorrect resets to 0.
 */
export function computeNextLevel(
  currentLevel: number,
  isCorrect: boolean,
  streak: Streak,
  currentTheta?: number,
  timeTakenMs?: number,
  targetTimeSec?: number
): AdaptiveResult {
  const clampedCurrentLevel = Math.max(1, Math.min(7, currentLevel));
  const initialTheta = currentTheta !== undefined ? currentTheta : levelToTheta(clampedCurrentLevel);

  const irtEstimate = updateSkillEstimate(
    initialTheta,
    clampedCurrentLevel,
    isCorrect,
    timeTakenMs,
    targetTimeSec
  );

  let nextLevel = clampedCurrentLevel;
  let newStreak: Streak = { correct: 0, incorrect: 0 };

  if (isCorrect) {
    const newCorrectStreak = streak.correct + 1;
    if (newCorrectStreak >= 2) {
      nextLevel = Math.min(7, clampedCurrentLevel + 1);
      newStreak = { correct: 0, incorrect: 0 };
    } else {
      nextLevel = clampedCurrentLevel;
      newStreak = { correct: newCorrectStreak, incorrect: 0 };
    }
  } else {
    const newIncorrectStreak = streak.incorrect + 1;
    if (newIncorrectStreak >= 2) {
      nextLevel = Math.max(1, clampedCurrentLevel - 1);
      newStreak = { correct: 0, incorrect: 0 };
    } else {
      nextLevel = clampedCurrentLevel;
      newStreak = { correct: 0, incorrect: newIncorrectStreak };
    }
  }

  return {
    level: nextLevel,
    streak: newStreak,
    theta: irtEstimate.theta,
    standardError: irtEstimate.standardError,
    irtEstimate,
  };
}

export interface StroopCalibrationInput {
  avgReactionTimeMs: number;
  accuracy: number; // 0.0 - 1.0 or 0 - 100
}

export interface StroopCalibrationResult {
  proposedLevel: number;
  recommendedTimeMultiplier: number;
  speedRating: 'sehr schnell' | 'normal' | 'bedacht';
}

/**
 * Calculates a proposed starting difficulty level (Level 1, 2, or 3)
 * and dynamic target time multiplier based on Stroop reaction speed and accuracy.
 */
export function calculateStroopCalibration(
  cognitionStats: StroopCalibrationInput
): StroopCalibrationResult {
  const { avgReactionTimeMs, accuracy } = cognitionStats;
  const normAccuracy = accuracy > 1 ? accuracy / 100 : accuracy;
  const clampedAccuracy = Math.max(0, Math.min(1, normAccuracy));

  if (clampedAccuracy >= 0.8 && avgReactionTimeMs < 1200) {
    return {
      proposedLevel: 3,
      recommendedTimeMultiplier: 0.9,
      speedRating: 'sehr schnell',
    };
  }

  if (clampedAccuracy >= 0.7 && avgReactionTimeMs < 1800) {
    return {
      proposedLevel: 2,
      recommendedTimeMultiplier: 1.0,
      speedRating: 'normal',
    };
  }

  return {
    proposedLevel: 1,
    recommendedTimeMultiplier: 1.2,
    speedRating: 'bedacht',
  };
}
