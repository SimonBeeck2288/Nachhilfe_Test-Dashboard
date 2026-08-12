# Codebase Analysis & Architecture Report: Requirements R3 & R4

## 1. Executive Summary

This report provides a comprehensive analysis of the existing codebase and detailed technical architecture for **Requirement R3 (Multi-Student Profile Management / Roster)** and **Requirement R4 (Test Data Persistence & Session History Manager)** for the Nachhilfe-Diagnose-App.

Currently, the application manages test sessions using a single, ephemeral state stored in `localStorage` under the key `'diagnosticSession'`. When a tutor finishes a test or clicks "Neuer Schüler" in `Dashboard.tsx`, calling `clearSession()` completely purges the session data. There is no student profile roster, no history of past diagnostic tests, and no capability to review or compare test runs over time.

To fulfill R3 and R4:
1. **R3** will introduce a persistent **Student Profile Roster**, allowing tutors to create, select, switch, and edit student profiles (`name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`).
2. **R4** will introduce a persistent **Session History Repository**, storing completed test session snapshots in `localStorage` under `'diagnostic_session_history'` with full drilldown review and delete capabilities.

---

## 2. Existing Codebase Investigation

### 2.1 Context & State Management (`src/context/TestSessionContext.tsx`)
- **Current State Structure**:
  ```ts
  interface TestSessionState {
    studentName: string;
    answers: AnswerRecord[];
    mathLevel: number;
    englishLevel: number;
    motivation?: number;
    favoriteSubject?: string;
    problemSubject?: string;
  }
  ```
- **Current Persistence Mechanism**:
  - `localStorage.getItem('diagnosticSession')` loads state on initialization.
  - `useEffect` serializes `state` back to `localStorage` under `'diagnosticSession'` whenever state changes.
  - `clearSession()` executes `localStorage.removeItem('diagnosticSession')` and resets `state` to initial empty defaults.
- **Deficiencies for R3 & R4**:
  - Only supports a single active session; no concept of multiple students or stored profiles.
  - `studentName` is a plain string without metadata like grade level, notes, or persistent ID.
  - No archive/history array for past test runs.

### 2.2 Navigation & Page Components
- **`src/pages/Home.tsx`**:
  - Contains a single `<input placeholder="Dein Vorname">`.
  - Submitting clears the previous session and starts a new session with just a name string.
- **`src/pages/ModuleWarmup.tsx`**:
  - Asks for motivation (1-5), favorite subject, and problem subject manually every time.
- **`src/pages/Dashboard.tsx`**:
  - Displays stats, topic accuracy breakdowns, and cognition interpretation for the *current* session.
  - "Neuer Schüler" button invokes `clearSession()`, losing all test results.
  - Print button (`window.print()`) prints the current page.
- **`src/components/Layout.tsx`**:
  - Displays `"Schüler: {state.studentName}"` in the header if `studentName` is set.

---

## 3. Requirement R3: Multi-Student Profile Management (Roster)

### 3.1 Data Model Specification (`StudentProfile`)
File: `src/types/student.ts` (or added to `src/types.ts`)
```ts
export interface StudentProfile {
  id: string; // Unique UUID or timestamp slug (e.g., 'std_1722680000000_a1b2')
  name: string; // Full or first name (required)
  gradeLevel: number | string; // Grade level / Class (e.g., 5, 8, '8. Klasse')
  favoriteSubject: string; // e.g. "Mathematik", "Deutsch"
  problemSubject: string; // e.g. "Englisch", "Physik"
  notes: string; // Tutor notes (e.g., LRS, needs extra time, quiet environment)
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}
```

### 3.2 Storage Strategy & Operations (`src/utils/studentRoster.ts`)
- **Storage Key**: `localStorage.getItem('diagnostic_student_roster')`
- **Utility Functions**:
  - `getStudentRoster(): StudentProfile[]`
  - `saveStudentProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): StudentProfile`
  - `updateStudentProfile(id: string, updates: Partial<StudentProfile>): StudentProfile`
  - `deleteStudentProfile(id: string): void`
  - `getStudentById(id: string): StudentProfile | undefined`

### 3.3 UI Integration Points
1. **Home Landing Page (`src/pages/Home.tsx`)**:
   - Replace the simple name text input with a **Student Selector Component**:
     - Grid/Dropdown of existing student profiles (showing name, grade level, last test date).
     - **"Neuer Schüler anlegen"** button opening a profile form modal or inline form.
     - **"Profil bearbeiten"** button for quick edits to notes, grade level, or favorite/problem subjects.
2. **Warmup Integration (`src/pages/ModuleWarmup.tsx`)**:
   - Auto-fill `favoriteSubject` and `problemSubject` from the selected student's profile!
   - Allow the tutor/student to confirm or adjust for today's session (plus answer daily motivation 1-5).
3. **Header Badge & Switcher (`src/components/Layout.tsx`)**:
   - Show active student avatar/badge with name and grade.
   - Add a "Schüler wechseln" or "Roster" button opening a quick-switch modal.

---

## 4. Requirement R4: Test Data Persistence & Session History Manager

### 4.1 Data Model Specification (`TestSessionRecord`)
File: `src/types/history.ts`
```ts
export interface SubjectSummary {
  subject: 'math' | 'english' | 'cognition';
  levelReached?: number;
  correctCount: number;
  totalCount: number;
  accuracy: number; // 0.0 to 1.0
  avgTimeSeconds: number;
  reactionTimeMs?: number; // for cognition
}

export interface TestSessionRecord {
  id: string; // Unique session ID ('sess_1722680000000_x9y8')
  studentId: string; // Associated StudentProfile.id (or 'guest')
  studentName: string; // Captured snapshot of name
  gradeLevel?: number | string;
  completedAt: string; // ISO 8601 timestamp
  durationSeconds: number; // Total test duration
  mathLevel: number;
  englishLevel: number;
  warmup: {
    motivation?: number;
    favoriteSubject?: string;
    problemSubject?: string;
  };
  summaries: {
    math?: SubjectSummary;
    english?: SubjectSummary;
    cognition?: SubjectSummary;
  };
  answers: AnswerRecord[]; // Full answer records for drilldown review
  interpretation: string; // Generated diagnosis text
}
```

### 4.2 Storage Manager (`src/utils/sessionHistory.ts`)
- **Storage Key**: `localStorage.getItem('diagnostic_session_history')`
- **Utility Functions**:
  - `getHistoryRecords(): TestSessionRecord[]`
  - `getHistoryByStudent(studentId: string): TestSessionRecord[]`
  - `saveCompletedSession(session: TestSessionRecord): void`
  - `deleteSessionRecord(id: string): void`
  - `clearAllHistory(): void`
- **Auto-Save Mechanism**:
  - When navigating to `Dashboard.tsx` at the end of a session, check if the active session has already been persisted to `diagnostic_session_history`.
  - If not, automatically construct `TestSessionRecord` and append it to persistent storage.

### 4.3 UI Integration Points
1. **Dashboard History Tab / Section (`src/pages/Dashboard.tsx` or `HistoryManager.tsx`)**:
   - Add a tab toggle or section on Dashboard: **[ Aktuelle Auswertung | Testergebnisse / Historie ]**.
   - **History Table Column Layout**:
     - Datum & Uhrzeit
     - Schüler Name & Klasse
     - Erreichte Level (Mathe Lvl X, Eng Lvl Y)
     - Gesamt-Genauigkeit (%)
     - Aktionen: **[ Details ansehen ]** (Review) | **[ Löschen ]** (Delete)
2. **Review Action**:
   - Clicking "Details ansehen" loads the stored `TestSessionRecord` into the Dashboard review mode, populating all topic accordions, answers, response times, and diagnosis text.
3. **Delete Action**:
   - Prompts confirmation: *"Möchtest du diese Testergebnis-Aufzeichnung unwiderruflich löschen?"*
   - Removes record from `diagnostic_session_history` and refreshes history view.

---

## 5. Architectural & State Integration Plan

```
+-----------------------------------------------------------------------+
|                            React Application                          |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
+-----------------------------------+     +-----------------------------------+
|       StudentRosterContext        |     |       TestSessionContext          |
|  - roster: StudentProfile[]       |     |  - activeSession: State           |
|  - activeStudent: StudentProfile  |---->|  - studentId / studentName        |
|  - add/update/deleteStudent()     |     |  - answers: AnswerRecord[]        |
+-----------------------------------+     |  - recordAnswer()                 |
                 |                        +-----------------------------------+
                 v                                          |
  localStorage['diagnostic_student_roster']                 v
                                          +-----------------------------------+
                                          |      SessionHistoryManager        |
                                          |  - saveSession(completedRecord)   |
                                          |  - getHistory() / deleteSession() |
                                          +-----------------------------------+
                                                            |
                                                            v
                                             localStorage['diagnostic_session_history']
```

---

## 6. Recommended Milestone Boundaries for Implementers

### Milestone R3.1: Data Models & Student Roster Core
- Define `StudentProfile` interface in `src/types.ts` / `src/types/student.ts`.
- Implement `src/utils/studentRoster.ts` helper with unit tests (`src/utils/studentRoster.test.ts`).
- Create `StudentContext` / `useStudentRoster` hook to provide roster state globally.

### Milestone R3.2: Roster UI Integration
- Update `src/pages/Home.tsx` with student selection dropdown, "Neuer Schüler" modal, and edit profile dialog.
- Update `src/pages/ModuleWarmup.tsx` to pre-fill profile favorite and problem subjects.
- Update `src/components/Layout.tsx` header to show active student indicator and switch button.

### Milestone R4.1: Test Data Persistence Engine
- Define `TestSessionRecord` interface in `src/types/history.ts`.
- Implement `src/utils/sessionHistory.ts` storage manager with unit tests (`src/utils/sessionHistory.test.ts`).
- Integrate auto-saving trigger when completing a test session.

### Milestone R4.2: Session History & Review UI
- Build `SessionHistoryTable` component within `src/pages/Dashboard.tsx` or a dedicated view.
- Implement session review drilldown (loading historical session into Dashboard view).
- Implement delete action with confirmation modal.

### Milestone R4.3: Automated Testing & Verification
- Execute `npm run build` and `npm run lint`.
- Add unit tests for roster CRUD operations and session history persistence.
