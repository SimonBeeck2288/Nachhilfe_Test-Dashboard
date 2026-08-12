# Explorer 3 Architecture, Docs & Test Suite Investigation Report

**Project**: NachhilfeTest (Tutoring Diagnostic System)  
**Explorer Role**: Architecture, Docs & Test Suite Explorer  
**Date**: 2026-08-09  
**Working Directory**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3`  
**Target Analysis File**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3\analysis.md`

---

## Executive Summary
This report presents a thorough architectural, testing, and documentation analysis for building a **permanently 100% free, zero-running-cost AI tutoring integration** for `NachhilfeTest`. The integration centers on a custom Google Gemini Gem (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`), a Picture-in-Picture Sidecar window launcher (`480x750`), fallback pre-filled prompt tools (ChatGPT, HuggingChat), and expanded student profile personality data (hobbies, learning preferences, notes).

---

## 1. Existing Test Suite Structure & Vitest / Linting Infrastructure

### 1.1 Test Suite Inventory
The project features 27 active Vitest test files in `src/tests/`:
- `student_switching.test.ts` — Profile persistence, roster CRUD, per-student history isolation.
- `practiceGenerator.test.ts` — Practice sheet generation, Mulberry32 PRNG determinism, topic accuracy.
- `math_dynamic_expansion.test.ts` — Math formula variations, difficulty levels 1–7, answer scoring.
- `english_adaptive_expansion.test.ts` — Adaptive English level adjustments, question fallback logic.
- `intermission_modal_expansion.test.ts` — Meditative & minigame intermission timing and break controls.
- `pause_pool.test.ts` — 90s shared pause pool countdown and suspension logic.
- `bookmarking.test.ts` — Question flagging and summary bookmark badge rendering.
- `back_button_navigation.test.ts` — Step-back navigation and answer stack state restoration.
- `challenger_m1_1.test.ts` through `challenger_m4_2_stress.test.ts` — Edge-case and stress test suites.
- `e2e_scenarios.test.ts` — Full user journey end-to-end integration flows.

### 1.2 Execution & Configuration
- **Test Runner Command**: `npm run test` (executes `npx vitest run`).
- **Vitest Version**: `vitest` ^4.1.10.
- **Node Test Environment & LocalStorage Polyfill**: Vitest runs in Node 22 environment. Files safely polyfill `localStorage` using a `Map<string, string>` fallback pattern or global mock.
- **Linter**: `oxlint` ^1.75.0 (run via `npm run lint`). Enforces 0 linter warnings or errors across all files.

### 1.3 Requirements for `src/tests/ai_prompt_generator.test.ts`
The new test file must verify:
1. **Prompt Mode Compilation**:
   - `socratic`: Verifies Socratic guidance instructions (no direct answers, 1–2 guiding questions).
   - `personalized`: Verifies hobby-based analogies (e.g. Gaming, Fußball, Minecraft).
   - `practice_tasks`: Verifies generation of 3 new exercises with hobby integration and answer key.
2. **Data Source Ingestion**:
   - Ingestion of student personality (`hobbies`, `learningPreferences`, `customNotes`).
   - Ingestion of empirical test performance (weak topics < 70%, strong topics >= 70%, overall accuracy).
   - Ingestion of question context (`subject`, `topic`, `level`, `questionText`, `userAnswer`, `correctAnswer`).
3. **Edge Case Handling**:
   - Fallback when student profile has no hobbies or empty arrays.
   - Fallback when student is a guest (`guest`) or profile is undefined.
   - Fallback when user answer is missing or question was skipped.
   - Handling of special characters in prompt text.
4. **URL Utility Functions**:
   - Verification of `encodePromptForUrl`, `getGeminiGemUrl`, `getChatGPTUrl`, and `getHuggingChatUrl`.

---

## 2. Documentation Architecture & Audit (`PROJECT.md` & `AGENTS.md`)

### 2.1 Existing Documentation Overview
- **`PROJECT.md`**: Master architecture doc tracking feature inventory, milestones (M1–M4 marked DONE), interface contracts, and code layout. Needs updating for Milestone M5 ("Zero-Cost Gemini Gem AI Integration").
- **`AGENTS.md`**: Agent testing rules requiring 100% test suite pass rate (`npm run test`) and 0 linter errors (`npm run lint`).
- **`DOMAIN_REVIEW.md`**: Pedagogical and domain-specific audit logs.
- **`TEST_INFRA.md` & `TEST_READY.md`**: E2E test tier specifications.

### 2.2 Requirements for `AI_PROMPT_GUIDELINES.md`
A dedicated architectural document `AI_PROMPT_GUIDELINES.md` must be created in the project root containing:
1. **System Overview**: Zero-running-cost architecture using Google Gemini Gem (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`).
2. **Data Pipeline Blueprint**:
   ```
   [Student Personality] + [Empirical Stats] + [Question Context]
                            │
                            ▼
               aiPromptGenerator.ts (Compiler)
                            │
                            ▼
              AiPromptModal.tsx (Live Editor)
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   navigator.clipboard             window.open()
   (Copies Prompt)            (480x750 Sidecar Window)
   ```
3. **Mode Specifications**: Detailed breakdown of System Instructions and templates for Socratic, Personalized, and 3-Practice-Tasks modes.
4. **Integration Map**: Documentation of trigger buttons in `PracticeSessionView.tsx`, `Dashboard.tsx`, and `DiagnosticReportPrint.tsx`.
5. **Developer Extension Guide**: How future developer agents can add new prompt modes or customize system instructions.

### 2.3 Required Updates to `PROJECT.md`
- **Milestones**: Add `M5: Zero-Cost Gemini Gem AI Integration`.
- **Feature Inventory**:
  - Feature 10: R1. Student Profile Expansion (`hobbies`, `learningPreferences`, `customNotes`, UI tag selector).
  - Feature 11: R2. Modular Zero-Cost AI Prompt Engine (`aiPromptGenerator.ts`).
  - Feature 12: R3. Reusable Gemini Gem Modal & Sidecar Launcher (`AiPromptModal.tsx`).
  - Feature 13: R4. View Integrations (`PracticeSessionView`, `Dashboard`, `DiagnosticReportPrint`).
  - Feature 14: R5. Architectural Documentation (`AI_PROMPT_GUIDELINES.md` & `PROJECT.md` update).
- **Interface Contracts**: Document contracts for `aiPromptGenerator` and `AiPromptModal`.
- **Code Layout**: Include new utilities, components, tests, and guideline files.

---

## 3. Modular Zero-Cost AI Prompt Engine (`aiPromptGenerator.ts`)

### 3.1 Data Structures & Contracts
Location: `src/utils/aiPromptGenerator.ts`

```typescript
export type AiPromptMode = 'socratic' | 'personalized' | 'practice_tasks';

export interface QuestionPromptContext {
  subject: 'math' | 'english' | 'cognition';
  topic: string;
  level: number;
  questionText: string;
  correctAnswer?: string;
  userAnswer?: string;
  mascotTip?: string;
  explanation?: string;
}

export interface StudentPromptProfile {
  name: string;
  gradeLevel: number | string;
  hobbies?: string[];
  learningPreferences?: string[];
  customNotes?: string;
  favoriteSubject?: string;
  problemSubject?: string;
}

export interface EmpiricalStatsContext {
  weakTopics?: Array<{ topic: string; accuracy: number }>;
  strongTopics?: Array<{ topic: string; accuracy: number }>;
  overallAccuracy?: number;
}
```

### 3.2 Prompt Compilation Pipeline
The main export `generateGeminiPrompt` compiles prompts in 5 structured sections:

1. **System Persona Header**:
   ```text
   Du bist der virtuelle KI-Tutor für das Diagnosesystem NachhilfeTest.
   Deine Aufgabe ist es, Schülern empathisch, altersgerecht und didaktisch wertvoll zu helfen.
   ```

2. **Student Profile Ingestion**:
   ```text
   👤 SCHÜLER-PROFIL:
   - Name: {studentProfile.name} (Klasse {studentProfile.gradeLevel})
   - Hobbys & Interessen: {hobbies.join(', ') || 'Allgemeine Themen (Gaming, Sport)'}
   - Bevorzugte Lernformen: {learningPreferences.join(', ') || 'Schritt-für-Schritt, Visuell'}
   - Zusatznotizen: {customNotes || 'Keine'}
   ```

3. **Empirical Performance Ingestion**:
   ```text
   📊 BISHERIGER LERNFORTSCHRITT:
   - Stärken (≥70% Trefferquote): {strongTopics}
   - Entwicklungsfelder (<70% Trefferquote): {weakTopics}
   - Gesamtergebnis: {overallAccuracy}%
   ```

4. **Question Context Ingestion**:
   ```text
   ❓ AKTUELLE AUFGABE & KONTEXT:
   - Fach & Thema: {subject} • {topic} (Stufe {level})
   - Aufgabenstellung: "{questionText}"
   - Falsche Antwort des Schülers: "{userAnswer || 'Keine Antwort abgegeben'}"
   - Musterlösung: "{correctAnswer}"
   - Erklärung: "{explanation}"
   ```

5. **Mode-Specific Directives**:
   - **`socratic`**:
     ```text
     🎓 AUFTRAG (Sokratische Hilfestellung):
     Führe den Schüler schrittweise mit gezielten Denkfragen zur richtigen Lösung, OHNE die finale Antwort direkt zu verraten. Stelle genau 1-2 verständliche Einstiegsfragen.
     ```
   - **`personalized`**:
     ```text
     💡 AUFTRAG (Personalisierte Erklärung):
     Erkläre das mathematische/grammatikalische Konzept anhand einer eingängigen Analogie aus den Hobbys des Schülers ({hobbies}). Mache die Erklärung lebendig, bildhaft und leicht verständlich.
     ```
   - **`practice_tasks`**:
     ```text
     📝 AUFTRAG (3 Neue Übungsaufgaben):
     Erstelle genau 3 neue Übungsaufgaben passend zum Thema '{topic}' auf Stufe {level}. Integriere Elemente aus den Hobbys des Schülers ({hobbies}). Füge am Ende eine Musterlösung für die Nachhilfekraft/Eltern an.
     ```

### 3.3 Helper URL Generators
- `getGeminiGemUrl()` -> Returns `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`.
- `getChatGPTUrl(prompt)` -> Returns `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`.
- `getHuggingChatUrl(prompt)` -> Returns `https://huggingchat.co/chat?q=${encodeURIComponent(prompt)}`.

---

## 4. Reusable Gemini Gem Modal & Sidecar Launcher (`AiPromptModal.tsx`)

### 4.1 Props & State Design
Location: `src/components/AiPromptModal.tsx`

```typescript
export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionContext: QuestionPromptContext;
  studentProfile?: StudentProfile | StudentPromptProfile;
  empiricalStats?: EmpiricalStatsContext;
  initialMode?: AiPromptMode;
}
```

### 4.2 UI Component Features
1. **Modal Header**:
   - Title: "✨ KI-Tutor Gem Hilfestellung"
   - Subtitle: "Generiere maßgeschneiderte KI-Prompts für das NachhilfeTest Gemini Gem"
   - Close icon (`X`).
2. **Tab Selector** (3 Modes):
   - 🎓 `socratic` — Sokratische Hilfe
   - 💡 `personalized` — Personalisierte Erklärung
   - 📝 `practice_tasks` — 3 Neue Aufgaben
3. **Editable Live Preview**:
   - `textarea` containing compiled prompt.
   - User can adjust/add specific custom requests before copying.
4. **Primary Action Button ("NachhilfeTest Gem öffnen (Sidecar)")**:
   - Visual: Prominent primary button with `Sparkles` / `ExternalLink` icon.
   - Action:
     1. `navigator.clipboard.writeText(promptText)`
     2. Triggers floating toast notification: "Prompt in Zwischenablage kopiert! Gem wird im Sidecar geöffnet..."
     3. `window.open(getGeminiGemUrl(), '_blank', 'width=480,height=750,resizable=yes,scrollbars=yes,top=100,left=100')`
5. **Secondary Direct Fallback Links**:
   - ChatGPT link button (`getChatGPTUrl(promptText)`).
   - HuggingChat link button (`getHuggingChatUrl(promptText)`).
6. **Toast Feedback Banner**:
   - Temporary floating feedback banner confirming clipboard copy and sidecar launch.

---

## 5. View Integrations Strategy (`R4`)

1. **`PracticeSessionView.tsx`**:
   - In feedback banner for wrong answers (`!isCorrect`), add a **"🦉 KI-Tutor Gem um Hilfe fragen"** button.
   - Launches `AiPromptModal` with active exercise context, student hobbies, and wrong answer.

2. **`Dashboard.tsx`**:
   - In weak topic accordion list and bookmarked questions list, add **"✨ KI-Prompts für Gem generieren"** button.
   - Opens modal with topic/question context and historical accuracy.

3. **`DiagnosticReportPrint.tsx`**:
   - In tutor recommendation block, add **"✨ Gem Förderprompts generieren"** button (hidden in `@media print`).
   - Opens modal to generate personalized 3-task practice sheets for parents/tutors.

---

## 6. Verification Plan & Quality Criteria

1. **Test Execution**:
   - Execute `npm run test` to verify 100% pass rate across all 27+ test files including `ai_prompt_generator.test.ts`.
2. **Linter Execution**:
   - Execute `npm run lint` (`oxlint`) to ensure 0 errors and 0 warnings.
3. **Runtime & Sidecar Launch Verification**:
   - Verify `window.open` calls with `480x750` geometry and clipboard copy API.
