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
