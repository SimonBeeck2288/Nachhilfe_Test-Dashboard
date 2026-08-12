# Handoff Report: MeditativeIntermission State Management & Re-render Analysis (Explorer 3)

## 1. Observation

- **Target Component File**: [`src/components/minigames/MeditativeIntermission.tsx`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/components/minigames/MeditativeIntermission.tsx)
- **Wrapper / Re-exporter File**: [`src/components/minigames/MiniGameIntermission.tsx`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/components/minigames/MiniGameIntermission.tsx)
- **Parent Page File**: [`src/pages/ModuleMath.tsx`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/pages/ModuleMath.tsx)
- **Context File**: [`src/context/TestSessionContext.tsx`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/context/TestSessionContext.tsx)
- **Test File**: [`src/tests/intermission_modal_expansion.test.ts`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/tests/intermission_modal_expansion.test.ts)

### Verbatim Code Observations:

1. **`MeditativeIntermission.tsx` (Lines 68–80)**:
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

2. **`ModuleMath.tsx` (Lines 185–196)**:
```tsx
  const handleIntermissionComplete = () => {
    navigate('/english');
  };

  if (showIntermission) {
    return (
      <MiniGameIntermission
        onComplete={handleIntermissionComplete}
        nextModuleTitle="Modul 3: Englisch"
      />
    );
  }
```

3. **CLI Commands Executed & Outputs**:
   - `npm run lint` (`oxlint`): **0 errors, 0 warnings** (Finished in 46ms on 78 files).
   - `npm run test` (`vitest`): **30 test files passed (239 tests passed)** in 5.13s.

---

## 2. Logic Chain

1. **Observation**: In `MeditativeIntermission.tsx`, `useEffect` includes `timeLeft` and `onComplete` in its dependency array `[timeLeft, onComplete]`.
2. **Step 1 (Interval Recreation on Every Tick)**: Every time `setTimeLeft((prev) => prev - 1)` decrements `timeLeft` by 1 second, `timeLeft` changes. This triggers the `useEffect` cleanup (`return () => clearInterval(timer)`), destroying the active interval timer and starting a brand new 1000ms timer. Over a 90-second intermission, the interval is torn down and recreated 90 times. Small execution delays during teardown/setup compound into noticeable **timer drift** and sluggish countdown execution.
3. **Observation**: `ModuleMath.tsx` consumes `useTestSession()`. The `handleIntermissionComplete` callback in `ModuleMath.tsx` is defined inline without `useCallback`.
4. **Step 2 (Parent & Context Re-render Interruption)**: Whenever `TestSessionContext` updates (or `ModuleMath` re-renders for any state change), `ModuleMath` re-renders and creates a brand-new function instance for `handleIntermissionComplete`.
5. **Step 3 (Timer Reset Mid-Second)**: The updated `onComplete` prop reference triggers `MeditativeIntermission`'s `useEffect`, destroying the existing interval before 1000ms has elapsed. If context updates or parent re-renders occur frequently, the timer resets repeatedly before completing a full second, causing severe slowdowns or temporary freezes.
6. **Observation**: Neither `MeditativeIntermission` nor `MiniGameIntermission` is memoized with `React.memo`, meaning parent re-renders always propagate down to `MeditativeIntermission`.
7. **Step 4 (Root Cause Summary)**: Timer drift is caused by a double vulnerability:
   - **Internal Flaw**: Tight coupling of `timeLeft` state inside `useEffect` dependencies causing 90 timer teardowns/recreations.
   - **External Flaw**: Lack of callback stabilization (`useRef` / `useCallback`) and component memoization (`React.memo`), causing parent/context re-renders to reset the 1000ms countdown interval mid-cycle.

---

## 3. Caveats

- **Tab Inactivity / Background Throttling**: If a browser tab is minimized or hidden, browsers throttle `setInterval` to at most once per second or once per minute. Step-based `setInterval` (`prev - 1`) will pause or drift heavily when the tab is backgrounded.
- **Timestamp Delta Solution**: Implementing wall-clock timestamp tracking (`Date.now() - startTimeRef.current`) inside a stable interval solves both JS main-thread drift AND tab-backgrounding issues simultaneously.
- **Current Pause Pool**: The intermission component runs continuously for 90 seconds. If mid-session pause overlay (`isPaused`) is toggled during intermission, the timer should optionally respect pause state using an accumulated elapsed time reference.

---

## 4. Conclusion & Recommended Implementation Plan

To achieve stable, precise, drift-free 90-second intermission timer execution without re-render interference:

### Proposed Fix Strategy:
1. **Stabilize Callback and Isolate Timer Setup in `MeditativeIntermission.tsx`**:
   - Use `onCompleteRef = useRef(onComplete)` updated on every render to ensure timer effect does NOT depend on `onComplete` function reference.
   - Use `startTimeRef = useRef(Date.now())` to calculate elapsed wall-clock time (`Date.now() - startTimeRef.current`).
   - Run `useEffect` interval ONCE on mount (`[]` dependency array) or when active.
   - Wrap `MeditativeIntermission` in `React.memo`.

2. **Wrap `onComplete` in `useCallback` in `ModuleMath.tsx`**:
   - Wrap `handleIntermissionComplete` with `useCallback(..., [navigate])`.

3. **Wrap `MiniGameIntermission` in `React.memo`**.

### Proposed Code Snippet (`MeditativeIntermission.tsx` Refactor):

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, Play } from 'lucide-react';

interface MeditativeIntermissionProps {
  onComplete: () => void;
  nextModuleTitle?: string;
}

export const MeditativeIntermission: React.FC<MeditativeIntermissionProps> = React.memo(({
  onComplete,
  nextModuleTitle = 'Nächstes Modul',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep latest onComplete callback ref without triggering timer restart
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Track absolute start time for zero-drift calculation
  const startTimeRef = useRef<number | null>(null);

  // Play synthesized meditative gong using Web Audio API
  const playGongSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
      masterGain.connect(ctx.destination);

      const frequencies = [110, 220, 330, 442, 660];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const initialGain = idx === 0 ? 0.6 : 0.3 / (idx + 1);
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(initialGain, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5 + idx * 0.3);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn('Could not play gong audio:', e);
    }
  }, []);

  // Play gong on mount
  useEffect(() => {
    playGongSound();
  }, [playGongSound]);

  // Stable countdown timer effect (runs ONCE on mount)
  useEffect(() => {
    if (timeLeft <= 0) {
      onCompleteRef.current();
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const timer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
      const remainingSec = Math.max(0, 90 - elapsedSec);

      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timer);
        onCompleteRef.current();
      }
    }, 250);

    return () => clearInterval(timer);
  }, []); // Stable empty dependency array ensures timer is never torn down by state ticks or re-renders

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = (timeLeft / 90) * 100;

  return (
    ...
  );
});
```

---

## 5. Verification Method

To independently verify the fix once implemented by Worker:

1. **Unit & Integration Test Suite Verification**:
   ```bash
   npm run test
   ```
   Confirm all 30 test files and 239+ tests pass without errors (including `src/tests/intermission_modal_expansion.test.ts` and `src/tests/challenger_m2_2_stress.test.ts`).

2. **Linter Inspection**:
   ```bash
   npm run lint
   ```
   Confirm 0 warnings and 0 errors reported by `oxlint`.

3. **Re-render Isolation Verification**:
   - Inspect `MeditativeIntermission.tsx` to verify `useEffect` dependencies do NOT include `timeLeft` or unmemoized `onComplete`.
   - Verify `onCompleteRef` holds callback reference and `startTimeRef` provides timestamp delta calculation.
