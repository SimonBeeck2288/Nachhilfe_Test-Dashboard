# Project: NachhilfeTest Multi-Device Sync & Data Portability

## Architecture
NachhilfeTest is a client-side React 19 / TypeScript / Vite single-page application for diagnostic tutoring tests. This project adds full multi-device synchronization and data portability through:
1. **JSON File Export & Import**: Standardized, versioned JSON payload (`schemaVersion: 1`) allowing complete backup, schema validation, and selective/complete restoration of student profiles and session history records.
2. **GitHub Gist Cloud Sync**: Serverless remote synchronization leveraging GitHub's REST API (`/gists`) with user-provided Personal Access Tokens (PAT), enabling private Gist creation, one-click push, pull, and conflict-free two-way synchronization.
3. **Conflict Resolution & Merge Engine**: Deterministic Last-Write-Wins (LWW) based on ISO `updatedAt` timestamps for student profiles, field-level union for preferences/tags, and immutable chronological deduplication by `sessionId` for session histories.
4. **Accessible UI Integration**: A dedicated `SyncBackupModal` dialog accessible from the top navigation bar (`Layout.tsx`), `StudentSwitcherModal.tsx`, `Home.tsx`, and `Dashboard.tsx`, featuring dark mode and reduced-sensory theme compatibility.

```
+-----------------------------------------------------------------------------------+
|                                 User Interface                                    |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Top Nav (Layout)   |  | StudentSwitcherModal |  | SyncBackupModal (Tabs)    |  |
|  +---------+----------+  +----------+-----------+  +-------------+-------------+  |
+------------|------------------------|----------------------------|----------------+
             |                        |                            |
             v                        v                            v
+-----------------------------------------------------------------------------------+
|                             Sync & Data Management                                |
|  +-----------------------------+       +---------------------------------------+  |
|  |     syncExportImport.ts     |       |            gistSync.ts                |  |
|  |  - exportBackupPayload()    |       |  - pushToGist()                       |  |
|  |  - importBackupPayload()    |       |  - pullFromGist()                     |  |
|  +--------------+--------------+       +-------------------+-------------------+  |
|                 |                                          |                      |
|                 +-------------------+----------------------+                      |
|                                     |                                             |
|                                     v                                             |
|                     +-------------------------------+                             |
|                     |         syncMerge.ts          |                             |
|                     |  - mergeStudentRosters()      |                             |
|                     |  - mergeSessionHistories()    |                             |
|                     +---------------+---------------+                             |
|                                     |                                             |
|                                     v                                             |
|                     +-------------------------------+                             |
|                     |      syncValidation.ts        |                             |
|                     |  - validateSyncPayload()      |                             |
|                     +---------------+---------------+                             |
+-------------------------------------|---------------------------------------------+
                                      v
+-----------------------------------------------------------------------------------+
|                        Storage & Remote Services                                  |
|  +----------------------------+              +---------------------------------+  |
|  | Local Storage Repositories |              |       GitHub REST API Client    |  |
|  | - diagnostic_student_roster|              |       (https://api.github.com)  |  |
|  | - diagnostic_session_history              | - createGist() / updateGist()   |  |
|  | - diagnostic_gist_config   |              | - getGist() / validateToken()   |  |
|  +----------------------------+              +---------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Sync Data Types & Payload Schema | TypeScript interfaces for `SyncPayload`, `SyncMetadata`, `SyncConfig`, `MergeResult`, and `ValidationResult` with `schemaVersion: 1`. | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Runtime Schema Validator | Zero-dependency TypeScript validator validating JSON structure, required fields, type correctness, and sanitizing inputs against prototype pollution. | M1 | ORIGINAL_REQUEST §R1 |
| F3 | JSON File Exporter | Generates and triggers browser download of `nachhilfe-backup-<date>.json` containing student roster and test session histories. | M1 | ORIGINAL_REQUEST §R1 |
| F4 | JSON File Importer & Parser | Reads uploaded file, parses JSON, handles malformed/corrupted files gracefully, and extracts valid payloads. | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Timestamp Conflict Resolution | Merges remote/imported student rosters using `updatedAt` LWW comparison, preserving newer edits and merging tag arrays. | M1 | ORIGINAL_REQUEST §R1, §AC1 |
| F6 | Session History Deduplication | Merges remote/imported session histories by `sessionId` with chronological descending sorting, ensuring zero loss of records. | M1 | ORIGINAL_REQUEST §R1, §AC1 |
| F7 | GitHub Gist REST Client | HTTP client supporting private Gist creation (`POST /gists`), retrieval (`GET /gists/:id`), update (`PATCH /gists/:id`), and PAT validation. | M2 | ORIGINAL_REQUEST §R2 |
| F8 | Secure Token & Config Storage | Secure storage of GitHub PAT and Gist ID in `localStorage['diagnostic_gist_config']` with token masking and sanitization. | M2 | ORIGINAL_REQUEST §R2 |
| F9 | Gist Push Operation | Serializes local roster and history into JSON and uploads/updates the private Gist on GitHub. | M2 | ORIGINAL_REQUEST §R2 |
| F10 | Gist Pull & Merge Operation | Fetches remote Gist JSON, validates schema, merges with local storage via `syncMerge`, and persists updated data. | M2 | ORIGINAL_REQUEST §R2 |
| F11 | Network Resilience & Error Handling | Maps network errors (401 invalid token, 403 rate limit, 404 not found, offline) to user-friendly messages without app crashes. | M2 | ORIGINAL_REQUEST §R2, §AC2 |
| F12 | Sync & Backup Modal (`SyncBackupModal`) | Accessible modal dialog with tabbed interface: JSON File Backup (Export/Import) and GitHub Gist Cloud Sync (Setup/Push/Pull). | M3 | ORIGINAL_REQUEST §R3 |
| F13 | Merge Preview & Confirmation UI | Displays summary of incoming vs existing students/sessions before applying import/pull changes. | M3 | ORIGINAL_REQUEST §R3 |
| F14 | Navigation & Switcher UI Integration | Triggers for Sync modal in Top Navigation bar (`Layout.tsx`), `StudentSwitcherModal.tsx` footer, and `Home.tsx` / `Dashboard.tsx`. | M3 | ORIGINAL_REQUEST §R3 |
| F15 | Accessibility & Theme Compliance | Keyboard navigation (Escape, Tab focus trapping), ARIA roles (`dialog`, `tablist`), dark mode & reduced sensory theme compatibility. | M3 | ORIGINAL_REQUEST §R3 |
| F16 | 100% E2E Test Suite & Adversarial Hardening | Comprehensive automated test suite passing 100% across Tiers 1-5 with zero regressions. | M4 | ORIGINAL_REQUEST §AC3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | JSON Data Portability & Merge Engine | F1, F2, F3, F4, F5, F6: Schema types, validation, export/import utilities, timestamp merge logic, unit tests. | none | PLANNED |
| M2 | GitHub Gist REST Client & Remote Sync Engine | F7, F8, F9, F10, F11: Gist HTTP client, PAT token management, Push/Pull sync orchestration, network error matrix, unit tests. | M1 | PLANNED |
| M3 | UI Integration, Modal & Accessibility | F12, F13, F14, F15: `SyncBackupModal`, merge preview, Layout & StudentSwitcher triggers, accessibility, integration tests. | M1, M2 | PLANNED |
| M4 | E2E Test Verification & Hardening | F16: Complete E2E test suite execution (Tiers 1-4) and adversarial coverage hardening (Tier 5). | M1, M2, M3 | PLANNED |

---

## Interface Contracts

### M1 ↔ M2 (Sync Types & Validation ↔ Gist Sync Engine)
```typescript
// src/types/sync.ts
export interface SyncMetadata {
  schemaVersion: number; // 1
  exportedAt: string; // ISO 8601
  appVersion?: string;
  sourceDevice?: string;
}

export interface SyncPayload {
  version: number; // 1
  metadata: SyncMetadata;
  data: {
    roster: StudentProfile[];
    history: TestSessionRecord[];
  };
}

export interface MergeResult {
  mergedRoster: StudentProfile[];
  mergedHistory: TestSessionRecord[];
  stats: {
    studentsAdded: number;
    studentsUpdated: number;
    studentsUnchanged: number;
    sessionsAdded: number;
    sessionsExisting: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: SyncPayload;
}
```

### M2 ↔ M3 (Gist Client & Sync Service ↔ UI Modal)
```typescript
// src/utils/gistSync.ts
export interface GistSyncConfig {
  pat: string;
  gistId: string;
  lastSyncedAt?: string;
  autoSyncOnTestComplete?: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  message: string;
  stats?: MergeResult['stats'];
  errorDetails?: string;
  gistId?: string;
  gistUrl?: string;
}

export function saveGistConfig(config: GistSyncConfig): void;
export function getGistConfig(): GistSyncConfig | null;
export function clearGistConfig(): void;
export async function pushToGist(config?: GistSyncConfig): Promise<SyncOperationResult>;
export async function pullFromGist(config?: GistSyncConfig): Promise<SyncOperationResult>;
export async function testGistConnection(pat: string, gistId?: string): Promise<{ success: boolean; message: string; gistId?: string }>;
```

### M1 ↔ M3 (Export/Import ↔ UI Modal)
```typescript
// src/utils/syncExportImport.ts
export function createExportPayload(): SyncPayload;
export function downloadBackupFile(payload?: SyncPayload): void;
export function parseAndValidateBackupFile(jsonString: string): ValidationResult;
export function applyImportPayload(payload: SyncPayload, mode: 'merge' | 'replace'): MergeResult;
```

---

## Code Layout
```
src/
├── types/
│   ├── student.ts               # Existing student types
│   ├── history.ts               # Existing history types
│   └── sync.ts                  # New: Sync payload, metadata, config, validation types
├── utils/
│   ├── studentRoster.ts         # Existing roster persistence & CRUD
│   ├── sessionHistory.ts        # Existing history persistence & CRUD
│   ├── syncValidation.ts        # New: Zero-dependency schema validator
│   ├── syncMerge.ts             # New: Deterministic timestamp & deduplication merge logic
│   ├── syncExportImport.ts      # New: File export/import and browser download helper
│   ├── gistClient.ts            # New: GitHub Gist REST API client
│   └── gistSync.ts              # New: Remote sync coordinator & token storage
├── components/
│   ├── Layout.tsx               # Top Nav bar (adds Cloud Sync button trigger)
│   ├── StudentSwitcherModal.tsx # Student Switcher (adds Sync & Backup button trigger)
│   ├── SyncBackupModal.tsx      # New: Tabbed Modal for JSON Backup & Gist Sync
│   └── MergePreviewDialog.tsx   # New: Preview and confirmation dialog for incoming changes
└── tests/
    ├── syncValidation.test.ts   # New: Tier 1 & 2 schema validation tests
    ├── syncMerge.test.ts        # New: Tier 1 & 2 merge & conflict resolution tests
    ├── gistClient.test.ts       # New: Tier 1 & 2 GitHub Gist REST API tests
    ├── syncExportImport.test.ts # New: Tier 1 & 2 JSON file export/import tests
    ├── SyncBackupModal.test.tsx # New: Tier 3 UI modal & accessibility integration tests
    └── e2eSyncScenarios.test.ts # New: Tier 4 Real-world multi-device sync journey tests
```
