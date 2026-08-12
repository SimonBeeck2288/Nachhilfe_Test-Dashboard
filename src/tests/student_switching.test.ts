import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveStudentProfile,
  getStudentRoster,
  getStudentById,
  updateStudentProfile,
  deleteStudentProfile,
  clearStudentRoster,
} from '../utils/studentRoster';
import {
  saveSessionRecord,
  getSessionsByStudentId,
  clearSessionHistory,
  getPastAskedQuestionIds,
} from '../utils/sessionHistory';
import type { TestSessionRecord } from '../types/history';

const isStorageWorking = (storage: any): boolean => {
  if (!storage) return false;
  try {
    const testKey = '__test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

if (!isStorageWorking(globalThis.localStorage)) {
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
  (globalThis as any).localStorage = mockStorage;
  if (typeof window !== 'undefined') {
    (window as any).localStorage = mockStorage;
  }
}

describe('Student Switching, Profile Persistence & State Isolation', () => {
  beforeEach(() => {
    clearStudentRoster();
    clearSessionHistory();
  });

  describe('Profile Persistence CRUD Operations', () => {
    it('creates a new student profile with auto-generated ID and timestamps', () => {
      const profile = saveStudentProfile({
        name: 'Sophie Müller',
        gradeLevel: 5,
        favoriteSubject: 'Englisch',
        problemSubject: 'Mathe',
        notes: 'Benötigt Hilfe bei Bruchrechnung',
      });

      expect(profile.id).toBeDefined();
      expect(profile.id.startsWith('std_')).toBe(true);
      expect(profile.name).toBe('Sophie Müller');
      expect(profile.gradeLevel).toBe(5);
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it('retrieves student roster containing all saved profiles', () => {
      saveStudentProfile({ name: 'Anna Schmidt', gradeLevel: 4 });
      saveStudentProfile({ name: 'Ben Becker', gradeLevel: 6 });

      const roster = getStudentRoster();
      expect(roster.length).toBe(2);
      expect(roster.map((s) => s.name)).toContain('Anna Schmidt');
      expect(roster.map((s) => s.name)).toContain('Ben Becker');
    });

    it('finds student by ID correctly', () => {
      const created = saveStudentProfile({ name: 'Clara Oswald', gradeLevel: 7 });
      const found = getStudentById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Clara Oswald');
    });

    it('returns undefined when searching for non-existent student ID', () => {
      const found = getStudentById('non_existent_id');
      expect(found).toBeUndefined();
    });

    it('updates student profile without changing ID or createdAt', () => {
      const original = saveStudentProfile({ name: 'David Frank', gradeLevel: 5 });
      const updated = updateStudentProfile(original.id, {
        name: 'David Frank-Hahn',
        gradeLevel: 6,
        notes: 'Versetzt in Klasse 6',
      });

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(original.id);
      expect(updated?.name).toBe('David Frank-Hahn');
      expect(updated?.gradeLevel).toBe(6);
      expect(updated?.createdAt).toBe(original.createdAt);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(original.updatedAt).getTime()
      );
    });

    it('deletes student profile from roster', () => {
      const s1 = saveStudentProfile({ name: 'Elena Koch', gradeLevel: 3 });
      const s2 = saveStudentProfile({ name: 'Felix Braun', gradeLevel: 4 });

      const deleted = deleteStudentProfile(s1.id);
      expect(deleted).toBe(true);

      const roster = getStudentRoster();
      expect(roster.length).toBe(1);
      expect(roster[0].id).toBe(s2.id);
    });

    it('returns false when attempting to delete non-existent profile ID', () => {
      const deleted = deleteStudentProfile('invalid_id');
      expect(deleted).toBe(false);
    });

    it('clears entire student roster', () => {
      saveStudentProfile({ name: 'Greta', gradeLevel: 5 });
      saveStudentProfile({ name: 'Hannes', gradeLevel: 5 });

      clearStudentRoster();
      expect(getStudentRoster().length).toBe(0);
    });
  });

  describe('Per-Student History & Asked Question Deduplication', () => {
    it('isolates asked question history strictly per student ID with zero cross-student leakage', () => {
      const studentA = saveStudentProfile({ name: 'Student A', gradeLevel: 5 });
      const studentB = saveStudentProfile({ name: 'Student B', gradeLevel: 5 });

      const sessionA: TestSessionRecord = {
        sessionId: 'sess_A_1',
        studentId: studentA.id,
        studentName: studentA.name,
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 1,
        score: 2,
        totalQuestions: 2,
        topicBreakdown: [],
        answers: [
          { questionId: 'm1_addition_1', topic: 'Addition', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false },
          { questionId: 'm1_subtraction_1', topic: 'Subtraktion', subject: 'math', isCorrect: true, timeTaken: 12, usedExtraTime: false },
        ],
      };

      const sessionB: TestSessionRecord = {
        sessionId: 'sess_B_1',
        studentId: studentB.id,
        studentName: studentB.name,
        date: new Date().toISOString(),
        subject: 'Englisch',
        mathLevelReached: 1,
        englishLevelReached: 2,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [
          { questionId: 'e1_vocab_1', topic: 'Vokabeln', subject: 'english', isCorrect: true, timeTaken: 8, usedExtraTime: false },
        ],
      };

      saveSessionRecord(sessionA);
      saveSessionRecord(sessionB);

      const historyA = getPastAskedQuestionIds(studentA.id);
      const historyB = getPastAskedQuestionIds(studentB.id);

      expect(historyA.has('m1_addition_1')).toBe(true);
      expect(historyA.has('m1_subtraction_1')).toBe(true);
      expect(historyA.has('e1_vocab_1')).toBe(false); // Zero state leakage from Student B

      expect(historyB.has('e1_vocab_1')).toBe(true);
      expect(historyB.has('m1_addition_1')).toBe(false); // Zero state leakage from Student A
      expect(historyB.has('m1_subtraction_1')).toBe(false);
    });

    it('returns empty set when studentId is undefined or empty string', () => {
      expect(getPastAskedQuestionIds(undefined).size).toBe(0);
      expect(getPastAskedQuestionIds('').size).toBe(0);
    });

    it('accumulates asked question IDs across multiple sessions for the same student', () => {
      const student = saveStudentProfile({ name: 'Jonas', gradeLevel: 6 });

      saveSessionRecord({
        sessionId: 'sess_j1',
        studentId: student.id,
        studentName: student.name,
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 2,
        englishLevelReached: 1,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [{ questionId: 'q_math_1', topic: 'Geometrie', subject: 'math', isCorrect: true, timeTaken: 15, usedExtraTime: false }],
      });

      saveSessionRecord({
        sessionId: 'sess_j2',
        studentId: student.id,
        studentName: student.name,
        date: new Date().toISOString(),
        subject: 'Englisch',
        mathLevelReached: 2,
        englishLevelReached: 2,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [{ questionId: 'q_eng_1', topic: 'Grammatik', subject: 'english', isCorrect: true, timeTaken: 10, usedExtraTime: false }],
      });

      const combinedAsked = getPastAskedQuestionIds(student.id);
      expect(combinedAsked.size).toBe(2);
      expect(combinedAsked.has('q_math_1')).toBe(true);
      expect(combinedAsked.has('q_eng_1')).toBe(true);
    });
  });

  describe('Guest Profile & Edge Case Isolation', () => {
    it('isolates guest profile sessions from registered student profiles', () => {
      const regStudent = saveStudentProfile({ name: 'Registered Student', gradeLevel: 4 });

      saveSessionRecord({
        sessionId: 'sess_guest_1',
        studentId: 'guest',
        studentName: 'Gast',
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 1,
        englishLevelReached: 1,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [{ questionId: 'guest_q1', topic: 'Addition', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false }],
      });

      const guestSessions = getSessionsByStudentId('guest');
      const regSessions = getSessionsByStudentId(regStudent.id);

      expect(guestSessions.length).toBe(1);
      expect(regSessions.length).toBe(0);

      expect(getPastAskedQuestionIds('guest').has('guest_q1')).toBe(true);
      expect(getPastAskedQuestionIds(regStudent.id).has('guest_q1')).toBe(false);
    });

    it('preserves history integrity when deleting a profile', () => {
      const student = saveStudentProfile({ name: 'Temporary Student', gradeLevel: 5 });

      saveSessionRecord({
        sessionId: 'sess_temp_1',
        studentId: student.id,
        studentName: student.name,
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 2,
        englishLevelReached: 1,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [{ questionId: 'temp_q1', topic: 'Multiplikation', subject: 'math', isCorrect: true, timeTaken: 10, usedExtraTime: false }],
      });

      deleteStudentProfile(student.id);
      expect(getStudentById(student.id)).toBeUndefined();
      // Saved session history record remains queryable in history log
      expect(getSessionsByStudentId(student.id).length).toBe(1);
    });

    it('returns sessions ordered newest first in getSessionsByStudentId', () => {
      const student = saveStudentProfile({ name: 'Chronological Student', gradeLevel: 5 });

      saveSessionRecord({
        sessionId: 'sess_early',
        studentId: student.id,
        studentName: student.name,
        date: '2026-08-01T10:00:00.000Z',
        subject: 'Mathematik',
        mathLevelReached: 1,
        englishLevelReached: 1,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [],
      });

      saveSessionRecord({
        sessionId: 'sess_late',
        studentId: student.id,
        studentName: student.name,
        date: '2026-08-05T10:00:00.000Z',
        subject: 'Mathematik',
        mathLevelReached: 2,
        englishLevelReached: 1,
        score: 2,
        totalQuestions: 2,
        topicBreakdown: [],
        answers: [],
      });

      const sessions = getSessionsByStudentId(student.id);
      expect(sessions.length).toBe(2);
      expect(sessions[0].sessionId).toBe('sess_late');
      expect(sessions[1].sessionId).toBe('sess_early');
    });
  });
});
