# Milestone M1 — Investigation & Specification Report: Sync Types & Data Portability

**Author**: Explorer 1 (`explorer_1`)  
**Milestone**: M1 — JSON Data Portability & Merge Engine  
**Target File Analyzed**: `src/types/sync.ts` (and its interactions with `src/types/student.ts`, `src/types/history.ts`, `src/types/config.ts`, `src/utils/studentRoster.ts`, `src/utils/sessionHistory.ts`)  
**Date**: 2026-08-16  
**Status**: Completed & Verified  

---

## 1. Observation

Direct examination of existing codebase types, storage mechanisms, and interface contracts revealed the following findings:

### 1.1 Existing Student Profile Data Model (`src/types/student.ts`)
Lines 1–34 of `src/types/student.ts`:
```typescript
export type AccessibilityPreset = 'standard' | 'direct_reduced_sensory' | 'custom';

export interface AccessibilitySettings {
  preset: AccessibilityPreset;
  directQuestions: boolean; // Sachlich-direkte Fragestellungen ohne narrative/metaphorische Ausschmückung
  reducedSensory: boolean;  // Reizreduktion (keine störenden Animationen, ruhige UI)
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  preset: 'standard',
  directQuestions: false,
  reducedSensory: false,
};

export const DIRECT_REDUCED_SENSORY_SETTINGS: AccessibilitySettings = {
  preset: 'direct_reduced_sensory',
  directQuestions: true,
  reducedSensory: true,
};

export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: number | string;
  favoriteSubject: string;
  problemSubject: string;
  notes: string;
  hobbies?: string[];
  learningPreferences?: string[];
  customNotes?: string;
  accessibilitySettings?: AccessibilitySettings;
  createdAt: string;
  updatedAt: string;
}
```
- **Storage Location**: `localStorage.getItem('diagnostic_student_roster')` (`src/utils/studentRoster.ts:4`).
- **Key Characteristics**:
  - `id`: Unique identifier (e.g., `std_1723835000_abc12`).
  - `gradeLevel`: Can be `number` (e.g. `5`) or `string` (e.g. `"5"` or `"7. Klasse"`).
  - `updatedAt`: ISO 8601 string (`new Date().toISOString()`), essential for Last-Write-Wins (LWW) conflict resolution.
  - `hobbies` & `learningPreferences`: Optional string arrays (`string[]`), suitable for set union merging.
  - `accessibilitySettings`: Optional nested object.

### 1.2 Existing Session History Data Model (`src/types/history.ts`)
Lines 1–40 of `src/types/history.ts`:
```typescript
import type { AnswerRecord } from '../context/TestSessionContext';
import type { AccessibilitySettings } from './student';

export interface TopicBreakdownItem {
  topic: string;
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgTime: number; // in seconds
}

export interface CognitionStatsRecord {
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgReactionTime: number; // in ms
}

export interface TestSessionRecord {
  sessionId: string;
  studentId: string;
  studentName: string;
  date: string;
  subject: string;
  mathLevelReached: number;
  englishLevelReached: number;
  score: number; // e.g. total correct answers count
  totalQuestions: number;
  topicBreakdown: Record<string, TopicBreakdownItem> | TopicBreakdownItem[];
  cognitionStats?: CognitionStatsRecord | null;
  answers: AnswerRecord[];
  motivation?: number;
  favoriteSubject?: string;
  problemSubject?: string;
  notes?: string;
  interpretation?: string;
  durationSeconds?: number;
  markedQuestionIds?: string[];
  accessibilitySettings?: AccessibilitySettings;
}
```
- **Storage Location**: `localStorage.getItem('diagnostic_session_history')` (`src/utils/sessionHistory.ts:3`).
- **Key Characteristics**:
  - `sessionId`: Unique identifier (e.g., `sess_1723835000_xyz89`).
  - `studentId`: Foreign key reference to `StudentProfile.id`.
  - `date`: ISO 8601 timestamp representing when the test occurred.
  - `topicBreakdown`: Can be either a dictionary map `Record<string, TopicBreakdownItem>` or an array `TopicBreakdownItem[]`.
  - `answers`: Array of `AnswerRecord` items (from `src/context/TestSessionContext.tsx`).

### 1.3 Answer Record Model (`src/context/TestSessionContext.tsx`)
Lines 13–26 of `src/context/TestSessionContext.tsx`:
```typescript
export type Subject = 'math' | 'english' | 'cognition' | 'warmup';

export interface AnswerRecord {
  questionId: string;
  topic: string;
  subject: Subject;
  isCorrect: boolean;
  timeTaken: number;
  usedExtraTime: boolean;
  pointsEarned?: number;
  difficultyLevel?: number;
  reactionTime?: number;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string | string[];
}
```

### 1.4 Gist Configuration & Test Config Types (`src/types/config.ts`)
Lines 3–10 of `src/types/config.ts`:
```typescript
export type TopicMode = 'off' | 'optional' | 'forced';

export interface CustomTestConfig {
  subject: 'all' | 'math' | 'english' | 'cognition';
  startingLevel: number;
  maxDurationMinutes: number;
  topics: string[];
  topicModes?: Record<string, TopicMode>;
  questionTypes: ('multiple-choice' | 'input')[];
}
```

---

## 2. Logic Chain

From these direct observations, we derive the exact structural requirements for `src/types/sync.ts`:

1. **Schema Versioning**:
   - The system requires deterministic evolution. Defining `SYNC_SCHEMA_VERSION = 1` as a const and enforcing `schemaVersion: number` (value `1`) in `SyncMetadata` ensures forward compatibility.
   - For backwards compatibility with unversioned legacy exports, the validator can detect raw arrays (`StudentProfile[]`) or unversioned objects and upgrade them safely.

2. **Payload Structure Alignment (`PROJECT.md` vs `SCOPE.md`)**:
   - `PROJECT.md` § Interface Contracts defines `data: { roster: StudentProfile[]; history: TestSessionRecord[] }` and `version: number`.
   - `SCOPE.md` defines `data: { students: StudentProfile[]; sessions: SessionLog[]; quizResults?: QuizResult[]; appSettings?: Record<string, unknown> }`.
   - In `NachhilfeTest`, `StudentProfile` is the entity for students, and `TestSessionRecord` is the entity for both sessions and test/quiz histories.
   - **Resolution**: `SyncData` in `src/types/sync.ts` will support both `roster` (canonical in `PROJECT.md`) and `students` (alias), `history` (canonical in `PROJECT.md`) and `sessions` (alias), as well as `diagnostic_student_roster` / `diagnostic_session_history` (localStorage keys) and optional `appSettings` / `quizResults`. Type aliases `SessionLog = TestSessionRecord` and `QuizResult = TestSessionRecord` will be exported.

3. **Metadata Contract (`SyncMetadata`)**:
   - Must include:
     - `schemaVersion: number` (1)
     - `exportedAt: string` (ISO 8601 string)
     - `appVersion?: string` (e.g. `'1.0.0'`)
     - `clientVersion?: string` (compatibility synonym)
     - `sourceDevice?: string` (e.g. `'Laptop'`, `'Tablet'`, `'Chrome on Windows'`)
     - `deviceId?: string` (compatibility synonym)
     - `itemCount?: { students: number; sessions: number; quizResults?: number }` (summary counts)

4. **Merge Result & Conflict Resolution Contract (`MergeResult`)**:
   - Must return the merged entities:
     - `mergedRoster: StudentProfile[]`
     - `mergedHistory: TestSessionRecord[]`
     - Optional `mergedData?: SyncData` (for callers expecting `mergedData`)
   - Must provide detailed granular statistics (`stats`):
     - `studentsAdded: number`
     - `studentsUpdated: number`
     - `studentsUnchanged: number`
     - `studentsMerged: number` (total processed)
     - `sessionsAdded: number`
     - `sessionsExisting: number`
     - `sessionsSkipped: number`
     - `quizResultsAdded?: number`
     - `quizResultsSkipped?: number`
     - `conflictsResolved: number`
   - Must track individual conflict resolutions (`conflicts`):
     - Array of `ConflictRecord` with `entityType`, `entityId`, `resolution` (`'local' | 'remote' | 'merged'`), `reason`, and optional `timestamp`.

5. **Validation Result Contract (`ValidationResult`)**:
   - Must provide:
     - `isValid: boolean` (primary indicator)
     - `valid?: boolean` (getter or property alias for `isValid`)
     - `errors: string[]` (clear German validation error messages)
     - `warnings?: string[]` (non-fatal observations, e.g. legacy format upgraded, missing non-critical fields)
     - `payload?: SyncPayload` (sanitized and validated payload if valid)
     - `sanitizedPayload?: SyncPayload` (alias for `payload`)

6. **Cloud Sync & Remote Config Contracts (`GistSyncConfig`, `SyncOperationResult`)**:
   - Re-exporting or defining these interfaces in `src/types/sync.ts` enables Milestone M2 (`gistClient.ts`, `gistSync.ts`) and Milestone M3 (`SyncBackupModal.tsx`) to share a single, authoritative type source.

---

## 3. Caveats & Edge Cases

1. **Flexible `topicBreakdown` representations**:
   `TestSessionRecord.topicBreakdown` can be `Record<string, TopicBreakdownItem>` or `TopicBreakdownItem[]`. Runtime validation in `syncValidation.ts` must allow both representations.
2. **Grade level type polymorphism**:
   `StudentProfile.gradeLevel` can be `number` or `string`. Validation must accept numbers (e.g. `5`) or non-empty strings (e.g. `"5. Klasse"`).
3. **Timestamp formatting**:
   Timestamps (`createdAt`, `updatedAt`, `exportedAt`, `date`) must be validated against standard ISO 8601 formatting using `!isNaN(Date.parse(val))`.
4. **Prototype Pollution Protection**:
   JSON payloads containing dangerous keys (`__proto__`, `constructor`, `prototype`) must be detected and rejected during schema validation.
5. **Array Union for Profile Fields**:
   When merging two versions of a `StudentProfile`, `hobbies` and `learningPreferences` arrays should be merged via unique set union (`Array.from(new Set([...local, ...remote]))`).

---

## 4. Conclusion & Recommended `src/types/sync.ts` Specification

Below is the complete, cohesive TypeScript specification recommended for implementation in `src/types/sync.ts`:

```typescript
/**
 * src/types/sync.ts
 * Authoritative Type Definitions for Multi-Device Sync & Data Portability
 * Schema Version: 1
 */

import type { StudentProfile, AccessibilitySettings, AccessibilityPreset } from './student';
import type { TestSessionRecord, TopicBreakdownItem, CognitionStatsRecord } from './history';
import type { AnswerRecord } from '../context/TestSessionContext';
import type { CustomTestConfig } from './config';

// Re-export core types for downstream convenience
export type {
  StudentProfile,
  AccessibilitySettings,
  AccessibilityPreset,
  TestSessionRecord,
  TopicBreakdownItem,
  CognitionStatsRecord,
  AnswerRecord,
  CustomTestConfig,
};

// Schema Version Constant
export const SYNC_SCHEMA_VERSION = 1;

// Aliases for domain compatibility
export type SessionLog = TestSessionRecord;
export type QuizResult = TestSessionRecord;

/**
 * Metadata embedded within exported sync payloads
 */
export interface SyncMetadata {
  schemaVersion: number; // Must be 1 for current schema
  exportedAt: string; // ISO 8601 timestamp (e.g. 2026-08-16T19:20:00.000Z)
  appVersion?: string; // Application version (e.g. '1.0.0')
  clientVersion?: string; // Synonym for appVersion
  sourceDevice?: string; // User-friendly device descriptor (e.g. 'Laptop (Chrome)')
  deviceId?: string; // Optional unique device ID
  itemCount?: {
    students: number;
    sessions: number;
    quizResults?: number;
  };
}

/**
 * Core dataset holding student rosters and session histories
 */
export interface SyncData {
  roster: StudentProfile[];
  history: TestSessionRecord[];
  // Compatibility aliases
  students?: StudentProfile[];
  sessions?: TestSessionRecord[];
  diagnostic_student_roster?: StudentProfile[];
  diagnostic_session_history?: TestSessionRecord[];
  quizResults?: QuizResult[];
  appSettings?: Record<string, unknown>;
}

/**
 * Complete synchronized JSON file payload
 */
export interface SyncPayload {
  version?: number; // 1
  schemaVersion?: number; // 1
  metadata: SyncMetadata;
  data: SyncData;
}

/**
 * Single conflict resolution record detailing how a collision was resolved
 */
export interface ConflictRecord {
  entityType: 'student' | 'session' | 'quizResult' | 'settings';
  entityId: string;
  resolution: 'local' | 'remote' | 'merged';
  reason: string;
  timestamp?: string;
}

/**
 * Summary statistics of a merge operation
 */
export interface MergeStats {
  studentsAdded: number;
  studentsUpdated: number;
  studentsUnchanged: number;
  studentsMerged?: number;
  sessionsAdded: number;
  sessionsExisting: number;
  sessionsSkipped?: number;
  quizResultsAdded?: number;
  quizResultsSkipped?: number;
  conflictsResolved: number;
}

/**
 * Result returned by the merge engine (syncMerge.ts)
 */
export interface MergeResult {
  mergedRoster: StudentProfile[];
  mergedHistory: TestSessionRecord[];
  stats: MergeStats;
  conflicts: ConflictRecord[];
  mergedData?: SyncData;
}

/**
 * Result returned by the schema validator (syncValidation.ts)
 */
export interface ValidationResult {
  isValid: boolean;
  valid?: boolean; // Convenience alias
  errors: string[];
  warnings?: string[];
  payload?: SyncPayload;
  sanitizedPayload?: SyncPayload; // Convenience alias
}

/**
 * Import mode: 'merge' merges data non-destructively; 'replace' overwrites local storage
 */
export type ImportMode = 'merge' | 'replace';

/**
 * GitHub Gist Cloud Sync Configuration
 */
export interface GistSyncConfig {
  pat: string;
  gistId: string;
  lastSyncedAt?: string;
  autoSyncOnTestComplete?: boolean;
  username?: string;
  gistUrl?: string;
}

/**
 * Outcome of a Gist push, pull, or connection test operation
 */
export interface SyncOperationResult {
  success: boolean;
  message: string;
  stats?: MergeStats;
  errorDetails?: string;
  gistId?: string;
  gistUrl?: string;
  data?: SyncData;
}

/**
 * Options for file export
 */
export interface SyncExportOptions {
  appVersion?: string;
  sourceDevice?: string;
  deviceId?: string;
  pretty?: boolean;
}
```

---

## 5. Verification Method

To verify these types and their integration:
1. **Type Checker**:
   Run `npm run build` or `npx tsc --noEmit` to verify type compatibility across imports.
2. **Linter**:
   Run `npm run lint` (`oxlint`) to ensure zero lint warnings or export errors.
3. **Unit Tests**:
   Run `npm run test` (or `npx vitest run src/tests/syncValidation.test.ts src/tests/syncMerge.test.ts src/tests/syncExportImport.test.ts`) to ensure 100% test pass rate with 0 regressions across all 47 test suites.
