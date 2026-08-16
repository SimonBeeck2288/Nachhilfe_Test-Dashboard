# Handoff Report — UI, Accessibility & Testing Architecture Survey

**Agent**: `explorer_survey_3`  
**Date**: 2026-08-16  
**Working Directory**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3`  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Top Navigation Bar (`src/components/Layout.tsx`)**:
   - Lines 14–98 render the persistent header across all routes with active student indicator (`UserCheck`), class level, and direct/reduced sensory badge `[D/R]`.
   - Lines 70–76 render the `"Schüler wechseln"` trigger which sets `isSwitcherOpen = true`.
   - Lines 105–108 mount `<StudentSwitcherModal isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />`.

2. **Student Switcher Modal (`src/components/StudentSwitcherModal.tsx`)**:
   - Lines 48–50 manage `mode` (`'list' | 'create'`) and `confirmTarget` for active sessions.
   - Lines 215–243 establish modal overlay styling: fixed inset, backdrop blur `rgba(15, 23, 42, 0.65)`, card `maxWidth: '640px'`, `maxHeight: '90vh'`, `overflowY: 'auto'`.
   - Lines 283–334 implement active session protection warning when switching during an ongoing test.
   - Lines 673–899 implement preset and custom tags for hobbies and learning preferences.
   - Lines 916–1015 implement neurodivergent accessibility controls (`directQuestions`, `reducedSensory`).

3. **Accessibility & Reduced Sensory Support**:
   - `src/context/TestSessionContext.tsx` lines 160–168:
     ```tsx
     useEffect(() => {
       if (typeof document !== 'undefined') {
         if (state.accessibilitySettings?.reducedSensory) {
           document.documentElement.classList.add('reduced-sensory');
         } else {
           document.documentElement.classList.remove('reduced-sensory');
         }
       }
     }, [state.accessibilitySettings?.reducedSensory]);
     ```
   - `src/index.css` lines 222–251: `.reduced-sensory` class sets `animation-duration: 0.001ms !important`, `transition-duration: 0.001ms !important`, and removes all bouncers, spins, and flames.
   - `src/utils/focusHelper.ts` lines 7–34: `focusAndPlaceCursorAtEnd` focuses inputs and sets selection range at end of text using `requestAnimationFrame`.

4. **Modal Architecture & Toast Patterns**:
   - `src/components/AiPromptModal.tsx` lines 85–97 handle ESC key navigation (`window.addEventListener('keydown', handleKeyDown)`).
   - Lines 181–207 implement ephemeral feedback toast banner (emerald green `#10B981`, checkmark icon, animated fade-in, auto-dismiss).
   - Line 159–162 declare ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="ai-prompt-modal-title"`.

5. **Existing Vitest Test Infrastructure**:
   - `package.json` line 9: `"test": "npx vitest run"`, line 10: `"lint": "oxlint"`.
   - `vite.config.ts` lines 8–10: `test: { environment: 'happy-dom' }`.
   - Executing `npm run test` ran 47 test files with 405 tests passing in 6.26s with 0 failures.
   - Executing `npm run lint` checked 109 files with 0 errors.

---

## 2. Logic Chain

1. **Need for Multi-Device Sync UI**:
   - Based on Requirement R1, R2, and R3 in `ORIGINAL_REQUEST.md`, tutors need to transfer student rosters and test history across devices via JSON file export/import and GitHub Gist cloud synchronization.
2. **Dedicated Modal vs Inline Integration**:
   - Observation 1 shows that `Layout.tsx` already acts as the global host for application-wide modals (`StudentSwitcherModal`).
   - Observation 2 & 4 show that modal dialogs with rich tabbed options (`AiPromptModal`, `StudentSwitcherModal`) are the established UX pattern in the codebase.
   - Therefore, a dedicated `SyncBackupModal` mounted in `Layout.tsx` and triggered from the Top Nav Bar, Student Switcher footer, Home page, and Dashboard provides maximum accessibility without cluttering test session views.
3. **Merge Strategy & Error Resilience**:
   - Data stored in `diagnostic_student_roster` and `diagnostic_session_history` uses unique IDs (`id`, `sessionId`) and timestamps (`updatedAt`, `date`).
   - To satisfy Acceptance Criteria R1 & R2 without data loss, the import flow must parse and validate schemas before committing to storage, present a Merge Preview (summary of new vs existing records), and offer timestamp-based merge (`updatedAt` comparison) alongside a full restore option.
4. **4-Tier Test Coverage Alignment**:
   - Following `TEST_INFRA.md`'s 4-tier model (Observation 5), the sync/backup feature requires:
     - Tier 1: Unit tests for JSON schema validation, envelope serialization, timestamp merge algorithms, and Gist API client headers/endpoints.
     - Tier 2: Boundary value tests for corrupted JSON, network failures (401/403/404/500), offline mode, and storage quota limits.
     - Tier 3: Cross-feature integration tests for modal UI, tab switching, file upload parsing, context state updates, and accessibility compliance.
     - Tier 4: E2E scenario journeys for full Device A -> Device B migration, two-way Gist synchronization, and non-fatal disaster recovery.

---

## 3. Caveats

1. **GitHub PAT Storage**: Storing the GitHub PAT in `localStorage` (`diagnostic_gist_config`) keeps the application 100% client-side with zero backend dependencies, but users must be clearly instructed to only grant minimal `gist` scope.
2. **Browser Download API**: JSON export relies on client-side `Blob` and `URL.createObjectURL`. In headless test environments (`happy-dom`), `URL.createObjectURL` and anchor click must be mocked.
3. **No Centralized Toast Library**: The codebase uses component-level state for toast banners rather than a 3rd-party library (e.g. `react-toastify`), which keeps the bundle lightweight.

---

## 4. Conclusion

The UI and testing architecture of NachhilfeTest is robust, highly accessible, and ready for the integration of **Multi-Device Synchronization & Data Portability**:
- A dedicated `SyncBackupModal.tsx` should be created with two tabs: **JSON Datei-Backup** and **GitHub Gist Cloud-Sync**.
- Global triggers should be placed in `Layout.tsx` (Top Nav Bar), `StudentSwitcherModal.tsx` (List footer), `Home.tsx`, and `Dashboard.tsx`.
- The import flow must include a **Merge Preview & Conflict Resolution** step with timestamp-based merge logic.
- The 4-Tier test strategy spans 4 new test suites covering schema validation, edge cases, modal integration, and real-world multi-device sync journeys.

---

## 5. Verification Method

To independently verify these architectural findings and test execution:

1. **Run Full Test Suite**:
   ```bash
   npm run test
   ```
   *Expected Result*: All 47 existing test files pass cleanly (405/405 tests passing, 0 failures).

2. **Run Linter**:
   ```bash
   npm run lint
   ```
   *Expected Result*: 0 errors across all files.

3. **Inspect Key Architectural Artifacts**:
   - Detailed analysis: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3\analysis.md`
   - Navigation Layout: `c:\Users\beeck\git\repos\NachhilfeTest\src\components\Layout.tsx`
   - Student Switcher: `c:\Users\beeck\git\repos\NachhilfeTest\src\components\StudentSwitcherModal.tsx`
   - Modal reference: `c:\Users\beeck\git\repos\NachhilfeTest\src\components\AiPromptModal.tsx`
   - Test infrastructure guide: `c:\Users\beeck\git\repos\NachhilfeTest\TEST_INFRA.md`
