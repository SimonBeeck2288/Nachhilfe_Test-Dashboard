## 2026-08-09T18:51:11Z
You are Worker M1 Retry: Storage Defect Remediation & Student Profile Expansion Implementer.
Your working directory is `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m1_retry`.
Write your changes report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m1_retry\changes.md` and handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m1_retry\handoff.md`.

First, read `c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md` (R1), the Forensic Auditor evidence report at `c:\Users\beeck\git\repos\NachhilfeTest\.agents\auditor_m1\handoff.md`, and Explorer M1 Retry's handoff report at `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_m1_retry\handoff.md`.

Your task:
1. Fix `src/utils/studentRoster.ts`:
   - Replace naive `typeof localStorage !== 'undefined'` in `getStorage()` with a robust `isStorageAvailable(storage)` function that attempts a safe test `setItem`/`removeItem` check inside a try-catch block.
   - Fall back to a working in-memory array (`memoryRoster`) if neither `window.localStorage` nor global `localStorage` is functional, so `getStudentRoster()` and `saveStudentProfile()` never fail silently in any environment (browser, Vitest jsdom, or Node 22).
2. Fix test storage polyfills across test files (`src/utils/studentRoster.test.ts`, `src/tests/challenger_m1_2_stress.test.ts`, `src/tests/challenger_m1_1_student_profile_stress.test.ts`, etc.) if needed so mock storage is properly assigned and active during Vitest execution.
3. Verify all student profile expansion features (`hobbies`, `learningPreferences`, `customNotes`, presets chips, `StudentSwitcherModal.tsx`).
4. Run `npm run test` and `npm run lint`. Verify 100% of test files (all 36 test files) and 294+ tests pass cleanly with 0 errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m1_retry\handoff.md` including exact build, lint, and test output, and send a summary message back to the orchestrator.
