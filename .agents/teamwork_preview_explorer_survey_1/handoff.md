# Handoff Report: Übungs-Generator (Practice Generator) — UI Navigation & Configuration Technical Survey

**Agent**: `teamwork_preview_explorer_survey_1`  
**Date**: 2026-08-09  
**Scope**: Technical survey of UI Navigation & Configuration requirements for the Übungs-Generator feature.

---

## 1. Observation

1. **Routing & Navigation (`src/App.tsx` & `src/components/Layout.tsx`)**:
   - `src/App.tsx` configures routes inside `<Layout />` (lines 18-28):
     ```tsx
     <Route path="/" element={<Layout />}>
       <Route index element={<Home />} />
       <Route path="warmup" element={<ModuleWarmup />} />
       <Route path="cognition" element={<ModuleCognition />} />
       <Route path="level-proposal" element={<LevelProposal />} />
       <Route path="math" element={<ModuleMath />} />
       <Route path="english" element={<ModuleEnglish />} />
       <Route path="dashboard" element={<Dashboard />} />
       <Route path="configurator" element={<TestConfigurator />} />
       <Route path="*" element={<Navigate to="/" replace />} />
     </Route>
     ```
   - `src/components/Layout.tsx` lines 62-75 render navigation buttons for `"Roster"` and `"Dashboard"`.

2. **Student Profile & Grade (`src/types/student.ts` & `src/context/TestSessionContext.tsx`)**:
   - `src/types/student.ts` (lines 1-10) defines `StudentProfile` containing `id`, `name`, `gradeLevel` (number | string), `favoriteSubject`, `problemSubject`, `notes`.
   - `src/context/TestSessionContext.tsx` provides `currentStudent` and `state.studentName`.
   - `src/utils/studentRoster.ts` manages roster persistence via `localStorage` key `'diagnostic_student_roster'`.

3. **Topic Stats & Performance Aggregation (`src/utils/sessionHistory.ts` & `src/components/TopicAccuracyChart.tsx`)**:
   - `src/utils/sessionHistory.ts` provides `getSessionsByStudentId(studentId)`.
   - `src/components/TopicAccuracyChart.tsx` (lines 9-53) aggregates correct and total answers per topic across sessions:
     ```tsx
     accuracy = Math.round((t.correct / t.total) * 100)
     ```
   - Threshold `< 70%` accuracy represents areas needing reinforcement ("Ausbaubedarf").

4. **Questions & Topic Pools (`src/data/questions.ts` & `src/components/TestConfigurator.tsx`)**:
   - `src/data/questions.ts` includes `englishQuestions` and `mathQuestions` with `level` (1–7) and `topic`.
   - `src/components/TestConfigurator.tsx` defines standard topic lists `MATH_TOPICS` (16 topics) and `ENGLISH_TOPICS` (16 topics).

5. **Test Suite Baseline Status**:
   - Execution of `npx vitest run` returned:
     ```
     Test Files  31 passed (31)
          Tests  244 passed (244)
     ```

---

## 2. Logic Chain

1. **Observation 1** shows that adding `"Übungs-Generator"` to the global navigation requires:
   - A new `<Link to="/practice" className="btn btn-secondary">` in `src/components/Layout.tsx`.
   - A new route `<Route path="practice" element={<PracticeGenerator />} />` in `src/App.tsx`.
2. **Observation 2** establishes that student grade levels (`gradeLevel`) and active profiles are accessible via `TestSessionContext`. Grade level prefilling can map student grade (e.g. Grade 5) directly to baseline question level (Level 2).
3. **Observation 3** proves that topic accuracy calculation is already established in `TopicAccuracyChart.tsx`. Filtering topics where `accuracy < 0.70` (with `total > 0`) provides exact data to highlight topics with `"Ausbaubedarf"`.
4. **Observation 4** confirms that topics can be filtered by subject (`math`, `english`, `both`), and each selected topic can have an individual target level slider/selector (1–7) prefilled with the student's current level.
5. **Observation 5** verifies that the existing 244 tests pass cleanly, providing a stable foundation for implementing the Übungs-Generator feature.

---

## 3. Caveats

- **No past test data case**: If a student is new or has no historical test sessions, accuracy cannot be computed (`total === 0`). In this case, topics should be labeled as `"Noch ungeprüft"`, and all topics relevant for the student's grade should be selected by default.
- **Grade-to-Level Mapping**: The mapping assumes Grade 1-4 = Level 1, Grade 5 = Level 2, Grade 6 = Level 3, Grade 7 = Level 4, Grade 8 = Level 5, Grade 9 = Level 6, Grade 10+ = Level 7.

---

## 4. Conclusion

The technical survey confirms that the existing architecture in `NachhilfeTest` cleanly supports the requirements for the **Übungs-Generator (Practice Generator)** UI Navigation & Configuration. 

Detailed analysis, component blueprints, data contracts (`PracticeGeneratorConfig`, `PracticeTopicSelection`), and UI design specifications have been documented in `analysis.md`.

---

## 5. Verification Method

To independently verify these survey findings and baseline code integrity:
1. **Run Vitest Test Suite**:
   ```bash
   npx vitest run
   ```
   Expect: 31 test files passed, 244 tests passed.
2. **Inspect Survey Report File**:
   View `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_1\analysis.md`.
