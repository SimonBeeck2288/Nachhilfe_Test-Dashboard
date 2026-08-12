# Technical Survey & Architectural Analysis: Übungs-Generator (Practice Generator) — UI Navigation & Configuration

**Author:** `teamwork_preview_explorer_survey_1`  
**Date:** 2026-08-09  
**Target Feature:** Übungs-Generator (Practice Generator) — R1: Navigation & Konfiguration  
**Project Workspace:** `c:\Users\beeck\git\repos\NachhilfeTest`

---

## 1. Executive Summary

This survey provides a technical audit and structural design for the **Übungs-Generator (Practice Generator)** feature in the `NachhilfeTest` codebase, specifically targeting **Requirement 1: Navigation & Konfiguration**. 

The goal of the Practice Generator is to allow tutoring teachers, parents, and students to configure custom, targeted practice sessions based on:
1. **Student Profile & Grade Level** (Klassenstufe).
2. **Topic Performance & Visual Highlighting** (Identifying topics with `< 70%` accuracy as `"Ausbaubedarf"`).
3. **Flexible Topic Selection & Level Prefilling** (Per-topic level sliders/dropdowns from 1–7).
4. **Practice Settings** (Subject choice: Mathe, Englisch, Both/Kombiniert; Question counts: 5, 10, 15, 20; Timer toggle).
5. **Seamless Global Navigation** (Header link in `Layout.tsx` and route setup in `App.tsx`).

---

## 2. Requirement 1: Navigation (`Layout.tsx` & `App.tsx`)

### Existing Code Analysis (`src/components/Layout.tsx`)
In `src/components/Layout.tsx`, the top navigation bar header renders links and action buttons:
- Active student profile pill button (triggers `StudentSwitcherModal`).
- `"Schüler wechseln"` button (triggers `StudentSwitcherModal`).
- `"Roster"` link (`<Link to="/">`).
- `"Dashboard"` link (`<Link to="/dashboard">`).

### Integration Blueprint
1. **Header Link in `Layout.tsx`**:
   - Add a dedicated `<Link to="/practice" className="btn btn-secondary">` or `<Link to="/practice">` inside `<nav>`.
   - Icon: `Wand2` or `Sparkles` or `BookOpen` from `lucide-react`.
   - Text: `"Übungs-Generator"`.
   - Visibility condition: Renders at all times in the header, with active highlight condition (`location.pathname !== '/practice'`).

2. **Route Configuration in `App.tsx`**:
   - Add new route: `<Route path="practice" element={<PracticeGeneratorPage />} />` inside `<Route path="/" element={<Layout />}>`.

---

## 3. Requirement 2: Student Profile & Grade Level

### Existing Data Structures & Context
- **Student Profile**: Defined in `src/types/student.ts`:
  ```typescript
  export interface StudentProfile {
    id: string;
    name: string;
    gradeLevel: number | string; // e.g. 5, 6, 7, "5", "7"
    favoriteSubject: string;
    problemSubject: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
  ```
- **Context State**: `TestSessionContext` provides `currentStudent` (type `StudentProfile | null`) and `state.studentName`.
- **Roster Utility**: `getStudentRoster()` from `src/utils/studentRoster.ts` retrieves available student profiles.

### Grade & Topic Association Logic
- The system supports grades 1–13. Questions in `data/questions.ts` are categorized by `level` (1 to 7) and `topic`.
- **Grade-to-Level Baseline Mapping**:
  - Grade 1–4: Level 1
  - Grade 5: Level 2
  - Grade 6: Level 3
  - Grade 7: Level 4
  - Grade 8: Level 5
  - Grade 9: Level 6
  - Grade 10+: Level 7
- **Topic Extraction by Grade**:
  - Filter available topics for the student's grade level.
  - Topics can be gathered dynamically from `questions.ts` for `level <= studentGradeLevel` (or grade level range), or from standard subject topic lists (`MATH_TOPICS` & `ENGLISH_TOPICS`).

---

## 4. Requirement 3: Topic Performance & Visual Highlight (< 70% Accuracy "Ausbaubedarf")

### Historical Performance Calculation
- Function `getSessionsByStudentId(studentId)` in `src/utils/sessionHistory.ts` returns all `TestSessionRecord[]` for the active student.
- Each `TestSessionRecord` contains `topicBreakdown` (array or object of `TopicBreakdownItem`) and `answers` (`AnswerRecord[]`).
- **Aggregation Algorithm** (matching `TopicAccuracyChart.tsx` logic):
  ```typescript
  export interface TopicAccuracyStats {
    topic: string;
    correct: number;
    total: number;
    accuracy: number | null; // 0.0 to 1.0 (or percentage 0 to 100), null if total === 0
    isWeakness: boolean;    // accuracy < 0.70 && total > 0
  }
  ```

### Visual Highlighting Rules
- **"Ausbaubedarf" Badge (Weakness)**:
  - Trigger: `accuracy < 0.70` (or `< 70%`) with `total > 0`.
  - Visual: Highlighted with amber/red badge (`"⚠️ Ausbaubedarf"` or `"Empfehlung: Ausbaubedarf"`), background `#FEF3C7` / `#FEE2E2`, border `#FDE68A` / `#FCA5A5`, text `#92400E` / `#991B1B`.
- **"Gefestigt / Stark" Badge**:
  - Trigger: `accuracy >= 0.70` (`≥ 70%`).
  - Visual: Green badge (`"✓ Gefestigt"`), background `#DCFCE7`, text `#15803D`.
- **"Noch ungeprüft" Badge**:
  - Trigger: `total === 0`.
  - Visual: Neutral slate badge (`"Noch keine Testdaten"`), background `#F1F5F9`, text `#64748B`.

---

## 5. Requirement 4: Topic Selection & Level Prefill

### Topic Selection & Filtering UI
- Each topic card/row features a checkbox/toggle switch to enable (`selected: true`) or disable (`selected: false`) the topic for practice.
- Quick action action buttons:
  - **"Alle auswählen"**
  - **"Alle abwählen"**
  - **"Nur Ausbaubedarf auswählen"** (selects only topics where `isWeakness === true`).

### Target Level Prefill & Control
- For each enabled topic, a Target Level slider or dropdown `<select>` is displayed (`Stufe 1` to `Stufe 7`).
- **Prefill Logic**:
  - Prefilled with student's current target level for that subject (`state.mathLevel` / `state.englishLevel` from `TestSessionContext`), or student's grade-mapped baseline level.
  - Teachers/parents can override the level per topic individually (e.g. set Bruchrechnung to Level 3 while setting Gleichungen to Level 2).

---

## 6. Requirement 5: Settings Configuration

### Configurable Parameters
1. **Subject Selection (`subject`)**:
   - Options: `'math'` (Mathematik), `'english'` (Englisch), `'both'` (Beide / Kombiniert).
   - Dynamic Filtering: Dynamically filters displayed topic list (only Math topics when 'math', only English when 'english', all when 'both').
2. **Question Count (`questionCount`)**:
   - Options: `5`, `10`, `15`, `20` questions total.
   - UI: Pill selector buttons (`5 Aufgaben`, `10 Aufgaben`, `15 Aufgaben`, `20 Aufgaben`).
3. **Timer Toggle (`isTimerDisabled`)**:
   - Toggle switch / checkbox: `"Timer deaktivieren (entspanntes Üben ohne Zeitdruck)"`.
   - When enabled (`timerDisabled = true`), question timer is turned off during the practice session.

---

## 7. Core Data Contracts & State Management

```typescript
export type PracticeSubject = 'math' | 'english' | 'both';

export interface PracticeTopicSelection {
  topic: string;
  subject: 'math' | 'english';
  selected: boolean;
  targetLevel: number; // 1 to 7
  correct: number;
  total: number;
  accuracy: number | null; // 0.0 - 1.0 or null
  isWeakness: boolean;    // accuracy < 0.70 && total > 0
}

export interface PracticeGeneratorConfig {
  studentId: string;
  studentName: string;
  gradeLevel: number | string;
  subject: PracticeSubject;
  questionCount: 5 | 10 | 15 | 20;
  timerDisabled: boolean;
  topics: PracticeTopicSelection[];
}
```

---

## 8. Verification & Test Plan

1. **Unit & Integration Tests**:
   - Location: `src/tests/practiceGenerator.test.ts`.
   - Test cases:
     - Navigation link presence and route resolution.
     - Grade level prefilling for active student profiles.
     - Historical topic accuracy aggregation logic.
     - Correct identification and visual marking of `< 70%` accuracy topics as `"Ausbaubedarf"`.
     - Topic selection toggles & level prefilling defaults.
     - Practice configuration generation with subject, question count, and timer toggle settings.
2. **Regression Assurance**:
   - Execute `npm run test` (Vitest) to ensure all 244 existing tests pass with 100% success rate.
