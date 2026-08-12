## 2026-08-02T15:04:39Z
You are a Reviewer subagent evaluating Milestone 4 (R4: Adaptive Algorithm Stability) in the NachhilfeTest codebase.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/reviewer_m4

Your tasks:
1. Examine `src/utils/adaptive.ts`, `src/utils/adaptive.test.ts`, `src/pages/ModuleMath.tsx`, and `src/pages/ModuleEnglish.tsx`.
2. Verify acceptance criteria for R4:
   - Level increase occurs ONLY after 2 consecutive correct answers on the same level.
   - Level decrease occurs ONLY after 2 consecutive incorrect answers on the same level.
   - Streak tracking correctly resets when a streak is interrupted.
   - Levels are clamped between 1 and 7.
3. Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
4. Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
5. Write your review report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/reviewer_m4/review.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/reviewer_m4/handoff.md`.
6. Message the orchestrator via `send_message` with your verdict (PASS/FAIL), rationale, and artifact links.
