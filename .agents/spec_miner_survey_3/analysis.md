# Test Suite & Infrastructure Specification Analysis

## Executive Summary & Overview
The tutoring test application (`NachhilfeTest`) features a robust Vitest test suite comprising **21 test files** and **188 unit, integration, and end-to-end tests**. All 188 tests currently pass with 100% success (`npm run test`), and static analysis via `oxlint` (`npm run lint`) reports 0 warnings and 0 errors across 69 project files.

This specification report documents the existing test runner infrastructure, inventories all 21 test files and their coverage, records observed edge cases, and provides comprehensive test specifications for required new features and fixes:
1. **Pause Pool & Suspended Timers** (90-second shared session pool)
2. **Question Bookmarking** ("Markieren" button & state persistence)
3. **Back Button Navigation** ("Zurück" button & step-back history rollback)
4. **Mid-Test UX & Tip Modal Removal** (eliminating mid-test "Wusstest du schon?" spoilers)
5. **Decimal Evaluation & Question Bank Fixes** (numeric equivalence, Level 6 cube volume fix, and English option formatting balance)

---

## Test Infrastructure & Setup Specification

### 1. Test Runner & Configuration
- **Runner**: Vitest v4.1.10
- **Execution Script (`package.json`)**:
  - `npm run test` -> `npx vitest run`
  - `npm run lint` -> `oxlint`
- **Vite Integration**: Configured via `vite.config.ts` using `@vitejs/plugin-react`.
- **Environment**: Default Vitest environment is `node`. DOM/Browser features (such as `localStorage`) are polyfilled in test setup blocks (`e2e_scenarios.test.ts` and `studentRoster.test.ts`).
- **Test Runner Wrapper (`src/utils/testRunner.ts`)**: A custom dynamic wrapper around `vitest` exports (`describe`, `it`, `expect`). Allows dynamic execution under both Vitest and standalone Node script harnesses.

### 2. Mocking & State Polyfills
- **`localStorage` Polyfill**:
  ```ts
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
    let store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  }
  ```
- **Time/Timer Mocking**: Utilizes Vitest standard `vi.useFakeTimers()` for countdown and elapsed timer tests.

---

## Inventory of Existing Test Files & Coverage

| # | File Path | Tests | Target Module / Component | Primary Coverage Focus |
|---|-----------|-------|---------------------------|------------------------|
| 1 | `src/data/questions.test.ts` | 3 | `src/data/questions.ts` | English question pool minimum counts per level (>=15 for L1-L7, total >=105) and reading passage presence. |
| 2 | `src/tests/challenger_m1_1.test.ts` | 4 | `src/data/questions.ts` | Microsecond loop unique ID generation harness (10,000 iterations), level distribution, time limits. |
| 3 | `src/tests/challenger_m1_2_stress.test.ts` | 8 | `src/data/questions.ts` | English question pool stress testing, adaptive level boundaries, reading passage filtering. |
| 4 | `src/tests/challenger_m2_2_stress.test.ts` | 10 | `src/utils/studentRoster.ts`, `src/utils/sessionHistory.ts` | Multi-student profile switching stress tests, roster isolation, history persistence under heavy load. |
| 5 | `src/tests/e2e_scenarios.test.ts` | 4 | Full App Integration | End-to-end student journeys (High-performer and Struggling student), Stroop calibration to Math/English flow. |
| 6 | `src/tests/english_adaptive_expansion.test.ts` | 20 | `src/utils/adaptive.ts`, `src/data/questions.ts` | Comprehensive English adaptive step-up/step-down, streak tracking, passage assignment. |
| 7 | `src/tests/gamification_logic.test.ts` | 11 | `src/utils/evaluation.ts`, `src/context/TestSessionContext.tsx` | Soft point scoring calculation (`calculateSoftScore`), streak bonus, automatic badge unlocks, avatar accessories. |
| 8 | `src/tests/intermission_modal_expansion.test.ts` | 15 | `src/components/minigames/*`, `src/components/DidYouKnowModal.tsx` | Minigame intermissions (AppleCatcher, BubblePopper, MeditativeIntermission) and mascot modal state logic. |
| 9 | `src/tests/irt_scoring.test.ts` | 9 | `src/utils/irt.ts` | 1PL Item Response Theory scoring, item difficulty parameters, theta estimation. |
| 10 | `src/tests/m3_gamification_ux.test.ts` | 6 | `src/context/TestSessionContext.tsx` | Gamification rewards integration into diagnostic flow, streak increments, avatar state persistence. |
| 11 | `src/tests/math_dynamic_expansion.test.ts` | 20 | `src/data/questions.ts` | Math procedural question generation across Levels 1-7, geometry shape keyword insertion, topic breakdown. |
| 12 | `src/tests/questions_pool.test.ts` | 10 | `src/data/questions.ts` | Expanded English pool (>=50 per level, total >=350), Math generator, audio/visual contract, diagnostic serving. |
| 13 | `src/tests/smart_tolerance.test.ts` | 12 | `src/utils/evaluation.ts` | Tolerant answer evaluation (`evaluateMathAnswer`, `evaluateEnglishAnswer`), equation prefixes, units, fractions. |
| 14 | `src/tests/student_switching.test.ts` | 14 | `src/utils/studentRoster.ts` | Student profile creation, updates, deletion, roster state switching, session history association. |
| 15 | `src/utils/adaptive.test.ts` | 9 | `src/utils/adaptive.ts` | `computeNextLevel` level steps, streak increments/resets, Stroop calibration level mapping, level bounds (1-7). |
| 16 | `src/utils/config.test.ts` | 2 | `src/types/config.ts` | Custom test configurator settings, topic modes ('forced', 'off', 'normal'), duration limits. |
| 17 | `src/utils/evaluation.test.ts` | 10 | `src/utils/evaluation.ts` | Unit tests for answer normalization, article stripping, case/punctuation tolerance, synonym dictionary. |
| 18 | `src/utils/irt.test.ts` | 6 | `src/utils/irt.ts` | Unit tests for 1PL IRT theta updates, probability logistic curves, theta clamping bounds. |
| 19 | `src/utils/sessionHistory.test.ts` | 5 | `src/utils/sessionHistory.ts` | `saveSessionRecord`, `clearSessionHistory`, `getSessionById`, `getPastAskedQuestionIds`. |
| 20 | `src/utils/shuffle.test.ts` | 5 | `src/utils/shuffle.ts` | Fisher-Yates array shuffling logic. |
| 21 | `src/utils/studentRoster.test.ts` | 5 | `src/utils/studentRoster.ts` | Student roster storage and CRUD operations in localStorage. |

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Infrastructure | Vitest Test Suite | Executes 188 tests across 21 files cleanly | `npm run test` | 188 passed, Exit 0 | Non-zero exit on test failure | `package.json` & terminal run |
| 2 | Infrastructure | Oxlint Static Analysis | Scans 69 project files against 104 lint rules | `npm run lint` | 0 errors, 0 warnings, Exit 0 | Non-zero exit on lint error | `package.json` & terminal run |
| 3 | Core State | TestSessionContext | React context managing session state, answers, level, streak, points, and badges | Student profile, answers | State updates, `diagnosticSession` in `localStorage` | Falls back to `initialState` on JSON parse error | `src/context/TestSessionContext.tsx` |
| 4 | Adaptivity | 2-Step Adaptive Level Engine | Adjusts level (+1 after 2 correct, -1 after 2 incorrect) clamped between Level 1 and Level 7 | `currentLevel`, `isCorrect`, `streak` | `{ level, streak }` | Clamps at min Level 1, max Level 7 | `src/utils/adaptive.ts` & `src/utils/adaptive.test.ts` |
| 5 | Evaluation | Math Answer Tolerance | Normalizes math inputs (strips `x=`, units, spaces around operators, supports fractions & decimal commas) | `userAnswer`, `correctAnswer` | `boolean` | Returns `false` for invalid math expressions | `src/utils/evaluation.ts` & `src/tests/smart_tolerance.test.ts` |
| 6 | Evaluation | English Answer Tolerance | Normalizes English inputs (case, punctuation, whitespace, leading articles `a/an/the`, synonyms) | `userAnswer`, `correctAnswer`, `synonyms` | `boolean` | Returns `false` for non-matching input | `src/utils/evaluation.ts` & `src/utils/evaluation.test.ts` |
| 7 | Mid-Test UX | DidYouKnowModal Popup | Mascots tip modal popping up on incorrect answer showing `correctAnswer` | Incorrect answer submit | Modal overlay with correct answer & explanation | Disrupts test flow mid-test | `src/pages/ModuleMath.tsx` & `src/pages/ModuleEnglish.tsx` |
| 8 | Intermission | Minigame Intermissions | 30-second break between modules with mini-games (AppleCatcher, BubblePopper, MeditativeIntermission) | Module completion event | Intermission UI view | Navigates to next module on complete | `src/components/minigames/*` |
| 9 | Question Pool | Dynamic Math Generator | Generates procedural math questions across 7 difficulty levels and topics | `level`, `askedIds` | `Question` object | Returns null if forced topic criteria unmet after 50 attempts | `src/data/questions.ts` & `src/tests/math_dynamic_expansion.test.ts` |
| 10 | Question Pool | Redundant Level 6 Cube Question | Level 6 geometry question asking for edge length `a` when `a` is given in text | `a = 6` | `text: ... Wie lang ist eine Kante a?`, `correctAnswer: '6'` | Tautological question with no diagnostic value | `src/data/questions.ts:808` & `DOMAIN_REVIEW.md` |
| 11 | Question Pool | English Option Imbalance | Level 5-7 MC questions with multi-synonym correct answers vs single-word distractors | `e5_30`, `e6_33`, etc. | Options with `erheblich / beachtlich` | Answer format reveals correct choice visually | `src/data/questions.ts` & `DOMAIN_REVIEW.md` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Math Evaluation | Decimal responses: `"1"` vs `"1,0"` | Parsed mathematically via `parseMathNumber`: both yield `1`, epsilon comparison returns `true`. |
| 2 | Math Evaluation | Whitespace in input: `" 1,0 "` vs `"1"` | `normalizeMathString` trims leading/trailing spaces and converts `,` to `.`, resolving to `1.0` -> `true`. |
| 3 | Question Generator | Pool exhaustion at Level 1 | Spaced repetition fallback resets asked filter so student can take 45 questions cleanly. |
| 4 | Node Test Environment | Access to `localStorage` without polyfill | Node 22+ emits `ExperimentalWarning` if `localStorage` is uninitialized without polyfill. Polyfill in test files prevents runtime errors. |
| 5 | Redundant Question | Level 6 Cube question: `a = 6` | System currently asks "Wie lang ist eine Kante a?" when `a` is given as 6. Needs fix to ask for volume ($V = a^3 = 216$). |
| 6 | Option Imbalance | MC option containing `/` or parens | Option formatting reveals correct choice (`'erheblich / beachtlich'` vs `'winzig'`). Needs standardization to single words. |

---

## Required New Test Suites Specification

To ensure 100% test coverage for the refactored features and fixes mandated by `ORIGINAL_REQUEST.md`, five new test suites must be added. Below are the detailed specifications for each required new test suite.

---

### New Test Suite 1: Pause Pool & Suspended Timers (`src/tests/pause_pool.test.ts`)

**Target Functionality**: Shared 90-second Pause Pool across `ModuleMath` and `ModuleEnglish`.
**Test Suite File**: `src/tests/pause_pool.test.ts`

#### Test Cases Specification:
1. **Initial State Verification**:
   - Assert `pausePoolRemainingSeconds` initializes to `90` in `TestSessionState`.
   - Assert `isPaused` initializes to `false`.
2. **Pause Activation & Timer Suspension**:
   - Start active question timer at 0s elapsed.
   - Trigger `togglePause()`. `isPaused` becomes `true`.
   - Advance virtual time by 5 seconds (`vi.advanceTimersByTime(5000)`).
   - Assert active question `elapsedTime` did NOT increment (remains suspended).
   - Assert module timer did NOT increment.
   - Assert `pausePoolRemainingSeconds` decreased by 5 seconds (from 90 to 85).
3. **Resume Activation**:
   - Trigger `togglePause()` to resume. `isPaused` becomes `false`.
   - Advance virtual time by 3 seconds.
   - Assert active question `elapsedTime` resumed incrementing (adds 3s).
   - Assert `pausePoolRemainingSeconds` remains unchanged at 85s.
4. **Pool Exhaustion & Auto-Unpause**:
   - Set `pausePoolRemainingSeconds` to `5`.
   - Trigger `togglePause()` (pause ON).
   - Advance virtual time by 5 seconds (pool ticks down to 0).
   - Assert `pausePoolRemainingSeconds` reaches `0`.
   - Assert `isPaused` automatically toggles back to `false` (auto-resumes test).
   - Assert Pause button state is `disabled`.
   - Attempting to call `togglePause()` when pool is `0` returns `false` / does nothing.
5. **Cross-Module Pool Balance Persistence**:
   - Pause in `ModuleMath` for 30 seconds -> `pausePoolRemainingSeconds` = 60.
   - Navigate to `ModuleEnglish`.
   - Assert `ModuleEnglish` reads `pausePoolRemainingSeconds` as 60 (shared balance preserved).
6. **Edge Case — Rapid Toggle**:
   - Rapidly call `togglePause()` twice in <100ms.
   - Assert timer intervals do not stack and pause pool balance is correctly maintained.

---

### New Test Suite 2: Question Bookmarking (`src/tests/bookmarking.test.ts`)

**Target Functionality**: "Markieren" button on questions, state persistence, and end-of-test report inclusion.
**Test Suite File**: `src/tests/bookmarking.test.ts`

#### Test Cases Specification:
1. **Toggle Bookmark State**:
   - Render question item `m2_1`. Initial state: `isBookmarked` = `false`.
   - Click "Markieren". Call `toggleBookmark('m2_1')`.
   - Assert `bookmarkedQuestionIds` set/array contains `'m2_1'`.
   - Click "Markieren" again.
   - Assert `bookmarkedQuestionIds` no longer contains `'m2_1'`.
2. **Persistence in Test Session State**:
   - Bookmark questions `'m1_3'` and `'e2_5'`.
   - Serialize `TestSessionState` to `localStorage` ('diagnosticSession').
   - Re-hydrate context state from `localStorage`.
   - Assert `bookmarkedQuestionIds` contains `'m1_3'` and `'e2_5'`.
3. **End-of-Test History Record Integration**:
   - Complete test session with questions `'m1_3'` bookmarked.
   - Call `saveSessionToHistory()`.
   - Retrieve saved record via `getSessionById(sessionId)`.
   - Assert saved `TestSessionRecord` includes `bookmarkedQuestionIds: ['m1_3']`.
   - Assert diagnostic report breakdown correctly flags question `'m1_3'` as bookmarked.
4. **Edge Case — Reset on Clear Session**:
   - Call `clearSession()`.
   - Assert `bookmarkedQuestionIds` is emptied (`[]`).

---

### New Test Suite 3: Back Button Navigation (`src/tests/back_button_navigation.test.ts`)

**Target Functionality**: "Zurück" button allowing answer re-entry and step-back history undo.
**Test Suite File**: `src/tests/back_button_navigation.test.ts`

#### Test Cases Specification:
1. **First Question Boundary Condition**:
   - On Question #1 (index 0 of current module), inspect "Zurück" button state.
   - Assert "Zurück" button is `disabled` or hidden (cannot navigate back before start).
2. **Step-Back Navigation & Active Question Rollback**:
   - Submit answer `"8"` for Question #1 (`m1_1`). Active question advances to Question #2 (`m1_2`).
   - Click "Zurück" button (`handleGoBack()`).
   - Assert active question reverts to Question #1 (`m1_1`).
   - Assert input field pre-populates with previous response `"8"`.
   - Assert `questionsAsked` count decrements from 1 to 0.
3. **State & Adaptive Level Rollback**:
   - Question #1 answered correctly -> Level increased from 1 to 2, streak = {correct: 1, incorrect: 0}.
   - Click "Zurück".
   - Assert session state `mathLevel` reverts back to 1.
   - Assert `streak` reverts back to {correct: 0, incorrect: 0}.
   - Assert `answers` array removes the last recorded answer.
   - Assert `askedIds` removes `'m1_1'`.
4. **Answer Modification & Re-Submission**:
   - After stepping back to Question #1, change answer from `"8"` to `"10"`.
   - Click "Antwort absenden".
   - Assert new answer `"10"` is evaluated and recorded in `answers`.
   - Assert test flow proceeds smoothly to Question #2.
5. **Edge Case — Multiple Step-Backs**:
   - Complete Question #1, Question #2, Question #3.
   - Click "Zurück" twice.
   - Assert active question reverts to Question #1 with correct state at step 1.

---

### New Test Suite 4: Mid-Test UX & Tip Modal Removal (`src/tests/mid_test_ux.test.ts`)

**Target Functionality**: Removal of mid-test "Wusstest du schon?" modal popups (`DidYouKnowModal`) in `ModuleMath` and `ModuleEnglish`.
**Test Suite File**: `src/tests/mid_test_ux.test.ts`

#### Test Cases Specification:
1. **Immediate Question Advance on Incorrect Answer (ModuleMath)**:
   - Present Question #1 (`m1_1`) in `ModuleMath`.
   - Submit incorrect answer `"999"`.
   - Assert `DidYouKnowModal` is NOT rendered/visible.
   - Assert test immediately transitions to Question #2.
   - Assert question timer resets immediately for Question #2 without modal pause.
2. **Immediate Question Advance on Incorrect Answer (ModuleEnglish)**:
   - Present Question #1 (`e1_1`) in `ModuleEnglish`.
   - Submit incorrect answer `"cat"`.
   - Assert `DidYouKnowModal` is NOT rendered/visible.
   - Assert test immediately transitions to Question #2.
3. **Answer Secrecy Verification**:
   - Verify that submitting an incorrect answer does NOT disclose `correctAnswer` in the DOM or UI state during active test module execution.
4. **Intermission & Report Preservation**:
   - Complete all questions in `ModuleMath`.
   - Assert `MiniGameIntermission` still launches between Module 2 and Module 3 as designed.
   - Complete test and open Dashboard / Diagnostic Report.
   - Assert hints and explanations remain fully accessible for post-test review in the report summary.

---

### New Test Suite 5: Decimal Evaluation & Question Bank Fixes (`src/tests/question_bank_fixes.test.ts`)

**Target Functionality**: Verification of decimal numeric equivalence in `evaluateMathAnswer`, Level 6 cube volume fix, and English option format balance.
**Test Suite File**: `src/tests/question_bank_fixes.test.ts`

#### Test Cases Specification:
1. **Decimal Numeric Comparison Tests (`evaluateMathAnswer`)**:
   - `evaluateMathAnswer('1', '1,0')` -> `true`
   - `evaluateMathAnswer('1,0', '1')` -> `true`
   - `evaluateMathAnswer(' 1 ', '1,0')` -> `true` (whitespace trimming & decimal equivalence)
   - `evaluateMathAnswer('2,50', '2.5')` -> `true`
   - `evaluateMathAnswer(' 003,500 ', '3.5')` -> `true`
   - `evaluateMathAnswer('0', '0.0')` -> `true`
   - `evaluateMathAnswer('1.5', '1,50')` -> `true`
   - `evaluateMathAnswer('1.2', '1.3')` -> `false`
2. **Level 6 Cube Question Fix Verification**:
   - Generate or inspect Level 6 cube question (`type === 2`, level 6 in `src/data/questions.ts`).
   - For `a = 6`:
     - Assert question text contains: `"Ein würfelförmiges Paket hat eine Kantenlänge a = 6 cm. Wie groß ist das Volumen V des Pakets?"` (asking for Volume, NOT edge length).
     - Assert `correctAnswer` equals `"216"` (or `"216 cm³"`), NOT `"6"`.
     - Test evaluation: `evaluateMathAnswer('216', q.correctAnswer)` -> `true`.
3. **English Multiple-Choice Option Formatting Standardization**:
   - Iterate through all multiple-choice questions in `englishQuestions`.
   - For every question with `type === 'multiple-choice'`:
     - Check option strings for formatting imbalance (e.g. correct option containing `/` or parenthetical translations while distractors are single words).
     - Assert no option contains exclusive dual-synonym formatting like `'erheblich / beachtlich'`.
     - Options must be standardized (e.g. `'erheblich'`, `'winzig'`, `'zufällig'`).

---

## Conclusion & Actionable Verification Plan
All 21 existing test files pass cleanly (`npm run test`, 188 passed). Adding the 5 specified new test suites will bring total test suites to **26 files** and provide 100% acceptance coverage for requirements R1–R5.
