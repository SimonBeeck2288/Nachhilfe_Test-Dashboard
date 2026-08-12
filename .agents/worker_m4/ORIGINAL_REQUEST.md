## 2026-08-02T15:02:49Z

<USER_REQUEST>
You are a Worker subagent executing Milestone 4 (R4: Adaptive Algorithm Stability) for NachhilfeTest.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m4

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks for Milestone 4 (R4):
1. Create a pure utility helper `src/utils/adaptive.ts`:
   - `computeNextLevel(currentLevel: number, isCorrect: boolean, streak: { correct: number; incorrect: number })`
   - Logic:
     - If `isCorrect`:
       - `incorrect` resets to 0.
       - `correct` increments by 1.
       - If `correct >= 2`: level increases by 1 (max 7), and `correct` resets to 0.
     - If not `isCorrect`:
       - `correct` resets to 0.
       - `incorrect` increments by 1.
       - If `incorrect >= 2`: level decreases by 1 (min 1), and `incorrect` resets to 0.
2. Create unit test file `src/utils/adaptive.test.ts` covering:
   - 1 correct answer does NOT increase level
   - 2 consecutive correct answers DO increase level (+1)
   - 1 wrong answer resets correct streak
   - 2 consecutive wrong answers DO decrease level (-1)
   - Level clamping at Level 1 and Level 7.
3. Integrate `computeNextLevel` into `src/pages/ModuleMath.tsx` and `src/pages/ModuleEnglish.tsx`.
4. Run verification:
   - Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
   - Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
5. Write changes report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m4/changes.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m4/handoff.md`.
6. Message the orchestrator via `send_message` with completed results and artifact links.
</USER_REQUEST>
