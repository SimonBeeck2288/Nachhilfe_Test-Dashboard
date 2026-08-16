## 2026-08-16T19:20:34Z
You are Worker 1 for Milestone M1: JSON Data Portability & Merge Engine.
Working directory: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\worker_1
Parent Orchestrator: 03c47c14-5a60-48fe-bac1-53ec0441df3f

Read these files first:
1. ORIGINAL_REQUEST.md at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: c:\Users\beeck\git\repos\NachhilfeTest\PROJECT.md
3. SCOPE.md at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\SCOPE.md
4. TEST_INFRA.md at: c:\Users\beeck\git\repos\NachhilfeTest\TEST_INFRA.md
5. Explorer 1 findings at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\explorer_1\handoff.md
6. Explorer 2 findings at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\explorer_2\handoff.md
7. Explorer 3 findings at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\explorer_3\handoff.md

Your Write Ownership:
You exclusively own and will create/modify:
- `src/types/sync.ts`
- `src/utils/syncValidation.ts`
- `src/utils/syncMerge.ts`
- `src/utils/syncExportImport.ts`
- `src/tests/syncValidation.test.ts`
- `src/tests/syncMerge.test.ts`
- `src/tests/syncExportImport.test.ts`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission & Implementation Requirements:
1. `src/types/sync.ts`:
   - Implement complete interfaces: `SyncMetadata`, `SyncData`, `SyncPayload`, `ValidationResult`, `MergeResult`, `MergeStats`, `ConflictRecord`, `GistSyncConfig`, `SyncOperationResult`, `SyncExportOptions`, `ImportMode`.
   - Re-export `StudentProfile`, `TestSessionRecord`, `AnswerRecord`, `TopicBreakdownItem`, `CognitionStatsRecord`, `AccessibilitySettings`, `CustomTestConfig`.
   - Provide aliases for compatibility (`SessionLog = TestSessionRecord`, `QuizResult = TestSessionRecord`, `sanitizedPayload`, `isValid`/`valid`).
   - Constant `SYNC_SCHEMA_VERSION = 1`.

2. `src/utils/syncValidation.ts`:
   - Zero external runtime dependencies. Pure TypeScript type guards and defensive validation.
   - Comprehensive prototype pollution defense (stripping `__proto__`, `constructor`, `prototype` in safe parser, recursive `Object.hasOwn` scanning with max depth 32, whitelisted object literal construction).
   - Strict field-level checks for `StudentProfile` and `TestSessionRecord`, calendar-accurate ISO 8601 validation (e.g. rejecting Feb 30), payload size guard (15MB), array bound checks.
   - Dual-compatibility support for `roster`/`students`, `history`/`sessions`, `valid`/`isValid`, `sanitizedPayload`/`payload`.
   - Clear, descriptive error messages and warnings.

3. `src/utils/syncMerge.ts`:
   - Deterministic conflict resolution (Last-Write-Wins comparing `updatedAt` timestamps).
   - Earliest `createdAt` timestamp preservation.
   - Case-insensitive Set Union for `hobbies` and `learningPreferences` preserving original casing and insertion order.
   - Session history deduplication by `sessionId` with descending chronological ordering (newest first).
   - Full conflict and stats accounting.

4. `src/utils/syncExportImport.ts`:
   - `createExportPayload(customData?)`: construct payload from storage or supplied data.
   - `downloadBackupFile(payload?, filename?)`: browser/JSDOM compatible download trigger.
   - `readBackupFile(file)`: async file reader.
   - `parseAndValidateBackupFile(jsonString)`: JSON parsing with syntax error handling and validation via `validateSyncPayload`.
   - `applyImportPayload(payload, mode)`: handle `'replace'` mode and `'merge'` mode, updating localStorage and returning `MergeResult`.

5. Comprehensive Unit Tests:
   - `src/tests/syncValidation.test.ts`: test all 7 validation categories and edge cases (happy path, corrupt JSON, prototype pollution attacks, boundary checks, bad dates, schema versioning, aliases).
   - `src/tests/syncMerge.test.ts`: test LWW resolution, tie breakers, hobby/preference set union, session history deduplication, and conflict tracking.
   - `src/tests/syncExportImport.test.ts`: test payload creation, validation integration, replace mode, merge mode, round-trip export/import, multi-device migration scenarios.

Verification:
- Run `npm run test` (all test suites must pass 100% cleanly).
- Run `npm run lint` (zero lint errors).
