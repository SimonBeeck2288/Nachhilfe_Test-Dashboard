import { describe, it, expect } from 'vitest';
import { englishQuestions, generateMathQuestion } from '../data/questions';
import { evaluateMathAnswer } from '../utils/evaluation';

describe('R5: Question Bank Quality & Logic Audit Fixes Suite', () => {
  it('Level 6 cube question calculates volume V = a^3 and asks for volume in cm³', () => {
    let foundCubeQuestion = false;
    for (let i = 0; i < 100; i++) {
      const q = generateMathQuestion(6, new Set());
      if (q && q.topic === 'Geometrie' && q.storyContext === 'Pakettransport bei der Post.') {
        foundCubeQuestion = true;
        expect(q.text).toContain('Wie groß ist das Volumen V des Pakets in cm³?');
        const match = q.text.match(/a = (\d+) cm/);
        expect(match).not.toBeNull();
        if (match) {
          const a = parseInt(match[1], 10);
          expect(q.correctAnswer).toBe(String(a * a * a));
        }
        break;
      }
    }
    expect(foundCubeQuestion).toBe(true);
  });

  it('verifies all 22 target English MC questions have balanced and standardized option formatting', () => {
    const targetIds = [
      'e4_2', 'e5_1', 'e5_3', 'e5_30', 'e5_41', 'e5_49',
      'e6_15', 'e6_17', 'e6_28', 'e6_33', 'e6_36', 'e6_43', 'e6_45',
      'e7_3', 'e7_15', 'e7_20', 'e7_33', 'e7_34', 'e7_35', 'e7_41', 'e7_42', 'e7_43'
    ];

    for (const id of targetIds) {
      const q = englishQuestions.find((item) => item.id === id);
      expect(q).toBeDefined();
      if (!q) continue;

      expect(q.type).toBe('multiple-choice');
      expect(q.options).toBeDefined();
      if (q.options) {
        // Option matching: option list contains the correctAnswer
        expect(q.options).toContain(q.correctAnswer);

        // Quality rules for options:
        for (const opt of q.options) {
          // Rule 1: No slash synonyms in options (e.g. "erheblich / beachtlich")
          expect(opt).not.toMatch(/\s\/\s/);
          // Rule 2: No parenthetical English translations in options (e.g. "(Parents' Association)", "(heavy coat)", "(lifeguard)")
          expect(opt).not.toMatch(/\([A-Za-z\s']+\)/);
        }
      }
    }
  });

  it('evaluates decimal inputs and whitespace/unit variations accurately', () => {
    // 1 vs 1,0 and 1.0
    expect(evaluateMathAnswer('1', '1,0')).toBe(true);
    expect(evaluateMathAnswer('1.0', '1')).toBe(true);
    expect(evaluateMathAnswer('1,0', '1,0')).toBe(true);

    // 0,5 vs 0.5
    expect(evaluateMathAnswer('0,5', '0.5')).toBe(true);
    expect(evaluateMathAnswer('0.5', '0,5')).toBe(true);

    // Whitespace trimming & unit stripping
    expect(evaluateMathAnswer('  25  cm³  ', '25')).toBe(true);
    expect(evaluateMathAnswer('216 cm³', '216')).toBe(true);
    expect(evaluateMathAnswer(' 12 km ', '12')).toBe(true);
  });
});
