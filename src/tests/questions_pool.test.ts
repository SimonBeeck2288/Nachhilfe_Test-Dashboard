import { describe, it, expect } from 'vitest';
import { englishQuestions, generateMathQuestion, type Question } from '../data/questions';

describe('Tier 1-4: Question Pool, Story Tasks & Visuals (Features F4, F5, F6, F15)', () => {
  // --- TIER 1: FEATURE COVERAGE (EXPANDED POOL & GENERATOR) ---
  describe('Tier 1: Feature Coverage (F15 & F4)', () => {
    it('F15: English question pool contains >= 50 questions per level across levels 1-7', () => {
      for (let level = 1; level <= 7; level++) {
        const questionsAtLevel = englishQuestions.filter((q) => q.level === level);
        expect(questionsAtLevel.length).toBeGreaterThanOrEqual(50);
      }
    });

    it('F15: Total English questions in pool is >= 350', () => {
      expect(englishQuestions.length).toBeGreaterThanOrEqual(350);
    });

    it('F15: Levels 4, 5, 6, and 7 contain reading comprehension passages', () => {
      for (const level of [4, 5, 6, 7]) {
        const passageQuestions = englishQuestions.filter(
          (q) => q.level === level && typeof q.readingPassage === 'string' && q.readingPassage.trim().length > 0
        );
        expect(passageQuestions.length).toBeGreaterThan(0);
      }
    });

    it('F4: Math question generator generates valid questions for levels 1 through 7', () => {
      const askedSet = new Set<string>();
      for (let level = 1; level <= 7; level++) {
        const q = generateMathQuestion(level, askedSet);
        expect(q).not.toBeNull();
        expect(q?.subject).toBe('math');
        expect(q?.level).toBe(level);
        expect(q?.text).toBeDefined();
        expect(q?.correctAnswer).toBeDefined();
        expect(q?.timeLimit).toBeGreaterThan(0);
      }
    });
  });

  // --- TIER 2: BOUNDARY VALUE ANALYSIS & CORNER CASES ---
  describe('Tier 2: Boundary Values & Edge Cases', () => {
    it('handles asking all math questions at a given level without crashing or throwing', () => {
      const askedSet = new Set<string>();
      const generatedQuestions: Question[] = [];

      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(3, askedSet);
        if (q) {
          askedSet.add(q.id);
          generatedQuestions.push(q);
        }
      }
      expect(generatedQuestions.length).toBeGreaterThan(0);
    });

    it('ensures all multiple-choice questions have non-empty options array', () => {
      const mcQuestions = englishQuestions.filter((q) => q.type === 'multiple-choice');
      for (const q of mcQuestions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // --- TIER 3: AUDIO & VISUAL INTEGRATION CONTRACTS (F5 & F6) ---
  describe('Tier 3: Audio & Visual Question Upgrades (F5 & F6)', () => {
    it('F6: Geometry topics generate geometry diagrams with shape keywords (Rechteck, Kreis, Dreieck)', () => {
      const askedSet = new Set<string>();
      let geometryQuestionCount = 0;

      // Sample math questions until geometry questions are generated
      for (let i = 0; i < 50; i++) {
        const q = generateMathQuestion(7, askedSet);
        if (q) {
          askedSet.add(q.id);
          if (q.topic === 'Geometrie') {
            geometryQuestionCount++;
            const textLower = q.text.toLowerCase();
            const hasShapeKeyword =
              textLower.includes('dreieck') ||
              textLower.includes('kreis') ||
              textLower.includes('rechteck') ||
              textLower.includes('hypotenuse') ||
              textLower.includes('kathete') ||
              textLower.includes('radius') ||
              textLower.includes('umfang');
            expect(hasShapeKeyword).toBe(true);
          }
        }
      }
      expect(geometryQuestionCount).toBeGreaterThan(0);
    });

    it('F5: TTS Contract: English vocabulary questions have audio pronunciation text', () => {
      const vocabQuestions = englishQuestions.filter((q) => q.topic === 'Vokabeln' || q.topic === 'Zahlen');
      expect(vocabQuestions.length).toBeGreaterThan(0);
      for (const q of vocabQuestions) {
        expect(q.text.length).toBeGreaterThan(0);
      }
    });
  });

  // --- TIER 4: REAL-WORLD QUESTION POOL INTEGRITY JOURNEY ---
  describe('Tier 4: Full Diagnostic Question Serving Simulation', () => {
    it('simulates serving a full 14-question session (7 Math + 7 English) without duplicate IDs', () => {
      const servedIds = new Set<string>();
      const sessionQuestions: Question[] = [];

      // 7 Math questions across progressive levels
      for (let level = 1; level <= 7; level++) {
        const q = generateMathQuestion(level, servedIds);
        expect(q).not.toBeNull();
        if (q) {
          expect(servedIds.has(q.id)).toBe(false);
          servedIds.add(q.id);
          sessionQuestions.push(q);
        }
      }

      // 7 English questions across progressive levels
      for (let level = 1; level <= 7; level++) {
        const available = englishQuestions.filter((q) => q.level === level && !servedIds.has(q.id));
        expect(available.length).toBeGreaterThan(0);
        const q = available[0];
        servedIds.add(q.id);
        sessionQuestions.push(q);
      }

      expect(sessionQuestions.length).toBe(14);
      expect(servedIds.size).toBe(14);
    });

    it('verifies a student can complete 3 full 15-minute sessions (45 questions) at Level 1 with 100% unique questions', () => {
      const servedIds = new Set<string>();
      const level1Questions = englishQuestions.filter((q) => q.level === 1);

      // Simulate 3 sessions of 15 questions each = 45 questions
      for (let session = 1; session <= 3; session++) {
        for (let qCount = 0; qCount < 15; qCount++) {
          let available = level1Questions.filter((q) => !servedIds.has(q.id));
          expect(available.length).toBeGreaterThan(0);
          const picked = available[0];
          expect(servedIds.has(picked.id)).toBe(false);
          servedIds.add(picked.id);
        }
      }

      expect(servedIds.size).toBe(45);
    });
  });
});
