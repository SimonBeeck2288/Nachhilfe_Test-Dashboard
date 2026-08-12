# Original User Request

## Initial Request — 2026-08-04T01:02:33Z

Audit the codebase for code quality, technical debt, UI/UX consistency, and accessibility issues. Resolve any identified problems, ensuring automated tests, builds, and runtime run smoothly.

Working directory: c:/Users/beeck/git/repos/NachhilfeTest
Integrity mode: development

## Requirements

### R1. Code Quality & Technical Debt Audit
Perform a comprehensive scan across TypeScript/JavaScript source files, CSS, test files, and configurations to identify technical debt, linting warnings, dead code, architectural smells, type errors, or unhandled edge cases.

### R2. UI/UX & Accessibility Audit
Inspect components and styling for visual consistency, responsive design, contrast, and standard ARIA/accessibility best practices.

### R3. Refactoring & Debt Resolution
Refactor and resolve identified technical debt, lint/type issues, and UI/accessibility flaws without breaking existing functionality or changing external contracts unexpectedly.

### R4. Smooth Runtime & Full Verification
Ensure the web application compiles cleanly (`npm run build`), unit/integration tests pass without error (`npm test`), and dev server or runtime executes smoothly.

## Acceptance Criteria

### Build, Types & Linting
- [ ] `npm run build` / `tsc` completes with 0 errors.
- [ ] `npm run lint` (`oxlint`) passes with 0 warnings or errors.

### Functionality & Tests
- [ ] `npm test` (`vitest`) executes and passes all test suites.
- [ ] Code modifications preserve all existing features and user flows.

### UI/UX & Accessibility
- [ ] Key components have proper interactive states, modern styling, and accessible markup (semantic tags, labels, ARIA roles where needed).

## Follow-up — 2026-08-07T01:35:59Z

Implement a Student Switcher UI feature for the tutoring test app (`NachhilfeTest`), and build comprehensive technical and professional/domain (fachlich) verification using dual specialized domain testing agents (`@3.1-fachTest` and `@3.2-fachAuditor`) to ensure zero software defects.

Working directory: c:/Users/beeck/git/repos/NachhilfeTest
Integrity mode: development

## Requirements

### R1. Student Switcher UI & State Management
- Add a prominent "Schüler wechseln" button in the global navigation header (accessible at any time) as well as a selector on the start screen.
- Support creating new student profiles and switching between existing student profiles seamlessly.
- Guarantee active student state updates cleanly across English, Math, Dashboard, and historical stats without any state leakage between profiles.

### R2. Technical & Domain Automated Vitest Suite
- Expand unit & integration test coverage under [`src/tests/`](file:///c:/Users/beeck/git/repos/NachhilfeTest/src/tests) for:
  1. Student switching state updates, profile persistence, and deduplication history per student ID.
  2. Adaptive English level preservation and question exhaustion fallback logic.
  3. Math dynamic formula generation, answer scoring, and level adjustments.
  4. Intermission, break timing, and feedback halt modal (`DidYouKnowModal`) logic.
- Ensure 100% of Vitest test suites pass (`npm run test`) and no linter errors exist (`npm run lint`).

### R3. Dual Pedagogical & UX Professional Audit (`@3.1-fachTest` & `@3.2-fachAuditor`)
- Deploy `@3.1-fachTest` and `@3.2-fachAuditor` to conduct an uncompromising domain audit covering:
  - Pedagogical progression & scaffolding quality across question difficulty levels (A1 to C1+).
  - Domain-specific UX usability (continuous questioning flow, timer behavior, explanation clarity, break timings).
  - Student profile isolation and edge-case handling.
- Record comprehensive audit results and zero-fault validation in `DOMAIN_REVIEW.md`.

## Acceptance Criteria

### UI & Student Management
- [ ] "Schüler wechseln" button visible in the top header and start screen.
- [ ] Selecting or adding a student switches all persistent history, level progress, and session stats to the selected student with zero cross-student contamination.

### Automated Testing & Linting
- [ ] `npm run test` completes with 100% pass rate across all unit and integration test suites.
- [ ] `npm run lint` completes with 0 linter warnings or errors.

### Professional / Pedagogical (Fachlich) Verification
- [ ] `@3.1-fachTest` and `@3.2-fachAuditor` agents complete thorough audit.
- [ ] `DOMAIN_REVIEW.md` updated with comprehensive domain verification report covering pedagogical scaffolding, adaptive mechanics, timer UX, and zero-fault assurance.

## Follow-up — 2026-08-08T09:59:00Z

Präzise und gleichmäßige Ausführung der Pausenzeit und Zwischenpausen-Timer (MeditativeIntermission) zwischen den Modultests ohne Timer-Drift oder Verlangsamung.

Working directory: c:\Users\beeck\git\repos\NachhilfeTest
Integrity mode: development

## Requirements

### R1. Stabile und ununterbrochene Timer-Intervalle in MeditativeIntermission
Behebe die ungleichmäßige und verlangsamte Ausführung des Pausentimers in MeditativeIntermission.tsx. Der Intervall-Timer soll stabil laufen, ohne bei jedem Sekundenschritt (timeLeft) den Intervall-Timer neu zu erstellen und abzubrechen.

### R2. Zuverlässige Entkopplung von State-Re-Renders und Timer-Ticks
Sicherstellen, dass Re-Renders der Elternkomponenten oder Context-Updates (TestSessionContext) den Countdown der Pausenzeit zwischen den Tests nicht verzögern oder stoppen.

### R3. Testsuite-Integrität und Regressionsfreiheit
Alle bestehenden Unit- und Integrationstests (npm run test) müssen nach der Anpassung weiterhin 100% grün und ohne Fehler durchlaufen.

## Acceptance Criteria

### Timing & Performance
- [ ] Der Pausentimer in MeditativeIntermission.tsx zählt gleichmäßig in 1-Sekunden-Intervallen von 90 herunter, ohne langsamer zu werden.
- [ ] Bei Ablauf der Pausenzeit (0s) oder Klick auf "Weiter" wird der Übergang zum nächsten Modul zuverlässig ausgelöst.

### Code Quality & Tests
- [ ] npm run test (Vitest) läuft zu 100 % ohne Fehler durch.
- [ ] npm run lint meldet keine Syntax- oder Type-Fehler.

## Follow-up — 2026-08-09T02:42:00Z

Erstellung eines vollfunktionsfähigen **Übungs-Generators** für ein Nachhilfe-Diagnose-System. Das Feature ermöglicht die gezielte Generierung von Übungsaufgaben für Schüler basierend auf ihrer Klassenstufe, vergangenen Schwachstellen und individuell anpassbaren Ziel-Leveln pro Thema.

Working directory: c:\Users\beeck\git\repos\NachhilfeTest
Integrity mode: development

## Requirements

### R1. Navigation & Konfiguration
- Ein eigener Navigationspunkt "Übungs-Generator" im Hauptmenü/Header (Layout.tsx), der jederzeit erreichbar ist.
- Anzeige der Klassenstufe des aktiven Schülers und automatisches Auflisten aller Themen dieser Klassenstufe.
- Themen mit Schwachstellen (Trefferquote < 70% in vergangenen Tests) werden optisch als Empfehlung ("Ausbaubedarf") markiert.
- Jedes Thema kann manuell an-/abgewählt werden und besitzt ein eigenes Ziel-Level (Stufe 1–7), vorbelegt mit dem erreichten Niveau des Schülers.
- Einstellungen für Fach (Mathe, Englisch, Beide), Gesamtzahl der Aufgaben (5, 10, 15, 20) und Option zur Deaktivierung des Timers.

### R2. Aufgaben-Generierung & Variationen
- Auswahl passender Fragen aus der Fragedatenbank (questions.ts) für gewählte Themen und Ziel-Level.
- Dynamische Generierung von Parameter-/Zahlenvariationen für Mathe und Textvariationen für Englisch, falls mehr Aufgaben angefordert werden als vorhanden sind.

### R3. Interaktiver Übungsmodus & Druckversion (PDF/Print)
- Interaktiver Modus mit Schritt-für-Schritt-Aufgabenbearbeitung, Sofort-Feedback, Erklärungen, Mascot-Tipps und Ergebniszusammenfassung.
- Druckbare Ansicht (@media print) mit formatierter Aufgabenansicht für Schüler und separater Musterlösungsseite für Nachhilfekräfte/Eltern.

### R4. Testabdeckung & Qualitätssicherung
- Umfassende Vitest-Unit-Tests zur Verifizierung der Generierungslogik, Level-Filterung und Variationen (practiceGenerator.test.ts).
- Sämtliche bestehende 244 Tests sowie alle neuen Tests müssen zu 100% fehlerfrei bestehen (npm run test).

## Acceptance Criteria

### Funktionalität & UI
- [ ] Der Navigationslink "Übungs-Generator" öffnet zuverlässig die Konfigurationsseite.
- [ ] Das Wechseln des aktiven Schülers aktualisiert die angezeigte Klasse, Themen und Schwachstellen-Empfehlungen dynamisch.
- [ ] Jedes Thema bietet ein voll funktionsfähiges Ziel-Level Dropdown/Slider (Stufe 1–7).
- [ ] Der interaktive Übungsmodus führt durch alle generierten Aufgaben mit Auswertung und Lösungsanzeige.
- [ ] Die Druckansicht stellt Arbeitsblatt und Lösungsblatt druckoptimiert dar.

### Qualität & Verifizierung
- [ ] `npm run test` (Vitest) läuft zu 100% erfolgreich ohne Fehlschläge durch.
- [ ] TypeScript-Typisierung ist vollständig und fehlerfrei.

## Follow-up — 2026-08-09T20:46:06Z

# Teamwork Project Prompt

Build a **permanently 100% free, zero-running-cost AI tutoring integration** for **NachhilfeTest**, featuring a direct link to the custom **NachhilfeTest Gemini Gem** (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`), a **Picture-in-Picture Sidecar window**, direct pre-filled prompt URLs for free web AI tools (ChatGPT, HuggingChat), and an **expanded Student Profile** (hobbies, strengths, weaknesses, learning styles).

Working directory: `c:\Users\beeck\git\repos\NachhilfeTest`
Integrity mode: development

## Requirements

### R1. Student Profile Expansion (`student.ts`, `studentRoster.ts`, `StudentSwitcherModal.tsx`)
Extend `StudentProfile` to include structured personality and learning data (`hobbies: string[]`, `learningPreferences: string[]`, `customNotes: string`). Update storage logic in `studentRoster.ts` and add tag-selector and text-input UI in `StudentSwitcherModal.tsx` so users/tutors can easily select/enter student hobbies (e.g. *Gaming, Fußball, Minecraft, Musik*) and preferred learning styles (e.g. *Mit Hobbys erklären, Schritt-für-Schritt, Visuell*).

### R2. Modular Zero-Cost AI Prompt Engine (`aiPromptGenerator.ts`)
Create a modular prompt engine that dynamically compiles 3 contextual prompt modes for Google Gemini Gem:
1. 🎓 **Sokratische Hilfestellung**: Step-by-step guidance without direct solutions.
2. 💡 **Personalisierte Erklärung**: Explaining concepts with analogies from student hobbies.
3. 📝 **3 Neue Übungsaufgaben**: Generating 3 new practice problems matching student level and interests.
Inject 3 data sources into every prompt: Student personality (hobbies, learning preferences), Empirical test performance (strengths, weaknesses, topic accuracy), and Question Context (subject, topic, level, question text, user's wrong answer).

### R3. Reusable Gemini Gem Modal & Sidecar Launcher (`AiPromptModal.tsx`)
Build a reusable React modal component (`AiPromptModal.tsx`) featuring:
- Tabbed selector for the 3 prompt modes.
- Live editable preview of the generated prompt.
- Primary **"NachhilfeTest Gem öffnen (Sidecar)"** button that automatically copies the prompt to the clipboard and opens `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing` in a `480x750` picture-in-picture popup window.
- Secondary direct links for ChatGPT (`https://chatgpt.com/?q=...`) and HuggingChat (`https://huggingchat.co/chat?q=...`) with pre-filled prompt parameters.
- Toast feedback confirming clipboard copy.

### R4. View Integrations (`PracticeSessionView.tsx`, `Dashboard.tsx`, `DiagnosticReportPrint.tsx`)
Integrate "KI-Tutor Gem Hilfe" buttons in:
- Practice session feedback view (`PracticeSessionView.tsx`).
- Summary dashboard weak topics and bookmarked questions (`Dashboard.tsx`).
- Printable diagnostic report (`DiagnosticReportPrint.tsx`).

### R5. Architectural Documentation (`AI_PROMPT_GUIDELINES.md` & `PROJECT.md`)
Document the Zero-Cost Gemini Gem prompt engine architecture in `AI_PROMPT_GUIDELINES.md` and update `PROJECT.md` so future developer agents can easily export pre-formatted prompts to the Gemini Gem.

## Acceptance Criteria

### Student Profile & Roster
- [ ] `StudentProfile` contains `hobbies`, `learningPreferences`, and `customNotes`.
- [ ] `StudentSwitcherModal.tsx` allows adding/editing preset and custom hobby tags and learning preferences.
- [ ] Roster persistence functions in `studentRoster.ts` save and restore all new profile fields without data loss.

### AI Prompt Engine & Gemini Gem Integration
- [ ] `aiPromptGenerator.ts` exports `generateGeminiPrompt()` and correctly injects student hobbies, strengths/weaknesses, and question context.
- [ ] `AiPromptModal.tsx` includes a primary button pointing directly to `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`.
- [ ] Clicking the Gem button copies the prompt text to the clipboard and opens the Gem link in a `480x750` sidecar window (`window.open`).

### View Integrations & Tests
- [ ] "KI-Tutor Gem Hilfe" buttons trigger the modal in `PracticeSessionView.tsx`, `Dashboard.tsx`, and `DiagnosticReportPrint.tsx`.
- [ ] Unit tests in `src/tests/ai_prompt_generator.test.ts` pass cleanly for all prompt modes and edge cases.
- [ ] 100% of the Vitest test suite (`npm run test`) and `npm run lint` pass cleanly with zero regressions.

