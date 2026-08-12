# Technisches Gutachten & Systemanalyse: Übungs-Generator (Interactive Practice Mode & Print Version)

## Executive Summary
Dieses Gutachten analysiert die bestehende Systemarchitektur der NachhilfeTest-Anwendung (`c:\Users\beeck\git\repos\NachhilfeTest`) im Hinblick auf die Implementierung des **Übungs-Generators**. 
Der Übungs-Generator baut auf der bestehenden Infrastruktur für Schülerevaluation, Fragenverwaltung (`questions.ts`), Testkonfiguration (`TestConfigurator.tsx`) und Druckfunktionalität (`DiagnosticReportPrint.tsx`) auf.

Die Analyse umfasst drei Schwerpunkte:
1. **Interaktiver Übungsmodus** (Step-by-step Bearbeitung, Sofort-Feedback, Eulen-Maskottchen-Tipps, Timer-Integration, Session-Summary).
2. **Druckbare Version (PDF/Print)** (@media print Styling, Schüler-Arbeitsblatt & separates Lösungsblatt für Nachhilfekräfte/Eltern).
3. **Integration in Benutzeroberfläche & Layout** (Layout.tsx, Router, Lucide-Icons, CSS-Variablen/Tailwind-Kompatibilität, Dark/Light Mode).

---

## 1. Bestandsaufnahme der Systemkomponenten & Abhängigkeiten

### 1.1 Fragen-Datenbank (`src/data/questions.ts`)
- **Struktur**: Enthält statische Fragen (`englishQuestions`) und die dynamische Generierungsfunktion `generateMathQuestion(level, askedIds)`.
- **Themengebiete**:
  - *Mathematik*: Addition, Subtraktion, Zahlenverständnis, Multiplikation, Division, Geometrie, Bruchrechnung, Dezimalrechnung, Prozentrechnung, Gleichungen, Statistik, Negative Zahlen, Potenzen, Wurzelrechnung, Terme, Binomische Formeln.
  - *Englisch*: Vokabeln, Grammatik, Zahlen, Zeiten, Präpositionen, Steigerung, Modalverben, Leseverständnis, Relativsätze, Passiv, Conditionals, Indirekte Rede, Phrasal Verbs, Inversion, Gerund vs Infinitive, Modals in Past.
- **Fragentypen**: `multiple-choice`, `input`, `drag-sort`, `matching`, `fraction-pie`.
- **Zusatzfelder pro Frage**:
  - `storyContext`: Alltags-Szenario / Sachaufgabe.
  - `readingPassage`: Lesetext für Englisch.
  - `diagramData`: Parameter für Geometriediagramme (`GeometryDiagram.tsx`).
  - `explanation`: Schritt-für-Schritt-Lösungsweg.
  - `didYouKnowHint`: Maskottchen-Tipp bei Fehlern.

### 1.2 Schülerauswahl & Historie (`src/context/TestSessionContext.tsx`, `src/utils/sessionHistory.ts`, `src/utils/studentRoster.ts`)
- **Schülerprofil (`StudentProfile`)**: Enthält `id`, `name`, `gradeLevel` (Klassenstufe), `favoriteSubject`, `problemSubject`, `notes`.
- **Schwachstellen-Analyse**: `sessionHistory.ts` stellt Verlaufsdaten (`TestSessionRecord`) mit `topicBreakdown` bereit. Themen mit einer Trefferquote (`accuracy`) < 70% (0.7) können automatisiert als Entwicklungsfelder / "Ausbaubedarf" klassifiziert werden.
- **Aktiver Schüler**: `useTestSession()` stellt `currentStudent`, `selectStudent` und `state.answers` bereit.

### 1.3 Maskottchen-Grafik & Eulen-Tipps (`src/components/DidYouKnowModal.tsx`, `src/components/StudentAvatar.tsx`)
- **Eulen-Maskottchen ("Eule")**: In `DidYouKnowModal.tsx` (Zeilen 63–76) ist ein freundliches SVG-Eulen-Maskottchen mit Doktormutz/Graduation Cap integriert. In `StudentAvatar.tsx` existiert ebenfalls ein `owl_pet` SVG (Zeilen 220–235).
- **Tipp-Display**: Das Eulen-Maskottchen wird zusammen mit `didYouKnowHint` und `explanation` im Feedback-Dialog präsentiert.

### 1.4 Druck- & Export-Technologie (`src/components/DiagnosticReportPrint.tsx`, `src/index.css`)
- **Print-Rules**: `src/index.css` (Zeilen 150–220) und `DiagnosticReportPrint.tsx` definieren ein etabliertes Muster für `@media print`:
  - Ausblenden von UI-Elementen via `.no-print`, `header`, `nav`, `.btn`.
  - `@page` Formatierung: A4 Portrait, `margin: 1.2cm 1.5cm`.
  - Farbtreue erzwingen: `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`.
  - Seitenumbrüche steuern: `page-break-inside: avoid; break-inside: avoid;`.

---

## 2. Detaillierte Architekturentwurf für den Übungs-Generator

### 2.1 Navigation & Routing
1. **Layout Integration (`src/components/Layout.tsx`)**:
   - Hinzufügen eines Navigations-Buttons "Übungs-Generator" im Header-Menü (erreichbar neben "Schüler wechseln", "Roster" und "Dashboard").
   - Icon: Lucide `Sparkles` oder `Wand2` / `BookOpen`.
2. **App Router (`src/App.tsx`)**:
   - Neue Route `<Route path="practice" element={<PracticePage />} />` (bzw. `PracticeGenerator`).

### 2.2 Übungs-Konfigurator (`PracticeConfigurator.tsx` / `PracticeGenerator.tsx`)
1. **Klassenstufen-Kopplung**:
   - Auslesen der Klassenstufe (`gradeLevel`) des aktiven Schülers aus `currentStudent` (z. B. Klasse 5).
   - Zuordnung der relevanten Themenbereiche zur Klassenstufe.
2. **Schwachstellen-Empfehlung ("Ausbaubedarf")**:
   - Abfrage der vergangenen Testergebnisse (`getSessionHistory()`) für den aktuellen Schüler.
   - Berechnung der Genauigkeit pro Thema (`correct / total`). Themen mit `accuracy < 0.70` erhalten das optische Badge "Ausbaubedarf" (z.B. bernsteinfarbenes Warn-Badge `AlertCircle` / `Sparkles`).
3. **Themen- & Stufensteuerung**:
   - Jedes Thema besitzt eine Checkbox (An/Abwählen) und einen Stufen-Regler/Dropdown (Stufe 1–7).
   - Vorbelegung des Ziel-Levels mit dem bisher erreichten Schüler-Level in Fach/Thema.
4. **Globale Parameter**:
   - **Fach**: Mathe, Englisch oder Beide.
   - **Aufgabenanzahl**: 5, 10, 15, 20.
   - **Timer**: Option "Timer deaktivieren" (Checkbox / Toggle).

### 2.3 Aufgaben-Generierungslogik (`src/utils/practiceGenerator.ts`)
1. **Pool-Auswahl & Variationen**:
   - Auswählen geeigneter Fragen aus `questions.ts` für die gewählten Themen und Ziel-Level.
   - **Mathematik-Variationen**: Wenn mehr Aufgaben angefordert werden als statisch in `questions.ts` vorhanden sind, generiert `generateMathQuestion(level)` dynamisch neue Zahlen- und Parameter-Variationen (z.B. Geometrie-Maße, Gleichungskoeffizienten, Bruchwerte).
   - **Englisch-Variationen**: Dynamische Variation von Vokabeln, Lückentext-Sätzen und Satzbau-Arrays (`dragItems`).
2. **Testabdeckung**:
   - Erstellung der Unit-Testsuite `src/tests/practiceGenerator.test.ts` zur Überprüfung der Filterung, Stufenzuweisung, Runden-Generierung und Deduplizierung.

### 2.4 Interaktiver Übungsmodus (`InteractivePracticeSession.tsx`)
1. **Step-by-Step Lösung**:
   - Sequenzielle Anzeige der Aufgaben mit Fortschrittsanzeige (z.B. "Aufgabe 3 von 10").
2. **Sofort-Feedback**:
   - Nach Abgabe der Antwort direktes Feedback (Grüner Banner für Richtig, Roter Banner für Falsch).
3. **Eulen-Maskottchen & Erklärungen**:
   - Einbindung des Eulen-Maskottchens ("Eule") bei Fehlern oder auf Wunsch per Tipp-Button.
   - Anzeige von `explanation` (Schritt-für-Schritt Erklärung) und `didYouKnowHint`.
4. **Timer-Logik**:
   - Wenn Timer aktiviert: Countdown/Elapsed-Timer pro Aufgabe oder Session.
   - Wenn Timer deaktiviert: Kein Zeitdruck, Zeitanzeige ausgeblendet oder rein informativ.
5. **Ergebniszusammenfassung (Summary)**:
   - Übersicht über Gesamtpunkte, Trefferquote, benötigte Zeit.
   - Detaillierte Aufschlüsselung nach Themen (Stärken vs. Ausbaubedarf) und Liste aller bearbeiteten Aufgaben inklusive Musterlösungen.

### 2.5 Druckbare Version / PDF (`PracticePrintView.tsx` / `@media print`)
1. **Modus-Auswahl**:
   - Umschalten zwischen "Interaktiver Übungsmodus" und "Druckansicht (PDF)".
2. **Schüler-Arbeitsblatt (Worksheet)**:
   - Sauberes, professionelles A4-Layout für den Ausdruck.
   - Kopfzeile: Name des Schülers, Datum, Klassenstufe, Fach.
   - Aufgabenstellung mit Schreiblinien/Antwortkästchen, Lesetexten und SVG-Geometrie-Diagrammen.
   - Ausgeblendete Lösungen und Buttons (`.no-print`).
3. **Lösungsblatt (Musterlösung für Nachhilfekräfte / Eltern)**:
   - Separates Blatt im selben Druckdokument (mit `page-break-before: always`).
   - Vollständige Musterlösungen, hervorgehobene Korrektur-Antworten und Schritt-für-Schritt Erklärungen (`explanation`).
4. **CSS `@media print` Optimierung**:
   - `size: A4 portrait; margin: 1.2cm 1.5cm;`.
   - `.no-print` blendet Navigationsleisten, Kontrollbuttons und Interaktionselemente aus.
   - Hintergrundfarben und Umrandungen sind druckoptimiert auf weißem Grund.

---

## 3. UI/UX & Design-System-Konformität

- **Icons**: Benutzung der `lucide-react` Icon-Bibliothek (z.B. `Sparkles`, `Printer`, `FileText`, `CheckCircle2`, `AlertCircle`, `Timer`, `HelpCircle`, `BookOpen`, `RotateCcw`, `Play`).
- **CSS-Variablen**: Weiterverwendung der globalen Theme-Variablen aus `index.css` (`--primary`, `--secondary`, `--border`, `--surface`, `--text-main`, `--radius-md`, `--shadow-md`).
- **Responsive Layout**: Karten und Grids passen sich nahtlos an Desktop, Tablet und Mobilgeräte an.

---

## 4. Verifizierungs- & Test-Strategie

- **Vitest Suite**: `npm run test` (vollständige Ausführung aller 244+ Unit- & Integrationstests).
- **Linter Audit**: `npm run lint` (`oxlint`) mit 0 Fehlern und 0 Warnungen.
- **Regressionstest**: Sicherstellen, dass Student-Switcher (`StudentSwitcherModal.tsx`), TestSessionContext und historische Berichte unbeeinträchtigt bleiben.

