# E2E Test Infra: NachhilfeTest Multi-Device Sync & Data Portability

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests are derived directly from user requirements (`ORIGINAL_REQUEST.md`) and verify end-user behavior (file export/import, Gist push/pull, conflict resolution, accessibility, error resilience) without coupling to private implementation internals.
- **Methodology**: 4-Tier Test Matrix combining Category-Partition, Boundary Value Analysis, Pairwise Combinations, and Real-World Multi-Device Workload Scenarios.

---

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Tier 1 (Happy Path) | Tier 2 (Boundary & Error) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---------|-------------------|:-------------------:|:-------------------------:|:----------------------:|:-------------------:|
| F1 | Sync Types & Schema Definition | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | Runtime Schema Validator | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | JSON File Exporter | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F4 | JSON File Importer & Parser | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F5 | Timestamp Conflict Resolution | ORIGINAL_REQUEST §R1, §AC1 | 5 | 5 | ✓ | ✓ |
| F6 | Session History Deduplication | ORIGINAL_REQUEST §R1, §AC1 | 5 | 5 | ✓ | ✓ |
| F7 | GitHub Gist REST Client | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F8 | Secure Token & Config Storage | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F9 | Gist Push Operation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F10 | Gist Pull & Merge Operation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F11 | Network Resilience & Error Handling | ORIGINAL_REQUEST §R2, §AC2 | 5 | 5 | ✓ | ✓ |
| F12 | Sync & Backup Modal UI | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F13 | Merge Preview & Confirmation UI | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F14 | Navigation & Switcher UI Integration | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F15 | Accessibility & Theme Compliance | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Runner**: Vitest 4 with happy-dom environment (`npm run test` or `npx vitest run`).
- **Pass/Fail Semantics**: 100% test pass rate with 0 failing suites and 0 unhandled promise rejections.
- **Directory Layout**:
  - `src/tests/syncValidation.test.ts`: Schema validation, type checking, malformed input rejection, prototype pollution defenses.
  - `src/tests/syncMerge.test.ts`: Timestamp comparison, Last-Write-Wins, tag union, session deduplication, tombstone handling.
  - `src/tests/syncExportImport.test.ts`: JSON payload creation, download blob generation, file reading, import merge vs replace modes.
  - `src/tests/gistClient.test.ts`: Gist REST API client, PAT headers, CRUD on Gists, 401/403/404/429/offline error handling, rate limiting.
  - `src/tests/SyncBackupModal.test.tsx`: Modal rendering, tab navigation, token entry masking, test connection, merge preview dialog, keyboard accessibility, reduced sensory styles.
  - `src/tests/e2eSyncScenarios.test.ts`: Multi-device end-to-end user journeys (migration from Device A to B, two-way sync, disaster recovery).

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | **Tutor Laptop to Tablet Migration**: Export JSON backup from Laptop with 5 student profiles & 15 test sessions -> Import on Tablet -> Verify all profiles & session records are intact without corruption. | F1, F3, F4, F5, F6, F12, F13 | High |
| 2 | **Two-Way Cloud Sync via GitHub Gist**: Device A updates Student A profile (adds notes) and pushes to Gist -> Device B adds Student B profile and completes a test session -> Device B pulls from Gist, merges both students and sessions, and pushes back -> Device A pulls to sync. | F5, F6, F7, F8, F9, F10, F11, F12 | High |
| 3 | **Corrupted File & Schema Disaster Recovery**: User attempts importing invalid JSON, an empty file, a file with missing fields, or an obsolete schema version -> App rejects cleanly with German error explanation, preserves existing local records with 0 data loss. | F2, F4, F11, F12, F13 | Medium |
| 4 | **Network Disruption & Token Expiry Handling**: User attempts Gist Sync with expired PAT, invalid Gist ID, or while offline -> App catches HTTP 401/404/Network error, displays informative guidance, never blocks ongoing diagnostic tests. | F7, F8, F10, F11, F12, F15 | Medium |
| 5 | **Active Session Preservation during Sync**: Tutor switches student and pulls latest data from Gist while an active diagnostic test is running -> Warning is shown or state is isolated so ongoing test progress is not destroyed. | F5, F6, F10, F14, F15 | High |

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (15 features × 5 = ≥75 tests)
- **Tier 2 (Boundary & Error Cases)**: ≥5 test cases per feature (15 features × 5 = ≥75 tests)
- **Tier 3 (Cross-Feature Combinations)**: ≥15 interaction tests covering major pairwise combinations
- **Tier 4 (Real-World Scenarios)**: ≥5 complete multi-device journey tests
- **Total Minimum New Test Cases**: ≥170 test cases
