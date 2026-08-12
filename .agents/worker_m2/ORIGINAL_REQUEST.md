## 2026-08-02T14:53:34Z
<USER_REQUEST>
You are a Worker subagent executing Milestone 2 (R2: Tolerant Answer Evaluation) for NachhilfeTest.
Working Directory: c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks for Milestone 2 (R2):
1. Create `src/utils/evaluation.ts` with flexible, robust evaluation functions:
   - `evaluateEnglishAnswer(userAnswer: string, correctAnswer: string): boolean`
     - Lowercase, trim, strip punctuation (`.`, `,`, `!`, `?`, `"`, `'`).
     - Remove leading articles (`a `, `an `, `the `) if correct answer does not mandate them.
     - Normalize internal whitespace.
   - `evaluateMathAnswer(userAnswer: string, correctAnswer: string): boolean`
     - Lowercase, trim, replace decimal commas `,` with `.`.
     - Strip equation prefixes (`x=`, `x = `, `y=`) when target is just value, or format flexibly.
     - Strip whitespace around operators (`+`, `-`, `*`, `/`, `=`, `^`) and coefficient-variable gaps (e.g. `8 * x` -> `8x`, `8 x` -> `8x`, `8X` -> `8x`, `x * 8` -> `8x`).
     - If both sides parse as numbers, compare numerically within epsilon `1e-4`.
2. Integrate `evaluateEnglishAnswer` into `src/pages/ModuleEnglish.tsx`.
3. Integrate `evaluateMathAnswer` into `src/pages/ModuleMath.tsx`.
4. Create test file `src/utils/evaluation.test.ts` (or lightweight verification script/unit test file) covering:
   - "a dog", "the dog", "Dog." matching "dog"
   - "8 * x", "8X", "x * 8", "8 x" matching "8x"
   - "x = 3" matching "3"
5. Verify:
   - Run `npm run build` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run build`).
   - Run `npm run lint` using `run_command` (Cwd: `c:/Users/beeck/git/repos/NachhilfeTest`, CommandLine: `npm run lint`).
6. Write changes report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m2/changes.md` and handoff report to `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_m2/handoff.md`.
7. Message the orchestrator via `send_message` with completed results and artifact links.
</USER_REQUEST>
