# Handoff Report: View Integration Survey (`explorer_survey_2`)

## 1. Observation

### 1.1 Source Files Inspected
* **`src/components/PracticeSessionView.tsx`**:
  * Line 2: Imports `GeneratedExerciseItem`, `PracticeSheet`, `PracticeGeneratorConfig` from `../types/practice`.
  * Lines 113–121: Session state (`currentIndex`, `selectedOption`, `customInput`, `isAnswerSubmitted`, `isCorrect`, `userAnswers`, `elapsedSeconds`).
  * Lines 135–153: `handleSubmitAnswer` validates input against `currentExercise` and updates `userAnswers` with `{ answer, isCorrect }`.
  * Lines 230–437: Summary screen (`isCompleted`) displaying performance metrics, total score, time spent, and `summaryResults.topicBreakdown`.
  * Lines 777–831: Instant answer feedback banner when `isAnswerSubmitted === true`, containing `isCorrect` status, `currentExercise.correctAnswer`, and `currentExercise.explanation`.

* **`src/pages/Dashboard.tsx`**:
  * Lines 47–216: `TopicAccordionList` renders topic breakdown items with accuracy percentages (`t.accuracy`), average times (`t.avgTime`), and child `AnswerRecord` items.
  * Lines 151–168: Displays "Gemerkt" badge when `rec.questionId` is present in `state.markedQuestionIds`.
  * Lines 413–478: Header card displaying `state.currentStudent` avatar, total points, unlocked badges, and action buttons (`Avatar Anpassen`, `Diagnosebericht als PDF`, `Neuer Test`).
  * Lines 799–929: `reviewingSession` modal rendering historical test details, score breakdown, and individual `answers` with answers and correct answers.

* **`src/components/DiagnosticReportPrint.tsx`**:
  * Lines 26–40: Extracts `answers`, `mathLevel`, `englishLevel`, `studentName`, `favoriteSubject`, `problemSubject`, and `markedQuestionIds` from `sessionRecord` or context `state`.
  * Lines 84–97: Computes `mathTopics`, `englishTopics`, `strengths` (accuracy >= 70%), and `weaknesses` (accuracy < 70%).
  * Lines 115–116: State `tutorNotes` initialized with `defaultRecommendation` and rendered in an editable `<textarea>` (lines 434–453).
  * Lines 123–167: CSS print media query (`@media print`) hiding `.no-print` elements and optimizing for A4 portrait layout.

---

## 2. Logic Chain

1. **`PracticeSessionView.tsx`**:
   * *Observation*: Line 777–831 displays the feedback banner immediately after answer submission (`isAnswerSubmitted`).
   * *Reasoning*: This is the exact moment of pedagogical feedback when students benefit most from immediate AI assistance.
   * *Conclusion*: Placing the "KI-Tutor Gem Hilfe" button inside this feedback banner (below `💡 Explanation`, line 817) provides maximum contextual value. Passing `currentExercise` (questionText, topic, level, subject, explanation) and `answerToValidate` ensures `AiPromptModal` has full context.

2. **`Dashboard.tsx`**:
   * *Observation*: `TopicAccordionList` (lines 47–216) displays weak topics (`t.accuracy < 0.7`) and detailed question records.
   * *Reasoning*: Tutors and students review the dashboard to identify specific weaknesses or review bookmarked/incorrect questions.
   * *Conclusion*: Adding KI buttons to weak topic headers (line 111) and individual question drilldowns (lines 176–204 & 873–920) lets users generate targeted AI practice prompts for specific weak areas or bookmarked questions.

3. **`DiagnosticReportPrint.tsx`**:
   * *Observation*: Top action bar (lines 170–211) and tutor notes textarea (lines 416–454) have `.no-print` control areas.
   * *Reasoning*: Diagnostic print reports must remain clean A4 PDFs when printed, but screen users need access to AI prompt generation.
   * *Conclusion*: Adding a "KI-Tutor Gem Prompt erstellen" button to the `.no-print` top action bar and alongside tutor notes allows tutors/parents to convert diagnostic findings into a pre-formatted Gemini Gem prompt without cluttering the printed A4 output.

---

## 3. Caveats

* **Print Styling Constraint**: Any UI elements added to `DiagnosticReportPrint.tsx` MUST use `className="no-print"` so they are excluded when printing or saving as PDF (`window.print()`).
* **Modal Context Fallbacks**: If `state.currentStudent` is `null` (e.g. guest mode), fallback values (e.g. name = `'Gast'`, gradeLevel = `5`) must be supplied to `AiPromptContext` to prevent undefined errors in `generateGeminiPrompt()`.

---

## 4. Conclusion

The codebase provides full access to all required data fields (student personality/hobbies, empirical performance stats, weak topics, and detailed question metadata) across `PracticeSessionView.tsx`, `Dashboard.tsx`, and `DiagnosticReportPrint.tsx`.

Wiring these views to `AiPromptModal.tsx` via the unified `AiPromptContext` data structure will enable seamless, zero-cost AI tutoring via the custom **NachhilfeTest Gemini Gem** sidecar popup window (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`).

---

## 5. Verification Method

To verify these findings and integration points:
1. Inspect file paths:
   - `src/components/PracticeSessionView.tsx` (lines 777–831)
   - `src/pages/Dashboard.tsx` (lines 47–216, 413–478, 873–920)
   - `src/components/DiagnosticReportPrint.tsx` (lines 170–211, 397–454)
2. Run test suite to verify no syntax or type errors:
   `npm test`
3. Run linter check:
   `npm run lint`
