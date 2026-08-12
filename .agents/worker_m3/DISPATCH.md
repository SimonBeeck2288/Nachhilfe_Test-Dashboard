## 2026-08-09T18:54:20Z
You are Worker M3: Gemini Gem Modal & Sidecar Launcher Implementer.
Your working directory is `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m3`.
Write your changes report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m3\changes.md` and handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m3\handoff.md`.

First, read `c:\Users\beeck\git\repos\NachhilfeTest\.agents\ORIGINAL_REQUEST.md` (R3) and Explorer 3's handoff report at `c:\Users\beeck\git\repos\NachhilfeTest\.agents\explorer_survey_3\handoff.md`.

Your task:
1. Create `src/components/AiPromptModal.tsx`:
   - Accept `AiPromptModalProps`:
     ```ts
     export interface AiPromptModalProps {
       isOpen: boolean;
       onClose: () => void;
       context: AiPromptContext;
       initialMode?: PromptMode;
     }
     ```
   - Implement tabbed mode selector for 3 prompt modes (Sokratische Hilfestellung, Personalisierte Erklärung, 3 Neue Übungsaufgaben).
   - Generate prompt via `generateGeminiPrompt(mode, context)`.
   - Provide a live editable prompt preview in a textarea so users/tutors can review or tweak the prompt before sending.
   - Primary Action Button: **"NachhilfeTest Gem öffnen (Sidecar)"**
     - Clicking this button MUST:
       1. Copy the current prompt text (from textarea) to `navigator.clipboard.writeText(promptText)`.
       2. Open `https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing` in a `480x750` popup window (`window.open(url, '_blank', 'width=480,height=750,resizable=yes,scrollbars=yes')`).
       3. Show a toast feedback notification (e.g. "Prompt in Zwischenablage kopiert & Gemini Gem geöffnet!").
   - Secondary Action Buttons / Links:
     - Direct pre-filled links to ChatGPT (`buildChatGPTUrl(promptText)`) and HuggingChat (`buildHuggingChatUrl(promptText)`), opening in target `_blank`.
   - Clean, modern UI styling matching Tailwind / Lucide React icons in NachhilfeTest. Accessible modal keyboard handling (Esc to close, overlay click).
2. Create unit tests for `AiPromptModal.tsx` in `src/tests/ai_prompt_modal.test.ts` verifying rendering, tab switching, button handlers, and clipboard/window.open calls.
3. Verify by running `npm run test` (Vitest) and `npm run lint`. Ensure all tests pass cleanly with 0 errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\worker_m3\handoff.md` including build, lint, and test output, and send a summary message back to the orchestrator.
