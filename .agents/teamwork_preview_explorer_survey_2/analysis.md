# Technical Survey & Architecture Design: Übungs-Generator (Practice Generator)
**Agent**: `teamwork_preview_explorer_survey_2`  
**Date**: 2026-08-09  
**Target Feature**: Übungs-Generator (Task Generation & Dynamic Variations + Test Suite Infrastructure)  
**Workspace**: `c:\Users\beeck\git\repos\NachhilfeTest`  

---

## 1. Executive Summary & Context

The **Übungs-Generator** (Practice Generator) is a core feature addition for the `NachhilfeTest` diagnostic tutoring platform (`ORIGINAL_REQUEST.md` Follow-up 2026-08-09T02:42:00Z). It provides an interactive and printable practice sheet generator that creates tailored exercise sets for students based on:
1. Active student profile and grade level (`gradeLevel`).
2. Past diagnostic weak spots (topics with accuracy < 70% in `sessionHistory`).
3. Individually adjustable Target Levels (Stufe 1–7) per topic.
4. Flexible task counts (5, 10, 15, 20) with dynamic variations (Math number generation & English text/synonym variations).

This survey evaluates the existing question data structures, filtering mechanisms, variation capabilities, and test suite infrastructure. It provides concrete recommendations and complete TypeScript interfaces for implementing `src/utils/practiceGenerator.ts` and `src/tests/practiceGenerator.test.ts`.

---

## 2. Codebase Audit & File Inventory

### 2.1 Question Data & Types (`src/data/questions.ts`, `src/types/`)
* **`src/data/questions.ts`**:
  * Contains `englishQuestions: Question[]` (over 250 static questions spanning levels 1 to 7).
  * Contains `generateMathQuestion(level: number, askedIds: Set<string>): Question | null` (procedural generator for Math levels 1 to 7).
  * Interfaces:
    * `Question`: `id`, `topic`, `subject` (`'math' | 'english'`), `level` (1-7), `text`, `type` (`'multiple-choice' | 'input' | 'drag-sort' | 'matching' | 'fraction-pie'`), `options?`, `correctAnswer`, `timeLimit`, `readingPassage?`, `dragItems?`, `matchingPairs?`, `targetFraction?`, `diagramData?`, `storyContext?`, `explanation?`, `didYouKnowHint?`.
    * `DiagramData`: geometry shape labels (`'right-triangle' | 'triangle' | 'circle' | 'rectangle' | 'parallelogram' | 'trapezoid' | 'cube'`).
    * `MatchingPair`: left/right string pairs.

* **`src/types/config.ts`**:
  * Defines `CustomTestConfig` and `TopicMode` (`'off' | 'optional' | 'forced'`).

* **`src/types/student.ts`**:
  * Defines `StudentProfile` (`id`, `name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`).

* **`src/types/history.ts`**:
  * Defines `TestSessionRecord` and `TopicBreakdownItem` (`topic`, `correct`, `total`, `accuracy`, `avgTime`).

### 2.2 Student & Session Storage (`src/utils/studentRoster.ts`, `src/utils/sessionHistory.ts`)
* **`getSessionsByStudentId(studentId: string)`**: Retrieves past diagnostic test records.
* **`getPastAskedQuestionIds(studentId?: string)`**: Extracts asked question IDs to prevent immediate repeats.

### 2.3 Existing Test Suite Infrastructure (`src/tests/`)
* **Execution**: Ran via `npm run test` (`npx vitest run`).
* **Current Status**: **31 test files, 244 total tests, 100% passing** (execution time ~1.67 seconds).
* **Linter**: `oxlint` (via `npm run lint`).
* **Existing Test Coverage**:
  * `math_dynamic_expansion.test.ts`: verifies procedural math generation for levels 1-7, SoftScore calculation, and tolerance evaluation.
  * `english_adaptive_expansion.test.ts`: verifies 2-hit adaptive progression, Stroop calibration, and English evaluation tolerance.
  * `questions_pool.test.ts` & `questions.test.ts`: verifies pool sizes and reading passages.
  * `student_switching.test.ts`: verifies profile isolation.

---

## 3. Comprehensive Requirements Analysis & Technical Design

### 3.1 Topic Catalog & Grade Level Alignment

The codebase contains 17 Math topics and 16 English topics across Levels 1–7.

| Subject | Level (Stufe) | Topics Covered |
| :--- | :--- | :--- |
| **Math** | Level 1 | Addition, Subtraktion, Zahlenverständnis |
| **Math** | Level 2 | Multiplikation, Division, Geometrie (Umfang) |
| **Math** | Level 3 | Bruchrechnung, Dezimalrechnung, Geometrie (Flächeninhalt) |
| **Math** | Level 4 | Prozentrechnung, Gleichungen, Geometrie (Dreieck), Statistik |
| **Math** | Level 5 | Negative Zahlen, Geometrie (Parallelogramm, Trapez, Winkelsumme) |
| **Math** | Level 6 | Potenzen, Geometrie (Würfelvolumen), Terme |
| **Math** | Level 7 | Binomische Formeln, Geometrie (Pythagoras, Kreis), Gleichungen |
| **English** | Level 1 | Vokabeln, Grammatik (to be, articles), Zahlen, Satzbau |
| **English** | Level 2 | Grammatik (Plural, Pronomen), Zeiten (Simple Past), Präpositionen, Vokabeln |
| **English** | Level 3 | Zeiten (Present Perfect, Past Participle), Steigerung, Modalverben, Vokabeln |
| **English** | Level 4 | Leseverständnis, Grammatik (Adverbs, Conditionals), Relativsätze |
| **English** | Level 5 | Leseverständnis, Passiv, Conditionals, Indirekte Rede, Vokabeln |
| **English** | Level 6 | Leseverständnis, Past Perfect, Phrasal Verbs, Passiv Continuous |
| **English** | Level 7 | Leseverständnis, Inversion, Gerund vs Infinitive, Modals in Past, Subjunctive |

#### Grade-to-Level Defaults:
- **Grade 1-2**: Starting Target Level 1
- **Grade 3-4**: Starting Target Level 2
- **Grade 5**: Starting Target Level 3
- **Grade 6**: Starting Target Level 4
- **Grade 7**: Starting Target Level 5
- **Grade 8+**: Starting Target Level 6-7

---

### 3.2 Question Filtering & Weakness Detection Logic

#### Weakness Recommendation Engine:
To mark topics as **"Ausbaubedarf"** (recommended for practice):
1. Query `getSessionsByStudentId(studentId)`.
2. Aggregate all `topicBreakdown` records for the active student across historical tests:
   $$\text{Accuracy}_{\text{topic}} = \frac{\sum \text{correct}}{\sum \text{total}}$$
3. If $\text{total} \ge 1$ and $\text{Accuracy}_{\text{topic}} < 0.70$ (70%), flag topic as `isWeakSpot: true` / recommendation.

#### Topic & Level Configuration:
Each topic selected in the generator UI will be represented by:
```ts
export interface TopicPracticeConfig {
  topic: string;
  subject: 'math' | 'english';
  targetLevel: number; // 1 to 7 (defaults to student's current level or grade default)
  enabled: boolean;
  isRecommended?: boolean; // weakness flag (<70% accuracy)
}
```

---

### 3.3 Dynamic Variation Engines Architecture

#### A. Math Dynamic Variation Engine (`generateMathVariation`)
Math questions are dynamically generated with randomized numbers, operands, and story contexts.

**Variation Mechanisms**:
1. **Operand & Range Randomization**:
   - Level 1: `a = rand(1, 20)`, `b = rand(1, 20)`.
   - Level 4 Percentages: `perc = rand(1, 9) * 10`, `val = rand(2, 10) * 10`.
   - Level 7 Pythagoras: random choice from Pythagorean triples `[[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]`.
2. **Context & Story Swapping**:
   - Randomize story names (`'Tim'`, `'Lisa'`, `'Michael'`, `'Sarah'`, `'Felix'`) and objects (`'Murmeln'`, `'Stifte'`, `'Äpfel'`, `'Kekse'`).
3. **Guaranteed Integer / Clean Decimal Answers**:
   - Formulas calculate answers using exact integer products or division pairs to avoid long floating point decimals in user input questions.

#### B. English Dynamic Variation Engine (`generateEnglishVariation`)
Since English questions in `englishQuestions` are static, when a user requests more questions than exist for a specific topic/level (e.g. 15 or 20 questions across few topics), or to provide variety:

**Variation Mechanisms**:
1. **Name & Noun Swapping (Vocabulary/Grammar stems)**:
   - Replace subjects: `"Tom"` $\leftrightarrow$ `"Sarah"` $\leftrightarrow$ `"Emma"` $\leftrightarrow$ `"Oliver"`.
   - Replace vocabulary nouns: `"dog"` $\leftrightarrow$ `"cat"` $\leftrightarrow$ `"rabbit"`; `"apple"` $\leftrightarrow$ `"orange"` $\leftrightarrow$ `"banana"`.
   - Example: `"Was heißt \"Hund\" auf Englisch?"` $\rightarrow$ `"Was heißt \"Katze\" auf Englisch?"`
2. **Context Template Generator**:
   - Article exercises: `Ergänze den unbestimmten Artikel: "... {noun}"` where `{noun}` is selected from an article pool.
   - Verb agreement: `Ergänze: "{pronoun} ___ happy."` (`"She"`, `"They"`, `"He"`).
3. **Multiple-Choice Distractor & Option Shuffling**:
   - Shuffle `options` array using Fisher-Yates shuffle so correct answer position changes dynamically.

---

### 3.4 Generation Logic & Testability (`src/utils/practiceGenerator.ts`)

#### Seedable Deterministic PRNG:
For 100% deterministic test execution in Vitest without test flakiness, generator functions accept an optional `rng: () => number` function (defaulting to `Math.random`).

```ts
export type RNG = () => number;

/**
 * Creates a deterministic seedable pseudo-random number generator (Mulberry32).
 */
export function createSeedableRNG(seed: number): RNG {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

#### Generator Workflow:
```
Config Input (studentId, gradeLevel, subject, topics, totalQuestions, timerEnabled, seed?)
  │
  ├── 1. Determine Topic Recommendations (<70% accuracy)
  ├── 2. Calculate Question Allocation per Enabled Topic
  ├── 3. For each Topic & Target Level:
  │      ├── If Math: call generateMathQuestion(targetLevel, askedIds, rng)
  │      └── If English: pick base question & apply generateEnglishVariation(baseQ, rng)
  ├── 4. Generate Solution & Step-by-Step Explanation Sheet
  └── 5. Return Complete PracticeSheet Object
```

#### Proposed Interfaces (`src/utils/practiceGenerator.ts`):
```ts
export interface PracticeGeneratorConfig {
  studentId?: string;
  studentName?: string;
  gradeLevel: number;
  subject: 'math' | 'english' | 'both';
  topics: TopicPracticeConfig[];
  totalQuestions: 5 | 10 | 15 | 20;
  timerEnabled: boolean;
  seed?: number; // Optional seed for deterministic testing
}

export interface PracticeSolution {
  questionId: string;
  topic: string;
  questionText: string;
  correctAnswer: string | string[];
  explanation: string;
  didYouKnowHint?: string;
}

export interface PracticeSheet {
  id: string;
  title: string;
  createdAt: string;
  studentId?: string;
  studentName: string;
  gradeLevel: number;
  subject: 'math' | 'english' | 'both';
  timerEnabled: boolean;
  totalQuestions: number;
  questions: Question[];
  solutions: PracticeSolution[];
}
```

---

### 3.5 Test Suite Expansion & Infrastructure Integration (`src/tests/practiceGenerator.test.ts`)

A dedicated Vitest test file `src/tests/practiceGenerator.test.ts` will verify all generation rules and variation capabilities.

#### Required Test Scenarios:
1. **Weakness Detection**: Verify `getRecommendedTopicsForStudent(studentId)` correctly identifies topics with accuracy < 70% from `sessionHistory`.
2. **Topic & Level Filtering**: Verify generated questions strictly match requested subjects, enabled topics, and assigned target levels (1-7).
3. **Math Dynamic Variations**: Verify math questions produce varied numbers, correct calculations, and valid answers for requested quantities (5, 10, 15, 20).
4. **English Text Variations**: Verify English text variations generate valid word swaps, synonym variations, and shuffled options.
5. **Deterministic RNG Reproducibility**: Verify two runs with identical `seed` produce identical `PracticeSheet` questions and solutions.
6. **Solution Sheet Completeness**: Verify every generated question has a corresponding `PracticeSolution` with an explicit `correctAnswer` and `explanation`.
7. **Full Test Suite Integrity**: Execute `npm run test` and `npm run lint` to guarantee 0 regressions across all existing 244 tests.

---

## 4. Verification & Recommendations for Implementers

1. **Keep `questions.ts` as Single Source of Truth**: Leverage existing static `englishQuestions` and procedural `generateMathQuestion` functions while wrapping them with the variation engines.
2. **Co-locate Unit Tests in `src/tests/practiceGenerator.test.ts`**: Follow established Vitest patterns in the repo.
3. **Print CSS Support (`@media print`)**: Ensure components created for the Practice Generator (interactive view + print view) render cleanly with `@media print` directives for task sheet and solution key.
4. **Zero State Leakage**: When switching active student profiles, re-evaluate weak spot recommendations and student grade defaults dynamically.

---
