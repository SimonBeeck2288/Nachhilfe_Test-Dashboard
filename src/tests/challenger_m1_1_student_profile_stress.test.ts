import { describe, it, expect } from '../utils/testRunner';
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

describe('Challenger M1.1 — Student Profile Expansion Stress & Edge Case Harness', () => {
  it('Edge Case 1: Saving empty arrays and empty strings preserves defaults without errors', () => {
    clearStudentRoster();
    const saved = saveStudentProfile({
      name: 'Empty Profile',
      gradeLevel: 5,
      favoriteSubject: '',
      problemSubject: '',
      notes: '',
      hobbies: [],
      learningPreferences: [],
      customNotes: '',
    });

    expect(saved.hobbies).toEqual([]);
    expect(saved.learningPreferences).toEqual([]);
    expect(saved.customNotes).toBe('');

    const retrieved = getStudentById(saved.id);
    expect(retrieved?.hobbies).toEqual([]);
    expect(retrieved?.learningPreferences).toEqual([]);
    expect(retrieved?.customNotes).toBe('');
  });

  it('Edge Case 2: Handles legacy profiles without new fields, corrupted storage, and non-array JSON', () => {
    clearStudentRoster();

    // 1. Invalid JSON in localStorage
    localStorage.setItem('diagnostic_student_roster', '{ invalid json ...');
    expect(getStudentRoster()).toEqual([]);

    // 2. Non-array JSON (object or primitive)
    localStorage.setItem('diagnostic_student_roster', JSON.stringify({ notAnArray: true }));
    expect(getStudentRoster()).toEqual([]);

    // 3. Array with legacy profile (missing hobbies, learningPreferences, customNotes)
    const legacyItem = [
      {
        id: 'legacy_101',
        name: 'Old Student',
        gradeLevel: 6,
        favoriteSubject: 'Mathe',
        problemSubject: 'Englisch',
        notes: 'Legacy note',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];
    localStorage.setItem('diagnostic_student_roster', JSON.stringify(legacyItem));

    const roster = getStudentRoster();
    expect(roster.length).toBe(1);
    expect(roster[0].hobbies).toEqual([]);
    expect(roster[0].learningPreferences).toEqual([]);
    expect(roster[0].customNotes).toBe('');
  });

  it('Edge Case 3: Partial updates retain existing hobbies, learningPreferences, and customNotes', () => {
    clearStudentRoster();
    const initial = saveStudentProfile({
      name: 'Anna Schmidt',
      gradeLevel: 8,
      favoriteSubject: 'Biologie',
      problemSubject: 'Mathe',
      notes: 'Initial',
      hobbies: ['Reiten', 'Zeichnen'],
      learningPreferences: ['Visuell'],
      customNotes: 'Liebt Pferde-Analogien.',
    });

    // Update only gradeLevel and problemSubject, omitting hobbies & customNotes in updates
    const updated = updateStudentProfile(initial.id, {
      gradeLevel: 9,
      problemSubject: 'Physik',
    });

    expect(updated).toBeDefined();
    expect(updated?.gradeLevel).toBe(9);
    expect(updated?.problemSubject).toBe('Physik');
    expect(updated?.hobbies).toEqual(['Reiten', 'Zeichnen']);
    expect(updated?.learningPreferences).toEqual(['Visuell']);
    expect(updated?.customNotes).toBe('Liebt Pferde-Analogien.');
  });

  it('Edge Case 4: Overwriting hobbies/learningPreferences with explicit empty arrays works', () => {
    clearStudentRoster();
    const initial = saveStudentProfile({
      name: 'Tim Kraft',
      gradeLevel: 7,
      favoriteSubject: 'Sport',
      problemSubject: 'Deutsch',
      notes: '',
      hobbies: ['Gaming', 'Fußball'],
      learningPreferences: ['Schritt-für-Schritt'],
      customNotes: 'Wurde entfernt',
    });

    const updated = updateStudentProfile(initial.id, {
      hobbies: [],
      customNotes: '',
    });

    expect(updated?.hobbies).toEqual([]);
    expect(updated?.learningPreferences).toEqual(['Schritt-für-Schritt']);
    expect(updated?.customNotes).toBe('');
  });

  it('Edge Case 5: Stress test with special characters, unicode, and long arrays', () => {
    clearStudentRoster();
    const largeHobbies = Array.from({ length: 50 }, (_, i) => `Hobby_${i}_🚀_&_#`);
    const student = saveStudentProfile({
      name: 'Spezial-Schüler <script>alert(1)</script>',
      gradeLevel: 10,
      favoriteSubject: 'Informatik & AI',
      problemSubject: 'Latein',
      notes: 'Notes with "quotes" and \\backslashes\\',
      hobbies: largeHobbies,
      learningPreferences: ['Mit Hobbys erklären & "Beispiele"'],
      customNotes: 'Custom notes with\nmultiline content\nand Emoji 🎓💡🎮',
    });

    const fetched = getStudentById(student.id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Spezial-Schüler <script>alert(1)</script>');
    expect(fetched?.hobbies.length).toBe(50);
    expect(fetched?.hobbies[0]).toBe('Hobby_0_🚀_&_#');
    expect(fetched?.customNotes).toContain('Emoji 🎓💡🎮');
  });
});
