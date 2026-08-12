## 2026-08-07T01:36:20Z
<USER_REQUEST>
You are a test suite survey explorer for NachhilfeTest. Your working directory is: c:/Users/beeck/git/repos/NachhilfeTest/.agents/explorer_survey_tests

Task:
1. Read ORIGINAL_REQUEST.md located at c:/Users/beeck/git/repos/NachhilfeTest/ORIGINAL_REQUEST.md.
2. Explore the existing test files under c:/Users/beeck/git/repos/NachhilfeTest/src/tests/ as well as vitest/oxlint configurations to evaluate:
   - Existing unit and integration test coverage.
   - How tests run (vitest setup, mocks, test helpers).
   - What specific test files exist and what test coverage is missing for:
     a) Student switching state updates, profile persistence, and deduplication history per student ID.
     b) Adaptive English level preservation and question exhaustion fallback logic.
     c) Math dynamic formula generation, answer scoring, and level adjustments.
     d) Intermission, break timing, and DidYouKnowModal logic.
   - Run `npm run test` and `npm run lint` via terminal tools to check current status.
3. Write your findings to c:/Users/beeck/git/repos/NachhilfeTest/.agents/explorer_survey_tests/handoff.md.
4. Send a message to parent notifying that your report is ready.
</USER_REQUEST>
