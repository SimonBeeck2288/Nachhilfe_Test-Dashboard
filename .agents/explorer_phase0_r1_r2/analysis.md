# Analysis Report: Requirements R1 & R2

## Executive Summary
This document provides a comprehensive structural and technical analysis for implementing **Requirement R1** (*Stopwatch & Dynamic Recommended Target Time UX*) and **Requirement R2** (*Cognition-First Flow & Adaptive Calibration*) in the Nachhilfe-Diagnose-App (`NachhilfeTest`).

---

## Requirement R1: Stopwatch & Dynamic Recommended Target Time UX

### 1. Current State & Code Audit

#### Timer Logic & Components (`src/hooks/useQuestionTimer.ts`, `src/components/Timer.tsx`, `src/components/TimeUpBanner.tsx`)
- **Current Behavior**:
  - `useQuestionTimer(initialTime)` maintains a countdown (`timeLeft` decrementing every second). When `timeLeft === 0`, `isActive` becomes `false`.
  - `Timer.tsx` calculates remaining percentage `(timeLeft / totalTime) * 100` and displays a countdown bar that turns red when `< 15%`.
  - `TimeUpBanner.tsx` renders a prominent warning box ("Die Zeit ist abgelaufen! Möchtest du noch 30 Sekunden extra Zeit zum Nachdenken?").

#### Question Rendering & Input Locking (`src/components/QuestionRenderer.tsx`)
- **Locking Bug**: `QuestionRenderer.tsx` accepts an `isTimeUp` prop. When `isTimeUp === true`:
  - Input field `<input disabled={isTimeUp} />` and submit button `<button disabled={isTimeUp} />` are disabled.
  - Multiple choice buttons `<button disabled={isTimeUp} />` and skip button are disabled.
  - The student is forced to either click "+ 30s Extra-Zeit" or "Überspringen" in `TimeUpBanner`. This interrupts cognition and creates unnecessary pressure.

#### Module Layout & Visibility (`src/pages/ModuleMath.tsx`, `src/pages/ModuleEnglish.tsx`)
- **Layout Bug**: The timer header `<Timer timeLeft={timeLeft} totalTime={currentQuestion.timeLimit} />` is currently inside a standard flex container at the top of the card.
- On long reading passages (e.g., Level 4–7 English questions with multi-paragraph texts), scrolling down causes the timer and question control elements to scroll off-screen.

---

### 2. Proposed Refactoring for R1

#### 2.1 Ascending Stopwatch (`useQuestionStopwatch`)
- **Replacement Hook**: Create/update `useQuestionTimer` or `useQuestionStopwatch` to count **UP** from 0 seconds (`elapsedTime`).
- **State Properties**:
  - `elapsedTime`: number (seconds since question load / reset).
  - `isExceeded`: boolean (`elapsedTime > recommendedTargetTime`).
  - `stopStopwatch()`: stops time measurement on answer submission.
  - `resetStopwatch()`: resets `elapsedTime` to 0 for the next question.

#### 2.2 Non-Locking Soft Recommendation UI
- **Remove Modal Locking**: Completely remove `isTimeUp` disabling logic from `QuestionRenderer.tsx`. Answer buttons and input fields remain **100% clickable and active at all times**.
- **Soft Banner / Pill Indicator**:
  - Replace intrusive `TimeUpBanner` with a subtle, non-intrusive notification element.
  - When `elapsedTime > targetTime`, display a non-locking info badge:
    > 💡 *Richtzeit überschritten (45s). Du kannst weiterknobeln oder zur nächsten Frage springen.*
  - The skip button ("Frage überspringen") remains accessible directly in the question layout without requiring modal interaction.

#### 2.3 Sticky Layout Container
- **Sticky Header**: In `ModuleMath.tsx` and `ModuleEnglish.tsx`, wrap the module progress bar, question counter, level badge, and Stopwatch indicator in a sticky container:
  ```tsx
  <div style={{
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: 'var(--bg-card, #ffffff)',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '1rem'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ color: 'var(--primary)' }}>Modul: Mathematik</h2>
      <Stopwatch elapsedTime={elapsedTime} targetTime={currentQuestion.timeLimit} />
    </div>
    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
      Frage {questionsAsked + 1} • Schwierigkeit: Level {currentLevel}
    </div>
  </div>
  ```
- This guarantees the stopwatch and skip options remain visible on long reading passages without scrolling off-screen.

#### 2.4 Data Record Model Update
- `AnswerRecord.timeTaken` stores exact `elapsedTime` (e.g. `23.4` seconds).
- `AnswerRecord.usedExtraTime` is deprecated or replaced with `isTargetExceeded: boolean`.

---

## Requirement R2: Cognition-First Flow & Adaptive Calibration

### 1. Current State & Code Audit

#### Test Sequence Routing (`src/App.tsx`, `src/pages/ModuleWarmup.tsx`, `src/pages/ModuleCognition.tsx`)
- **Current Sequence**:
  `Home` (`/`) ➔ `Warmup` (`/warmup`) ➔ `Math` (`/math`) ➔ `English` (`/english`) ➔ `Cognition` (`/cognition`) ➔ `Dashboard` (`/dashboard`).
- `ModuleWarmup.tsx` currently routes directly to `/math` (`navigate('/math')`).
- `ModuleCognition.tsx` currently runs at the very end of the test sequence and routes to `/dashboard`. Its reaction time data is recorded in `TestSessionContext` but ignored for adaptive starting difficulty.

---

### 2. Proposed Refactoring for R2

#### 2.1 Sequence Re-Ordering
- **New Sequence**:
  `Warmup` (`/warmup`) ➔ `Kognition (Stroop)` (`/cognition`) ➔ `Adaptive Level Proposal` (`/level-proposal`) ➔ `Subject Test Math` (`/math`) ➔ `Subject Test English` (`/english`) ➔ `Dashboard` (`/dashboard`).

- **Navigation Flow Changes**:
  1. `ModuleWarmup.tsx`: On form submit ➔ `navigate('/cognition')`.
  2. `ModuleCognition.tsx`: On completion of 10 trials ➔ compute Stroop calibration ➔ `navigate('/level-proposal')`.
  3. `LevelProposal.tsx` (New Screen): Displays Stroop calibration summary & proposed starting levels for Math/English ➔ User accepts or adjusts level ➔ `navigate('/math')`.
  4. `ModuleMath.tsx`: Uses calibrated starting level from context ➔ On completion ➔ `navigate('/english')`.
  5. `ModuleEnglish.tsx`: Uses calibrated starting level from context ➔ On completion ➔ `navigate('/dashboard')`.

#### 2.2 Stroop Reaction & Accuracy Calibration Logic (`src/utils/adaptive.ts`)
- Add calibration calculation function `calculateStroopCalibration`:
  ```typescript
  export interface CognitionCalibration {
    avgReactionTimeMs: number;
    accuracy: number; // 0.0 - 1.0
    recommendedStartingLevel: number; // 1 - 3 (conservative starting range)
    recommendedTimeMultiplier: number; // e.g. 1.0, 1.2
    speedRating: 'sehr schnell' | 'normal' | 'bedacht';
  }

  export function calculateStroopCalibration(answers: AnswerRecord[]): CognitionCalibration {
    const cogAnswers = answers.filter(a => a.subject === 'cognition');
    if (cogAnswers.length === 0) {
      return { avgReactionTimeMs: 1500, accuracy: 1.0, recommendedStartingLevel: 1, recommendedTimeMultiplier: 1.0, speedRating: 'normal' };
    }

    const total = cogAnswers.length;
    const correct = cogAnswers.filter(a => a.isCorrect).length;
    const accuracy = correct / total;
    const avgReactionTimeMs = cogAnswers.reduce((acc, a) => acc + (a.reactionTime || a.timeTaken * 1000), 0) / total;

    let recommendedStartingLevel = 1;
    let recommendedTimeMultiplier = 1.0;
    let speedRating: 'sehr schnell' | 'normal' | 'bedacht' = 'normal';

    if (accuracy >= 0.8 && avgReactionTimeMs < 1200) {
      recommendedStartingLevel = 3;
      speedRating = 'sehr schnell';
      recommendedTimeMultiplier = 0.9;
    } else if (accuracy >= 0.7 && avgReactionTimeMs < 1800) {
      recommendedStartingLevel = 2;
      speedRating = 'normal';
      recommendedTimeMultiplier = 1.0;
    } else {
      recommendedStartingLevel = 1;
      speedRating = 'bedacht';
      recommendedTimeMultiplier = 1.2; // Extra grace time for careful or slower processing
    }

    return {
      avgReactionTimeMs,
      accuracy,
      recommendedStartingLevel,
      recommendedTimeMultiplier,
      speedRating
    };
  }
  ```

#### 2.3 TestSessionContext State Integration
- Add calibration state to `TestSessionContext.tsx`:
  ```typescript
  interface TestSessionState {
    studentName: string;
    answers: AnswerRecord[];
    mathLevel: number;
    englishLevel: number;
    motivation?: number;
    favoriteSubject?: string;
    problemSubject?: string;
    cognitionCalibration?: CognitionCalibration;
  }
  ```
- Provide `setCognitionCalibration(calibration: CognitionCalibration)` and `setStartingLevels(mathLevel: number, englishLevel: number)` in context actions.

---

## Code Base Impact Analysis

| File / Component | Required Modifications | Risk |
|---|---|---|
| `src/hooks/useQuestionTimer.ts` | Refactor from countdown to ascending stopwatch (`elapsedTime`). Remove `usedExtraTime` dependency. | Low |
| `src/components/Timer.tsx` | Rename/update to display ascending stopwatch format: `0:15 / Richtzeit 0:45`. | Low |
| `src/components/TimeUpBanner.tsx` | Deprecate locking modal banner or replace with non-locking soft info pill. | Low |
| `src/components/QuestionRenderer.tsx` | Remove `isTimeUp` prop disabling logic from inputs & buttons. | Medium (ensure no side-effects on form submit) |
| `src/pages/ModuleWarmup.tsx` | Change navigation target from `/math` to `/cognition`. Update button label ("Weiter zum Kognitionstest"). | Low |
| `src/pages/ModuleCognition.tsx` | Update end-of-test navigation from `/dashboard` to `/level-proposal`. Calculate calibration. | Low |
| `src/pages/LevelProposal.tsx` (New) | Create new proposal screen for Stroop calibration review & level selection before subject tests. | Low |
| `src/pages/ModuleMath.tsx` & `ModuleEnglish.tsx` | Update layout with `position: sticky` header. Read initial difficulty level from context. Update navigation flow. | Medium |
| `src/utils/adaptive.ts` | Export `calculateStroopCalibration` helper and types. Maintain existing 2-consecutive answer streak logic (`computeNextLevel`). | Low |
| `src/App.tsx` | Add route for `/level-proposal`. | Low |
| `src/utils/adaptive.test.ts` | Add unit tests for `calculateStroopCalibration`. | Low |

---

## Edge Cases & Mitigation Strategies

1. **Edge Case: Stroop Test Rushed or Skips**
   - *Risk*: Student clicks randomly on Stroop test, resulting in 0% accuracy or ultra-low reaction times.
   - *Mitigation*: Clamp `recommendedStartingLevel` between Level 1 and Level 3. Never assign starting level > 3 based solely on Stroop. Subject tests will adapt further via `computeNextLevel`.

2. **Edge Case: Mobile / Narrow Viewport Scrolling**
   - *Risk*: Sticky timer header takes up too much vertical screen space on mobile.
   - *Mitigation*: Use compact flex layout for sticky header (`padding: 0.5rem 1rem`), ensuring reading passages in `QuestionRenderer` get maximum vertical space.

3. **Edge Case: Existing Unit Tests Invalidation**
   - *Risk*: Changing `useQuestionTimer` or evaluation logic could break existing tests.
   - *Mitigation*: Existing unit tests in `src/utils/adaptive.test.ts`, `src/utils/evaluation.test.ts`, and `src/data/questions.test.ts` check `computeNextLevel`, evaluation tolerance, and question counts. They do not depend on React DOM timers. All unit tests must be updated/expanded to verify `calculateStroopCalibration`.

---

## Implementation Milestones Boundary Proposal

- **Milestone 1: R1 Stopwatch & Non-Intrusive Target Time UX**
  - Implement ascending stopwatch (`useQuestionTimer` / `useQuestionStopwatch`).
  - Refactor `Timer.tsx` to display elapsed time vs. recommended target time.
  - Remove locking overlay from `QuestionRenderer.tsx` and `TimeUpBanner.tsx`.
  - Add sticky header container in `ModuleMath.tsx` and `ModuleEnglish.tsx`.
  - Verify build & lint (`npm run build`, `npm run lint`).

- **Milestone 2: R2 Cognition-First Test Flow & Adaptive Calibration**
  - Implement `calculateStroopCalibration` in `src/utils/adaptive.ts` with unit test suite.
  - Update `TestSessionContext.tsx` with calibration state and actions.
  - Update routing in `App.tsx`, `ModuleWarmup.tsx`, and `ModuleCognition.tsx`.
  - Create `LevelProposal.tsx` for presenting & confirming calibrated starting difficulty.
  - Update `ModuleMath.tsx` and `ModuleEnglish.tsx` to utilize calibrated levels and flow into Dashboard.
  - Verify complete workflow and execute full test suite.
