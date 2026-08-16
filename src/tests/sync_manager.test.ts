import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportSyncPayload,
  downloadSyncFile,
  validateSyncPayload,
  importSyncPayload,
  getGistSyncConfig,
  saveGistSyncConfig,
  clearGistSyncConfig,
  pushToGitHubGist,
  pullFromGitHubGist,
  syncBidirectionalWithGist,
} from '../utils/syncManager';
import { getStudentRoster, saveStudentProfile, clearStudentRoster } from '../utils/studentRoster';
import { getSessionHistory, saveSessionRecord, clearSessionHistory } from '../utils/sessionHistory';
import type { SyncPayload } from '../types/sync';

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

describe('SyncManager - Multi-Device Profile & Session Synchronization', () => {
  beforeEach(() => {
    clearStudentRoster();
    clearSessionHistory();
    clearGistSyncConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Export Functionality', () => {
    it('generates a valid SyncPayload structure with metadata, roster, and history', () => {
      saveStudentProfile({
        name: 'Anna Schmidt',
        gradeLevel: 6,
        favoriteSubject: 'Mathematik',
        problemSubject: 'Englisch',
        notes: 'Test notizen',
      });

      saveSessionRecord({
        sessionId: 'sess_123',
        studentId: 'std_anna',
        studentName: 'Anna Schmidt',
        date: '2026-08-16T12:00:00.000Z',
        subject: 'all',
        mathLevelReached: 4,
        englishLevelReached: 3,
        score: 15,
        totalQuestions: 20,
        topicBreakdown: [],
        answers: [],
      });

      const payload = exportSyncPayload();
      expect(payload.schemaVersion).toBe(1);
      expect(typeof payload.metadata.exportedAt).toBe('string');
      expect(payload.data.roster.length).toBe(1);
      expect(payload.data.roster[0].name).toBe('Anna Schmidt');
      expect(payload.data.history.length).toBe(1);
      expect(payload.data.history[0].sessionId).toBe('sess_123');
    });

    it('downloadSyncFile outputs serializable JSON string', () => {
      saveStudentProfile({
        name: 'Ben Weber',
        gradeLevel: 8,
      });

      const json = downloadSyncFile('test_backup.json');
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.data.roster.some((s: any) => s.name === 'Ben Weber')).toBe(true);
    });
  });

  describe('2. Validation & Resilience', () => {
    it('validates a standard SyncPayload structure correctly', () => {
      const validObj: SyncPayload = {
        schemaVersion: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          itemCount: { students: 1, sessions: 0 },
        },
        data: {
          roster: [{ id: '1', name: 'Mia', gradeLevel: 5, favoriteSubject: '', problemSubject: '', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
          history: [],
        },
      };

      const result = validateSyncPayload(validObj);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster.length).toBe(1);
    });

    it('supports legacy payload which has root level roster and history', () => {
      const legacyPayload = {
        schemaVersion: 1,
        metadata: { schemaVersion: 1, exportedAt: new Date().toISOString(), itemCount: { students: 1, sessions: 0 } },
        roster: [
          { id: '1', name: 'Legacy Student', gradeLevel: 7, favoriteSubject: '', problemSubject: '', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        ],
        history: [],
      };

      const result = validateSyncPayload(legacyPayload);
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.roster[0].name).toBe('Legacy Student');
    });

    it('rejects invalid or null objects safely', () => {
      expect(validateSyncPayload(null).isValid).toBe(false);
      expect(validateSyncPayload('string').isValid).toBe(false);
      expect(validateSyncPayload({ random: 'data' }).isValid).toBe(false);
    });
  });

  describe('3. Import Logic (Merge vs. Replace)', () => {
    it('handles JSON parse errors gracefully without throwing', () => {
      const result = importSyncPayload('{ invalid JSON string ...');
      expect(result.success).toBe(false);
    });

    it('merges incoming students and updates newer records based on timestamps', () => {
      saveStudentProfile({
        id: 'std_sync_1',
        name: 'Clara',
        gradeLevel: 5,
        favoriteSubject: 'Mathe',
        problemSubject: 'Deutsch',
        notes: 'Alte Notiz',
      });

      const incomingPayload: SyncPayload = {
        schemaVersion: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: '2026-08-16T15:00:00.000Z',
          itemCount: { students: 2, sessions: 1 },
        },
        data: {
          roster: [
            {
              id: 'std_sync_1',
              name: 'Clara',
              gradeLevel: 6,
              favoriteSubject: 'Mathe',
              problemSubject: 'Deutsch',
              notes: 'Neuere Notiz von Rechner 2',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2099-08-16T14:00:00.000Z',
            },
            {
              id: 'std_sync_2',
              name: 'David',
              gradeLevel: 9,
              favoriteSubject: 'Physik',
              problemSubject: 'Latein',
              notes: 'Neuer Schüler',
              createdAt: '2026-08-16T14:00:00.000Z',
              updatedAt: '2026-08-16T14:00:00.000Z',
            },
          ],
          history: [
            {
              sessionId: 'sess_remote_1',
              studentId: 'std_sync_1',
              studentName: 'Clara',
              date: '2026-08-16T14:30:00.000Z',
              subject: 'math',
              mathLevelReached: 5,
              englishLevelReached: 1,
              score: 10,
              totalQuestions: 10,
              topicBreakdown: [],
              answers: [],
            },
          ],
        },
      };

      const result = importSyncPayload(JSON.stringify(incomingPayload), 'merge');
      expect(result.success).toBe(true);
      expect(result.studentsImported).toBe(1); // David
      expect(result.studentsUpdated).toBe(1); // Clara
      expect(result.sessionsImported).toBe(1);

      const roster = getStudentRoster();
      expect(roster.length).toBe(2);
      const clara = roster.find((s) => s.id === 'std_sync_1');
      expect(clara?.notes).toBe('Neuere Notiz von Rechner 2');

      const history = getSessionHistory();
      expect(history.length).toBe(1);
      expect(history[0].sessionId).toBe('sess_remote_1');
    });

    it('replaces all local data when import mode is set to replace', () => {
      saveStudentProfile({ name: 'Old Student To Remove', gradeLevel: 5 });
      saveSessionRecord({
        sessionId: 'old_session',
        studentId: '1',
        studentName: 'Old Student',
        date: '',
        subject: 'all',
        mathLevelReached: 1,
        englishLevelReached: 1,
        score: 1,
        totalQuestions: 1,
        topicBreakdown: [],
        answers: [],
      });

      const newPayload: SyncPayload = {
        schemaVersion: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          itemCount: { students: 1, sessions: 0 },
        },
        data: {
          roster: [{ id: 'std_new', name: 'Brand New Student', gradeLevel: 10, favoriteSubject: '', problemSubject: '', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
          history: [],
        },
      };

      const result = importSyncPayload(newPayload, 'replace');
      expect(result.success).toBe(true);
      expect(result.studentsImported).toBe(1);

      const roster = getStudentRoster();
      expect(roster.length).toBe(1);
      expect(roster[0].name).toBe('Brand New Student');

      const history = getSessionHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('4. GitHub Gist Configuration & API Integration', () => {
    it('manages Gist configuration persistence', () => {
      saveGistSyncConfig({
        token: 'ghp_test_token_123',
        gistId: 'gist_abc_456',
        lastSyncAt: '2026-08-16T12:00:00.000Z',
      });

      const loaded = getGistSyncConfig();
      expect(loaded?.token).toBe('ghp_test_token_123');
      expect(loaded?.gistId).toBe('gist_abc_456');

      clearGistSyncConfig();
      expect(getGistSyncConfig()).toBeNull();
    });

    it('pushToGitHubGist returns error if token is missing', async () => {
      const res = await pushToGitHubGist('');
      expect(res.success).toBe(false);
      expect(res.error).toBe('NO_PAT');
    });

    it('pushToGitHubGist creates a new Gist (POST) when no gistId is provided', async () => {
      saveStudentProfile({ name: 'Test Student Gist', gradeLevel: 7 });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'created_gist_999',
          html_url: 'https://gist.github.com/created_gist_999',
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await pushToGitHubGist('ghp_dummy_token');
      expect(res.success).toBe(true);
      expect(res.gistId).toBe('created_gist_999');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/gists',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_dummy_token',
          }),
        })
      );
    });

    it('pushToGitHubGist updates existing Gist (PATCH) when gistId is provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'existing_gist_123',
          html_url: 'https://gist.github.com/existing_gist_123',
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await pushToGitHubGist('ghp_dummy_token', 'existing_gist_123');
      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/gists/existing_gist_123',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('pullFromGitHubGist fetches, parses, and imports data from remote Gist', async () => {
      const remotePayload: SyncPayload = {
        schemaVersion: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: '2026-08-16T12:00:00.000Z',
          itemCount: { students: 1, sessions: 0 },
        },
        data: {
          roster: [{ id: 'std_remote_pull', name: 'Remote Pull Student', gradeLevel: 6, favoriteSubject: '', problemSubject: '', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
          history: [],
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'gist_remote_id',
          html_url: 'https://gist.github.com/gist_remote_id',
          files: {
            'nachhilfe_sync_data.json': {
              content: JSON.stringify(remotePayload),
            },
          },
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await pullFromGitHubGist('ghp_dummy_token', 'gist_remote_id', 'merge');
      expect(res.success).toBe(true);

      const roster = getStudentRoster();
      expect(roster.some((s) => s.name === 'Remote Pull Student')).toBe(true);
    });

    it('syncBidirectionalWithGist coordinates pull and push', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'gist_bi_id',
          html_url: 'https://gist.github.com/gist_bi_id',
          files: {
            'nachhilfe_sync_data.json': {
              content: JSON.stringify({
                schemaVersion: 1,
                metadata: {
                  schemaVersion: 1,
                  exportedAt: new Date().toISOString(),
                  itemCount: { students: 0, sessions: 0 },
                },
                data: {
                  roster: [],
                  history: [],
                },
              }),
            },
          },
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await syncBidirectionalWithGist('ghp_dummy_token', 'gist_bi_id');
      expect(res.success).toBe(true);
    });
  });
});
