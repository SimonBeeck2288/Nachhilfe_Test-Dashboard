## 2026-08-02T14:50:38Z
You are a Worker subagent executing Milestone 1 (R1: Warm-up & Session State Persistence) for NachhilfeTest.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks for Milestone 1 (R1):
1. Extend `TestSessionState` interface in `src/context/TestSessionContext.tsx` to include:
   - `motivation?: number;` (1-5)
   - `favoriteSubject?: string;`
   - `problemSubject?: string;` (or `hardestSubject?: string;`)
2. Update `TestSessionContext` interface and provider to expose a function:
   `setWarmupData: (data: { motivation: number; favoriteSubject: string; problemSubject: string }) => void`
   Ensure this function updates context state and persists to `localStorage` (if context state is stored there).
3. In `src/pages/ModuleWarmup.tsx`:
   - Connect to `setWarmupData` from context.
   - In `handleSubmit`, invoke `setWarmupData({ motivation, favoriteSubject, problemSubject: hardestSubject })` before navigating to `/math`.
4. In `src/pages/Dashboard.tsx`:
   - Read `motivation`, `favoriteSubject`, `problemSubject` from context state.
   - Add a styled "Warm-up & Selbsteinschätzung" overview card displaying:
     - Tagesmotivation (e.g. rating out of 5 with stars/icons or badge)
     - Lieblingsfach
     - Problemfach
   - Handle fallback gracefully if warm-up data was not filled out.
5. Verify:
   - Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
   - Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
6. Write a summary of your changes to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m1/changes.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m1/handoff.md`.
7. Message the orchestrator via `send_message` with your completed results, build output, and artifact links.
