import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FloatingCalculator from '../components/FloatingCalculator';
import { calculateResult, formatCalculatorNumber } from '../utils/calculator';

describe('FloatingCalculator Component', () => {
  afterEach(() => {
    cleanup();
  });

  describe('1. Unit Calculations & Formatting Logic', () => {
    it('calculates basic operations correctly', () => {
      expect(calculateResult(12, 34, '+')).toBe(46);
      expect(calculateResult(50, 18, '-')).toBe(32);
      expect(calculateResult(6, 7, '*')).toBe(42);
      expect(calculateResult(100, 4, '/')).toBe(25);
    });

    it('handles division by zero with Fehler', () => {
      expect(calculateResult(10, 0, '/')).toBe('Fehler');
      expect(calculateResult(0, 0, '/')).toBe('Fehler');
    });

    it('formats numbers with max 8 decimals avoiding floating point inaccuracies', () => {
      expect(formatCalculatorNumber(0.1 + 0.2)).toBe('0,3');
      expect(formatCalculatorNumber(1 / 3)).toBe('0,33333333');
      expect(formatCalculatorNumber(42)).toBe('42');
      expect(formatCalculatorNumber(12.5)).toBe('12,5');
    });
  });

  describe('2. Open/Close & Toggle UI', () => {
    it('renders FAB initially closed and toggles on click', () => {
      render(<FloatingCalculator />);

      const fab = screen.getByTestId('floating-calc-fab');
      expect(screen.queryByTestId('calculator-panel')).toBeNull();

      // Open
      fireEvent.click(fab);
      expect(screen.getByTestId('calculator-panel')).toBeDefined();
      expect(screen.getByTestId('calc-display').textContent).toBe('0');

      // Close via FAB
      fireEvent.click(fab);
      expect(screen.queryByTestId('calculator-panel')).toBeNull();
    });

    it('closes when close button in header is clicked', () => {
      render(<FloatingCalculator />);

      fireEvent.click(screen.getByTestId('floating-calc-fab'));
      expect(screen.getByTestId('calculator-panel')).toBeDefined();

      const closeBtn = screen.getByTestId('calc-close-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('calculator-panel')).toBeNull();
    });
  });

  describe('3. Calculator Keypad Operations & User Flows', () => {
    beforeEach(() => {
      render(<FloatingCalculator />);
      fireEvent.click(screen.getByTestId('floating-calc-fab'));
    });

    it('performs addition: 12 + 34 = 46', () => {
      fireEvent.click(screen.getByTestId('calc-btn-1'));
      fireEvent.click(screen.getByTestId('calc-btn-2'));
      expect(screen.getByTestId('calc-display').textContent).toBe('12');

      fireEvent.click(screen.getByTestId('calc-btn-add'));
      expect(screen.getByTestId('calc-expression').textContent).toBe('12 +');

      fireEvent.click(screen.getByTestId('calc-btn-3'));
      fireEvent.click(screen.getByTestId('calc-btn-4'));
      expect(screen.getByTestId('calc-display').textContent).toBe('34');

      fireEvent.click(screen.getByTestId('calc-btn-equals'));
      expect(screen.getByTestId('calc-display').textContent).toBe('46');
      expect(screen.getByTestId('calc-expression').textContent).toBe('12 + 34 =');
    });

    it('performs multiplication with decimals: 2,5 * 4 = 10', () => {
      fireEvent.click(screen.getByTestId('calc-btn-2'));
      fireEvent.click(screen.getByTestId('calc-btn-decimal'));
      fireEvent.click(screen.getByTestId('calc-btn-5'));
      expect(screen.getByTestId('calc-display').textContent).toBe('2,5');

      fireEvent.click(screen.getByTestId('calc-btn-multiply'));
      fireEvent.click(screen.getByTestId('calc-btn-4'));
      fireEvent.click(screen.getByTestId('calc-btn-equals'));

      expect(screen.getByTestId('calc-display').textContent).toBe('10');
    });

    it('handles division by zero in UI and recovers on new digit entry', () => {
      fireEvent.click(screen.getByTestId('calc-btn-8'));
      fireEvent.click(screen.getByTestId('calc-btn-divide'));
      fireEvent.click(screen.getByTestId('calc-btn-0'));
      fireEvent.click(screen.getByTestId('calc-btn-equals'));

      expect(screen.getByTestId('calc-display').textContent).toBe('Fehler');

      // Typing new digit replaces "Fehler"
      fireEvent.click(screen.getByTestId('calc-btn-9'));
      expect(screen.getByTestId('calc-display').textContent).toBe('9');
    });

    it('clears state on Clear (C) button', () => {
      fireEvent.click(screen.getByTestId('calc-btn-7'));
      fireEvent.click(screen.getByTestId('calc-btn-add'));
      fireEvent.click(screen.getByTestId('calc-btn-8'));
      fireEvent.click(screen.getByTestId('calc-btn-clear'));

      expect(screen.getByTestId('calc-display').textContent).toBe('0');
      expect(screen.getByTestId('calc-expression').textContent).toBe('');
    });

    it('removes digits on Backspace button', () => {
      fireEvent.click(screen.getByTestId('calc-btn-9'));
      fireEvent.click(screen.getByTestId('calc-btn-8'));
      fireEvent.click(screen.getByTestId('calc-btn-7'));
      expect(screen.getByTestId('calc-display').textContent).toBe('987');

      fireEvent.click(screen.getByTestId('calc-btn-backspace'));
      expect(screen.getByTestId('calc-display').textContent).toBe('98');

      fireEvent.click(screen.getByTestId('calc-btn-backspace'));
      expect(screen.getByTestId('calc-display').textContent).toBe('9');

      fireEvent.click(screen.getByTestId('calc-btn-backspace'));
      expect(screen.getByTestId('calc-display').textContent).toBe('0');
    });

    it('handles chained operations sequentially', () => {
      // 5 + 3 - 2 = 6
      fireEvent.click(screen.getByTestId('calc-btn-5'));
      fireEvent.click(screen.getByTestId('calc-btn-add'));
      fireEvent.click(screen.getByTestId('calc-btn-3'));
      fireEvent.click(screen.getByTestId('calc-btn-subtract')); // triggers 5 + 3 = 8
      expect(screen.getByTestId('calc-display').textContent).toBe('8');

      fireEvent.click(screen.getByTestId('calc-btn-2'));
      fireEvent.click(screen.getByTestId('calc-btn-equals'));
      expect(screen.getByTestId('calc-display').textContent).toBe('6');
    });
  });

  describe('4. ResetKey Auto-Close Behavior', () => {
    it('automatically closes and resets calculator when resetKey prop changes', () => {
      const { rerender } = render(<FloatingCalculator resetKey="q1" />);

      // Open calculator and type something
      fireEvent.click(screen.getByTestId('floating-calc-fab'));
      expect(screen.getByTestId('calculator-panel')).toBeDefined();

      fireEvent.click(screen.getByTestId('calc-btn-5'));
      fireEvent.click(screen.getByTestId('calc-btn-add'));
      fireEvent.click(screen.getByTestId('calc-btn-5'));
      expect(screen.getByTestId('calc-display').textContent).toBe('5');

      // Change resetKey to "q2" (next question)
      rerender(<FloatingCalculator resetKey="q2" />);

      // Panel should now be closed
      expect(screen.queryByTestId('calculator-panel')).toBeNull();

      // Reopen -> should be reset to '0'
      fireEvent.click(screen.getByTestId('floating-calc-fab'));
      expect(screen.getByTestId('calc-display').textContent).toBe('0');
      expect(screen.getByTestId('calc-expression').textContent).toBe('');
    });
  });

  describe('5. MouseDown Event Prevention (Focus Preservation)', () => {
    it('prevents default on mousedown for all buttons to keep student input focused', () => {
      render(<FloatingCalculator />);
      const fab = screen.getByTestId('floating-calc-fab');

      const fabMouseDownEvent = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
      fab.dispatchEvent(fabMouseDownEvent);
      expect(fabMouseDownEvent.defaultPrevented).toBe(true);

      // Open and test key buttons
      fireEvent.click(fab);

      const testBtnIds = [
        'calc-close-btn',
        'calc-btn-clear',
        'calc-btn-backspace',
        'calc-btn-divide',
        'calc-btn-multiply',
        'calc-btn-subtract',
        'calc-btn-add',
        'calc-btn-equals',
        'calc-btn-decimal',
        'calc-btn-0',
        'calc-btn-1',
      ];

      testBtnIds.forEach((id) => {
        const btn = screen.getByTestId(id);
        const event = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
        btn.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });
});
