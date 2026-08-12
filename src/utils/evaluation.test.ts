import { describe, it, expect } from './testRunner';
import { evaluateEnglishAnswer, evaluateMathAnswer } from './evaluation';

describe('Tolerant Evaluation suite', () => {
  describe('English Answer Evaluation', () => {
    it('handles article tolerance ("dog", "a dog", "the dog")', () => {
      expect(evaluateEnglishAnswer('dog', 'a dog')).toBe(true);
      expect(evaluateEnglishAnswer('a dog', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('the dog', 'a dog')).toBe(true);
      expect(evaluateEnglishAnswer('cat', 'a dog')).toBe(false);
    });

    it('handles punctuation and casing tolerance', () => {
      expect(evaluateEnglishAnswer('Dog.', 'dog')).toBe(true);
      expect(evaluateEnglishAnswer('  "Apple!" ', 'apple')).toBe(true);
    });

    it('supports multi-option answer arrays (string[])', () => {
      expect(evaluateEnglishAnswer('puppy', ['dog', 'puppy', 'hound'])).toBe(true);
      expect(evaluateEnglishAnswer('a hound', ['dog', 'puppy', 'hound'])).toBe(true);
      expect(evaluateEnglishAnswer('cat', ['dog', 'puppy', 'hound'])).toBe(false);
    });

    it('supports synonym arrays dictionary', () => {
      const synonyms = {
        cheap: ['inexpensive', 'affordable', 'low-cost'],
        big: ['large', 'huge', 'giant'],
      };

      expect(evaluateEnglishAnswer('inexpensive', 'cheap', synonyms)).toBe(true);
      expect(evaluateEnglishAnswer('an affordable', 'cheap', synonyms)).toBe(true);
      expect(evaluateEnglishAnswer('huge', 'big', synonyms)).toBe(true);
      expect(evaluateEnglishAnswer('small', 'big', synonyms)).toBe(false);
    });
  });

  describe('Math Answer Evaluation', () => {
    it('handles algebraic term formatting ("8 * x", "8X", "x * 8", "8 x" -> "8x")', () => {
      expect(evaluateMathAnswer('8 * x', '8x')).toBe(true);
      expect(evaluateMathAnswer('8X', '8x')).toBe(true);
      expect(evaluateMathAnswer('x * 8', '8x')).toBe(true);
      expect(evaluateMathAnswer('8 x', '8x')).toBe(true);
    });

    it('handles equation prefix stripping ("x = 3" vs "3")', () => {
      expect(evaluateMathAnswer('x = 3', '3')).toBe(true);
      expect(evaluateMathAnswer('3', 'x = 3')).toBe(true);
      expect(evaluateMathAnswer('x=3', '3')).toBe(true);
      expect(evaluateMathAnswer('ans = 12', '12')).toBe(true);
    });

    it('handles unit stripping ("cm²", "m", "%", "°")', () => {
      expect(evaluateMathAnswer('25 cm²', '25')).toBe(true);
      expect(evaluateMathAnswer('10 m', '10')).toBe(true);
      expect(evaluateMathAnswer('50 %', '50')).toBe(true);
    });

    it('handles decimal commas, decimal equivalence (1 vs 1,0), epsilon numerical equivalence, and fractions', () => {
      expect(evaluateMathAnswer('0,5', '0.5')).toBe(true);
      expect(evaluateMathAnswer('1', '1,0')).toBe(true);
      expect(evaluateMathAnswer('1,0', '1')).toBe(true);
      expect(evaluateMathAnswer('3,00001', '3')).toBe(true);
      expect(evaluateMathAnswer('1/2', '0.5')).toBe(true);
      expect(evaluateMathAnswer('4', '5')).toBe(false);
    });

    it('handles volume unit stripping ("cm³", "cm^3", "m³")', () => {
      expect(evaluateMathAnswer('216 cm³', '216')).toBe(true);
      expect(evaluateMathAnswer('216 cm^3', '216')).toBe(true);
      expect(evaluateMathAnswer('1000 m³', '1000')).toBe(true);
    });

    it('handles mixed fractions and unicode superscripts', () => {
      expect(evaluateMathAnswer('1 1/2', '1.5')).toBe(true);
      expect(evaluateMathAnswer('-2 3/4', '-2.75')).toBe(true);
      expect(evaluateMathAnswer('x² + 6x + 9', 'x^2 + 6x + 9')).toBe(true);
    });

    it('supports multi-option math answer arrays (string[])', () => {
      expect(evaluateMathAnswer('0.5', ['1/2', '0,5', '50%'])).toBe(true);
      expect(evaluateMathAnswer('1/2', ['0.5', '2/4'])).toBe(true);
      expect(evaluateMathAnswer('3/4', ['0.5', '2/4'])).toBe(false);
    });
  });
});
