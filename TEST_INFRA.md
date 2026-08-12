# NachhilfeTest Architecture & Test Infrastructure (TEST_INFRA)

## Test Philosophy
The `NachhilfeTest` diagnostic platform employs a requirement-driven, multi-tiered testing methodology to guarantee software quality, math/english pedagogical accuracy, adaptive scoring integrity, and user experience controls.

Testing follows an opaque-box and contract-driven strategy:
- **Zero Facade Testing**: Tests execute actual logic, evaluating real functions, state reducers, math formulas, option strings, and context handlers.
- **Progressive Testability**: Verification relies strictly on features present in current and dependent completed milestones.
- **4-Tier Coverage Model**: Spans unit level functions up to end-to-end multi-module diagnostic student journeys.

---

## 4-Tier Test Coverage Methodology

```
+-----------------------------------------------------------------------+
|  TIER 4: Real-World Application Scenarios                             |
|  Full diagnostic student journeys, profile-to-report lifecycle        |
+-----------------------------------------------------------------------+
|  TIER 3: Cross-Feature Integration Scenarios                          |
|  Inter-module integration: Stroop -> Adaptivity -> History            |
+-----------------------------------------------------------------------+
|  TIER 2: Boundary Value Analysis & Edge Cases                         |
|  Pool exhaustion (0s), empty stack popping, decimal variations        |
+-----------------------------------------------------------------------+
|  TIER 1: Unit & Feature Coverage Tests                                |
|  Pause pool, Bookmarking, Back button step-back, UX popups, R5 fixes |
+-----------------------------------------------------------------------+
```

### Tier 1: Unit & Feature Coverage Tests
Focuses on individual features and domain specifications:
- **R1 Mid-Test UX**: Disabling blocking mid-test tip popups ("Wusstest du schon?") on wrong answers to maintain timer continuity and answer secrecy (`src/tests/mid_test_ux.test.ts`).
- **R2 Pause Pool**: Shared 90-second `pausePoolSeconds`, timer suspension, tick countdown, auto-unpause at 0s, and pause button disablement (`src/tests/pause_pool.test.ts`).
- **R3 Question Bookmarking**: Flagging questions ("Markieren"), state serialization, and rendering bookmark summary badges on diagnostic reports (`src/tests/bookmarking.test.ts`).
- **R4 Back Button Step-Back Navigation**: Answer stack unwinding (`popLastAnswer`), score & streak recalculation, and answer restoration for re-entry (`src/tests/back_button_navigation.test.ts`).
- **R5 Question Bank Quality & Logic**: Level 6 cube volume formula ($V = a^3$), option formatting standardization across 22 English MC questions, and decimal response normalization (`src/tests/question_bank_fixes.test.ts`).

### Tier 2: Boundary Value Analysis & Edge Cases
Validates stability under boundary conditions:
- **Pause Pool Exhaustion**: Pausing when pool has 1s left ticks down to 0s, auto-unpauses, and disables further pause toggling.
- **Navigation Stack Limits**: Calling `popLastAnswer()` on empty answer history or unansared subjects safely returns `null` without throwing errors.
- **Smart Tolerance Edge Cases**: Whitespace trimming, unit stripping (`216 cm³` -> `216`), comma-vs-dot decimals (`0,5` vs `0.5`, `1,0` vs `1`), and equation prefixing (`x = 3` vs `3`).
- **Extreme Adaptivity**: Theta limits ($\theta \in [-3.0, 3.0]$), level clamping ($1 \le \text{level} \le 7$), streak overflow, and score minimum bounds ($\text{points} \ge 0$).

### Tier 3: Cross-Feature Integration Scenarios
Tests interactions across system boundaries:
- **Warmup + Stroop Calibration -> Diagnostic Initial State**: Student survey motivation and reaction test performance calibrating initial math/english levels.
- **Smart Input Tolerance + Adaptive Level Advancement + Streak Tracking**: Parsed answers dynamically driving IRT scoring updates and consecutive streak counters.
- **Pause Pool + Question Timer Integration**: Active question timer tick suspension during active pauses across math and english test modules.

### Tier 4: Real-World E2E Application Scenarios
Simulates complete student diagnostic lifecycles:
- **Journey A (High Performing Student)**: Profile creation -> Warmup -> Fast Stroop reaction test (Level 3 calibration) -> Consecutive correct Math & English questions -> Adaptivity climb to Level 5 -> Diagnostic report save.
- **Journey B (Struggling Student)**: Profile creation -> Warmup -> Bedacht Stroop reaction test (Level 1 calibration) -> Typing variations accommodated by Smart Input Tolerance -> Level 1 safe evaluation without volatile drops.

---

## Test Suite Execution & Commands

| Command | Purpose | Expected Result |
|---------|---------|-----------------|
| `npm run test` | Executes full Vitest test suite in single-run mode | 28/28 test files passed (221/221 tests) |
| `npx vitest run` | Direct Vitest CLI execution command | 100% pass rate, 0 failures |
| `npm run lint` | Runs oxlint over repository source & test files | 0 warnings, 0 errors across 76 files |

---

## Feature Inventory & Requirement Mapping

| Feature ID | Requirement / Feature Description | Targeted Test File(s) | Tier |
|------------|-----------------------------------|----------------------|------|
| **R1** | Mid-Test UX & Tip Modal Removal | `src/tests/mid_test_ux.test.ts` | Tier 1 |
| **R2** | Pause Button with 90s Shared Pool | `src/tests/pause_pool.test.ts`, `src/tests/ux_controls.test.ts` | Tier 1 & 2 |
| **R3** | Question Bookmarking ("Markieren") | `src/tests/bookmarking.test.ts`, `src/tests/ux_controls.test.ts` | Tier 1 & 3 |
| **R4** | Back Button Navigation ("Zurück") | `src/tests/back_button_navigation.test.ts`, `src/tests/ux_controls.test.ts` | Tier 1 & 2 |
| **R5a** | Level 6 Cube Volume Fix ($V = a^3$) | `src/tests/question_bank_fixes.test.ts`, `src/tests/r5_verification.test.ts` | Tier 1 |
| **R5b** | 22 English MC Option Standardization | `src/tests/question_bank_fixes.test.ts`, `src/tests/r5_verification.test.ts` | Tier 1 |
| **R5c** | Decimal & Text Evaluation Normalization | `src/tests/question_bank_fixes.test.ts`, `src/utils/evaluation.test.ts` | Tier 1 & 2 |
| **E2E-A**| High-Performer Student Diagnostic Journey | `src/tests/e2e_scenarios.test.ts` | Tier 4 |
| **E2E-B**| Struggling Student Diagnostic Journey | `src/tests/e2e_scenarios.test.ts` | Tier 4 |

---

## Quality Thresholds
- **Test Pass Rate**: 100% mandatory.
- **Lint Errors/Warnings**: 0 mandatory.
- **Test Integrity**: All tests evaluate functional logic; facade tests are strictly prohibited.
