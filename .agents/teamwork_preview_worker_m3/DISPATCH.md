## 2026-08-09T00:45:13Z
You are teamwork_preview_worker_m3. Your working directory is c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m3.
Your task is to implement Milestone 3 (Interactive Practice Mode & Printable Worksheet View) for the Übungs-Generator feature.

Original Request path: c:\Users\beeck\git\repos\NachhilfeTest\ORIGINAL_REQUEST.md
Project Specification path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\orchestrator_r2\PROJECT.md
Survey 3 Handoff path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_3\handoff.md

Scope & File Ownership:
- Exclusive files owned: `src/components/PracticeSessionView.tsx`, `src/components/PrintableWorksheet.tsx`, `src/components/PracticeView.tsx`.
- Referenced dependencies: `src/types/practice.ts`, `src/utils/practiceGenerator.ts`, `src/components/PracticeConfigView.tsx`.

Requirements to Implement:
1. Interactive Practice Mode (`src/components/PracticeSessionView.tsx`):
   - Step-by-step solving experience (Question N of Total).
   - Option selection, instant feedback (success/error messages, detailed explanation).
   - Mascot tips ("Eule" / Mascot hint toggle/modal using existing mascot assets/SVG or Lucide icons).
   - Active timer display (respects `isTimerDisabled` flag).
   - Session summary report: total score, percentage, time spent, breakdown per topic, options to restart or generate new sheet.
2. Printable Worksheet & Answer Key View (`src/components/PrintableWorksheet.tsx`):
   - Formatted printable worksheet for students (questions, multiple-choice options or writing space, metadata header with student name, grade, date).
   - Separate printable Lösungsblatt (answer key) for tutors/parents with correct answers and explanations clearly marked.
   - `@media print` CSS styling: Hide non-printable UI buttons/nav headers (`no-print` utility class), force clean A4 pagination (`page-break-after: always`).
3. Connect `src/components/PracticeView.tsx`:
   - Mode switcher between `config` (PracticeConfigView), `interactive` (PracticeSessionView), `print-student` (PrintableWorksheet in student mode), and `print-teacher` (PrintableWorksheet in answer key mode).
   - Trigger browser print dialog (`window.print()`) when entering print modes or clicking print action buttons.

Verification Rules:
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Run `npm run test` and `npm run lint` to verify that existing 267 tests pass cleanly.

Write your report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m3\handoff.md` and communicate back when done.
