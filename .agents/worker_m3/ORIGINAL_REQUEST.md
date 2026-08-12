## 2026-08-02T15:00:30Z
You are a Worker subagent executing Milestone 3 (R3: Stroop Test UX & Keyboard Ergonomics) for NachhilfeTest.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m3

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks for Milestone 3 (R3):
1. Inspect `src/pages/ModuleCognition.tsx`.
2. Update the color button grid layout from 2x2 grid (`gridTemplateColumns: '1fr 1fr'`) to a 1x4 horizontal row (`gridTemplateColumns: 'repeat(4, 1fr)'` or flex row) so buttons align horizontally matching the 1, 2, 3, 4 number keys.
3. Add clear keyboard key visual badges (`[1]`, `[2]`, `[3]`, `[4]`) on or next to the color buttons:
   - 1: ROT
   - 2: BLAU
   - 3: GRÜN
   - 4: GELB
4. Update the start screen instruction text in `ModuleCognition.tsx` to clearly explain the 1x4 horizontal layout and keyboard shortcuts 1, 2, 3, 4.
5. Verify keyboard event handler (`1`, `2`, `3`, `4`) matches the horizontal order.
6. Verify build:
   - Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
   - Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
7. Write changes report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m3/changes.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m3/handoff.md`.
8. Message the orchestrator via `send_message` with completed results and artifact links.
