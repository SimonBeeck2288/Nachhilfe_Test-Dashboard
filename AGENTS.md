# Agent Guidelines & Testing Rules

## Test Suite Execution Rules
1. **Test Suite Availability**: The project contains a comprehensive Vitest test suite (96+ unit and integration tests) located under [`src/tests/`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/tests).
2. **Execution Command**: The test suite can be run directly using `npm run test` (or `npx vitest run`).
3. **Mandatory Verification Rules**:
   - **For `@3-test` Agent**: When performing quality assurance, verification, or edge-case testing, execute `npm run test` to ensure 100% of test suites pass cleanly without errors.
   - **For `@2-build` & `@4-debug` Agents**: Every time code is updated, added, or modified, run `npm run test` and `npm run lint` before finishing the task to prevent regression errors.
