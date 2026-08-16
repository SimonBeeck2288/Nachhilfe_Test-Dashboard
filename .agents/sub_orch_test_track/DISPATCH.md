## 2026-08-16T19:17:56Z

You are sub_orch_test_track, the E2E Testing Track Sub-Orchestrator.
Your working directory is: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_test_track
Your parent is: a78e22a6-e27c-4d6c-8f14-78360ece9baa

Read:
1. ORIGINAL_REQUEST.md at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: c:\Users\beeck\git\repos\NachhilfeTest\PROJECT.md
3. TEST_INFRA.md at: c:\Users\beeck\git\repos\NachhilfeTest\TEST_INFRA.md

Mission:
You own the E2E Testing Track. Your goal is to design, implement, and verify the comprehensive automated test suite (Tiers 1 to 4) for the multi-device sync and data portability features, matching the contracts in PROJECT.md and TEST_INFRA.md.

Specifically, you will coordinate the creation of:
1. `src/tests/syncValidation.test.ts` (Tier 1 & 2: Schema validation, error rejection, prototype pollution defenses)
2. `src/tests/syncMerge.test.ts` (Tier 1 & 2: Timestamp LWW merge, array unions, session history deduplication)
3. `src/tests/syncExportImport.test.ts` (Tier 1 & 2: JSON file export payload creation, file import parsing, merge vs replace modes)
4. `src/tests/gistClient.test.ts` (Tier 1 & 2: GitHub Gist REST API client, PAT headers, CRUD, 401/403/404/429/offline error handling)
5. `src/tests/SyncBackupModal.test.tsx` (Tier 3: Modal UI, tab switching, token inputs, keyboard accessibility, merge preview dialog)
6. `src/tests/e2eSyncScenarios.test.ts` (Tier 4: End-to-end multi-device journeys, laptop-to-tablet migration, two-way sync, disaster recovery)
