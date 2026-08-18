## 2026-08-17T18:52:01Z
<USER_REQUEST>
You are the SWE Light Orchestrator (teamwork_preview_swe).

Your working directory is: `/Users/Simon.Beeck/projects/Nachhilfe_Test-Dashboard/.agents/swe_2`
The original user request is stored in `/Users/Simon.Beeck/projects/Nachhilfe_Test-Dashboard/.agents/ORIGINAL_REQUEST.md`.

## Mission & Requirements
Implement a 5–10 minute Neurodiversity A/B Comparison Diagnostic Test mode in the Nachhilfe Test Dashboard that compares student comprehension and solving speed between standard narrative questions and direct & sensory-reduced ("Direkt & Reizarm") questions.

### R1. A/B Diagnostic Test Mode Configuration & Preset
Add a preset in `TestConfigurator.tsx` ("⚡ A/B Diagnose: Standard vs. Direkt & Reizarm") that configures:
- Configurable 5–10 min timer (slider / options for 5 min, 7.5 min, 10 min) with adaptive difficulty starting at the student's level.
- Subject selection (Math by default, with English or Combined options).
- `isAbModeTest: true` flag in `CustomTestConfig`.

### R2. Interleaved Blind Question Delivery
During an A/B test in `ModuleMath.tsx` and `ModuleEnglish.tsx`:
- Seamlessly alternate / randomly interleave between standard questions (with story contexts/narrative phrasing) and direct questions (clean mathematical formulas / direct phrasing).
- Execute as a blind test (do not display mode badges to the student during the test to prevent psychological bias).
- Tag each answer with `modeVariant: 'standard' | 'direct'` in `AnswerRecord`.

### R3. Comparative Analytics & Auto-Recommendation
Compute and persist A/B comparison metrics in test session state and history:
- Side-by-side comparison of Standard vs. Direkt & Reizarm: Accuracy (%), Average response time (seconds), Total attempted/correct.
- Delta metrics (accuracy gain %, speedup %).
- Dedicated `AbTestComparisonCard.tsx` component in `Dashboard.tsx` with a 1-click action: "Direkt & Reizarm Modus dauerhaft für [Schüler] aktivieren", which updates the student's profile in local storage.

### R4. Printable Diagnostic Report Integration
Add an A/B Comparison section to `DiagnosticReportPrint.tsx` displaying the comparative findings and recommendations for parents/tutors.

## Mandatory User Rules & Constraints
- AGENTS.md: Every time code is updated, added, or modified, run `npm run test` and `npm run lint` before finishing the task to prevent regression errors.
- 100% of all test suites (`npm run test`) must pass cleanly with zero regressions.
- Linter check (`npm run lint`) must pass with zero errors.
- New unit and integration tests added in `src/tests/ab_mode_test.test.ts` verifying mode alternation, answer tagging with `modeVariant`, calculation of comparative accuracy/speed metrics, and auto-recommendation conditions.

Please maintain your `progress.md` and `BRIEFING.md` regularly in your working directory. Report completion back with full summary when finished.
</USER_REQUEST>
