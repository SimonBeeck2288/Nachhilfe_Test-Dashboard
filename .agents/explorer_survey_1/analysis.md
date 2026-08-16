# Codebase Architecture Analysis: Student Roster, Session History, Schema & Reactivity

**Date**: 2026-08-16  
**Investigator**: explorer_survey_1  
**Project**: NachhilfeTest (Multi-Device Synchronization Survey)

---

## Executive Summary
This analysis investigates the storage architecture, data models, persistence layers, validation/migration mechanisms, and state reactivity in `NachhilfeTest` in preparation for implementing multi-device synchronization (JSON File Export/Import and GitHub Gist sync).

The application is a pure client-side Single Page Application (React 19 + TypeScript + Vite) using browser `localStorage` as its primary persistent store. It currently maintains two persistent collections (`diagnostic_student_roster` and `diagnostic_session_history`) and one active session state cache (`diagnosticSession`). There is currently no explicit schema versioning header in localStorage, relying instead on runtime defensive default mapping during deserialization.

---

## 1. Student Roster Storage & Management

### 1.1 Types & Data Schema (`src/types/student.ts`)
```typescript
export type AccessibilityPreset = 'standard' | 'direct_reduced_sensory' | 'custom';

export interface AccessibilitySettings {
  preset: AccessibilityPreset;
  directQuestions: boolean; // Sachlich-direkte Fragestellungen ohne narrative Ausschmückung
  reducedSensory: boolean;  // Reizreduktion (keine störenden Animationen, ruhige UI)
}

export interface StudentProfile {
  id: string;                               // e.g. "std_1723838491023_a9b1c"
  name: string;                             // e.g. "Max Mustermann"
  gradeLevel: number | string;              // e.g. 5, 7, "7"
  favoriteSubject: string;                  // e.g. "Mathematik"
  problemSubject: string;                   // e.g. "Englisch"
  notes: string;                            // Educator / diagnostic notes
  hobbies?: string[];                       // e.g. ["Gaming", "Minecraft"]
  learningPreferences?: string[];           // e.g. ["Visuell", "Schritt-für-Schritt"]
  customNotes?: string;                     // Individual AI tutor instructions
  accessibilitySettings?: AccessibilitySettings;
  createdAt: string;                        // ISO 8601 string
  updatedAt: string;                        // ISO 8601 string
}
```

### 1.2 Storage Implementation (`src/utils/studentRoster.ts`)
- **Storage Key**: `'diagnostic_student_roster'`
- **In-Memory Fallback**: `let memoryRoster: StudentProfile[] = [];` to support SSR or environments with disabled/unavailable localStorage.
- **Availability Check**: `isStorageAvailable(storage?: Storage | null): boolean` performs a probe write/remove with key `'__storage_test__'`.
- **ID Generation**: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
- **CRUD Operations**:
  - `getStudentRoster(): StudentProfile[]`: Reads string from localStorage, parses JSON, checks `Array.isArray`, and maps every profile filling in defaults for legacy records (e.g. `gradeLevel ?? 5`, `hobbies ?? []`, `learningPreferences ?? []`, `customNotes ?? ''`, `accessibilitySettings: getAccessibilitySettings(student)`, `createdAt`/`updatedAt` fallback to `new Date().toISOString()`).
  - `getStudentById(id: string): StudentProfile | undefined`
  - `saveStudentProfile(data)`: Upserts a student profile. If an `id` is provided and found, updates fields and sets `updatedAt = new Date().toISOString()`. If not found, assigns a new ID, sets `createdAt` and `updatedAt` to now, appends to roster, and writes `JSON.stringify(roster)` to localStorage.
  - `updateStudentProfile(id: string, updates: Partial<Omit<StudentProfile, 'id' | 'createdAt'>>)`: Merges updates, updates `updatedAt`, and writes to storage.
  - `deleteStudentProfile(id: string): boolean`: Filters out the student and writes back.
  - `clearStudentRoster(): void`: Clears memory array and removes key from storage.

---

## 2. Session History Storage & Management

### 2.1 Types & Data Schema (`src/types/history.ts`)
```typescript
export interface TopicBreakdownItem {
  topic: string;
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgTime: number;  // in seconds
}

export interface CognitionStatsRecord {
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgReactionTime: number; // in ms
}

export interface TestSessionRecord {
  sessionId: string;                        // e.g. "sess_1723838491023_x7y2z"
  studentId: string;                        // Foreign key to StudentProfile.id, or "guest"
  studentName: string;                      // Student name at test time
  date: string;                             // ISO 8601 timestamp
  subject: string;                          // e.g. "Mathematik & Englisch", "math", "english"
  mathLevelReached: number;                 // 1 - 7
  englishLevelReached: number;              // 1 - 7
  score: number;                            // Total correct answers
  totalQuestions: number;                   // Total answers recorded
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

### 2.2 Storage Implementation (`src/utils/sessionHistory.ts`)
- **Storage Key**: `'diagnostic_session_history'`
- **In-Memory Fallback**: `let memoryHistory: TestSessionRecord[] = [];`
- **ID Generation**: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
- **Sorting Order**: `saveSessionRecord` prepends new sessions (`history.unshift(updatedRecord)`) so that `getSessionHistory()` returns the newest sessions first.
- **Operations**:
  - `getSessionHistory(): TestSessionRecord[]`: Returns parsed array.
  - `getSessionById(sessionId: string): TestSessionRecord | undefined`
  - `getSessionsByStudentId(studentId: string): TestSessionRecord[]`: Filters history where `record.studentId === studentId`.
  - `saveSessionRecord(record: TestSessionRecord): TestSessionRecord`: Inserts or updates a session record and persists to localStorage.
  - `deleteSessionRecord(sessionId: string): boolean`: Removes a session record by `sessionId`.
  - `clearSessionHistory(): void`: Removes storage key and resets memory array.
  - `getPastAskedQuestionIds(studentId?: string): Set<string>`: Queries the last 10 sessions for a student and aggregates asked `questionId`s to prevent question repetition.

### 2.3 Consumption & Aggregations
- **Dashboard (`src/pages/Dashboard.tsx`)**:
  - Automatically invokes `saveSessionToHistory()` on mount if answers exist.
  - Lists sessions in a searchable table with filtering by `searchTerm` (matching student name or subject).
  - Supplies filtered sessions to three SVG analytics visualization components:
    - `<ProgressionChart sessions={selectedSessions} />`: Level progression over time.
    - `<TopicAccuracyChart sessions={selectedSessions} />`: Topic-level strength/weakness accuracy.
    - `<CognitionTrendChart sessions={selectedSessions} />`: Reaction time and cognitive speed trends.
  - Provides PDF print generation (`<DiagnosticReportPrint />`) and individual session review drilldown modal.

---

## 3. Schema Versioning, Validation, and Migrations

### 3.1 Current Schema State
- **No Explicit Schema Version in Storage**: Currently, the raw JSON stored in `localStorage` under `'diagnostic_student_roster'` and `'diagnostic_session_history'` is a top-level array of records (`StudentProfile[]` and `TestSessionRecord[]`). There is no outer envelope with version metadata.
- **Runtime Defensive Migration**:
  - When loading from storage, `getStudentRoster()` defensive mapping accommodates older data formats (e.g., profiles without `hobbies`, `learningPreferences`, `customNotes`, or `accessibilitySettings`).
  - `TestSessionContext` accommodates legacy sessions without `accessibilitySettings` by defaulting to `DEFAULT_ACCESSIBILITY_SETTINGS`.
- **Validation Depth**:
  - Handled via simple type assertions and JSON try/catch blocks. Malformed JSON defaults to empty array without throwing.

### 3.2 Required Schema for Sync & Export/Import
To fulfill R1 (JSON export/import) and R2 (GitHub Gist sync), a formal payload contract is required:
```typescript
export interface DiagnosticExportPayload {
  schemaVersion: number;                    // e.g. 1
  exportedAt: string;                      // ISO 8601 timestamp
  appVersion?: string;
  source?: string;                         // e.g. "NachhilfeTest"
  data: {
    roster: StudentProfile[];
    history: TestSessionRecord[];
  };
}
```

### 3.3 Conflict Resolution & Merge Strategy
1. **Student Profiles Merge Strategy**:
   - Primary identifier: `student.id` (string).
   - If ID matches between incoming and local profile:
     - Compare `updatedAt` timestamps (ISO 8601).
     - The profile with the more recent `updatedAt` wins.
     - Fallback if `updatedAt` is identical or missing: merge fields (preserve non-empty values).
   - If ID exists only in incoming: append new profile to local roster.
   - If ID exists only in local: retain local profile.
2. **Session History Merge Strategy**:
   - Primary identifier: `record.sessionId` (string).
   - Deduplicate records by `sessionId`.
   - For records with matching `sessionId`: retain the existing or incoming record (they are immutable session logs).
   - Merge all unique sessions and sort by `date` descending (newest first).

---

## 4. State Reactivity & Data Flow Architecture

### 4.1 React State & Context Flow
```
                     +----------------------------------------+
                     |         TestSessionContext             |
                     |  - state (TestSessionState)            |
                     |  - currentStudent: StudentProfile|null |
                     |  - saves to 'diagnosticSession'        |
                     +-------------------+--------------------+
                                         |
            +----------------------------+----------------------------+
            |                            |                            |
            v                            v                            v
   +-----------------+          +-----------------+          +-----------------+
   |    Layout       |          |      Home       |          |    Dashboard    |
   | - StudentHeader |          | - Roster Cards  |          | - Current Eval  |
   | - SwitcherModal |          | - Start Test    |          | - Analytics     |
   | - Navigation    |          | - Quick Modals  |          | - Session List  |
   +-----------------+          +-----------------+          +-----------------+
            |                            |
            +----------------------------+
                         |
                         v
            +-------------------------------------+
            |      StudentSwitcherModal           |
            |  - Reads getStudentRoster()         |
            |  - Calls selectStudent(target)      |
            |  - Calls saveStudentProfile(data)   |
            +-------------------------------------+
```

### 4.2 Storage Event & Reactivity Observations
- **Imperative Storage Access**: Components currently load roster and session history via explicit helper calls (`loadRoster()`, `getStudentRoster()`, `getSessionHistory()`) during `useEffect()` lifecycle events.
- **Context Updates**: When a student is selected via `selectStudent()`, `TestSessionContext` updates `state.currentStudent`, which immediately re-renders all subscribers (`Layout`, `Dashboard`, `Home`).
- **External/Remote Sync Reactivity Requirement**:
  - When importing a JSON backup or pulling from GitHub Gist, localStorage is mutated.
  - To ensure all components in the React tree update seamlessly without requiring a hard browser reload, a sync trigger or custom event (or helper in Context like `refreshStorageData()`) can dispatch a notify event (e.g., `window.dispatchEvent(new CustomEvent('storage_synced'))` or context state updates).

---

## 5. UI Integration Points for Sync & Export/Import
- **Primary Access Points identified**:
  1. **Layout / Top Navigation Bar (`src/components/Layout.tsx`)**: Global sync icon/button or status pill next to student switcher.
  2. **Student Switcher Modal (`src/components/StudentSwitcherModal.tsx`)**: Header action buttons ("Sync / Backup").
  3. **Dashboard (`src/pages/Dashboard.tsx`)**: History tab toolbar for backup/export and restore/import.
  4. **Home View (`src/pages/Home.tsx`)**: Roster banner action for cloud sync & local backup.

---

## 6. Verification & Baseline Status
- Automated test suite: `npm run test` executes **47 test files** with **405 unit and integration tests**, passing with **100% success (0 failures)**.
- Code quality & linting: `npm run lint` (`oxlint`) passes with 0 errors.
