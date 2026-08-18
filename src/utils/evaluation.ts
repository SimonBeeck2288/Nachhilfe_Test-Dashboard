import type { AnswerRecord } from '../context/TestSessionContext';
import type { AbTestComparisonMetrics } from '../types/history';

/**
 * Normalizes an English string by lowercasing, stripping punctuation,
 * and collapsing internal whitespace.
 */
export function normalizeEnglishString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[.,!?"'“”‘’«»„]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Evaluates whether a user's English answer matches the correct answer with tolerance for:
 * - Case insensitivity
 * - Surrounding / internal extra whitespace
 * - Punctuation differences (. , ! ? " ' “ ” ‘ ’ « » „)
 * - Leading articles (a, an, the) when the correct answer does not explicitly mandate an article.
 * - Multi-option answer arrays (string | string[])
 * - Synonym arrays provided in synonyms parameter
 */
export function evaluateEnglishAnswer(
  userAnswer: string,
  correctAnswer: string | string[],
  synonyms?: Record<string, string[]>
): boolean {
  if (typeof userAnswer !== 'string' || (correctAnswer === undefined || correctAnswer === null)) {
    return false;
  }

  const normUser = normalizeEnglishString(userAnswer);
  const articleRegex = /^(a|an|the)\s+/i;
  const normUserNoArticle = normUser.replace(articleRegex, '');

  const correctTargets = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

  for (const target of correctTargets) {
    if (typeof target !== 'string') continue;

    const normCorrect = normalizeEnglishString(target);
    const normCorrectNoArticle = normCorrect.replace(articleRegex, '');

    // 1. Direct match or article-stripped match
    if (normUser === normCorrect || normUserNoArticle === normCorrectNoArticle) {
      return true;
    }

    // 2. Synonym matching
    if (synonyms) {
      const synList =
        synonyms[normCorrect] ||
        synonyms[normCorrectNoArticle] ||
        synonyms[target] ||
        [];

      for (const syn of synList) {
        const normSyn = normalizeEnglishString(syn);
        const normSynNoArticle = normSyn.replace(articleRegex, '');
        if (normUser === normSyn || normUserNoArticle === normSynNoArticle) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Normalizes a Math string by lowercasing, replacing decimal commas with dots,
 * stripping single-variable equation prefixes (e.g., "x=", "x = "), stripping whitespace around operators,
 * stripping common unit suffixes, and normalizing coefficient-variable products (e.g. 8 * x -> 8x, x * 8 -> 8x, 8 x -> 8x).
 */
export function normalizeMathString(str: string): string {
  if (typeof str !== 'string') return '';

  let s = str.toLowerCase().trim();

  // Convert unicode superscripts to standard caret notation (^0..^9) before stripping operator spaces
  const superscriptMap: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
    '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'
  };
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (m) => superscriptMap[m] || m);

  // Replace decimal commas with dots
  s = s.replace(/,/g, '.');

  // Strip single-variable equation prefixes like "x=", "x = ", "y = ", "a=", "ans = "
  s = s.replace(/^(?:[a-z]|ans|result)\s*=\s*/i, '');

  // Strip common math/geometry/physics units
  s = s.replace(/\s*(cm³|cm\^3|m³|m\^3|cm²|cm\^2|cm|m²|m\^2|m|mm|km|%|°|grad)(?!\w)/gi, '');

  // Strip whitespace around math operators (+, -, *, /, =, ^)
  s = s.replace(/\s*([+\-*/=^])\s*/g, '$1');

  // Normalize multiplication / gaps between coefficient and variable:
  // e.g. 8*x -> 8x
  s = s.replace(/(\d+(?:\.\d+)?)\*([a-z])/gi, '$1$2');
  // e.g. x*8 -> 8x
  s = s.replace(/([a-z])\*(\d+(?:\.\d+)?)/gi, '$2$1');
  // e.g. 8 x -> 8x
  s = s.replace(/(\d+(?:\.\d+)?)\s+([a-z])/gi, '$1$2');
  // e.g. x 8 -> 8x
  s = s.replace(/([a-z])\s+(\d+(?:\.\d+)?)/gi, '$2$1');

  return s.trim();
}

/**
 * Parses a string into a number if possible, supporting standard floating point
 * representation, mixed fractions like "1 1/2" or "-2 3/4", and simple fractions like "1/2" or "-3.5/4".
 */
export function parseMathNumber(str: string): number | null {
  const trimmed = str.trim();
  if (trimmed === '') return null;

  // Direct number parsing
  const val = Number(trimmed);
  if (!isNaN(val)) {
    return val;
  }

  // Mixed fraction parsing: "1 1/2" -> 1.5 or "-2 3/4" -> -2.75
  const mixedMatch = trimmed.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
      const frac = num / den;
      return whole >= 0 ? whole + frac : whole - frac;
    }
  }

  // Fraction parsing: "1/2" or "-3.5/4"
  const fractionMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  return null;
}

/**
 * Evaluates whether a user's Math answer matches the correct answer with tolerance for:
 * - Case insensitivity (8X -> 8x)
 * - Decimal commas vs dots (0,5 -> 0.5)
 * - Equation prefixes (x = 3 vs 3)
 * - Space around operators and coefficient-variable forms (8 * x, x * 8, 8 x -> 8x)
 * - Epsilon numerical equivalence (1e-4 tolerance)
 * - Multi-option answer arrays (string | string[])
 */
export function evaluateMathAnswer(
  userAnswer: string,
  correctAnswer: string | string[]
): boolean {
  if (typeof userAnswer !== 'string' || (correctAnswer === undefined || correctAnswer === null)) {
    return false;
  }

  const correctTargets = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const normUser = normalizeMathString(userAnswer);
  const numUser = parseMathNumber(normUser);

  for (const target of correctTargets) {
    if (typeof target !== 'string') continue;

    const normCorrect = normalizeMathString(target);

    // 1. Direct normalized string comparison
    if (normUser === normCorrect) {
      return true;
    }

    // 2. Numerical comparison if both sides parse as numbers (with epsilon 1e-4)
    const numCorrect = parseMathNumber(normCorrect);
    if (numUser !== null && numCorrect !== null) {
      if (Math.abs(numUser - numCorrect) <= 1e-4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates a stress-free soft score for a response.
 * Full points (100) if answered correctly within target time.
 * If time exceeded, point value decays smoothly up to 50% max penalty.
 * Returns 0 points if answer is incorrect.
 */
export function calculateSoftScore(
  isCorrect: boolean,
  timeTakenSec: number,
  targetTimeSec: number
): number {
  if (!isCorrect) return 0;
  const basePoints = 100;
  if (timeTakenSec <= targetTimeSec) return basePoints;
  const overtime = timeTakenSec - targetTimeSec;
  const penaltyRatio = Math.min(0.5, overtime * 0.02); // Maximum 50% decay (min 50 pts)
  return Math.round(basePoints * (1 - penaltyRatio));
}

/**
 * Computes comparative A/B test analytics between Standard narrative questions
 * and Direct & sensory-reduced questions.
 */
export function computeAbComparisonMetrics(answers: AnswerRecord[]): AbTestComparisonMetrics | null {
  if (!answers || answers.length === 0) return null;

  const standardAnswers = answers.filter((a) => a.modeVariant === 'standard');
  const directAnswers = answers.filter((a) => a.modeVariant === 'direct');

  if (standardAnswers.length === 0 || directAnswers.length === 0) {
    return null;
  }

  const standardCorrect = standardAnswers.filter((a) => a.isCorrect).length;
  const standardTotal = standardAnswers.length;
  const standardAcc = standardTotal > 0 ? standardCorrect / standardTotal : 0;
  const standardTotalTime = standardAnswers.reduce(
    (acc, curr) => acc + (typeof curr.timeTaken === 'number' && Number.isFinite(curr.timeTaken) && curr.timeTaken >= 0 ? curr.timeTaken : 0),
    0
  );
  const standardAvgTime = standardTotal > 0 ? standardTotalTime / standardTotal : 0;

  const directCorrect = directAnswers.filter((a) => a.isCorrect).length;
  const directTotal = directAnswers.length;
  const directAcc = directTotal > 0 ? directCorrect / directTotal : 0;
  const directTotalTime = directAnswers.reduce(
    (acc, curr) => acc + (typeof curr.timeTaken === 'number' && Number.isFinite(curr.timeTaken) && curr.timeTaken >= 0 ? curr.timeTaken : 0),
    0
  );
  const directAvgTime = directTotal > 0 ? directTotalTime / directTotal : 0;

  // Accuracy gain in percentage points (e.g. +25.0%)
  const accuracyGainPercent = Math.round((directAcc - standardAcc) * 1000) / 10;

  // Speedup percent: ((standardAvgTime - directAvgTime) / standardAvgTime) * 100
  let speedupPercent = 0;
  if (standardAvgTime > 0) {
    speedupPercent = Math.round(((standardAvgTime - directAvgTime) / standardAvgTime) * 1000) / 10;
  }

  let recommendation: 'recommend_direct' | 'recommend_standard' | 'neutral' = 'neutral';
  let recommendationReason = 'Beide Modi führten zu vergleichbaren Ergebnissen bei Genauigkeit und Bearbeitungszeit.';

  if (accuracyGainPercent >= 10 || (speedupPercent >= 15 && accuracyGainPercent >= -5)) {
    recommendation = 'recommend_direct';
    if (accuracyGainPercent >= 10 && speedupPercent >= 15) {
      recommendationReason = `Deutliche Steigerung der Trefferquote (+${accuracyGainPercent}%) und ${speedupPercent}% schnellere Bearbeitung im direkt-reizarmen Modus.`;
    } else if (accuracyGainPercent >= 10) {
      recommendationReason = `Signifikant höhere Genauigkeit (+${accuracyGainPercent}%) bei sachlich-direkten Aufgabenstellungen.`;
    } else {
      recommendationReason = `Messbarer Geschwindigkeitsvorteil (${speedupPercent}% schneller) bei stabiler Genauigkeit im direkt-reizarmen Modus.`;
    }
  } else if (accuracyGainPercent <= -10 || (speedupPercent <= -20 && accuracyGainPercent <= 0)) {
    recommendation = 'recommend_standard';
    recommendationReason = 'Der Standard-Modus mit narrativer Einbettung bot bessere Verständlichkeit und Trefferquote.';
  }

  return {
    standard: {
      total: standardTotal,
      correct: standardCorrect,
      accuracy: standardAcc,
      avgTime: standardAvgTime,
    },
    direct: {
      total: directTotal,
      correct: directCorrect,
      accuracy: directAcc,
      avgTime: directAvgTime,
    },
    accuracyGainPercent,
    speedupPercent,
    recommendation,
    recommendationReason,
  };
}
