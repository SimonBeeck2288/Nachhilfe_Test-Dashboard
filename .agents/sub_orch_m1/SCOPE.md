# Scope: Milestone M1 — JSON Data Portability & Merge Engine

## Architecture
- Target files:
  - `src/types/sync.ts` — TypeScript type definitions (`SyncMetadata`, `SyncPayload`, `MergeResult`, `ValidationResult`, `StudentProfile`, `TopicMastery`, `SessionLog`, `QuizResult`, `AppData`, etc.)
  - `src/utils/syncValidation.ts` — Runtime validation without external dependencies, prototype pollution defense, field-level error messages
  - `src/utils/syncMerge.ts` — Deterministic merge algorithm (LWW via ISO-8601 `updatedAt`, array union for string sets, session deduplication by `sessionId`)
  - `src/utils/syncExportImport.ts` — Export serialization & download helper, file reading/parsing, mode-based import applicator ('merge' | 'replace')
  - `src/tests/sync.test.ts` (or module-specific tests) — Exhaustive unit tests for validation, merge, export, import

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Standardized JSON Schema | `schemaVersion: 1`, metadata (exportedAt, clientVersion, deviceId), structured payload | M1 | PROJECT.md |
| F2 | Runtime Schema Validator | Zero-dependency validator, type & structure validation, prototype pollution defense, descriptive errors | M1 | PROJECT.md |
| F3 | Deterministic LWW Merge | Conflict resolution using `updatedAt` timestamps at entity level | M1 | PROJECT.md |
| F4 | Array Union Merge | Union merge without duplicates for preferences/hobbies | M1 | PROJECT.md |
| F5 | Session History Merge | Deduplicated chronological merge by `sessionId` | M1 | PROJECT.md |
| F6 | Export/Import Utilities | JSON formatting, browser download trigger, file parsing, replace/merge application | M1 | PROJECT.md |

## Interface Contracts
### `src/types/sync.ts`
```typescript
export interface SyncMetadata {
  schemaVersion: number;
  exportedAt: string; // ISO 8601
  clientVersion: string;
  deviceId?: string;
  itemCount: {
    students: number;
    sessions: number;
    quizResults: number;
  };
}

export interface SyncPayload {
  metadata: SyncMetadata;
  data: {
    students: StudentProfile[];
    sessions: SessionLog[];
    quizResults: QuizResult[];
    appSettings?: Record<string, unknown>;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  sanitizedPayload?: SyncPayload;
}

export interface MergeResult {
  mergedData: SyncPayload['data'];
  stats: {
    studentsMerged: number;
    studentsAdded: number;
    studentsUpdated: number;
    sessionsAdded: number;
    sessionsSkipped: number;
    quizResultsAdded: number;
    quizResultsSkipped: number;
    conflictsResolved: number;
  };
  conflicts: Array<{
    entityType: 'student' | 'session' | 'quizResult' | 'settings';
    entityId: string;
    resolution: 'local' | 'remote' | 'merged';
    reason: string;
  }>;
}
```

### `src/utils/syncValidation.ts`
- `validateSyncPayload(raw: unknown): ValidationResult`
- Deep validation of metadata and data arrays
- Prototype pollution protection (`__proto__`, `constructor`, `prototype` keys rejected or sanitized)
- Boundary checks for required fields, valid dates, type safety

### `src/utils/syncMerge.ts`
- `mergeSyncData(local: SyncPayload['data'], remote: SyncPayload['data']): MergeResult`
- Entity matching by ID (`id` for students, `sessionId` for sessions, `id`/`quizId` for quiz results)
- LWW strategy: higher/newer `updatedAt` wins
- Preferences & hobbies: union of unique strings
- Sessions: deduplicate by `sessionId`, sort chronologically

### `src/utils/syncExportImport.ts`
- `createSyncPayload(data: SyncPayload['data'], clientVersion?: string, deviceId?: string): SyncPayload`
- `exportToFile(payload: SyncPayload, filename?: string): void`
- `importFromFile(file: File): Promise<SyncPayload>`
- `applyImport(currentData: SyncPayload['data'], importedPayload: SyncPayload, mode: 'merge' | 'replace'): { data: SyncPayload['data']; mergeResult?: MergeResult }`

## Code Layout
- `src/types/sync.ts`
- `src/utils/syncValidation.ts`
- `src/utils/syncMerge.ts`
- `src/utils/syncExportImport.ts`
- `src/tests/syncValidation.test.ts`
- `src/tests/syncMerge.test.ts`
- `src/tests/syncExportImport.test.ts`
