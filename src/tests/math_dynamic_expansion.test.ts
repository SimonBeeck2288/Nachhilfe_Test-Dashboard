import { describe, it, expect } from 'vitest';
import { generateMathQuestion } from '../data/questions';
import {
  calculateSoftScore,
  normalizeMathString,
  parseMathNumber,
  evaluateMathAnswer,
} from '../utils/evaluation';

describe('Dynamic Math Generation, Scoring & Smart Tolerance Evaluation', () => {
  describe('Dynamic Formula Generation Across Levels 1 through 7', () => {
    it('generates valid Level 1 math questions (arithmetic addition, subtraction, place value)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(1, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(1);
        expect(q?.subject).toBe('math');
        expect(q?.id).toBeDefined();
        expect(q?.text.length).toBeGreaterThan(5);
        expect(q?.correctAnswer).toBeDefined();
        expect(typeof q?.correctAnswer).toBe('string');
        expect(q?.timeLimit).toBeGreaterThan(0);
      }
    });

    it('generates valid Level 2 math questions (multiplication, division, perimeter geometry)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(2, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(2);
        expect(q?.subject).toBe('math');
        expect(['Multiplikation', 'Division', 'Geometrie']).toContain(q?.topic);
      }
    });

    it('generates valid Level 3 math questions (fractions, decimal conversion, fraction pie, rectangle area)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(3, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(3);
        expect(['Bruchrechnung', 'Dezimalrechnung', 'Geometrie']).toContain(q?.topic);
        if (q?.type === 'fraction-pie') {
          expect(q?.targetFraction).toBeDefined();
          expect(q?.targetFraction?.numerator).toBeGreaterThan(0);
          expect(q?.targetFraction?.denominator).toBeGreaterThan(0);
        }
      }
    });

    it('generates valid Level 4 math questions (percentages, linear equations, triangle area, average)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(4, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(4);
        expect(['Prozentrechnung', 'Gleichungen', 'Geometrie', 'Statistik']).toContain(q?.topic);
      }
    });

    it('generates valid Level 5 math questions (negative numbers, parallelogram, trapezoid, angle sum)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(5, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(5);
        expect(['Negative Zahlen', 'Geometrie']).toContain(q?.topic);
      }
    });

    it('generates valid Level 6 math questions (powers/squares, cube edge, term collection/expansion)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(6, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(6);
        expect(['Potenzen', 'Geometrie', 'Terme']).toContain(q?.topic);
      }
    });

    it('generates valid Level 7 math questions (binomial formula, Pythagoras, circle circumference, equations)', () => {
      const askedIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(7, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(7);
        expect(['Binomische Formeln', 'Geometrie', 'Gleichungen']).toContain(q?.topic);
        if (q?.topic === 'Binomische Formeln') {
          expect(q?.options).toBeDefined();
          expect(q?.options?.length).toBe(4);
          expect(q?.options).toContain(q?.correctAnswer);
        }
      }
    });

    it('guarantees unique IDs across 1,000 generated math questions', () => {
      const ids = new Set<string>();
      const count = 1000;
      for (let i = 0; i < count; i++) {
        const level = (i % 7) + 1;
        const q = generateMathQuestion(level, new Set());
        expect(q).not.toBeNull();
        if (q) {
          expect(ids.has(q.id)).toBe(false);
          ids.add(q.id);
        }
      }
      expect(ids.size).toBe(count);
    });
  });

  describe('Answer Scoring & Soft Timer Decay (calculateSoftScore)', () => {
    it('returns 0 points for incorrect answers regardless of time taken', () => {
      expect(calculateSoftScore(false, 5, 30)).toBe(0);
      expect(calculateSoftScore(false, 30, 30)).toBe(0);
      expect(calculateSoftScore(false, 60, 30)).toBe(0);
    });

    it('returns full 100 points when answered within target time', () => {
      expect(calculateSoftScore(true, 10, 30)).toBe(100);
      expect(calculateSoftScore(true, 30, 30)).toBe(100);
    });

    it('decays score smoothly for overtime scenarios', () => {
      // 10s overtime -> 10 * 0.02 = 0.2 penalty -> 80 pts
      expect(calculateSoftScore(true, 40, 30)).toBe(80);
      // 20s overtime -> 20 * 0.02 = 0.4 penalty -> 60 pts
      expect(calculateSoftScore(true, 50, 30)).toBe(60);
    });

    it('caps point decay at 50% maximum penalty (min 50 pts)', () => {
      // 50s overtime -> max 50% penalty -> 50 pts
      expect(calculateSoftScore(true, 80, 30)).toBe(50);
      // 100s overtime -> still capped at 50 pts
      expect(calculateSoftScore(true, 130, 30)).toBe(50);
    });
  });

  describe('Math String Normalization & Smart Tolerance (normalizeMathString)', () => {
    it('strips single-variable equation prefixes (x=, x = , ans = , result = )', () => {
      expect(normalizeMathString('x = 5')).toBe('5');
      expect(normalizeMathString('x=12')).toBe('12');
      expect(normalizeMathString('ans = 42')).toBe('42');
      expect(normalizeMathString('result = 3.14')).toBe('3.14');
    });

    it('strips common math and geometry unit suffixes (cm², cm, m², m, %, °)', () => {
      expect(normalizeMathString('25 cm²')).toBe('25');
      expect(normalizeMathString('10 cm')).toBe('10');
      expect(normalizeMathString('100 m²')).toBe('100');
      expect(normalizeMathString('50 %')).toBe('50');
      expect(normalizeMathString('90°')).toBe('90');
    });

    it('replaces decimal commas with dots', () => {
      expect(normalizeMathString('3,14')).toBe('3.14');
      expect(normalizeMathString('0,5')).toBe('0.5');
    });

    it('converts unicode superscripts to standard caret notation (^2, ^3)', () => {
      expect(normalizeMathString('x²')).toBe('x^2');
      expect(normalizeMathString('x³')).toBe('x^3');
      expect(normalizeMathString('x² + 2x + 1')).toBe('x^2+2x+1');
    });

    it('normalizes multiplication forms and spacing between coefficient and variable', () => {
      expect(normalizeMathString('8 * x')).toBe('8x');
      expect(normalizeMathString('x * 8')).toBe('8x');
      expect(normalizeMathString('8 x')).toBe('8x');
      expect(normalizeMathString('x 8')).toBe('8x');
    });
  });

  describe('Math Number Parsing & Epsilon Evaluation', () => {
    it('parses integers, floats, simple fractions, and mixed fractions with parseMathNumber', () => {
      expect(parseMathNumber('42')).toBe(42);
      expect(parseMathNumber('3.14')).toBe(3.14);
      expect(parseMathNumber('1/2')).toBe(0.5);
      expect(parseMathNumber('-3/4')).toBe(-0.75);
      expect(parseMathNumber('1 1/2')).toBe(1.5);
      expect(parseMathNumber('-2 3/4')).toBe(-2.75);
      expect(parseMathNumber('invalid')).toBeNull();
    });

    it('evaluates math answers with smart tolerance and epsilon numerical equivalence (1e-4)', () => {
      expect(evaluateMathAnswer('x = 5', '5')).toBe(true);
      expect(evaluateMathAnswer('0,5', '0.5')).toBe(true);
      expect(evaluateMathAnswer('1/2', '0.5')).toBe(true);
      expect(evaluateMathAnswer('8 * x', '8x')).toBe(true);
      expect(evaluateMathAnswer('25 cm²', '25')).toBe(true);
      expect(evaluateMathAnswer('3.14159', '3.1416')).toBe(true); // Within 1e-4 tolerance
    });

    it('evaluates multi-option correct answer arrays (string[])', () => {
      const correctOptions = ['12', '12 cm', '12cm'];
      expect(evaluateMathAnswer('12', correctOptions)).toBe(true);
      expect(evaluateMathAnswer('12 cm', correctOptions)).toBe(true);
      expect(evaluateMathAnswer('15', correctOptions)).toBe(false);
    });
  });
});
