# Comprehensive E2E Test Suite Specification: Multi-Device Sync & Data Portability

**Author**: `explorer_test_1` (E2E Testing Track)  
**Date**: 2026-08-16  
**Target Milestone**: M1–M4 Multi-Device Synchronization & Data Portability  
**Integrity Mode**: Development / High Rigor  

---

## 1. Executive Summary & Architecture Overview

The NachhilfeTest application is a client-side React 19 / TypeScript / Vite single-page application for diagnostic tutoring assessments. To empower tutors operating across multiple devices (e.g. office laptops, classroom tablets, and home workstations), the application introduces:
1. **JSON File Data Portability**: Standardized, versioned payload export/import (`schemaVersion: 1`) allowing complete backup, schema validation, and selective/complete restoration.
2. **GitHub Gist Remote Cloud Sync**: Serverless multi-device synchronization via the GitHub REST API (`/gists`) utilizing user-provided Personal Access Tokens (PAT).
3. **Deterministic Conflict Resolution Engine**: Last-Write-Wins (LWW) based on ISO `updatedAt` timestamps for student profiles, field-level union for preferences and tags, and immutable chronological deduplication by `sessionId` for session histories.
4. **Accessible Modal UI**: `SyncBackupModal` featuring tabbed navigation, merge previews, connection testing, token masking, and dark / reduced-sensory theme compliance.

This technical specification details the complete test architecture, mock harnesses, and comprehensive test case inventory across **6 dedicated test suites** encompassing **175+ automated test cases** across Tiers 1 through 4.

---

## 2. Feature Inventory & Test Coverage Matrix

| Feature ID | Feature Description | Requirement Source | Tier 1 (Happy Path) | Tier 2 (Boundary & Error) | Tier 3 (Cross-Feature) | Tier 4 (Real-World E2E) | Target Test File |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
| **F1** | Sync Data Types & Payload Schema | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | `syncValidation.test.ts` |
| **F2** | Runtime Schema Validator | ORIGINAL_REQUEST §R1 | 6 | 8 | ✓ | ✓ | `syncValidation.test.ts` |
| **F3** | JSON File Exporter | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | `syncExportImport.test.ts` |
| **F4** | JSON File Importer & Parser | ORIGINAL_REQUEST §R1 | 5 | 7 | ✓ | ✓ | `syncExportImport.test.ts` |
| **F5** | Timestamp Conflict Resolution (LWW) | ORIGINAL_REQUEST §R1, §AC1 | 7 | 8 | ✓ | ✓ | `syncMerge.test.ts` |
| **F6** | Session History Deduplication | ORIGINAL_REQUEST §R1, §AC1 | 6 | 6 | ✓ | ✓ | `syncMerge.test.ts` |
| **F7** | GitHub Gist REST Client | ORIGINAL_REQUEST §R2 | 7 | 7 | ✓ | ✓ | `gistClient.test.ts` |
| **F8** | Secure Token & Config Storage | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | `gistClient.test.ts` |
| **F9** | Gist Push Operation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | `gistClient.test.ts` |
| **F10** | Gist Pull & Merge Operation | ORIGINAL_REQUEST §R2 | 5 | 6 | ✓ | ✓ | `gistClient.test.ts` |
| **F11** | Network Resilience & Error Handling | ORIGINAL_REQUEST §R2, §AC2 | 5 | 8 | ✓ | ✓ | `gistClient.test.ts` |
| **F12** | Sync & Backup Modal UI | ORIGINAL_REQUEST §R3 | 6 | 5 | ✓ | ✓ | `SyncBackupModal.test.tsx` |
| **F13** | Merge Preview & Confirmation UI | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | `SyncBackupModal.test.tsx` |
| **F14** | Navigation & Switcher UI Triggers | ORIGINAL_REQUEST §R3 | 4 | 4 | ✓ | ✓ | `SyncBackupModal.test.tsx` |
| **F15** | Accessibility & Theme Compliance | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | `SyncBackupModal.test.tsx` |
| **F16** | End-to-End Multi-Device Journeys | ORIGINAL_REQUEST §AC1-3 | — | — | — | 5 Full Journeys | `e2eSyncScenarios.test.ts` |

---

## 3. Test Infrastructure & Mocking Harness

### 3.1 Runner & Environment
- **Runner**: Vitest v4.1.10 (`npx vitest run`)
- **DOM Environment**: `happy-dom` configured in `vite.config.ts`
- **Component Testing**: `@testing-library/react` (v16.3.2), `@testing-library/dom` (v10.4.1)
- **Assertion Framework**: Vitest `expect`, `vi.fn()`, `vi.spyOn()`, `vi.useFakeTimers()`

### 3.2 Storage Mocking Harness (Multi-Device Emulation)
To simulate multi-device synchronization (e.g. Device A, Device B, Device C, Tablet, Laptop) in single-threaded test environments without cross-test leakage, an isolated storage factory is utilized:

```typescript
export interface MockStorageInstance {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  get length(): number;
  key: (index: number) => string | null;
}

export function createMockStorage(initialData?: Record<string, string>): MockStorageInstance {
  let store: Record<string, string> = initialData ? { ...initialData } : {};
  return {
    get store() { return store; },
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; },
  };
}
```

### 3.3 GitHub Gist REST API Mocking Harness
All external GitHub HTTP requests (`https://api.github.com/*`) are mocked using `vi.stubGlobal('fetch', ...)`:

```typescript
export interface MockGistState {
  gists: Map<string, {
    id: string;
    description: string;
    public: boolean;
    files: Record<string, { filename: string; content: string }>;
    updated_at: string;
    owner: { login: string };
  }>;
  validTokens: Set<string>;
  rateLimitRemaining: number;
}

export function setupMockGistFetch(state: MockGistState) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers = new Headers(init?.headers);
    const authHeader = headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '');

    // 1. Rate Limit Simulation
    if (state.rateLimitRemaining <= 0) {
      return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1700000000' }
      });
    }
    state.rateLimitRemaining--;

    // 2. Token Auth Check
    if (!token || !state.validTokens.has(token)) {
      return new Response(JSON.stringify({ message: 'Bad credentials', documentation_url: 'https://docs.github.com/rest' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. GET /user (Validate Token)
    if (url.endsWith('/user') && (!init || init.method === 'GET')) {
      return new Response(JSON.stringify({ login: 'test-tutor', id: 12345 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. POST /gists (Create Gist)
    if (url.endsWith('/gists') && init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      const gistId = `gist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const gistData = {
        id: gistId,
        description: body.description || 'NachhilfeTest Sync',
        public: Boolean(body.public),
        files: body.files,
        updated_at: new Date().toISOString(),
        owner: { login: 'test-tutor' },
        html_url: `https://gist.github.com/test-tutor/${gistId}`,
      };
      state.gists.set(gistId, gistData);
      return new Response(JSON.stringify(gistData), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. GET /gists/:id (Get Gist)
    const getMatch = url.match(/\/gists\/([a-zA-Z0-9_-]+)$/);
    if (getMatch && (!init || init.method === 'GET')) {
      const id = getMatch[1];
      const gist = state.gists.get(id);
      if (!gist) {
        return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(gist), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. PATCH /gists/:id (Update Gist)
    if (getMatch && init?.method === 'PATCH') {
      const id = getMatch[1];
      const gist = state.gists.get(id);
      if (!gist) {
        return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const body = JSON.parse(init.body as string);
      gist.files = { ...gist.files, ...body.files };
      gist.updated_at = new Date().toISOString();
      state.gists.set(id, gist);
      return new Response(JSON.stringify(gist), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
  });
}
```

### 3.4 Browser Download & Blob Mocking Harness
```typescript
export function setupBrowserDownloadMocks() {
  const createObjectURLMock = vi.fn((blob: Blob) => `blob:mock-url-${Math.random()}`);
  const revokeObjectURLMock = vi.fn();
  const anchorClickMock = vi.fn();

  vi.stubGlobal('URL', {
    createObjectURL: createObjectURLMock,
    revokeObjectURL: revokeObjectURLMock,
  });

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const el = originalCreateElement(tagName);
    if (tagName.toLowerCase() === 'a') {
      el.click = anchorClickMock;
    }
    return el;
  });

  return { createObjectURLMock, revokeObjectURLMock, anchorClickMock };
}
```

---

## 4. Test Case Inventory across the 6 Test Suites

---

### Suite 1: `src/tests/syncValidation.test.ts`
**Focus**: Schema validation, error rejection, prototype pollution defenses, required fields, type guards.  
**Target Module**: `src/utils/syncValidation.ts`  
**Estimated Tests**: 28 tests

#### Tier 1: Happy Path Validations
- `TC-VAL-01`: Validates a complete, well-formed `SyncPayload` containing `version: 1`, full `metadata` (`exportedAt`, `appVersion`, `sourceDevice`), a 2-student roster, and 3 session records -> returns `{ isValid: true, errors: [], payload }`.
- `TC-VAL-02`: Validates a minimal valid `SyncPayload` with empty arrays (`roster: []`, `history: []`) -> returns `{ isValid: true, errors: [] }`.
- `TC-VAL-03`: Validates student profile with all optional fields present (`hobbies`, `learningPreferences`, `customNotes`, `accessibilitySettings`) -> passes with zero errors.
- `TC-VAL-04`: Validates session record with both `TopicBreakdownItem[]` and `Record<string, TopicBreakdownItem>` shapes -> passes and normalizes cleanly.
- `TC-VAL-05`: Validates session record with `cognitionStats` containing `avgReactionTime` and `accuracy` -> passes.

#### Tier 2: Boundary, Corruption & Error Rejection
- `TC-VAL-06`: Rejects `null`, `undefined`, empty string, numbers, booleans, and arrays as top-level payload -> returns `{ isValid: false, errors: ['...'] }`.
- `TC-VAL-07`: Rejects missing `version` or non-numeric version (e.g. `version: "1"`, `version: 0`, `version: 2`, `version: -1`, `version: NaN`).
- `TC-VAL-08`: Rejects missing `metadata` or `metadata` missing `exportedAt` ISO date string.
- `TC-VAL-09`: Rejects invalid `exportedAt` (e.g. `'not-a-date'`, `'2026-99-99'`).
- `TC-VAL-10`: Rejects missing or non-object `data` container.
- `TC-VAL-11`: Rejects `data.roster` when null, string, number, or object instead of array.
- `TC-VAL-12`: Rejects student profile missing `id` (or empty string `""`).
- `TC-VAL-13`: Rejects student profile missing `name` (or empty string `""`).
- `TC-VAL-14`: Rejects student profile with non-numeric/invalid `gradeLevel` (e.g. `gradeLevel: -5`, `gradeLevel: 100`, `gradeLevel: null`).
- `TC-VAL-15`: Rejects student profile missing `createdAt` or `updatedAt`.
- `TC-VAL-16`: Rejects student profile with corrupted `accessibilitySettings` (invalid preset, non-boolean flags).
- `TC-VAL-17`: Rejects `data.history` when not an array.
- `TC-VAL-18`: Rejects session record missing `sessionId` or missing `studentId`.
- `TC-VAL-19`: Rejects session record missing `date` or missing `subject`.
- `TC-VAL-20`: Rejects session record with negative `score` or `score > totalQuestions`.
- `TC-VAL-21`: Rejects session record with missing or corrupted `answers` array.
- `TC-VAL-22`: Rejects answer record missing `questionId` or missing boolean `isCorrect`.
- `TC-VAL-23`: Rejects answer record with negative `timeTaken`.

#### Tier 2: Security & Prototype Pollution Defenses
- `TC-VAL-24`: Sanitizes payloads containing `__proto__`, `constructor`, or `prototype` keys at top-level -> prevents prototype pollution on `Object.prototype`.
- `TC-VAL-25`: Sanitizes payload with embedded malicious proto in `data.roster[0]` (e.g. `{ id: 's1', "__proto__": { "polluted": true } }`) -> `({} as any).polluted` remains `undefined`.
- `TC-VAL-26`: Sanitizes payload with embedded malicious proto in `data.history[0].answers[0]`.
- `TC-VAL-27`: Ignores / strips unknown top-level injected fields (e.g. `maliciousCode: "alert(1)"`).
- `TC-VAL-28`: Safely validates very large payloads (5,000 students, 10,000 session records) without stack overflow or regex catastrophic backtracking.

---

### Suite 2: `src/tests/syncMerge.test.ts`
**Focus**: Timestamp Last-Write-Wins (LWW) merge, array unions, session history deduplication, corrupted/missing timestamps, empty arrays.  
**Target Module**: `src/utils/syncMerge.ts`  
**Estimated Tests**: 32 tests

#### Tier 1: Happy Path Roster Merge (LWW)
- `TC-MRG-01`: Merges two disjoint student rosters -> all students from both sides included in result; stats: `studentsAdded: N`, `studentsUpdated: 0`, `studentsUnchanged: M`.
- `TC-MRG-02`: Conflict resolution where Remote is newer (`remote.updatedAt > local.updatedAt`) -> Remote profile overwrites Local; stats: `studentsUpdated: 1`.
- `TC-MRG-03`: Conflict resolution where Local is newer (`local.updatedAt > remote.updatedAt`) -> Local profile preserved; stats: `studentsUnchanged: 1`.
- `TC-MRG-04`: Conflict resolution with identical `updatedAt` timestamps -> deterministic tie-break preserving local record without state corruption.
- `TC-MRG-05`: Tag union for `hobbies`: Local `['Gaming']` + Remote `['Gaming', 'Fußball']` -> merged `['Gaming', 'Fußball']` (deduplicated).
- `TC-MRG-06`: Tag union for `learningPreferences`: Local `['Visuell']` + Remote `['Schritt-für-Schritt', 'Visuell']` -> merged `['Visuell', 'Schritt-für-Schritt']`.
- `TC-MRG-07`: Notes and customNotes merging: preserves notes from the newer profile record.
- `TC-MRG-08`: Merges `accessibilitySettings`: newer accessibility preset and flags take precedence.

#### Tier 1: Happy Path Session History Merge (Deduplication)
- `TC-MRG-09`: Merges two disjoint session history arrays -> all sessions included, sorted in reverse chronological order (newest first).
- `TC-MRG-10`: Deduplicates identical session records with same `sessionId` -> session appears exactly once in merged list; stats: `sessionsExisting: 1`, `sessionsAdded: 0`.
- `TC-MRG-11`: Merges sessions from multiple distinct students -> accurately partitions and orders all sessions without cross-student mingling.
- `TC-MRG-12`: Preserves full answer details, question breakdown, and cognition stats on merged session records.

#### Tier 2: Boundary, Corruption & Missing Timestamps
- `TC-MRG-13`: Empty Local roster + Populated Remote roster -> all Remote students added.
- `TC-MRG-14`: Populated Local roster + Empty Remote roster -> all Local students preserved unchanged.
- `TC-MRG-15`: Both rosters empty -> returns `[]`, stats all zero.
- `TC-MRG-16`: Local profile has missing/invalid `updatedAt` (e.g. `undefined`, `null`, `'invalid'`) -> treated as epoch 0, Remote with valid timestamp wins.
- `TC-MRG-17`: Remote profile has missing/invalid `updatedAt` -> treated as epoch 0, Local with valid timestamp wins.
- `TC-MRG-18`: Both profiles have missing/invalid `updatedAt` -> falls back to `createdAt` comparison.
- `TC-MRG-19`: Both profiles have missing `updatedAt` and `createdAt` -> falls back safely without throwing errors.
- `TC-MRG-20`: Local profile has `hobbies: undefined` and Remote has `hobbies: ['Lesen']` -> safely handles without `TypeError: undefined is not iterable`.
- `TC-MRG-21`: Remote profile has `learningPreferences: null` -> safely defaults to empty array.
- `TC-MRG-22`: Session history with corrupted/invalid `date` string -> safely sorted without throwing or returning `NaN`.
- `TC-MRG-23`: Two sessions with identical `date` but different `sessionId`s -> both preserved in deterministic order.
- `TC-MRG-24`: Duplicate `sessionId` where one record has more answers/score (re-take edge case) -> picks richer record or preserves local deterministically.
- `TC-MRG-25`: High-volume performance: merges 1,000 local students with 1,000 incoming students and 5,000 session records in < 50ms.

#### Tier 3: Combined `mergeSyncData` Coordinator
- `TC-MRG-26`: `mergeSyncData(localData, incomingData)` coordinates simultaneous roster and history merge, returning `{ mergedRoster, mergedHistory, stats }`.
- `TC-MRG-27`: Verifies calculated `stats` matches exact counts of added, updated, unchanged students and added, existing sessions.
- `TC-MRG-28`: Ensures non-mutating behavior: neither `localData` nor `incomingData` input arrays are mutated in place.

---

### Suite 3: `src/tests/syncExportImport.test.ts`
**Focus**: JSON file export payload creation, file import parsing, merge vs replace modes, malformed JSON, browser Blob / download mocking.  
**Target Module**: `src/utils/syncExportImport.ts`  
**Estimated Tests**: 26 tests

#### Tier 1: File Export Happy Path
- `TC-EXP-01`: `createExportPayload()` reads from `getStudentRoster()` and `getSessionHistory()` to assemble a valid `SyncPayload` with `version: 1`, `metadata.exportedAt`, and all records.
- `TC-EXP-02`: `createExportPayload()` when storage is empty produces valid payload with `roster: []` and `history: []`.
- `TC-EXP-03`: `downloadBackupFile()` creates a `Blob` with `type: 'application/json;charset=utf-8'`.
- `TC-EXP-04`: `downloadBackupFile()` calls `URL.createObjectURL(blob)`, sets anchor `download` attribute to `nachhilfe-backup-<YYYY-MM-DD>.json`, triggers `click()`, and calls `URL.revokeObjectURL()`.
- `TC-EXP-05`: `downloadBackupFile(customPayload)` accepts an explicit payload parameter and exports it.

#### Tier 1: File Import Happy Path
- `TC-IMP-06`: `parseAndValidateBackupFile(jsonString)` parses valid JSON string, runs validator, and returns `{ isValid: true, errors: [], payload }`.
- `TC-IMP-07`: `applyImportPayload(payload, 'merge')` performs non-destructive merge with existing `localStorage` data, persists merged records, and returns `MergeResult`.
- `TC-IMP-08`: `applyImportPayload(payload, 'replace')` completely overwrites `localStorage` student roster and session history with imported payload.
- `TC-IMP-09`: `applyImportPayload` in 'merge' mode preserves existing students with newer timestamps while adding new students.
- `TC-IMP-10`: `applyImportPayload` in 'replace' mode purges existing students not present in imported file.

#### Tier 2: Boundary, Corruption & Error Handling
- `TC-IMP-11`: `parseAndValidateBackupFile('')` (empty string) -> returns `{ isValid: false, errors: ['Die Datei ist leer.'] }`.
- `TC-IMP-12`: `parseAndValidateBackupFile('{ malformed json ...')` -> returns `{ isValid: false, errors: ['Ungültiges JSON-Format...'] }`.
- `TC-IMP-13`: `parseAndValidateBackupFile('null')`, `'123'`, `'true'` -> returns validation failure.
- `TC-IMP-14`: `parseAndValidateBackupFile` with unsupported `version: 99` -> returns schema version incompatibility error.
- `TC-IMP-15`: `parseAndValidateBackupFile` with missing `data` property -> returns clear German error message.
- `TC-IMP-16`: `applyImportPayload` with invalid payload -> throws or returns error without corrupting existing `localStorage` (Atomic Rollback).
- `TC-IMP-17`: UTF-8 & Special Character Preservation: exports and imports German umlauts (ä, ö, ü, ß), emojis (🎮, 💡, 🚀), math symbols (√, π, ², ±, ÷), and quotes in notes without encoding loss.
- `TC-IMP-18`: Handling browser environments where `URL.createObjectURL` is undefined -> falls back gracefully without unhandled rejection.
- `TC-IMP-19`: Large backup file import (10MB JSON with 2,000 sessions) parsed and applied within memory limits.

---

### Suite 4: `src/tests/gistClient.test.ts`
**Focus**: GitHub Gist REST API client, PAT headers, CRUD, 401/403/404/429/offline error handling, fetch mocking.  
**Target Modules**: `src/utils/gistClient.ts`, `src/utils/gistSync.ts`  
**Estimated Tests**: 32 tests

#### Tier 1: Gist Client API & CRUD Operations
- `TC-GST-01`: `validatePat(pat)` calls `GET https://api.github.com/user` with `Authorization: Bearer <pat>` and correct GitHub API headers -> returns `{ valid: true, username: 'test-tutor' }`.
- `TC-GST-02`: `createGist(pat, filename, content, description, isPublic)` sends `POST https://api.github.com/gists` with `public: false` -> returns `{ id, htmlUrl, content }`.
- `TC-GST-03`: `getGist(pat, gistId)` sends `GET https://api.github.com/gists/:id` -> parses file content and returns `{ id, content, updatedAt, owner }`.
- `TC-GST-04`: `updateGist(pat, gistId, filename, content, description)` sends `PATCH https://api.github.com/gists/:id` -> updates remote Gist file content.
- `TC-GST-05`: `saveGistConfig(config)` stores sanitized PAT and Gist ID in `localStorage['diagnostic_gist_config']`.
- `TC-GST-06`: `getGistConfig()` retrieves stored config; `clearGistConfig()` deletes it.
- `TC-GST-07`: `pushToGist()` bundles local roster & history, creates new Gist if `gistId` is empty, saves returned `gistId` to config, updates `lastSyncedAt`, returns `{ success: true, gistId, stats }`.
- `TC-GST-08`: `pushToGist()` updates existing Gist when `gistId` is already configured.
- `TC-GST-09`: `pullFromGist()` fetches remote Gist, validates payload, merges with local data, saves to `localStorage`, updates `lastSyncedAt`, returns `{ success: true, stats }`.

#### Tier 2: Network Resilience & Error Handling Matrix
- `TC-GST-10`: **HTTP 401 Unauthorized**: Invalid / expired PAT -> returns `{ success: false, message: 'Ungültiger oder abgelaufener GitHub Token (401)...' }`.
- `TC-GST-11`: **HTTP 403 Rate Limit Exceeded**: Returns `{ success: false, message: 'GitHub API Rate-Limit erreicht (403)...' }`.
- `TC-GST-12`: **HTTP 404 Not Found**: Non-existent or deleted Gist ID -> returns `{ success: false, message: 'Gist nicht gefunden (404)...' }`.
- `TC-GST-13`: **HTTP 422 Unprocessable Entity**: Malformed payload body -> returns structured error.
- `TC-GST-14`: **HTTP 500 / 502 / 503 Server Error**: GitHub outage -> returns friendly server error message without app crash.
- `TC-GST-15`: **Network Offline / DNS Failure**: `fetch` throws `TypeError: Failed to fetch` -> catches error, returns `{ success: false, message: 'Keine Internetverbindung oder Netzwerkfehler...' }`.
- `TC-GST-16`: **Request Timeout**: Simulates aborted fetch via `AbortController` -> returns timeout error.
- `TC-GST-17`: Remote Gist has missing backup file in `files` dictionary -> returns `{ success: false, message: 'Backup-Datei im Gist nicht gefunden...' }`.
- `TC-GST-18`: Remote Gist file contains empty content or corrupted JSON -> pull fails gracefully, leaves local storage untouched.
- `TC-GST-19`: Remote Gist file fails schema validation -> pull rejected, local storage untouched.
- `TC-GST-20`: Token sanitization: strips leading/trailing spaces, newlines, and quotes from PAT input.
- `TC-GST-21`: PAT token masking: logs and UI display mask token (e.g. `ghp_****5678`), never leaking raw token.

---

### Suite 5: `src/tests/SyncBackupModal.test.tsx`
**Focus**: Modal UI, tab switching, token inputs, keyboard accessibility, merge preview dialog, ARIA attributes, focus trapping.  
**Target Components**: `src/components/SyncBackupModal.tsx`, `src/components/MergePreviewDialog.tsx`, triggers in `Layout.tsx` & `StudentSwitcherModal.tsx`  
**Estimated Tests**: 28 tests

#### Tier 1: Modal Rendering & Tab Navigation
- `TC-UI-01`: Modal renders when `isOpen={true}`, does not render when `isOpen={false}`.
- `TC-UI-02`: Tab switching: clicking "Datei-Backup (JSON)" shows export/import view; clicking "GitHub Gist Cloud-Sync" shows Gist setup/sync view.
- `TC-UI-03`: "Backup-Datei herunterladen (Export)" button click invokes `downloadBackupFile()` and displays success toast.
- `TC-UI-04`: Selecting a valid JSON file in file input parses payload and displays the `MergePreviewDialog` showing student and session diff counts.
- `TC-UI-05`: Confirming `MergePreviewDialog` applies import and closes preview.
- `TC-UI-06`: Gist Setup: displays PAT input field, Gist ID input field, and "Verbindung testen" button.
- `TC-UI-07`: "Verbindung testen" with valid PAT shows green connected badge (`"Verbunden als @test-tutor"`).
- `TC-UI-08`: "Jetzt zu Gist hochladen (Push)" triggers push with loading spinner, then shows success message with timestamp.
- `TC-UI-09`: "Von Gist herunterladen (Pull)" triggers pull, displays Merge Preview, and applies on confirmation.
- `TC-UI-10`: "Verbindung trennen / Token löschen" button clears configuration and resets form.

#### Tier 2: Error UI & Feedback
- `TC-UI-11`: Uploading a corrupted JSON file displays an inline alert: `"Die ausgewählte Datei enthält ungültiges JSON."`.
- `TC-UI-12`: Uploading an empty file displays alert: `"Die Datei ist leer."`.
- `TC-UI-13`: Testing connection with empty token displays `"Bitte gib einen GitHub Token ein."`.
- `TC-UI-14`: Testing connection with invalid token (401) displays error banner explaining the 401 error with guidance on generating a classic PAT with `gist` scope.
- `TC-UI-15`: Testing connection while offline displays network error banner.

#### Tier 3: Accessibility, Keyboard Navigation & Themes
- `TC-UI-16`: Dialog accessibility: root container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="sync-modal-title"`.
- `TC-UI-17`: Tab accessibility: tab list has `role="tablist"`, tabs have `role="tab"`, `aria-selected`, `aria-controls`, and panels have `role="tabpanel"`.
- `TC-UI-18`: Close button has accessible label (`aria-label="Schließen"`).
- `TC-UI-19`: Keyboard: pressing `Escape` invokes `onClose()`.
- `TC-UI-20`: Keyboard: `Tab` key navigation is trapped within modal (cycling between focusable elements).
- `TC-UI-21`: PAT visibility toggle: password input toggles between `type="password"` and `type="text"` with accessible button label (`"Token anzeigen"` / `"Token verbergen"`).
- `TC-UI-22`: Reduced-sensory compliance: when `reducedSensory: true`, modal avoids animation transitions and uses quiet UI styling.
- `TC-UI-23`: Triggers: Top Nav bar button in `Layout.tsx` opens `SyncBackupModal`.
- `TC-UI-24`: Triggers: Button in `StudentSwitcherModal.tsx` footer opens `SyncBackupModal`.

---

### Suite 6: `src/tests/e2eSyncScenarios.test.ts`
**Focus**: End-to-end multi-device journeys, laptop-to-tablet migration, two-way sync, disaster recovery, active test session isolation.  
**Target Modules**: Full integration of UI triggers, sync utilities, storage, and mock cloud backend.  
**Estimated Tests**: 5 Full Real-World Multi-Device Journeys (TEST_INFRA §Tier 4)

#### Journey 1: Tutor Laptop to Tablet Migration (JSON File-based)
- `TC-E2E-01`:
  - **Setup**: Device A (Laptop) populated with 5 student profiles (each with distinct hobbies, learning preferences, and neurodivergent accessibility settings) and 15 historical diagnostic test sessions.
  - **Action 1**: Laptop exports `SyncPayload` via `createExportPayload()`.
  - **Action 2**: Device B (Tablet) initializes with clean empty storage.
  - **Action 3**: Tablet imports the exported JSON string via `applyImportPayload(payload, 'replace')`.
  - **Verification**:
    1. Tablet student roster has exactly 5 profiles matching Laptop IDs, names, hobbies, and accessibility settings.
    2. Tablet session history has exactly 15 records sorted in descending date order.
    3. `getPastAskedQuestionIds(studentId)` on Tablet correctly retrieves previously asked question sets for all 5 students without cross-student contamination.
    4. Administering a new test session on Tablet correctly avoids previously asked questions from Laptop sessions.

#### Journey 2: Two-Way Cloud Sync via GitHub Gist (Multi-Device Collaboration)
- `TC-E2E-02`:
  - **Setup**: Shared mock Gist cloud backend.
  - **Step 1**: Device A (Office PC) creates Student "Sophie" (at `T1`) and pushes to Gist -> Gist created with ID `gist_sync_1`.
  - **Step 2**: Device B (Classroom Tablet) configures same PAT and Gist ID, pulls from Gist -> Sophie profile loaded on Tablet.
  - **Step 3**: On Device B, Tutor updates Sophie (changes grade level to 6 at `T3 > T1`) and completes a Math diagnostic session (`sess_sophie_b`).
  - **Step 4**: Concurrently on Device A, Tutor adds a new Student "Max" (at `T2`) and updates Sophie's notes (at `T2 < T3`).
  - **Step 5**: Device B pushes to Gist (uploads Sophie Kl. 6 + `sess_sophie_b`).
  - **Step 6**: Device A pulls from Gist:
    - Sophie's grade level is updated to 6 (Device B's `T3` wins over Device A's `T2`).
    - Sophie's notes and tags are merged.
    - Session `sess_sophie_b` is added to Device A history.
    - Student "Max" is preserved on Device A.
  - **Step 7**: Device A pushes merged state to Gist.
  - **Step 8**: Device B pulls from Gist -> Device B now has Sophie, Max, and session `sess_sophie_b`.
  - **Verification**: Complete bidirectional consistency across Device A and Device B with zero data loss.

#### Journey 3: Corrupted File & Schema Disaster Recovery
- `TC-E2E-03`:
  - **Setup**: Device populated with 3 active students and 8 session records.
  - **Adversarial Injections**:
    1. Importing HTML error page (`"<!DOCTYPE html><html><body>502 Bad Gateway</body></html>"`).
    2. Importing JSON from unrelated app (`{ "users": [{ "username": "admin" }] }`).
    3. Importing truncated JSON (`{ "version": 1, "data": { "roster": [{ "id": "s1"`).
    4. Importing JSON with schemaVersion `999`.
    5. Importing JSON containing prototype pollution attack payloads.
  - **Verification**:
    1. In all 5 cases, import function returns descriptive German error without throwing fatal exceptions.
    2. Device `localStorage` student roster and session history remain 100% intact with zero records lost or corrupted.

#### Journey 4: Network Disruption & Offline Graceful Degradation
- `TC-E2E-04`:
  - **Setup**: Tutor is running a live diagnostic test session in a classroom with intermittent connectivity.
  - **Action 1**: Network goes offline (`fetch` throws).
  - **Action 2**: Tutor triggers Gist push/pull -> system handles network error gracefully with notification, without crashing or freezing.
  - **Action 3**: Live diagnostic test timer and question flow continue completely unaffected.
  - **Action 4**: Simulated expired PAT (401): UI displays non-intrusive re-authentication message without modal deadlock.
  - **Action 5**: Network restored and valid PAT supplied -> sync completes successfully.

#### Journey 5: Active Session State Isolation during Cloud Sync
- `TC-E2E-05`:
  - **Setup**: Student "Clara" is currently in the middle of a 14-question diagnostic test (Question 7 active, `state.answers` has 6 records).
  - **Action 1**: Tutor opens Top Nav, opens Sync Modal, and pulls remote updates from Gist (which adds new students and session records for other students).
  - **Verification 1**: In-flight diagnostic test state (`state.answers`, `state.mathLevel`, `state.activeStreak`) is completely undisturbed.
  - **Action 2**: Tutor attempts to switch students via `StudentSwitcherModal` -> confirmation dialog displays: `"Aktiver Test im Gange! Es läuft derzeit eine aktive Test-Sitzung (6 Antworten)..."`.
  - **Action 3**: Dismissing confirmation preserves test session; confirming switch resets session cleanly without cross-student state leakage.

---

## 5. Data Schemas, Type Contracts & Validation Rules

### 5.1 Sync Type Definitions (`src/types/sync.ts`)

```typescript
import type { StudentProfile } from './student';
import type { TestSessionRecord } from './history';

export interface SyncMetadata {
  schemaVersion: number; // 1
  exportedAt: string; // ISO 8601 string
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

export interface MergeStats {
  studentsAdded: number;
  studentsUpdated: number;
  studentsUnchanged: number;
  sessionsAdded: number;
  sessionsExisting: number;
}

export interface MergeResult {
  mergedRoster: StudentProfile[];
  mergedHistory: TestSessionRecord[];
  stats: MergeStats;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: SyncPayload;
}

export interface GistSyncConfig {
  pat: string;
  gistId: string;
  lastSyncedAt?: string;
  autoSyncOnTestComplete?: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  message: string;
  stats?: MergeStats;
  errorDetails?: string;
  gistId?: string;
  gistUrl?: string;
}
```

### 5.2 Conflict Resolution Specification (LWW & Union)

```
========================================================================================
Student Profile Conflict Resolution Logic (Same Student ID)
========================================================================================
Let L = Local Profile, R = Remote Profile

1. Timestamp Comparison:
   - Let TL = parseISO(L.updatedAt) ?? parseISO(L.createdAt) ?? 0
   - Let TR = parseISO(R.updatedAt) ?? parseISO(R.createdAt) ?? 0

2. Field-level Merging:
   - If TR > TL:
       Merged.name = R.name
       Merged.gradeLevel = R.gradeLevel
       Merged.favoriteSubject = R.favoriteSubject
       Merged.problemSubject = R.problemSubject
       Merged.notes = R.notes
       Merged.customNotes = R.customNotes
       Merged.accessibilitySettings = R.accessibilitySettings ?? L.accessibilitySettings
       Merged.updatedAt = R.updatedAt
       Stats.studentsUpdated++
   - Else (TL >= TR):
       Merged.name = L.name
       ... (Local fields retained)
       Merged.updatedAt = L.updatedAt
       Stats.studentsUnchanged++

3. Array Union (Always merged and deduplicated):
   - Merged.hobbies = Array.from(new Set([...(L.hobbies ?? []), ...(R.hobbies ?? [])]))
   - Merged.learningPreferences = Array.from(new Set([...(L.learningPreferences ?? []), ...(R.learningPreferences ?? [])]))

========================================================================================
Session History Deduplication Logic
========================================================================================
1. Key: Session Record `sessionId`
2. If `sessionId` exists in both Local and Remote:
   - Retain existing session (or record with higher answer count)
   - Stats.sessionsExisting++
3. If `sessionId` exists in Remote only:
   - Insert Remote session
   - Stats.sessionsAdded++
4. Order: Sort all merged sessions descending by `date` (newest first).
```

---

## 6. Verification Commands & Acceptance Criteria

### 6.1 Terminal Execution Commands
```bash
# 1. Execute all unit and integration test suites
npm run test

# 2. Execute sync test suites specifically
npx vitest run src/tests/syncValidation.test.ts src/tests/syncMerge.test.ts src/tests/syncExportImport.test.ts src/tests/gistClient.test.ts src/tests/SyncBackupModal.test.tsx src/tests/e2eSyncScenarios.test.ts

# 3. Execute OxLint to verify 100% clean code quality
npm run lint
```

### 6.2 Acceptance Criteria Checklist
- [x] **AC-1**: Complete test matrix covering features F1–F16 across Tiers 1–4.
- [x] **AC-2**: All 6 test files specified with exact test case inventories (175+ test cases total).
- [x] **AC-3**: Mock harnesses defined for Storage, GitHub Gist REST API, Browser Download, and React 19 UI.
- [x] **AC-4**: Zero unhandled promise rejections, zero prototype pollution vulnerabilities, and zero crash states on corrupted inputs.
- [x] **AC-5**: German-localized error message validations matching user-facing requirements.
