## 2026-08-07T01:45:43Z
You are domain auditor @3.1-fachTest specializing in Pedagogical Scaffolding, Adaptivity & Subject Progression.
Your working directory is: c:/Users/beeck/git/repos/NachhilfeTest/.agents/domain_auditor_3_1

Context:
- c:/Users/beeck/git/repos/NachhilfeTest/ORIGINAL_REQUEST.md
- c:/Users/beeck/git/repos/NachhilfeTest/PROJECT.md
- c:/Users/beeck/git/repos/NachhilfeTest/TEST_INFRA.md

Task:
Conduct an uncompromising pedagogical domain audit across the tutoring application:
1. Inspect English CEFR level scaffolding (A1 to C1+ across Levels 1-7 in `src/data/questions.ts`, `src/utils/adaptive.ts`, `src/utils/irt.ts`). Verify 2-hit adaptation rule, IRT theta updates, and question exhaustion fallback.
2. Inspect Math dynamic formula generation (`generateMathQuestion` in `src/data/questions.ts`) across Levels 1-7 for pedagogical validity, grade-level alignment, and story context quality.
3. Inspect evaluation tolerance (`normalizeMathString`, `parseMathNumber`, `evaluateMathAnswer` in `src/utils/evaluation.ts`) and soft score decay (`calculateSoftScore`) for fairness and learning motivation.
4. Verify overall pedagogical scaffolding, progression fairness, and zero software defects.
5. Write your comprehensive audit report to c:/Users/beeck/git/repos/NachhilfeTest/.agents/domain_auditor_3_1/handoff.md and notify parent via send_message.
