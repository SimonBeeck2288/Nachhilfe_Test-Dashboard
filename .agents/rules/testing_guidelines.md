# Workspace Rule: Mandatory Test Suite Execution

## Rule Overview
Whenever changes are made to the codebase or when quality assurance testing is requested, the test suite must be executed to ensure zero regressions.

## Command & Path
- **Command**: `npm run test` (runs `npx vitest run`)
- **Test Files**: [`src/tests/`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/tests)

## Subagent Instructions
- **`3-test` Agent**: Always run `npm run test` first during any QA or testing turn, and include test results in your report.
- **`2-build` & `4-debug` Agents**: Always run `npm run test` and `npm run lint` after modifying any code to ensure no breaking changes were introduced.
