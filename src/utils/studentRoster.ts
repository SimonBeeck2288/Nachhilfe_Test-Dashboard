import type { StudentProfile } from '../types/student';

const ROSTER_STORAGE_KEY = 'diagnostic_student_roster';

let memoryRoster: StudentProfile[] = [];

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

export const getStudentRoster = (): StudentProfile[] => {
  const storage = getStorage();
  if (!storage) {
    return [...memoryRoster];
  }

  try {
    const data = storage.getItem(ROSTER_STORAGE_KEY);
    if (!data) {
      memoryRoster = [];
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      memoryRoster = [];
      return [];
    }
    const roster: StudentProfile[] = parsed.map((student: Partial<StudentProfile>) => ({
      ...student,
      id: student.id || '',
      name: student.name || '',
      gradeLevel: student.gradeLevel ?? 5,
      favoriteSubject: student.favoriteSubject || '',
      problemSubject: student.problemSubject || '',
      notes: student.notes || '',
      hobbies: student.hobbies ?? [],
      learningPreferences: student.learningPreferences ?? [],
      customNotes: student.customNotes ?? '',
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: student.updatedAt || new Date().toISOString(),
    }));
    memoryRoster = [...roster];
    return roster;
  } catch (error) {
    console.error('Failed to read student roster from storage:', error);
    memoryRoster = [];
    return [];
  }
};

export const getStudentById = (id: string): StudentProfile | undefined => {
  const roster = getStudentRoster();
  return roster.find((student) => student.id === id);
};

export const saveStudentProfile = (
  data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): StudentProfile => {
  const roster = getStudentRoster();
  const now = new Date().toISOString();

  if (data.id) {
    const index = roster.findIndex((s) => s.id === data.id);
    if (index !== -1) {
      const current = roster[index];
      const updatedProfile: StudentProfile = {
        ...current,
        name: data.name,
        gradeLevel: data.gradeLevel,
        favoriteSubject: data.favoriteSubject,
        problemSubject: data.problemSubject,
        notes: data.notes,
        hobbies: data.hobbies ?? current.hobbies ?? [],
        learningPreferences: data.learningPreferences ?? current.learningPreferences ?? [],
        customNotes: data.customNotes ?? current.customNotes ?? '',
        updatedAt: now,
      };
      roster[index] = updatedProfile;
      memoryRoster = [...roster];
      const storage = getStorage();
      if (storage) {
        try {
          storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
        } catch (error) {
          console.error('Failed to save student profile to storage:', error);
        }
      }
      return updatedProfile;
    }
  }

  const newProfile: StudentProfile = {
    id: data.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    gradeLevel: data.gradeLevel,
    favoriteSubject: data.favoriteSubject || '',
    problemSubject: data.problemSubject || '',
    notes: data.notes || '',
    hobbies: data.hobbies ?? [],
    learningPreferences: data.learningPreferences ?? [],
    customNotes: data.customNotes ?? '',
    createdAt: now,
    updatedAt: now,
  };

  roster.push(newProfile);
  memoryRoster = [...roster];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Failed to save student profile to storage:', error);
    }
  }
  return newProfile;
};

export const updateStudentProfile = (
  id: string,
  updates: Partial<Omit<StudentProfile, 'id' | 'createdAt'>>
): StudentProfile | undefined => {
  const roster = getStudentRoster();
  const index = roster.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  const current = roster[index];
  const updatedProfile: StudentProfile = {
    ...current,
    ...updates,
    hobbies: updates.hobbies ?? current.hobbies ?? [],
    learningPreferences: updates.learningPreferences ?? current.learningPreferences ?? [],
    customNotes: updates.customNotes ?? current.customNotes ?? '',
    updatedAt: new Date().toISOString(),
  };

  roster[index] = updatedProfile;
  memoryRoster = [...roster];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Failed to update student profile in storage:', error);
    }
  }
  return updatedProfile;
};

export const deleteStudentProfile = (id: string): boolean => {
  const roster = getStudentRoster();
  const filtered = roster.filter((s) => s.id !== id);
  if (filtered.length === roster.length) return false;

  memoryRoster = [...filtered];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete student profile from storage:', error);
    }
  }
  return true;
};

export const clearStudentRoster = (): void => {
  memoryRoster = [];
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(ROSTER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear student roster from storage:', error);
    }
  }
};

