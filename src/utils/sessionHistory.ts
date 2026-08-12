import type { TestSessionRecord } from '../types/history';

const HISTORY_STORAGE_KEY = 'diagnostic_session_history';

let memoryHistory: TestSessionRecord[] = [];

export const isStorageAvailable = (storage?: Storage | null): boolean => {
  if (!storage) return false;
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && isStorageAvailable(window.localStorage)) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined' && isStorageAvailable(localStorage)) {
      return localStorage;
    }
  } catch {
    // Ignore storage error
  }
  return null;
};

export const getSessionHistory = (): TestSessionRecord[] => {
  const storage = getStorage();
  if (!storage) {
    return [...memoryHistory];
  }

  try {
    const data = storage.getItem(HISTORY_STORAGE_KEY);
    if (!data) {
      memoryHistory = [];
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      memoryHistory = [];
      return [];
    }
    memoryHistory = [...parsed];
    return parsed;
  } catch (error) {
    console.error('Failed to read session history from storage:', error);
    memoryHistory = [];
    return [];
  }
};

export const getSessionById = (sessionId: string): TestSessionRecord | undefined => {
  const history = getSessionHistory();
  return history.find((record) => record.sessionId === sessionId);
};

export const getSessionsByStudentId = (studentId: string): TestSessionRecord[] => {
  const history = getSessionHistory();
  return history.filter((record) => record.studentId === studentId);
};

export const saveSessionRecord = (record: TestSessionRecord): TestSessionRecord => {
  const history = getSessionHistory();
  const existingIndex = history.findIndex((item) => item.sessionId === record.sessionId);

  const updatedRecord: TestSessionRecord = { ...record };
  if (!updatedRecord.sessionId) {
    updatedRecord.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!updatedRecord.date) {
    updatedRecord.date = new Date().toISOString();
  }

  if (existingIndex !== -1) {
    history[existingIndex] = updatedRecord;
  } else {
    // Prepend so latest sessions appear first
    history.unshift(updatedRecord);
  }

  memoryHistory = [...history];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save session record to storage:', error);
    }
  }

  return updatedRecord;
};

export const deleteSessionRecord = (sessionId: string): boolean => {
  const history = getSessionHistory();
  const filtered = history.filter((record) => record.sessionId !== sessionId);
  if (filtered.length === history.length) return false;

  memoryHistory = [...filtered];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete session record from storage:', error);
    }
  }
  return true;
};

export const clearSessionHistory = (): void => {
  memoryHistory = [];
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session history from storage:', error);
    }
  }
};

export const getPastAskedQuestionIds = (studentId?: string): Set<string> => {
  const asked = new Set<string>();
  if (!studentId) return asked;
  const sessions = getSessionsByStudentId(studentId);
  sessions.slice(0, 10).forEach((session) => {
    if (Array.isArray(session.answers)) {
      session.answers.forEach((ans) => {
        if (ans.questionId) asked.add(ans.questionId);
      });
    }
  });
  return asked;
};


