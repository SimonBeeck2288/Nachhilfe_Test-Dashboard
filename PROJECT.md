# Project: NachhilfeTest — Diagnostic & Zero-Cost AI Tutoring Platform

## Comprehensive Overview
**NachhilfeTest** is a high-performance, adaptive diagnostic and practice platform engineered for German tutoring (Mathematik, Englisch, and Cognition/Stroop testing). The application provides adaptive level placement based on Item Response Theory (IRT), empirical student performance analytics, custom practice worksheet generation, printable 1-page parent-tutor diagnostic reports, and a client-side **Zero-Cost AI Tutoring Integration** leveraging Google Gemini Gems.

---

## Tech Stack
- **Framework & Build System**: React 18, Vite, TypeScript
- **Styling & UI Components**: Tailwind CSS, Lucide React icons, CSS `@media print` styling
- **Testing & Verification**: Vitest (350+ unit and integration tests across 42 test suites)
- **Linter & Static Analysis**: Oxlint (0 errors)

---

## Architecture & Code Layout Map

```
NachhilfeTest/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── AI_PROMPT_GUIDELINES.md     # Comprehensive Zero-Cost AI Integration guidelines
├── PROJECT.md                  # Project overview, architecture, feature inventory & verification
├── DOMAIN_REVIEW.md            # Domain expert review & requirements
├── src/
│   ├── types/
│   │   ├── student.ts          # StudentProfile type (name, grade, hobbies, learningPreferences, customNotes)
│   │   ├── questions.ts        # Question bank schemas & topic definitions
│   │   ├── history.ts          # TestSessionRecord & diagnostic history data types
│   │   └── practice.ts         # PracticeGeneratorConfig & GeneratedExerciseItem types
│   ├── utils/
│   │   ├── studentRoster.ts    # Student profile storage, roster CRUD, migration fallbacks
│   │   ├── evaluation.ts       # Tolerant answer evaluation (Math decimals/fractions, English articles)
│   │   ├── adaptive.ts         # IRT adaptive scoring algorithm & level proposal engine
│   │   ├── practiceGenerator.ts# Dynamic & empirical practice worksheet generator
│   │   └── aiPromptGenerator.ts# Zero-Cost AI prompt compiler (Socratic, Personalized, Practice Tasks)
│   ├── context/
│   │   └── TestSessionContext.tsx # Central test execution state, timer control, pause pool, bookmarking
│   ├── components/
│   │   ├── Layout.tsx               # Main navigation header & student profile switcher
│   │   ├── StudentSwitcherModal.tsx # Student profile selection & hobby/preference editor
│   │   ├── QuestionRenderer.tsx     # Timed question renderer with speech TTS & controls
│   │   ├── DiagnosticReportPrint.tsx# Printable 1-page A4 parent-tutor summary report
│   │   ├── AiPromptModal.tsx        # Gemini Gem sidecar launcher & prompt compiler modal
│   │   ├── PracticeConfigView.tsx   # Custom practice sheet configuration UI
│   │   ├── PracticeSessionView.tsx  # Interactive practice mode execution with AI tutor trigger
│   │   └── minigames/               # Apple Catcher, Bubble Popper, Meditative Intermissions
│   ├── pages/
│   │   ├── Home.tsx                 # Landing page & subject selection
│   │   ├── ModuleMath.tsx           # Adaptive Math diagnostic module
│   │   ├── ModuleEnglish.tsx        # Adaptive English diagnostic module
│   │   ├── ModuleCognition.tsx      # Stroop cognitive test module
│   │   └── Dashboard.tsx            # Student performance dashboard & PDF print launcher
│   └── tests/                       # 42 Vitest test suites (350+ unit and integration tests)
```

---

## Complete Feature Inventory

| # | Requirement / Feature | Description | File References | Status |
|---|------------------------|-------------|-----------------|--------|
| 1 | **R1. Warm-up & Student Profile State Persistence** | Extended `StudentProfile` interface with `hobbies`, `learningPreferences`, `customNotes`. Added local storage roster persistence, migration defaults, and preset tag pickers in `StudentSwitcherModal.tsx`. | `src/types/student.ts`, `src/utils/studentRoster.ts`, `StudentSwitcherModal.tsx` | VERIFIED CLEAN |
| 2 | **R2. Tolerant Answer Evaluation** | Smart answer comparison logic handling whitespace, casing, punctuation, English articles (*a/an/the*), decimal commas/dots (`5,0` == `5.0`), and fraction equivalence (`2/4` == `0.5`). | `src/utils/evaluation.ts`, `evaluation.test.ts` | VERIFIED CLEAN |
| 3 | **R3. Stroop Test Keyboard Visualization & Ergonomic Intermissions** | Added keyboard shortcut indicators for Stroop color testing and integrated interactive intermission minigames (Apple Catcher, Bubble Popper, Meditative Intermission). | `ModuleCognition.tsx`, `MiniGameIntermission.tsx` | VERIFIED CLEAN |
| 4 | **R4. Adaptivity Stability & Empirical Analytics** | Stable Item Response Theory (IRT) scoring, topic accuracy calculation, and empirical practice sheet generation seeding weak topics. | `src/utils/adaptive.ts`, `src/utils/practiceGenerator.ts` | VERIFIED CLEAN |
| 5 | **R5. English Question Bank & Passage Expansion** | Expanded English question bank covering levels e1–e7 with balanced MC choices and reading comprehension passages. | `src/data/questions.ts`, `english_adaptive_expansion.test.ts` | VERIFIED CLEAN |
| 6 | **R6. Printable PDF Diagnostic Report** | Created `DiagnosticReportPrint.tsx` rendering a 1-page A4 print summary report with diagnostic levels, topic breakdown, interactive `tutorNotes` textarea, and print buttons in `Dashboard.tsx`. | `DiagnosticReportPrint.tsx`, `Dashboard.tsx` | VERIFIED CLEAN |
| 7 | **Zero-Cost AI Tutoring Integration** | Client-side AI prompt compiler generating 3 prompt modes (*Sokratisch*, *Personalisiert*, *Übungsaufgaben*) with 3 injected data sources (*Personality*, *Empirical Performance*, *Question Context*), live preview modal, auto-clipboard copy, and Gemini Gem Sidecar window launcher (`480x750` to `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`). | `src/utils/aiPromptGenerator.ts`, `AiPromptModal.tsx`, `PracticeSessionView.tsx`, `Dashboard.tsx`, `DiagnosticReportPrint.tsx` | VERIFIED CLEAN |

---

## Test & Build Verification Instructions

### 1. Test Suite Execution (`npm run test`)
To run all 42 Vitest test suites (350 tests) in headless mode:
```bash
npm run test
```
*Expected Result*: All 42 test files pass cleanly with 100% success rate.

### 2. Linter Verification (`npm run lint`)
To execute static code analysis using Oxlint:
```bash
npm run lint
```
*Expected Result*: 0 errors.

### 3. Production Build Verification (`npm run build`)
To compile TypeScript source files and bundle production artifacts using Vite:
```bash
npm run build
```
*Expected Result*: Successful Vite build output in `./dist` with 0 TypeScript compilation errors.
