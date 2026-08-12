# Survey Report & Codebase Handoff

## 1. Observation

### A. Current State Management & Persistence Architecture
- **Storage Keys**:
  - `diagnostic_student_roster`: Managed by `src/utils/studentRoster.ts` (`ROSTER_STORAGE_KEY = 'diagnostic_student_roster'`). Persists array of `StudentProfile` objects (`id`, `name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`, `createdAt`, `updatedAt`).
  - `diagnostic_session_history`: Managed by `src/utils/sessionHistory.ts` (`HISTORY_STORAGE_KEY = 'diagnostic_session_history'`). Persists array of `TestSessionRecord` objects (`sessionId`, `studentId`, `studentName`, `date`, `subject`, `mathLevelReached`, `englishLevelReached`, `score`, `totalQuestions`, `topicBreakdown`, `cognitionStats`, `answers`, etc.).
  - `diagnosticSession`: Managed by `src/context/TestSessionContext.tsx`. Persists active `TestSessionState` to `localStorage` via a `useEffect` hook (lines 109-115).

- **React Context (`src/context/TestSessionContext.tsx`)**:
  - `TestSessionProvider` supplies `TestSessionContext` exposing `state`, `currentStudent`, `selectStudent`, `saveCurrentStudentProfile`, `startSession`, `recordAnswer`, `updateMathLevel`, `updateEnglishLevel`, `setMathLevel`, `setEnglishLevel`, `setStroopCalibration`, `setWarmupData`, `setCustomTestConfig`, `updateAvatarConfig`, `unlockAccessory`, `incrementStreak`, `resetStreak`, `addPoints`, `unlockBadge`, `finishTest`, `clearSession`, and `saveSessionToHistory`.
  - State interface `TestSessionState` (lines 27-49) holds:
    - `currentStudent: StudentProfile | null`
    - `studentName: string`, `studentId?: string`, `sessionId?: string`
    - `answers: AnswerRecord[]`
    - `mathLevel: number`, `englishLevel: number`, `mathTheta?: number`, `englishTheta?: number`
    - `motivation?: number`, `favoriteSubject?: string`, `problemSubject?: string`
    - `stroopCalibratedLevel?: number`, `recommendedTimeMultiplier?: number`
    - `isSavedToHistory?: boolean`
    - Gamification properties: `avatarConfig` ({ `hatId`, `petId`, `themeId` }), `unlockedAccessories: string[]`, `activeStreak: number`, `points: number`, `unlockedBadges: string[]`.

### B. Header Navigation & Start Screen Structure
- **Header Component (`src/components/Layout.tsx`)**:
  - Located in `src/components/Layout.tsx` (lines 11-52).
  - Renders top navigation `<header>` containing:
    - Logo (`<Brain>` + "DiagnoseTool") linking to `/`.
    - Navigation bar `<nav>` containing:
      - Student status badge (lines 18-36): `{(currentStudent || state.studentName) && (<Link to="/" title="Schüler wechseln / Roster">... {currentStudent ? ... : state.studentName} ...</Link>)}`.
      - Roster link (lines 38-43): `<Link to="/"> Roster </Link>` (hidden when on `/`).
      - Dashboard link (lines 45-50): `<Link to="/dashboard"> Dashboard </Link>`.
  - **Exact Location for Header Button**: Inside `src/components/Layout.tsx` in `<nav>` (lines 17-51). An explicit "Schüler wechseln" button/dropdown/modal trigger can be added here so it is visible and clickable on all pages at all times.

- **Start Screen Component (`src/pages/Home.tsx`)**:
  - Located in `src/pages/Home.tsx`.
  - Renders:
    - Top Banner (lines 149-167) with action buttons: `Neues Schülerprofil anlegen` (`openCreateModal`) and `Custom Test Konfigurieren`.
    - Roster Grid (lines 169-283): Renders cards for each `StudentProfile` in `getStudentRoster()`.
    - Guest Option (lines 285-308): Input for guest name + `Als Gast starten`.
    - Creation/Edit Modal (lines 310-431): Form (`isModalOpen`) for profile creation and editing.
  - **Exact Location for Start Screen Enhancements**: `src/pages/Home.tsx` is the central hub for student profile selection and creation. It currently allows selecting a student card and clicking "Test starten", but calling `handleStartTest(student)` executes `clearSession()`, `selectStudent(student)`, `startSession(student)` and navigates to `/warmup`.

### C. Module Interactions & State Leakage Vulnerabilities
- **Gamification State Inheritance Leak in `startSession` (`src/context/TestSessionContext.tsx`, lines 174-224)**:
  - When `startSession` is called for a new session (string name or `StudentProfile`), it reads:
    `const currentAvatar = state.avatarConfig;`
    `const currentUnlockedAcc = state.unlockedAccessories;`
    `const currentPts = state.points;`
    `const currentUnlockedBadges = state.unlockedBadges;`
  - It then populates the new session with `avatarConfig: currentAvatar`, `unlockedAccessories: currentUnlockedAcc`, `points: currentPts`, `unlockedBadges: currentUnlockedBadges`.
  - **Observation**: If Student A accumulates 500 points, unlocks badges, and changes their avatar, and then a new session is started for Student B, Student B inherits Student A's points, badges, unlocked accessories, and avatar!
- **Mid-Session Switching Leak in `selectStudent` (`src/context/TestSessionContext.tsx`, lines 117-126)**:
  - `selectStudent(student)` updates `currentStudent`, `studentName`, `studentId`, `favoriteSubject`, `problemSubject`, but leaves `answers`, `mathLevel`, `englishLevel`, `activeStreak`, and `points` intact in `state`.
  - If a user switches the active student mid-session without calling `clearSession()` or `startSession()`, Student B inherits Student A's active test progress and answers.
- **Inconsistency in Question Repeat Prevention**:
  - `ModuleEnglish.tsx` (line 21) initializes `askedIds` via `getPastAskedQuestionIds(state.studentId)`.
  - `ModuleMath.tsx` (line 21) initializes `askedIds` via `new Set()` (ignoring past student sessions).
- **Gamification & Progress Storage in `StudentProfile` (`src/types/student.ts`)**:
  - `StudentProfile` interface only contains `id`, `name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`, `createdAt`, `updatedAt`.
  - It does NOT store student-specific baseline/highest levels or student-specific gamification state (avatar, points, badges, unlocked accessories). As a result, gamification state currently lives globally inside `TestSessionState`.

---

## 2. Logic Chain

1. **Premise 1**: The user request requires a "Schüler wechseln" button accessible at any time in the top navigation header, as well as profile selection/creation on the start screen, ensuring active student state updates cleanly across English, Math, Dashboard, and historical stats with zero state leakage across profiles.
2. **Premise 2**: Examining `TestSessionContext.tsx` reveals that `startSession` intentionally copies `avatarConfig`, `unlockedAccessories`, `points`, and `unlockedBadges` from `state` (the previous session). Therefore, switching from Student A to Student B without resetting or isolating student gamification data leaks Student A's rewards and progress into Student B's active session.
3. **Premise 3**: Examining `Layout.tsx` reveals that the header currently displays a profile badge `(currentStudent ? `${currentStudent.name} (Kl. ${currentStudent.gradeLevel})` : state.studentName)` linked to `/`, but lacks a direct, dedicated "Schüler wechseln" action button or a modal/dropdown switcher accessible during test modules.
4. **Premise 4**: Examining `studentRoster.ts` and `sessionHistory.ts` shows that student profile CRUD and past session history filtering by `studentId` are already fully supported in storage utilities.
5. **Conclusion**: To implement zero-leakage multi-student profile switching:
   - `StudentProfile` (or a dedicated student profile extension/store) should support per-student gamification data or `startSession` / `selectStudent` must reset gamification state to initial default values (or per-student values) when switching students.
   - Calling `selectStudent` or selecting a new profile must reset active session answers, levels, streaks, and motivation unless explicitly continuing a session.
   - `Layout.tsx` needs a prominent "Schüler wechseln" button in `<nav>` that opens a quick student switcher modal or navigates to profile selection.
   - `Home.tsx` needs clear visual feedback for the currently active student profile and an option to switch profiles without breaking active sessions.

---

## 3. Caveats

- **Mid-Test Switching Behavior**: If a student is currently in the middle of a test (e.g. in `ModuleMath` or `ModuleEnglish`) and clicks "Schüler wechseln", switching to another student must prompt for confirmation if unsaved active test answers exist, or cleanly save/clear the active session before switching.
- **Guest Profiles**: Guest users do not have an entry in `diagnostic_student_roster` and use `studentId: 'guest'`. Switching between Guest and a roster student must handle guest state cleanly.
- **Existing Test Suite**: The test suite (`npm run test`) currently has 14 test files and 97 passing tests. Any changes to `TestSessionContext` or `studentRoster` must maintain 100% backward compatibility with existing unit/integration tests.

---

## 4. Conclusion

### Summary of Recommendations for Implementation:

1. **State Isolation in `TestSessionContext.tsx`**:
   - Update `startSession` to reset `points`, `activeStreak`, `unlockedBadges`, `unlockedAccessories`, `avatarConfig`, `motivation`, `answers`, `mathLevel`, and `englishLevel` to clean initial defaults for newly selected students, rather than inheriting from `state`.
   - Optionally attach per-student gamification state to `StudentProfile` or store per-student gamification data in `localStorage` keyed by `studentId` (`student_gamification_${studentId}`).

2. **Header "Schüler wechseln" Button in `src/components/Layout.tsx`**:
   - Add a prominent button `<button className="btn btn-secondary" onClick={...}> <UserCheck size={18} /> Schüler wechseln </button>` in the top header `<nav>`.
   - Trigger a `StudentSwitcherModal` component or navigate to `/` with profile switcher drawer/modal.

3. **Start Screen Integration in `src/pages/Home.tsx`**:
   - Display active profile badge at the top of the start screen.
   - Allow seamless creation of new profiles (`openCreateModal`) and instant profile switching.

4. **Testing Requirements**:
   - Add unit/integration tests in `src/tests/` verifying profile switching state reset, gamification isolation between two distinct student IDs, and non-leakage of history/stats.

---

## 5. Verification Method

To independently verify the codebase state and test suite:

1. **Run Vitest Test Suite**:
   ```bash
   npm run test
   ```
   *Expected Output*: 14 test files passed, 97+ tests passed, 0 errors.

2. **Run Linter (`oxlint`)**:
   ```bash
   npm run lint
   ```
   *Expected Output*: 0 warnings and 0 errors.

3. **Run TypeScript Build Check**:
   ```bash
   npm run build
   ```
   *Expected Output*: Clean TypeScript build with 0 errors.

4. **Codebase Files Inspected**:
   - `src/types/student.ts` (lines 1-11)
   - `src/types/history.ts` (lines 18-37)
   - `src/context/TestSessionContext.tsx` (lines 27-225, 437-444)
   - `src/utils/studentRoster.ts` (lines 1-127)
   - `src/utils/sessionHistory.ts` (lines 1-102)
   - `src/components/Layout.tsx` (lines 11-52)
   - `src/pages/Home.tsx` (lines 169-308)
   - `src/pages/Dashboard.tsx` (lines 218-232, 755-772)
   - `src/pages/ModuleEnglish.tsx` (lines 14-36)
   - `src/pages/ModuleMath.tsx` (lines 14-36)
