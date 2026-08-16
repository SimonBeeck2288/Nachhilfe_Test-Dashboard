## 2026-08-16T19:18:36Z
You are explorer_test_1, an Explorer agent for the E2E Testing Track.
Your working directory is: c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_test_1

Read:
1. ORIGINAL_REQUEST.md at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: c:\Users\beeck\git\repos\NachhilfeTest\PROJECT.md
3. TEST_INFRA.md at: c:\Users\beeck\git\repos\NachhilfeTest\TEST_INFRA.md
4. Existing types in `src/types/student.ts`, `src/types/history.ts`.
5. Existing test files in `src/tests/` to inspect mock patterns (e.g. `src/tests/student_switching.test.ts`, `src/tests/focus_integration.test.tsx`).

Task:
Perform a comprehensive technical analysis for the E2E test suite covering Multi-Device Sync & Data Portability.
Detail the exact test case inventory and structure for the 6 test files:
1. `src/tests/syncValidation.test.ts` (Tier 1 & 2: Schema validation, error rejection, prototype pollution defenses, required fields, type checks)
2. `src/tests/syncMerge.test.ts` (Tier 1 & 2: Timestamp LWW merge, array unions, session history deduplication, corrupted/missing timestamps, empty arrays)
3. `src/tests/syncExportImport.test.ts` (Tier 1 & 2: JSON file export payload creation, file import parsing, merge vs replace modes, malformed JSON, browser Blob / download mocking)
4. `src/tests/gistClient.test.ts` (Tier 1 & 2: GitHub Gist REST API client, PAT headers, CRUD, 401/403/404/429/offline error handling, fetch mocking)
5. `src/tests/SyncBackupModal.test.tsx` (Tier 3: Modal UI, tab switching, token inputs, keyboard accessibility, merge preview dialog, ARIA attributes, focus trapping)
6. `src/tests/e2eSyncScenarios.test.ts` (Tier 4: End-to-end multi-device journeys, laptop-to-tablet migration, two-way sync, disaster recovery, active test session isolation)

Produce a detailed specification and test matrix report at `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_test_1/test_plan.md` and write your `handoff.md`.
Send a message when complete.
