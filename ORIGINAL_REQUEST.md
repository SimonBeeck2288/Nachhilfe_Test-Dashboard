# Original User Request

## 2026-08-16T18:11:41Z

This is a single self-contained feature; keep it small and focused.

Implementierung von Modi für neurodivergente Lernende in der Nachhilfe-Testplattform. Dies umfasst einen "Direkt & Reizarm"-Modus mit sachlich-direkten mathematischen und sprachlichen Fragestellungen (ohne narrative/metaphorische Ausschmückung wie Äpfel-Kontexte), Reizreduktion (keine störenden Animationen, ruhige UI), Speicherung im Schülerprofil mit Schnellwahl vor Teststart und diskreter Kennzeichnung in Diagnostik-Reports.

Working directory: c:\Users\beeck\git\repos\NachhilfeTest
Integrity mode: development

## Requirements

### R1. Datenmodell für Fragen und Profile
- Unterstützung von `directText` (und optional `directStoryContext`) in Fragendefinitionen für sachliche, direkte Formulierungen bei Mathe- und Sprachaufgaben.
- Erweiterung des Schülerprofils um persistente Barrierefreiheits-Einstellungen (`AccessibilitySettings`) mit Presets ("Standard", "Direkt & Reizarm") und Schaltern für `directQuestions` und `reducedSensory`.

### R2. UI-Anpassungen & Reizreduktion
- Schnellwahltasten direkt vor Test- und Übungsbeginn ("Standard" vs. "Direkt & Reizarm").
- Question-Renderer zeigt bei aktivem Direkt-Modus bevorzugt `directText` an und unterdrückt rein narrative Story-Zusätze.
- Reizreduktions-Modus (`reducedSensory`): Deaktivierung von Bounces, überflüssigen Animationen und störenden visuellen Reizen.

### R3. Diskrete Diagnostik & Auswertung
- Unauffällige, dezente Erfassung im Diagnosebericht / Footer (z. B. unauffällige Kennzeichnung `[D/R]`), ohne auffällige Stigmatisierung für Dritte.

## Acceptance Criteria

### Funktionalität & UI
- [ ] Bei Auswahl des Modus "Direkt & Reizarm" werden Textaufgaben als reine Rechenaufgaben / direkte Fragen formuliert.
- [ ] Schnellauswahl vor Teststart schaltet den Modus nahtlos um.
- [ ] Reizreduktion deaktiviert ablenkende Animationen und Effekte.
- [ ] Alle bestehenden und neuen Vitest-Tests laufen zu 100% grün (`npm run test`).
- [ ] `npm run lint` bzw. Build läuft fehlerfrei durch.

## 2026-08-17T18:51:38Z

This is a single self-contained fix; keep it small and focused.

Implement a 5–10 minute Neurodiversity A/B Comparison Diagnostic Test mode in the Nachhilfe Test Dashboard that compares student comprehension and solving speed between standard narrative questions and direct & sensory-reduced ("Direkt & Reizarm") questions.

Working directory: /Users/Simon.Beeck/projects/Nachhilfe_Test-Dashboard
Integrity mode: development

## Requirements

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

## Verification Resources
- Existing Vitest test suite (`npm run test` or `npx vitest run`) covering neurodivergent modes, question generation, and session history.
- Linter (`npm run lint`).

## Acceptance Criteria

### Automated Test Suite
- [ ] New unit and integration tests added in `src/tests/ab_mode_test.test.ts` verifying mode alternation, answer tagging with `modeVariant`, calculation of comparative accuracy/speed metrics, and auto-recommendation conditions.
- [ ] 100% of all test suites (`npm run test`) pass cleanly with zero regressions.
- [ ] Linter check (`npm run lint`) passes with zero errors.

### Functional Verification
- [ ] "A/B Diagnose: Standard vs. Direkt & Reizarm" preset can be selected in Test Configurator and launches the test session.
- [ ] Questions alternate between standard narrative and direct phrasing without visual badges during testing.
- [ ] Dashboard displays side-by-side accuracy and speed comparison cards with delta analysis.
- [ ] Clicking "Direkt & Reizarm Modus dauerhaft aktivieren" updates the student's profile accessibility settings.
- [ ] Printable diagnostic report includes the A/B comparison breakdown.

