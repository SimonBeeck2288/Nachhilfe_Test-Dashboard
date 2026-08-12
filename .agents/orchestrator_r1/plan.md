# Plan — Project Orchestrator (NachhilfeTest UX & Question Bank Refactoring)

## Objectives
Execute refactoring requirements R1 to R5 with 100% test pass rate, clean linting, and full forensic integrity verification.

## Architecture & Requirements Overview
- **R1: Mid-Test UX & Tip Modal Refactoring**: Remove mid-test modal popups ("Wusstest du schon?") during timed modules (`ModuleMath`, `ModuleEnglish`). Do not reveal answers mid-test or interrupt question timer.
- **R2: Pause Button with 90-Second Zwischenpausenpool**: Header Pause button in `ModuleMath` and `ModuleEnglish` suspending question and module timers. Shared 90s countdown across session. Disable pause when pool reaches 0s.
- **R3: Question Bookmarking ("Markieren" Button)**: Flag questions, persist marked question IDs in test session state, display in summary report.
- **R4: Back Button Navigation ("Zurück" Button)**: Step back to previous question, undo accidental submission, allow re-entry.
- **R5: Question Bank Quality & Logic Audit Fixes**:
  - Fix Level 6 cube edge question in `questions.ts` to ask for volume ($V = a^3$).
  - Standardize English multiple-choice option formatting (remove exclusive details/synonym slashes in correct answers vs single-word distractors).
  - Fix numeric input evaluation for decimal responses (accept `1` for `1,0`) and normalize whitespace/case/punctuation in comparisons.

## Milestone Plan (Initial Draft — to be finalized post-survey)
- **M0: Survey & Initial State Baseline**: Run 3 parallel Explorers to inspect codebase structure, test suite setup, components, state management, and question generators.
- **M1: UX & Control Features (R1, R2, R3, R4)**: Component state, header controls, pause pool modal/timer, bookmarking state, back navigation history.
- **M2: Question Bank & Evaluation Fixes (R5)**: `questions.ts` fixes, English option formatting standardization, math volume fix, evaluation logic normalization (`.trim()`, decimal equivalence).
- **M3: Testing & Hardening**: E2E integration test suite, edge-case coverage, vitest test suite expansion for pause pool, bookmarking, and step-back navigation.
- **M4: Auditing & Gate Verification**: Independent Reviewers, Challengers, and Forensic Integrity Auditor.

## Execution Timeline
1. Phase 0: Survey codebase with 3 Explorers.
2. Phase 1: Synthesize survey results into `PROJECT.md` feature inventory and code layout.
3. Phase 2: Execute Milestone 1 (UX & Controls).
4. Phase 3: Execute Milestone 2 (Question Bank & Evaluation).
5. Phase 4: Execute Milestone 3 & 4 (E2E Tests, Reviews, Forensic Audit).
6. Phase 5: Final Pass verification (`npm run test` & `npm run lint`) & Report to Sentinel.
