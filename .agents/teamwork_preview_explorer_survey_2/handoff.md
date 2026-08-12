# Handoff Report: Task Generation, Dynamic Variations & Test Suite Infrastructure Survey

**Agent**: `teamwork_preview_explorer_survey_2`  
**Working Directory**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2`  
**Date**: 2026-08-09  

---

## 1. Observation

1. **Question Data Sources & Structures (`src/data/questions.ts`)**:
   - `englishQuestions`: Pool of ~250+ static questions covering Levels 1–7 across 16 topics (`lines 65–447, 224–447`).
   - `generateMathQuestion(level, askedIds)`: Procedural math question generator for Levels 1–7 across 17 topics (`lines 458–921`).
   - Core interfaces (`lines 1–37`): `Question`, `QuestionType` (`'multiple-choice' | 'input' | 'drag-sort' | 'matching' | 'fraction-pie'`), `DiagramData`, `MatchingPair`.
2. **Evaluation & Adaptive Logic (`src/utils/evaluation.ts`, `src/utils/adaptive.ts`)**:
   - `evaluateMathAnswer`, `evaluateEnglishAnswer`, `normalizeMathString`, `normalizeEnglishString`, `calculateSoftScore`.
   - `computeNextLevel` (2-hit streak progression, level 1–7 clamping), `calculateStroopCalibration`.
3. **Session & Roster Storage (`src/utils/sessionHistory.ts`, `src/utils/studentRoster.ts`)**:
   - `getSessionsByStudentId(studentId)` provides `TestSessionRecord` with `topicBreakdown` containing `correct`, `total`, `accuracy`.
   - `getPastAskedQuestionIds(studentId)` tracks previously asked question IDs.
4. **Test Suite Infrastructure (`src/tests/`, `package.json`)**:
   - Executed command `npm run test` (`npx vitest run`). Result: **31 test files passed, 244 total tests passed in 1.67s** with 0 errors.
   - Executed command `npm run lint` (`oxlint`).

---

## 2. Logic Chain

1. **Weakness Detection Logic**:
   - By querying historical sessions via `getSessionsByStudentId(studentId)`, topic accuracy can be computed as $\frac{\sum \text{correct}}{\sum \text{total}}$.
   - Any topic with $\text{Accuracy} < 0.70$ (70%) is identified as a weak spot ("Ausbaubedarf") and highlighted as a recommendation in the Übungs-Generator UI.

2. **Dynamic Variations Engine**:
   - **Math**: Procedural formulas in `generateMathQuestion` already generate random numbers for arithmetic, algebra, geometry, percentages, and word problems. Wrapping this with topic-specific parameters enables scaling to 5, 10, 15, or 20 tasks seamlessly.
   - **English**: Static questions in `englishQuestions` can be dynamically varied via name/noun substitution (word swaps), context template generation (grammar exercises), and distractor/option array shuffling.

3. **Deterministic RNG for Testability**:
   - Introducing an optional `seed` parameter and a seedable PRNG (Mulberry32) in `practiceGenerator.ts` guarantees deterministic output during automated tests while using `Math.random` in production.

4. **Module Contracts**:
   - Designing `src/utils/practiceGenerator.ts` with `PracticeGeneratorConfig`, `PracticeSheet`, and `PracticeSolution` cleanly decouples question generation, variation engines, and solution sheet creation from React UI components.

---

## 3. Caveats

- **No Source Code Modifications**: As a read-only explorer agent, no changes were made to source files in `src/`. All findings, proposed interfaces, and test strategies are documented in `analysis.md` and `handoff.md`.
- **Print Formatting**: Full visual verification of `@media print` styling will occur during the implementation phase when UI components are built.

---

## 4. Conclusion

The existing codebase infrastructure (`questions.ts`, `evaluation.ts`, `adaptive.ts`, `sessionHistory.ts`) provides a solid foundation for the **Übungs-Generator** feature.
- **Task Generation & Dynamic Variations**: Can be cleanly implemented in `src/utils/practiceGenerator.ts` using Math procedural formulas and English text/synonym variation engines.
- **Weakness Recommendations**: Can be calculated directly from `getSessionsByStudentId(studentId)` with the $<70\%$ accuracy threshold.
- **Test Infrastructure**: Fully functional with 244 passing Vitest tests. Adding `src/tests/practiceGenerator.test.ts` with deterministic RNG seeds will provide 100% test coverage for the generator without flakiness.

---

## 5. Verification Method

To verify the test suite baseline and analysis documents independently:

1. **Run Vitest Test Suite**:
   ```powershell
   npm run test
   ```
   *Expected Output*: 31 test files passed, 244 total tests passed (0 failures).

2. **Run Linter**:
   ```powershell
   npm run lint
   ```
   *Expected Output*: 0 errors or warnings.

3. **Inspect Analysis and Handoff Artifacts**:
   - Analysis report: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2\analysis.md`
   - Summary handoff: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2\handoff.md`
