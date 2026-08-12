import { describe, it, expect } from './testRunner';
import {
  getStudentRoster,
  saveStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  getStudentById,
  clearStudentRoster,
} from './studentRoster';

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

describe('Student Roster Persistence suite', () => {
  it('clears roster and starts empty', () => {
    clearStudentRoster();
    const roster = getStudentRoster();
    expect(roster.length).toBe(0);
  });

  it('saves a new student profile', () => {
    const student1 = saveStudentProfile({
      name: 'Max Mustermann',
      gradeLevel: 7,
      favoriteSubject: 'Mathematik',
      problemSubject: 'Englisch',
      notes: 'Braucht Hilfestellung bei Textaufgaben',
    });

    expect(typeof student1.id).toBe('string');
    expect(student1.name).toBe('Max Mustermann');
  });

  it('retrieves student by ID', () => {
    const roster = getStudentRoster();
    const firstStudent = roster[0];
    expect(firstStudent).toBeTruthy();

    const found = getStudentById(firstStudent.id);
    expect(found).toBeTruthy();
    expect(found?.name).toBe('Max Mustermann');
  });

  it('updates an existing student profile', () => {
    const roster = getStudentRoster();
    const firstStudent = roster[0];

    const updated = updateStudentProfile(firstStudent.id, { gradeLevel: 8 });
    expect(updated?.gradeLevel).toBe(8);
  });

  it('saves and retrieves extended student profile fields (hobbies, learningPreferences, customNotes)', () => {
    const student = saveStudentProfile({
      name: 'Laura Becker',
      gradeLevel: 6,
      favoriteSubject: 'Englisch',
      problemSubject: 'Mathe',
      notes: 'Standard Notiz',
      hobbies: ['Gaming', 'Minecraft'],
      learningPreferences: ['Visuell', 'Schritt-für-Schritt'],
      customNotes: 'Erkläre Mathe-Probleme gerne anhand von Minecraft-Blöcken.',
    });

    expect(student.hobbies).toEqual(['Gaming', 'Minecraft']);
    expect(student.learningPreferences).toEqual(['Visuell', 'Schritt-für-Schritt']);
    expect(student.customNotes).toBe('Erkläre Mathe-Probleme gerne anhand von Minecraft-Blöcken.');

    const retrieved = getStudentById(student.id);
    expect(retrieved?.hobbies).toEqual(['Gaming', 'Minecraft']);
    expect(retrieved?.learningPreferences).toEqual(['Visuell', 'Schritt-für-Schritt']);
    expect(retrieved?.customNotes).toBe('Erkläre Mathe-Probleme gerne anhand von Minecraft-Blöcken.');
  });

  it('updates extended fields correctly', () => {
    const roster = getStudentRoster();
    const student = roster[roster.length - 1];

    const updated = updateStudentProfile(student.id, {
      hobbies: ['Gaming', 'Minecraft', 'Fußball'],
      customNotes: 'Mag nun auch Fußball-Beispiele.',
    });

    expect(updated?.hobbies).toEqual(['Gaming', 'Minecraft', 'Fußball']);
    expect(updated?.learningPreferences).toEqual(['Visuell', 'Schritt-für-Schritt']);
    expect(updated?.customNotes).toBe('Mag nun auch Fußball-Beispiele.');
  });

  it('provides fallback defaults for legacy profile objects without extended fields', () => {
    // Manually set a legacy profile object in localStorage missing the new fields
    const legacyRoster = [
      {
        id: 'std_legacy_1',
        name: 'Legacy Schüler',
        gradeLevel: 5,
        favoriteSubject: 'Deutsch',
        problemSubject: 'Mathe',
        notes: 'Altes Profil',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem('diagnostic_student_roster', JSON.stringify(legacyRoster));

    const loaded = getStudentRoster();
    const legacyStudent = loaded.find((s) => s.id === 'std_legacy_1');
    expect(legacyStudent).toBeDefined();
    expect(legacyStudent?.hobbies).toEqual([]);
    expect(legacyStudent?.learningPreferences).toEqual([]);
    expect(legacyStudent?.customNotes).toBe('');
  });

  it('deletes a student profile', () => {
    const roster = getStudentRoster();
    const firstStudent = roster[0];

    const deleted = deleteStudentProfile(firstStudent.id);
    expect(deleted).toBe(true);
  });
});

