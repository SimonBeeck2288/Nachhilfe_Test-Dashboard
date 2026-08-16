# Handoff Report: Milestone M1 — JSON Data Portability & Merge Engine Analysis

**Agent**: Explorer 3 (`sub_orch_m1/explorer_3`)  
**Target Milestone**: M1 (JSON Data Portability & Merge Engine)  
**Modules Investigated**: `src/utils/syncMerge.ts`, `src/utils/syncExportImport.ts`, and M1 Test Strategy  
**Date**: 2026-08-16  

---

## 1. Observation

### Codebase & Storage Architecture
1. **Student Profiles (`src/types/student.ts:21-34`)**:
   - `StudentProfile` contains primary key `id: string`, scalar fields (`name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`, `customNotes`), array fields (`hobbies?: string[]`, `learningPreferences?: string[]`), nested object (`accessibilitySettings?: AccessibilitySettings`), and ISO timestamps (`createdAt: string`, `updatedAt: string`).
   - `src/utils/studentRoster.ts:4` defines `ROSTER_STORAGE_KEY = 'diagnostic_student_roster'`.
   - Existing storage reading in `studentRoster.ts:81-96` maps legacy profiles to full profiles providing defaults (`hobbies: []`, `learningPreferences: []`, `customNotes: ''`, `accessibilitySettings`).

2. **Session History Records (`src/types/history.ts:19-40`)**:
   - `TestSessionRecord` contains primary key `sessionId: string`, foreign key `studentId: string`, `studentName: string`, `date: string` (ISO timestamp), `subject: string`, score/accuracy metrics (`mathLevelReached`, `englishLevelReached`, `score`, `totalQuestions`, `topicBreakdown`, `cognitionStats`), `answers: AnswerRecord[]`, and optional qualitative fields (`motivation`, `notes`, `interpretation`, `markedQuestionIds`, `accessibilitySettings`).
   - `src/utils/sessionHistory.ts:3` defines `HISTORY_STORAGE_KEY = 'diagnostic_session_history'`.
   - In `sessionHistory.ts:84-86`, new sessions are prepended (`history.unshift(updatedRecord)`) so newer records appear first.

3. **Active Session & Other LocalStorage State (`src/context/TestSessionContext.tsx:122, 141`)**:
   - Active in-flight diagnostic sessions are saved under `localStorage['diagnosticSession']`.
   - Practice generator config is computed dynamically or cached.

4. **Testing Infrastructure (`TEST_INFRA.md:1-60`, `package.json`)**:
   - Vitest 4 with happy-dom environment is active (`npm run test` executes 47 test suites, 405 tests passing in 6.46s).
   - Milestone M1 requires dedicated unit and integration tests across 4 tiers:
     - `src/tests/syncMerge.test.ts`
     - `src/tests/syncExportImport.test.ts`
     - `src/tests/syncValidation.test.ts` (coordinated with Explorer 2)

---

## 2. Logic Chain

### 2.1 Deterministic Conflict Resolution (Last-Write-Wins on `updatedAt`)
- **Premise**: When merging student records from two different devices (or file imports), an identical `id` indicates the same entity edited independently.
- **Timestamp Comparison Logic**:
  1. Parse `local.updatedAt` and `remote.updatedAt` using `Date.parse()` or `new Date().getTime()`.
  2. If `remoteTime > localTime`: Remote wins for scalar fields (`name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`, `customNotes`, `accessibilitySettings`). `updatedAt` is updated to `remote.updatedAt`. Conflict recorded as `{ resolution: 'remote', reason: 'Remote updatedAt is newer' }`.
  3. If `localTime > remoteTime`: Local wins for scalar fields. `updatedAt` remains `local.updatedAt`. Conflict recorded as `{ resolution: 'local', reason: 'Local updatedAt is newer' }`.
  4. If `localTime === remoteTime` (or both timestamps are identical): Deterministic tie-breaker:
     - If all properties are identical, mark as `resolution: 'local'`, `reason: 'Identical records'`.
     - If properties differ with equal timestamps, preserve local scalar fields deterministically to avoid nondeterministic churn.
  5. Defensive timestamp handling: If one record has an invalid/missing date (NaN), the valid timestamp wins. If both are invalid, fallback to local.
  6. `createdAt` preservation: To ensure historical accuracy, `createdAt` should take the earliest valid timestamp: `min(Date.parse(local.createdAt), Date.parse(remote.createdAt))`.

### 2.2 Student Merging Rules & Field Synthesis
- **Scalar Fields**: Overwritten based on the LWW winner determined above.
- **Array Fields (`hobbies`, `learningPreferences`)**:
  - Rather than discarding additions from one device, array fields represent cumulative preferences.
  - Implement a **Case-Insensitive Set Union** that preserves the original casing and order of insertion:
    - Step 1: Iterate local array items; trim whitespace, ignore empty strings, add lowercase to `seen` set, push original trimmed string to `mergedArray`.
    - Step 2: Iterate remote array items; if lowercase version not in `seen` set, add to `seen` and push to `mergedArray`.
- **`accessibilitySettings`**:
  - Overwritten by the LWW winner. If either profile lacks `accessibilitySettings`, fallback gracefully to `DEFAULT_ACCESSIBILITY_SETTINGS`.
- **Topic Mastery / Accuracy Synthesis**:
  - In NachhilfeTest, topic accuracy is derived dynamically from session history. If individual profiles contain topic breakdown / mastery maps, merge by aggregating `total` and `correct` counts (`accuracy = correct / total`).

### 2.3 Session History Deduplication & Chronological Ordering
- **Premise**: Diagnostic test sessions are completed historical events. A session with a given `sessionId` is immutable.
- **Deduplication Algorithm**:
  1. Initialize an indexed map `Map<string, TestSessionRecord>`.
  2. Insert all `localHistory` records keyed by `record.sessionId`.
  3. Iterate over `remoteHistory` records:
     - If `record.sessionId` already exists in map: record as existing duplicate (`sessionsExisting++` / `sessionsSkipped++`).
     - If `record.sessionId` is new: insert into map (`sessionsAdded++`).
  4. Extract all values from the map into a merged array.
  5. Sort the merged array in **descending chronological order** (newest `date` first):
     ```typescript
     mergedHistory.sort((a, b) => {
       const timeA = new Date(a.date).getTime() || 0;
       const timeB = new Date(b.date).getTime() || 0;
       return timeB - timeA;
     });
     ```
  6. Return `{ mergedHistory, stats: { sessionsAdded, sessionsExisting } }`.

### 2.4 Export Mechanism (`src/utils/syncExportImport.ts`)
- **Payload Construction (`createExportPayload`)**:
  - Bundles current `getStudentRoster()` and `getSessionHistory()` into `SyncPayload`:
    ```typescript
    {
      version: 1,
      metadata: {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        appVersion: "1.0.0",
        clientVersion: "1.0.0",
        itemCount: { students: roster.length, sessions: history.length }
      },
      data: {
        roster: [...roster],
        history: [...history]
      }
    }
    ```
- **Browser & JSDOM/Node Download Compatibility (`downloadBackupFile`)**:
  - Serializes JSON with 2-space indentation.
  - Creates `Blob([jsonString], { type: 'application/json;charset=utf-8' })`.
  - Checks if `typeof document !== 'undefined'` and `typeof document.createElement === 'function'`.
  - Generates blob URL via `URL.createObjectURL(blob)` (or data URI fallback if `createObjectURL` is unavailable).
  - Creates invisible `<a download="nachhilfe-backup-YYYY-MM-DD.json">`, triggers `.click()`, and cleans up (`removeChild`, `revokeObjectURL`).
  - Returns `true` on success, `false` safely without throwing if DOM is absent.

### 2.5 Import Mechanism (`src/utils/syncExportImport.ts`)
- **Asynchronous File Reader (`readBackupFile`)**:
  - Uses modern `file.text()` when available; falls back to `FileReader.readAsText()`.
- **String Parsing & Schema Validation (`parseAndValidateBackupFile`)**:
  - `JSON.parse(jsonString)` inside `try/catch`. Catches malformed JSON syntax errors and returns descriptive German error message.
  - Delegates to `validateSyncPayload(parsed)` (from `syncValidation.ts`).
  - If validation fails, returns `{ isValid: false, errors: [...] }` without touching `localStorage`.
- **Import Application (`applyImportPayload`)**:
  - **Mode `'replace'`**:
    1. Calls `clearStudentRoster()` and `clearSessionHistory()`.
    2. Directly persists incoming `roster` and `history` to storage.
    3. Returns `MergeResult` reflecting all items added.
  - **Mode `'merge'`**:
    1. Loads current local roster and history.
    2. Executes `mergeSyncData(local, remote)`.
    3. Persists `mergedRoster` and `mergedHistory` to `localStorage`.
    4. Returns `MergeResult` with detailed `stats` and `conflicts`.

---

## 3. Caveats

1. **Storage Availability**:
   - `localStorage` may throw `QuotaExceededError` if the browser storage quota is reached (e.g. huge payloads with hundreds of sessions containing detailed answer snapshots). The import and export utilities must catch storage exceptions and return informative error states rather than crashing.
2. **Payload Aliases**:
   - `PROJECT.md` specifies `data.roster` and `data.history`, whereas some generic scopes mention `data.students` and `data.sessions`.
   - **Design Decision**: In `syncMerge.ts` and `syncExportImport.ts`, implement defensive property mapping supporting both `roster`/`students` and `history`/`sessions`.
3. **In-Flight Test Isolation**:
   - When an import occurs while a student is currently taking a test, `localStorage['diagnosticSession']` must not be wiped unless explicitly intended by the user.

---

## 4. Conclusion & Concrete Implementation Blueprint

### 4.1 Module Blueprint: `src/utils/syncMerge.ts`

```typescript
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type {
  SyncPayload,
  MergeResult,
  MergeStats,
  MergeConflict,
  StudentMergeResult,
  HistoryMergeResult,
} from '../types/sync';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../types/student';

export function mergeStringSets(localArr?: string[], remoteArr?: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (item: unknown) => {
    if (typeof item !== 'string') return;
    const trimmed = item.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  };

  if (Array.isArray(localArr)) localArr.forEach(add);
  if (Array.isArray(remoteArr)) remoteArr.forEach(add);
  return result;
}

export function mergeStudentProfiles(
  local: StudentProfile,
  remote: StudentProfile
): { merged: StudentProfile; conflict: MergeConflict; isUpdated: boolean } {
  const localTime = Date.parse(local.updatedAt) || 0;
  const remoteTime = Date.parse(remote.updatedAt) || 0;

  const mergedHobbies = mergeStringSets(local.hobbies, remote.hobbies);
  const mergedPrefs = mergeStringSets(local.learningPreferences, remote.learningPreferences);

  // Preserve oldest createdAt
  const localCreated = Date.parse(local.createdAt) || 0;
  const remoteCreated = Date.parse(remote.createdAt) || 0;
  const earliestCreated =
    localCreated && remoteCreated
      ? localCreated <= remoteCreated ? local.createdAt : remote.createdAt
      : local.createdAt || remote.createdAt || new Date().toISOString();

  if (remoteTime > localTime) {
    const merged: StudentProfile = {
      ...remote,
      createdAt: earliestCreated,
      hobbies: mergedHobbies,
      learningPreferences: mergedPrefs,
      accessibilitySettings: remote.accessibilitySettings || local.accessibilitySettings || { ...DEFAULT_ACCESSIBILITY_SETTINGS },
    };
    return {
      merged,
      conflict: {
        entityType: 'student',
        entityId: local.id,
        resolution: 'remote',
        reason: `Remote updatedAt (${remote.updatedAt}) is newer than local (${local.updatedAt})`,
      },
      isUpdated: true,
    };
  }

  // Local wins or tie-breaker
  const isTie = remoteTime === localTime;
  const merged: StudentProfile = {
    ...local,
    createdAt: earliestCreated,
    hobbies: mergedHobbies,
    learningPreferences: mergedPrefs,
    accessibilitySettings: local.accessibilitySettings || remote.accessibilitySettings || { ...DEFAULT_ACCESSIBILITY_SETTINGS },
  };

  return {
    merged,
    conflict: {
      entityType: 'student',
      entityId: local.id,
      resolution: 'local',
      reason: isTie
        ? 'Identical updatedAt timestamps; local profile preserved'
        : `Local updatedAt (${local.updatedAt}) is newer than remote (${remote.updatedAt})`,
    },
    isUpdated: false,
  };
}

export function mergeStudentRosters(
  localRoster: StudentProfile[] = [],
  remoteRoster: StudentProfile[] = []
): StudentMergeResult {
  const mergedMap = new Map<string, StudentProfile>();
  const conflicts: MergeConflict[] = [];
  let studentsAdded = 0;
  let studentsUpdated = 0;
  let studentsUnchanged = 0;

  localRoster.forEach((student) => {
    if (student && student.id) {
      mergedMap.set(student.id, { ...student });
    }
  });

  remoteRoster.forEach((remoteStudent) => {
    if (!remoteStudent || !remoteStudent.id) return;

    const existingLocal = mergedMap.get(remoteStudent.id);
    if (!existingLocal) {
      mergedMap.set(remoteStudent.id, { ...remoteStudent });
      studentsAdded++;
    } else {
      const { merged, conflict, isUpdated } = mergeStudentProfiles(existingLocal, remoteStudent);
      mergedMap.set(remoteStudent.id, merged);
      conflicts.push(conflict);
      if (isUpdated) studentsUpdated++;
      else studentsUnchanged++;
    }
  });

  return {
    mergedRoster: Array.from(mergedMap.values()),
    stats: { studentsAdded, studentsUpdated, studentsUnchanged },
    conflicts,
  };
}

export function mergeSessionHistories(
  localHistory: TestSessionRecord[] = [],
  remoteHistory: TestSessionRecord[] = []
): HistoryMergeResult {
  const sessionMap = new Map<string, TestSessionRecord>();
  let sessionsAdded = 0;
  let sessionsExisting = 0;

  localHistory.forEach((session) => {
    if (session && session.sessionId) {
      sessionMap.set(session.sessionId, { ...session });
    }
  });

  remoteHistory.forEach((remoteSession) => {
    if (!remoteSession || !remoteSession.sessionId) return;
    if (sessionMap.has(remoteSession.sessionId)) {
      sessionsExisting++;
    } else {
      sessionMap.set(remoteSession.sessionId, { ...remoteSession });
      sessionsAdded++;
    }
  });

  const mergedHistory = Array.from(sessionMap.values()).sort((a, b) => {
    const timeA = Date.parse(a.date) || 0;
    const timeB = Date.parse(b.date) || 0;
    return timeB - timeA;
  });

  return {
    mergedHistory,
    stats: { sessionsAdded, sessionsExisting },
  };
}

export function mergeSyncData(
  local: { roster?: StudentProfile[]; history?: TestSessionRecord[]; students?: StudentProfile[]; sessions?: TestSessionRecord[] },
  remote: { roster?: StudentProfile[]; history?: TestSessionRecord[]; students?: StudentProfile[]; sessions?: TestSessionRecord[] }
): MergeResult {
  const localRoster = local.roster || local.students || [];
  const remoteRoster = remote.roster || remote.students || [];
  const localHistory = local.history || local.sessions || [];
  const remoteHistory = remote.history || remote.sessions || [];

  const rosterRes = mergeStudentRosters(localRoster, remoteRoster);
  const historyRes = mergeSessionHistories(localHistory, remoteHistory);

  return {
    mergedRoster: rosterRes.mergedRoster,
    mergedHistory: historyRes.mergedHistory,
    stats: {
      studentsAdded: rosterRes.stats.studentsAdded,
      studentsUpdated: rosterRes.stats.studentsUpdated,
      studentsUnchanged: rosterRes.stats.studentsUnchanged,
      sessionsAdded: historyRes.stats.sessionsAdded,
      sessionsExisting: historyRes.stats.sessionsExisting,
      conflictsResolved: rosterRes.conflicts.length,
    },
    conflicts: rosterRes.conflicts,
  };
}
```

### 4.2 Module Blueprint: `src/utils/syncExportImport.ts`

```typescript
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type { SyncPayload, MergeResult, ValidationResult } from '../types/sync';
import { getStudentRoster, clearStudentRoster } from './studentRoster';
import { getSessionHistory, clearSessionHistory } from './sessionHistory';
import { validateSyncPayload } from './syncValidation';
import { mergeSyncData } from './syncMerge';

export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0';

export function createExportPayload(customData?: {
  roster?: StudentProfile[];
  history?: TestSessionRecord[];
  students?: StudentProfile[];
  sessions?: TestSessionRecord[];
}): SyncPayload {
  const roster = customData?.roster || customData?.students || getStudentRoster();
  const history = customData?.history || customData?.sessions || getSessionHistory();

  return {
    version: CURRENT_SCHEMA_VERSION,
    metadata: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      clientVersion: APP_VERSION,
      itemCount: {
        students: roster.length,
        sessions: history.length,
      },
    },
    data: {
      roster: [...roster],
      history: [...history],
    },
  };
}

export function downloadBackupFile(payload?: SyncPayload, filename?: string): boolean {
  try {
    const data = payload || createExportPayload();
    const jsonString = JSON.stringify(data, null, 2);

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const defaultFilename = `nachhilfe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const targetFilename = filename || defaultFilename;

      const url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);

      const a = document.createElement('a');
      a.href = url;
      a.download = targetFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to download backup file:', error);
    return false;
  }
}

export async function readBackupFile(file: File | Blob): Promise<string> {
  if (typeof file.text === 'function') {
    return await file.text();
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Sicherungsdatei.'));
    reader.readAsText(file);
  });
}

export function parseAndValidateBackupFile(jsonString: string): ValidationResult {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    return {
      isValid: false,
      errors: ['Die angegebene Datei ist leer.'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Ungültiges JSON-Format: ${err?.message || 'Syntaxfehler'}`],
    };
  }

  return validateSyncPayload(parsed);
}

export function applyImportPayload(
  payload: SyncPayload,
  mode: 'merge' | 'replace'
): MergeResult {
  const incomingRoster: StudentProfile[] = payload.data?.roster || (payload.data as any)?.students || [];
  const incomingHistory: TestSessionRecord[] = payload.data?.history || (payload.data as any)?.sessions || [];

  if (mode === 'replace') {
    clearStudentRoster();
    clearSessionHistory();

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('diagnostic_student_roster', JSON.stringify(incomingRoster));
        localStorage.setItem('diagnostic_session_history', JSON.stringify(incomingHistory));
      } catch (err) {
        console.error('Failed to persist replaced payload to localStorage:', err);
      }
    }

    return {
      mergedRoster: incomingRoster,
      mergedHistory: incomingHistory,
      stats: {
        studentsAdded: incomingRoster.length,
        studentsUpdated: 0,
        studentsUnchanged: 0,
        sessionsAdded: incomingHistory.length,
        sessionsExisting: 0,
        conflictsResolved: 0,
      },
      conflicts: [],
    };
  }

  // mode === 'merge'
  const currentRoster = getStudentRoster();
  const currentHistory = getSessionHistory();

  const mergeResult = mergeSyncData(
    { roster: currentRoster, history: currentHistory },
    { roster: incomingRoster, history: incomingHistory }
  );

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('diagnostic_student_roster', JSON.stringify(mergeResult.mergedRoster));
      localStorage.setItem('diagnostic_session_history', JSON.stringify(mergeResult.mergedHistory));
    } catch (err) {
      console.error('Failed to persist merged payload to localStorage:', err);
    }
  }

  return mergeResult;
}
```

### 4.3 4-Tier Test Matrix for M1

| Tier | Focus | Test Files | Target Cases | Key Validations |
|---|---|---|:---:|---|
| **Tier 1** | Happy Path & Schema Contracts | `syncMerge.test.ts`, `syncExportImport.test.ts` | 20+ | LWW winner election, string array union, session deduplication, descending chronological order, export structure, replace/merge application. |
| **Tier 2** | Boundary, Conflict & Error Cases | `syncMerge.test.ts`, `syncExportImport.test.ts` | 20+ | Equal timestamp tie-breakers, malformed/invalid ISO dates, empty rosters/histories, missing optional fields, whitespace/case deduplication, non-DOM download fallback, storage quota handling. |
| **Tier 3** | Cross-Feature Combinations | `syncExportImport.test.ts` | 15+ | Export -> mutate -> merge round-tripping, accessibility settings retention across devices, session history queryability after merge, multi-student mixed delta updates. |
| **Tier 4** | Real-World Scenarios | `syncExportImport.test.ts` | 5+ | Laptop to Tablet Migration, collaborative offline tutoring reconciliation, corrupted file rejection with zero state damage, active in-flight session preservation. |

---

## 5. Verification Method

To independently verify these findings and test specifications:

1. **Verify Existing Tests**:
   - Run `npm run test` (or `npx vitest run`) to confirm existing 405 tests pass cleanly.
2. **Inspect Model Definitions**:
   - `src/types/student.ts` (lines 21-34) for `StudentProfile` definition.
   - `src/types/history.ts` (lines 19-40) for `TestSessionRecord` definition.
   - `src/utils/studentRoster.ts` (lines 64-103) for roster reading and defaults.
   - `src/utils/sessionHistory.ts` (lines 33-57, 84-86) for session history persistence and ordering.
3. **Invalidation Conditions**:
   - If `StudentProfile` or `TestSessionRecord` definitions change to use non-ISO date formats or different primary keys, the conflict resolution and deduplication logic must be adjusted accordingly.
