# Scope: Milestone M1 — UX & Control Features (R1, R2, R3, R4)

## Architecture & Responsibilities
Implement user experience improvements and header/question controls:
1. **R1. Mid-Test UX & Tip Modal Removal**:
   - Remove blocking mid-test `DidYouKnowModal` popups in `ModuleMath.tsx` (lines 140-142) and `ModuleEnglish.tsx` (lines 135-137).
   - Ensure wrong answers advance questions immediately without disclosing correct answers mid-test or freezing active timers.
2. **R2. Pause Button with 90-Second Zwischenpausenpool**:
   - Update `TestSessionContext.tsx` with `pausePoolSeconds: number` (init 90) and `isPaused: boolean`.
   - Update `useQuestionTimer` or component timer hooks to suspend active question/module countdown when `isPaused` is true, and count down `pausePoolSeconds` by 1s every second while paused.
   - Automatically unpause when `pausePoolSeconds` reaches 0s, and disable the Pause button.
   - Add sticky header Pause button to `ModuleMath.tsx` and `ModuleEnglish.tsx` displaying remaining pool seconds.
3. **R3. Question Bookmarking ("Markieren" Button)**:
   - Add `markedQuestionIds: string[]` to `TestSessionState` in `TestSessionContext.tsx` and `TestSessionRecord` in `src/types/index.ts`.
   - Add a "Markieren" bookmark toggle button in `QuestionRenderer.tsx` with visual bookmark indicator.
   - Persist marked question IDs in session storage / test session records.
   - Display bookmarked question counts and badges in `Dashboard.tsx` and `DiagnosticReportPrint.tsx`.
4. **R4. Back Button Step-Back Navigation ("Zurück" Button)**:
   - Add `questionHistory` stack and `popLastAnswer()` action in `TestSessionContext.tsx`.
   - Add a "Zurück" button in `QuestionRenderer.tsx` / test modules for navigating to the previous question, undoing the last submission, and allowing re-entry.

## Exclusive File Ownership
- `src/context/TestSessionContext.tsx`
- `src/types/index.ts`
- `src/components/ModuleMath.tsx`
- `src/components/ModuleEnglish.tsx`
- `src/components/QuestionRenderer.tsx`
- `src/components/Dashboard.tsx`
- `src/components/DiagnosticReportPrint.tsx`
- `src/hooks/useQuestionTimer.ts` (if applicable)

## Acceptance Criteria
- All 188 existing Vitest tests pass cleanly (`npm run test`).
- `npm run lint` passes without errors.
- New state and UI features work seamlessly without regressions.
