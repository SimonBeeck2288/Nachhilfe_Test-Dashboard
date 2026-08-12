## 2026-08-09T02:43:34Z

You are teamwork_preview_worker_m2. Your working directory is c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m2.
Your task is to implement Milestone 2 (Practice Generator Core Logic & Dynamic Variations Engine) for the Übungs-Generator feature.

Original Request path: c:\Users\beeck\git\repos\NachhilfeTest\ORIGINAL_REQUEST.md
Project Specification path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\orchestrator_r2\PROJECT.md
Survey 2 Handoff path: c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2\handoff.md

Scope & File Ownership:
- Exclusive files owned: `src/types/practice.ts`, `src/utils/practiceGenerator.ts`.

Requirements to Implement:
1. Data Types (`src/types/practice.ts`): Define `TopicConfig`, `PracticeGeneratorConfig`, `GeneratedExerciseItem`, `PracticeSheet` as specified in `PROJECT.md`.
2. Matching Algorithm (`src/utils/practiceGenerator.ts`): Pick questions from `src/data/questions.ts` matching selected topics, subject filter, and target levels (1-7).
3. Math Dynamic Variation Engine:
   - Parameter/number randomization (e.g. changing coefficients, operands, geometric dimensions) scaled appropriately for target level (1-7).
   - Ensure positive integer results where required (e.g. basic arithmetic, division without fractions unless level expects fractions).
   - Story/context variations (e.g. swapping names, items, units).
4. English Dynamic Variation Engine:
   - Synonym, noun, and proper name substitutions.
   - Sentence context variations while preserving grammatical structure and target vocabulary/rule.
   - Option/distractor shuffling and answer key updates.
5. Deterministic Seeded Generator:
   - Implement a seedable PRNG (e.g. Mulberry32 algorithm) so that passing `seed` in `PracticeGeneratorConfig` produces 100% deterministic, reproducible exercise sheets for testing.
   - Handle cases where requested question count exceeds existing static questions by generating dynamic variations seamlessly.
6. Helper `calculateTopicAccuracy(studentId, topicId)`: Calculate student accuracy percentage from session history in `sessionHistory.ts`.

Verification Rules:
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Run `npm run test` and `npm run lint` to verify that existing 244 tests pass and there are no lint/build errors.

Write your report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_worker_m2\handoff.md` and communicate back when done.
