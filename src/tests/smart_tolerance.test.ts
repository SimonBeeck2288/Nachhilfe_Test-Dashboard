import { describe, it, expect } from 'vitest';
import {
  evaluateEnglishAnswer,
  evaluateMathAnswer,
  normalizeEnglishString,
  normalizeMathString,
  parseMathNumber,
} from '../utils/evaluation';

describe('Tier 1-4: Smart Input Tolerance & Answer Parsing (Feature F2)', () => {
  // --- TIER 1: FEATURE COVERAGE (ENGLISH & MATH EVALUATION) ---
  describe('Tier 1: Feature Coverage (F2)', () => {
    it('evaluates English answers with article stripping ("a", "an", "the")', () => {
      expect(evaluateEnglishAnswer('dog', 'a dog')).toBe(true);
      expect(evaluateEnglishAnswer('a dog', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('the dog', 'a dog')).toBe(true);
      expect(evaluateEnglishAnswer('an apple', 'apple')).toBe(true);
      expect(evaluateEnglishAnswer('cat', 'a dog')).toBe(false);
    });

    it('evaluates English answers with case and punctuation insensitivity', () => {
      expect(normalizeEnglishString('  "Dog!"  ')).toBe('dog');
      expect(evaluateEnglishAnswer('DOG', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('Dog.', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('  "apple!"  ', 'apple')).toBe(true);
    });

    it('evaluates Math answers with term normalization (8*x, 8X, x*8, 8 x -> 8x)', () => {
      expect(evaluateMathAnswer('8 * x', '8x')).toBe(true);
      expect(evaluateMathAnswer('8X', '8x')).toBe(true);
      expect(evaluateMathAnswer('x * 8', '8x')).toBe(true);
      expect(evaluateMathAnswer('8 x', '8x')).toBe(true);
    });

    it('evaluates Math answers with single-variable equation prefix stripping (x = 3 vs 3)', () => {
      expect(evaluateMathAnswer('x = 3', '3')).toBe(true);
      expect(evaluateMathAnswer('3', 'x = 3')).toBe(true);
      expect(evaluateMathAnswer('x=3', '3')).toBe(true);
      expect(evaluateMathAnswer('y = 12', '12')).toBe(true);
    });

    it('evaluates Math answers with decimal comma tolerance and unit stripping', () => {
      expect(evaluateMathAnswer('0,5', '0.5')).toBe(true);
      expect(evaluateMathAnswer('12,5 cm', '12.5')).toBe(true);
      expect(evaluateMathAnswer('25 cm²', '25')).toBe(true);
      expect(evaluateMathAnswer('90°', '90')).toBe(true);
    });
  });

  // --- TIER 2: BOUNDARY VALUE ANALYSIS & CORNER CASES ---
  describe('Tier 2: Boundary Values & Edge Cases', () => {
    it('handles empty strings and null/non-string inputs gracefully', () => {
      expect(evaluateEnglishAnswer('', 'dog')).toBe(false);
      // @ts-ignore
      expect(evaluateEnglishAnswer(null, 'dog')).toBe(false);
      // @ts-ignore
      expect(evaluateEnglishAnswer(undefined, 'dog')).toBe(false);

      expect(evaluateMathAnswer('', '5')).toBe(false);
      // @ts-ignore
      expect(evaluateMathAnswer(null, '5')).toBe(false);
      // @ts-ignore
      expect(evaluateMathAnswer(undefined, '5')).toBe(false);
    });

    it('parses complex mixed fractions and negative numerators/denominators', () => {
      expect(parseMathNumber('1 1/2')).toBe(1.5);
      expect(parseMathNumber('-2 3/4')).toBe(-2.75);
      expect(parseMathNumber('3/4')).toBe(0.75);
      expect(parseMathNumber('-6/2')).toBe(-3);
      expect(parseMathNumber('invalid/fraction')).toBeNull();
      expect(parseMathNumber('5/0')).toBeNull(); // Division by zero protection
    });

    it('evaluates numerical equivalence within 1e-4 epsilon margin', () => {
      expect(evaluateMathAnswer('3.00001', '3')).toBe(true);
      expect(evaluateMathAnswer('3.001', '3')).toBe(false);
      expect(evaluateMathAnswer('1/3', '0.33333')).toBe(true);
    });

    it('normalizes unicode superscripts correctly', () => {
      expect(normalizeMathString('x² + 6x + 9')).toBe('x^2+6x+9');
      expect(normalizeMathString('x³')).toBe('x^3');
      expect(evaluateMathAnswer('x² + 6x + 9', 'x^2 + 6x + 9')).toBe(true);
    });
  });

  // --- TIER 3: CROSS-FEATURE PARSING COMBINATIONS ---
  describe('Tier 3: Multi-Format Combination Testing', () => {
    it('combines equation prefix, decimal comma, and unit stripping simultaneously', () => {
      expect(evaluateMathAnswer('x = 12,5 cm²', '12.5')).toBe(true);
      expect(evaluateMathAnswer('  A = 3,14  ', '3.14')).toBe(true);
    });

    it('combines mixed fraction parsing with numerical answer comparison', () => {
      expect(evaluateMathAnswer('1 1/2', '1.5')).toBe(true);
      expect(evaluateMathAnswer('3/2', '1 1/2')).toBe(true);
    });
  });

  // --- TIER 4: REAL-WORLD INPUT ERROR RESILIENCE ---
  describe('Tier 4: Real-World Student Typing Variation Scenarios', () => {
    it('prevents false negative markdowns on common student typing mistakes', () => {
      // English typing variations
      expect(evaluateEnglishAnswer('the cat.', 'cat')).toBe(true);
      expect(evaluateEnglishAnswer('  a   house  ', 'house')).toBe(true);

      // Math typing variations
      expect(evaluateMathAnswer('8 * X', '8x')).toBe(true);
      expect(evaluateMathAnswer('X = 4,0', '4')).toBe(true);
      expect(evaluateMathAnswer('4(x - 2)', '4(x-2)')).toBe(true);
    });
  });
});
