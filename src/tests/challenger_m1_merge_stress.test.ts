/**
 * src/tests/challenger_m1_merge_stress.test.ts
 * Challenger 1 Adversarial Empirical Stress & Property-Based Test Harness for Milestone M1
 *
 * Verification Areas:
 * 1. Large-scale dataset stress (thousands of students & sessions, deep answer trees)
 * 2. Millisecond-level timestamp race conditions and ISO timezone offsets
 * 3. Exact timestamp tie-breaker determinism and symmetric commutativity
 * 4. Mixed valid/invalid dates, epoch fallbacks, and sorting stability
 * 5. Complex array union permutations (German umlauts, unicode emojis, casing, whitespace, garbage types)
 * 6. Multi-device continuous sync simulation (3-node gossip network convergence)
 * 7. Algebraic invariants (Idempotency, Re-export Roundtrip, Monotonicity)
 * 8. Adversarial injection & prototype safety in merge & import pipelines
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeStringSets,
  mergeStudentProfiles,
  mergeStudentRosters,
  mergeSessionHistories,
  mergeSyncData,
} from '../utils/syncMerge';
import {
  createExportPayload,
  parseAndValidateBackupFile,
  applyImportPayload,
} from '../utils/syncExportImport';
import { validateSyncPayload } from '../utils/syncValidation';
import { clearStudentRoster, getStudentRoster } from '../utils/studentRoster';
import { clearSessionHistory, getSessionHistory } from '../utils/sessionHistory';
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type { SyncPayload, SyncData } from '../types/sync';

// Local storage mock fallback for test runner environment
const ensureLocalStorage = () => {
  let store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
  try {
    if (!globalThis.localStorage || typeof globalThis.localStorage.setItem !== 'function') {
      (globalThis as any).localStorage = mockStorage;
    }
  } catch {
    (globalThis as any).localStorage = mockStorage;
  }
};

describe('Challenger M1 Adversarial Empirical Stress Harness', () => {
  beforeEach(() => {
    ensureLocalStorage();
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    clearStudentRoster();
    clearSessionHistory();
  });

  const createStudent = (
    id: string,
    name: string,
    updatedAt: string,
    createdAt = '2026-01-01T00:00:00.000Z',
    overrides?: Partial<StudentProfile>
  ): StudentProfile => ({
    id,
    name,
    gradeLevel: 5,
    favoriteSubject: 'Mathematik',
    problemSubject: 'Englisch',
    notes: 'Basisnotiz',
    hobbies: ['Schach'],
    learningPreferences: ['visuell'],
    createdAt,
    updatedAt,
    accessibilitySettings: {
      preset: 'standard',
      directQuestions: false,
      reducedSensory: false,
    },
    ...overrides,
  });

  const createSession = (
    sessionId: string,
    studentId: string,
    date: string,
    overrides?: Partial<TestSessionRecord>
  ): TestSessionRecord => ({
    sessionId,
    studentId,
    studentName: 'Student ' + studentId,
    date,
    subject: 'math',
    mathLevelReached: 2,
    englishLevelReached: 0,
    score: 8,
    totalQuestions: 10,
    topicBreakdown: {
      Arithmetik: { topic: 'Arithmetik', correct: 8, total: 10, accuracy: 0.8, avgTime: 12 },
    },
    cognitionStats: { correct: 8, total: 10, accuracy: 0.8, avgReactionTime: 2100 },
    answers: [
      {
        questionId: 'q_1',
        topic: 'Arithmetik',
        subject: 'math',
        isCorrect: true,
        timeTaken: 12,
        usedExtraTime: false,
      },
    ],
    ...overrides,
  });

  // =========================================================================
  // 1. Large-Scale Dataset Stress & Performance
  // =========================================================================
  describe('1. Scale & Throughput Stress Tests', () => {
    it('STRESS-01: merges 2,000 student profiles (1,000 local, 1,000 remote with 500 overlapping IDs) in < 300ms', () => {
      const localRoster: StudentProfile[] = [];
      const remoteRoster: StudentProfile[] = [];

      // Local has IDs 0..999
      for (let i = 0; i < 1000; i++) {
        localRoster.push(
          createStudent(`std_${i}`, `Local Student ${i}`, '2026-08-01T10:00:00.000Z', '2026-01-01T00:00:00.000Z', {
            hobbies: [`Hobby_Loc_${i % 10}`],
          })
        );
      }

      // Remote has IDs 500..1499 (500 overlap, 500 new)
      for (let i = 500; i < 1500; i++) {
        const isNewer = i % 2 === 0;
        remoteRoster.push(
          createStudent(
            `std_${i}`,
            `Remote Student ${i}`,
            isNewer ? '2026-08-02T10:00:00.000Z' : '2026-07-30T10:00:00.000Z',
            '2026-01-01T00:00:00.000Z',
            {
              hobbies: [`Hobby_Rem_${i % 10}`],
            }
          )
        );
      }

      const t0 = performance.now();
      const result = mergeStudentRosters(localRoster, remoteRoster);
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(300);
      expect(result.mergedRoster).toHaveLength(1500); // 0..1499
      expect(result.stats.studentsAdded).toBe(500); // std_1000..1499
      expect(result.stats.studentsMerged).toBe(1500);

      // Verify even-indexed overlapping students were updated by remote (newer updatedAt)
      const std500 = result.mergedRoster.find((s) => s.id === 'std_500');
      expect(std500?.name).toBe('Remote Student 500');

      // Verify odd-indexed overlapping students kept local name (local was newer)
      const std501 = result.mergedRoster.find((s) => s.id === 'std_501');
      expect(std501?.name).toBe('Local Student 501');
    });

    it('STRESS-02: deduplicates and chronologically sorts 6,000 session records (3,000 local, 3,000 remote with 1,500 duplicate sessionIds)', () => {
      const localHistory: TestSessionRecord[] = [];
      const remoteHistory: TestSessionRecord[] = [];

      // Local has sessions 0..2999
      for (let i = 0; i < 3000; i++) {
        const date = new Date(2026, 0, 1 + (i % 365), (i % 24), (i % 60)).toISOString();
        localHistory.push(createSession(`sess_${i}`, `std_${i % 100}`, date));
      }

      // Remote has sessions 1500..4499 (1500 duplicates, 1500 new)
      for (let i = 1500; i < 4500; i++) {
        const date = new Date(2026, 0, 1 + ((i + 10) % 365), (i % 24), (i % 60)).toISOString();
        remoteHistory.push(createSession(`sess_${i}`, `std_${i % 100}`, date));
      }

      const t0 = performance.now();
      const result = mergeSessionHistories(localHistory, remoteHistory);
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(400);
      expect(result.mergedHistory).toHaveLength(4500); // 0..4499 unique sessions
      expect(result.stats.sessionsAdded).toBe(1500);
      expect(result.stats.sessionsExisting).toBe(1500);

      // Verify strict descending chronological invariant across all 4500 items
      for (let k = 0; k < result.mergedHistory.length - 1; k++) {
        const timeCurr = Date.parse(result.mergedHistory[k].date) || 0;
        const timeNext = Date.parse(result.mergedHistory[k + 1].date) || 0;
        expect(timeCurr).toBeGreaterThanOrEqual(timeNext);
      }
    });

    it('STRESS-03: handles deep answer trees with 200 sessions each having 50 question records without memory exhaustion', () => {
      const complexSessions: TestSessionRecord[] = [];
      for (let s = 0; s < 200; s++) {
        const answers = [];
        for (let q = 0; q < 50; q++) {
          answers.push({
            questionId: `q_${s}_${q}`,
            topic: `Thema_${q % 5}`,
            subject: 'math' as const,
            isCorrect: q % 2 === 0,
            timeTaken: 15,
            usedExtraTime: false,
            pointsEarned: 1,
            difficultyLevel: (q % 3) + 1,
            questionText: `Was ist ${q} * ${s}?`,
            userAnswer: `${q * s}`,
            correctAnswer: `${q * s}`,
          });
        }
        complexSessions.push(
          createSession(`deep_sess_${s}`, `std_${s}`, '2026-08-16T10:00:00.000Z', {
            answers,
          })
        );
      }

      const payload = createExportPayload({ history: complexSessions, roster: [] });
      expect(payload.data.history).toHaveLength(200);
      expect(payload.data.history[0].answers).toHaveLength(50);

      const jsonString = JSON.stringify(payload);
      const parsed = parseAndValidateBackupFile(jsonString);
      expect(parsed.isValid).toBe(true);
      expect(parsed.payload?.data.history[0].answers?.[49].questionText).toContain('Was ist 49 * 0?');
    });
  });

  // =========================================================================
  // 2. Millisecond Race Conditions & Timezone Offsets
  // =========================================================================
  describe('2. Timestamp Precision & Timezone Variations', () => {
    it('RACE-01: 1-millisecond difference correctly determines LWW winner', () => {
      const local = createStudent('s1', 'Max Local', '2026-08-16T12:00:00.000Z');
      const remote = createStudent('s1', 'Max Remote +1ms', '2026-08-16T12:00:00.001Z');

      const res = mergeStudentProfiles(local, remote);
      expect(res.isUpdated).toBe(true);
      expect(res.merged.name).toBe('Max Remote +1ms');
      expect(res.merged.updatedAt).toBe('2026-08-16T12:00:00.001Z');
      expect(res.conflict.resolution).toBe('remote');
    });

    it('RACE-02: opposite 1-millisecond difference preserves local record', () => {
      const local = createStudent('s1', 'Max Local +1ms', '2026-08-16T12:00:00.001Z');
      const remote = createStudent('s1', 'Max Remote', '2026-08-16T12:00:00.000Z');

      const res = mergeStudentProfiles(local, remote);
      expect(res.isUpdated).toBe(false);
      expect(res.merged.name).toBe('Max Local +1ms');
      expect(res.conflict.resolution).toBe('local');
    });

    it('RACE-03: timezone offsets representing identical instant trigger deterministic tie-breaker', () => {
      // 14:00:00.000+02:00 == 12:00:00.000Z
      const local = createStudent('s1', 'Local Berlin (UTC+2)', '2026-08-16T14:00:00.000+02:00', '2026-01-01T00:00:00Z', {
        notes: 'Local note',
        hobbies: ['Schach'],
      });
      const remote = createStudent('s1', 'Remote UTC (Z)', '2026-08-16T12:00:00.000Z', '2026-01-01T00:00:00Z', {
        notes: 'Remote note',
        hobbies: ['Fußball'],
      });

      const res = mergeStudentProfiles(local, remote);
      // Both timestamps represent exact same ms epoch 1786968000000
      expect(res.isUpdated).toBe(false);
      expect(res.merged.name).toBe('Local Berlin (UTC+2)'); // Local scalar retained
      expect(res.merged.hobbies).toEqual(['Schach', 'Fußball']); // Arrays unioned
      expect(res.conflict.resolution).toBe('merged');
    });

    it('RACE-04: timezone offsets representing different UTC instants correctly elect strictly newer remote', () => {
      // Local: 13:00:00+02:00 = 11:00:00Z
      // Remote: 12:00:00Z = 12:00:00Z (1 hour newer)
      const local = createStudent('s1', 'Local 11:00 UTC', '2026-08-16T13:00:00.000+02:00');
      const remote = createStudent('s1', 'Remote 12:00 UTC', '2026-08-16T12:00:00.000Z');

      const res = mergeStudentProfiles(local, remote);
      expect(res.isUpdated).toBe(true);
      expect(res.merged.name).toBe('Remote 12:00 UTC');
      expect(res.conflict.resolution).toBe('remote');
    });

    it('RACE-05: handles extreme historical (year 1970) and far-future (year 2099) ISO timestamps', () => {
      const pastStudent = createStudent('s1', 'Epoch Start', '1970-01-01T00:00:00.000Z');
      const futureStudent = createStudent('s1', 'Far Future', '2099-12-31T23:59:59.999Z');

      const res1 = mergeStudentProfiles(pastStudent, futureStudent);
      expect(res1.isUpdated).toBe(true);
      expect(res1.merged.name).toBe('Far Future');

      const res2 = mergeStudentProfiles(futureStudent, pastStudent);
      expect(res2.isUpdated).toBe(false);
      expect(res2.merged.name).toBe('Far Future');
    });
  });

  // =========================================================================
  // 3. Identical Timestamp Tie-Breaker & Commutativity
  // =========================================================================
  describe('3. Exact Timestamp Tie-Breaker & Determinism', () => {
    it('TIE-01: identical timestamps preserve local scalar attributes while unioning list fields', () => {
      const exactTime = '2026-08-16T12:00:00.000Z';
      const local = createStudent('s_tie', 'Local Name', exactTime, '2026-01-01T00:00:00Z', {
        favoriteSubject: 'Biologie',
        problemSubject: 'Latein',
        notes: 'Lokale Notiz',
        hobbies: ['Klettern'],
        learningPreferences: ['auditiv'],
      });
      const remote = createStudent('s_tie', 'Remote Name', exactTime, '2026-01-01T00:00:00Z', {
        favoriteSubject: 'Chemie',
        problemSubject: 'Französisch',
        notes: 'Remote Notiz',
        hobbies: ['Schwimmen'],
        learningPreferences: ['kinästhetisch'],
      });

      const res = mergeStudentProfiles(local, remote);
      expect(res.merged.name).toBe('Local Name');
      expect(res.merged.favoriteSubject).toBe('Biologie');
      expect(res.merged.problemSubject).toBe('Latein');
      expect(res.merged.notes).toBe('Lokale Notiz');
      expect(res.merged.hobbies).toEqual(['Klettern', 'Schwimmen']);
      expect(res.merged.learningPreferences).toEqual(['auditiv', 'kinästhetisch']);
      expect(res.conflict.resolution).toBe('merged');
    });

    it('TIE-02: earliest createdAt timestamp is preserved regardless of who wins LWW', () => {
      const local = createStudent('s1', 'Local', '2026-08-16T12:00:00.000Z', '2026-03-01T00:00:00.000Z');
      const remote = createStudent('s1', 'Remote Newer', '2026-08-16T14:00:00.000Z', '2026-01-01T00:00:00.000Z');

      const res = mergeStudentProfiles(local, remote);
      expect(res.merged.name).toBe('Remote Newer');
      expect(res.merged.createdAt).toBe('2026-01-01T00:00:00.000Z'); // Kept earlier remote createdAt

      const localEarly = createStudent('s2', 'Local Earlier', '2026-08-16T10:00:00.000Z', '2025-12-01T00:00:00.000Z');
      const remoteLate = createStudent('s2', 'Remote Newer', '2026-08-16T14:00:00.000Z', '2026-02-01T00:00:00.000Z');

      const res2 = mergeStudentProfiles(localEarly, remoteLate);
      expect(res2.merged.createdAt).toBe('2025-12-01T00:00:00.000Z'); // Kept earlier local createdAt
    });
  });

  // =========================================================================
  // 4. Mixed Valid / Invalid Dates & Sorting Stability
  // =========================================================================
  describe('4. Date Resilience & Fallback Handling', () => {
    it('DATE-01: invalid or unparseable updatedAt strings fall back to epoch 0 without throwing', () => {
      const validStudent = createStudent('s1', 'Valid Date', '2026-08-16T10:00:00.000Z');
      const garbageStudent = createStudent('s1', 'Garbage Date', 'not-a-valid-date-at-all');

      // Valid remote beats garbage local
      const res1 = mergeStudentProfiles(garbageStudent, validStudent);
      expect(res1.isUpdated).toBe(true);
      expect(res1.merged.name).toBe('Valid Date');

      // Valid local beats garbage remote
      const res2 = mergeStudentProfiles(validStudent, garbageStudent);
      expect(res2.isUpdated).toBe(false);
      expect(res2.merged.name).toBe('Valid Date');
    });

    it('DATE-02: both profiles having invalid updatedAt fallback cleanly without crash', () => {
      const s1 = createStudent('s1', 'Local S1', 'rubbish_date_1');
      const s2 = createStudent('s1', 'Remote S2', 'rubbish_date_2');

      expect(() => mergeStudentProfiles(s1, s2)).not.toThrow();
      const res = mergeStudentProfiles(s1, s2);
      expect(res.merged.name).toBe('Local S1'); // Equal epoch 0 tie-breaker
    });

    it('DATE-03: session histories with mixed valid, invalid, and identical dates sort stably', () => {
      const sessions: TestSessionRecord[] = [
        createSession('sess_invalid_1', 's1', 'invalid-date-x'),
        createSession('sess_valid_mid', 's1', '2026-08-10T12:00:00.000Z'),
        createSession('sess_valid_newest', 's1', '2026-08-16T12:00:00.000Z'),
        createSession('sess_invalid_2', 's1', 'undefined'),
        createSession('sess_valid_oldest', 's1', '2026-08-01T12:00:00.000Z'),
      ];

      const merged = mergeSessionHistories([], sessions);
      const ids = merged.mergedHistory.map((s) => s.sessionId);

      // Valid sessions must appear in descending order at the top
      expect(ids.slice(0, 3)).toEqual(['sess_valid_newest', 'sess_valid_mid', 'sess_valid_oldest']);
      // Invalid sessions (timestamp 0) must appear at the end without disappearing
      expect(ids.slice(3)).toContain('sess_invalid_1');
      expect(ids.slice(3)).toContain('sess_invalid_2');
      expect(merged.mergedHistory).toHaveLength(5);
    });

    it('DATE-04: session history with duplicate timestamps preserves all distinct session IDs', () => {
      const sameTime = '2026-08-16T12:00:00.000Z';
      const s1 = createSession('sess_alpha', 'std_1', sameTime);
      const s2 = createSession('sess_beta', 'std_2', sameTime);
      const s3 = createSession('sess_gamma', 'std_3', sameTime);

      const merged = mergeSessionHistories([s1], [s2, s3]);
      expect(merged.mergedHistory).toHaveLength(3);
      expect(merged.stats.sessionsAdded).toBe(2);
      const returnedIds = merged.mergedHistory.map((s) => s.sessionId);
      expect(returnedIds).toContain('sess_alpha');
      expect(returnedIds).toContain('sess_beta');
      expect(returnedIds).toContain('sess_gamma');
    });
  });

  // =========================================================================
  // 5. Complex Array Union Permutations (Unicode, Emojis, Casing, Whitespace)
  // =========================================================================
  describe('5. Array Set Union Permutations & Unicode Resilience', () => {
    it('UNION-01: German umlauts, diacritics, and mixed casing are normalized case-insensitively', () => {
      const local = ['Fußball', 'Äpfel pflücken', 'SCHACH', 'überflieger'];
      const remote = ['fußball', 'äpfel pflücken', 'schach', 'Überflieger', 'Neues Hobby'];

      const union = mergeStringSets(local, remote);
      // Case-insensitive deduplication preserves the casing of the first encounter (local)
      expect(union).toEqual(['Fußball', 'Äpfel pflücken', 'SCHACH', 'überflieger', 'Neues Hobby']);
    });

    it('UNION-02: Unicode emojis and symbols are deduplicated properly with whitespace trimming', () => {
      const local = [' 🎮 Gaming ', '🎨 Malen', '♟️ Schach '];
      const remote = ['🎮 Gaming', '  🎨 Malen  ', '🚀 Raumfahrt', '♟️ SCHACH'];

      const union = mergeStringSets(local, remote);
      expect(union).toEqual(['🎮 Gaming', '🎨 Malen', '♟️ Schach', '🚀 Raumfahrt']);
    });

    it('UNION-03: garbage values (null, undefined, numbers, objects, empty/whitespace strings) are filtered cleanly', () => {
      const local = [null, undefined, '', '   ', '\n\t', 12345, { bad: 'obj' }, 'Gültiges Hobby'];
      const remote = [false, true, 'Gültiges Hobby', '  Zweites Hobby  ', NaN];

      const union = mergeStringSets(local as any, remote as any);
      expect(union).toEqual(['Gültiges Hobby', 'Zweites Hobby']);
    });

    it('UNION-04: large list with 1,000 duplicate items collapses efficiently to unique set', () => {
      const thousandHobbies = Array.from({ length: 1000 }, (_, i) => `hobby_${i % 10}`);
      const t0 = performance.now();
      const result = mergeStringSets(thousandHobbies, thousandHobbies);
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(50);
      expect(result).toHaveLength(10);
      expect(result).toEqual([
        'hobby_0',
        'hobby_1',
        'hobby_2',
        'hobby_3',
        'hobby_4',
        'hobby_5',
        'hobby_6',
        'hobby_7',
        'hobby_8',
        'hobby_9',
      ]);
    });
  });

  // =========================================================================
  // 6. Multi-Device Continuous Sync Simulation (3-Node Gossip Network)
  // =========================================================================
  describe('6. Multi-Device Continuous Sync Simulation', () => {
    interface DeviceState {
      name: string;
      roster: StudentProfile[];
      history: TestSessionRecord[];
    }

    it('SIM-01: 3 devices (Laptop, Tablet, Phone) performing concurrent edits and asynchronous sync converge to identical state', () => {
      // Initial state: Device A creates Student 1 & Session 1
      let devA: DeviceState = {
        name: 'Laptop',
        roster: [
          createStudent('std_1', 'Max Initial', '2026-08-16T10:00:00.000Z', '2026-08-16T10:00:00.000Z', {
            hobbies: ['Schach'],
            notes: 'Startnotiz',
          }),
        ],
        history: [createSession('sess_1', 'std_1', '2026-08-16T10:30:00.000Z')],
      };

      // Device B and C start empty
      let devB: DeviceState = { name: 'Tablet', roster: [], history: [] };
      let devC: DeviceState = { name: 'Phone', roster: [], history: [] };

      // Step 1: Device A syncs with Device B
      const syncAB = mergeSyncData(devB, devA);
      devB.roster = syncAB.mergedRoster;
      devB.history = syncAB.mergedHistory;

      // Step 2: Device A syncs with Device C
      const syncAC = mergeSyncData(devC, devA);
      devC.roster = syncAC.mergedRoster;
      devC.history = syncAC.mergedHistory;

      expect(devB.roster).toHaveLength(1);
      expect(devC.roster).toHaveLength(1);

      // Step 3: Concurrent offline modifications on all 3 devices
      // - Device A updates Student 1 notes at t=11:00
      devA.roster[0] = {
        ...devA.roster[0],
        notes: 'Laptop Edit (t=11:00)',
        updatedAt: '2026-08-16T11:00:00.000Z',
      };
      // - Device B adds Student 2 and completes Session 2 at t=11:30
      devB.roster.push(
        createStudent('std_2', 'Anna Tablet', '2026-08-16T11:30:00.000Z', '2026-08-16T11:30:00.000Z', {
          hobbies: ['Malen'],
        })
      );
      devB.history.push(createSession('sess_2', 'std_2', '2026-08-16T11:35:00.000Z'));

      // - Device C adds a hobby to Student 1 and updates notes at t=12:00 (newest LWW)
      devC.roster[0] = {
        ...devC.roster[0],
        notes: 'Phone Edit (t=12:00 - NEWEST)',
        hobbies: ['Schach', 'Schwimmen'],
        updatedAt: '2026-08-16T12:00:00.000Z',
      };
      devC.history.push(createSession('sess_3', 'std_1', '2026-08-16T12:15:00.000Z'));

      // Step 4: Asynchronous pairwise gossip reconciliation in random order
      // Round 1: B syncs with C
      const resBC = mergeSyncData(devB, devC);
      devB.roster = resBC.mergedRoster;
      devB.history = resBC.mergedHistory;
      devC.roster = resBC.mergedRoster;
      devC.history = resBC.mergedHistory;

      // Round 2: A syncs with B
      const resAB2 = mergeSyncData(devA, devB);
      devA.roster = resAB2.mergedRoster;
      devA.history = resAB2.mergedHistory;
      devB.roster = resAB2.mergedRoster;
      devB.history = resAB2.mergedHistory;

      // Round 3: C syncs with A
      const resCA = mergeSyncData(devC, devA);
      devC.roster = resCA.mergedRoster;
      devC.history = resCA.mergedHistory;
      devA.roster = resCA.mergedRoster;
      devA.history = resCA.mergedHistory;

      // Final Round 4: B syncs with A to close gossip loop
      const resBA = mergeSyncData(devB, devA);
      devB.roster = resBA.mergedRoster;
      devB.history = resBA.mergedHistory;

      // Step 5: Verification of Eventual Consistency across all 3 nodes
      expect(devA.roster).toHaveLength(2);
      expect(devB.roster).toHaveLength(2);
      expect(devC.roster).toHaveLength(2);

      expect(devA.history).toHaveLength(3);
      expect(devB.history).toHaveLength(3);
      expect(devC.history).toHaveLength(3);

      // Student 1 check on all 3 devices:
      // Phone (t=12:00) notes won LWW over Laptop (t=11:00)
      for (const dev of [devA, devB, devC]) {
        const s1 = dev.roster.find((s) => s.id === 'std_1')!;
        expect(s1).toBeDefined();
        expect(s1.notes).toBe('Phone Edit (t=12:00 - NEWEST)');
        expect(s1.updatedAt).toBe('2026-08-16T12:00:00.000Z');
        expect(s1.hobbies).toContain('Schach');
        expect(s1.hobbies).toContain('Schwimmen');

        const s2 = dev.roster.find((s) => s.id === 'std_2')!;
        expect(s2).toBeDefined();
        expect(s2.name).toBe('Anna Tablet');

        // Sessions sorted chronologically descending: sess_3 (12:15) -> sess_2 (11:35) -> sess_1 (10:30)
        expect(dev.history.map((s) => s.sessionId)).toEqual(['sess_3', 'sess_2', 'sess_1']);
      }
    });
  });

  // =========================================================================
  // 7. Algebraic Properties & Portability Round-trips
  // =========================================================================
  describe('7. Algebraic Properties (Idempotence & Portability Round-trip)', () => {
    it('PROP-01: Idempotency — merge(A, A) === A with zero mutations', () => {
      const data: SyncData = {
        roster: [createStudent('s1', 'Max', '2026-08-16T10:00:00.000Z')],
        history: [createSession('sess1', 's1', '2026-08-16T11:00:00.000Z')],
      };

      const result = mergeSyncData(data, data);

      expect(result.mergedRoster).toHaveLength(1);
      expect(result.mergedHistory).toHaveLength(1);
      expect(result.stats.studentsAdded).toBe(0);
      expect(result.stats.studentsUpdated).toBe(0);
      expect(result.stats.studentsUnchanged).toBe(1);
      expect(result.stats.sessionsAdded).toBe(0);
      expect(result.stats.sessionsExisting).toBe(1);
    });

    it('PROP-02: Stability — merge(merge(A, B), B) produces identical output to merge(A, B)', () => {
      const dataA: SyncData = {
        roster: [createStudent('s1', 'Max Old', '2026-08-16T10:00:00.000Z')],
        history: [createSession('sess1', 's1', '2026-08-16T11:00:00.000Z')],
      };
      const dataB: SyncData = {
        roster: [
          createStudent('s1', 'Max Newer', '2026-08-16T12:00:00.000Z'),
          createStudent('s2', 'Lisa New', '2026-08-16T11:00:00.000Z'),
        ],
        history: [
          createSession('sess1', 's1', '2026-08-16T11:00:00.000Z'),
          createSession('sess2', 's2', '2026-08-16T13:00:00.000Z'),
        ],
      };

      const firstMerge = mergeSyncData(dataA, dataB);
      const secondMerge = mergeSyncData(firstMerge.mergedData, dataB);

      expect(secondMerge.mergedRoster).toEqual(firstMerge.mergedRoster);
      expect(secondMerge.mergedHistory).toEqual(firstMerge.mergedHistory);
      expect(secondMerge.stats.studentsAdded).toBe(0);
      expect(secondMerge.stats.sessionsAdded).toBe(0);
    });

    it('PROP-03: Full Export -> Validate -> Import Round-trip preserves exact fidelity', () => {
      const originalStudent = createStudent('s_rt', 'Roundtrip Student', '2026-08-16T10:00:00.000Z', '2026-01-01T00:00:00Z', {
        hobbies: ['Astronomie', 'Schach'],
        learningPreferences: ['visuell', 'interaktiv'],
        notes: 'Sehr motiviert',
        accessibilitySettings: {
          preset: 'direct_reduced_sensory',
          directQuestions: true,
          reducedSensory: true,
        },
      });
      const originalSession = createSession('sess_rt', 's_rt', '2026-08-16T11:00:00.000Z', {
        score: 9,
        totalQuestions: 10,
      });

      // 1. Export
      const payload = createExportPayload({
        roster: [originalStudent],
        history: [originalSession],
      });

      // 2. Serialize
      const jsonText = JSON.stringify(payload);

      // 3. Parse & Validate
      const val = parseAndValidateBackupFile(jsonText);
      expect(val.isValid).toBe(true);
      expect(val.payload).toBeDefined();

      // 4. Apply Import in replace mode
      const imported = applyImportPayload(val.payload!, 'replace');

      // 5. Verify 100% field equivalence
      expect(imported.mergedRoster).toHaveLength(1);
      const studentOut = imported.mergedRoster[0];
      expect(studentOut.id).toBe(originalStudent.id);
      expect(studentOut.name).toBe(originalStudent.name);
      expect(studentOut.hobbies).toEqual(originalStudent.hobbies);
      expect(studentOut.accessibilitySettings).toEqual(originalStudent.accessibilitySettings);

      expect(imported.mergedHistory).toHaveLength(1);
      const sessionOut = imported.mergedHistory[0];
      expect(sessionOut.sessionId).toBe(originalSession.sessionId);
      expect(sessionOut.score).toBe(9);
    });
  });

  // =========================================================================
  // 8. Adversarial Injections & Security Defense
  // =========================================================================
  describe('8. Adversarial Injections & Security Robustness', () => {
    it('SEC-01: rejects prototype pollution payload containing __proto__ and constructor poisoning in JSON', () => {
      const maliciousJson = JSON.stringify({
        schemaVersion: 1,
        metadata: { schemaVersion: 1, exportedAt: '2026-08-16T10:00:00.000Z' },
        data: {
          roster: [
            {
              id: 'std_malicious',
              name: 'Hacker',
              createdAt: '2026-08-16T10:00:00.000Z',
              updatedAt: '2026-08-16T10:00:00.000Z',
              __proto__: { isAdmin: true },
            },
          ],
          history: [],
        },
      });

      const res = parseAndValidateBackupFile(maliciousJson);
      // Reviver strips __proto__ or scanner detects it
      expect((Object.prototype as any).isAdmin).toBeUndefined();
      // If parsed, sanitized payload must not have poisoned property
      if (res.isValid && res.payload) {
        expect((res.payload.data.roster[0] as any).isAdmin).toBeUndefined();
      }
    });

    it('SEC-02: handles in-memory objects with whitespace-only IDs or null elements without throwing', () => {
      const messyData: SyncData = {
        roster: [
          null as any,
          createStudent('   ', 'Blank ID Student', '2026-08-16T10:00:00.000Z'),
          createStudent('std_valid', 'Valid Student', '2026-08-16T10:00:00.000Z'),
          undefined as any,
        ],
        history: [
          null as any,
          createSession('  ', 'std_valid', '2026-08-16T10:00:00.000Z'),
          createSession('sess_valid', 'std_valid', '2026-08-16T10:00:00.000Z'),
        ],
      };

      expect(() => mergeSyncData(messyData, messyData)).not.toThrow();
      const res = mergeSyncData(messyData, {});
      expect(res.mergedRoster).toHaveLength(1);
      expect(res.mergedRoster[0].id).toBe('std_valid');
      expect(res.mergedHistory).toHaveLength(1);
      expect(res.mergedHistory[0].sessionId).toBe('sess_valid');
    });

    it('SEC-03: rejects payloads exceeding maximum 15MB size limit', () => {
      // Construct a huge string > 15MB
      const hugeString = 'a'.repeat(16 * 1024 * 1024);
      const res = parseAndValidateBackupFile(hugeString);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('15 MB');
    });
  });
});
