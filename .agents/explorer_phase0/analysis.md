# Comprehensive Investigation Report: NachhilfeTest Application

**Agent:** Explorer Subagent (`explorer_phase0`)  
**Date:** 2026-08-02  
**Target Application:** NachhilfeTest (`c:/Users/beeck/git/repos/NachhilfeTest`)  

---

## Executive Summary

The **NachhilfeTest** application is a React 19 + TypeScript + Vite single-page web application providing digital entry diagnostics for tutoring students in grades 1–8. It assesses performance in **Mathematics**, **English**, and cognitive reaction time via a **Stroop Test**.

This investigation evaluated the full codebase in `src/` against requirements **R1 to R6** derived from `DOMAIN_REVIEW.md` and `plan.md`. The overall architecture is clean and functional, but several state persistence, evaluation tolerance, UX, adaptive algorithm, question bank size, and export features are incomplete or suboptimal.

---

## Codebase Architecture & File Index

### File Structure Overview
```
src/
├── App.css / index.css         # Styling & global CSS variables
├── App.tsx                     # Main router configuration (react-router-dom v7)
├── main.tsx                    # Entry point mounting App component
├── components/
│   ├── Layout.tsx              # Application layout wrapper with nav & header
│   ├── QuestionRenderer.tsx    # Renders multiple-choice & input question UI
│   └── Timer.tsx               # Renders countdown timer bar
├── context/
│   └── TestSessionContext.tsx  # React Context for global diagnostic session state
├── data/
│   └── questions.ts            # English static pool & Math dynamic generator functions
├── hooks/
│   └── useQuestionTimer.ts     # Custom hook for question countdown & extra time logic
└── pages/
    ├── Home.tsx                # Welcome page & student name entry
    ├── ModuleWarmup.tsx        # Module 1: Warm-up & self-assessment
    ├── ModuleMath.tsx          # Module 2: Adaptive Math diagnostic test
    ├── ModuleEnglish.tsx       # Module 3: Adaptive English diagnostic test
    ├── ModuleCognition.tsx     # Module 4: Stroop test cognitive reaction test
    └── Dashboard.tsx           # Diagnostic summary & topic breakdown report
```

### Build & Tooling Setup (`package.json`)
- **Framework**: React `^19.2.8`, React DOM `^19.2.8`, React Router DOM `^7.18.2`
- **Icons**: `lucide-react` `^1.28.0`
- **Build Tool**: Vite `^8.2.0`, TypeScript `~6.0.2`
- **Linter**: Oxlint `^1.75.0`
- **Build Command**: `npm run build` (`tsc -b && vite build`) - verified working cleanly.
- **Lint Command**: `npm run lint` (`oxlint`)
- **Test Framework**: No test runner (Vitest/Jest) currently configured in `package.json`.

---

## Detailed Inspection & Requirements Analysis (R1 – R6)

### Requirement R1: Warm-up & Session State Persistence
- **Current Implementation State**:
  - `src/pages/ModuleWarmup.tsx`: Collects `motivation` (range 1-5), `favoriteSubject` (text input), and `hardestSubject` (text input). However, line 13 notes `// We could save this to the session context...` and `handleSubmit` directly calls `navigate('/math')` without saving any data.
  - `src/context/TestSessionContext.tsx`: `TestSessionState` interface only tracks `studentName`, `answers`, `mathLevel`, and `englishLevel`. No fields or functions exist for warm-up state.
  - `src/pages/Dashboard.tsx`: Does not display any warm-up or self-assessment feedback.
- **Required Implementation**:
  1. Extend `TestSessionState` in `TestSessionContext.tsx` with:
     ```ts
     motivation?: number;
     favoriteSubject?: string;
     problemSubject?: string;
     ```
  2. Add `setWarmupData` function to `TestSessionContext` to update context state and persist to `localStorage`.
  3. In `ModuleWarmup.tsx`, invoke `setWarmupData` upon form submission before navigation.
  4. In `Dashboard.tsx`, add a dedicated "Warm-up & Selbsteinschätzung" overview card displaying motivation level (e.g., `3 / 5`), favorite subject, and problem subject.

---

### Requirement R2: Tolerant Answer Evaluation
- **Current Implementation State**:
  - **English Evaluation** (`src/pages/ModuleEnglish.tsx`:71):
    ```ts
    const isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    ```
    Strictest string comparison. Fails on inputs with articles (e.g. `a dog` vs `dog`), punctuation (`dog.`), case discrepancies, or trailing spaces.
  - **Math Evaluation** (`src/pages/ModuleMath.tsx`:60-72):
    Only strips leading `x=` and replaces `,` with `.`. Fails on:
    - Variable casing discrepancies (`8x` vs `8X`).
    - Operator whitespace (`8 * x` vs `8x`).
    - Equations where student types variable name (`x = 3` when answer is `3` or vice versa).
    - Fractions (`2/3` vs `2 / 3` or decimal representations).
- **Required Implementation**:
  1. Create a dedicated evaluation helper module `src/utils/evaluation.ts`.
  2. `evaluateEnglishAnswer(userAnswer: string, correctAnswer: string): boolean`:
     - Trim, lowercase, strip punctuation (`.`, `!`, `?`, `,`).
     - Remove leading articles (`a `, `an `, `the `) if correct answer does not mandate them.
     - Normalize spacing.
  3. `evaluateMathAnswer(userAnswer: string, correctAnswer: string): boolean`:
     - Trim, lowercase, replace `,` with `.`.
     - Strip equation prefixes (`x=`, `y=`, `ans=`) if not in target answer.
     - Remove spaces around operators (`+`, `-`, `*`, `/`, `=`, `^`).
     - Perform numerical comparison with tolerance (`1e-4`) when both sides parse as numbers.
     - Normalize algebraic expressions (e.g. `8*x` -> `8x`, `8X` -> `8x`).
  4. Integrate evaluation functions into `ModuleEnglish.tsx` and `ModuleMath.tsx`.

---

### Requirement R3: Stroop Test Keyboard & Layout Ergonomics
- **Current Implementation State**:
  - `src/pages/ModuleCognition.tsx` line 126:
    ```tsx
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
    ```
    Arranges 4 color buttons (ROT, BLAU, GRÜN, GELB) in a 2x2 grid. Keys 1-4 correspond to 1: top-left, 2: top-right, 3: bottom-left, 4: bottom-right.
  - Physical keyboard keys 1, 2, 3, 4 are arranged in a straight horizontal line, creating cognitive dissonance for young students.
- **Required Implementation**:
  1. Update `ModuleCognition.tsx` container layout to a **1x4 horizontal row**:
     ```tsx
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
     ```
  2. Enhance button visual design with clear keyboard badges `[1]`, `[2]`, `[3]`, `[4]` corresponding L-to-R:
     - `1`: ROT
     - `2`: BLAU
     - `3`: GRÜN
     - `4`: GELB
  3. Update instruction box on the start screen to clearly match the 1x4 horizontal layout.

---

### Requirement R4: Adaptive Algorithm Stability
- **Current Implementation State**:
  - `ModuleMath.tsx` (lines 90-96) & `ModuleEnglish.tsx` (lines 89-95):
    ```ts
    let newLevel = currentLevel;
    if (isCorrect) {
      newLevel = Math.min(7, currentLevel + 1);
    } else {
      newLevel = Math.max(1, currentLevel - 1);
    }
    ```
    Increases/decreases difficulty by 1 level on **every single question**. Highly volatile; a single typo demotes the student immediately.
- **Required Implementation**:
  1. Modify adaptive step logic:
     - Require **2 consecutive correct answers** at current level to increase level (+1).
     - Require **2 consecutive incorrect answers** at current level to decrease level (-1).
  2. Implementation details in component state:
     - Maintain state for `consecutiveCorrect` and `consecutiveIncorrect`.
     - Reset `consecutiveIncorrect = 0` on correct answer; increment `consecutiveCorrect`. When `consecutiveCorrect >= 2`, step up level and reset `consecutiveCorrect = 0`.
     - Reset `consecutiveCorrect = 0` on wrong answer; increment `consecutiveIncorrect`. When `consecutiveIncorrect >= 2`, step down level and reset `consecutiveIncorrect = 0`.
  3. Apply to both `ModuleMath.tsx` and `ModuleEnglish.tsx`.

---

### Requirement R5: English Question Pool & Reading Passages
- **Current Implementation State**:
  - `src/data/questions.ts`: `englishQuestions` array contains only 35 questions total (exactly 5 questions per level across 7 levels).
  - Levels 4, 5, 6, and 7 consist solely of single-sentence grammar/vocabulary questions; no reading passages or text comprehension questions exist.
- **Required Implementation**:
  1. Expand `englishQuestions` pool to **at least 15-20 questions per level** (105–140 questions total).
  2. Support Reading Comprehension:
     - Extend `Question` interface in `src/data/questions.ts` with optional `readingPassage?: string;`.
     - For Level 4+ questions, add short text / email passages with linked comprehension questions.
  3. Update `src/components/QuestionRenderer.tsx`:
     - If `question.readingPassage` is defined, render a styled text box (reading card) above the question prompt.

---

### Requirement R6: PDF/Print Export & Verification
- **Current Implementation State**:
  - `src/pages/Dashboard.tsx`: Displays diagnostic results, but has no export, save, or print functionality.
- **Required Implementation**:
  1. Add a "PDF / Berichts-Druck" button in `Dashboard.tsx` header bar.
  2. Implement click handler invoking `window.print()`.
  3. Add `@media print` CSS rules in `src/index.css`:
     - Hide navigation header, buttons (`btn`), and non-essential UI.
     - Expand accordion sections or force visibility during print.
     - Optimize color contrast and layout for page output (`-webkit-print-color-adjust: exact`).
  4. Perform full verification: `npm run build`, `npm run lint`, TypeScript compilation.

---

## File Change Summary Table

| File Path | Requirement | Proposed Changes |
|-----------|-------------|------------------|
| `src/context/TestSessionContext.tsx` | R1 | Add `motivation`, `favoriteSubject`, `problemSubject` to `TestSessionState` & `setWarmupData` function. |
| `src/pages/ModuleWarmup.tsx` | R1 | Save warm-up inputs into `TestSessionContext` via `setWarmupData` on form submit. |
| `src/pages/Dashboard.tsx` | R1, R6 | Render Warm-up card; add `window.print()` button & print layout styles. |
| `src/utils/evaluation.ts` (New File) | R2 | Create flexible math/english evaluation functions. |
| `src/pages/ModuleMath.tsx` | R2, R4 | Use `evaluateMathAnswer`; implement 2-consecutive answer adaptive level logic. |
| `src/pages/ModuleEnglish.tsx` | R2, R4 | Use `evaluateEnglishAnswer`; implement 2-consecutive answer adaptive level logic. |
| `src/pages/ModuleCognition.tsx` | R3 | Change button grid from 2x2 to 1x4 horizontal row; enhance key badges (1-4). |
| `src/data/questions.ts` | R5 | Add `readingPassage?: string` to `Question`; expand English pool to 15-20 questions per level with reading texts (L4+). |
| `src/components/QuestionRenderer.tsx` | R5 | Render `readingPassage` card if present on question. |
| `src/index.css` | R6 | Add `@media print` styles for clean PDF export output. |

---

## Verification & Build Status
- `npm run build`: **PASSED** (`tsc -b && vite build` succeeded in 364ms).
- All source files inspected and validated.
