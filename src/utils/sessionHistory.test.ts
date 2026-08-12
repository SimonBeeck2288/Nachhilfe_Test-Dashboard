import { describe, it, expect } from './testRunner';
import {
  getSessionHistory,
  saveSessionRecord,
  getSessionById,
  getSessionsByStudentId,
  deleteSessionRecord,
  clearSessionHistory,
} from './sessionHistory';
import type { TestSessionRecord } from '../types/history';

// Polyfill localStorage in Node environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
  };
}

describe('Session History Manager suite', () => {
  it('clears history and starts empty', () => {
    clearSessionHistory();
    const history = getSessionHistory();
    expect(history.length).toBe(0);
  });

  it('saves a new session record', () => {
    const sampleRecord: TestSessionRecord = {
      sessionId: 'sess_test_123',
      studentId: 'std_test_456',
      studentName: 'Lisa Schmidt',
      date: new Date().toISOString(),
      subject: 'Mathematik & Englisch',
      mathLevelReached: 4,
      englishLevelReached: 3,
      score: 12,
      totalQuestions: 15,
      topicBreakdown: [
        { topic: 'Geometrie', correct: 3, total: 4, accuracy: 0.75, avgTime: 12.5 },
      ],
      cognitionStats: {
        correct: 5,
        total: 5,
        accuracy: 1.0,
        avgReactionTime: 850,
      },
      answers: [],
    };

    const saved = saveSessionRecord(sampleRecord);
    expect(saved.sessionId).toBe('sess_test_123');
    expect(getSessionHistory().length).toBe(1);
  });

  it('retrieves session record by ID', () => {
    const found = getSessionById('sess_test_123');
    expect(found).toBeTruthy();
    expect(found?.studentName).toBe('Lisa Schmidt');
  });

  it('filters session records by student ID', () => {
    const studentSessions = getSessionsByStudentId('std_test_456');
    expect(studentSessions.length).toBe(1);
    expect(studentSessions[0].studentName).toBe('Lisa Schmidt');
  });

  it('deletes session record', () => {
    const deleted = deleteSessionRecord('sess_test_123');
    expect(deleted).toBe(true);
    expect(getSessionHistory().length).toBe(0);
  });
});
