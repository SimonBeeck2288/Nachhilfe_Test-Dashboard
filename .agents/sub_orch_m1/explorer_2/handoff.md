# Handoff Report: Investigation of `src/utils/syncValidation.ts`

**Explorer**: Explorer 2 (Milestone M1 — JSON Data Portability & Merge Engine)  
**Working Directory**: `c:\Users\beeck\git\repos\NachhilfeTest\.agents\sub_orch_m1\explorer_2`  
**Target Module**: `src/utils/syncValidation.ts`  
**Parent Orchestrator**: `03c47c14-5a60-48fe-bac1-53ec0441df3f`  

---

## 1. Observation

### 1.1 Existing Codebase & Data Models
Direct observation of existing TypeScript definitions and persistence logic:
1. **Student Profile (`src/types/student.ts:21-34`)**:
   ```typescript
   export interface StudentProfile {
     id: string;
     name: string;
     gradeLevel: number | string;
     favoriteSubject: string;
     problemSubject: string;
     notes: string;
     hobbies?: string[];
     learningPreferences?: string[];
     customNotes?: string;
     accessibilitySettings?: AccessibilitySettings;
     createdAt: string;
     updatedAt: string;
   }
   ```
   - Observed `accessibilitySettings` structure (`src/types/student.ts:3-7`): `{ preset: 'standard' | 'direct_reduced_sensory' | 'custom'; directQuestions: boolean; reducedSensory: boolean; }`.
   - `gradeLevel` is union `number | string` (supports numeric grades 1-13 as well as text grades like `"5"`, `"K"`).
   - `createdAt` and `updatedAt` are ISO 8601 strings, where `updatedAt` is critical for Last-Write-Wins (LWW) conflict resolution.

2. **Session History (`src/types/history.ts:19-40`)**:
   ```typescript
   export interface TestSessionRecord {
     sessionId: string;
     studentId: string;
     studentName: string;
     date: string;
     subject: string;
     mathLevelReached: number;
     englishLevelReached: number;
     score: number;
     totalQuestions: number;
     topicBreakdown: Record<string, TopicBreakdownItem> | TopicBreakdownItem[];
     cognitionStats?: CognitionStatsRecord | null;
     answers: AnswerRecord[];
     motivation?: number;
     favoriteSubject?: string;
     problemSubject?: string;
     notes?: string;
     interpretation?: string;
     durationSeconds?: number;
     markedQuestionIds?: string[];
     accessibilitySettings?: AccessibilitySettings;
   }
   ```
   - Observed `topicBreakdown` can be either a dictionary `Record<string, TopicBreakdownItem>` or an array `TopicBreakdownItem[]`.
   - Observed `AnswerRecord` (`src/context/TestSessionContext.tsx:13-26`):
     ```typescript
     export interface AnswerRecord {
       questionId: string;
       topic: string;
       subject: 'math' | 'english' | 'cognition' | 'warmup';
       isCorrect: boolean;
       timeTaken: number;
       usedExtraTime: boolean;
       pointsEarned?: number;
       difficultyLevel?: number;
       reactionTime?: number;
       questionText?: string;
       userAnswer?: string;
       correctAnswer?: string | string[];
     }
     ```

3. **Storage Keys & Fallback Behavior (`src/utils/studentRoster.ts`, `src/utils/sessionHistory.ts`)**:
   - `ROSTER_STORAGE_KEY = 'diagnostic_student_roster'` (`src/utils/studentRoster.ts:4`)
   - `HISTORY_STORAGE_KEY = 'diagnostic_session_history'` (`src/utils/sessionHistory.ts:3`)
   - Both modules catch `JSON.parse` errors and recover gracefully to empty arrays.
   - Storage resilience in stress tests (`src/tests/challenger_m1_1_student_profile_stress.test.ts:74`, `src/tests/challenger_m1_2_stress.test.ts:114`) explicitly tests malformed JSON strings (`"INVALID JSON {{{"`).

4. **Test Suite Baseline**:
   - Running `npx vitest run` executed 47 test files and 405 unit/integration tests with 100% pass rate in 6.07s.

5. **Interface Contract Discrepancies between Specifications**:
   - `PROJECT.md:100-125` defines:
     - `SyncPayload.data: { roster: StudentProfile[]; history: TestSessionRecord[]; }`
     - `ValidationResult: { isValid: boolean; errors: string[]; payload?: SyncPayload; }`
   - `SCOPE.md:36-51` defines:
     - `SyncPayload.data: { students: StudentProfile[]; sessions: SessionLog[]; quizResults: QuizResult[]; appSettings?: Record<string, unknown>; }`
     - `ValidationResult: { valid: boolean; errors: string[]; warnings?: string[]; sanitizedPayload?: SyncPayload; }`

---

## 2. Logic Chain

### 2.1 Why Zero-Dependency Architecture is Required
1. Based on Observation 1.4 and `PROJECT.md:60`, introducing heavyweight validation libraries (like `zod`, `yup`, `ajv`, `joi`) would increase bundle size and introduce third-party supply-chain risks into a client-side offline-first SPA.
2. A pure TypeScript validator with recursive type guards and whitelisted object construction achieves:
   - Zero additional dependencies.
   - 100% deterministic type checking and data sanitization.
   - Sub-millisecond execution even on payloads with thousands of records.

### 2.2 Complete Security Defenses: Prototype Pollution & DoS
1. **Threat Vectors in JavaScript**:
   - Object prototype poisoning via JSON parsing: If input contains `__proto__`, standard JSON parsing or shallow object spreading (`{ ...raw }`) can tamper with `Object.prototype`.
   - Object prototype poisoning via nested properties: Keys such as `constructor.prototype` or `__proto__` traversed in merge functions (`syncMerge.ts`) would pollute the global prototype chain for all subsequent objects.
   - Prototype poisoning via malicious accessors: If an attacker defines `__defineGetter__` or overrides `toString` / `valueOf` / `hasOwnProperty`.
   - Denial-of-Service / Memory Exhaustion: Gigantic JSON files (> 15MB), massive arrays (> 10,000 items), or deeply recursive structures (`{ a: { a: { a: ... } } }`) causing call stack overflows or browser tab freeze.

2. **Multi-Layered Defense Mechanism**:
   - **Layer 1: Safe JSON Parser (`safeJsonParse`)**:
     - Pre-parse size guard: Rejects raw strings exceeding `MAX_PAYLOAD_STRING_BYTES = 15 * 1024 * 1024` (15 MB) before parsing.
     - Custom JSON reviver: Checks every parsed key; if `key === '__proto__'` or `key === 'constructor'` or `key === 'prototype'`, it strips the property by returning `undefined`.
   - **Layer 2: In-Memory Recursive Prototype Scanner**:
     - Scans arbitrary in-memory objects (even if passed already parsed).
     - Uses `Object.prototype.hasOwnProperty.call(obj, key)` or `Object.hasOwn(obj, key)` to inspect own properties without triggering poisoned `obj.hasOwnProperty`.
     - Inspects `Object.getOwnPropertyNames(obj)` and explicitly checks `Object.getPrototypeOf(obj) === Object.prototype || Object.getPrototypeOf(obj) === null`.
     - Enforces `MAX_RECURSION_DEPTH = 32`. If depth > 32, aborts immediately with `"Maximum object nesting depth (32) exceeded"`.
   - **Layer 3: Whitelist Projection & Clean Prototype Construction**:
     - The validation function builds a fresh `sanitizedPayload` using clean object literals and copies only explicitly validated primitive fields and array elements.
     - Any extraneous, unexpected, or poisoned properties are discarded or flagged as warnings.

### 2.3 Strict Type Checking & Calendar-Valid ISO 8601 Parsing
1. Standard `new Date("2026-02-30")` or `Date.parse("2026-02-30")` in JavaScript silently rolls over to `2026-03-02`, creating corrupted timestamps.
2. ISO 8601 validation must combine regex format validation with calendar semantic verification:
   - Regex: `/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?)?$/`
   - Numeric range & calendar check: Year (1970–2100), Month (1–12), Day matching the actual days in that specific month and leap year (`dateObj.getUTCFullYear() === y`, `dateObj.getUTCMonth() === m - 1`, `dateObj.getUTCDate() === d`).

### 2.4 Schema Dual-Compatibility & Interoperability
1. As observed in Observation 1.5, `PROJECT.md` and `SCOPE.md` have slight variations in key names (`roster` vs `students`, `history` vs `sessions`, `clientVersion` vs `appVersion`, `isValid` vs `valid`).
2. To make `syncValidation.ts` resilient across all callers:
   - `ValidationResult` must provide BOTH `valid: boolean` AND `isValid: boolean`.
   - `ValidationResult` must provide BOTH `payload?: SyncPayload` AND `sanitizedPayload?: SyncPayload`.
   - The validator must accept incoming aliases (`roster` OR `students`, `history` OR `sessions`, `appVersion` OR `clientVersion`, `sourceDevice` OR `deviceId`) and normalize them into a canonical `SyncPayload`.

---

## 3. Detailed Algorithmic Specifications for `syncValidation.ts`

### 3.1 Proposed Module Architecture
The module `src/utils/syncValidation.ts` will export:

```typescript
// Type Guard Primitives
export function isRecord(value: unknown): value is Record<string, unknown>;
export function isNonEmptyString(value: unknown): value is string;
export function isFiniteNumber(value: unknown): value is number;
export function isValidIsoDateString(value: unknown): boolean;
export function isValidEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T;

// Security & Parsing
export function safeJsonParse(jsonString: string): { success: true; data: unknown } | { success: false; error: string };
export function scanForPrototypePollution(raw: unknown, path?: string, depth?: number): string[];

// Core Validators
export function validateMetadata(raw: unknown, path?: string): { valid: boolean; errors: string[]; warnings: string[]; metadata?: SyncMetadata };
export function validateStudentProfile(raw: unknown, index: number, path?: string): { valid: boolean; errors: string[]; warnings: string[]; student?: StudentProfile };
export function validateTestSessionRecord(raw: unknown, index: number, path?: string): { valid: boolean; errors: string[]; warnings: string[]; session?: TestSessionRecord };
export function validateTopicBreakdown(raw: unknown, path: string): { valid: boolean; errors: string[]; warnings: string[]; data?: Record<string, TopicBreakdownItem> | TopicBreakdownItem[] };
export function validateAnswerRecord(raw: unknown, index: number, path: string): { valid: boolean; errors: string[]; warnings: string[]; answer?: AnswerRecord };

// Primary Entry Point
export function validateSyncPayload(raw: unknown): ValidationResult;
export function validateAndSanitizeSyncPayload(raw: unknown): ValidationResult;
```

### 3.2 Field-by-Field Validation Rules

#### Top-Level Structure
| Field | Type | Constraint | Error on Violation |
|---|---|---|---|
| `root` | `Record<string, unknown>` | Must be a non-null object (not array, not primitive) | `"Payload root must be a non-null object."` |
| `schemaVersion` (or `metadata.schemaVersion`) | `number` | Integer `=== 1` | `"Unsupported schema version: ${v}. Maximum supported version is 1."` |
| `metadata` | `Record<string, unknown>` | Required object | `"metadata: Required object is missing or invalid."` |
| `metadata.exportedAt` | `string` | Valid ISO 8601 timestamp | `"metadata.exportedAt: Must be a valid ISO 8601 timestamp."` |
| `metadata.appVersion` / `clientVersion` | `string` | Optional / string <= 64 chars | `"metadata.appVersion: Expected string."` |
| `metadata.sourceDevice` / `deviceId` | `string` | Optional / string <= 128 chars | `"metadata.sourceDevice: Expected string."` |
| `data` | `Record<string, unknown>` | Required object containing roster & history | `"data: Required data object is missing."` |
| `data.roster` (or `data.students`) | `StudentProfile[]` | Array (max length 10,000) | `"data.roster: Expected array of student profiles."` |
| `data.history` (or `data.sessions`) | `TestSessionRecord[]` | Array (max length 25,000) | `"data.history: Expected array of session records."` |

#### `StudentProfile` Record
| Field | Type | Rules & Sanitization | Error / Warning |
|---|---|---|---|
| `id` | `string` | Non-empty trimmed string, length 1..128 | Error: `"data.roster[${i}].id: Required non-empty string."` |
| `name` | `string` | Non-empty trimmed string, length 1..256 | Error: `"data.roster[${i}].name: Required non-empty string."` |
| `gradeLevel` | `number \| string` | Number 1..13 or non-empty string (e.g. `"5"`, `"K"`) | Error if not number/string or NaN |
| `favoriteSubject` | `string` | String (default `""` if undefined) | Error if non-string |
| `problemSubject` | `string` | String (default `""` if undefined) | Error if non-string |
| `notes` | `string` | String <= 65536 chars (default `""`) | Error if non-string |
| `hobbies` | `string[]` | Array of strings (each <= 128 chars); sanitized to deduplicated strings | Warning if non-strings filtered out |
| `learningPreferences` | `string[]` | Array of strings (each <= 128 chars); sanitized | Warning if non-strings filtered out |
| `customNotes` | `string` | Optional string <= 65536 chars | Error if non-string |
| `accessibilitySettings` | `AccessibilitySettings` | Optional object: `preset` in `['standard', 'direct_reduced_sensory', 'custom']`, `directQuestions`: boolean, `reducedSensory`: boolean | Warning / Default if invalid |
| `createdAt` | `string` | Valid ISO 8601 timestamp | Error if invalid date string |
| `updatedAt` | `string` | Valid ISO 8601 timestamp (critical for LWW merge) | Error: `"data.roster[${i}].updatedAt: Must be a valid ISO 8601 timestamp."` |

#### `TestSessionRecord` Record
| Field | Type | Rules & Sanitization | Error / Warning |
|---|---|---|---|
| `sessionId` | `string` | Non-empty trimmed string, length 1..128 | Error: `"data.history[${i}].sessionId: Required non-empty string."` |
| `studentId` | `string` | Non-empty trimmed string, length 1..128 | Error: `"data.history[${i}].studentId: Required non-empty string."` |
| `studentName` | `string` | String <= 256 chars (default `""`) | Error if non-string |
| `date` | `string` | Valid ISO 8601 timestamp | Error: `"data.history[${i}].date: Invalid ISO 8601 date."` |
| `subject` | `string` | Non-empty string | Error if non-string |
| `mathLevelReached` | `number` | Finite number >= 0 | Error: `"data.history[${i}].mathLevelReached: Expected non-negative number."` |
| `englishLevelReached` | `number` | Finite number >= 0 | Error: `"data.history[${i}].englishLevelReached: Expected non-negative number."` |
| `score` | `number` | Finite number >= 0 | Error: `"data.history[${i}].score: Expected non-negative number."` |
| `totalQuestions` | `number` | Finite number >= 0 | Error: `"data.history[${i}].totalQuestions: Expected non-negative number."` |
| `topicBreakdown` | `Record<string, TopicBreakdownItem> \| TopicBreakdownItem[]` | Map or array of breakdown items: `topic` (string), `correct` (number >= 0), `total` (number >= 0), `accuracy` (0.0..1.0), `avgTime` (number >= 0) | Error if corrupted items |
| `cognitionStats` | `CognitionStatsRecord \| null` | Optional: `correct` (>=0), `total` (>=0), `accuracy` (0.0..1.0), `avgReactionTime` (>=0) | Error if malformed |
| `answers` | `AnswerRecord[]` | Array of answers (max 500 per session). Each item: `questionId` (string), `topic` (string), `subject` ('math'\|'english'\|'cognition'\|'warmup'), `isCorrect` (boolean), `timeTaken` (number >= 0), `usedExtraTime` (boolean) | Error if malformed answer records |

---

## 4. Edge Cases Matrix & Adversarial Hardening

| Edge Case Category | Specific Input Vector | Behavior & Sanitization Strategy | Result Status |
|---|---|---|---|
| **1. Malformed JSON Input** | `""` (empty string) | `safeJsonParse` rejects without exception | `valid: false`, Error: `"JSON payload is empty."` |
| | `"{ invalid json ..."` | `safeJsonParse` catches `SyntaxError` | `valid: false`, Error: `"Malformed JSON: Unexpected token ..."` |
| | `"<html><body>502 Bad Gateway</body></html>"` | `safeJsonParse` catches HTML response | `valid: false`, Error: `"Malformed JSON: Unexpected token '<'"` |
| | `"12345"` (JSON number) | Validates root type is object | `valid: false`, Error: `"Payload root must be a non-null object."` |
| | `"[ { \"id\": \"s1\" } ]"` (JSON array) | Validates root type is object, not array | `valid: false`, Error: `"Payload root must be an object, not an array."` |
| **2. Prototype Pollution Attacks** | `{"__proto__": {"isAdmin": true}}` | `safeJsonParse` reviver strips `__proto__`; `scanForPrototypePollution` flags violation | `valid: false`, Error: `"Security violation: Forbidden property '__proto__' detected."` |
| | `{"constructor": {"prototype": {"polluted": true}}}` | Stripped in reviver; in-memory scanner flags forbidden key | `valid: false`, Error: `"Security violation: Forbidden property 'constructor' detected."` |
| | `{"data": {"roster": [{"__proto__": {"injected": 1}}]}}` | In-memory scanner identifies path `data.roster[0].__proto__` | `valid: false`, Error: `"Security violation: Forbidden property '__proto__' at data.roster[0]."` |
| | Payload object with `hasOwnProperty` overridden to `null` | Uses `Object.prototype.hasOwnProperty.call(obj, k)` or `Object.hasOwn(obj, k)` | Safe execution without runtime crash |
| **3. Schema Versioning** | `schemaVersion: 0` or negative `-1` | Checks `v >= 1` | `valid: false`, Error: `"Invalid schema version 0: Version must be positive."` |
| | `schemaVersion: 2` (future major version) | Checks `v <= 1` | `valid: false`, Error: `"Unsupported schema version 2. Maximum supported version is 1."` |
| | Missing `schemaVersion` in metadata | Defaults to version 1 with warning | `valid: true`, Warning: `"Missing schemaVersion in metadata; defaulted to 1."` |
| | `schemaVersion: "1"` (string numeric) | Coerces to number 1 with warning | `valid: true`, Warning: `"metadata.schemaVersion was coerced from string to number 1."` |
| **4. Payload Limits & DoS** | Payload string > 15MB | Pre-parsing byte check stops processing | `valid: false`, Error: `"Payload exceeds maximum size limit (15MB)."` |
| | `data.roster.length > 10,000` | Array length bound check | `valid: false`, Error: `"data.roster exceeds maximum limit (10,000 records)."` |
| | `data.history.length > 25,000` | Array length bound check | `valid: false`, Error: `"data.history exceeds maximum limit (25,000 records)."` |
| | Object nesting depth > 32 levels | Recursion depth counter stops traversal | `valid: false`, Error: `"Maximum object nesting depth (32) exceeded."` |
| **5. Malformed Timestamps** | `date: "not-a-date"` | Fails ISO regex and `Date.parse` | `valid: false`, Error: `"data.history[0].date: Invalid ISO 8601 timestamp."` |
| | `date: "2026-02-30T10:00:00Z"` | Semantic calendar validation detects non-existent Feb 30 | `valid: false`, Error: `"data.history[0].date: Calendar date is invalid (Feb 30)."` |
| | `date: 1770000000000` (epoch number) | Coerces epoch number to ISO 8601 string | `valid: true`, Warning: `"data.history[0].date coerced from epoch number."` |
| | `updatedAt: ""` (empty string in student) | Flags missing timestamp or defaults to current time | `valid: false`, Error: `"data.roster[0].updatedAt: Missing or empty timestamp."` |
| **6. Array & Element Anomalies** | `roster: [null, undefined, 42]` | Detects non-object elements at specific indices | `valid: false`, Error: `"data.roster[0]: Student record must be an object, received null."` |
| | `roster: [{ name: "Max" }]` (missing `id`) | Checks required primary keys | `valid: false`, Error: `"data.roster[0].id: Required field is missing or empty."` |
| | `roster: [{ id: "s1" }]` (missing `name`) | Checks required primary keys | `valid: false`, Error: `"data.roster[0].name: Required field is missing or empty."` |
| | `history: [{ sessionId: "sess1", answers: "notAnArray" }]` | Validates nested array type | `valid: false`, Error: `"data.history[0].answers: Expected array, received string."` |
| | Duplicate `sessionId` in history array | Deduplicates in sanitized payload with warning | `valid: true`, Warning: `"Duplicate sessionId 'sess1' deduplicated."` |
| **7. Structural Key Aliases** | `data.students` instead of `data.roster` | Canonicalizes to `data.roster` & `data.students` | `valid: true`, Warning: `"Normalized 'students' alias to 'roster'."` |
| | `data.sessions` instead of `data.history` | Canonicalizes to `data.history` & `data.sessions` | `valid: true`, Warning: `"Normalized 'sessions' alias to 'history'."` |
| | `metadata.clientVersion` vs `appVersion` | Canonicalizes to both fields in metadata | `valid: true` |

---

## 5. Caveats
1. **Scope Boundary**: This investigation is strictly read-only and produced no modifications to `src/`.
2. **Schema Evolution**: The current validator design enforces `schemaVersion: 1`. When future milestones introduce `schemaVersion: 2`, migration adapters (`migratePayloadV1ToV2`) can be plugged into the validation pipeline prior to strict validation.
3. **Storage Quotas**: LocalStorage limits in mobile browsers typically range between 5MB and 10MB. While `validateSyncPayload` can validate payloads up to 15MB in memory, persistence into LocalStorage is subject to browser quotas, which is handled at the `studentRoster.ts` and `sessionHistory.ts` storage layer.

---

## 6. Conclusion
1. `src/utils/syncValidation.ts` can be implemented with **zero external dependencies** using pure TypeScript type guards and defensive recursion.
2. Complete security defense against prototype pollution requires a 3-layer architecture (`safeJsonParse` reviver, recursive `Object.hasOwn` scanning, and whitelisted object literal construction).
3. The validation engine should support dual-compatibility interfaces (`valid` / `isValid`, `payload` / `sanitizedPayload`, `roster` / `students`, `history` / `sessions`) to ensure seamless interoperability between `PROJECT.md`, `SCOPE.md`, and downstream modules (`syncMerge.ts`, `syncExportImport.ts`, `gistSync.ts`, and `SyncBackupModal.tsx`).
4. A complete edge-case test suite (`src/tests/syncValidation.test.ts`) should be implemented covering all 7 categories in the Edge Cases Matrix (≥30 targeted test cases).

---

## 7. Verification Method

### 7.1 Automated Suite Execution
Run the full test suite to ensure the environment is healthy and verify new validation tests once implemented:
```powershell
npx vitest run
```
*Expected Result*: All existing 47 test files (405 tests) and all new `syncValidation.test.ts` test suites pass with 100% success rate.

### 7.2 Specific Validation Test Suite
Once implemented by the builder agent, run:
```powershell
npx vitest run src/tests/syncValidation.test.ts
```

### 7.3 Invalidation Conditions
The validation specification would be invalidated if:
1. An unstripped `__proto__` or `constructor` property mutates `Object.prototype` during validation or parsing.
2. A malformed date like `"2026-02-30"` is accepted as a valid ISO 8601 date.
3. A future schema version (e.g. `schemaVersion: 2`) is silently accepted without migration.
4. An oversized payload (> 15MB) causes an unhandled memory exception or application crash.
