## 2026-08-09T18:56:52Z
<USER_REQUEST>
You are worker_m4 assigned to implement Milestone M4: View Integrations for NachhilfeTest.
Your working directory for coordination and handoff files is c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m4.
Project root: c:\Users\beeck\git\repos\NachhilfeTest.

Please read the following key files before starting:
- c:\Users\beeck\git\repos\NachhilfeTest\.agents\orchestrator\ORIGINAL_REQUEST.md
- c:\Users\beeck\git\repos\NachhilfeTest\.agents\orchestrator\PROJECT.md

Scope of Milestone M4 (View Integrations):
1. `src/components/PracticeSessionView.tsx`:
   - Add "KI-Tutor Gem Hilfe" button (with Sparkles / Bot icon) in the answer feedback banner after submitting an answer.
   - Clicking the button opens `AiPromptModal` pre-populated with:
     - `studentProfile`: current active student profile (from `studentRoster.ts` or passed state/prop).
     - `questionContext`: `{ subject, topic, level/gradeLevel, questionText, userAnswer, correctAnswer, explanation }`.
     - `initialMode`: 'socratic' or 'personalized'.

2. `src/components/Dashboard.tsx`:
   - Integrate "KI-Tutor Gem Hilfe" / AI Prompt Modal launchers in:
     a) Weak topics accordion/section: button to launch `AiPromptModal` with `initialMode: 'practice_tasks'` or `'personalized'` using the weak topic context and empirical performance data (strengths/weaknesses).
     b) Bookmarked / wrong question items: button to launch `AiPromptModal` with the specific question context.

3. `src/components/DiagnosticReportPrint.tsx`:
   - In the `no-print` action bar / header and topic list: add "KI-Tutor Gem Hilfe" button to launch `AiPromptModal` configured with the student's full empirical performance context (strengths, weaknesses, gradeLevel, subject topic accuracy).

Verification & Quality Requirements:
- Make sure all modal state (isOpen, active context, initialMode) is properly state-managed without breaking existing UI flows or layout styling.
- All new UI elements should be responsive, accessible, cleanly styled with Tailwind CSS, and consistent with existing app components.
- Run tests (`npm run test`) and linter (`npm run lint`) to ensure ZERO regressions and 100% pass rate.
- Document all changes and verification results in `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m4\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
