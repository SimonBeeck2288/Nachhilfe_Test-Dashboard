import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validatePat,
  createGist,
  getGist,
  updateGist,
  sanitizeToken,
  maskToken,
} from '../utils/gistClient';
import {
  saveGistConfig,
  getGistConfig,
  clearGistConfig,
  pushToGist,
  pullFromGist,
  testGistConnection,
  GIST_CONFIG_STORAGE_KEY,
  GIST_BACKUP_FILENAME,
} from '../utils/gistSync';
import {
  saveStudentProfile,
  getStudentRoster,
  clearStudentRoster,
} from '../utils/studentRoster';
import {
  saveSessionRecord,
  getSessionHistory,
  clearSessionHistory,
} from '../utils/sessionHistory';
import type { SyncPayload } from '../types/sync';

// Mock storage setup
const isStorageWorking = (storage: any): boolean => {
  if (!storage) return false;
  try {
    const testKey = '__test_storage__';
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

interface MockGistState {
  gists: Map<string, {
    id: string;
    description: string;
    public: boolean;
    files: Record<string, { filename: string; content: string }>;
    updated_at: string;
    owner: { login: string };
    html_url: string;
  }>;
  validTokens: Set<string>;
  rateLimitRemaining: number;
}

const createMockFetch = (state: MockGistState) => {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers = new Headers(init?.headers);
    const authHeader = headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '').trim();

    // 1. Rate Limit Simulation
    if (state.rateLimitRemaining <= 0) {
      return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '0' },
      });
    }
    state.rateLimitRemaining--;

    // 2. Token Auth Check
    if (!token || !state.validTokens.has(token)) {
      return new Response(JSON.stringify({ message: 'Bad credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. GET /user (Validate Token)
    if (url.endsWith('/user') && (!init || init.method === 'GET')) {
      return new Response(JSON.stringify({ login: 'test-tutor', id: 12345 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. POST /gists (Create Gist)
    if (url.endsWith('/gists') && init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      const gistId = `gist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const gistData = {
        id: gistId,
        description: body.description || 'NachhilfeTest Sync Backup',
        public: Boolean(body.public),
        files: body.files || {},
        updated_at: new Date().toISOString(),
        owner: { login: 'test-tutor' },
        html_url: `https://gist.github.com/test-tutor/${gistId}`,
      };
      state.gists.set(gistId, gistData);
      return new Response(JSON.stringify(gistData), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. GET /gists/:id (Get Gist)
    const getMatch = url.match(/\/gists\/([a-zA-Z0-9_-]+)$/);
    if (getMatch && (!init || init.method === 'GET')) {
      const id = getMatch[1];
      const gist = state.gists.get(id);
      if (!gist) {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(gist), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. PATCH /gists/:id (Update Gist)
    if (getMatch && init?.method === 'PATCH') {
      const id = getMatch[1];
      const gist = state.gists.get(id);
      if (!gist) {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const body = JSON.parse(init.body as string);
      gist.files = { ...gist.files, ...body.files };
      gist.updated_at = new Date().toISOString();
      state.gists.set(id, gist);
      return new Response(JSON.stringify(gist), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
  });
};

describe('gistClient & gistSync Test Suite', () => {
  let mockState: MockGistState;
  const VALID_PAT = 'ghp_validTestToken1234567890abcdef';

  beforeEach(() => {
    clearStudentRoster();
    clearSessionHistory();
    clearGistConfig();

    mockState = {
      gists: new Map(),
      validTokens: new Set([VALID_PAT]),
      rateLimitRemaining: 100,
    };

    const mockFetch = createMockFetch(mockState);
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Tier 1: Gist Client REST API & Configuration', () => {
    it('TC-GST-01: validatePat verifies GitHub PAT token via /user endpoint', async () => {
      const result = await validatePat(VALID_PAT);
      expect(result.valid).toBe(true);
      expect(result.username).toBe('test-tutor');
    });

    it('TC-GST-02: createGist creates a private Gist with designated backup filename and content', async () => {
      const content = JSON.stringify({ version: 1, test: true });
      const created = await createGist(
        VALID_PAT,
        'nachhilfe_sync_data.json',
        content,
        'NachhilfeTest Sync Backup',
        false
      );

      expect(created.id).toBeDefined();
      expect(created.id.startsWith('gist_')).toBe(true);
      expect(created.htmlUrl).toContain(created.id);
      expect(mockState.gists.has(created.id)).toBe(true);
    });

    it('TC-GST-03: getGist fetches Gist content and metadata by ID', async () => {
      const content = JSON.stringify({ version: 1, sample: 'data' });
      const created = await createGist(VALID_PAT, 'nachhilfe_sync_data.json', content);

      const fetched = await getGist(VALID_PAT, created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe(content);
      expect(fetched.owner?.login).toBe('test-tutor');
    });

    it('TC-GST-04: updateGist updates existing Gist file content via PATCH', async () => {
      const initialContent = JSON.stringify({ version: 1, counter: 1 });
      const created = await createGist(VALID_PAT, 'nachhilfe_sync_data.json', initialContent);

      const updatedContent = JSON.stringify({ version: 1, counter: 2 });
      const updated = await updateGist(
        VALID_PAT,
        created.id,
        'nachhilfe_sync_data.json',
        updatedContent
      );

      expect(updated.id).toBe(created.id);
      const fetched = await getGist(VALID_PAT, created.id);
      expect(fetched.content).toBe(updatedContent);
    });

    it('TC-GST-05: saveGistConfig, getGistConfig, and clearGistConfig manage local storage configuration', () => {
      expect(GIST_CONFIG_STORAGE_KEY).toBe('diagnostic_gist_config');
      expect(GIST_BACKUP_FILENAME).toBe('nachhilfe_sync_data.json');
      expect(getGistConfig()).toBeNull();

      saveGistConfig({
        pat: VALID_PAT,
        gistId: 'gist_123',
        autoSyncOnTestComplete: true,
      });

      const config = getGistConfig();
      expect(config).not.toBeNull();
      expect(config?.pat).toBe(VALID_PAT);
      expect(config?.gistId).toBe('gist_123');
      expect(config?.autoSyncOnTestComplete).toBe(true);

      clearGistConfig();
      expect(getGistConfig()).toBeNull();
    });

    it('TC-GST-06: testGistConnection checks PAT and Gist access together', async () => {
      // 1. Connection without Gist ID (just validates PAT)
      const resTokenOnly = await testGistConnection(VALID_PAT);
      expect(resTokenOnly.success).toBe(true);
      expect(resTokenOnly.username).toBe('test-tutor');

      // 2. Connection with existing Gist ID
      const created = await createGist(VALID_PAT, GIST_BACKUP_FILENAME, '{}');
      const resWithGist = await testGistConnection(VALID_PAT, created.id);
      expect(resWithGist.success).toBe(true);
      expect(resWithGist.gistId).toBe(created.id);
    });
  });

  describe('Tier 1: Push & Pull Sync Coordinator Operations', () => {
    it('TC-GST-07: pushToGist creates a new Gist when no gistId is configured and saves gistId to storage', async () => {
      saveStudentProfile({ name: 'Sophie Müller', gradeLevel: 5 });
      saveGistConfig({ pat: VALID_PAT, gistId: '' });

      const result = await pushToGist();

      expect(result.success).toBe(true);
      expect(result.gistId).toBeDefined();
      expect(result.gistId?.startsWith('gist_')).toBe(true);

      // Verify config was updated with the new gistId and lastSyncedAt
      const savedConfig = getGistConfig();
      expect(savedConfig?.gistId).toBe(result.gistId);
      expect(savedConfig?.lastSyncedAt).toBeDefined();
    });

    it('TC-GST-08: pushToGist updates existing Gist when gistId is already configured', async () => {
      const created = await createGist(VALID_PAT, GIST_BACKUP_FILENAME, '{}');
      saveGistConfig({ pat: VALID_PAT, gistId: created.id });
      const student = saveStudentProfile({ name: 'Max Becker', gradeLevel: 6 });
      saveSessionRecord({
        sessionId: 'sess_push_1',
        studentId: student.id,
        studentName: student.name,
        date: '2026-08-16T12:00:00.000Z',
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 1,
        score: 5,
        totalQuestions: 5,
        topicBreakdown: [],
        answers: [],
      });

      const result = await pushToGist();
      expect(result.success).toBe(true);
      expect(result.gistId).toBe(created.id);

      const fetched = await getGist(VALID_PAT, created.id);
      const parsed = JSON.parse(fetched.content);
      expect(parsed.data.roster.length).toBe(1);
      expect(parsed.data.roster[0].name).toBe('Max Becker');
      expect(parsed.data.history.length).toBe(1);
      expect(parsed.data.history[0].sessionId).toBe('sess_push_1');
    });

    it('TC-GST-09: pullFromGist fetches remote Gist, validates payload, and merges into local storage', async () => {
      const remotePayload: SyncPayload = {
        version: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: '2026-08-16T12:00:00.000Z',
        },
        data: {
          roster: [
            {
              id: 'std_remote_1',
              name: 'Remote Student',
              gradeLevel: 5,
              favoriteSubject: 'Mathe',
              problemSubject: 'Deutsch',
              notes: 'Aus Cloud importiert',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-16T10:00:00.000Z',
            },
          ],
          history: [
            {
              sessionId: 'sess_remote_1',
              studentId: 'std_remote_1',
              studentName: 'Remote Student',
              date: '2026-08-16T11:00:00.000Z',
              subject: 'Mathematik',
              mathLevelReached: 2,
              englishLevelReached: 1,
              score: 3,
              totalQuestions: 3,
              topicBreakdown: [],
              answers: [],
            },
          ],
        },
      };

      const created = await createGist(
        VALID_PAT,
        GIST_BACKUP_FILENAME,
        JSON.stringify(remotePayload)
      );

      saveGistConfig({ pat: VALID_PAT, gistId: created.id });

      const result = await pullFromGist();

      expect(result.success).toBe(true);
      expect(result.stats?.studentsAdded).toBe(1);
      expect(result.stats?.sessionsAdded).toBe(1);

      const roster = getStudentRoster();
      expect(roster.length).toBe(1);
      expect(roster[0].name).toBe('Remote Student');

      const history = getSessionHistory();
      expect(history.length).toBe(1);
      expect(history[0].sessionId).toBe('sess_remote_1');

      const config = getGistConfig();
      expect(config?.lastSyncedAt).toBeDefined();
    });
  });

  describe('Tier 2: Error Matrix & Network Resilience Simulation', () => {
    it('TC-GST-10: HTTP 401 Unauthorized handles invalid PAT with helpful German error message', async () => {
      const invalidToken = 'ghp_invalid_token_99999';

      const valResult = await validatePat(invalidToken);
      expect(valResult.valid).toBe(false);

      const connResult = await testGistConnection(invalidToken);
      expect(connResult.success).toBe(false);
      expect(connResult.message.toLowerCase()).toContain('token');

      saveGistConfig({ pat: invalidToken, gistId: 'gist_123' });
      const pushResult = await pushToGist();
      expect(pushResult.success).toBe(false);
      expect(pushResult.message).toContain('401');
    });

    it('TC-GST-11: HTTP 403 Rate Limit Exceeded returns rate limit explanation without app crash', async () => {
      mockState.rateLimitRemaining = 0; // Exhaust rate limit

      const result = await validatePat(VALID_PAT);
      expect(result.valid).toBe(false);
      expect(result.error?.toLowerCase()).toContain('rate');

      const pushResult = await pushToGist({ pat: VALID_PAT, gistId: 'gist_123' });
      expect(pushResult.success).toBe(false);
      expect(pushResult.message.toLowerCase()).toContain('rate');
    });

    it('TC-GST-12: HTTP 404 Not Found handles non-existent or deleted Gist ID', async () => {
      const pushResult = await pushToGist({ pat: VALID_PAT, gistId: 'gist_non_existent_999' });
      expect(pushResult.success).toBe(false);
      expect(pushResult.message.toLowerCase()).toContain('nicht gefunden');

      const pullResult = await pullFromGist({ pat: VALID_PAT, gistId: 'gist_non_existent_999' });
      expect(pullResult.success).toBe(false);
      expect(pullResult.message.toLowerCase()).toContain('nicht gefunden');
    });

    it('TC-GST-13: Network Offline / DNS Failure is caught safely and returns friendly notice', async () => {
      // Simulate network disconnection
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      const valResult = await validatePat(VALID_PAT);
      expect(valResult.valid).toBe(false);

      const pushResult = await pushToGist({ pat: VALID_PAT, gistId: 'gist_123' });
      expect(pushResult.success).toBe(false);
      expect(pushResult.message.toLowerCase()).toContain('netzwerk');

      const pullResult = await pullFromGist({ pat: VALID_PAT, gistId: 'gist_123' });
      expect(pullResult.success).toBe(false);
      expect(pullResult.message.toLowerCase()).toContain('netzwerk');
    });

    it('TC-GST-14: Remote Gist with missing backup file returns clear notice without corrupting storage', async () => {
      // Create Gist with unrelated filename
      const created = await createGist(VALID_PAT, 'unrelated.txt', 'Hello World');

      const pullResult = await pullFromGist({ pat: VALID_PAT, gistId: created.id });
      expect(pullResult.success).toBe(false);
      expect(pullResult.message.toLowerCase()).toContain('datei');
    });

    it('TC-GST-15: Remote Gist with corrupted / invalid JSON fails gracefully without altering local storage', async () => {
      saveStudentProfile({ name: 'Safe Local Student', gradeLevel: 5 });

      const created = await createGist(
        VALID_PAT,
        'nachhilfe_sync_data.json',
        '{ invalid json body'
      );

      const pullResult = await pullFromGist({ pat: VALID_PAT, gistId: created.id });
      expect(pullResult.success).toBe(false);

      // Verify local storage is intact
      const roster = getStudentRoster();
      expect(roster.length).toBe(1);
      expect(roster[0].name).toBe('Safe Local Student');
    });

    it('TC-GST-16: Remote Gist with invalid schema version is rejected without altering local storage', async () => {
      saveStudentProfile({ name: 'Safe Local Student', gradeLevel: 5 });

      const created = await createGist(
        VALID_PAT,
        'nachhilfe_sync_data.json',
        JSON.stringify({ version: 999, data: { roster: [], history: [] } })
      );

      const pullResult = await pullFromGist({ pat: VALID_PAT, gistId: created.id });
      expect(pullResult.success).toBe(false);
      expect(getStudentRoster().length).toBe(1);
    });

    it('TC-GST-17: Token sanitization trims leading/trailing spaces, newlines, and quotes', () => {
      expect(sanitizeToken('  ghp_12345  ')).toBe('ghp_12345');
      expect(sanitizeToken('\nghp_12345\n')).toBe('ghp_12345');
      expect(sanitizeToken('"ghp_12345"')).toBe('ghp_12345');
      expect(sanitizeToken('\'ghp_12345\'')).toBe('ghp_12345');
    });

    it('TC-GST-18: Token masking masks PAT tokens for safe logging and UI display', () => {
      expect(maskToken('ghp_1234567890abcdef')).toBe('ghp_****cdef');
      expect(maskToken('github_pat_11ABCDEF1234567890')).toBe('gith****7890');
      expect(maskToken('')).toBe('');
      expect(maskToken('short')).toBe('****');
    });
  });
});
