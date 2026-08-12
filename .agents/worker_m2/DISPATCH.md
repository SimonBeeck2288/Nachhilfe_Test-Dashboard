## 2026-08-09T18:53:02Z
You are Worker M2: AI Prompt Engine & Unit Tests Implementer.
Your working directory is `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m2`.
Write your changes report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m2\changes.md` and handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m2\handoff.md`.

First, read `c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md` (R2) and Explorer 3's handoff report at `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3\handoff.md`.

Your task:
1. Create `src/utils/aiPromptGenerator.ts`:
   - Export `PromptMode` type: `'socratic' | 'personalized' | 'practice_tasks'`.
   - Export `AiPromptContext` interface:
     - `studentProfile`: `Partial<StudentProfile>` (`name`, `gradeLevel`, `hobbies`, `learningPreferences`, `customNotes`)
     - `performanceData?: { strengths?: string[]; weaknesses?: string[]; topicAccuracy?: Record<string, number>; gradeLevel?: number; }`
     - `questionContext?: { subject?: 'math' | 'english'; topic?: string; level?: number; questionText?: string; userAnswer?: string; correctAnswer?: string; explanation?: string; }`
   - Export `generateGeminiPrompt(mode: PromptMode, context: AiPromptContext): string`:
     - Compiles rich structured German prompts for Google Gemini Gem.
     - 3 modes:
       1. `'socratic'`: 🎓 Sokratische Hilfestellung (step-by-step guidance without giving direct answers).
       2. `'personalized'`: 💡 Personalisierte Erklärung (concept explanation with analogies based on student hobbies & preferred learning style).
       3. `'practice_tasks'`: 📝 3 Neue Übungsaufgaben (3 custom practice exercises matching topic, difficulty level, and student hobbies).
     - Inject 3 data sources into prompt:
       a. Personality (hobbies, learning preferences, custom notes).
       b. Empirical performance (strengths, weaknesses, topic accuracy).
       c. Question context (subject, topic, level, question text, user wrong answer, explanation).
     - Gracefully handle missing/empty data fields (e.g. default fallback values when hobbies or performance data are absent).
   - Export URL helper functions:
     - `buildGeminiGemUrl(): string` -> returns `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`
     - `buildChatGPTUrl(prompt: string): string` -> returns `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
     - `buildHuggingChatUrl(prompt: string): string` -> returns `https://huggingchat.co/chat?q=${encodeURIComponent(prompt)}`

2. Create `src/tests/ai_prompt_generator.test.ts`:
   - Comprehensive Vitest test suite covering:
     - `generateGeminiPrompt` for all 3 prompt modes ('socratic', 'personalized', 'practice_tasks').
     - Injection of personality (hobbies, learning preferences, customNotes).
     - Injection of empirical performance (strengths, weaknesses, topic accuracy).
     - Injection of question context (subject, topic, level, question text, user answer).
     - Robust fallbacks for missing/empty profile or performance data.
     - URL helpers (`buildGeminiGemUrl`, `buildChatGPTUrl`, `buildHuggingChatUrl`).

3. Verify:
   - Run `npm run test` (Vitest) and `npm run lint`.
   - Ensure 100% of test files pass cleanly with 0 errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m2\handoff.md` including build, lint, and test output, and send a summary message back to the orchestrator.
