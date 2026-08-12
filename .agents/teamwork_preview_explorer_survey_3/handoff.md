# Technical Survey Handoff Report: Übungs-Generator (Interactive Practice Mode & Print Version)

## 1. Observation
- **Original Requirements**: `ORIGINAL_REQUEST.md` (Zeilen 108–146) fordert die Erstellung eines vollfunktionsfähigen **Übungs-Generators** mit:
  1. Navigationspunkt "Übungs-Generator" in `Layout.tsx`.
  2. Schülerspezifischer Konfiguration (Klassenstufe des aktiven Schülers, automatische Themenauflistung, Schwachstellen-Markierung "Ausbaubedarf" bei Trefferquote < 70%).
  3. Themenauswahl & individuellen Ziel-Leveln (Stufe 1–7), Fachauswahl (Mathe, Englisch, Beide), Aufgabenanzahl (5, 10, 15, 20) und Timer-Deaktivierung.
  4. Interaktivem Übungsmodus mit Step-by-step Lösung, Sofort-Feedback, Erklärungen, Maskottchen-Tipps ("Eule"), Timer und Ergebniszusammenfassung.
  5. Druckbarer Ansicht (`@media print`) mit formatierte Schüler-Arbeitsblatt und separater Musterlösung (Lösungsblatt) für Nachhilfekräfte/Eltern.
- **Bestehende Fragen- & Generierungsstruktur**: `src/data/questions.ts` bietet statische Fragen und die Hilfsfunktion `generateMathQuestion(level, askedIds)` (Zeilen 550–920).
- **Maskottchen & Tipps**: `src/components/DidYouKnowModal.tsx` (Zeilen 63–76) enthält ein SVG-Eulen-Maskottchen mit Doktormütze, das zusammen mit `explanation` und `didYouKnowHint` aus `questions.ts` verwendet werden kann.
- **Print-Setup**: `src/components/DiagnosticReportPrint.tsx` und `src/index.css` (Zeilen 150–220) beinhalten etablierte `@media print`-Regeln (`size: A4 portrait`, `.no-print`, `-webkit-print-color-adjust: exact`).
- **Testinfrastruktur**: `package.json` nutzt `vitest` (`npm run test`) und `oxlint` (`npm run lint`). Sämtliche 244 bestehende Tests passieren fehlerfrei.

## 2. Logic Chain
1. **Navigationsanbindung**: `Layout.tsx` bindet einen Hauptmenü-Button "Übungs-Generator" ein, der auf die neue Route `/practice` in `App.tsx` verweist.
2. **Schülerspezifische Initialisierung**: Der Übungs-Generator liest über `useTestSession()` das `currentStudent`-Objekt aus. Die Klassenstufe bestimmt die angezeigten Themen.
3. **Schwachstellen-Erkennung**: Durch Auslesen der bisherigen Testverläufe aus `getSessionHistory()` werden Themen mit einer Genauigkeit von unter 70% identifiziert und visuell mit dem Ausbaubedarf-Badge hervorgehoben.
4. **Aufgaben-Generierungs-Engine**: Eine Utility-Funktion (`practiceGenerator.ts`) wählt Fragen passend zu den eingestellten Ziel-Leveln. Bei Überbuchung werden dynamische Parameter-Variationen (Mathe) und Text-Variationen (Englisch) erzeugt.
5. **Zwei Betriebs-Modi**:
   - **Interaktiver Modus**: Führt Schritt für Schritt durch die Aufgaben, gibt sofortiges Feedback, zeigt auf Wunsch/Fehler das Eulen-Maskottchen mit Tipps (`DidYouKnowModal`), respektiert die Timer-Einstellung und schließt mit einer Score-Zusammenfassung ab.
   - **Druck-Modus**: Generiert ein zweiseitiges/zweiteiliges Dokument. Teil 1 ist das ungelöste Arbeitsblatt für den Schüler. Teil 2 ist das Lösungsblatt mit Musterlösungen und Erklärungen für Eltern/Tutoren. `@media print` blendet Steuerungselemente sauber aus.

## 3. Caveats
- Die dynamische Generierung von Englisch-Variationen erfordert sorgfältige Satzstrukturen, damit Grammatikregeln und Übersetzungsmuster syntaktisch korrekt bleiben.
- Bei deaktiviertem Timer im interaktiven Modus sollte die Zeitmessung entweder gestoppt oder rein informativ für die Auswertung im Hintergrund mitgeführt werden.

## 4. Conclusion
Die technische Architektur des NachhilfeTest-Codebases bietet eine hervorragende Basis für den Übungs-Generator. Alle benötigten Bausteine (Fragendatenbank, Maskottchen-SVGs, Schülerprofile, Historie-Auswertung, Print-Styles) sind bereits etabliert und können in einer sauberen, modular aufgebauten Übungs-Generator-Komponente zusammengeführt werden.

## 5. Verification Method
1. **Build & Lint Verification**:
   - `npm run lint` (oxlint muss mit 0 Warnings und 0 Errors durchlaufen).
   - `npm run build` (TypeScript Compiler & Vite Build müssen fehlerfrei abschließen).
2. **Test Suite Verification**:
   - `npm run test` (Alle bestehenden 244 Tests sowie die neuen Unit-Tests in `src/tests/practiceGenerator.test.ts` müssen zu 100% grün bestehen).
3. **Manuelle & Fachliche Überprüfung**:
   - Navigationslink "Übungs-Generator" im Header anklicken.
   - Wechsel des Schülers prüft dynamische Anpassung von Klassenstufe und Schwachstellen-Badges.
   - Interaktiven Übungsmodus durchspielen (Sofort-Feedback, Eulen-Tipps, Timer-Toggle, Summary).
   - Druckvorschau (`window.print()`) ausführen und Layout von Schüler-Arbeitsblatt und Lösungsblatt verifizieren.
