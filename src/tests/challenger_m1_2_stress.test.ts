import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStudentRoster,
  saveStudentProfile,
  updateStudentProfile,
  getStudentById,
  clearStudentRoster,
} from '../utils/studentRoster';

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

describe('Challenger M1.2 Empirical Stress & Edge Case Verification', () => {
  beforeEach(() => {
    clearStudentRoster();
  });

  it('handles clearing hobbies, preferences, and custom notes on update', () => {
    const student = saveStudentProfile({
      name: 'Alice Stress',
      gradeLevel: 6,
      favoriteSubject: 'Mathe',
      problemSubject: 'Deutsch',
      notes: 'Initial note',
      hobbies: ['Gaming', 'Reading'],
      learningPreferences: ['Visuell'],
      customNotes: 'Likes blue color',
    });

    expect(student.hobbies).toEqual(['Gaming', 'Reading']);

    // Update student with empty arrays and empty customNotes to test clearing
    const updated = saveStudentProfile({
      id: student.id,
      name: 'Alice Stress',
      gradeLevel: 6,
      favoriteSubject: 'Mathe',
      problemSubject: 'Deutsch',
      notes: 'Updated note',
      hobbies: [],
      learningPreferences: [],
      customNotes: '',
    });

    expect(updated.hobbies).toEqual([]);
    expect(updated.learningPreferences).toEqual([]);
    expect(updated.customNotes).toBe('');

    const reFetched = getStudentById(student.id);
    expect(reFetched?.hobbies).toEqual([]);
    expect(reFetched?.learningPreferences).toEqual([]);
    expect(reFetched?.customNotes).toBe('');
  });

  it('preserves existing values when hobbies or learningPreferences are undefined during updateStudentProfile', () => {
    const student = saveStudentProfile({
      name: 'Bob Stress',
      gradeLevel: 8,
      favoriteSubject: 'Physik',
      problemSubject: 'Mathe',
      notes: 'Notes',
      hobbies: ['Fußball'],
      learningPreferences: ['Schritt-für-Schritt'],
      customNotes: 'Keep this note',
    });

    // Update only gradeLevel via updateStudentProfile without passing extended fields
    const updated = updateStudentProfile(student.id, { gradeLevel: 9 });

    expect(updated?.gradeLevel).toBe(9);
    expect(updated?.hobbies).toEqual(['Fußball']);
    expect(updated?.learningPreferences).toEqual(['Schritt-für-Schritt']);
    expect(updated?.customNotes).toBe('Keep this note');
  });

  it('handles corrupted or non-array localStorage data gracefully', () => {
    localStorage.setItem('diagnostic_student_roster', '{"notAnArray": true}');
    const roster = getStudentRoster();
    expect(roster).toEqual([]);

    localStorage.setItem('diagnostic_student_roster', 'INVALID JSON {{{');
    const roster2 = getStudentRoster();
    expect(roster2).toEqual([]);
  });

  it('handles custom tag deduplication logic correctly', () => {
    const hobbies = ['Gaming'];
    const addTag = (prev: string[], input: string) => {
      const trimmed = input.trim();
      return trimmed && !prev.includes(trimmed) ? [...prev, trimmed] : prev;
    };

    let updated = addTag(hobbies, 'Gaming');
    expect(updated).toHaveLength(1);

    updated = addTag(hobbies, '   Gaming   ');
    expect(updated).toHaveLength(1);

    updated = addTag(hobbies, 'Fußball');
    expect(updated).toEqual(['Gaming', 'Fußball']);
  });

  it('simulates UI form state reset when switching edit to create', () => {
    // Simulated form state container
    let state = {
      editingStudentId: 'std_123' as string | null,
      name: 'Student A',
      hobbies: ['Gaming'],
      learningPreferences: ['Visuell'],
      customNotes: 'Notes A',
    };

    const resetForm = () => {
      state = {
        editingStudentId: null,
        name: '',
        hobbies: [],
        learningPreferences: [],
        customNotes: '',
      };
    };

    const startCreateProfile = () => {
      resetForm();
    };

    expect(state.editingStudentId).toBe('std_123');
    startCreateProfile();
    expect(state.editingStudentId).toBeNull();
    expect(state.name).toBe('');
    expect(state.hobbies).toEqual([]);
    expect(state.learningPreferences).toEqual([]);
    expect(state.customNotes).toBe('');
  });

  it('simulates editing student A, switching back to list, then editing student B', () => {
    const studentA = { id: 'std_A', name: 'Alice', hobbies: ['Gaming'] };
    const studentB = { id: 'std_B', name: 'Bob', hobbies: ['Fußball'] };

    let formState: any = {};

    const startEditProfile = (s: typeof studentA) => {
      formState = {
        editingStudentId: s.id,
        name: s.name,
        hobbies: [...s.hobbies],
      };
    };

    startEditProfile(studentA);
    expect(formState.editingStudentId).toBe('std_A');
    expect(formState.name).toBe('Alice');
    expect(formState.hobbies).toEqual(['Gaming']);

    // Switch back to list, then edit student B
    startEditProfile(studentB);
    expect(formState.editingStudentId).toBe('std_B');
    expect(formState.name).toBe('Bob');
    expect(formState.hobbies).toEqual(['Fußball']);
  });

  it('verifies updateStudentProfile returns undefined for non-existent student ID', () => {
    const result = updateStudentProfile('non_existent_id', { name: 'Nobody' });
    expect(result).toBeUndefined();
  });
});
