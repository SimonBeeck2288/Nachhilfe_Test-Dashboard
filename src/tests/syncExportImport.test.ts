/**
 * src/tests/syncExportImport.test.ts
 * Test Suite for JSON File Export, Import, Validation Integration & Migration Scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createExportPayload,
  downloadBackupFile,
  readBackupFile,
  parseAndValidateBackupFile,
  applyImportPayload,
  exportBackupPayload,
  importBackupPayload,
  createSyncPayload,
  exportToFile,
  importFromFile,
  applyImport,
} from '../utils/syncExportImport';
import { getStudentRoster, saveStudentProfile, clearStudentRoster } from '../utils/studentRoster';
import { getSessionHistory, saveSessionRecord, clearSessionHistory } from '../utils/sessionHistory';
import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';

const isStorageWorking = (storage: any): boolean => {
  if (!storage) return false;
  try {
    const testKey = '__test_export_import__';
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

describe('syncExportImport — JSON Portability & Storage Applicator', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    clearStudentRoster();
    clearSessionHistory();
    vi.restoreAllMocks();
  });

  const createSampleStudent = (id: string, name: string, updatedAt?: string): StudentProfile => ({
    id,
    name,
    gradeLevel: 6,
    favoriteSubject: 'math',
    problemSubject: 'english',
    notes: 'Mag Knobelaufgaben',
    hobbies: ['Schach'],
    learningPreferences: ['visuell'],
    createdAt: '2026-08-16T10:00:00.000Z',
    updatedAt: updatedAt || '2026-08-16T10:00:00.000Z',
    accessibilitySettings: {
      preset: 'standard',
      directQuestions: false,
      reducedSensory: false,
    },
  });

  const createSampleSession = (sessionId: string, studentId: string, date?: string): TestSessionRecord => ({
    sessionId,
    studentId,
    studentName: 'Max',
    date: date || '2026-08-16T11:00:00.000Z',
    subject: 'math',
    mathLevelReached: 3,
    englishLevelReached: 0,
    score: 8,
    totalQuestions: 10,
    topicBreakdown: {},
    answers: [],
  });

  describe('createExportPayload & Aliases', () => {
    it('constructs a valid SyncPayload from current storage', () => {
      saveStudentProfile(createSampleStudent('std_1', 'Max'));
      saveSessionRecord(createSampleSession('sess_1', 'std_1'));

      const payload = createExportPayload();

      expect(payload.version).toBe(1);
      expect(payload.schemaVersion).toBe(1);
      expect(payload.metadata.schemaVersion).toBe(1);
      expect(payload.metadata.exportedAt).toBeDefined();
      expect(payload.metadata.itemCount?.students).toBe(1);
      expect(payload.metadata.itemCount?.sessions).toBe(1);
      expect(payload.data.roster).toHaveLength(1);
      expect(payload.data.history).toHaveLength(1);
      expect(payload.data.roster[0].name).toBe('Max');
    });

    it('supports customData and options overrides', () => {
      const customStudent = createSampleStudent('std_custom', 'Lisa Custom');
      const customSession = createSampleSession('sess_custom', 'std_custom');

      const payload = createExportPayload(
        { roster: [customStudent], history: [customSession] },
        { sourceDevice: 'Tablet iPad Pro', deviceId: 'ipad_999', appVersion: '2.0.0' }
      );

      expect(payload.data.roster).toHaveLength(1);
      expect(payload.data.roster[0].name).toBe('Lisa Custom');
      expect(payload.metadata.sourceDevice).toBe('Tablet iPad Pro');
      expect(payload.metadata.deviceId).toBe('ipad_999');
      expect(payload.metadata.appVersion).toBe('2.0.0');
    });

    it('verifies alias functions exportBackupPayload and createSyncPayload', () => {
      const p1 = createExportPayload();
      const p2 = exportBackupPayload();
      const p3 = createSyncPayload();

      expect(p1.version).toBe(p2.version);
      expect(p2.version).toBe(p3.version);
    });
  });

  describe('downloadBackupFile & exportToFile', () => {
    it('creates and clicks a download anchor in DOM environment', () => {
      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      // Mock anchor element
      const originalCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreate(tagName);
        if (tagName === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      const payload = createExportPayload();
      const success = downloadBackupFile(payload, 'custom-backup.json');

      expect(success).toBe(true);
      expect(appendSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('verifies alias exportToFile matches downloadBackupFile', () => {
      expect(exportToFile).toBe(downloadBackupFile);
    });
  });

  describe('readBackupFile & importFromFile', () => {
    it('reads a Blob or File text successfully', async () => {
      const jsonContent = JSON.stringify({ hello: 'world' });
      const blob = new Blob([jsonContent], { type: 'application/json' });

      const text = await readBackupFile(blob);
      expect(text).toBe(jsonContent);
    });

    it('throws when no file is passed', async () => {
      await expect(readBackupFile(null as unknown as File)).rejects.toThrow('Keine Datei');
    });

    it('importFromFile reads, parses and validates payload', async () => {
      const validPayload = createExportPayload({
        roster: [createSampleStudent('std_import', 'Tim')],
        history: [createSampleSession('sess_import', 'std_import')],
      });
      const blob = new Blob([JSON.stringify(validPayload)], { type: 'application/json' });

      const parsed = await importFromFile(blob);
      expect(parsed.data.roster).toHaveLength(1);
      expect(parsed.data.roster[0].name).toBe('Tim');
    });
  });

  describe('parseAndValidateBackupFile', () => {
    it('returns valid result for valid JSON string', () => {
      const payload = createExportPayload({
        roster: [createSampleStudent('s1', 'Max')],
        history: [createSampleSession('sess1', 's1')],
      });
      const jsonStr = JSON.stringify(payload);

      const res = parseAndValidateBackupFile(jsonStr);
      expect(res.isValid).toBe(true);
      expect(res.payload?.data.roster).toHaveLength(1);
    });

    it('returns invalid result with descriptive error on syntax error', () => {
      const res = parseAndValidateBackupFile('NOT VALID JSON {{{');
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain('Ungültiges JSON-Format');
    });

    it('returns invalid result on empty string', () => {
      const res = parseAndValidateBackupFile('');
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('leer');
    });
  });

  describe('applyImportPayload (Replace Mode & Merge Mode)', () => {
    it('replaces all local storage records cleanly in replace mode', () => {
      // Existing local data
      saveStudentProfile(createSampleStudent('std_old', 'Old Student'));
      saveSessionRecord(createSampleSession('sess_old', 'std_old'));

      const incomingPayload = createExportPayload({
        roster: [createSampleStudent('std_new', 'New Student')],
        history: [createSampleSession('sess_new', 'std_new')],
      });

      const result = applyImportPayload(incomingPayload, 'replace');

      expect(result.mergedRoster).toHaveLength(1);
      expect(result.mergedRoster[0].id).toBe('std_new');
      expect(result.mergedHistory).toHaveLength(1);
      expect(result.mergedHistory[0].sessionId).toBe('sess_new');
      expect(result.stats.studentsAdded).toBe(1);

      // Verify persistent storage
      const storedRoster = getStudentRoster();
      expect(storedRoster).toHaveLength(1);
      expect(storedRoster[0].id).toBe('std_new');
      const storedHistory = getSessionHistory();
      expect(storedHistory).toHaveLength(1);
      expect(storedHistory[0].sessionId).toBe('sess_new');
    });

    it('merges incoming data non-destructively with existing storage in merge mode', () => {
      // Existing local data with explicit timestamp
      const localStudent = createSampleStudent('s1', 'Max Local', '2026-08-16T10:00:00.000Z');
      localStorage.setItem('diagnostic_student_roster', JSON.stringify([localStudent]));
      saveSessionRecord(
        createSampleSession('sess_1', 's1', '2026-08-16T10:00:00.000Z')
      );

      // Incoming payload with updated s1 (newer timestamp) and new s2
      const incomingPayload = createExportPayload({
        roster: [
          createSampleStudent('s1', 'Max Newer Remote', '2026-08-16T12:00:00.000Z'),
          createSampleStudent('s2', 'Anna New', '2026-08-16T11:00:00.000Z'),
        ],
        history: [
          createSampleSession('sess_1', 's1', '2026-08-16T10:00:00.000Z'), // Duplicate
          createSampleSession('sess_2', 's2', '2026-08-16T13:00:00.000Z'), // New
        ],
      });

      const result = applyImportPayload(incomingPayload, 'merge');

      expect(result.mergedRoster).toHaveLength(2);
      expect(result.mergedHistory).toHaveLength(2);
      expect(result.stats.studentsAdded).toBe(1);
      expect(result.stats.studentsUpdated).toBe(1);
      expect(result.stats.sessionsAdded).toBe(1);
      expect(result.stats.sessionsExisting).toBe(1);

      const s1 = getStudentRoster().find((s) => s.id === 's1');
      expect(s1?.name).toBe('Max Newer Remote');
    });

    it('verifies alias applyImport and importBackupPayload', () => {
      expect(importBackupPayload).toBe(applyImportPayload);

      const current = {
        roster: [createSampleStudent('s1', 'Max')],
        history: [createSampleSession('sess1', 's1')],
      };
      const incoming = createExportPayload({
        roster: [createSampleStudent('s2', 'Lisa')],
        history: [createSampleSession('sess2', 's2')],
      });

      const res = applyImport(current, incoming, 'merge');
      expect(res.data.roster).toHaveLength(2);
      expect(res.data.history).toHaveLength(2);
    });
  });

  describe('Real-World Migration & Disaster Recovery Journeys', () => {
    it('Scenario 1: Laptop to Tablet Migration round-trip', () => {
      // Device 1: Setup 3 students and 5 sessions
      const std1 = createSampleStudent('std_1', 'Student 1');
      const std2 = createSampleStudent('std_2', 'Student 2');
      const std3 = createSampleStudent('std_3', 'Student 3');
      saveStudentProfile(std1);
      saveStudentProfile(std2);
      saveStudentProfile(std3);

      for (let i = 1; i <= 5; i++) {
        saveSessionRecord(createSampleSession(`sess_${i}`, `std_${(i % 3) + 1}`));
      }

      // Export on Device 1
      const backupPayload = createExportPayload();
      expect(backupPayload.data.roster).toHaveLength(3);
      expect(backupPayload.data.history).toHaveLength(5);

      // Device 2: Fresh tablet with empty storage
      clearStudentRoster();
      clearSessionHistory();
      expect(getStudentRoster()).toHaveLength(0);

      // Import on Device 2 via replace mode
      const importResult = applyImportPayload(backupPayload, 'replace');
      expect(importResult.mergedRoster).toHaveLength(3);
      expect(importResult.mergedHistory).toHaveLength(5);

      // Verify all data is intact
      expect(getStudentRoster().map((s) => s.id)).toEqual(['std_1', 'std_2', 'std_3']);
      expect(getSessionHistory()).toHaveLength(5);
    });

    it('Scenario 2: Corrupted backup rejection preserves local storage with 0 data loss', () => {
      // Local state before corruption
      saveStudentProfile(createSampleStudent('std_safe', 'Safe Student'));
      saveSessionRecord(createSampleSession('sess_safe', 'std_safe'));

      const corruptedPayloadJson = '{"metadata": {"schemaVersion": 999}, "data": "corrupted"}';
      const valResult = parseAndValidateBackupFile(corruptedPayloadJson);

      expect(valResult.isValid).toBe(false);

      // If invalid, applyImportPayload is NOT called by UI
      // Verify storage remains 100% intact
      expect(getStudentRoster()).toHaveLength(1);
      expect(getStudentRoster()[0].name).toBe('Safe Student');
      expect(getSessionHistory()).toHaveLength(1);
    });

    it('Scenario 3: Active in-flight test session preservation during import', () => {
      // Active test stored under diagnosticSession
      localStorage.setItem('diagnosticSession', JSON.stringify({ activeQuestion: 4, timer: 120 }));

      saveStudentProfile(createSampleStudent('std_1', 'Student 1'));
      const backup = createExportPayload({
        roster: [createSampleStudent('std_2', 'Student 2')],
        history: [],
      });

      applyImportPayload(backup, 'merge');

      // Active test state must still exist
      const activeSession = localStorage.getItem('diagnosticSession');
      expect(activeSession).toBeDefined();
      expect(JSON.parse(activeSession!)).toEqual({ activeQuestion: 4, timer: 120 });
    });
  });
});
