# Project: Übungs-Generator (Practice Generator) — NachhilfeTest

## Architecture
- **Framework**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Vitest
- **State Management**: Existing `TestSessionContext` / `sessionHistory.ts` for student profile and performance stats
- **Module Structure**:
  - `src/types/practice.ts`: Type definitions for configuration, generated practice sheet, exercise items, and variation options.
  - `src/utils/practiceGenerator.ts`: Generator engine with seedable PRNG (Mulberry32), dynamic variation rules for Math and English, topic/level matching.
  - `src/components/Layout.tsx`: Header navigation bar with link to `/practice`.
  - `src/App.tsx`: Route definition for `/practice`.
  - `src/components/PracticeView.tsx`: Parent view handling configuration state, practice execution, and print mode switching.
  - `src/components/PracticeConfigView.tsx`: Setup UI (grade topic listing, <70% weakness badge, topic toggles, level sliders, settings).
  - `src/components/PracticeSessionView.tsx`: Interactive solving mode with mascot tips, instant feedback, timer, summary score breakdown.
  - `src/components/PrintableWorksheet.tsx`: Printable worksheet and separate Lösungsblatt (answer key) with `@media print` CSS.
  - `src/tests/practiceGenerator.test.ts`: Vitest test suite for generator logic, variation engine, and level filtering.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Nav Link | Add "Übungs-Generator" link in header nav (`Layout.tsx`) & route `/practice` (`App.tsx`) | M1 | Survey 1 |
| 2 | Grade Topic Auto-Listing | Automatically list topics relevant for student's current grade level | M1 | Survey 1 |
| 3 | Weakness Highlight | Calculate topic accuracy from session history; mark <70% as "Ausbaubedarf" | M1 | Survey 1 |
| 4 | Topic Selection UI | Topic checkboxes, quick actions ("Alle auswählen", "Nur Ausbaubedarf") | M1 | Survey 1 |
| 5 | Level Controls | Per-topic target level sliders (Level 1-7), prefilled with student target level | M1 | Survey 1 |
| 6 | Settings Controls | Subject filter (`Mathe`, `Englisch`, `Beide`), Question count (`5`, `10`, `15`, `20`), Timer disable toggle | M1 | Survey 1 |
| 7 | Question Filtering | Pick questions matching selected topics, subject, and target level from `questions.ts` | M2 | Survey 2 |
| 8 | Math Dynamic Variations | Parameter/number randomization, range scaling by level, integer division guarantees, story variations | M2 | Survey 2 |
| 9 | English Dynamic Variations | Synonym/name/noun substitutions, context template variations, option shuffling | M2 | Survey 2 |
| 10 | Seedable Generator Engine | Deterministic generator utility `src/utils/practiceGenerator.ts` with PRNG seed support | M2 | Survey 2 |
| 11 | Interactive Practice Mode | Step-by-step exercise solving, instant feedback, explanations, mascot tips ("Eule"), timer, score summary | M3 | Survey 3 |
| 12 | Printable Worksheet & Answer Key | `@media print` A4 view, formatted student worksheet, separate parent/tutor "Lösungsblatt" | M3 | Survey 3 |
| 13 | Unit Test Suite | Vitest suite `src/tests/practiceGenerator.test.ts` verifying logic, variations, level filters, seed determinism | M4 | Survey 2 |
| 14 | Regression & Full Test Suite Pass | Verify 100% pass rate across all existing (244+) + new tests | M4 | Survey 2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI Navigation & Configuration View | Navigation link in `Layout.tsx`, `/practice` route, `PracticeConfigView.tsx`, topic selection, <70% weakness badge, level sliders, settings | none | DONE |
| M2 | Practice Generator Core & Variations | `src/types/practice.ts`, `src/utils/practiceGenerator.ts` with Mulberry32 PRNG, Math & English variation engines | none | DONE |
| M3 | Interactive Practice Mode & Print View | `PracticeView.tsx`, `PracticeSessionView.tsx`, `PrintableWorksheet.tsx`, mascot tips, timer toggle, `@media print` layout & answer key | M1, M2 | DONE |
| M4 | Integration Testing & Quality Assurance | `src/tests/practiceGenerator.test.ts`, running full Vitest suite (`npm run test`), lint check (`npm run lint`), gate audit | M1, M2, M3 | DONE |

## Interface Contracts

### `src/types/practice.ts`
```typescript
export interface TopicConfig {
  topicId: string;
  topicName: string;
  subject: 'math' | 'english';
  selected: boolean;
  targetLevel: number; // 1-7
  isWeakSpot: boolean; // accuracy < 70%
  accuracyPercentage?: number;
}

export interface PracticeGeneratorConfig {
  studentId: string;
  subjectFilter: 'math' | 'english' | 'both';
  topics: TopicConfig[];
  questionCount: 5 | 10 | 15 | 20;
  isTimerDisabled: boolean;
  seed?: number;
}

export interface GeneratedExerciseItem {
  id: string;
  originalQuestionId: string;
  subject: 'math' | 'english';
  topicId: string;
  topicName: string;
  level: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  mascotTip?: string;
  isVariation: boolean;
}

export interface PracticeSheet {
  id: string;
  createdAt: string;
  config: PracticeGeneratorConfig;
  exercises: GeneratedExerciseItem[];
}
```

### `src/utils/practiceGenerator.ts`
```typescript
export function generatePracticeSheet(config: PracticeGeneratorConfig): PracticeSheet;
export function calculateTopicAccuracy(studentId: string, topicId: string): number;
```

## Code Layout
- `src/types/practice.ts` (Types)
- `src/utils/practiceGenerator.ts` (Core logic & PRNG variation engines)
- `src/components/PracticeConfigView.tsx` (Config UI)
- `src/components/PracticeSessionView.tsx` (Interactive mode)
- `src/components/PrintableWorksheet.tsx` (Printable worksheet & Lösungsblatt)
- `src/components/PracticeView.tsx` (Main route container)
- `src/components/Layout.tsx` (Navigation update)
- `src/App.tsx` (Route update)
- `src/tests/practiceGenerator.test.ts` (Unit test suite)
