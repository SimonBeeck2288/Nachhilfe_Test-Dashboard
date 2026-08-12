# Master Plan — AI Tutoring Integration (Zero Running Cost)

## Objective
Implement and verify a zero-running-cost AI Tutoring Integration for NachhilfeTest according to user requirements R1-R5.

## Milestones & Strategy
1. **Survey Phase**: Dispatch 3 parallel `teamwork_preview_explorer` agents to survey existing files (`student.ts`, `studentRoster.ts`, `StudentSwitcherModal.tsx`, `PracticeSessionView.tsx`, `Dashboard.tsx`, `DiagnosticReportPrint.tsx`, `PROJECT.md`, test suite structure).
2. **M1: Student Profile Expansion**: Extend `StudentProfile` with `hobbies`, `learningPreferences`, `customNotes`, update `studentRoster.ts` storage, update UI in `StudentSwitcherModal.tsx`.
3. **M2: Modular Zero-Cost AI Prompt Engine**: Create `aiPromptGenerator.ts` supporting 3 prompt modes, injecting personality, empirical performance, and question context. Create unit tests in `src/tests/ai_prompt_generator.test.ts`.
4. **M3: Gemini Gem Modal & Sidecar Launcher**: Build `AiPromptModal.tsx` with tabbed mode selector, live preview, Sidecar launcher (window.open 480x750 + clipboard copy to Gemini Gem), secondary ChatGPT/HuggingChat links, toast feedback.
5. **M4: View Integrations**: Integrate "KI-Tutor Gem Hilfe" buttons in `PracticeSessionView.tsx`, `Dashboard.tsx`, `DiagnosticReportPrint.tsx`.
6. **M5: Documentation & E2E Verification**: Document in `AI_PROMPT_GUIDELINES.md`, update `PROJECT.md`, run 100% Vitest test suite (`npm run test`) and `npm run lint`. Run Reviewers, Challengers, and Forensic Auditor.
