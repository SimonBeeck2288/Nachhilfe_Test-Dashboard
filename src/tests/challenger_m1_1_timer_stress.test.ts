import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { MeditativeIntermission } from '../components/minigames/MeditativeIntermission';

describe('Empirical Verification: MeditativeIntermission Timer Stabilization (M1)', () => {
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

  it('1. Initializes timer with exactly 90 seconds and renders initial countdown (1:30)', () => {
    const onCompleteSpy = vi.fn();
    const jsx = renderIntermission({ onComplete: onCompleteSpy, nextModuleTitle: 'Mathematik Modul 2' });

    expect(jsx).not.toBeNull();
    expect(findTextInTree(jsx, '1:30')).toBe(true);
    expect(findTextInTree(jsx, 'Mathematik Modul 2')).toBe(true);
    expect(onCompleteSpy).not.toHaveBeenCalled();
  });

  it('2. Triggers onComplete immediately on mount when initial time is 0s or less', () => {
    const onCompleteSpy = vi.fn();
    stateStore.set(0, 0); // initial timeLeft set to 0

    renderIntermission({ onComplete: onCompleteSpy });
    expect(onCompleteSpy).toHaveBeenCalledTimes(1);
  });

  it('3. Guarantees single onComplete execution when "Weiter" button is clicked repeatedly', () => {
    const onCompleteSpy = vi.fn();
    const jsx = renderIntermission({ onComplete: onCompleteSpy });

    const skipBtn = findButtonByText(jsx, 'Weiter');
    expect(skipBtn).not.toBeNull();

    // Trigger multiple clicks
    skipBtn.props.onClick();
    skipBtn.props.onClick();
    skipBtn.props.onClick();

    expect(onCompleteSpy).toHaveBeenCalledTimes(1);
  });

  it('4. Ref-decoupled onComplete handler invokes the latest passed callback without resetting interval', () => {
    let callCountA = 0;
    let callCountB = 0;
    const initialCallback = () => { callCountA++; };
    const updatedCallback = () => { callCountB++; };

    // Initial render with initialCallback
    let jsx = renderIntermission({ onComplete: initialCallback });

    // Simulate parent re-render passing updatedCallback
    jsx = renderIntermission({ onComplete: updatedCallback });

    const skipBtn = findButtonByText(jsx, 'Weiter');
    skipBtn.props.onClick();

    expect(callCountA).toBe(0);
    expect(callCountB).toBe(1);
  });

  it('5. Gong sound button executes safely without throwing errors across multiple triggers', () => {
    const onCompleteSpy = vi.fn();
    const jsx = renderIntermission({ onComplete: onCompleteSpy });

    const gongBtn = findButtonByText(jsx, 'Gong');
    expect(gongBtn).not.toBeNull();

    expect(() => {
      gongBtn.props.onClick();
      gongBtn.props.onClick();
    }).not.toThrow();
  });
});
