# Handoff Report: R1 & R2 Investigation

## 1. Observation
- **Timer & Input Locking (`src/components/QuestionRenderer.tsx:181,210,214,226`)**: Currently, `<button disabled={isTimeUp}>` and `<input disabled={isTimeUp}>` freeze student input when the countdown timer reaches 0.
- **Countdown Timer (`src/hooks/useQuestionTimer.ts:11-17`)**: `useQuestionTimer` decrements `timeLeft` down to 0, forcing a modal overlay (`TimeUpBanner.tsx`) that interrupts test workflow.
- **Header Layout (`src/pages/ModuleMath.tsx:111-114`, `src/pages/ModuleEnglish.tsx:129-132`)**: The `Timer` component is rendered inside a static header block (`<div style={{ display: 'flex', justifyContent: 'space-between'... }}>`). When reading long passages in English (Level 4–7), scrolling down causes the timer and navigation controls to scroll out of view.
- **Routing Sequence (`src/pages/ModuleWarmup.tsx:20`, `src/pages/ModuleCognition.tsx:103`, `src/App.tsx:16-25`)**: Warmup currently navigates directly to `/math` (`navigate('/math')`), and Cognition runs at the very end (`navigate('/dashboard')`). Stroop reaction time and accuracy are stored in `TestSessionContext`, but not used to calibrate starting difficulty levels for Math or English.
- **Build & Test Verification**:
  - `npm run build`: Exit code 0 (`tsc -b && vite build` succeeded).
  - `npm run lint`: 1 warning (`react(only-export-components)` in `TestSessionContext.tsx`), 0 errors.
  - Unit tests via `npx tsx`: `src/utils/evaluation.test.ts`, `src/utils/adaptive.test.ts`, and `src/data/questions.test.ts` all pass with exit code 0.

---

## 2. Logic Chain
1. **R1 Analysis**:
   - The user requested replacing rigid countdown timers and locking banners with an ascending stopwatch and non-intrusive target times ("Richtzeiten").
   - Removing the `isTimeUp` prop disabling logic from `QuestionRenderer.tsx` and refactoring `useQuestionTimer.ts` to count upwards (`elapsedTime`) guarantees answer buttons remain active after target time elapses.
   - Wrapping the header bar in `position: sticky; top: 0; z-index: 10` inside `ModuleMath.tsx` and `ModuleEnglish.tsx` ensures timer indicators and skip buttons stay visible regardless of question height or passage length.
2. **R2 Analysis**:
   - Re-ordering the test flow to `Warm-up ➔ Kognition (Stroop) ➔ Adaptive Level Proposal ➔ Subject Modules (Math/English) ➔ Dashboard` requires updating navigation in `ModuleWarmup.tsx` (`/cognition`), `ModuleCognition.tsx` (`/level-proposal`), and adding a `/level-proposal` route in `App.tsx`.
   - Calculating cognition metrics (`avgReactionTimeMs` and `accuracy`) after the 10 Stroop trials allows proposing an initial starting level (1–3) and time multiplier, which can be stored in `TestSessionContext` and selected on the Level Proposal screen before entering Math and English modules.

---

## 3. Caveats
- **No Source Code Changes Made**: This subagent performed a read-only investigation. No source files under `src/` were edited.
- **Scope Boundary**: Requirement R3 (Multi-Student Roster), R4 (Data Persistence), R5 (Analytics Dashboard), R6 (Custom Test Configurator), and R7 (PDF Export) will be investigated or implemented in subsequent milestones.
- **Stroop Edge Case**: If a user rushes through the Stroop test with low accuracy, the starting level should be conservatively clamped to Level 1–2 so the subject test can reliably adapt up using `computeNextLevel`.

---

## 4. Conclusion
The current codebase has clean modular architecture suitable for implementing R1 and R2:
- R1 can be achieved by converting `useQuestionTimer` to count up, removing input disabling in `QuestionRenderer`, displaying soft Richtzeit recommendations, and applying sticky positioning to module headers.
- R2 can be achieved by re-routing the test flow through `/cognition` and a new `/level-proposal` screen, using a new `calculateStroopCalibration` utility function in `src/utils/adaptive.ts`.
- Recommended milestones:
  - **Milestone 1**: Implement R1 Stopwatch, non-locking soft recommendation, and sticky layout visibility.
  - **Milestone 2**: Implement R2 Cognition-First flow, calibration algorithm, Level Proposal screen, and context integration.

---

## 5. Verification Method
- **Build Verification**: Run `npm run build` from root directory (`c:/Users/beeck/git/repos/NachhilfeTest`). Must compile with 0 TypeScript / Vite errors.
- **Lint Verification**: Run `npm run lint`. Must run cleanly without errors.
- **Unit Test Verification**: Run `npx tsx src/utils/evaluation.test.ts`, `npx tsx src/utils/adaptive.test.ts`, and `npx tsx src/data/questions.test.ts`. All test suites must log successful completion.
- **Analysis Artifact Verification**: Inspect `c:/Users/beeck/git/repos/NachhilfeTest/.agents/explorer_phase0_r1_r2/analysis.md` and `handoff.md`.
