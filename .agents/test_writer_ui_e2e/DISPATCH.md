## 2026-08-16T19:20:48Z

You are test_writer_ui_e2e.
Your working directory is: c:\Users\beeck\git\repos\NachhilfeTest\.agents\test_writer_ui_e2e

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Read:
1. ORIGINAL_REQUEST.md at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: c:\Users\beeck\git\repos\NachhilfeTest\PROJECT.md
3. TEST_INFRA.md at: c:\Users\beeck\git\repos\NachhilfeTest\TEST_INFRA.md
4. Test specification plan at: c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_test_1\test_plan.md
5. Existing test files for component testing in `src/tests/focus_integration.test.tsx`, `src/tests/student_switching.test.ts`.

Exclusively owned output files:
1. `src/tests/SyncBackupModal.test.tsx`
2. `src/tests/e2eSyncScenarios.test.ts`

Task:
Write comprehensive, robust Vitest / Testing Library test suites (Tiers 3 and 4) for:
1. `src/tests/SyncBackupModal.test.tsx` (Tier 3: UI & Accessibility):
   - Tab switching: "JSON-Datei Backup" (File) vs "GitHub Gist Cloud Sync" (Gist).
   - Export section: Download backup button click triggers payload creation and export notification.
   - Import section: File input upload, parsing error display, valid file triggers `MergePreviewDialog`.
   - MergePreviewDialog: Displays stats badge (added/updated/unchanged students, sessions), mode selection buttons ("Zusammenführen (Empfohlen)" vs "Ersetzen (Überschreiben)"), Confirm and Cancel actions.
   - Gist Cloud Sync section: PAT input (masked / password type with reveal toggle), Gist ID input, "Verbindung testen" button (shows success/error feedback), "Auf Gist hochladen (Push)" button, "Von Gist laden (Pull)" button.
   - Accessibility & ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label` / `aria-labelledby`, tab list `role="tablist"` and tabs `role="tab"`, Escape key closes modal, focus trapping.
   - Reduced Sensory Theme: Renders without motion/flashing when `reducedSensory` accessibility mode is enabled.
2. `src/tests/e2eSyncScenarios.test.ts` (Tier 4: End-to-End Multi-Device Journeys):
   - Scenario 1 (Tutor Laptop to Tablet Migration): Export JSON backup from Laptop with 5 student profiles & 15 test sessions -> Import on Tablet -> Verify all profiles & session records are intact with 0 data loss.
   - Scenario 2 (Two-Way Cloud Sync via GitHub Gist): Device A updates Student A profile (notes & hobbies) and pushes to Gist -> Device B adds Student B profile and completes test session -> Device B pulls from Gist, merges both students & sessions, and pushes back to Gist -> Device A pulls to sync -> Both devices have identical unified rosters and session histories.
   - Scenario 3 (Corrupted File & Schema Disaster Recovery): User attempts importing invalid JSON, empty file, or schema version 99 -> App rejects cleanly with informative feedback -> Zero corruption of existing local records.
   - Scenario 4 (Network Disruption & Token Expiry Handling): User attempts Gist Sync with expired PAT (401), invalid Gist ID (404), rate limited (403), or offline network -> App catches error gracefully, displays actionable notice, never crashes.
   - Scenario 5 (Active Session Preservation during Sync): Tutor switches student and pulls latest data from Gist while an active diagnostic test is running -> Warning is shown / state is isolated so ongoing test progress is not destroyed.

Rules & Quality:
- Ensure all test suites are completely self-contained and mock global storage / fetch / dialogs cleanly.
- Use `@testing-library/react` and `happy-dom`.
- Write your handoff report to `.agents/test_writer_ui_e2e/handoff.md`.
- Send a message when finished.
