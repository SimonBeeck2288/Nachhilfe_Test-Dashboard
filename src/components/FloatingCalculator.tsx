import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete } from 'lucide-react';
import { calculateResult, formatCalculatorNumber } from '../utils/calculator';

export interface FloatingCalculatorProps {
  resetKey?: string | number;
}

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ resetKey }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [display, setDisplay] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [expression, setExpression] = useState<string>('');

  const prevResetKeyRef = useRef<string | number | undefined>(resetKey);

  // Auto-close and reset calculator when resetKey changes (e.g. question change)
  useEffect(() => {
    if (resetKey !== undefined && prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      setIsOpen(false);
      setDisplay('0');
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      setExpression('');
    } else if (resetKey !== undefined && prevResetKeyRef.current === undefined) {
      prevResetKeyRef.current = resetKey;
    }
  }, [resetKey]);

  const handleDigit = (digit: string) => {
    if (display === 'Fehler' || waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      if (display === '0') {
        setDisplay(digit);
      } else if (display.length < 14) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (display === 'Fehler' || waitingForOperand) {
      setDisplay('0,');
      setWaitingForOperand(false);
    } else if (!display.includes(',')) {
      setDisplay(display + ',');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
  };

  const handleBackspace = () => {
    if (display === 'Fehler' || waitingForOperand) {
      setDisplay('0');
      setWaitingForOperand(false);
    } else {
      const next = display.slice(0, -1);
      if (!next || next === '-' || next === '') {
        setDisplay('0');
      } else {
        setDisplay(next);
      }
    }
  };

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  const handleOperator = (nextOperator: string) => {
    if (display === 'Fehler') return;

    const inputValue = parseFloat(display.replace(',', '.'));

    if (prevValue === null) {
      setPrevValue(inputValue);
      setOperator(nextOperator);
      setExpression(`${formatCalculatorNumber(inputValue)} ${getOperatorSymbol(nextOperator)}`);
      setWaitingForOperand(true);
    } else if (operator) {
      if (waitingForOperand) {
        setOperator(nextOperator);
        setExpression(`${formatCalculatorNumber(prevValue)} ${getOperatorSymbol(nextOperator)}`);
      } else {
        const result = calculateResult(prevValue, inputValue, operator);
        if (result === 'Fehler') {
          setDisplay('Fehler');
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          setExpression('');
        } else {
          const formatted = formatCalculatorNumber(result);
          setDisplay(formatted);
          setPrevValue(result);
          setOperator(nextOperator);
          setExpression(`${formatted} ${getOperatorSymbol(nextOperator)}`);
          setWaitingForOperand(true);
        }
      }
    }
  };

  const handleEquals = () => {
    if (display === 'Fehler' || prevValue === null || !operator) return;

    const inputValue = parseFloat(display.replace(',', '.'));
    const result = calculateResult(prevValue, inputValue, operator);

    if (result === 'Fehler') {
      setDisplay('Fehler');
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setExpression('');
    } else {
      const formatted = formatCalculatorNumber(result);
      setDisplay(formatted);
      setExpression(`${formatCalculatorNumber(prevValue)} ${getOperatorSymbol(operator)} ${formatCalculatorNumber(inputValue)} =`);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  // Prevent default on mouse down so focus in question input field is not lost
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      data-testid="floating-calculator-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
      }}
    >
      {/* CALCULATOR PANEL */}
      {isOpen && (
        <div
          data-testid="calculator-panel"
          style={{
            position: 'absolute',
            bottom: '64px',
            right: 0,
            width: '280px',
            backgroundColor: 'var(--surface, #FFFFFF)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1))',
            border: '1px solid var(--border, #E5E7EB)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border, #E5E7EB)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={18} color="var(--primary, #4F46E5)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #1F2937)' }}>
                Taschenrechner
              </span>
            </div>
            <button
              type="button"
              data-testid="calc-close-btn"
              onMouseDown={handleMouseDown}
              onClick={() => setIsOpen(false)}
              aria-label="Taschenrechner schließen"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                color: 'var(--text-muted, #6B7280)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Display screen */}
          <div
            data-testid="calc-display-container"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '8px 12px',
              textAlign: 'right',
              minHeight: '64px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              data-testid="calc-expression"
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted, #64748B)',
                minHeight: '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {expression}
            </div>
            <div
              data-testid="calc-display"
              style={{
                fontSize: display.length > 10 ? '1.25rem' : '1.6rem',
                fontWeight: 700,
                color: display === 'Fehler' ? 'var(--danger, #EF4444)' : 'var(--text-main, #0F172A)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.2,
              }}
            >
              {display}
            </div>
          </div>

          {/* Keypad Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}
          >
            {/* Row 1: C, Backspace, ÷, × */}
            <button
              type="button"
              data-testid="calc-btn-clear"
              onMouseDown={handleMouseDown}
              onClick={handleClear}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              C
            </button>
            <button
              type="button"
              data-testid="calc-btn-backspace"
              onMouseDown={handleMouseDown}
              onClick={handleBackspace}
              aria-label="Löschen"
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F1F5F9',
                color: 'var(--text-main, #334155)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Delete size={18} />
            </button>
            <button
              type="button"
              data-testid="calc-btn-divide"
              onMouseDown={handleMouseDown}
              onClick={() => handleOperator('/')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#EEF2FF',
                color: 'var(--primary, #4F46E5)',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ÷
            </button>
            <button
              type="button"
              data-testid="calc-btn-multiply"
              onMouseDown={handleMouseDown}
              onClick={() => handleOperator('*')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#EEF2FF',
                color: 'var(--primary, #4F46E5)',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>

            {/* Row 2: 7, 8, 9, − */}
            <button
              type="button"
              data-testid="calc-btn-7"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('7')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              7
            </button>
            <button
              type="button"
              data-testid="calc-btn-8"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('8')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              8
            </button>
            <button
              type="button"
              data-testid="calc-btn-9"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('9')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              9
            </button>
            <button
              type="button"
              data-testid="calc-btn-subtract"
              onMouseDown={handleMouseDown}
              onClick={() => handleOperator('-')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#EEF2FF',
                color: 'var(--primary, #4F46E5)',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>

            {/* Row 3: 4, 5, 6, + */}
            <button
              type="button"
              data-testid="calc-btn-4"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('4')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              4
            </button>
            <button
              type="button"
              data-testid="calc-btn-5"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('5')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              5
            </button>
            <button
              type="button"
              data-testid="calc-btn-6"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('6')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              6
            </button>
            <button
              type="button"
              data-testid="calc-btn-add"
              onMouseDown={handleMouseDown}
              onClick={() => handleOperator('+')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#EEF2FF',
                color: 'var(--primary, #4F46E5)',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>

            {/* Row 4: 1, 2, 3, = (row-span 2) */}
            <button
              type="button"
              data-testid="calc-btn-1"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('1')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              1
            </button>
            <button
              type="button"
              data-testid="calc-btn-2"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('2')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              2
            </button>
            <button
              type="button"
              data-testid="calc-btn-3"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('3')}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              3
            </button>
            <button
              type="button"
              data-testid="calc-btn-equals"
              onMouseDown={handleMouseDown}
              onClick={handleEquals}
              style={{
                gridRow: 'span 2',
                height: '92px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #4F46E5)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
              }}
            >
              =
            </button>

            {/* Row 5: 0 (col-span 2), comma */}
            <button
              type="button"
              data-testid="calc-btn-0"
              onMouseDown={handleMouseDown}
              onClick={() => handleDigit('0')}
              style={{
                gridColumn: 'span 2',
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              0
            </button>
            <button
              type="button"
              data-testid="calc-btn-decimal"
              onMouseDown={handleMouseDown}
              onClick={handleDecimal}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: 'var(--text-main, #1E293B)',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ,
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        data-testid="floating-calc-fab"
        onMouseDown={handleMouseDown}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Taschenrechner schließen' : 'Taschenrechner öffnen'}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#374151' : 'var(--primary, #4F46E5)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {isOpen ? <X size={24} /> : <Calculator size={24} />}
      </button>
    </div>
  );
};

export default FloatingCalculator;
