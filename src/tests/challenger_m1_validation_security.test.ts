/**
 * src/tests/challenger_m1_validation_security.test.ts
 * Challenger 2 Adversarial Stress Test Suite: syncValidation Security, Robustness & Boundary Matrix
 */

import { describe, it, expect } from 'vitest';
import {
  validateSyncPayload,
  validateAndSanitizeSyncPayload,
  safeJsonParse,
  scanForPrototypePollution,
  isValidIsoDateString,
  validateStudentProfile,
  validateTestSessionRecord,
  validateAccessibilitySettings,
  validateMetadata,
  MAX_PAYLOAD_STRING_BYTES,
  MAX_RECURSION_DEPTH,
  MAX_ROSTER_ITEMS,
  MAX_HISTORY_ITEMS,
  MAX_ANSWERS_PER_SESSION,
} from '../utils/syncValidation';
import { SYNC_SCHEMA_VERSION } from '../types/sync';
import type { SyncPayload, StudentProfile, TestSessionRecord } from '../types/sync';

describe('Challenger 2 — Adversarial Security, Edge Cases & Boundary Matrix', () => {
  // Helper to generate a pristine base student
  const makeBaseStudent = (id = 'std_adv_001'): StudentProfile => ({
    id,
    name: 'Test Student',
    gradeLevel: 6,
    favoriteSubject: 'math',
    problemSubject: 'english',
    notes: 'Sample note',
    hobbies: ['Chess', 'Reading'],
    learningPreferences: ['visual'],
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:30:00.000Z',
  });

  // Helper to generate a pristine base session
  const makeBaseSession = (sessionId = 'sess_adv_001', studentId = 'std_adv_001'): TestSessionRecord => ({
    sessionId,
    studentId,
    studentName: 'Test Student',
    date: '2026-08-16T14:00:00.000Z',
    subject: 'math',
    mathLevelReached: 4,
    englishLevelReached: 0,
    score: 9,
    totalQuestions: 10,
    topicBreakdown: {
      Fractions: {
        topic: 'Fractions',
        correct: 4,
        total: 5,
        accuracy: 0.8,
        avgTime: 5.5,
      },
    },
    cognitionStats: {
      correct: 4,
      total: 5,
      accuracy: 0.8,
      avgReactionTime: 420,
    },
    answers: [
      {
        questionId: 'q_frac_1',
        topic: 'Fractions',
        subject: 'math',
        isCorrect: true,
        timeTaken: 5.5,
        usedExtraTime: false,
      },
    ],
  });

  // Helper to generate base valid payload
  const makeBasePayload = (): SyncPayload => ({
    version: SYNC_SCHEMA_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    metadata: {
      schemaVersion: SYNC_SCHEMA_VERSION,
      exportedAt: '2026-08-16T15:00:00.000Z',
      appVersion: '1.0.0',
      clientVersion: '1.0.0',
      sourceDevice: 'StressTestHarness',
      deviceId: 'dev_stress_001',
      itemCount: { students: 1, sessions: 1 },
    },
    data: {
      roster: [makeBaseStudent()],
      history: [makeBaseSession()],
    },
  });

  // =========================================================================
  // SECTION 1: Advanced Prototype Pollution & Property Poisoning Attacks
  // =========================================================================
  describe('1. Advanced Prototype Pollution & Property Poisoning Vectors', () => {
    it('strips __proto__ from malicious nested JSON without polluting Object.prototype', () => {
      const maliciousJson = JSON.stringify({
        __proto__: { injectedTop: 'pwned' },
        metadata: {
          schemaVersion: 1,
          exportedAt: '2026-08-16T12:00:00.000Z',
          __proto__: { injectedMeta: 'pwned' },
        },
        data: {
          roster: [
            {
              id: 'std_evil',
              name: 'Evil Student',
              __proto__: { isAdmin: true },
            },
          ],
          history: [],
          __proto__: { injectedData: 'pwned' },
        },
      });

      const parseResult = safeJsonParse(maliciousJson);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        // Verify Object.prototype was NOT polluted
        expect((Object.prototype as unknown as Record<string, unknown>).injectedTop).toBeUndefined();
        expect((Object.prototype as unknown as Record<string, unknown>).injectedMeta).toBeUndefined();
        expect((Object.prototype as unknown as Record<string, unknown>).injectedData).toBeUndefined();
        expect((Object.prototype as unknown as Record<string, unknown>).isAdmin).toBeUndefined();

        const validationResult = validateSyncPayload(parseResult.data);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.payload?.data.roster).toHaveLength(1);
      }
    });

    it('rejects in-memory payload containing forbidden constructor / prototype keys', () => {
      const hostilePayload: Record<string, unknown> = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00.000Z' },
        data: {
          roster: [],
          history: [],
          prototype: { pollutedProto: 'injected' },
        },
      };

      const result = validateSyncPayload(hostilePayload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Sicherheitsverletzung') || e.includes('prototype'))).toBe(true);
    });

    it('handles objects with poisoned hasOwnProperty that throws an exception without crashing', () => {
      const poisonedObj: Record<string, unknown> = {
        id: 'std_poisoned_has_own',
        name: 'Poisoned Student',
        gradeLevel: 7,
        createdAt: '2026-08-16T12:00:00.000Z',
        updatedAt: '2026-08-16T12:00:00.000Z',
        hasOwnProperty: () => {
          throw new Error('Exploitative hasOwnProperty bomb');
        },
      };

      // scanForPrototypePollution must not crash
      expect(() => scanForPrototypePollution(poisonedObj)).not.toThrow();

      // validateStudentProfile must safely validate or reject without throwing unhandled exceptions
      expect(() => validateStudentProfile(poisonedObj, 0)).not.toThrow();
      const res = validateStudentProfile(poisonedObj, 0);
      expect(res.valid).toBe(true);
      expect(res.student?.id).toBe('std_poisoned_has_own');
    });

    it('handles objects with Object.create(null) (null prototype) cleanly', () => {
      const nullProtoStudent = Object.create(null);
      nullProtoStudent.id = 'std_null_proto';
      nullProtoStudent.name = 'Null Proto Student';
      nullProtoStudent.gradeLevel = 8;
      nullProtoStudent.createdAt = '2026-08-16T12:00:00.000Z';
      nullProtoStudent.updatedAt = '2026-08-16T12:00:00.000Z';

      const nullProtoPayload = Object.create(null);
      nullProtoPayload.metadata = Object.create(null);
      nullProtoPayload.metadata.schemaVersion = 1;
      nullProtoPayload.metadata.exportedAt = '2026-08-16T12:00:00.000Z';
      nullProtoPayload.data = Object.create(null);
      nullProtoPayload.data.roster = [nullProtoStudent];
      nullProtoPayload.data.history = [];

      expect(() => validateSyncPayload(nullProtoPayload)).not.toThrow();
      const result = validateSyncPayload(nullProtoPayload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster[0].id).toBe('std_null_proto');
    });

    it('detects and rejects objects with unauthorized custom prototype inheritance', () => {
      class MaliciousCustomClass {
        exploit() {
          return 'hacked';
        }
      }
      const maliciousInstance = new MaliciousCustomClass();
      Object.assign(maliciousInstance, {
        id: 'std_class_proto',
        name: 'Class Proto',
      });

      const payload = makeBasePayload();
      (payload.data.roster as unknown[]) = [maliciousInstance];

      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Sicherheitsverletzung: Verbotener Prototyp'))).toBe(true);
    });

    it('handles throwing getter properties safely without unhandled crashes', () => {
      const evilGetterObj = {
        id: 'std_evil_getter',
        name: 'Getter Bomb',
        get explosiveProperty() {
          throw new Error('Boom in getter');
        },
      };

      const violations = scanForPrototypePollution(evilGetterObj);
      expect(violations.some((v) => v.includes('Fehler beim Zugriff'))).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 2: Recursive Depth Limits & Circular Reference Traps
  // =========================================================================
  describe('2. Recursive Depth Stress & Circular Reference Traps', () => {
    it('enforces MAX_RECURSION_DEPTH (32) and detects deeply nested objects at level 33', () => {
      let current: Record<string, unknown> = { leaf: 'deep_node' };
      for (let i = 0; i < MAX_RECURSION_DEPTH + 1; i++) {
        current = { nest: current };
      }

      const violations = scanForPrototypePollution(current);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.includes(`Maximale Objektschachtelungstiefe (${MAX_RECURSION_DEPTH})`))).toBe(true);
    });

    it('allows valid nested objects within allowed depth limit (e.g. 10 levels)', () => {
      let current: Record<string, unknown> = { value: 123 };
      for (let i = 0; i < 10; i++) {
        current = { layer: current };
      }

      const violations = scanForPrototypePollution(current);
      expect(violations).toHaveLength(0);
    });

    it('prevents call stack overflow on circular object references', () => {
      const circularA: Record<string, unknown> = { name: 'A' };
      const circularB: Record<string, unknown> = { name: 'B', refA: circularA };
      circularA.refB = circularB;

      expect(() => scanForPrototypePollution(circularA)).not.toThrow();
      const violations = scanForPrototypePollution(circularA);
      // Because depth exceeds 32, it catches and flags without Infinite Loop
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.includes('Maximale Objektschachtelungstiefe'))).toBe(true);
    });

    it('rejects sync payload containing self-referencing circular data without hanging', () => {
      const payload: Record<string, unknown> = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00Z' },
        data: { roster: [], history: [] },
      };
      // Self reference
      payload.self = payload;

      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Maximale Objektschachtelungstiefe'))).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 3: Extreme Payloads, Oversized Strings, and Array Limits
  // =========================================================================
  describe('3. Extreme Payloads, Oversized Strings, and Array Limits', () => {
    it('safeJsonParse rejects payload strings exceeding MAX_PAYLOAD_STRING_BYTES (15 MB)', () => {
      // Build a string that is approximately 16 MB
      const targetSize = MAX_PAYLOAD_STRING_BYTES + 1024 * 1024; // 16MB
      const chunk = 'a'.repeat(1024 * 1024); // 1MB chunk
      const oversized = `{"data":"${chunk.repeat(16)}"}`;

      const result = safeJsonParse(oversized);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('15 MB');
      }
    });

    it('safely parses large payload just under size threshold (e.g. 500KB)', () => {
      const bigNotes = 'x'.repeat(400 * 1024); // 400KB
      const student = makeBaseStudent('std_big_notes');
      student.notes = bigNotes;

      const payload = makeBasePayload();
      payload.data.roster = [student];

      const json = JSON.stringify(payload);
      const parseRes = safeJsonParse(json);
      expect(parseRes.success).toBe(true);

      const valRes = validateSyncPayload(parseRes.success ? parseRes.data : null);
      expect(valRes.isValid).toBe(true);
      // Notes should be clamped to 65536 chars max safe length
      expect(valRes.payload?.data.roster[0].notes.length).toBeLessThanOrEqual(65536);
    });

    it('safely clamps oversized string fields to their designated maximums', () => {
      const student = makeBaseStudent();
      student.name = 'N'.repeat(1000); // Max is 256
      student.favoriteSubject = 'S'.repeat(500); // Max is 128
      student.problemSubject = 'P'.repeat(500); // Max is 128
      student.notes = 'Note'.repeat(20000); // Max is 65536

      const payload = makeBasePayload();
      payload.data.roster = [student];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      const sanitized = res.payload?.data.roster[0];
      expect(sanitized?.name.length).toBe(256);
      expect(sanitized?.favoriteSubject.length).toBe(128);
      expect(sanitized?.problemSubject.length).toBe(128);
      expect(sanitized?.notes.length).toBe(65536);
    });

    it('rejects roster array with > MAX_ROSTER_ITEMS (10,000)', () => {
      const payload = makeBasePayload();
      // Mock array with length property > 10,000
      payload.data.roster = new Array(MAX_ROSTER_ITEMS + 1).fill(makeBaseStudent());

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes(`data.roster: Überschreitet das maximale Limit`))).toBe(true);
    });

    it('rejects history array with > MAX_HISTORY_ITEMS (25,000)', () => {
      const payload = makeBasePayload();
      payload.data.history = new Array(MAX_HISTORY_ITEMS + 1).fill(makeBaseSession());

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes(`data.history: Überschreitet das maximale Limit`))).toBe(true);
    });

    it('truncates answers exceeding MAX_ANSWERS_PER_SESSION (1,000) with diagnostic warning', () => {
      const session = makeBaseSession();
      session.answers = new Array(MAX_ANSWERS_PER_SESSION + 50).fill(null).map((_, i) => ({
        questionId: `q_${i}`,
        topic: 'Algebra',
        subject: 'math' as const,
        isCorrect: true,
        timeTaken: 2.0,
        usedExtraTime: false,
      }));

      const payload = makeBasePayload();
      payload.data.history = [session];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      expect(res.payload?.data.history[0].answers.length).toBe(MAX_ANSWERS_PER_SESSION);
      expect(res.warnings.some((w) => w.includes('answers: Überschreitet maximales Limit'))).toBe(true);
    });

    it('handles sparse arrays with holes gracefully', () => {
      const payload = makeBasePayload();
      const sparseRoster = [makeBaseStudent('std_1'), undefined, makeBaseStudent('std_2')];
      (payload.data as Record<string, unknown>).roster = sparseRoster;

      const res = validateSyncPayload(payload);
      // undefined in roster triggers validation error for that index
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('data.roster[1]'))).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 4: Exhaustive Calendar & Leap-Year Boundary Matrix
  // =========================================================================
  describe('4. Exhaustive Calendar & Leap-Year Boundary Matrix', () => {
    describe('Leap Year vs Non-Leap Year February Calculations', () => {
      it('accepts Feb 29 in leap years (2024, 2028, 2032, 2000)', () => {
        expect(isValidIsoDateString('2024-02-29T00:00:00.000Z')).toBe(true);
        expect(isValidIsoDateString('2028-02-29T12:30:00Z')).toBe(true);
        expect(isValidIsoDateString('2032-02-29')).toBe(true);
        expect(isValidIsoDateString('2000-02-29T23:59:59Z')).toBe(true); // 2000 is divisible by 400
      });

      it('rejects Feb 29 in non-leap years (2025, 2026, 2027, 2023, 2022, 2021)', () => {
        expect(isValidIsoDateString('2025-02-29T00:00:00.000Z')).toBe(false);
        expect(isValidIsoDateString('2026-02-29T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2027-02-29')).toBe(false);
        expect(isValidIsoDateString('2023-02-29')).toBe(false);
        expect(isValidIsoDateString('2022-02-29')).toBe(false);
        expect(isValidIsoDateString('2021-02-29')).toBe(false);
      });

      it('strictly rejects century non-leap year (2100-02-29)', () => {
        // 2100 is divisible by 4 and 100, but NOT by 400 -> Not a leap year!
        expect(isValidIsoDateString('2100-02-29T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2100-02-29')).toBe(false);
      });

      it('strictly rejects non-existent dates Feb 30 and Feb 31 in ALL years', () => {
        expect(isValidIsoDateString('2024-02-30T10:00:00Z')).toBe(false); // Even leap year
        expect(isValidIsoDateString('2026-02-30T10:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-02-30')).toBe(false);
        expect(isValidIsoDateString('2024-02-31')).toBe(false);
        expect(isValidIsoDateString('2026-02-31')).toBe(false);
      });
    });

    describe('30-Day Month Boundary Violations', () => {
      it('rejects day 31 in 30-day months (April, June, September, November)', () => {
        expect(isValidIsoDateString('2026-04-31T12:00:00Z')).toBe(false); // April
        expect(isValidIsoDateString('2026-06-31T12:00:00Z')).toBe(false); // June
        expect(isValidIsoDateString('2026-09-31T12:00:00Z')).toBe(false); // September
        expect(isValidIsoDateString('2026-11-31T12:00:00Z')).toBe(false); // November
      });

      it('accepts day 30 in 30-day months', () => {
        expect(isValidIsoDateString('2026-04-30T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-06-30T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-09-30T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-11-30T12:00:00Z')).toBe(true);
      });

      it('accepts day 31 in 31-day months (Jan, Mar, May, Jul, Aug, Oct, Dec)', () => {
        expect(isValidIsoDateString('2026-01-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-03-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-05-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-07-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-08-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-10-31T12:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2026-12-31T12:00:00Z')).toBe(true);
      });
    });

    describe('Numeric Overflow & Out-of-Bounds Calendar Values', () => {
      it('rejects month 0 and month 13..99', () => {
        expect(isValidIsoDateString('2026-00-15T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-13-01T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-99-01T12:00:00Z')).toBe(false);
      });

      it('rejects day 0 and day 32..99', () => {
        expect(isValidIsoDateString('2026-08-00T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-08-32T12:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-08-99T12:00:00Z')).toBe(false);
      });

      it('enforces reasonable year bounds [1970, 2100]', () => {
        expect(isValidIsoDateString('1969-12-31T23:59:59Z')).toBe(false);
        expect(isValidIsoDateString('1970-01-01T00:00:00Z')).toBe(true);
        expect(isValidIsoDateString('2100-12-31T23:59:59Z')).toBe(true);
        expect(isValidIsoDateString('2101-01-01T00:00:00Z')).toBe(false);
        expect(isValidIsoDateString('0000-01-01T00:00:00Z')).toBe(false);
        expect(isValidIsoDateString('9999-12-31T23:59:59Z')).toBe(false);
      });

      it('rejects hour 24+, minute 60+, and second 60+', () => {
        expect(isValidIsoDateString('2026-08-16T24:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-08-16T25:00:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-08-16T12:60:00Z')).toBe(false);
        expect(isValidIsoDateString('2026-08-16T12:00:60Z')).toBe(false);
      });

      it('accepts valid time offsets (+02:00, -05:00, +0000)', () => {
        expect(isValidIsoDateString('2026-08-16T14:30:00+02:00')).toBe(true);
        expect(isValidIsoDateString('2026-08-16T08:30:00-05:00')).toBe(true);
        expect(isValidIsoDateString('2026-08-16T12:00:00+00:00')).toBe(true);
      });

      it('rejects invalid non-string or corrupted date types', () => {
        expect(isValidIsoDateString(null)).toBe(false);
        expect(isValidIsoDateString(undefined)).toBe(false);
        expect(isValidIsoDateString(true)).toBe(false);
        expect(isValidIsoDateString(false)).toBe(false);
        expect(isValidIsoDateString(NaN)).toBe(false);
        expect(isValidIsoDateString(Infinity)).toBe(false);
        expect(isValidIsoDateString({})).toBe(false);
        expect(isValidIsoDateString([])).toBe(false);
        expect(isValidIsoDateString(Symbol('date'))).toBe(false);
      });
    });
  });

  // =========================================================================
  // SECTION 5: Corrupted, Degraded, and Polymorphic Data Structures
  // =========================================================================
  describe('5. Corrupted, Degraded, and Polymorphic Data Structures', () => {
    it('rejects student profile with non-object item in roster array', () => {
      const payload = makeBasePayload();
      (payload.data.roster as unknown[]) = [
        makeBaseStudent('std_ok'),
        'I am not a student object',
        12345,
        null,
      ];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('data.roster[1]'))).toBe(true);
      expect(res.errors.some((e) => e.includes('data.roster[2]'))).toBe(true);
      expect(res.errors.some((e) => e.includes('data.roster[3]'))).toBe(true);
    });

    it('rejects session history with non-object item in history array', () => {
      const payload = makeBasePayload();
      (payload.data.history as unknown[]) = [
        makeBaseSession('sess_ok'),
        null,
        false,
        ['nested array instead of session'],
      ];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('data.history[1]'))).toBe(true);
      expect(res.errors.some((e) => e.includes('data.history[2]'))).toBe(true);
      expect(res.errors.some((e) => e.includes('data.history[3]'))).toBe(true);
    });

    it('rejects student with missing or whitespace-only name', () => {
      const s1 = makeBaseStudent('std_empty_name');
      s1.name = '';
      const res1 = validateStudentProfile(s1, 0);
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('name'))).toBe(true);

      const s2 = makeBaseStudent('std_space_name');
      s2.name = '     \t\n   ';
      const res2 = validateStudentProfile(s2, 0);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('rejects student with invalid createdAt or updatedAt date format', () => {
      const s1 = makeBaseStudent('std_bad_created');
      s1.createdAt = 'not-a-date';
      const res1 = validateStudentProfile(s1, 0);
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('createdAt'))).toBe(true);

      const s2 = makeBaseStudent('std_bad_updated');
      s2.updatedAt = '2026-02-30T10:00:00Z'; // Feb 30!
      const res2 = validateStudentProfile(s2, 0);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('updatedAt'))).toBe(true);
    });

    it('safely sanitizes non-string elements in hobbies and learningPreferences', () => {
      const rawStudent = {
        id: 'std_weird_arrays',
        name: 'Weird Arrays Student',
        gradeLevel: 5,
        hobbies: ['Valid Hobby', null, 42, true, {}, 'Another Hobby  '],
        learningPreferences: [undefined, 'audio', false, '  kinesthetic '],
        createdAt: '2026-08-16T12:00:00.000Z',
        updatedAt: '2026-08-16T12:00:00.000Z',
      };

      const res = validateStudentProfile(rawStudent, 0);
      expect(res.valid).toBe(true);
      expect(res.student?.hobbies).toEqual(['Valid Hobby', 'Another Hobby']);
      expect(res.student?.learningPreferences).toEqual(['audio', 'kinesthetic']);
    });

    it('validates AccessibilitySettings with fallback for corrupted preset', () => {
      const res = validateAccessibilitySettings(
        {
          preset: 'super_hacked_preset',
          directQuestions: 'truthy string' as unknown as boolean,
          reducedSensory: 1 as unknown as boolean,
        },
        'test.accessibilitySettings'
      );

      expect(res.valid).toBe(true);
      expect(res.settings.preset).toBe('standard'); // Reverted to standard
      expect(res.settings.directQuestions).toBe(true); // Coerced
      expect(res.settings.reducedSensory).toBe(true); // Coerced
      expect(res.warnings.some((w) => w.includes('Unbekanntes Preset'))).toBe(true);
    });

    it('rejects topicBreakdownItem with empty topic or invalid object', () => {
      const session = makeBaseSession();
      session.topicBreakdown = {
        BadTopic: {
          topic: '', // empty topic!
          correct: 1,
          total: 2,
          accuracy: 0.5,
          avgTime: 10,
        },
      };

      const payload = makeBasePayload();
      payload.data.history = [session];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('topic: Thema darf nicht leer sein'))).toBe(true);
    });

    it('sanitizes cognitionStats with NaN, Infinity, or negative values safely', () => {
      const session = makeBaseSession();
      session.cognitionStats = {
        correct: NaN,
        total: Infinity,
        accuracy: -0.5,
        avgReactionTime: NaN,
      };

      const payload = makeBasePayload();
      payload.data.history = [session];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      // NaN/Infinity should be coerced to 0
      const stat = res.payload?.data.history[0].cognitionStats;
      expect(stat?.correct).toBe(0);
      expect(stat?.total).toBe(0);
      expect(stat?.accuracy).toBe(0);
      expect(stat?.avgReactionTime).toBe(0);
    });

    it('rejects answers with missing questionId', () => {
      const session = makeBaseSession();
      session.answers = [
        {
          questionId: '',
          topic: 'Math',
          subject: 'math',
          isCorrect: true,
          timeTaken: 3.0,
          usedExtraTime: false,
        },
      ];

      const payload = makeBasePayload();
      payload.data.history = [session];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('questionId: Erforderliche Frage-ID fehlt'))).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 6: Injection, Unicode, and Hostile Payloads
  // =========================================================================
  describe('6. Injection, Unicode, and Hostile Strings', () => {
    it('safely handles XSS scripts in notes, name, and subject without executing or mangling safe content', () => {
      const payload = makeBasePayload();
      const xssStudent = makeBaseStudent('std_xss');
      xssStudent.name = '<script>alert("XSS")</script>';
      xssStudent.notes = '<img src=x onerror="fetch(\'http://attacker.com\')" />';
      xssStudent.customNotes = '<iframe src="javascript:alert(1)"></iframe>';
      payload.data.roster = [xssStudent];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      expect(res.payload?.data.roster[0].name).toBe('<script>alert("XSS")</script>');
      expect(res.payload?.data.roster[0].notes).toContain('<img src=x');
    });

    it('safely handles SQL injection patterns in IDs, names, and notes', () => {
      const payload = makeBasePayload();
      const sqlStudent = makeBaseStudent("std_'; DROP TABLE students; --");
      sqlStudent.name = "Robert'); DROP TABLE students;--";
      payload.data.roster = [sqlStudent];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      expect(res.payload?.data.roster[0].id).toBe("std_'; DROP TABLE students; --");
      expect(res.payload?.data.roster[0].name).toBe("Robert'); DROP TABLE students;--");
    });

    it('preserves multi-lingual Unicode, German Umlauts, and Emoji payloads flawlessly', () => {
      const payload = makeBasePayload();
      const unicodeStudent = makeBaseStudent('std_unicode');
      unicodeStudent.name = 'Klara Müller-Lüdenscheidt 🧑‍🎓';
      unicodeStudent.notes = 'Stärken: 100% 🎯, Mathe: √x + π = ∑. 日本語 & العربية.';
      unicodeStudent.hobbies = ['Fußball ⚽', 'Schach ♟️', 'Programmieren 💻'];
      payload.data.roster = [unicodeStudent];

      const res = validateSyncPayload(payload);
      expect(res.isValid).toBe(true);
      expect(res.payload?.data.roster[0].name).toBe('Klara Müller-Lüdenscheidt 🧑‍🎓');
      expect(res.payload?.data.roster[0].notes).toContain('100% 🎯');
      expect(res.payload?.data.roster[0].hobbies).toContain('Fußball ⚽');
    });
  });

  // =========================================================================
  // SECTION 7: Metadata Edge Cases & Invalidation Scenarios
  // =========================================================================
  describe('7. Metadata Edge Cases & Invalidation Scenarios', () => {
    it('rejects metadata when it is null, array, or primitive', () => {
      expect(validateMetadata(null).valid).toBe(false);
      expect(validateMetadata([]).valid).toBe(false);
      expect(validateMetadata('invalid').valid).toBe(false);
      expect(validateMetadata(12345).valid).toBe(false);
    });

    it('handles negative or NaN numeric exportedAt in metadata gracefully', () => {
      const res1 = validateMetadata({ schemaVersion: 1, exportedAt: -5000 });
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('exportedAt'))).toBe(true);

      const res2 = validateMetadata({ schemaVersion: 1, exportedAt: NaN });
      expect(res2.valid).toBe(false);
    });

    it('safely converts positive timestamp in metadata exportedAt with warning', () => {
      const nowMs = Date.now();
      const res = validateMetadata({ schemaVersion: 1, exportedAt: nowMs });
      expect(res.valid).toBe(true);
      expect(isValidIsoDateString(res.metadata?.exportedAt)).toBe(true);
      expect(res.warnings.some((w) => w.includes('Unix-Timestamp'))).toBe(true);
    });

    it('rejects payload when data is an empty string or primitive', () => {
      const rawPayload = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00Z' },
        data: 'not an object',
      };
      const res = validateSyncPayload(rawPayload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes("Erforderliches 'data'-Objekt fehlt"))).toBe(true);
    });
  });
});
