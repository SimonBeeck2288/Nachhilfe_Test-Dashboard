## 2026-08-09T02:42:30Z
<USER_REQUEST>
You are teamwork_preview_explorer_survey_2. Your working directory is c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2.
Your task is to conduct a technical survey of the NachhilfeTest codebase for the Übungs-Generator (Practice Generator) feature, specifically focusing on Task Generation & Dynamic Variations and Test Suite Infrastructure.

Requirements to investigate in ORIGINAL_REQUEST.md and codebase:
1. Data source: `src/data/questions.ts` (or similar question data files) and question types/structures in `src/types/`.
2. Question filtering & matching: Filter questions by selected topics, subject, and target level (1-7).
3. Dynamic Variations:
   - Dynamic parameter/number variations for Math questions when more questions are requested than exist or for variety.
   - Dynamic text variations for English questions (synonyms, context variations, word swaps).
4. Generation logic & testability: How to structure `src/utils/practiceGenerator.ts` or similar module, dynamic variation engines, seedable/deterministic RNG for testing if needed.
5. Existing test suite: Inspect `src/tests/` (Vitest test suite, existing 244+ tests, test helpers, running `npm run test` or `npx vitest run`).

Please inspect existing files in `src/data/`, `src/types/`, `src/tests/`, `src/utils/`, and `ORIGINAL_REQUEST.md`.

Write your detailed findings to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2\analysis.md` and a summary handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_2\handoff.md`. Communicate back when done.
</USER_REQUEST>
