# Milestone 4 (R4: Adaptive Algorithm Stability) Changes Report

## Overview
Implemented the adaptive algorithm logic for level adjustments based on answer correctness streaks. Difficulty level adjustments now require 2 consecutive correct answers to increase difficulty (+1 up to Level 7) or 2 consecutive incorrect answers to decrease difficulty (-1 down to Level 1). Single correct or incorrect answers reset the opposing streak without changing difficulty.

## Modified and Created Files

### 1. `src/utils/adaptive.ts` (New File)
- Implemented `computeNextLevel(currentLevel: number, isCorrect: boolean, streak: Streak): AdaptiveResult` helper function.
- Resets `incorrect` streak to 0 and increments `correct` streak on correct answer; increases level (max 7) and resets `correct` streak to 0 when `correct >= 2`.
- Resets `correct` streak to 0 and increments `incorrect` streak on incorrect answer; decreases level (min 1) and resets `incorrect` streak to 0 when `incorrect >= 2`.

### 2. `src/utils/adaptive.test.ts` (New File)
- Implemented comprehensive assertion-based unit test suite `runAdaptiveTests()`.
- Covered test cases:
  1. 1 correct answer does NOT increase level.
  2. 2 consecutive correct answers DO increase level (+1).
  3. 1 wrong answer resets correct streak.
  4. 2 consecutive wrong answers DO decrease level (-1).
  5. Level clamping at Level 1 when decreasing.
  6. Level clamping at Level 7 when increasing.

### 3. `src/pages/ModuleMath.tsx` (Modified)
- Imported `computeNextLevel` and `Streak` from `../utils/adaptive`.
- Added state `streak` initialized to `{ correct: 0, incorrect: 0 }`.
- Updated `handleAnswerSubmit` to calculate `newLevel` and `newStreak` via `computeNextLevel`, updating state and `updateMathLevel`.

### 4. `src/pages/ModuleEnglish.tsx` (Modified)
- Imported `computeNextLevel` and `Streak` from `../utils/adaptive`.
- Added state `streak` initialized to `{ correct: 0, incorrect: 0 }`.
- Updated `handleAnswerSubmit` to calculate `newLevel` and `newStreak` via `computeNextLevel`, updating state and `updateEnglishLevel`.

## Verification
- `npm run build`: Executed successfully with zero errors.
- `npm run lint`: Executed successfully with zero errors.
