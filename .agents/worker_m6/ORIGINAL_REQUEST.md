## 2026-08-02T15:12:34Z
<USER_REQUEST>
You are Worker M6 for the NachhilfeTest project.
Your working directory for metadata and reports is: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m6

Objective: Implement Milestone 6 (R6: PDF / Print Export & Final Verification).

Task Instructions:
1. In `src/pages/Dashboard.tsx`:
   - Add a PDF / Print export button (e.g. labeled "PDF / Drucken" or "Ergebnis drucken / als PDF speichern") that executes `window.print()` when clicked.
   - Ensure the button is prominently placed on the diagnostic result dashboard so parents/tutors can easily export/print the results.
2. In `src/index.css`:
   - Add `@media print` CSS rules to format a clean, professional print page for parent/tutor conferences.
   - Ensure header navigation bar, export buttons, restart/action buttons, and non-printable layout elements are hidden during print (`display: none !important;`).
   - Format background, fonts, padding, and page breaks so the report fits cleanly on paper or exported PDF.
3. Verification:
   - In workspace root `c:/Users/beeck/git/repos/NachhilfeTest`, run `npm run build` and `npm run lint`.
   - Ensure there are no TypeScript errors or linter warnings/errors.
4. Reporting:
   - Document all changes and verification command outputs in `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m6/handoff.md` and `progress.md`.
   - Update `progress.md` with your timestamp heartbeat.
   - Send a final completion message with your handoff summary back to the parent orchestrator via `send_message`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
