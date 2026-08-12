# Scope: Milestone M2 — Question Bank Quality & Evaluation Logic Fixes (R5)

## Architecture & Responsibilities
Fix all content, formatting, and evaluation flaws in `src/data/questions.ts` and `src/utils/evaluation.ts`:
1. **Level 6 Cube Edge Question Fix**:
   - In `src/data/questions.ts` (lines 800-813), change text from "Wie lang ist eine Kante a?" to "Wie groß ist das Volumen V des Pakets in cm³?".
   - Update `correctAnswer: String(a * a * a)`.
2. **English Multiple Choice Option Formatting Standardization**:
   - Standardize option formatting for all 22 identified English questions across levels e4–e7 (e.g. `e4_2`, `e5_1`, `e5_3`, `e5_30`, `e5_41`, `e5_49`, `e6_15`, `e6_17`, `e6_28`, `e6_33`, `e6_36`, `e6_43`, `e6_45`, `e7_3`, `e7_15`, `e7_20`, `e7_33`, `e7_34`, `e7_35`, `e7_41`, `e7_42`, `e7_43`).
   - Eliminate visually obvious correct options (remove slash synonyms, parenthetical translations, unequal lengths so distractors and correct answer follow identical formatting patterns).
3. **Numeric Input & Decimal Equivalence**:
   - Ensure `evaluateMathAnswer` accepts decimal equivalence (e.g. `"1"` for `"1,0"`), performs `.trim()`, strips trailing zeroes after decimal, and handles whitespace properly.
4. **Text Comparison Normalization**:
   - Ensure `evaluateEnglishAnswer` and text normalization handle `.trim()`, `.toLowerCase()`, and punctuation stripping consistently across `drag-sort` and text inputs.

## Exclusive File Ownership
- `src/data/questions.ts`
- `src/utils/evaluation.ts`

## Acceptance Criteria
- All 188 existing Vitest tests pass cleanly (`npm run test`).
- `npm run lint` passes without errors.
- Question bank content & evaluation functions pass all updated domain criteria.
