## 2026-08-02T15:07:43Z
<USER_REQUEST>
You are a Worker subagent executing Milestone 5 (R5: English Question Pool & Reading Passages) for NachhilfeTest.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m5

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks for Milestone 5 (R5):
1. In `src/data/questions.ts`:
   - Extend `Question` interface with `readingPassage?: string;`.
   - Expand `englishQuestions` array so every level from 1 to 7 contains at least 15 to 20 questions (total >= 105 questions).
   - From Level 4 upwards (Levels 4, 5, 6, 7), integrate reading passages (Emails, short stories, announcements) paired with comprehension questions.
2. In `src/components/QuestionRenderer.tsx`:
   - Check if `question.readingPassage` exists.
   - If present, render a styled reading passage box ("Lesetext / Reading Passage") above the question prompt.
3. Create unit test `src/data/questions.test.ts` verifying:
   - Level 1 through Level 7 each have >= 15 questions in `englishQuestions`.
   - Levels 4, 5, 6, 7 contain questions with `readingPassage`.
4. Run verification:
   - Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
   - Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
5. Write changes report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m5/changes.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m5/handoff.md`.
6. Message the orchestrator via `send_message` with completed results and artifact links.
</USER_REQUEST>
