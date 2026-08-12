# Domain Specification & Audit Criteria Survey Handoff Report

## 1. Observation
- **Original Specification**: Mined `ORIGINAL_REQUEST.md` (lines 37-80) detailing requirements R1-R3 for Student Switcher UI, automated Vitest coverage, and dual domain review by `@3.1-fachTest` and `@3.2-fachAuditor`.
- **Student Roster & Storage**: Mined `src/types/student.ts`, `src/utils/studentRoster.ts`, and `src/utils/sessionHistory.ts`. Profiles use key `diagnostic_student_roster` and session history uses `diagnostic_session_history`.
- **State Isolation & Context**: Mined `src/context/TestSessionContext.tsx`. Active session state (`diagnosticSession`) holds `currentStudent`, `studentName`, `studentId`, `sessionId`, `mathLevel`, `englishLevel`, `mathTheta`, `englishTheta`, `answers`, `points`, `activeStreak`, `unlockedBadges`, `avatarConfig`, etc. Question deduplication uses `getPastAskedQuestionIds(studentId)`, filtering asked IDs strictly by the active student's ID across their last 10 sessions.
- **English Adaptive Engine**: Mined `src/utils/adaptive.ts`, `src/utils/irt.ts`, `src/pages/ModuleEnglish.tsx`, and `src/data/questions.ts`. Levels 1 to 7 map to A1-C1+ CEFR levels. Transition rule requires 2 consecutive correct answers to level up (+1, max 7) or 2 consecutive incorrect answers to level down (-1, min 1). Question pool exhaustion falls back to level-matched questions, then to full pool loop (spaced repetition).
- **Math Dynamic Generator & Scoring**: Mined `src/data/questions.ts` (`generateMathQuestion`), `src/pages/ModuleMath.tsx`, and `src/utils/evaluation.ts`. Dynamic math formulas cover Levels 1 to 7 with real-world story contexts. `normalizeMathString` strips equation prefixes (`x=`), units (`cm²`, `%`), normalizes decimals (`0,5` -> `0.5`), unicode superscripts (`²` -> `^2`), and operator spaces. `calculateSoftScore` awards 100 points for correct answers within target time and decays overtime linearly up to 50% max penalty (floor = 50 pts).
- **Intermission & Modal UX**: Mined `src/components/DidYouKnowModal.tsx`, `src/components/minigames/MeditativeIntermission.tsx`, `src/hooks/useQuestionTimer.ts`, and `src/components/Timer.tsx`. `DidYouKnowModal` triggers on every incorrect answer (`!isCorrect`). Intermission triggers after Math module with a 90s countdown, breathing animation, synthesized Web Audio gong (110-660 Hz), manual skip button, and auto-completion.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Student Switcher | Global Roster Header Button | Displays active student name & grade in header (`Layout.tsx`), providing 1-click access to switch active student roster. | User click on header profile badge | Navigates to `/` (Roster home) | Fallback to `state.studentName` if profile null | `src/components/Layout.tsx` |
| 2 | Student Switcher | Roster Selection Grid & Modal | Grid of student profile cards on Home page with buttons to select, create, edit, or delete student profiles. | Profile form data (name, grade, subjects, notes) | Saved `StudentProfile` in localStorage | Name required validation in form | `src/pages/Home.tsx`, `src/utils/studentRoster.ts` |
| 3 | State Isolation | Profile State Reset | `startSession` resets session ID, level states to starting level, clears answer history, and sets active `studentId`. | `StudentProfile` object or guest name | Fresh `TestSessionState` | Guests assigned ID `'guest'` | `src/context/TestSessionContext.tsx` |
| 4 | State Isolation | Per-Student Question Deduplication | `getPastAskedQuestionIds` queries history filtered strictly by `studentId`. | `studentId?: string` | `Set<string>` of asked question IDs | Returns empty set if `studentId` undefined | `src/utils/sessionHistory.ts` |
| 5 | English Adaptive | CEFR Level Mapping | 7 discrete levels mapping elementary basics (Level 1 / A1) to complex C1+ structures (Level 7). | `currentLevel` (1..7) | Level-appropriate English question | Clamped within 1..7 bounds | `src/data/questions.ts`, `src/utils/adaptive.ts` |
| 6 | English Adaptive | 2-Hit Level Transition | Smooth level adjustment: +1 level after 2 consecutive correct, -1 level after 2 consecutive incorrect. | `isCorrect: boolean`, `streak: Streak` | Updated `level` and `streak` | Holds current level on single hit | `src/utils/adaptive.ts` |
| 7 | English Adaptive | Continuous IRT Theta Update | Rasch 2PL/3PL model updates continuous skill $\theta \in [-3.0, +3.0]$ with speed multiplier bonus/dampening. | $\theta$, item level, `isCorrect`, `timeTakenMs` | `StudentSkillEstimate` ($\theta$, SE, displayLevel) | Clamps $\theta$ to $[-3.0, +3.0]$ | `src/utils/irt.ts` |
| 8 | English Adaptive | Pool Exhaustion Spaced Repetition | Fallback logic when unasked questions run out: level match -> full pool shuffle. | `askedIds`, `currentLevel`, config filters | Next question or fallback loop | Returns `null` if entire pool empty/off | `src/pages/ModuleEnglish.tsx` |
| 9 | Math Generator | Level 1-7 Dynamic Math Formula | On-the-fly math problem generation with story contexts for arithmetic, fractions, algebra, geometry, binomials, & Pythagoras. | `level: number`, `askedIds: Set<string>` | Dynamically built `Question` object | 50-attempt retry loop for topic filters | `src/data/questions.ts` |
| 10 | Math Evaluation | Smart Tolerance Math Normalizer | Normalizes numbers, decimal commas, equation prefixes (`x=`), units, operator spaces, and fractions. | `userAnswer`, `correctAnswer` | `boolean` (isCorrect match) | Epsilon comparison $\le 1e-4$ for numbers | `src/utils/evaluation.ts` |
| 11 | Scoring | Soft Score Decay Algorithm | Awards 100 pts for timely correct answer; decays linearly overtime up to 50% max penalty (min 50 pts). | `isCorrect`, `timeTakenSec`, `targetTimeSec` | `pointsEarned` (0..100) | Returns 0 for incorrect answers | `src/utils/evaluation.ts` |
| 12 | Intermission | 90s Meditative Break | Intermission screen between Math & English with 90s timer, breathing circle, synthesized audio gong, and skip button. | Timer tick (1s interval) / user skip click | Transitions to `/english` on finish | Audio Context error caught gracefully | `src/components/minigames/MeditativeIntermission.tsx` |
| 13 | Pedagogical Modal | DidYouKnowModal Feedback | Modal overlay on incorrect answers with mascot owl, hint, explanation, and answer comparison. | `isOpen`, `questionText`, `explanation`, `hint` | Pauses flow until user clicks "Weiter" | Fallback rendering if no hint/explanation | `src/components/DidYouKnowModal.tsx` |
| 14 | Timer UX | Question Timer Bar | Real-time counting timer displaying elapsed/target time and color-coded status bar (green/yellow/orange/red). | `elapsedTime`, `targetTime` | Visual clock badge & bar | Overtime marked red without blocking | `src/components/Timer.tsx`, `src/hooks/useQuestionTimer.ts` |

---

## 3. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Student Switcher | Switching student mid-session | `startSession` clears all active answers, resets streak & points, and isolates history to new student ID. |
| 2 | Question Deduplication | Student with 0 past sessions vs 10+ sessions | New students receive full pool; existing students filter out questions asked in their own past 10 sessions. |
| 3 | English Question Exhaustion | All questions at Level $L$ already asked by active student | Engine re-enables previously asked questions at Level $L$; if none exist, opens entire question pool for spaced repetition. |
| 4 | Math Answer Normalization | Input `"x = 1 1/2 cm²"` for target `"1.5"` | `normalizeMathString` strips `"x="` and `"cm²"`, `parseMathNumber` converts `"1 1/2"` to `1.5`, matching target via $\le 1e-4$ epsilon. |
| 5 | Math Soft Score | Correct answer completed 30 seconds overtime | `overtime = 30`, `penaltyRatio = min(0.5, 30 * 0.02) = 0.5`. Score is `100 * (1 - 0.5) = 50` points. |
| 6 | Intermission Timer | User clicks "Weiter" before 90s timer expires | Countdown timer unmounts cleanly, immediately calling `onComplete()` and navigating to English module. |
| 7 | DidYouKnowModal | Question has array of correct answers `['pen', 'pencil']` | `DidYouKnowModal` formats correct answers as `"pen oder pencil"` for student clarity. |
| 8 | Adaptive Level Bounds | Student gets 5 consecutive wrong answers at Level 1 | `computeNextLevel` clamps level to minimum 1 (`Math.max(1, currentLevel - 1)`). |

---

## 4. Logic Chain
1. **Observation**: R1 requires seamless Student Switcher UI in top navigation and start screen without profile cross-contamination.
   - **Reasoning**: `TestSessionContext` manages global session state while `studentRoster.ts` and `sessionHistory.ts` manage persistence. To ensure zero contamination, `startSession()` must reinitialize all temporary session properties while locking the session to `studentId`. `getPastAskedQuestionIds(studentId)` ensures question deduplication is scoped strictly to that student.
2. **Observation**: R2 requires exact specifications for adaptive English mechanics, dynamic Math formulas, and timer/break logic.
   - **Reasoning**: English adaptive mechanics rely on discrete level shifts (2 consecutive hits rule in `computeNextLevel`) paired with continuous IRT theta updates (`updateSkillEstimate`). Math question generation is dynamic via level-specific generators in `generateMathQuestion`. Answer comparison employs robust normalization (`normalizeMathString`) and soft-scoring (`calculateSoftScore`).
3. **Observation**: R3 requires specialized domain audit criteria for `@3.1-fachTest` and `@3.2-fachAuditor`.
   - **Reasoning**: `@3.1-fachTest` evaluates pedagogical progression, level preservation stability, soft-scoring fairness, and problem validity. `@3.2-fachAuditor` evaluates UX usability, Student Switcher profile isolation, break timing (90s intermission), sticky timers, and mascot feedback clarity.

---

## 5. Caveats
- Web Audio API gong sound in `MeditativeIntermission` depends on browser autoplay policies. If audio context is suspended, user interaction (e.g., clicking "Gong 🔔") resumes audio smoothly.
- Dynamic math question generation uses pseudo-random numbers (`getRandomInt`). While dynamic formulas ensure unlimited questions, topic filters (`forced` / `off`) enforce up to 50 retry attempts to find matching topic types.

---

## 6. Conclusion
The specification and domain survey for NachhilfeTest is fully mined and documented. The codebase implements robust state isolation per student ID, adaptive CEFR level mechanics (A1-C1+), dynamic math question generation with soft-scoring, 90-second meditative intermissions, and mascot feedback modals (`DidYouKnowModal`). Clear domain audit criteria have been established for `@3.1-fachTest` and `@3.2-fachAuditor` to execute comprehensive verification.

---

## 7. Verification Method
To verify these domain specifications and ensure software integrity:
1. Run full Vitest suite:
   ```powershell
   npm run test
   ```
2. Run oxlint check:
   ```powershell
   npm run lint
   ```
3. Inspect `src/tests/` unit & integration test coverage for:
   - `studentRoster.test.ts` / `sessionHistory.test.ts` (Profile isolation & deduplication)
   - `adaptive.test.ts` / `irt.test.ts` (English levels & IRT scoring)
   - `evaluation.test.ts` / `smart_tolerance.test.ts` (Math answer normalization & soft scoring)
   - `m3_gamification_ux.test.ts` (Intermission & mascot modal logic)
