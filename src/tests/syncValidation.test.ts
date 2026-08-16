/**
 * src/tests/syncValidation.test.ts
 * Comprehensive Test Suite for Schema Validation, Type Guards, Security & Boundary Defenses
 */

import { describe, it, expect } from 'vitest';
import {
  validateSyncPayload,
  validateAndSanitizeSyncPayload,
  safeJsonParse,
  scanForPrototypePollution,
  isValidIsoDateString,
  isRecord,
  isNonEmptyString,
  isFiniteNumber,
  validateStudentProfile,
  validateTestSessionRecord,
  MAX_RECURSION_DEPTH,
} from '../utils/syncValidation';
import { SYNC_SCHEMA_VERSION } from '../types/sync';
import type { SyncPayload, StudentProfile, TestSessionRecord } from '../types/sync';

describe('syncValidation — Schema & Security Engine', () => {
  const createValidStudent = (overrides?: Partial<StudentProfile>): StudentProfile => ({
    id: 'std_test_001',
    name: 'Max Mustermann',
    gradeLevel: 5,
    favoriteSubject: 'math',
    problemSubject: 'english',
    notes: 'Stärken in Geometrie',
    hobbies: ['Schach', 'Fußball'],
    learningPreferences: ['visuell', 'interaktiv'],
    customNotes: 'Zusatznotiz',
    accessibilitySettings: {
      preset: 'standard',
      directQuestions: false,
      reducedSensory: false,
    },
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:30:00.000Z',
    ...overrides,
  });

  const createValidSession = (overrides?: Partial<TestSessionRecord>): TestSessionRecord => ({
    sessionId: 'sess_test_001',
    studentId: 'std_test_001',
    studentName: 'Max Mustermann',
    date: '2026-08-16T14:00:00.000Z',
    subject: 'math',
    mathLevelReached: 3,
    englishLevelReached: 0,
    score: 8,
    totalQuestions: 10,
    topicBreakdown: {
      Addition: {
        topic: 'Addition',
        correct: 5,
        total: 5,
        accuracy: 1.0,
        avgTime: 4.2,
      },
    },
    cognitionStats: {
      correct: 3,
      total: 3,
      accuracy: 1.0,
      avgReactionTime: 450,
    },
    answers: [
      {
        questionId: 'q_add_1',
        topic: 'Addition',
        subject: 'math',
        isCorrect: true,
        timeTaken: 4.2,
        usedExtraTime: false,
        pointsEarned: 1,
      },
    ],
    motivation: 4,
    notes: 'Sehr konzentriert',
    ...overrides,
  });

  const createValidPayload = (): SyncPayload => ({
    version: SYNC_SCHEMA_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    metadata: {
      schemaVersion: SYNC_SCHEMA_VERSION,
      exportedAt: '2026-08-16T15:00:00.000Z',
      appVersion: '1.0.0',
      clientVersion: '1.0.0',
      sourceDevice: 'Laptop (Chrome)',
      deviceId: 'dev_123',
      itemCount: {
        students: 1,
        sessions: 1,
      },
    },
    data: {
      roster: [createValidStudent()],
      history: [createValidSession()],
    },
  });

  describe('Category 1: Happy Path & Valid Payloads', () => {
    it('validates a complete, well-formed SyncPayload successfully', () => {
      const payload = createValidPayload();
      const result = validateSyncPayload(payload);

      expect(result.isValid).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.payload).toBeDefined();
      expect(result.sanitizedPayload).toBeDefined();
      expect(result.payload?.data.roster).toHaveLength(1);
      expect(result.payload?.data.history).toHaveLength(1);
      expect(result.payload?.data.roster[0].name).toBe('Max Mustermann');
    });

    it('validates a minimal payload with empty roster and history', () => {
      const minimal = {
        metadata: {
          schemaVersion: 1,
          exportedAt: '2026-08-16T12:00:00.000Z',
        },
        data: {
          roster: [],
          history: [],
        },
      };
      const result = validateSyncPayload(minimal);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster).toEqual([]);
      expect(result.payload?.data.history).toEqual([]);
    });

    it('accepts string gradeLevel in StudentProfile', () => {
      const payload = createValidPayload();
      payload.data.roster[0].gradeLevel = '7. Klasse Realschule';
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster[0].gradeLevel).toBe('7. Klasse Realschule');
    });

    it('accepts topicBreakdown as an array of TopicBreakdownItem', () => {
      const payload = createValidPayload();
      payload.data.history[0].topicBreakdown = [
        { topic: 'Geometrie', correct: 3, total: 4, accuracy: 0.75, avgTime: 12.5 },
      ];
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.payload?.data.history[0].topicBreakdown)).toBe(true);
    });

    it('provides alias function validateAndSanitizeSyncPayload matching validateSyncPayload', () => {
      const payload = createValidPayload();
      const res1 = validateSyncPayload(payload);
      const res2 = validateAndSanitizeSyncPayload(payload);
      expect(res1.isValid).toBe(res2.isValid);
      expect(res1.payload?.data.roster.length).toBe(res2.payload?.data.roster.length);
    });
  });

  describe('Category 2: Corrupted, Non-Object, and Empty Inputs', () => {
    it('rejects null input gracefully', () => {
      const result = validateSyncPayload(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects undefined input gracefully', () => {
      const result = validateSyncPayload(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects primitive numbers and booleans', () => {
      expect(validateSyncPayload(12345).isValid).toBe(false);
      expect(validateSyncPayload(true).isValid).toBe(false);
      expect(validateSyncPayload('hello').isValid).toBe(false);
    });

    it('rejects top-level array', () => {
      const result = validateSyncPayload([createValidStudent()]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('JSON-Objekt');
    });

    it('handles empty strings in safeJsonParse', () => {
      const parseRes = safeJsonParse('');
      expect(parseRes.success).toBe(false);
      expect(parseRes.error).toContain('leer');
    });

    it('handles malformed JSON syntax in safeJsonParse', () => {
      const parseRes = safeJsonParse('INVALID JSON {{{');
      expect(parseRes.success).toBe(false);
      expect(parseRes.error).toContain('Ungültiges JSON-Format');
    });

    it('handles HTML responses (e.g. 502 gateway error) in safeJsonParse', () => {
      const parseRes = safeJsonParse('<html><body>502 Bad Gateway</body></html>');
      expect(parseRes.success).toBe(false);
      expect(parseRes.error).toContain('Ungültiges JSON-Format');
    });
  });

  describe('Category 3: Prototype Pollution & Security Defenses', () => {
    it('strips __proto__ in safeJsonParse reviver without polluting Object.prototype', () => {
      const maliciousJson = '{"__proto__": {"pollutedKey": "injectedValue"}, "data": {"roster": [], "history": []}}';
      const parseRes = safeJsonParse(maliciousJson);
      expect(parseRes.success).toBe(true);
      if (parseRes.success) {
        expect((Object.prototype as unknown as Record<string, unknown>).pollutedKey).toBeUndefined();
        expect(Object.prototype.hasOwnProperty.call(parseRes.data, '__proto__')).toBe(false);
      }
    });

    it('detects and flags constructor / prototype tampering in scanForPrototypePollution', () => {
      const dirtyObj = {
        constructor: {
          prototype: {
            polluted: true,
          },
        },
      };
      const violations = scanForPrototypePollution(dirtyObj);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toContain('Sicherheitsverletzung');
    });

    it('detects nested prototype pollution in student array', () => {
      const payload = createValidPayload() as unknown as Record<string, unknown>;
      (payload.data as Record<string, unknown>).roster = [
        {
          id: 'std_attack',
          name: 'Evil Student',
          __proto__: { isAdmin: true },
        },
      ];
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('__proto__') || e.includes('Sicherheitsverletzung'))).toBe(true);
    });

    it('prevents call stack overflow on deeply nested structures beyond MAX_RECURSION_DEPTH', () => {
      // Build an object nested 40 levels deep
      let nested: Record<string, unknown> = { leaf: true };
      for (let i = 0; i < MAX_RECURSION_DEPTH + 10; i++) {
        nested = { child: nested };
      }
      const violations = scanForPrototypePollution(nested);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.includes('Maximale Objektschachtelungstiefe'))).toBe(true);
    });
  });

  describe('Category 4: Schema Versioning & Boundary Limits', () => {
    it('rejects schemaVersion 0 or negative numbers', () => {
      const payload = createValidPayload();
      payload.metadata.schemaVersion = 0;
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Schema-Version'))).toBe(true);
    });

    it('rejects unsupported future schemaVersion > 1', () => {
      const payload = createValidPayload();
      payload.metadata.schemaVersion = 2;
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Nicht unterstützte Schema-Version'))).toBe(true);
    });

    it('gracefully accepts and coerces string schemaVersion "1" with a warning', () => {
      const payload = createValidPayload() as unknown as Record<string, unknown>;
      (payload.metadata as Record<string, unknown>).schemaVersion = '1';
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.metadata.schemaVersion).toBe(1);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('defaults missing schemaVersion to 1 with a warning', () => {
      const payload = createValidPayload() as unknown as Record<string, unknown>;
      delete (payload.metadata as Record<string, unknown>).schemaVersion;
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.metadata.schemaVersion).toBe(1);
    });
  });

  describe('Category 5: Calendar-Accurate Date Validation', () => {
    it('accepts valid ISO date strings', () => {
      expect(isValidIsoDateString('2026-08-16T19:20:00.000Z')).toBe(true);
      expect(isValidIsoDateString('2026-08-16T19:20:00Z')).toBe(true);
      expect(isValidIsoDateString('2026-08-16')).toBe(true);
      expect(isValidIsoDateString('2024-02-29T12:00:00Z')).toBe(true); // Leap year
    });

    it('strictly rejects non-existent calendar dates like February 30th', () => {
      expect(isValidIsoDateString('2026-02-30T10:00:00.000Z')).toBe(false);
      expect(isValidIsoDateString('2026-02-30')).toBe(false);
      expect(isValidIsoDateString('2025-02-29')).toBe(false); // 2025 is not a leap year
      expect(isValidIsoDateString('2026-04-31')).toBe(false); // April only has 30 days
    });

    it('rejects month 13 and day 32', () => {
      expect(isValidIsoDateString('2026-13-01')).toBe(false);
      expect(isValidIsoDateString('2026-01-32')).toBe(false);
    });

    it('rejects non-date strings and empty strings', () => {
      expect(isValidIsoDateString('')).toBe(false);
      expect(isValidIsoDateString('   ')).toBe(false);
      expect(isValidIsoDateString('yesterday')).toBe(false);
      expect(isValidIsoDateString('invalid-iso-date')).toBe(false);
      expect(isValidIsoDateString(null)).toBe(false);
      expect(isValidIsoDateString(12345)).toBe(false);
    });
  });

  describe('Category 6: StudentProfile and TestSessionRecord Field Checks', () => {
    it('rejects student with missing or empty id', () => {
      const student = createValidStudent({ id: '' });
      const res = validateStudentProfile(student, 0);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('rejects student with missing or empty name', () => {
      const student = createValidStudent({ name: '   ' });
      const res = validateStudentProfile(student, 0);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('sanitizes student hobbies and learningPreferences filtering out non-strings', () => {
      const student = createValidStudent({
        hobbies: ['Lesen', 123 as unknown as string, '  Schwimmen  ', '' as unknown as string],
      });
      const res = validateStudentProfile(student, 0);
      expect(res.valid).toBe(true);
      expect(res.student?.hobbies).toEqual(['Lesen', 'Schwimmen']);
    });

    it('rejects session with missing sessionId', () => {
      const session = createValidSession({ sessionId: '' });
      const res = validateTestSessionRecord(session, 0);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('sessionId'))).toBe(true);
    });

    it('rejects session with missing studentId', () => {
      const session = createValidSession({ studentId: '' });
      const res = validateTestSessionRecord(session, 0);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('studentId'))).toBe(true);
    });

    it('rejects session with invalid date', () => {
      const session = createValidSession({ date: '2026-02-30T12:00:00Z' });
      const res = validateTestSessionRecord(session, 0);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('date'))).toBe(true);
    });

    it('deduplicates duplicate session IDs in history with a warning', () => {
      const payload = createValidPayload();
      payload.data.history = [
        createValidSession({ sessionId: 'sess_dup_1' }),
        createValidSession({ sessionId: 'sess_dup_1' }),
      ];
      const result = validateSyncPayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.history).toHaveLength(1);
      expect(result.warnings?.some((w) => w.includes('Duplizierte Sitzungs-ID'))).toBe(true);
    });
  });

  describe('Category 7: Structural Key Aliases & Dual Compatibility', () => {
    it('accepts data.students alias and canonicalizes to roster & students', () => {
      const raw = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00Z' },
        data: {
          students: [createValidStudent()],
          history: [],
        },
      };
      const result = validateSyncPayload(raw);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster).toHaveLength(1);
      expect(result.payload?.data.students).toHaveLength(1);
    });

    it('accepts data.sessions alias and canonicalizes to history & sessions', () => {
      const raw = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00Z' },
        data: {
          roster: [],
          sessions: [createValidSession()],
        },
      };
      const result = validateSyncPayload(raw);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.history).toHaveLength(1);
      expect(result.payload?.data.sessions).toHaveLength(1);
    });

    it('embeds root-level arrays when data wrapper is missing', () => {
      const raw = {
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T12:00:00Z' },
        roster: [createValidStudent()],
        history: [createValidSession()],
      };
      const result = validateSyncPayload(raw);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster).toHaveLength(1);
      expect(result.warnings?.some((w) => w.includes('Stammebene'))).toBe(true);
    });
  });

  describe('Helper Type Guard Functions', () => {
    it('tests isRecord', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord('text')).toBe(false);
    });

    it('tests isNonEmptyString', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });

    it('tests isFiniteNumber', () => {
      expect(isFiniteNumber(42)).toBe(true);
      expect(isFiniteNumber(0)).toBe(true);
      expect(isFiniteNumber(-3.14)).toBe(true);
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(NaN)).toBe(false);
      expect(isFiniteNumber('42')).toBe(false);
    });
  });
});
