# Technical Analysis Report: Requirements R5, R6, and R7

**Target Repository:** `c:/Users/beeck/git/repos/NachhilfeTest`  
**Explorer Agent:** `teamwork_preview_explorer`  
**Date:** 2026-08-03  

---

## Executive Summary

This report provides a comprehensive architectural analysis of the codebase for **Requirement 5 (Student Progress Analytics Dashboard)**, **Requirement 6 (Custom Test Configurator)**, and **Requirement 7 (Printable PDF Diagnostic Report & Content Enhancements)** for the Nachhilfe-Diagnose-App.

### Key Discoveries:
1. **R5 (Analytics Dashboard)**: Current `Dashboard.tsx` displays only single-session results. Storage in `TestSessionContext.tsx` is limited to a single active session in `localStorage`. To support interactive progression curves over time, topic accuracy breakdown across sessions, and cognition reaction speed trends, the session model must be expanded to support historical session storage per student with zero-dependency SVG chart visualization components.
2. **R6 (Custom Test Configurator)**: `generateMathQuestion` and `englishQuestions` in `questions.ts` natively support topic tags and question types (`multiple-choice` vs `input`). However, test flow parameters (subjects, starting level, duration limit, topic filters, question types) are hardcoded. Introducing a `CustomTestConfig` interface and a `TestConfigurator` UI component will enable full tutor control prior to test launch.
3. **R7 (Printable PDF Report & Content Enhancements)**: 
   - `evaluation.ts` already contains robust tolerant answer evaluation (`evaluateEnglishAnswer` and `evaluateMathAnswer`).
   - `QuestionRenderer.tsx` has Web Speech API (`SpeechSynthesisUtterance`) for TTS audio.
   - `index.css` contains `@media print` foundation, but `Dashboard.tsx` lacks a compact, single-page A4 layout tailored for parent-tutor consultations with tutor recommendation notes.

---

## 1. Requirement R5: Student Progress Analytics Dashboard

### 1.1 Objective & Requirements
- Interactive progress analytics dashboard presenting:
  1. **Level progression curves over time** per student (Math and English difficulty levels reached across sessions).
  2. **Topic-level accuracy breakdown** with drillthrough to individual question and answer history.
  3. **Cognition reaction speed trends** (reaction time progression across Stroop trials 1–10 and across past test sessions).
- Multi-student profile integration: Select student profiles from roster to analyze individual history or compare performance.

### 1.2 Existing Implementation vs. Requirements Gap

| Sub-system | Existing Implementation | Requirement Gap |
| :--- | :--- | :--- |
| **Session Persistence** | `TestSessionContext.tsx` (lines 50–57) stores only `diagnosticSession` (single current state). | Requires persistent historical test session log (`TestSessionRecord[]`) linked to `studentId`. |
| **Level Progression Curve** | `Dashboard.tsx` (lines 322, 342) displays single current level (e.g. `state.mathLevel` / 7). | Requires time-series line chart showing math & english levels per date/session. |
| **Topic Accuracy Breakdown** | `Dashboard.tsx` (lines 15–164 `TopicAccordionList`) renders single session topic accuracy & collapsible question list. | Requires visual bar chart summary of topic accuracy percentages alongside drillthrough accordion. |
| **Cognition Trend** | `Dashboard.tsx` (lines 360–378) displays single session average reaction time and total accuracy. | Requires trial-by-trial reaction time line chart (trials 1–10) and session-over-session reaction speed trend. |
| **Visualization Library** | `package.json` has `lucide-react`, `react` 19, `react-router-dom`, but **no external charting library**. | Recommend lightweight, zero-dependency SVG charting components (`ProgressionChart.tsx`, `TopicAccuracyChart.tsx`, `CognitionTrendChart.tsx`). |

### 1.3 Proposed SVG Visualizers (Zero External Dependencies)

#### A. Level Progression Line Chart (`ProgressionChart.tsx`)
- **Visual Structure**: SVG `<svg viewBox="0 0 600 200">` rendering dual line paths:
  - Math Level (Indigo `#4F46E5` line with circular dots)
  - English Level (Emerald `#10B981` line with square dots)
- **Axes**: X-Axis = Session dates (`DD.MM`); Y-Axis = Difficulty Levels (Level 1 to 7).
- **Interactivity**: Hover tooltip over data points displaying exact score, level reached, and date.

#### B. Topic Accuracy Bar Chart (`TopicAccuracyChart.tsx`)
- **Visual Structure**: SVG horizontal bar chart showing accuracy % for each topic.
- **Color Coding**:
  - Green (`#10B981`) for accuracy $\ge 70\%$
  - Yellow (`#F59E0B`) for accuracy $50\% - 69\%$
  - Red (`#EF4444`) for accuracy $< 50\%$
- **Drillthrough**: Clicking a bar scrolls to / opens the corresponding topic accordion item.

#### C. Cognition Reaction Speed Chart (`CognitionTrendChart.tsx`)
- **Visual Structure**: Dual mode:
  1. Trial-by-Trial curve (Trial 1 to 10 reaction times in ms for current test run).
  2. Historical average reaction time (ms) over past sessions.
- **Metric Badges**: Mean reaction time (ms), Accuracy %, and Speed-Accuracy Tradeoff score.

---

## 2. Requirement R6: Custom Test Configurator

### 2.1 Objective & Requirements
- Configurator UI for tutors/teachers prior to starting a diagnostic test:
  1. **Subject Selection**: Math, English, Cognition, or Full test suite.
  2. **Starting Level**: Select initial level (Level 1–7) per subject or set global starting level.
  3. **Max Test Duration Limit**: Custom time limit per module (e.g., 3 min, 5 min, 10 min, 15 min, or unlimited).
  4. **Topic Filtering**: Select specific topics to include (e.g. Math: "Bruchrechnung", "Geometrie"; English: "Grammatik", "Leseverständnis").
  5. **Question Type Filtering**: All types, Multiple-Choice only, or Input field only.

### 2.2 Existing Codebase Capabilities & Integration Points

1. **Question Metadata**:
   - `src/data/questions.ts`:
     - `Question` interface (lines 3–14) contains `topic: string`, `subject: 'math' | 'english'`, `level: number`, `type: QuestionType` (`'multiple-choice' | 'input'`).
     - `englishQuestions` array (lines 42–161) has explicit topics: `"Vokabeln"`, `"Grammatik"`, `"Zahlen"`, `"Zeiten"`, `"Präpositionen"`, `"Steigerung"`, `"Modalverben"`, `"Leseverständnis"`, `"Relativsätze"`, `"Passiv"`, `"Conditionals"`, `"Indirekte Rede"`, `"Phrasal Verbs"`, `"Inversion"`, `"Gerund vs Infinitive"`, `"Modals in Past"`.
     - `generateMathQuestion(level, askedIds)` (lines 176–428) tags generated questions with topics: `"Addition"`, `"Subtraktion"`, `"Zahlenverständnis"`, `"Multiplikation"`, `"Division"`, `"Geometrie"`, `"Bruchrechnung"`, `"Dezimalrechnung"`, `"Prozentrechnung"`, `"Gleichungen"`, `"Statistik"`, `"Negative Zahlen"`, `"Potenzen"`, `"Wurzelrechnung"`, `"Terme"`, `"Binomische Formeln"`.

2. **Test Session State & Module Handlers**:
   - `src/pages/ModuleMath.tsx` & `src/pages/ModuleEnglish.tsx`:
     - Hardcoded start level = 1 (lines 19).
     - Hardcoded module limit `MODULE_TIME_LIMIT_MS = 5 * 60 * 1000` (line 12).
     - Filtering in `ModuleEnglish.tsx` (lines 40–45) currently filters only by `level === currentLevel`.

### 2.3 Required State & Data Structure
```typescript
export interface CustomTestConfig {
  mode: 'standard' | 'custom';
  selectedSubjects: ('warmup' | 'cognition' | 'math' | 'english')[];
  mathStartingLevel: number; // 1-7
  englishStartingLevel: number; // 1-7
  maxModuleDurationMinutes: number; // e.g. 5, 10, 15, 0 (0 = unlimited)
  mathTopicFilter: string[]; // empty array = all math topics
  englishTopicFilter: string[]; // empty array = all english topics
  questionTypeFilter: 'all' | 'multiple-choice' | 'input';
}
```

### 2.4 Configurator Component Design (`TestConfigurator.tsx`)
- Card / Modal integrated into `Home.tsx` or `RosterView.tsx`.
- Preset selector: "Standard-Test (Vollständig)" vs. "Gezielter Kurz-Test (Custom)".
- Interactive Controls:
  - Subject toggles (Pill checkboxes).
  - Starting Level step sliders (1 to 7).
  - Module Duration radio buttons / number input.
  - Topic Tag Cloud / Checkbox Grid (grouped by Math and English).
  - Question Type Segmented Control (Alle | Multiple-Choice | Freitext).

---

## 3. Requirement R7: Printable PDF Diagnostic Report & Content Enhancements

### 3.1 Objective & Requirements
- **1-Page PDF / Printable Diagnostic Summary**:
  - Compact, beautifully formatted 1-page summary for parent-tutor consultations.
  - Formatted for clean printing via `window.print()` or saving as PDF.
  - Key sections: Header info, Warmup motivation, Subject scores & levels reached, Top Strengths & Weaknesses, Cognitive Focus index, and **Tutor Recommendation Notes**.
- **Content Enhancements**:
  - **Tolerant Answer Validation**:
    - English: ignores articles (`a`, `an`, `the`), casing, punctuation, and extra spaces.
    - Math: accepts equivalent terms (`8x`, `8 * x`, `x * 8`), equation forms (`x = 3` vs `3`), decimal commas (`0,5` vs `0.5`), fractions (`1/2`), mixed fractions (`1 1/2`), superscripts (`x²`), unit suffixes (`cm`, `m²`), and epsilon numerical equality ($10^{-4}$).
  - **English Audio TTS**:
    - Web Speech API integration for reading passages and question texts.

### 3.2 Evaluation Function Audit (`src/utils/evaluation.ts`)

`src/utils/evaluation.ts` is already highly sophisticated:
1. `normalizeEnglishString(str)` (lines 5–12):
   - Lowercases, removes punctuation `[.,!?"'“”‘’«»„]`, trims, collapses internal whitespace.
2. `evaluateEnglishAnswer(userAnswer, correctAnswer)` (lines 21–38):
   - Compares normalized strings directly.
   - Strips leading articles `^(a|an|the)\s+` and re-checks equality.
3. `normalizeMathString(str)` (lines 45–80):
   - Maps unicode superscripts (`⁰`..`⁹` -> `^0`..`^9`).
   - Converts decimal commas to dots (`,` -> `.`).
   - Strips single-variable equation prefixes (`x=`, `y =`).
   - Strips unit strings (`cm²`, `cm`, `m²`, `m`, `mm`, `km`, `%`, `°`).
   - Strips whitespace around operators `+ - * / = ^`.
   - Normalizes coefficient multiplication (`8*x`, `x*8`, `8 x` -> `8x`).
4. `parseMathNumber(str)` (lines 86–119):
   - Handles floating points, fractions (`1/2`), mixed fractions (`1 1/2`, `-2 3/4`).
5. `evaluateMathAnswer(userAnswer, correctAnswer)` (lines 129–151):
   - Direct normalized string match OR numerical parsing comparison within $\pm 1e-4$.

**Assessment**: `evaluation.ts` meets all tolerance criteria. Ensure Vitest integration (`describe`/`it` wrappers in `.test.ts`) so tests pass under `npm run test`.

### 3.3 Audio TTS Integration Audit (`src/components/QuestionRenderer.tsx`)

`QuestionRenderer.tsx` (lines 26–52) currently implements `toggleTTS`:
- Uses `SpeechSynthesisUtterance`.
- Reads `readingPassage + text` or `text`.
- Sets `utterance.lang = question.subject === 'english' ? 'en-US' : 'de-DE'`.
- Sets `utterance.rate = 0.9`.

**Gaps & Recommendations for TTS**:
1. Speech synthesis cleanup: Ensure audio stops when component unmounts or question changes (`window.speechSynthesis.cancel()` is already called on question ID change, but should also be called in unmount cleanup).
2. Voice selection enhancement: On Chrome/Safari, query `window.speechSynthesis.getVoices()` to explicitly bind a native English voice (e.g. `"en-US"` or `"en-GB"`) if default fallback voice sounds robotic.
3. Accessible UI indicator: Show pulsing sound wave or active highlight when audio is playing.

### 3.4 1-Page Printable Report Architecture (`DiagnosticReportPrint.tsx`)

Current `Dashboard.tsx` print output renders the full dashboard, which can extend over 2–3 pages due to large topic accordions.

**Proposed 1-Page Report Component (`DiagnosticReportPrint.tsx`)**:
- Layout: Structured 2-column or 3-row grid fitting exactly on A4 portrait ($210 \times 297 \text{ mm}$).
- Print CSS Rules:
  ```css
  @media print {
    @page {
      size: A4 portrait;
      margin: 1cm;
    }
    .print-report-container {
      max-height: 270mm;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .no-print {
      display: none !important;
    }
  }
  ```
- Included Sections:
  1. Header: Student name, Date, Grade level, Tested by (Tutor).
  2. Motivation & Selbsteinschätzung badge (Stars 1-5, Lieblingsfach, Problemfach).
  3. Subject Summary Cards:
     - Math: Level X/7, Score %, Ø response time.
     - English: Level Y/7, Score %, Ø response time.
     - Cognition: Reaction time (ms), Accuracy %, Stroop interpretation.
  4. Top 3 Strengths & Top 3 Growth Areas (Topics).
  5. **Tutor Notes & Actionable Recommendations**: An editable text area on screen before printing, which renders as clean printed text in the PDF/print output.

---

## 4. Recommended Milestone Boundaries

To ensure clean implementation and non-breaking incremental progress, R5, R6, and R7 should be structured into clear milestone tasks:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone R5-A: Data Layer & Session History Persistence             │
│ - Extend TestSessionContext with TestSessionRecord[] history storage.  │
│ - Implement helper functions to query historical student sessions.    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone R5-B: Zero-Dependency SVG Analytics Dashboard                │
│ - Create ProgressionChart.tsx (Level curves over time).                │
│ - Create TopicAccuracyChart.tsx (Topic accuracy breakdown).            │
│ - Create CognitionTrendChart.tsx (Reaction speed progression).         │
│ - Integrate visualizers into Dashboard.tsx.                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone R6: Custom Test Configurator UI & Execution Engine           │
│ - Create CustomTestConfig interface & context methods.                 │
│ - Build TestConfigurator.tsx component.                                │
│ - Connect ModuleMath.tsx & ModuleEnglish.tsx to respect config filters.│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone R7: Printable 1-Page PDF Summary & TTS/Evaluation Polish      │
│ - Build DiagnosticReportPrint.tsx (compact 1-page A4 print layout).    │
│ - Add editable Tutor Recommendation Notes field.                       │
│ - Convert evaluation/questions test files to standard Vitest specs.   │
│ - Enhance TTS voice selection & unmount safety.                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Summary Table of Files & Action Plan

| File | Primary Purpose | Required Modification |
| :--- | :--- | :--- |
| `src/context/TestSessionContext.tsx` | State management | Add `sessionHistory`, `activeConfig`, `saveCompletedSession`, `setCustomConfig`. |
| `src/pages/Dashboard.tsx` | Analytics & Report View | Embed SVG Analytics charts, add tab/toggle for Historical Analytics vs Print Report. |
| `src/components/ProgressionChart.tsx` | New SVG Component | Render level progression line chart over time. |
| `src/components/TopicAccuracyChart.tsx` | New SVG Component | Render horizontal topic accuracy bar chart. |
| `src/components/CognitionTrendChart.tsx` | New SVG Component | Render Stroop reaction speed line chart. |
| `src/components/TestConfigurator.tsx` | New UI Component | Render test configuration options (subjects, level, time, topics, types). |
| `src/components/DiagnosticReportPrint.tsx` | New UI Component | Render compact 1-page A4 print summary with tutor notes. |
| `src/pages/ModuleMath.tsx` | Test Runner | Apply starting level, topic filters, question type filters, and custom duration. |
| `src/pages/ModuleEnglish.tsx` | Test Runner | Apply starting level, topic filters, question type filters, and custom duration. |
| `src/components/QuestionRenderer.tsx` | Question UI & TTS | Add SpeechSynthesis voice selection fallback & unmount cleanup. |
| `src/*.test.ts` | Unit Testing | Wrap test assertions in Vitest `describe`/`it` blocks. |
