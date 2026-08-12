import { describe, it, expect, vi } from 'vitest';
import { generateMathQuestion } from '../data/questions';
import {
  calculateSoftScore,
  normalizeMathString,
  parseMathNumber,
  evaluateMathAnswer,
} from '../utils/evaluation';
import { DidYouKnowModal } from '../components/DidYouKnowModal';

/**
 * Controller class simulating MeditativeIntermission timing, auto-completion,
 * progress calculation, and gong audio synthesis behavior for unit testing.
 */
class IntermissionTimerController {
  public timeLeft: number;
  public totalDuration: number;
  public onComplete: () => void;
  public isCompleted: boolean = false;
  public gongPlayed: boolean = false;

  constructor(onComplete: () => void, totalDuration: number = 90) {
    this.timeLeft = totalDuration;
    this.totalDuration = totalDuration;
    this.onComplete = onComplete;
  }

  public tick(): void {
    if (this.isCompleted) return;
    if (this.timeLeft > 0) {
      this.timeLeft -= 1;
    }
    if (this.timeLeft <= 0) {
      this.isCompleted = true;
      this.onComplete();
    }
  }

  public skip(): void {
    if (this.isCompleted) return;
    this.timeLeft = 0;
    this.isCompleted = true;
    this.onComplete();
  }

  public playGong(): void {
    this.gongPlayed = true;
  }

  public getFormattedTime(): string {
    const minutes = Math.floor(Math.max(0, this.timeLeft) / 60);
    const seconds = Math.max(0, this.timeLeft) % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  public getProgressPercent(): number {
    if (this.totalDuration <= 0) return 0;
    return Math.max(0, Math.min(100, (this.timeLeft / this.totalDuration) * 100));
  }
}

describe('Challenger M2-2 Stress Suite: Math & Intermission Expansion', () => {
  describe('Math Dynamic Expansion Stress Tests', () => {
    it('handles out-of-bound levels in generateMathQuestion gracefully', () => {
      const askedIds = new Set<string>();
      // Levels 1 to 7 should generate questions
      for (let level = 1; level <= 7; level++) {
        const q = generateMathQuestion(level, askedIds);
        expect(q).not.toBeNull();
        expect(q?.level).toBe(level);
      }

      // Out of bound levels (0, -1, 8, 99)
      expect(generateMathQuestion(0, askedIds)).toBeNull();
      expect(generateMathQuestion(-1, askedIds)).toBeNull();
      expect(generateMathQuestion(8, askedIds)).toBeNull();
      expect(generateMathQuestion(100, askedIds)).toBeNull();
    });

    it('stress tests calculateSoftScore boundary conditions and edge cases', () => {
      // False answer always scores 0
      expect(calculateSoftScore(false, 0, 30)).toBe(0);
      expect(calculateSoftScore(false, -10, 30)).toBe(0);

      // True answer with timeTaken <= targetTime scores 100
      expect(calculateSoftScore(true, 0, 30)).toBe(100);
      expect(calculateSoftScore(true, 1, 30)).toBe(100);
      expect(calculateSoftScore(true, 30, 30)).toBe(100);

      // Overtime decay: penalty = overtime * 0.02 * 100
      // 1s overtime -> 2% penalty -> 98 pts
      expect(calculateSoftScore(true, 31, 30)).toBe(98);
      // 25s overtime -> 50% penalty -> 50 pts
      expect(calculateSoftScore(true, 55, 30)).toBe(50);
      // 100s overtime -> floor at 50 pts
      expect(calculateSoftScore(true, 130, 30)).toBe(50);
      // Extreme overtime (10,000s) -> floor at 50 pts
      expect(calculateSoftScore(true, 10000, 30)).toBe(50);
    });

    it('stress tests normalizeMathString edge cases and formatting', () => {
      expect(normalizeMathString('')).toBe('');
      expect(normalizeMathString('   ')).toBe('');
      expect(normalizeMathString('  x  =  15 cm²  ')).toBe('15');
      expect(normalizeMathString('ans = 100 m²')).toBe('100');
      expect(normalizeMathString('result = 3,14')).toBe('3.14');
      expect(normalizeMathString('75 %')).toBe('75');
      expect(normalizeMathString('180°')).toBe('180');
      expect(normalizeMathString('a² + b² = c²')).toBe('a^2+b^2=c^2');
      expect(normalizeMathString('x³ - 8')).toBe('x^3-8');
      expect(normalizeMathString('4 * y')).toBe('4y');
      expect(normalizeMathString('y * 4')).toBe('4y');
    });

    it('stress tests parseMathNumber fraction parsing, negative numbers, and invalid strings', () => {
      // Integers and decimals
      expect(parseMathNumber('0')).toBe(0);
      expect(parseMathNumber('-0') === 0).toBe(true);
      expect(parseMathNumber('-42')).toBe(-42);
      expect(parseMathNumber('3.14159')).toBe(3.14159);
      expect(parseMathNumber(normalizeMathString('3,14159'))).toBe(3.14159);

      // Simple fractions
      expect(parseMathNumber('1/2')).toBe(0.5);
      expect(parseMathNumber('-1/2')).toBe(-0.5);
      expect(parseMathNumber('3/4')).toBe(0.75);
      expect(parseMathNumber('7/2')).toBe(3.5);

      // Division by zero
      expect(parseMathNumber('1/0')).toBeNull();
      expect(parseMathNumber('-5/0')).toBeNull();
      expect(parseMathNumber('0/0')).toBeNull();

      // Mixed fractions
      expect(parseMathNumber('1 1/2')).toBe(1.5);
      expect(parseMathNumber('2 3/4')).toBe(2.75);
      expect(parseMathNumber('-1 1/2')).toBe(-1.5);
      expect(parseMathNumber('-2 3/4')).toBe(-2.75);

      // Invalid input formats
      expect(parseMathNumber('')).toBeNull();
      expect(parseMathNumber('abc')).toBeNull();
      expect(parseMathNumber('1/2/3')).toBeNull();
      expect(parseMathNumber('1 2 3')).toBeNull();
      expect(parseMathNumber('1.2.3')).toBeNull();
    });

    it('stress tests evaluateMathAnswer with 1e-4 tolerance boundaries and floating point precision', () => {
      // Exact equality
      expect(evaluateMathAnswer('10', '10')).toBe(true);
      expect(evaluateMathAnswer('10.0', '10')).toBe(true);

      // Floating point 0.1 + 0.2 precision check
      expect(evaluateMathAnswer('0.3', '0.30000000000000004')).toBe(true);

      // 1e-4 tolerance boundaries
      // Diff = 0.00009 < 0.0001 -> match
      expect(evaluateMathAnswer('1.00009', '1.00000')).toBe(true);
      // Diff = 0.00015 > 0.0001 -> no match
      expect(evaluateMathAnswer('1.00015', '1.00000')).toBe(false);

      // Fraction to decimal evaluation
      expect(evaluateMathAnswer('1/4', '0.25')).toBe(true);
      expect(evaluateMathAnswer('3/4', '0,75')).toBe(true);
      expect(evaluateMathAnswer('1 1/2', '1.5')).toBe(true);

      // Multiple option array evaluation
      expect(evaluateMathAnswer('5 cm', ['5', '5cm', '5 cm'])).toBe(true);
      expect(evaluateMathAnswer('6', ['5', '5cm', '5 cm'])).toBe(false);
    });
  });

  describe('Intermission & Modal Expansion Stress Tests', () => {
    it('verifies IntermissionTimerController complete cycle without multiple callback firings', () => {
      const onCompleteSpy = vi.fn();
      const controller = new IntermissionTimerController(onCompleteSpy, 3);

      controller.tick(); // 2 left
      controller.tick(); // 1 left
      controller.tick(); // 0 left -> fires onComplete
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);

      // Additional ticks after completion must be ignored
      controller.tick();
      controller.tick();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);

      // Calling skip after completion must be ignored
      controller.skip();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('verifies IntermissionTimerController skip action idempotent behavior', () => {
      const onCompleteSpy = vi.fn();
      const controller = new IntermissionTimerController(onCompleteSpy, 90);

      controller.skip();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);

      // Subsequent skip or tick calls do not re-trigger onComplete
      controller.skip();
      controller.tick();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('handles timer durations of 0 and edge formatting', () => {
      const onCompleteSpy = vi.fn();
      const controller = new IntermissionTimerController(onCompleteSpy, 0);

      expect(controller.timeLeft).toBe(0);
      expect(controller.getFormattedTime()).toBe('0:00');
      expect(controller.getProgressPercent()).toBe(0);

      controller.tick();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('renders DidYouKnowModal with array of single correct answer element without crashing', () => {
      const result = DidYouKnowModal({
        isOpen: true,
        questionText: 'Was ist 2 + 2?',
        userAnswer: '5',
        correctAnswer: ['4'],
        onContinue: () => {},
      });

      expect(result).not.toBeNull();
      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );
      expect(explanationContainer).toBeDefined();
      const fallbackDiv = explanationContainer.props.children[1];
      const correctAnsDiv = fallbackDiv.props.children[2];
      expect(correctAnsDiv.props.children[1].props.children).toBe('4');
    });

    it('renders DidYouKnowModal with both hint and explanation props simultaneously', () => {
      const hintText = 'Denke an Punkt-vor-Strich.';
      const explText = '2 + 3 * 4 = 2 + 12 = 14';

      const result = DidYouKnowModal({
        isOpen: true,
        hint: hintText,
        explanation: explText,
        onContinue: () => {},
      });

      expect(result).not.toBeNull();
      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );

      const hintChild = explanationContainer.props.children[0];
      const explChild = explanationContainer.props.children[1];

      expect(hintChild.props.children[0]).toBe('💡 Tipp: ');
      expect(hintChild.props.children[1]).toBe(hintText);
      expect(explChild.props.children).toBe(explText);
    });
  });
});
