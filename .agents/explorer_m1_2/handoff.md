# Handoff Report — Milestone 1: MeditativeIntermission Timer Stabilization Investigation

## 1. Observation

### 1.1 Target File & Code Snippet
- **Path**: `src/components/minigames/MeditativeIntermission.tsx`
- **Lines 68–80**:
```tsx
  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);
```
- **Line 170 (Weiter Button)**:
```tsx
  <button onClick={onComplete} ...>Weiter</button>
```

### 1.2 Test Harness Observation
- **Path**: `src/tests/intermission_modal_expansion.test.ts`
- Tests currently verify basic rendering, manual skip button click, audio gong trigger, and instant 0s expiration using a custom React client internals dispatcher mock (`ReactInternals.H`).
- Baseline test suite execution:
  - `npm run test`: **30 test files passed (239 tests passed)**.
  - `npm run lint`: **0 warnings, 0 errors** (oxlint across 78 files).

---

## 2. Logic Chain

### 2.1 Timer Drift & Slowdown Root Cause
1. `timeLeft` is listed in the `useEffect` dependency array `[timeLeft, onComplete]`.
2. Every 1000ms tick, `setTimeLeft((prev) => prev - 1)` changes `timeLeft` state from $N$ to $N-1$.
3. When `timeLeft` changes, React executes the effect cleanup function (`clearInterval(timer)`), tearing down the active interval.
4. The effect callback then executes again, creating a brand-new `setInterval(..., 1000)`.
5. Over a 90-second intermission, the timer is destroyed and re-registered **90 times**.
6. Each interval teardown and re-instantiation incurs JavaScript engine scheduling overhead, event loop microtask delays, and React state batching latency.
7. The accumulated overhead per tick causes the 90-second countdown to drift and execute noticeably slower than real wall-clock time.

### 2.2 Re-render Vulnerability & Timer Freezing
1. If parent components or `TestSessionContext` trigger re-renders (e.g. background session persistence ticks, audio context state changes, layout updates), `MeditativeIntermission` re-renders.
2. Because `timeLeft` and `onComplete` are dependencies, every parent re-render destroys the existing 1000ms interval and schedules a new 1000ms countdown starting from 0ms for that second.
3. If parent re-renders occur more frequently than once per second (e.g., 500ms intervals), the countdown timer is continuously reset before 1000ms elapses, effectively freezing the countdown.

### 2.3 Edge Case 1: Manual Skip ("Weiter" Click) Teardown
1. Clicking "Weiter" triggers `onComplete()` directly via inline handler: `onClick={onComplete}`.
2. The active `setInterval` inside `useEffect` remains active until React unmounts the component.
3. If unmounting is delayed (e.g., async transition, router animation), the interval continues ticking in the background. If it hits 0s, `onComplete()` is called a second time.

### 2.4 Edge Case 2: Multiple `onComplete` Invocations at 0s
1. When `timeLeft` reaches 0, `useEffect` sees `if (timeLeft <= 0)` and calls `onComplete()`.
2. `timeLeft` state remains `0` in memory.
3. If the component stays mounted or parent re-renders while `timeLeft === 0` (or if `onComplete` prop reference changes), `useEffect` re-evaluates and executes `onComplete()` again.

---

## 3. Caveats

1. **Custom Test Harness**: `src/tests/intermission_modal_expansion.test.ts` uses a custom `ReactInternals` dispatcher for unit testing. Any refactoring must maintain compatibility with both real React DOM rendering (`vi.useFakeTimers()`) and the custom dispatcher test harness.
2. **Initial `timeLeft <= 0` State**: If the component is rendered with `timeLeft` initialized to `0` (such as in edge tests), `onComplete` must be called on mount without throwing or entering an infinite loop.

---

## 4. Conclusion & Recommended Implementation Plan

`MeditativeIntermission.tsx` should be modified using React `useRef` hooks to decouple interval scheduling from `timeLeft` state updates and guard callback execution.

### Recommended Code Architecture for `MeditativeIntermission.tsx`:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
// ... lucide icons ...

export const MeditativeIntermission: React.FC<MeditativeIntermissionProps> = ({
  onComplete,
  nextModuleTitle = 'Nächstes Modul',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1. Maintain stable reference to latest onComplete callback
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 2. Track completion state to guarantee single execution
  const hasCompletedRef = useRef(false);

  // 3. Track active interval handle for instant cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 4. Centralized completion handler with single-invocation guarantee & interval cleanup
  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onCompleteRef.current();
  }, []);

  // 5. Stable interval timer setup - runs once on mount
  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // Empty dependency array prevents timer teardown on ticks or re-renders!

  // ... playGongSound, formattedTime, JSX ...

  // 6. Connect "Weiter" button to handleComplete
  // <button onClick={handleComplete} ...>Weiter</button>
```

---

## 5. Verification Method

To verify the refactored `MeditativeIntermission.tsx`:

1. **CLI Commands**:
   - `npm run test` -> Must complete with 100% pass rate across all 30 test suites (239+ tests).
   - `npm run lint` -> Must return 0 errors and 0 warnings.
2. **Key Conditions to Test**:
   - Verify fake timer countdown (`vi.useFakeTimers()`): Advance timer by 90,000ms and verify `onComplete` is called exactly once.
   - Verify manual skip: Trigger "Weiter" button click at `timeLeft = 45`, advance timers by 90,000ms, and verify `onComplete` is called exactly once (not twice).
   - Verify parent re-renders: Force parent component re-renders every 200ms while timer is running; verify timer continues decrementing accurately at 1-second intervals.
