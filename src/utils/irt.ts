/**
 * Item Response Theory (IRT) Rasch / 2PL continuous scoring model.
 * 
 * Latent ability parameter theta lies in [-3.0, +3.0].
 * Mapped integer level 1..7: displayLevel = clamp(1, round(4 + theta), 7).
 */

export interface IRTItemParameters {
  difficulty: number;      // b parameter (-3.0 to +3.0)
  discrimination?: number; // a parameter (default 1.2)
  guessing?: number;       // c parameter (default 0.0 for open input, 0.25 for MC)
}

export interface StudentSkillEstimate {
  theta: number;           // Latent ability score (-3.0 to +3.0)
  standardError: number;   // SE estimation uncertainty
  displayLevel: number;    // Integer level 1..7 via clamp(1, round(4 + theta), 7)
}

/**
 * Converts a discrete level (1..7) to its canonical theta representation (-3.0 to +3.0).
 */
export function levelToTheta(level: number): number {
  const clamped = Math.max(1, Math.min(7, level));
  return clamped - 4;
}

/**
 * Converts a continuous theta (-3.0 to +3.0) to discrete display level (1..7).
 */
export function thetaToLevel(theta: number): number {
  const clampedTheta = Math.max(-3.0, Math.min(3.0, theta));
  return Math.max(1, Math.min(7, Math.round(4 + clampedTheta)));
}

/**
 * Calculates 3PL/2PL logistic response probability P(theta).
 */
export function calculateProbability(
  theta: number,
  difficulty: number,
  discrimination: number = 1.2,
  guessing: number = 0.0
): number {
  const a = Math.max(0.1, discrimination);
  const b = difficulty;
  const c = Math.max(0.0, Math.min(0.9, guessing));

  const expVal = Math.exp(-a * (theta - b));
  return c + (1 - c) / (1 + expVal);
}

/**
 * Updates continuous student skill estimate theta based on answer correctness, item level/params, and optional response time.
 */
export function updateSkillEstimate(
  currentTheta: number,
  itemLevel: number,
  isCorrect: boolean,
  timeTakenMs?: number,
  targetTimeSec?: number,
  itemParams?: IRTItemParameters
): StudentSkillEstimate {
  const theta = Math.max(-3.0, Math.min(3.0, currentTheta));
  const b = itemParams?.difficulty ?? levelToTheta(itemLevel);
  const a = itemParams?.discrimination ?? 1.2;
  const c = itemParams?.guessing ?? 0.0;

  const P = calculateProbability(theta, b, a, c);
  const y = isCorrect ? 1 : 0;
  const error = y - P;

  // Base learning rate / step modifier
  let stepMultiplier = 0.5;

  // Response time adjustment: bonus for fast correct answers, mild dampening for very slow responses
  if (timeTakenMs !== undefined && targetTimeSec !== undefined && targetTimeSec > 0) {
    const targetMs = targetTimeSec * 1000;
    if (isCorrect && timeTakenMs < 0.5 * targetMs) {
      // Fast correct answer: up to +20% step size
      const speedRatio = (0.5 * targetMs - timeTakenMs) / (0.5 * targetMs);
      stepMultiplier *= (1.0 + 0.2 * speedRatio);
    } else if (timeTakenMs > 1.2 * targetMs) {
      // Exceeded time target: slightly smaller step
      stepMultiplier *= 0.85;
    }
  }

  const deltaTheta = stepMultiplier * error;
  const newTheta = Math.max(-3.0, Math.min(3.0, theta + deltaTheta));

  // Fisher Information I(theta) for SE estimation
  const info = Math.pow(a, 2) * P * (1 - P);
  const standardError = Number((1.0 / Math.sqrt(info + 0.35)).toFixed(3));

  const displayLevel = thetaToLevel(newTheta);

  return {
    theta: Number(newTheta.toFixed(3)),
    standardError,
    displayLevel,
  };
}
