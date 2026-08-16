# Comprehensive UI, Accessibility & Testing Architecture Survey
**Agent**: `explorer_survey_3`  
**Working Directory**: `.agents/explorer_survey_3/`  
**Date**: 2026-08-16  
**Status**: COMPLETE — Read-Only Architectural Survey & Test Strategy

---

## Executive Summary
This document provides a thorough analysis of the existing UI components, accessibility patterns, modal and notification architecture, Vitest test suite structure, and testing conventions in **NachhilfeTest**. Furthermore, it outlines the comprehensive UI integration design and a 4-Tier test strategy for the upcoming **Multi-Device Synchronization & Data Portability** feature (JSON File Export/Import and GitHub Gist Cloud-Sync).

---

## 1. Existing UI Component Architecture

### 1.1 Top Navigation Bar (`src/components/Layout.tsx`)
- **Structure & Layout**: Renders the persistent application header across all routes (`/`, `/warmup`, `/cognition`, `/level-proposal`, `/math`, `/english`, `/dashboard`, `/configurator`, `/practice`).
- **Active Student Indicator**:
  - Displays active student pill with `<UserCheck size={16} />` icon.
  - Shows student name and grade level: `${student.name} (Kl. ${student.gradeLevel})` or `${state.studentName} (Gast)`.
  - Displays dynamic badge `[D/R]` when Direct Questions (`directQuestions`) or Reduced Sensory (`reducedSensory`) mode is active (`#0284C7` background).
  - Clicking the pill or the adjacent `"Schüler wechseln"` button triggers `isSwitcherOpen = true`.
- **Navigation Links**:
  - `"Roster"` (`/` with `<Users />` icon, conditionally hidden on `/`).
  - `"Übungs-Generator"` (`/practice` with `<Wand2 />` icon, conditionally hidden on `/practice`).
  - `"Dashboard"` (`/dashboard` with `<LayoutDashboard />` icon, conditionally hidden on `/dashboard`).
- **Modal Mounting**: `StudentSwitcherModal` is mounted directly inside `Layout.tsx` for global accessibility.

### 1.2 Student Switcher Modal (`src/components/StudentSwitcherModal.tsx`)
- **Modes**:
  - `mode === 'list'`: Lists all saved student profiles from `getStudentRoster()` with initial avatar circles, grade levels, favorite/problem subjects, tags for hobbies and learning preferences, `[D/R]` badges, `"Bearbeiten"` button, and `"Auswählen"` action. Also includes a `"Als Gast wechseln"` fallback.
  - `mode === 'create'`: Form for creating or editing profiles (`name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`, `hobbies`, `learningPreferences`, `customNotes`, and `accessibilitySettings`).
- **Session Protection / Safety Guard**:
  - When switching students while `state.answers.length > 0`, an inline alert overlay (`<AlertTriangle />`) warns: *"Aktiver Test im Gange! Beim Profilwechsel wird die laufende Sitzung beendet..."* with `"Abbrechen"` and `"Ja, Schüler wechseln"` buttons.
- **Tag Management**:
  - Preset hobby chips (`Gaming`, `Fußball`, `Minecraft`, `Musik`, `Lesen`, `Zeichnen`, `Sport`) + custom tag input (`customHobbyInput`).
  - Preset learning preference chips (`Mit Hobbys erklären`, `Schritt-für-Schritt`, `Visuell`, `Beispiele aus Alltag`, `Kurze Erklärungen`) + custom preference input (`customPrefInput`).
- **Accessibility & Sensory Configuration**:
  - Integrated preset buttons (`Standardmodus` vs `Direkt & Reizarm [D/R]`) and checkboxes (`directQuestions`, `reducedSensory`).

### 1.3 Test Configurator (`src/components/TestConfigurator.tsx`)
- **Page Route**: `/configurator`
- **Sections**:
  1. Student Profile Selector (from roster dropdown or guest name input) with embedded `AccessibilityModeSwitcher`.
  2. Subject Selector (Vollständiger Test, Nur Mathe, Nur Englisch, Nur Kognition).
  3. Starting Level Slider (Levels 1 to 7) & Max Duration Selector (3m, 5m, 10m, 15m, No limit).
  4. Question Type Filter (Multiple-Choice, Freitext / Tastatur-Eingabe).
  5. Topic Filter Matrix with 3 interactive states:
     - 🔵 **Optional**: Standard adaptive delivery when level matches.
     - ⭐ **Garantiert (Prio-Modus)**: Guaranteed question once level is reached.
     - 🚫 **Deaktiviert**: Topic completely excluded from test run.
- **State Management**: Updates `customTestConfig` in `TestSessionContext` and navigates to the starting test module.

### 1.4 Accessibility Mode Switcher (`src/components/AccessibilityModeSwitcher.tsx`)
- **Dual Display Modes**:
  - `compact`: Inline pill toggle (`Standard` vs `Direkt & Reizarm [D/R]`) suitable for headers, test banners, and cards.
  - `card` / detailed: Card with preset buttons, collapsible details panel (`SlidersHorizontal`), and individual checkboxes for `directQuestions` and `reducedSensory`.
- **Immediate Profile Sync**: `onSaveToProfile` prop automatically persists changes back to `StudentProfile` in `localStorage`.

### 1.5 Modal Architecture & Dialog Pattern
Across all existing modals (`AiPromptModal`, `StudentSwitcherModal`, `AvatarCustomizerModal`, `DidYouKnowModal`, `Home.tsx` creation dialog):
- **Backdrop & Positioning**: Fixed overlay (`position: 'fixed'`, `inset: 0`, `backgroundColor: 'rgba(15, 23, 42, 0.65)'`, `backdropFilter: 'blur(4px)'`, `zIndex: 1000`).
- **Inner Card**: Centered, `maxWidth` (500px - 720px), `maxHeight: 90-92vh`, `overflowY: 'auto'`, smooth rounded corners (`borderRadius: var(--radius-lg, 12px)`), card elevation (`boxShadow`).
- **Backdrop Dismissal**: Outer div has `onClick={onClose}`; inner card has `onClick={(e) => e.stopPropagation()}`.
- **Keyboard Handling**: ESC key listener attached via `useEffect` to `window` (`keydown`).
- **ARIA Semantics**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="<id>"`, `aria-label="Schließen"`.

### 1.6 Toast & Notification System
- **Current Implementation**:
  - Ephemeral status banners are managed locally within components (e.g. `AiPromptModal` uses `toastMessage`, emerald green `#10B981`, checkmark icon, animated `fadeIn`, auto-cleared after 3.5s - 4.5s).
  - Test session alerts use dedicated banners (`TimeUpBanner`, `ModuleTimeUpBanner`).
- **Design for Sync & Backup**:
  - The `SyncBackupModal` will adopt the established ephemeral banner pattern for copy/sync feedback, complemented by inline status badges (`"Verbunden"`, `"Nicht konfiguriert"`, `"Letzter Sync: vor 5 Minuten"`).

---

## 2. Accessibility & Theme Compliance

### 2.1 Focus Management
- **Utilities**: `src/utils/focusHelper.ts` provides `focusAndPlaceCursorAtEnd(element)` using `requestAnimationFrame` and `element.setSelectionRange()`.
- **Modals**:
  - Auto-focus on primary form inputs (`autoFocus` attribute or `useEffect` ref focus).
  - Focus restored to trigger element upon modal dismissal.
  - Tab navigation cycles naturally through interactive elements (`input`, `select`, `button`).

### 2.2 Keyboard Navigation
- **Escape Key (`Escape`)**: Closes any open modal dialog.
- **Enter Key (`Enter`)**: Submits forms and triggers tag addition in custom text inputs.
- **Space / Enter**: Toggles buttons, checkboxes, and chips.
- **Numeric & Arrow Keys**: Used in `ModuleCognition.tsx` for reaction-time keyboard testing.

### 2.3 ARIA Attributes
- Modals declare `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby`.
- Accordion headers in `Dashboard.tsx` declare `aria-expanded={isExpanded}`.
- Interactive controls include clear `aria-label` or `title` tooltips.
- Action elements include explicit `data-testid` tags for opaque-box testing.

### 2.4 Theme & Sensory Modes
- **Design Tokens**: Standardized in `src/index.css`:
  - `--primary`: `#4F46E5`, `--primary-hover`: `#4338CA`
  - `--secondary`: `#10B981`, `--surface`: `#FFFFFF`, `--bg-color`: `#F3F4F6`
  - `--text-main`: `#1F2937`, `--text-muted`: `#6B7280`, `--border`: `#E5E7EB`
  - `--radius-md`: `8px`, `--radius-lg`: `12px`, `--radius-xl`: `16px`
- **Reduced Sensory Mode (`reduced-sensory`)**:
  - Activated by adding `.reduced-sensory` to `document.documentElement` (`<html>`) via `TestSessionContext.tsx`.
  - CSS rules in `src/index.css` override animation durations to `0.001ms !important`, remove bouncers (`.mascot-float`, `.avatar-bounce`, `.streak-flame`, `.pulse-animation`, `.animate-bounce`), and eliminate transition delays.
  - UI for Sync & Backup must fully respect `.reduced-sensory` (clean static indicators, no infinite spinning animations when reduced sensory is enabled).

---

## 3. UI Integration Design for Sync & Backup

### 3.1 Architecture: Dedicated Sync & Backup Modal (`SyncBackupModal.tsx`)
A dedicated modal component `SyncBackupModal.tsx` provides clean separation of concerns, rich configuration options, and zero visual clutter in the main test flow.

#### Global Entry Points & Triggers:
1. **Top Navigation Bar (`Layout.tsx`)**:
   - Add a global Cloud/Backup button next to `"Schüler wechseln"`:
     ```tsx
     <button
       type="button"
       className="btn btn-secondary"
       onClick={() => setIsSyncModalOpen(true)}
       title="Cloud-Sync & Daten-Backup"
       style={{ padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
     >
       <Cloud size={18} />
       <span>Sync & Backup</span>
     </button>
     ```
2. **Student Switcher Modal (`StudentSwitcherModal.tsx`)**:
   - In the footer of `mode === 'list'`, provide a secondary shortcut:
     ```tsx
     <button
       type="button"
       onClick={() => { onClose(); onOpenSyncModal(); }}
       className="btn btn-outline"
       style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
     >
       <DatabaseBackup size={14} /> Daten sichern / synchronisieren
     </button>
     ```
3. **Home Page (`Home.tsx`) & Dashboard (`Dashboard.tsx`)**:
   - Quick backup buttons in the Roster header and History section header.

---

### 3.2 User Flows & Interface Specification

```
+--------------------------------------------------------------------------------+
|                        Sync & Backup (Cloud & Lokal)                    [ X ]  |
+--------------------------------------------------------------------------------+
|  [ 📥 JSON Datei-Backup ]  |  [ ☁️ GitHub Gist Cloud-Sync ]                    |
+--------------------------------------------------------------------------------+
|                                                                                |
|  TAB 1: JSON DATEI-BACKUP                                                      |
|  ----------------------------------------------------------------------------  |
|  Exportieren:                                                                  |
|  Sichere alle Schülerprofile (Roster) und Testergebnisse in einer JSON-Datei.  |
|  [ 💾 Lokales Backup exportieren (JSON) ]                                      |
|                                                                                |
|  Importieren:                                                                  |
|  Lade eine bestehende JSON-Backup-Datei hoch:                                  |
|  +--------------------------------------------------------------------------+  |
|  |       📂 JSON-Datei hierher ziehen oder [ Durchsuchen... ]               |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                |
|  >> MERGE PREVIEW VORSCHAU (nach Dateiupload):                                 |
|  Gefunden: 3 Schüler (1 neu, 2 bestehend), 8 Testsitzungen (3 neu)              |
|  Import-Strategie:                                                             |
|  ( o ) Intelligent zusammenführen (Merge nach Zeitstempel) [Empfohlen]         |
|  (   ) Vollständig überschreiben (Restore)                                     |
|  [ Abbrechen ]                           [ 🚀 Import jetzt ausführen ]         |
|                                                                                |
|  ----------------------------------------------------------------------------  |
|  TAB 2: GITHUB GIST CLOUD-SYNC                                                 |
|  ----------------------------------------------------------------------------  |
|  GitHub Personal Access Token (PAT):                                           |
|  [ github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx ] [ 👁️ ]                            |
|  (Benötigt Scope: "gist" für private Gist Synchronisation)                     |
|                                                                                |
|  Gist ID (Optional - wird beim 1. Push automatisch erstellt):                  |
|  [ a1b2c3d4e5f6...                        ]                                    |
|                                                                                |
|  Verbindung & Status:                                                          |
|  [ 🔄 Verbindung testen ] -> [ ✓ Verbunden als @octocat | Gist vorhanden ]     |
|  Letzter Sync: 16.08.2026, 21:05 Uhr                                           |
|                                                                                |
|  Aktionen:                                                                     |
|  [ ⬆️ In die Cloud hochladen (Push) ]    [ ⬇️ Aus der Cloud laden (Pull) ]     |
|                                                                                |
|  Optionen:                                                                     |
|  [x] Automatisch beim Start & nach Testende synchronisieren                    |
+--------------------------------------------------------------------------------+
```

#### Detailed Flow 1: JSON Export
1. User clicks **"Lokales Backup exportieren (JSON)"**.
2. Service reads `getStudentRoster()` and `getSessionHistory()`.
3. Creates envelope payload:
   ```json
   {
     "schemaVersion": "1.0.0",
     "exportedAt": "2026-08-16T21:15:00.000Z",
     "appVersion": "0.0.0",
     "data": {
       "roster": [...],
       "history": [...]
     }
   }
   ```
4. Generates browser download (`Blob` -> `URL.createObjectURL` -> invisible anchor click -> auto cleanup).
5. Shows success notification: *"Backup erfolgreich heruntergeladen (3 Profile, 12 Sitzungen)"*.

#### Detailed Flow 2: JSON Import with Merge Preview
1. User uploads/drops JSON file.
2. Parser checks schema validity, JSON formatting, and version compatibility.
3. If corrupt or invalid: shows non-fatal error banner (`"Ungültiges Dateiformat: Datei enthält kein gültiges NachhilfeTest-JSON-Schema"`). Zero crash state.
4. If valid: renders **Merge Preview**:
   - Number of student profiles in file vs existing.
   - Number of test sessions in file vs existing.
   - Conflict resolution strategy radio buttons:
     - **Merge (Default)**: Combines rosters using `updatedAt` timestamps (newest profile wins); appends new test sessions by unique `sessionId`.
     - **Overwrite (Restore)**: Completely replaces local storage with the imported backup.
5. User confirms -> local storage updated -> context reloaded -> success notification displayed.

#### Detailed Flow 3: GitHub Gist Cloud-Sync (PAT + Gist ID)
1. **Configuration**:
   - User inputs GitHub Personal Access Token (PAT) with `gist` scope.
   - User inputs or leaves blank the `gistId`.
   - Stored securely in `localStorage` under `diagnostic_gist_config`.
2. **Test Connection**:
   - Calls `GET https://api.github.com/gists/${gistId}` or `GET https://api.github.com/user` with `Authorization: Bearer <PAT>`.
   - Validates response -> displays status badge: *"Verbunden als @user (Gist aktiv)"* or actionable error: *"Ungültiges Token (HTTP 401)"*, *"Gist nicht gefunden (HTTP 404)"*, *"Rate-Limit erreicht (HTTP 403)"*.
3. **Push to Gist**:
   - Bundles roster and history into JSON payload.
   - If `gistId` is empty: sends `POST https://api.github.com/gists` (`public: false`, `description: "NachhilfeTest Multi-Device Sync"`, `files: { "nachhilfetest_sync.json": { content: ... } }`), saves new `gistId`.
   - If `gistId` exists: sends `PATCH https://api.github.com/gists/${gistId}` updating `nachhilfetest_sync.json`.
   - Updates `lastSyncTimestamp`.
4. **Pull from Gist**:
   - Calls `GET https://api.github.com/gists/${gistId}`.
   - Parses `files["nachhilfetest_sync.json"].content`.
   - Executes timestamp-based merge with local roster and test history.
   - Refreshes application state and displays feedback.

---

## 4. Existing Vitest Test Runner Setup & Test Conventions

### 4.1 Configuration & Environment
- **Runner**: Vitest 4.1.10 configured in `vite.config.ts`.
- **Environment**: `happy-dom` 20.11.2 (fast in-memory DOM implementation).
- **Execution Commands**:
  - `npm run test` -> `npx vitest run` (Single-run CI mode, 47 files, 405 tests passing).
  - `npm run lint` -> `oxlint` (0 errors across 109 files).
- **Test Framework Utilities**:
  - Vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`).
  - `@testing-library/react` 16.3.2 (`render`, `screen`, `fireEvent`, `act`, `cleanup`).

### 4.2 Storage & Network Mocking Conventions
- **`localStorage` Mocking**:
  - `src/utils/studentRoster.ts` and `src/utils/sessionHistory.ts` include `isStorageAvailable` safety guards.
  - Test files initialize mock `localStorage` implementations in Node/happy-dom environments.
- **Fetch & API Mocking**:
  - Use `vi.stubGlobal('fetch', mockFetch)` or `vi.spyOn(globalThis, 'fetch')` to simulate GitHub Gist REST API responses, network failures, timeouts, and rate limits.

---

## 5. Strategy for Comprehensive E2E & Unit Test Coverage (Tiers 1-4)

Testing follows the requirement-driven 4-tier model defined in `TEST_INFRA.md`:

```
+---------------------------------------------------------------------------------------+
|  TIER 4: Real-World E2E Application Journeys                                          |
|  Multi-device sync journey, file transfer A->B, disaster recovery & offline tolerance  |
+---------------------------------------------------------------------------------------+
|  TIER 3: Cross-Feature Integration Scenarios                                          |
|  SyncModal -> TestSessionContext -> StudentSwitcher -> Live Test Session Flow        |
+---------------------------------------------------------------------------------------+
|  TIER 2: Boundary Value Analysis & Edge Cases                                         |
|  Corrupted JSON, schema mismatches, network 401/403/404/500, storage quota exceeded   |
+---------------------------------------------------------------------------------------+
|  TIER 1: Unit & Schema Validation Tests                                               |
|  JSON serialization, schema validator, timestamp merge logic, Gist client requests   |
+---------------------------------------------------------------------------------------+
```

### 5.1 Tier 1: Unit & Schema Validation Tests
- **Target File**: `src/tests/sync_backup_export_import.test.ts` & `src/tests/gist_sync_client.test.ts`
- **Unit Tests**:
  - Validate JSON export structure matching `{ schemaVersion, exportedAt, data: { roster, history } }`.
  - Validate schema validation parser: rejects missing top-level keys, coerces missing optional fields, assigns default accessibility settings.
  - Verify timestamp merge logic for students:
    - Same ID, local newer -> local preserved.
    - Same ID, remote newer -> remote updates local.
    - Same ID, identical timestamps -> local preserved without duplicate entries.
    - Disjoint IDs -> merged union of all students.
  - Verify session history deduplication:
    - Matches by `sessionId`.
    - Merges and sorts chronologically (`unshift` latest first).
  - Verify GitHub Gist REST API client:
    - Request header inspection (`Authorization: Bearer <PAT>`, `Accept: application/vnd.github+json`).
    - Correct endpoint selection for Create (`POST /gists`), Update (`PATCH /gists/:id`), and Read (`GET /gists/:id`).

### 5.2 Tier 2: Boundary Value Analysis & Edge Cases
- **Target File**: `src/tests/sync_backup_edge_cases.test.ts`
- **Edge Cases Tested**:
  - Corrupted JSON (half-truncated strings, raw HTML, binary data, non-object JSON e.g. `123`, `null`, `[]`).
  - Legacy schema compatibility (importing v0/raw roster arrays without envelope).
  - Network error handling:
    - HTTP 401 (Invalid/expired token) -> returns user-friendly error message.
    - HTTP 403 (Rate limit exceeded or insufficient scope) -> non-fatal error notification.
    - HTTP 404 (Gist ID deleted or wrong ID) -> prompts user to verify ID or create new Gist.
    - HTTP 500 / 503 (GitHub outages) -> non-fatal service notice.
    - Offline / Network down (`TypeError: Failed to fetch`) -> offline notification without disrupting test session.
  - Storage quota limits (`QuotaExceededError` in browser storage) -> catches error and alerts user without crashing.
  - XSS sanitization in imported student names, notes, and customNotes.

### 5.3 Tier 3: Cross-Feature Integration Scenarios
- **Target File**: `src/tests/sync_backup_ui_integration.test.tsx`
- **Integration Flows**:
  - `SyncBackupModal` tab switching between "JSON Datei-Backup" and "GitHub Gist Cloud-Sync".
  - File upload trigger parsing file, showing Merge Preview dialog, and updating `StudentSwitcherModal` roster list.
  - "Verbindung testen" button displaying real-time loading and connection badge.
  - Active test protection: performing sync while test is in progress does not reset current question timer or question bank state.
  - Accessibility & theme integration: ESC key dismisses sync modal, focus trapping operates cleanly, and reduced sensory mode disables spin animations.

### 5.4 Tier 4: Real-World E2E Application Journeys
- **Target File**: `src/tests/sync_backup_e2e_scenarios.test.ts`
- **Journey Scenarios**:
  - **Journey 1 (File-based Migration Device A -> Device B)**:
    1. Tutor on Laptop creates 2 student profiles and completes 2 diagnostic sessions.
    2. Exports JSON backup file.
    3. Device B (Tablet) receives and imports the file with "Merge" strategy.
    4. Tablet verifies both profiles and test histories exist.
    5. Tablet runs a new diagnostic test for Student 1 and exports the updated backup.
  - **Journey 2 (Multi-Device Cloud Gist Synchronization)**:
    1. Tutor configures PAT on School Laptop -> Pushes local data to private Gist.
    2. Tutor opens NachhilfeTest on Home Desktop -> Inputs PAT & Gist ID -> Pulls data.
    3. Home Desktop now has identical roster and history.
    4. Tutor adds Student 3 on Home Desktop -> Pushes to Gist.
    5. Tutor returns to School Laptop -> Pulls from Gist -> School Laptop merges Student 3 while preserving local session progress.
  - **Journey 3 (Disaster Recovery & Non-Fatal Error Resilience)**:
    1. User accidentally imports a corrupt/malformed file during an active test session.
    2. Modal displays non-fatal error dialog.
    3. Ongoing test session, student profile, and question timer continue uninterrupted without any data loss.

---

## 6. Recommendations & Implementation Guidelines

1. **Modular Architecture**:
   - `src/types/sync.ts`: Define `SyncBackupEnvelope`, `GistSyncConfig`, `SyncMergePreview`, `SyncMergeStrategy`.
   - `src/utils/syncBackup.ts`: Pure functions for JSON serialization, schema validation, merge algorithms, file download trigger, and file upload parser.
   - `src/utils/gistClient.ts`: GitHub Gist REST API client with robust fetch error handling.
   - `src/components/SyncBackupModal.tsx`: Complete modal UI with tabs, merge preview, Gist config, and connection testing.
2. **Context Integration**:
   - Add `isSyncModalOpen` / `openSyncModal()` or mount directly in `Layout.tsx`.
   - Expose sync refresh handlers to reload roster and history in context after successful import or pull.
3. **Accessibility & Design Consistency**:
   - Utilize existing Tailwind/CSS design variables (`var(--primary)`, `var(--border)`, `var(--radius-lg)`).
   - Fully integrate with `.reduced-sensory` styling for quiet UI transitions.
