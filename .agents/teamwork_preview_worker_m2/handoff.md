# Handoff Report: Milestone 2 — Practice Generator Core Logic & Dynamic Variations Engine

**Agent**: `teamwork_preview_worker_m2`  
**Working Directory**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m2`  
**Date**: 2026-08-09  

---

## 1. Observation

1. **Created Data Types (`src/types/practice.ts`)**:
   - `TopicConfig`: Topic state (`topicId`, `topicName`, `subject`, `selected`, `targetLevel` (1-7), `isWeakSpot`, `accuracyPercentage`).
   - `PracticeGeneratorConfig`: Generator parameters (`studentId`, `subjectFilter` ('math'|'english'|'both'), `topics`, `questionCount` (5|10|15|20), `isTimerDisabled`, optional `seed`).
   - `GeneratedExerciseItem`: Complete exercise schema (`id`, `originalQuestionId`, `subject`, `topicId`, `topicName`, `level`, `questionText`, `options`, `correctAnswer`, `explanation`, `mascotTip`, `isVariation`, `storyContext`, `diagramData`, `targetFraction`, `dragItems`, `matchingPairs`).
   - `PracticeSheet`: Complete exercise sheet output (`id`, `createdAt`, `config`, `exercises`).

2. **Created Generator Engine & Variations (`src/utils/practiceGenerator.ts`)**:
   - `createPRNG(seed)`: Seedable Mulberry32 pseudo-random number generator for 100% deterministic, reproducible exercise sheets.
   - `calculateTopicAccuracy(studentId, topicId)`: Calculates student topic accuracy percentage (0-100) from session history, supporting both array and record breakdown forms as well as raw answer history fallback.
   - `generateMathVariation(rng, topicConfig, index)`: Math Dynamic Variation Engine supporting levels 1-7 (Addition, Subtraktion, Multiplikation, Division, Bruchrechnung, Dezimalrechnung, Prozentrechnung, Gleichungen, Negative Zahlen, Geometrie, Potenzen, Terme, Binomische Formeln, Statistik). Guarantees positive integer results for subtraction ($a \ge b$) and exact integer division ($a = b \times ans$), story context variations (names, items, units), explanations, mascot tips, and geometric diagram parameters.
   - `generateEnglishVariation(rng, topicConfig, index, usedStaticIds)`: English Dynamic Variation Engine matching topics/levels from `englishQuestions` static pool, seamlessly generating procedural variations when static questions are exhausted. Applies proper name substitutions, option/distractor shuffling, and atomic answer key synchronization.
   - `generatePracticeSheet(config)`: Main entry point performing topic selection, subject filtering, and round-robin question distribution across selected topics.

3. **Created Vitest Test Suite (`src/tests/practiceGenerator.test.ts`)**:
   - 12 comprehensive unit and integration tests verifying Mulberry32 PRNG seed determinism, topic accuracy calculation, question count allocations, subject filters, positive integer constraints, level 1-7 topic support, name/noun substitutions, option shuffling, and answer key synchronization.

4. **Execution Results**:
   - `npx tsc --noEmit`: 0 type errors.
   - `npm run test`: **33 test files passed, 267 total tests passed (100% pass rate)**.
   - `npm run lint`: **0 errors**.

---

## 2. Logic Chain

1. **Seed Determinism**:
   - By implementing Mulberry32 PRNG (`createPRNG(seed)`), passing `seed` in `PracticeGeneratorConfig` ensures that all random decisions (topic round-robin, operand generation, name/item pick, option shuffle) are 100% reproducible across test runs.

2. **Question Matching & Exhaustion Handling**:
   - `generatePracticeSheet` round-robins across all selected topics for the requested `questionCount` (5, 10, 15, 20).
   - For static question pools (English), available unused static questions for the matching topic & level are picked and varied.
   - When static questions are exhausted or for procedural topics (Math), the variation engine generates valid, topic-matched dynamic items on-the-fly with `isVariation: true`.

3. **Integer & Story Guarantees**:
   - Math formulas in `generateMathVariation` ensure valid number ranges per level (1-7), non-negative subtraction results ($a - b \ge 0$), integer division ($a = b \cdot ans$), and exact decimal/percent outputs.
   - Micro-stories feature randomized student names (`Tim`, `Lisa`, `Jonas`, `Sarah`, `Max`, `Emma`, etc.) and items (`Murmeln`, `Kekse`, `Äpfel`, `Stifte`, `Bücher`, etc.).

---

## 3. Caveats

- **UI Integration**: `src/types/practice.ts` and `src/utils/practiceGenerator.ts` provide pure core logic and data structures. UI consumption by `PracticeConfigView`, `PracticeSessionView`, `PrintableWorksheet`, and `PracticeView` is assigned to Milestone 1 and Milestone 3.

---

## 4. Conclusion

Milestone 2 (Practice Generator Core Logic & Dynamic Variations Engine) is fully implemented, strictly typed, and verified with 100% test pass rate across all 267 unit and integration tests.

---

## 5. Verification Method

To verify the implementation independently:

1. **Run Vitest Test Suite**:
   ```powershell
   npm run test
   ```
   *Expected Result*: 33 test files passed, 267 total tests passed (0 failures).

2. **Run Linter**:
   ```powershell
   npm run lint
   ```
   *Expected Result*: 0 errors.

3. **Run TypeScript Compiler**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result*: Clean execution with 0 type errors.
