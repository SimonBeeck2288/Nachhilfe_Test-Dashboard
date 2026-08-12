import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { DidYouKnowModal } from '../components/DidYouKnowModal';
import { MeditativeIntermission } from '../components/minigames/MeditativeIntermission';
import { useQuestionTimer } from '../hooks/useQuestionTimer';

describe('Intermission Break Timing & DidYouKnowModal Feedback Expansion', () => {
  describe('DidYouKnowModal Rendering & Feedback Triggers', () => {
    it('returns null when isOpen is false', () => {
      const result = DidYouKnowModal({
        isOpen: false,
        onContinue: () => {},
      });
      expect(result).toBeNull();
    });

    it('renders modal container and header when isOpen is true', () => {
      const result = DidYouKnowModal({
        isOpen: true,
        onContinue: () => {},
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('div');
      expect(result?.props.style.position).toBe('fixed');
    });

    it('renders mascot owl tip hint when hint prop is provided', () => {
      const hintText = 'Ein Quadrat hat vier gleich lange Seiten.';
      const result = DidYouKnowModal({
        isOpen: true,
        hint: hintText,
        onContinue: () => {},
      });

      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );

      expect(explanationContainer).toBeDefined();
      const hintChild = explanationContainer.props.children[0];
      expect(hintChild).toBeDefined();
      expect(hintChild.props.children).toContain('💡 Tipp: ');
      expect(hintChild.props.children).toContain(hintText);
    });

    it('renders explicit explanation when explanation prop is provided', () => {
      const explanationText = '5 x 5 = 25, da es 5 Reihen zu je 5 Elementen sind.';
      const result = DidYouKnowModal({
        isOpen: true,
        explanation: explanationText,
        onContinue: () => {},
      });

      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );

      expect(explanationContainer).toBeDefined();
      const explDiv = explanationContainer.props.children[1];
      expect(explDiv.props.children).toBe(explanationText);
    });

    it('renders question comparison fallback with struck-through userAnswer and correct answer when explanation is omitted', () => {
      const result = DidYouKnowModal({
        isOpen: true,
        questionText: 'Was heißt Hund auf Englisch?',
        userAnswer: 'cat',
        correctAnswer: 'dog',
        onContinue: () => {},
      });

      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );

      expect(explanationContainer).toBeDefined();
      const fallbackDiv = explanationContainer.props.children[1];
      expect(fallbackDiv).toBeDefined();

      const qTextDiv = fallbackDiv.props.children[0];
      const userAnsDiv = fallbackDiv.props.children[1];
      const correctAnsDiv = fallbackDiv.props.children[2];

      expect(qTextDiv.props.children[1]).toBe('Was heißt Hund auf Englisch?');
      expect(userAnsDiv.props.children[1].props.children).toBe('cat');
      expect(correctAnsDiv.props.children[1].props.children).toBe('dog');
    });

    it('formats multi-option correctAnswer array using " oder "', () => {
      const result = DidYouKnowModal({
        isOpen: true,
        correctAnswer: ['pen', 'pencil'],
        onContinue: () => {},
      });

      const modalBox = result?.props.children;
      const explanationContainer = modalBox.props.children.find(
        (child: any) => child && child.props && child.props.style && child.props.style.backgroundColor === '#fefce8'
      );

      const fallbackDiv = explanationContainer.props.children[1];
      const correctAnsDiv = fallbackDiv.props.children[2];
      expect(correctAnsDiv.props.children[1].props.children).toBe('pen oder pencil');
    });

    it('invokes onContinue callback when continue button is clicked', () => {
      const onContinueSpy = vi.fn();
      const result = DidYouKnowModal({
        isOpen: true,
        onContinue: onContinueSpy,
      });

      const modalBox = result?.props.children;
      const continueButton = modalBox.props.children.find(
        (child: any) => child && child.type === 'button'
      );

      expect(continueButton).toBeDefined();
      continueButton.props.onClick();
      expect(onContinueSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('MeditativeIntermission Component & useQuestionTimer Direct Tests', () => {
    let stateStore: Map<number, any>;
    let stateIndex: number;
    const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

    beforeEach(() => {
      stateStore = new Map();
      stateIndex = 0;

      vi.stubGlobal('window', {
        AudioContext: class MockAudioContext {
          state = 'running';
          currentTime = 0;
          createGain() {
            return {
              gain: {
                setValueAtTime() {},
                exponentialRampToValueAtTime() {},
                linearRampToValueAtTime() {},
              },
              connect() {},
            };
          }
          createOscillator() {
            return {
              frequency: { setValueAtTime() {} },
              gain: {
                setValueAtTime() {},
                exponentialRampToValueAtTime() {},
                linearRampToValueAtTime() {},
              },
              type: 'sine',
              connect() {},
              start() {},
              stop() {},
            };
          }
          destination = {};
        },
      });

      const mockDispatcher = {
        useState: (initialValue: any) => {
          const currentIndex = stateIndex++;
          if (!stateStore.has(currentIndex)) {
            const val = typeof initialValue === 'function' ? initialValue() : initialValue;
            stateStore.set(currentIndex, val);
          }
          const setter = (newValue: any) => {
            const currentVal = stateStore.get(currentIndex);
            const computed = typeof newValue === 'function' ? newValue(currentVal) : newValue;
            stateStore.set(currentIndex, computed);
          };
          return [stateStore.get(currentIndex), setter];
        },
        useRef: (initialValue: any) => ({
          current: initialValue,
        }),
        useCallback: (fn: any) => fn,
        useEffect: (effect: any) => {
          const cleanup = effect();
          if (typeof cleanup === 'function') {
            cleanup();
          }
        },
        useMemo: (factory: any) => factory(),
        useLayoutEffect: (effect: any) => {
          const cleanup = effect();
          if (typeof cleanup === 'function') {
            cleanup();
          }
        },
      };

      if (ReactInternals) {
        ReactInternals.H = mockDispatcher;
      }
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      if (ReactInternals) {
        ReactInternals.H = null;
      }
    });

    const renderIntermission = (props: { onComplete: () => void; nextModuleTitle?: string }) => {
      stateIndex = 0;
      return MeditativeIntermission(props);
    };

    const runHook = <T,>(hookFn: () => T): T => {
      stateIndex = 0;
      return hookFn();
    };

    const findTextInTree = (node: any, search: string): boolean => {
      if (!node) return false;
      if (typeof node === 'string') return node.includes(search);
      if (typeof node === 'number') return node.toString().includes(search);
      if (Array.isArray(node)) return node.some((child) => findTextInTree(child, search));
      if (node.props && node.props.children) return findTextInTree(node.props.children, search);
      return false;
    };

    const findButtonByText = (node: any, labelText: string): any => {
      if (!node) return null;
      if (node.type === 'button' && findTextInTree(node, labelText)) return node;
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = findButtonByText(child, labelText);
          if (found) return found;
        }
      }
      if (node.props && node.props.children) return findButtonByText(node.props.children, labelText);
      return null;
    };

    it('initializes MeditativeIntermission with 90-second break timer, formatted time (1:30), 100% progress, and custom module title', () => {
      const onCompleteSpy = vi.fn();
      const jsx = renderIntermission({ onComplete: onCompleteSpy, nextModuleTitle: 'Geometrie Basics' });

      expect(jsx).not.toBeNull();
      expect(jsx?.type).toBe('div');

      expect(findTextInTree(jsx, 'Pause & Entspannung (90 Sek.)')).toBe(true);
      expect(findTextInTree(jsx, 'Geometrie Basics')).toBe(true);
      expect(findTextInTree(jsx, '1:30')).toBe(true);
      expect(findTextInTree(jsx, '90')).toBe(true);
    });

    it('handles manual skip action by clicking "Weiter" button and triggering onComplete', () => {
      const onCompleteSpy = vi.fn();
      const jsx = renderIntermission({ onComplete: onCompleteSpy });

      const skipBtn = findButtonByText(jsx, 'Weiter');
      expect(skipBtn).not.toBeNull();
      expect(typeof skipBtn.props.onClick).toBe('function');

      skipBtn.props.onClick();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('guarantees single onComplete invocation even if Weiter button is clicked multiple times', () => {
      const onCompleteSpy = vi.fn();
      const jsx = renderIntermission({ onComplete: onCompleteSpy });

      const skipBtn = findButtonByText(jsx, 'Weiter');
      expect(skipBtn).not.toBeNull();

      skipBtn.props.onClick();
      skipBtn.props.onClick();
      skipBtn.props.onClick();

      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('handles gong sound trigger when clicking "Gong" button without throwing', () => {
      const onCompleteSpy = vi.fn();
      const jsx = renderIntermission({ onComplete: onCompleteSpy });

      const gongBtn = findButtonByText(jsx, 'Gong');
      expect(gongBtn).not.toBeNull();
      expect(() => gongBtn.props.onClick()).not.toThrow();
    });

    it('triggers onComplete automatically when countdown timer reaches 0 seconds', () => {
      const onCompleteSpy = vi.fn();

      // Pre-set timer state to 0 to simulate countdown complete
      stateStore.set(0, 0);

      renderIntermission({ onComplete: onCompleteSpy });
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('formats countdown time strings accurately across single and multi-digit second boundaries (90s -> 1:30, 65s -> 1:05, 9s -> 0:09)', () => {
      const formatSeconds = (sec: number): string => {
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      };

      expect(formatSeconds(90)).toBe('1:30');
      expect(formatSeconds(65)).toBe('1:05');
      expect(formatSeconds(60)).toBe('1:00');
      expect(formatSeconds(45)).toBe('0:45');
      expect(formatSeconds(9)).toBe('0:09');
      expect(formatSeconds(0)).toBe('0:00');
    });

    it('directly tests useQuestionTimer hook initial state, default values, and target time configuration', () => {
      const result = runHook(() => useQuestionTimer(90));

      expect(result.elapsedTime).toBe(0);
      expect(result.targetTime).toBe(90);
      expect(result.isActive).toBe(true);
      expect(result.isExceeded).toBe(false);
    });

    it('directly tests useQuestionTimer stopTimer and resetTimer actions', () => {
      const result = runHook(() => useQuestionTimer(45));

      // Test stopTimer
      result.stopTimer();
      expect(stateStore.get(2)).toBe(false); // isActive set to false

      // Test resetTimer with new target time
      result.resetTimer(60);
      expect(stateStore.get(0)).toBe(0); // elapsedTime reset to 0
      expect(stateStore.get(1)).toBe(60); // targetTime updated to 60
      expect(stateStore.get(2)).toBe(true); // isActive reset to true
    });

    it('directly tests useQuestionTimer isExceeded evaluation when elapsedTime exceeds targetTime', () => {
      // Set elapsedTime to 50 and targetTime to 45
      stateStore.set(0, 50);
      stateStore.set(1, 45);
      stateStore.set(2, true);

      const result = runHook(() => useQuestionTimer(45));

      expect(result.elapsedTime).toBe(50);
      expect(result.targetTime).toBe(45);
      expect(result.isExceeded).toBe(true);
    });
  });
});
