import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_ACCESSIBILITY_SETTINGS,
  DIRECT_REDUCED_SENSORY_SETTINGS,
} from '../types/student';
import {
  getStudentRoster,
  saveStudentProfile,
  updateStudentProfile,
  getAccessibilitySettings,
} from '../utils/studentRoster';
import { generateMathQuestion } from '../data/questions';
import { generatePracticeSheet } from '../utils/practiceGenerator';
import { generateGeminiPrompt } from '../utils/aiPromptGenerator';
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

let store: Record<string, string> = {};
if (!isStorageWorking(globalThis.localStorage)) {
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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}

describe('Neurodivergent Modes & Accessibility Settings (Unit & Integration Tests)', () => {
  beforeEach(() => {
    try {
      globalThis.localStorage.clear();
    } catch {
      store = {};
    }
  });

  afterEach(() => {
    try {
      globalThis.localStorage.clear();
    } catch {
      store = {};
    }
  });

  describe('1. Data Models and Presets', () => {
    it('provides valid default and direct_reduced_sensory presets', () => {
      expect(DEFAULT_ACCESSIBILITY_SETTINGS).toEqual({
        preset: 'standard',
        directQuestions: false,
        reducedSensory: false,
      });

      expect(DIRECT_REDUCED_SENSORY_SETTINGS).toEqual({
        preset: 'direct_reduced_sensory',
        directQuestions: true,
        reducedSensory: true,
      });
    });

    it('getAccessibilitySettings helper falls back gracefully on missing/partial data', () => {
      expect(getAccessibilitySettings(undefined)).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
      expect(getAccessibilitySettings({})).toEqual({
        preset: 'standard',
        directQuestions: false,
        reducedSensory: false,
      });
      expect(
        getAccessibilitySettings({
          preset: 'custom',
          directQuestions: true,
        })
      ).toEqual({
        preset: 'custom',
        directQuestions: true,
        reducedSensory: false,
      });
    });

    it('persists and deserializes accessibilitySettings in studentRoster', () => {
      const created = saveStudentProfile({
        name: 'Alex',
        gradeLevel: 6,
        accessibilitySettings: {
          preset: 'direct_reduced_sensory',
          directQuestions: true,
          reducedSensory: true,
        },
      });

      expect(created.id).toBeDefined();
      expect(created.accessibilitySettings).toEqual({
        preset: 'direct_reduced_sensory',
        directQuestions: true,
        reducedSensory: true,
      });

      const roster = getStudentRoster();
      const found = roster.find((s) => s.id === created.id);
      expect(found).toBeDefined();
      expect(found?.accessibilitySettings?.directQuestions).toBe(true);
      expect(found?.accessibilitySettings?.reducedSensory).toBe(true);

      // Update to standard
      const updated = updateStudentProfile(created.id, {
        accessibilitySettings: {
          preset: 'standard',
          directQuestions: false,
          reducedSensory: false,
        },
      });

      expect(updated?.accessibilitySettings?.directQuestions).toBe(false);
      expect(updated?.accessibilitySettings?.reducedSensory).toBe(false);

      const rosterAfterUpdate = getStudentRoster();
      const updatedFound = rosterAfterUpdate.find((s) => s.id === created.id);
      expect(updatedFound?.accessibilitySettings?.directQuestions).toBe(false);
    });
  });

  describe('2. Math Question Generator directText across Levels 1-7', () => {
    it('generates questions with directText for Level 1 (Addition, Subtraktion, Zehner)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(1, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(typeof q?.directText).toBe('string');
        expect(q?.directText?.length).toBeGreaterThan(5);
        expect(q?.storyContext).toBeDefined();
      }
    });

    it('generates questions with directText for Level 2 (Multiplikation, Division, Umfang)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(2, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });

    it('generates questions with directText for Level 3 (Bruch, Dezimal, Rechteck)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(3, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });

    it('generates questions with directText for Level 4 (Prozent, Gleichung, Dreieck, Statistik)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(4, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });

    it('generates questions with directText for Level 5 (Negative Zahlen, Parallelogramm, Trapez, Winkel)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(5, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });

    it('generates questions with directText for Level 6 (Potenzen, Würfel, Terme)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(6, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });

    it('generates questions with directText for Level 7 (Binom, Pythagoras, Kreis, Gleichungen)', () => {
      const asked = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateMathQuestion(7, asked);
        expect(q).not.toBeNull();
        expect(q?.directText).toBeDefined();
        expect(q?.directText?.length).toBeGreaterThan(5);
      }
    });
  });

  describe('3. Practice Generator directText creation', () => {
    it('generates math practice sheets with directText on each exercise item', () => {
      const sheet = generatePracticeSheet({
        studentId: 'test_student',
        subjectFilter: 'math',
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 2, isWeakSpot: false },
          { topicId: 'Multiplikation', topicName: 'Multiplikation', subject: 'math', selected: true, targetLevel: 3, isWeakSpot: false },
        ],
        questionCount: 5,
        isTimerDisabled: true,
      });

      expect(sheet.exercises.length).toBe(5);
      sheet.exercises.forEach((ex) => {
        expect(ex.directText).toBeDefined();
        expect(typeof ex.directText).toBe('string');
        expect(ex.directText?.length).toBeGreaterThan(5);
      });
    });
  });

  describe('4. AI Prompt Generator with Accessibility Context', () => {
    it('includes neurodivergent direct guidance when accessibilitySettings.directQuestions is active', () => {
      const prompt = generateGeminiPrompt('socratic', {
        studentProfile: {
          name: 'Leo',
          gradeLevel: 6,
          accessibilitySettings: {
            preset: 'direct_reduced_sensory',
            directQuestions: true,
            reducedSensory: true,
          },
        },
        questionContext: {
          subject: 'math',
          topic: 'Bruchrechnung',
          level: 3,
          questionText: 'Berechne: 1/2 + 1/4',
          userAnswer: '2/6',
          correctAnswer: '3/4',
        },
      });

      expect(prompt).toContain('Direkt & Reizarm [D/R] aktiv');
      expect(prompt).toContain('sachlich-direkte und unmissverständliche Sprache');
      expect(prompt).toContain('reizreduzierte, klare Struktur');
    });

    it('adapts personalized explanation instructions when directQuestions is active', () => {
      const prompt = generateGeminiPrompt('personalized', {
        studentProfile: {
          name: 'Leo',
          gradeLevel: 6,
          accessibilitySettings: {
            preset: 'direct_reduced_sensory',
            directQuestions: true,
            reducedSensory: true,
          },
        },
        questionContext: {
          subject: 'math',
          topic: 'Bruchrechnung',
          level: 3,
          questionText: 'Berechne: 1/2 + 1/4',
          userAnswer: '2/6',
          correctAnswer: '3/4',
        },
      });

      expect(prompt).toContain('sachlicher und präziser KI-Nachhilfelehrer');
      expect(prompt).toContain('ohne metaphorische Ausschmückung');
      expect(prompt).toContain('ohne ausschmückende Metaphern oder narrative Geschichten');
      expect(prompt).not.toContain('bildhafte Metaphern');
    });

    it('adapts practice_tasks generation instructions when directQuestions is active', () => {
      const prompt = generateGeminiPrompt('practice_tasks', {
        studentProfile: {
          name: 'Leo',
          gradeLevel: 6,
          accessibilitySettings: {
            preset: 'direct_reduced_sensory',
            directQuestions: true,
            reducedSensory: true,
          },
        },
        questionContext: {
          subject: 'math',
          topic: 'Bruchrechnung',
          level: 3,
        },
      });

      expect(prompt).toContain('sachlicher KI-Aufgabenersteller');
      expect(prompt).toContain('sachlich-direkte Übungsaufgaben');
      expect(prompt).toContain('ohne narrative/metaphorische Einkleidung');
      expect(prompt).not.toContain('Flechte Begriffe, Namen oder Szenarien aus den Hobbys');
    });

    it('defaults to Standard when accessibilitySettings is not configured', () => {
      const prompt = generateGeminiPrompt('socratic', {
        studentProfile: {
          name: 'Mia',
          gradeLevel: 5,
        },
      });

      expect(prompt).toContain('Standard');
      expect(prompt).not.toContain('Direkt & Reizarm [D/R] aktiv');
    });
  });

  describe('5. TestSessionRecord discrete [D/R] serialization', () => {
    it('supports accessibilitySettings on TestSessionRecord', () => {
      const record: TestSessionRecord = {
        sessionId: 'sess_123',
        studentId: 'stud_456',
        studentName: 'Julian',
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: 4,
        englishLevelReached: 3,
        score: 8,
        totalQuestions: 10,
        topicBreakdown: [],
        cognitionStats: null,
        answers: [],
        accessibilitySettings: {
          preset: 'direct_reduced_sensory',
          directQuestions: true,
          reducedSensory: true,
        },
      };

      expect(record.accessibilitySettings?.preset).toBe('direct_reduced_sensory');
      expect(record.accessibilitySettings?.directQuestions).toBe(true);
      expect(record.accessibilitySettings?.reducedSensory).toBe(true);
    });
  });

  describe('6. English Practice & Question Variations', () => {
    it('generates English practice sheet exercises with directText where defined', () => {
      const sheet = generatePracticeSheet({
        studentId: 'test_student',
        subjectFilter: 'english',
        topics: [
          { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 1, isWeakSpot: false },
          { topicId: 'Grammatik', topicName: 'Grammatik', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
          { topicId: 'Präpositionen', topicName: 'Präpositionen', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
        ],
        questionCount: 15,
        isTimerDisabled: false,
      });

      expect(sheet.exercises.length).toBe(15);
      sheet.exercises.forEach((ex) => {
        expect(ex.subject).toBe('english');
        expect(ex.questionText).toBeDefined();
        expect(ex.questionText.length).toBeGreaterThan(3);
        expect(ex.directText).toBeDefined();
        expect(ex.directText!.length).toBeGreaterThan(3);
      });
    });
  });

  describe('7. Profile Accessibility Preservation & Edge Cases', () => {
    it('handles legacy profiles gracefully in studentRoster without losing accessibility fallback', () => {
      // Simulate raw legacy storage entry without accessibilitySettings
      const legacyRaw = JSON.stringify([
        {
          id: 'legacy_1',
          name: 'Legacy Student',
          gradeLevel: 7,
          favoriteSubject: 'Mathe',
          problemSubject: 'Englisch',
          notes: '',
        }
      ]);
      localStorage.setItem('diagnostic_student_roster', legacyRaw);

      const roster = getStudentRoster();
      expect(roster.length).toBe(1);
      expect(roster[0].id).toBe('legacy_1');
      expect(roster[0].accessibilitySettings).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);

      // Now update legacy profile with direct & reduced sensory
      const updated = updateStudentProfile('legacy_1', {
        accessibilitySettings: DIRECT_REDUCED_SENSORY_SETTINGS,
      });
      expect(updated?.accessibilitySettings).toEqual(DIRECT_REDUCED_SENSORY_SETTINGS);
    });

    it('determines preset as custom when directQuestions and reducedSensory have mismatched boolean values', () => {
      expect(getAccessibilitySettings({ directQuestions: true, reducedSensory: false })).toEqual({
        preset: 'custom',
        directQuestions: true,
        reducedSensory: false,
      });

      expect(getAccessibilitySettings({ directQuestions: false, reducedSensory: true })).toEqual({
        preset: 'custom',
        directQuestions: false,
        reducedSensory: true,
      });
    });

    it('high-iteration math generator stress test across levels 1-7 produces valid directText without NaN', () => {
      const asked = new Set<string>();
      for (let level = 1; level <= 7; level++) {
        for (let i = 0; i < 50; i++) {
          const q = generateMathQuestion(level, asked);
          expect(q).not.toBeNull();
          expect(q?.directText).toBeDefined();
          expect(q?.directText).not.toContain('NaN');
          expect(q?.directText).not.toContain('undefined');
          expect(q?.directText?.length).toBeGreaterThan(5);
        }
      }
    });

    it('generates mixed practice sheets with consistent directText coverage on all math exercises', () => {
      const sheet = generatePracticeSheet({
        studentId: 'stud_mixed',
        subjectFilter: 'both',
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: true, targetLevel: 1, isWeakSpot: false },
          { topicId: 'Geometrie', topicName: 'Geometrie', subject: 'math', selected: true, targetLevel: 3, isWeakSpot: false },
          { topicId: 'Prozentrechnung', topicName: 'Prozentrechnung', subject: 'math', selected: true, targetLevel: 4, isWeakSpot: false },
          { topicId: 'Binomische Formeln', topicName: 'Binomische Formeln', subject: 'math', selected: true, targetLevel: 7, isWeakSpot: false },
          { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: true, targetLevel: 2, isWeakSpot: false },
        ],
        questionCount: 20,
        isTimerDisabled: true,
        seed: 424242,
      });

      expect(sheet.exercises.length).toBe(20);
      sheet.exercises.forEach((ex) => {
        if (ex.subject === 'math') {
          expect(ex.directText).toBeDefined();
          expect(ex.directText).not.toContain('NaN');
          expect(ex.directText!.length).toBeGreaterThan(5);
        }
      });
    });

    it('safely handles legacy sessions in localStorage that lack accessibilitySettings', () => {
      const legacySession = {
        studentName: 'Max',
        answers: [],
        mathLevel: 3,
        // no accessibilitySettings property
      };
      localStorage.setItem('diagnosticSession', JSON.stringify(legacySession));
      const raw = localStorage.getItem('diagnosticSession');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      const hydrated = {
        ...parsed,
        accessibilitySettings: parsed.accessibilitySettings
          ? { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed.accessibilitySettings }
          : { ...DEFAULT_ACCESSIBILITY_SETTINGS },
      };
      expect(hydrated.accessibilitySettings).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
      expect(hydrated.accessibilitySettings.directQuestions).toBe(false);
      expect(hydrated.accessibilitySettings.reducedSensory).toBe(false);
    });
  });
});



