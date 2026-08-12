## 2026-08-09T00:43:34Z
You are teamwork_preview_worker_m1. Your working directory is c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m1.
Your task is to implement Milestone 1 (UI Navigation & Practice Generator Configuration View) for the Übungs-Generator feature.

Original Request path: c:\Users\beeck\git\repos\NachhilfeTest\ORIGINAL_REQUEST.md
Project Specification path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\orchestrator_r2\PROJECT.md
Survey 1 Handoff path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_1\handoff.md

Scope & File Ownership:
- Exclusive files owned: `src/components/Layout.tsx`, `src/App.tsx`, `src/components/PracticeConfigView.tsx`, `src/components/PracticeView.tsx`.
- Interfaces: Refer to `src/types/practice.ts` (or import types from it / create initial declarations if not yet existing).

Requirements to Implement:
1. Navigation: Add "Übungs-Generator" navigation link in `src/components/Layout.tsx` header (with `Wand2` icon from Lucide React) and register `/practice` route in `src/App.tsx`.
2. Student Profile & Grade Auto-Listing: Connect to `useTestSession()` / student profile state to display student's current grade (Klasse) and automatically list topics relevant for that grade.
3. Weakness Detection & Badge: Calculate accuracy per topic from student session history (`sessionHistory.ts`). Flag topics with < 70% accuracy visually with an "Ausbaubedarf" badge.
4. Topic Selection & Level Prefill: Checkbox selection for topics, quick action buttons ("Alle auswählen", "Nur Ausbaubedarf"), target level slider/select per topic (Level 1-7, prefilled with student target level).
5. Generator Settings: Subject filter toggle (`math` / `english` / `both`), question count selector (`5`, `10`, `15`, `20`), timer disable toggle switch (`isTimerDisabled`).
6. Setup `PracticeView.tsx` container component to manage configuration state and action handlers ("Übung starten", "Arbeitsblatt drucken", "Lösungsblatt drucken").

Verification Rules:
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Run `npm run test` and `npm run lint` to verify that existing 244 tests pass and there are no lint/build errors.

Write your report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m1\handoff.md` and communicate back when done.
