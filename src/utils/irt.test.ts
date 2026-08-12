import { describe, it, expect } from './testRunner';
import {
  levelToTheta,
  thetaToLevel,
  calculateProbability,
  updateSkillEstimate,
} from './irt';

describe('IRT Scoring Engine suite', () => {
  it('correctly maps discrete levels 1..7 to theta [-3..+3] and back', () => {
    expect(levelToTheta(1)).toBe(-3);
    expect(levelToTheta(4)).toBe(0);
    expect(levelToTheta(7)).toBe(3);

    expect(thetaToLevel(-3.0)).toBe(1);
    expect(thetaToLevel(-0.25)).toBe(4);
    expect(thetaToLevel(0.0)).toBe(4);
    expect(thetaToLevel(0.49)).toBe(4);
    expect(thetaToLevel(0.51)).toBe(5);
    expect(thetaToLevel(3.0)).toBe(7);
  });

  it('calculates logistic probability P(theta) correctly', () => {
    // When theta == difficulty b, 2PL P(theta) is 0.5
    const probAtDiff = calculateProbability(0.0, 0.0);
    expect(probAtDiff).toBeCloseTo(0.5, 4);

    // Higher theta -> higher probability
    const probHigh = calculateProbability(1.5, 0.0);
    expect(probHigh).toBeGreaterThan(0.5);

    // Lower theta -> lower probability
    const probLow = calculateProbability(-1.5, 0.0);
    expect(probLow).toBeLessThan(0.5);
  });

  it('prevents single-error volatility: 1 wrong answer on level 4 keeps level at 4', () => {
    const initialTheta = levelToTheta(4); // 0.0
    const result = updateSkillEstimate(initialTheta, 4, false);

    expect(result.theta).toBeLessThan(0.0);
    expect(result.displayLevel).toBe(4); // Level remains 4!
  });

  it('converges theta smoothly towards +3.0 over multiple correct answers', () => {
    let currentTheta = 0.0;
    for (let i = 1; i <= 8; i++) {
      const itemLevel = thetaToLevel(currentTheta);
      const res = updateSkillEstimate(currentTheta, itemLevel, true);
      expect(res.theta).toBeGreaterThan(currentTheta);
      currentTheta = res.theta;
    }
    expect(currentTheta).toBeGreaterThan(1.2);
    expect(thetaToLevel(currentTheta)).toBeGreaterThanOrEqual(5);
  });

  it('converges theta smoothly towards -3.0 over multiple wrong answers', () => {
    let currentTheta = 0.0;
    for (let i = 1; i <= 8; i++) {
      const itemLevel = thetaToLevel(currentTheta);
      const res = updateSkillEstimate(currentTheta, itemLevel, false);
      expect(res.theta).toBeLessThan(currentTheta);
      currentTheta = res.theta;
    }
    expect(currentTheta).toBeLessThan(-1.2);
    expect(thetaToLevel(currentTheta)).toBeLessThanOrEqual(3);
  });

  it('rewards fast correct answers with higher theta boost', () => {
    const slowRes = updateSkillEstimate(0.0, 4, true, 20000, 30);
    const fastRes = updateSkillEstimate(0.0, 4, true, 3000, 30);

    expect(fastRes.theta).toBeGreaterThan(slowRes.theta);
  });
});
