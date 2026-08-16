import { describe, it, expect } from 'vitest';
import {
  mergeStringSets,
  mergeStudentProfiles,
  mergeStudentRosters,
  mergeSessionHistories,
  mergeSyncData,
} from '../utils/syncMerge';
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';

describe('syncMerge Test Suite — Deterministic Merge & Deduplication Engine', () => {
  const createStudent = (id: string, name: string, updatedAt: string, overrides?: Partial<StudentProfile>): StudentProfile => ({
    id,
    name,
    gradeLevel: 5,
    favoriteSubject: 'Mathematik',
    problemSubject: 'Englisch',
    notes: 'Basisnotiz',
    hobbies: ['Schach'],
    learningPreferences: ['visuell'],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt,
    accessibilitySettings: {
      preset: 'standard',
      directQuestions: false,
      reducedSensory: false,
    },
    ...overrides,
  });

  const createSession = (sessionId: string, studentId: string, date: string, overrides?: Partial<TestSessionRecord>): TestSessionRecord => ({
    sessionId,
    studentId,
    studentName: 'Max',
    date,
    subject: 'math',
    mathLevelReached: 2,
    englishLevelReached: 0,
    score: 5,
    totalQuestions: 5,
    topicBreakdown: {},
    answers: [],
    ...overrides,
  });

  describe('mergeStringSets (Case-Insensitive Set Union)', () => {
    it('TC-MRG-01: unions two string arrays preserving insertion order and first occurrence casing', () => {
      const local = ['Schach', 'Fußball', 'Lesen'];
      const remote = ['fußball', 'Programmieren', 'schach', 'Musik'];
      const result = mergeStringSets(local, remote);

      expect(result).toEqual(['Schach', 'Fußball', 'Lesen', 'Programmieren', 'Musik']);
    });

    it('TC-MRG-02: trims whitespace and ignores empty strings or non-strings', () => {
      const local = ['  Robotik  ', '', '   '];
      const remote = [123 as unknown as string, 'Robotik', '  Gaming  '];
      const result = mergeStringSets(local, remote);

      expect(result).toEqual(['Robotik', 'Gaming']);
    });

    it('TC-MRG-03: handles undefined, null, and empty arrays gracefully without throwing', () => {
      expect(mergeStringSets(undefined, undefined)).toEqual([]);
      expect(mergeStringSets(['Schach'], undefined)).toEqual(['Schach']);
      expect(mergeStringSets(undefined, ['Lesen'])).toEqual(['Lesen']);
      expect(mergeStringSets(null as any, ['Gaming'])).toEqual(['Gaming']);
    });
  });

  describe('Tier 1: mergeStudentProfiles (Last-Write-Wins Resolution)', () => {
    it('TC-MRG-04: elects remote profile when remote updatedAt is strictly newer', () => {
      const local = createStudent('s1', 'Max Local', '2026-08-16T10:00:00.000Z', {
        notes: 'Alte Notiz',
        hobbies: ['Schach'],
      });
      const remote = createStudent('s1', 'Max Remote Newer', '2026-08-16T12:00:00.000Z', {
        notes: 'Neue Notiz vom Tablet',
        hobbies: ['Fußball'],
      });

      const { merged, conflict, isUpdated } = mergeStudentProfiles(local, remote);

      expect(isUpdated).toBe(true);
      expect(merged.name).toBe('Max Remote Newer');
      expect(merged.notes).toBe('Neue Notiz vom Tablet');
      expect(merged.updatedAt).toBe('2026-08-16T12:00:00.000Z');
      expect(merged.hobbies).toEqual(['Schach', 'Fußball']);
      expect(conflict.resolution).toBe('remote');
    });

    it('TC-MRG-05: elects local profile when local updatedAt is strictly newer', () => {
      const local = createStudent('s1', 'Max Local Newer', '2026-08-16T14:00:00.000Z', {
        notes: 'Neueste Notiz vom Laptop',
        hobbies: ['Schach'],
      });
      const remote = createStudent('s1', 'Max Remote Older', '2026-08-16T11:00:00.000Z', {
        notes: 'Veraltete Notiz',
        hobbies: ['Schwimmen'],
      });

      const { merged, conflict, isUpdated } = mergeStudentProfiles(local, remote);

      expect(isUpdated).toBe(false);
      expect(merged.name).toBe('Max Local Newer');
      expect(merged.notes).toBe('Neueste Notiz vom Laptop');
      expect(merged.updatedAt).toBe('2026-08-16T14:00:00.000Z');
      expect(merged.hobbies).toEqual(['Schach', 'Schwimmen']);
      expect(conflict.resolution).toBe('local');
    });

    it('TC-MRG-06: deterministically breaks ties when timestamps are identical by preserving local scalar fields and unioning sets', () => {
      const timestamp = '2026-08-16T12:00:00.000Z';
      const local = createStudent('s1', 'Max Tie Local', timestamp, {
        notes: 'Local note',
        hobbies: ['Schach'],
      });
      const remote = createStudent('s1', 'Max Tie Remote', timestamp, {
        notes: 'Remote note',
        hobbies: ['Gaming'],
      });

      const { merged, conflict, isUpdated } = mergeStudentProfiles(local, remote);

      expect(isUpdated).toBe(false);
      expect(merged.name).toBe('Max Tie Local');
      expect(merged.hobbies).toEqual(['Schach', 'Gaming']);
      expect(conflict.resolution).toBe('merged');
    });

    it('TC-MRG-07: preserves the earliest createdAt timestamp across profiles for historical integrity', () => {
      const local = createStudent('s1', 'Max', '2026-08-16T12:00:00.000Z', {
        createdAt: '2026-02-15T08:00:00.000Z',
      });
      const remote = createStudent('s1', 'Max Updated', '2026-08-16T14:00:00.000Z', {
        createdAt: '2026-01-10T08:00:00.000Z', // Earlier
      });

      const { merged } = mergeStudentProfiles(local, remote);
      expect(merged.createdAt).toBe('2026-01-10T08:00:00.000Z');
    });

    it('TC-MRG-08: preserves accessibility settings from the winning profile', () => {
      const local = createStudent('s1', 'Max', '2026-08-16T10:00:00.000Z', {
        accessibilitySettings: { preset: 'standard', directQuestions: false, reducedSensory: false },
      });
      const remote = createStudent('s1', 'Max', '2026-08-16T12:00:00.000Z', {
        accessibilitySettings: { preset: 'direct_reduced_sensory', directQuestions: true, reducedSensory: true },
      });

      const { merged } = mergeStudentProfiles(local, remote);
      expect(merged.accessibilitySettings?.preset).toBe('direct_reduced_sensory');
      expect(merged.accessibilitySettings?.directQuestions).toBe(true);
      expect(merged.accessibilitySettings?.reducedSensory).toBe(true);
    });
  });

  describe('Tier 1: mergeStudentRosters', () => {
    it('TC-MRG-09: adds new students from remote and updates overlapping ones with accurate stats', () => {
      const localRoster = [
        createStudent('s1', 'Max Local', '2026-08-16T10:00:00.000Z'),
        createStudent('s2', 'Anna Local', '2026-08-16T10:00:00.000Z'),
      ];
      const remoteRoster = [
        createStudent('s1', 'Max Remote Updated', '2026-08-16T11:00:00.000Z'), // Updated
        createStudent('s3', 'Tim New Remote', '2026-08-16T10:30:00.000Z'), // New
      ];

      const result = mergeStudentRosters(localRoster, remoteRoster);

      expect(result.mergedRoster).toHaveLength(3);
      expect(result.stats.studentsAdded).toBe(1); // s3
      expect(result.stats.studentsUpdated).toBe(1); // s1
      expect(result.stats.studentsUnchanged).toBe(0);
      expect(result.stats.studentsMerged).toBe(3);

      const s1 = result.mergedRoster.find((s) => s.id === 's1');
      expect(s1?.name).toBe('Max Remote Updated');
      const s3 = result.mergedRoster.find((s) => s.id === 's3');
      expect(s3?.name).toBe('Tim New Remote');
    });

    it('TC-MRG-10: merges disjoint rosters preserving all profiles from both local and remote', () => {
      const local = [createStudent('loc_1', 'Local Only', '2026-08-01T00:00:00.000Z')];
      const remote = [createStudent('rem_1', 'Remote Only', '2026-08-02T00:00:00.000Z')];

      const result = mergeStudentRosters(local, remote);
      expect(result.mergedRoster).toHaveLength(2);
      expect(result.stats.studentsAdded).toBe(1);
      expect(result.stats.studentsUpdated).toBe(0);
      expect(result.stats.studentsUnchanged).toBe(0);
    });
  });

  describe('Tier 1: mergeSessionHistories (Deduplication & Sorting)', () => {
    it('TC-MRG-11: deduplicates sessions by sessionId and sorts chronologically descending', () => {
      const localHistory = [
        createSession('sess_1', 's1', '2026-08-10T10:00:00.000Z'),
        createSession('sess_2', 's1', '2026-08-12T10:00:00.000Z'),
      ];
      const remoteHistory = [
        createSession('sess_2', 's1', '2026-08-12T10:00:00.000Z'), // Duplicate
        createSession('sess_3', 's2', '2026-08-15T10:00:00.000Z'), // Newer
        createSession('sess_0', 's1', '2026-08-01T10:00:00.000Z'), // Older
      ];

      const result = mergeSessionHistories(localHistory, remoteHistory);

      expect(result.mergedHistory).toHaveLength(4);
      expect(result.stats.sessionsAdded).toBe(2); // sess_3, sess_0
      expect(result.stats.sessionsExisting).toBe(1); // sess_2 duplicate
      expect(result.stats.sessionsSkipped).toBe(1);

      // Verify descending order: sess_3 (Aug 15) -> sess_2 (Aug 12) -> sess_1 (Aug 10) -> sess_0 (Aug 1)
      expect(result.mergedHistory.map((s) => s.sessionId)).toEqual(['sess_3', 'sess_2', 'sess_1', 'sess_0']);
    });

    it('TC-MRG-12: preserves detailed answers and topic breakdown on merged session records', () => {
      const incoming = createSession('sess_rich', 'std_100', '2026-08-16T12:00:00.000Z', {
        topicBreakdown: {
          Geometrie: { topic: 'Geometrie', correct: 5, total: 5, accuracy: 1.0, avgTime: 10 },
        },
        cognitionStats: { correct: 5, total: 5, accuracy: 1.0, avgReactionTime: 2200 },
        answers: [{ questionId: 'q_geo_1', topic: 'Geometrie', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false }],
      });

      const result = mergeSessionHistories([], [incoming]);
      expect(result.mergedHistory).toHaveLength(1);
      expect(result.mergedHistory[0].cognitionStats?.avgReactionTime).toBe(2200);
      expect(result.mergedHistory[0].answers).toHaveLength(1);
    });
  });

  describe('Tier 2: Boundary, Missing Timestamps & Fallbacks', () => {
    it('TC-MRG-13: handles empty local roster + populated incoming roster correctly', () => {
      const incoming = [createStudent('std_new', 'New', '2026-08-16T10:00:00.000Z')];
      const result = mergeStudentRosters([], incoming);

      expect(result.mergedRoster).toHaveLength(1);
      expect(result.stats.studentsAdded).toBe(1);
    });

    it('TC-MRG-14: handles populated local roster + empty incoming roster correctly', () => {
      const local = [createStudent('std_local', 'Local', '2026-08-16T10:00:00.000Z')];
      const result = mergeStudentRosters(local, []);

      expect(result.mergedRoster).toHaveLength(1);
      expect(result.stats.studentsAdded).toBe(0);
      expect(result.stats.studentsUpdated).toBe(0);
    });

    it('TC-MRG-15: handles both rosters empty with zero counts', () => {
      const result = mergeStudentRosters([], []);
      expect(result.mergedRoster).toEqual([]);
      expect(result.stats.studentsAdded).toBe(0);
      expect(result.stats.studentsUpdated).toBe(0);
    });

    it('TC-MRG-16: falls back to createdAt or epoch 0 when profile has missing or invalid updatedAt', () => {
      const local = createStudent('s_fallback', 'Max', 'invalid-date', {
        createdAt: '2026-08-01T00:00:00.000Z',
        notes: 'Alte Notiz',
      });
      const remote = createStudent('s_fallback', 'Max Newer', '2026-08-10T00:00:00.000Z', {
        notes: 'Neue Notiz',
      });

      const { merged, isUpdated } = mergeStudentProfiles(local, remote);
      expect(isUpdated).toBe(true);
      expect(merged.notes).toBe('Neue Notiz');
    });

    it('TC-MRG-17: safely handles session history with invalid date strings without crashing', () => {
      const s1 = createSession('s1', 's', 'invalid-date');
      const s2 = createSession('s2', 's', '2026-08-10T10:00:00.000Z');

      expect(() => mergeSessionHistories([s1], [s2])).not.toThrow();
      const result = mergeSessionHistories([s1], [s2]);
      expect(result.mergedHistory).toHaveLength(2);
      expect(result.mergedHistory[0].sessionId).toBe('s2');
    });

    it('TC-MRG-18: preserves immutability of input arrays and objects during merge', () => {
      const local = [createStudent('std_1', 'Local', '2026-08-01T00:00:00.000Z')];
      const remote = [createStudent('std_1', 'Remote', '2026-08-02T00:00:00.000Z')];
      const localCopy = JSON.parse(JSON.stringify(local));
      const remoteCopy = JSON.parse(JSON.stringify(remote));

      mergeStudentRosters(local, remote);

      expect(local).toEqual(localCopy);
      expect(remote).toEqual(remoteCopy);
    });
  });

  describe('Tier 3: mergeSyncData Coordinator', () => {
    it('TC-MRG-19: merges both rosters and session histories simultaneously with complete stats and settings', () => {
      const localData = {
        roster: [createStudent('s1', 'Max', '2026-08-16T10:00:00.000Z')],
        history: [createSession('sess_1', 's1', '2026-08-16T10:00:00.000Z')],
        appSettings: { theme: 'dark', sound: true },
      };
      const remoteData = {
        roster: [
          createStudent('s1', 'Max New', '2026-08-16T12:00:00.000Z'),
          createStudent('s2', 'Lisa', '2026-08-16T11:00:00.000Z'),
        ],
        history: [
          createSession('sess_1', 's1', '2026-08-16T10:00:00.000Z'),
          createSession('sess_2', 's2', '2026-08-16T13:00:00.000Z'),
        ],
        appSettings: { sound: false, highContrast: true },
      };

      const result = mergeSyncData(localData, remoteData);

      expect(result.mergedRoster).toHaveLength(2);
      expect(result.mergedHistory).toHaveLength(2);
      expect(result.stats.studentsAdded).toBe(1);
      expect(result.stats.studentsUpdated).toBe(1);
      expect(result.stats.sessionsAdded).toBe(1);
      expect(result.stats.sessionsExisting).toBe(1);
      expect(result.stats.conflictsResolved).toBe(1);
      expect(result.mergedData?.appSettings).toEqual({
        theme: 'dark',
        sound: false,
        highContrast: true,
      });
    });

    it('TC-MRG-20: stress performance test: merges 1,000 students and 3,000 sessions in < 200ms', () => {
      const localRoster: StudentProfile[] = [];
      const incomingRoster: StudentProfile[] = [];
      const localHistory: TestSessionRecord[] = [];
      const incomingHistory: TestSessionRecord[] = [];

      for (let i = 0; i < 1000; i++) {
        localRoster.push(createStudent(`std_${i}`, `Student ${i}`, new Date(2026, 0, 1, 0, i).toISOString()));
        incomingRoster.push(createStudent(`std_${i}`, `Student ${i} Updated`, new Date(2026, 0, 1, 1, i).toISOString()));
      }

      for (let j = 0; j < 1500; j++) {
        localHistory.push(createSession(`sess_local_${j}`, `std_${j % 1000}`, new Date(2026, 0, 2, 0, j).toISOString()));
        incomingHistory.push(createSession(`sess_incoming_${j}`, `std_${j % 1000}`, new Date(2026, 0, 3, 0, j).toISOString()));
      }

      const startTime = performance.now();
      const result = mergeSyncData(
        { roster: localRoster, history: localHistory },
        { roster: incomingRoster, history: incomingHistory }
      );
      const duration = performance.now() - startTime;

      expect(result.mergedRoster).toHaveLength(1000);
      expect(result.mergedHistory).toHaveLength(3000);
      expect(result.stats.studentsUpdated).toBe(1000);
      expect(result.stats.sessionsAdded).toBe(1500);
      expect(duration).toBeLessThan(500);
    });
  });
});
