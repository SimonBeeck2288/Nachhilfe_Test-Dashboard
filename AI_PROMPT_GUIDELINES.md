# Zero-Cost AI Tutoring Integration — Architectural & Operational Guidelines

## Executive Summary
NachhilfeTest integrates a **Zero-Running-Cost AI Prompt Engine** that empowers tutors and students with tailored, context-aware AI assistance without requiring external server infrastructure, subscription fees, or API token management.

By compiling student personalities, empirical test analytics, and task context entirely on the client side, NachhilfeTest formats structured prompts optimized for custom AI Gems—specifically the dedicated **NachhilfeTest Gemini Gem** (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`).

---

## 1. System Overview & Zero-Running-Cost Architecture

### 1.1 Architectural Blueprint
```
+-----------------------------------------------------------------------------------+
|                                Client-Side Browser                                |
|                                                                                   |
|  +-----------------------+   +-----------------------+   +---------------------+  |
|  |   Student Profile     |   | Empirical Analytics   |   |   Question Context  |  |
|  |  (Hobbies, Style)     |   | (Strengths, Accuracy) |   | (Text, Answer, Topic|  |
|  +-----------+-----------+   +-----------+-----------+   +----------+----------+  |
|              |                           |                          |             |
|              +-------------------+-------+-------+------------------+             |
|                                  |               |                                |
|                                  v               v                                |
|                     +----------------------------------+                          |
|                     |   `generateGeminiPrompt(...)`    |                          |
|                     |  Client-side Prompt Compiler     |                          |
|                     +----------------+-----------------+                          |
|                                      |                                            |
|                                      v                                            |
|                     +----------------------------------+                          |
|                     |    `AiPromptModal` Component     |                          |
|                     | Live Preview, Copy & Tab Selector|                          |
|                     +----------------+-----------------+                          |
|                                      |                                            |
|                   +------------------+------------------+                         |
|                   |                                     |                         |
|                   v                                     v                         |
|    +-----------------------------+       +-----------------------------+          |
|    |  `navigator.clipboard`      |       |  `window.open(...)`         |          |
|    |  Prompt Auto-Copied         |       |  Sidecar Window (480x750)   |          |
|    +--------------+--------------+       +--------------+--------------+          |
+-------------------|-------------------------------------|-------------------------+
                    |                                     |
                    v                                     v
+-----------------------------------------------------------------------------------+
|                         External Browser Sidecar Window                           |
|                                                                                   |
|            +-------------------------------------------------------+              |
|            |                 Gemini Gem Workspace                  |              |
|            |  URL: https://gemini.google.com/gem/1m2yWdldrnt...   |              |
|            |                                                       |              |
|            |  [Ctrl+V -> Submit]                                   |              |
|            |  Receives full context + role instructions            |              |
|            +-------------------------------------------------------+              |
+-----------------------------------------------------------------------------------+
```

### 1.2 Core Architectural Principles
1. **100% Client-Side Compilation**: Prompt generation executes instantly inside the user's browser in `src/utils/aiPromptGenerator.ts`. No proxy servers, no secret API keys, and 0 operational backend running costs.
2. **Sidecar Window Launcher**: Clicking the AI tutor launcher button automatically copies the current prompt to the system clipboard and spawns a compact sidecar popup window (`480x750` pixels) pointing directly to the NachhilfeTest Gemini Gem URL.
3. **One-Click Clipboard Transfer**: Eliminates manual copying steps. The user simply presses `Ctrl+V` (or `Cmd+V`) into the Gemini Gem window prompt field.
4. **Fallback AI System Integration**: Direct fallback links allow launching prompt sessions in alternative public AI platforms like ChatGPT and HuggingChat.

---

## 2. The 3 Prompt Modes

The prompt generator supports 3 distinct modes tailored to different pedagogical needs:

```typescript
export type PromptMode = 'socratic' | 'personalized' | 'practice_tasks';
```

### 2.1 Mode 1: Sokratische Hilfestellung (`socratic`)
- **Objective**: Provide step-by-step guidance without revealing the direct answer.
- **Pedagogical Strategy**: The AI acts as a patient, inquisitive tutor. It analyzes the student's incorrect answer, identifies the underlying misconception, and asks a single targeted guiding question to prompt self-discovery.
- **Use Case**: Used during interactive practice sessions when a student gets stuck or answers incorrectly.

### 2.2 Mode 2: Personalisierte Erklärung (`personalized`)
- **Objective**: Explain abstract concepts using real-world analogies tailored to the student's personal interests and preferred learning style.
- **Pedagogical Strategy**: The AI translates mathematical or grammatical rules into metaphors from the student's hobbies (e.g. soccer, gaming, music, drawing).
- **Use Case**: Used in the summary dashboard or report review to help students grasp topics they struggled with during diagnostic testing.

### 2.3 Mode 3: 3 Neue Übungsaufgaben (`practice_tasks`)
- **Objective**: Generate 3 fresh, customized practice exercises aligned with the student's grade level and weak topics.
- **Pedagogical Strategy**:
  - Exercise 1: Fundamental understanding (Basisverständnis)
  - Exercise 2: Intermediate difficulty (Mittlere Schwierigkeit)
  - Exercise 3: Application / Transfer scenario (Anwendungs-/Transferaufgabe)
  - All exercises integrate student hobbies into story problems and append a complete solution key under `--- LÖSUNGEN & ERKLÄRUNGEN ---`.
- **Use Case**: Used by tutors and parents to print or assign extra homework tailored to weak topics.

---

## 3. The 3 Context Injections

To ensure high relevance, each prompt merges data from 3 context sources:

```typescript
export interface AiPromptContext {
  studentProfile?: Partial<StudentProfile>;
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
```

### 3.1 Context Injection A: Student Personality & Profile
- **`name`**: Student's name (e.g. "Max", "Mia").
- **`gradeLevel`**: Academic grade level (e.g. 5, 8).
- **`hobbies`**: Array of personal hobbies (e.g. `['Fußball', 'Minecraft', 'Gitarre']`).
- **`learningPreferences`**: Preferred learning styles (e.g. `['Schritt-für-Schritt', 'Anschauliche Erklärungen']`).
- **`customNotes`**: Special notes provided by tutors or parents (e.g. "Braucht extra Zeit bei Textaufgaben").

### 3.2 Context Injection B: Empirical Performance
- **`strengths`**: Identified strong topic areas (e.g. `['Addition', 'Vokabeln']`).
- **`weaknesses`**: Identified weak topic areas needing reinforcement (e.g. `['Brüche', 'Grammatik']`).
- **`topicAccuracy`**: Record mapping topic names to accuracy percentages (e.g. `{ 'Brüche': 40, 'Addition': 90 }`).
- **`gradeLevel`**: Verified empirical assessment grade level.

### 3.3 Context Injection C: Question Context
- **`subject`**: Subject area (`math` or `english`).
- **`topic`**: Specific topic (e.g. "Bruchrechnung", "Past Simple").
- **`level`**: Difficulty level reached (e.g. Level 3).
- **`questionText`**: Full text of the current or failed question.
- **`userAnswer`**: Student's actual response.
- **`correctAnswer`**: Expected correct answer.
- **`explanation`**: Default hint or standard solution explanation.

---

## 4. Developer Integration Guide

### 4.1 Component API: `AiPromptModalProps`
```typescript
import React from 'react';
import { AiPromptModal } from './components/AiPromptModal';

export interface AiPromptModalProps {
  isOpen: boolean;            // Controls modal visibility
  onClose: () => void;         // Callback when modal is dismissed or closed via Esc/X
  context: AiPromptContext;    // Combined profile, performance, and question data
  initialMode?: PromptMode;    // Optional default tab ('socratic' | 'personalized' | 'practice_tasks')
}
```

### 4.2 State Management Pattern
Components launching the AI modal maintain local state for `isAiModalOpen`, `selectedAiContext`, and `selectedAiMode`:

```tsx
const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
const [aiModalContext, setAiModalContext] = useState<AiPromptContext>({});
const [aiModalMode, setAiModalMode] = useState<PromptMode>('socratic');

const handleOpenAiHelp = (mode: PromptMode, exerciseContext: AiPromptContext) => {
  setAiModalContext(exerciseContext);
  setAiModalMode(mode);
  setIsAiModalOpen(true);
};
```

### 4.3 Launcher Button Styling & Conventions
Launcher buttons feature consistent visual cues across all views:
- Primary color: `#2563EB` (Tailwind `bg-blue-600` / `color: white`)
- Icons: `Sparkles` or `Bot` from `lucide-react`
- Hover state: `hover:bg-blue-700`
- Class name: `no-print` (ensures buttons are hidden during document printing)

Example button jsx:
```tsx
<button
  type="button"
  className="btn btn-primary no-print"
  onClick={() => handleOpenAiHelp('socratic', currentExerciseContext)}
  style={{
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }}
>
  <Sparkles size={16} />
  <span>KI-Tutor Gem Hilfe</span>
</button>
```

### 4.4 Printable Report Isolation (`no-print` Class)
In printable components like `DiagnosticReportPrint.tsx`, all interactive modal triggers, buttons, and backdrop overlays MUST include the `no-print` CSS utility class:

```css
@media print {
  .no-print {
    display: none !important;
  }
}
```
This guarantees that print outputs (PDF / paper) remain clean, single-page diagnostic reports without UI popups or action buttons.

---

## 5. User & Tutor Operational Guide

### 5.1 Operating the Gemini Gem Integration
1. **Click AI Helper Button**: Click **"KI-Tutor Gem Hilfe"** in the practice session feedback banner, dashboard topic cards, or diagnostic print report.
2. **Select Prompt Mode**: In the modal, switch between **Sokratisch**, **Personalisiert**, or **Übungsaufgaben** using the top tab selector.
3. **Launch Gemini Sidecar**: Click the blue button **"NachhilfeTest Gem öffnen (Sidecar)"**.
   - The compiled prompt is instantly copied to your clipboard.
   - A sidecar window opens to `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`.
4. **Paste & Interact**:
   - Focus the prompt text box in the Gemini window and press `Ctrl+V` (or `Cmd+V`).
   - Press **Enter** to receive instant AI tutoring tailored specifically to the student's profile and current performance!

### 5.2 Window Layout & Ergonomics
- Position the NachhilfeTest application on the left side of the screen.
- The Gemini Gem Sidecar window automatically opens at `480px` width by `750px` height on the right side of the screen.
- This side-by-side setup allows students and tutors to work through exercises in NachhilfeTest while chatting with the AI tutor simultaneously.

### 5.3 Fallback Links
If Gemini Gem is unavailable or the user prefers a different model:
- **ChatGPT**: Click the secondary `ChatGPT` link in the modal footer to open `https://chatgpt.com/?q=...` with the prompt pre-populated in the URL.
- **HuggingChat**: Click the secondary `HuggingChat` link to open `https://huggingchat.co/chat?q=...` for open-source LLM interaction.
