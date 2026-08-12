import { describe, it, expect, beforeEach } from 'vitest';
import { saveSessionRecord, clearSessionHistory, getSessionHistory, getSessionById } from '../utils/sessionHistory';
import { clearStudentRoster } from '../utils/studentRoster';
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

interface TestState {
  markedQuestionIds: string[];
}

function toggleBookmarkState(state: TestState, questionId: string): TestState {
  const current = state.markedQuestionIds || [];
  const isMarked = current.includes(questionId);
  const updated = isMarked
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  return { ...state, markedQuestionIds: updated };
}

describe('R3: Question Bookmarking ("Markieren" Button & Summary Badges) Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionHistory();
    clearStudentRoster();
  });

  it('starts with an empty markedQuestionIds array', () => {
    const state: TestState = { markedQuestionIds: [] };
    expect(state.markedQuestionIds).toEqual([]);
  });

  it('toggles bookmarking on a question ID (adds when unflagged, removes when flagged)', () => {
    let state: TestState = { markedQuestionIds: [] };

    // Toggle on 'math_lvl2_q1'
    state = toggleBookmarkState(state, 'math_lvl2_q1');
    expect(state.markedQuestionIds).toEqual(['math_lvl2_q1']);

    // Toggle on 'eng_lvl3_q5'
    state = toggleBookmarkState(state, 'eng_lvl3_q5');
    expect(state.markedQuestionIds).toEqual(['math_lvl2_q1', 'eng_lvl3_q5']);

    // Toggle off 'math_lvl2_q1'
    state = toggleBookmarkState(state, 'math_lvl2_q1');
    expect(state.markedQuestionIds).toEqual(['eng_lvl3_q5']);
  });

  it('persists bookmarked question IDs to local storage via saveSessionRecord', () => {
    let state: TestState = { markedQuestionIds: [] };
    state = toggleBookmarkState(state, 'm_geom_6');
    state = toggleBookmarkState(state, 'e_gram_12');

    const sessionRecord: TestSessionRecord = {
      sessionId: 'sess_bookmark_test_1',
      studentId: 'stud_42',
      studentName: 'Hannah Fischer',
      date: new Date().toISOString(),
      subject: 'Mathematik & Englisch',
      mathLevelReached: 4,
      englishLevelReached: 3,
      score: 8,
      totalQuestions: 10,
      topicBreakdown: [],
      answers: [],
      markedQuestionIds: state.markedQuestionIds,
    };

    saveSessionRecord(sessionRecord);

    const savedRecord = getSessionById('sess_bookmark_test_1');
    expect(savedRecord).not.toBeNull();
    expect(savedRecord?.markedQuestionIds).toEqual(['m_geom_6', 'e_gram_12']);
  });

  it('retrieves summary report with marked questions badge list from session history', () => {
    const sessionRecord: TestSessionRecord = {
      sessionId: 'sess_bookmark_test_2',
      studentId: 'stud_99',
      studentName: 'Noah Wagner',
      date: new Date().toISOString(),
      subject: 'Mathematik & Englisch',
      mathLevelReached: 6,
      englishLevelReached: 5,
      score: 12,
      totalQuestions: 14,
      topicBreakdown: [],
      answers: [],
      markedQuestionIds: ['m_cube_v6', 'e6_43', 'e7_15'],
    };

    saveSessionRecord(sessionRecord);

    const history = getSessionHistory();
    expect(history.length).toBe(1);
    expect(history[0].markedQuestionIds).toHaveLength(3);
    expect(history[0].markedQuestionIds).toContain('m_cube_v6');
    expect(history[0].markedQuestionIds).toContain('e6_43');
    expect(history[0].markedQuestionIds).toContain('e7_15');
  });
});
