import { describe, it, expect } from '../utils/testRunner';
import { englishQuestions, generateMathQuestion } from './questions';

describe('questions data suite', () => {
  it('Level 1 through Level 7 each have >= 15 questions in englishQuestions', () => {
    for (let level = 1; level <= 7; level++) {
      const count = englishQuestions.filter((q) => q.level === level).length;
      expect(count).toBeGreaterThanOrEqual(15);
    }
  });

  it('Total englishQuestions should be >= 105', () => {
    expect(englishQuestions.length).toBeGreaterThanOrEqual(105);
  });

  it('Levels 4, 5, 6, 7 contain questions with readingPassage', () => {
    const passageLevels = [4, 5, 6, 7];
    for (const level of passageLevels) {
      const questionsWithPassage = englishQuestions.filter(
        (q) => q.level === level && typeof q.readingPassage === 'string' && q.readingPassage.trim().length > 0
      );
      expect(questionsWithPassage.length).toBeGreaterThan(0);
    }
  });

  it('Level 7 Stromtarife questions include story context in prompt text and avoid "+ 0"', () => {
    const askedIds = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const q = generateMathQuestion(7, askedIds);
      if (q && q.storyContext === 'Vergleich zweier Stromtarife.') {
        expect(q.text).toContain('Stromtarife');
        expect(q.text).not.toContain('+ 0');
        expect(q.text).not.toContain('- 0');
      }
    }
  });
});

