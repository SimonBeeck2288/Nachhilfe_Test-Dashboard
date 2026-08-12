## 2026-08-02T15:50:23Z
You are a Specialist Worker for the NachhilfeTest project.
Your working directory is c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_fix_evaluation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

FORENSIC AUDIT FAILURE REPORT TO REMEDIATE:
The Forensic Victory Auditor reported a test failure in `src/utils/evaluation.test.ts`:
- Failure output: `Error: Assertion failed: "the dog" should not match "a dog"` at `src/utils/evaluation.test.ts:16:3`.
- Root cause: `evaluateEnglishAnswer` in `src/utils/evaluation.ts` indiscriminately strips articles (`a`, `an`, `the`) from both the user's answer AND the correct answer. This causes `"the dog"` to match `"a dog"`, violating article assertion requirements.

TASKS:
1. Inspect `src/utils/evaluation.ts` and `src/utils/evaluation.test.ts`.
2. Fix `evaluateEnglishAnswer` in `src/utils/evaluation.ts`:
   - If the correct answer does NOT start with an article (e.g., `dog`), strip optional leading articles (`a`, `an`, `the`) from the user answer so `a dog`, `the dog`, or `dog` match `dog`.
   - If the correct answer DOES start with an article (e.g., `a dog`), do NOT strip articles from the user answer, ensuring that `the dog` does NOT match `a dog`.
3. Verify that `npx tsx src/utils/evaluation.test.ts` passes 100%.
4. Verify that `npx tsx src/data/questions.test.ts` and `npx tsx src/utils/adaptive.test.ts` pass 100%.
5. Run `npm run build` and `npm run lint` to verify build and linter pass with 0 errors.
6. Write a detailed handoff report in `c:/Users/beeck/git/repos/NachhilfeTest/.agents/worker_fix_evaluation/handoff.md` and report your results back to parent.
