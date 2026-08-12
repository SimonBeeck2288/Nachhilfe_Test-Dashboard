# Execution Plan — Übungs-Generator (Practice Generator)

## Objective
Implement the full Übungs-Generator feature in NachhilfeTest repository, covering UI navigation & configuration, task generation & dynamic variations, interactive practice mode & print version (PDF/Print), and comprehensive Vitest test coverage ensuring all 244+ existing + new tests pass cleanly.

## Phases

### Phase 0: Survey & Technical Mapping
- Dispatch 3 parallel Explorers to investigate current codebase (`src/components`, `src/types`, `src/data/questions.ts`, `src/tests/`, state management, layout navigation).
- Synthesize findings into `PROJECT.md`.

### Phase 1: Architecture & Decomposition
- Finalize `PROJECT.md` with Feature Inventory, Milestones, and Interface Contracts.
- Define Dual Track: Implementation Track (Milestones M1-M4) + E2E Testing Track.

### Phase 2: Parallel Milestone Execution & Verification
- Dispatch sub-orchestrators/workers for each milestone.
- Gate verification per milestone: Build/Test pass, Reviewers APPROVE, Challengers confirm, Auditor CLEAN.

### Phase 3: Final Integration & E2E Verification
- Pass 100% of test suite (existing 244+ tests + practiceGenerator.test.ts).
- Perform Tier 5 adversarial coverage hardening.

### Phase 4: Final Reporting & Handoff
- Present final report to parent/Sentinel.
