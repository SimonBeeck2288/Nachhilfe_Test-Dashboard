# Project: NachhilfeTest Zero-Cost AI Tutoring Integration

## Architecture
- React 18 / Vite application with TypeScript, Tailwind CSS, Lucide React icons, and Vitest test suite.
- Zero-running-cost AI prompt engine (`src/utils/aiPromptGenerator.ts`) compiling 3 contextual prompt modes for Gemini Gem, ChatGPT, and HuggingChat.
- Student profile state with extended personality fields (`hobbies`, `learningPreferences`, `customNotes`) persisted in localStorage (`src/utils/studentRoster.ts`).
- Modal UI component (`src/components/AiPromptModal.tsx`) providing tabbed prompt mode selection, live preview, clipboard copy, and Sidecar popup window launch (`480x750` to https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing).
- Integrations across practice session feedback (`PracticeSessionView.tsx`), summary dashboard (`Dashboard.tsx`), and printable diagnostic report (`DiagnosticReportPrint.tsx`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 10 | R1. Student Profile Expansion | Extend `StudentProfile` with `hobbies: string[]`, `learningPreferences: string[]`, `customNotes: string`. Update `studentRoster.ts` persistence & default fallbacks. Add preset tag selectors and custom inputs in `StudentSwitcherModal.tsx`. | M1 | survey |
| 11 | R2. Modular Zero-Cost AI Prompt Engine | Create `src/utils/aiPromptGenerator.ts` supporting 3 prompt modes (Sokratische Hilfestellung, Personalisierte Erklärung, 3 Neue Übungsaufgaben) with 3 injected data sources (Personality, Empirical Performance, Question Context). Create unit tests `src/tests/ai_prompt_generator.test.ts`. | M2 | survey |
| 12 | R3. Reusable Gemini Gem Modal & Sidecar Launcher | Create `src/components/AiPromptModal.tsx` with tabbed mode selection, live prompt preview, primary Sidecar launcher (`window.open` 480x750 + clipboard copy to Gemini Gem `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`), secondary ChatGPT/HuggingChat links, toast notification. | M3 | survey |
| 13 | R4. View Integrations | Integrate "KI-Tutor Gem Hilfe" buttons in `PracticeSessionView.tsx`, `Dashboard.tsx`, and `DiagnosticReportPrint.tsx`. | M4 | survey |
| 14 | R5. Architectural Documentation & E2E Verification | Create `AI_PROMPT_GUIDELINES.md`, update root `PROJECT.md`, run full Vitest suite (`npm run test`) and `npm run lint`, execute Reviewers, Challengers, and Forensic Auditor. | M5 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Student Profile Expansion | `student.ts`, `studentRoster.ts`, `StudentSwitcherModal.tsx` | None | PLANNED |
| M2 | Zero-Cost AI Prompt Engine & Unit Tests | `aiPromptGenerator.ts`, `ai_prompt_generator.test.ts` | M1 | PLANNED |
| M3 | Gemini Gem Modal & Sidecar Launcher | `AiPromptModal.tsx` | M2 | PLANNED |
| M4 | View Integrations | `PracticeSessionView.tsx`, `Dashboard.tsx`, `DiagnosticReportPrint.tsx` | M3 | DONE |
| M5 | Architectural Documentation & E2E Verification | `AI_PROMPT_GUIDELINES.md`, `PROJECT.md`, test & lint suite, Gate | M4 | DONE |

## Interface Contracts
### StudentProfile Interface Expansion (`src/types/student.ts`)
```ts
export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: number;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt: string;
  hobbies?: string[];
  learningPreferences?: string[];
  customNotes?: string;
}
```

### AI Prompt Engine Contract (`src/utils/aiPromptGenerator.ts`)
```ts
export type PromptMode = 'socratic' | 'personalized' | 'practice_tasks';

export interface AiPromptContext {
  studentProfile: Partial<StudentProfile>;
  performanceData?: {
    strengths?: string[];
    weaknesses?: string[];
    topicAccuracy?: Record<string, number>;
    gradeLevel?: number;
  };
  questionContext?: {
    subject?: 'math' | 'english';
    topic?: string;
    level?: number;
    questionText?: string;
    userAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
  };
}

export function generateGeminiPrompt(mode: PromptMode, context: AiPromptContext): string;
export function buildGeminiGemUrl(): string;
export function buildChatGPTUrl(prompt: string): string;
export function buildHuggingChatUrl(prompt: string): string;
```

### AI Prompt Modal Contract (`src/components/AiPromptModal.tsx`)
```ts
export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AiPromptContext;
  initialMode?: PromptMode;
}
```

## Code Layout
- `src/types/student.ts`: Type definitions for `StudentProfile`.
- `src/utils/studentRoster.ts`: Roster storage, loading, migration defaults.
- `src/components/StudentSwitcherModal.tsx`: Student switching and profile edit UI.
- `src/utils/aiPromptGenerator.ts`: Prompt compiler and URL helper utility.
- `src/components/AiPromptModal.tsx`: Reusable Gemini Gem modal component.
- `src/components/PracticeSessionView.tsx`: Practice session feedback view.
- `src/components/Dashboard.tsx`: Summary dashboard.
- `src/components/DiagnosticReportPrint.tsx`: Printable report view.
- `src/tests/ai_prompt_generator.test.ts`: Unit test suite for AI prompt generator.
- `AI_PROMPT_GUIDELINES.md`: Architectural documentation for Gemini Gem integration.
