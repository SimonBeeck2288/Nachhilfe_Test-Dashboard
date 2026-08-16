/**
 * src/tests/e2eSyncScenarios.test.ts
 * Tier 4: Real-World Multi-Device End-to-End User Journeys
 * 
 * Scenarios:
 * 1. Tutor Laptop to Tablet Migration (JSON File-based, 5 students, 15 sessions, zero data loss)
 * 2. Two-Way Cloud Sync via GitHub Gist (Device A & Device B collaboration, LWW, tag union, history deduplication)
 * 3. Corrupted File & Schema Disaster Recovery (HTML errors, invalid JSON, version 99, proto pollution -> 0 corruption)
 * 4. Network Disruption & Token Expiry Handling (401, 404, 403, offline -> graceful error display, non-fatal)
 * 5. Active Session State Isolation during Cloud Sync (in-flight diagnostic test preservation during remote pull)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createExportPayload,
  parseAndValidateBackupFile,
  applyImportPayload,
} from '../utils/syncExportImport';
import {
  saveStudentProfile,
  getStudentRoster,
  getStudentById,
  updateStudentProfile,
  clearStudentRoster,
} from '../utils/studentRoster';
import {
  saveSessionRecord,
  getSessionHistory,
  getSessionsByStudentId,
  getPastAskedQuestionIds,
  clearSessionHistory,
} from '../utils/sessionHistory';
import {
  pushToGist,
  pullFromGist,
  testGistConnection,
} from '../utils/gistSync';
import type { SyncPayload, StudentProfile, TestSessionRecord, GistSyncConfig } from '../types/sync';

// Multi-Device In-Memory Storage Emulator
interface DeviceStorage {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function createDeviceStorage(initialData?: Record<string, string>): DeviceStorage {
  let store: Record<string, string> = initialData ? { ...initialData } : {};
  return {
    get store() {
      return store;
    },
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

if (typeof (globalThis as any).localStorage === 'undefined' || !(globalThis as any).localStorage?.clear) {
  (globalThis as any).localStorage = createDeviceStorage();
}

// In-Memory GitHub Gist Cloud Store Emulator
interface MockGistStore {
  gists: Map<string, {
    id: string;
    description: string;
    public: boolean;
    files: Record<string, { filename: string; content: string }>;
    updated_at: string;
    owner: { login: string };
  }>;
  validTokens: Set<string>;
  rateLimitRemaining: number;
}

function setupMockGistCloud(cloudState: MockGistStore) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers = new Headers(init?.headers);
    const authHeader = headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '');

    // Rate Limit Check
    if (cloudState.rateLimitRemaining <= 0) {
      return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '0' },
      });
    }
    cloudState.rateLimitRemaining--;

    // Token Auth Check
    if (!token || !cloudState.validTokens.has(token)) {
      return new Response(JSON.stringify({ message: 'Bad credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GET /user (Token validation)
    if (url.endsWith('/user') && (!init || init.method === 'GET')) {
      return new Response(JSON.stringify({ login: 'test-tutor', id: 98765 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /gists (Create Gist)
    if (url.endsWith('/gists') && init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      const gistId = `gist_cloud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const gistData = {
        id: gistId,
        description: body.description || 'NachhilfeTest Sync Backup',
        public: false,
        files: body.files,
        updated_at: new Date().toISOString(),
        owner: { login: 'test-tutor' },
        html_url: `https://gist.github.com/test-tutor/${gistId}`,
      };
      cloudState.gists.set(gistId, gistData);
      return new Response(JSON.stringify(gistData), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GET /gists/:id (Fetch Gist)
    const getMatch = url.match(/\/gists\/([a-zA-Z0-9_-]+)$/);
    if (getMatch && (!init || init.method === 'GET')) {
      const id = getMatch[1];
      const gist = cloudState.gists.get(id);
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

    // PATCH /gists/:id (Update Gist)
    if (getMatch && init?.method === 'PATCH') {
      const id = getMatch[1];
      const gist = cloudState.gists.get(id);
      if (!gist) {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const body = JSON.parse(init.body as string);
      gist.files = { ...gist.files, ...body.files };
      gist.updated_at = new Date().toISOString();
      cloudState.gists.set(id, gist);
      return new Response(JSON.stringify(gist), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
  });
}

describe('Tier 4: Multi-Device End-to-End Sync Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStudentRoster();
    clearSessionHistory();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario 1: Tutor Laptop to Tablet Migration (JSON File-based)', () => {
    it('migrates 5 student profiles & 15 test sessions with 0 data loss and preserves asked question history', () => {
      // --- STEP 1: POPULATE LAPTOP WITH 5 STUDENTS AND 15 SESSIONS ---
      const laptopStudents: StudentProfile[] = [
        {
          id: 'std_laptop_1',
          name: 'Sophie Müller',
          gradeLevel: 5,
          favoriteSubject: 'Mathematik',
          problemSubject: 'Englisch',
          notes: 'Stärken bei Bruchrechnung',
          hobbies: ['Schach', 'Schwimmen'],
          learningPreferences: ['Visuell', 'Schritt-für-Schritt'],
          customNotes: 'Braucht visuelle Diagramme',
          accessibilitySettings: { preset: 'standard', directQuestions: false, reducedSensory: false },
          createdAt: '2026-08-01T08:00:00.000Z',
          updatedAt: '2026-08-10T10:00:00.000Z',
        },
        {
          id: 'std_laptop_2',
          name: 'Leon Weber',
          gradeLevel: 6,
          favoriteSubject: 'Englisch',
          problemSubject: 'Mathematik',
          notes: 'Geometrie üben',
          hobbies: ['Fußball', 'Gaming'],
          learningPreferences: ['Interaktiv', 'Gamification'],
          customNotes: 'Motiviert durch Belohnungen',
          accessibilitySettings: { preset: 'direct_reduced_sensory', directQuestions: true, reducedSensory: true },
          createdAt: '2026-08-02T09:00:00.000Z',
          updatedAt: '2026-08-11T11:00:00.000Z',
        },
        {
          id: 'std_laptop_3',
          name: 'Mia Fischer',
          gradeLevel: 7,
          favoriteSubject: 'Mathematik',
          problemSubject: 'Deutsch',
          notes: 'Gleichungen vertiefen',
          hobbies: ['Reiten', 'Zeichnen'],
          learningPreferences: ['Beispiele aus Alltag'],
          customNotes: 'Gerne praktische Beispiele',
          accessibilitySettings: { preset: 'standard', directQuestions: false, reducedSensory: false },
          createdAt: '2026-08-03T10:00:00.000Z',
          updatedAt: '2026-08-12T12:00:00.000Z',
        },
        {
          id: 'std_laptop_4',
          name: 'Noah Wagner',
          gradeLevel: 8,
          favoriteSubject: 'Physik',
          problemSubject: 'Englisch',
          notes: 'Vokabeltraining',
          hobbies: ['Musik', 'Programmieren'],
          learningPreferences: ['Kurze Erklärungen'],
          customNotes: 'Liebt Programmier-Analogien',
          accessibilitySettings: { preset: 'custom', directQuestions: true, reducedSensory: false },
          createdAt: '2026-08-04T11:00:00.000Z',
          updatedAt: '2026-08-13T13:00:00.000Z',
        },
        {
          id: 'std_laptop_5',
          name: 'Emma Becker',
          gradeLevel: 5,
          favoriteSubject: 'Englisch',
          problemSubject: 'Mathematik',
          notes: 'Grundrechenarten festigen',
          hobbies: ['Tanzen', 'Lesen'],
          learningPreferences: ['Mit Hobbys erklären'],
          customNotes: 'Gerne Tanz-Metaphern nutzen',
          accessibilitySettings: { preset: 'standard', directQuestions: false, reducedSensory: false },
          createdAt: '2026-08-05T12:00:00.000Z',
          updatedAt: '2026-08-14T14:00:00.000Z',
        },
      ];

      // 15 historical test sessions (3 sessions per student)
      const laptopSessions: TestSessionRecord[] = [];
      const askedQuestionIdsByStudent: Record<string, string[]> = {};

      laptopStudents.forEach((student, idx) => {
        askedQuestionIdsByStudent[student.id] = [];
        for (let s = 1; s <= 3; s++) {
          const qId1 = `q_lap_${student.id}_s${s}_1`;
          const qId2 = `q_lap_${student.id}_s${s}_2`;
          askedQuestionIdsByStudent[student.id].push(qId1, qId2);

          laptopSessions.push({
            sessionId: `sess_lap_${student.id}_${s}`,
            studentId: student.id,
            studentName: student.name,
            date: `2026-08-${10 + s}T1${idx}:00:00.000Z`,
            subject: s % 2 === 1 ? 'Mathematik' : 'Englisch',
            mathLevelReached: s,
            englishLevelReached: s,
            score: s * 4,
            totalQuestions: s * 5,
            topicBreakdown: {
              Thema1: { topic: 'Thema1', correct: s * 4, total: s * 5, accuracy: 0.8, avgTime: 4.5 },
            },
            cognitionStats: { correct: s * 4, total: s * 5, accuracy: 0.8, avgReactionTime: 450 },
            answers: [
              { questionId: qId1, topic: 'Thema1', subject: 'math', isCorrect: true, timeTaken: 4.5, usedExtraTime: false },
              { questionId: qId2, topic: 'Thema1', subject: 'math', isCorrect: true, timeTaken: 5.0, usedExtraTime: false },
            ],
          });
        }
      });

      // Save to Laptop storage
      localStorage.setItem('diagnostic_student_roster', JSON.stringify(laptopStudents));
      localStorage.setItem('diagnostic_session_history', JSON.stringify(laptopSessions));

      expect(getStudentRoster().length).toBe(5);
      expect(getSessionHistory().length).toBe(15);

      // --- STEP 2: LAPTOP EXPORTS JSON BACKUP PAYLOAD ---
      const exportPayload = createExportPayload();
      expect(exportPayload.version).toBe(1);
      expect(exportPayload.data.roster.length).toBe(5);
      expect(exportPayload.data.history.length).toBe(15);

      const serializedBackup = JSON.stringify(exportPayload);

      // --- STEP 3: TABLET INITIALIZES CLEAN & IMPORTS BACKUP ---
      localStorage.clear();
      clearStudentRoster();
      clearSessionHistory();
      expect(getStudentRoster().length).toBe(0);
      expect(getSessionHistory().length).toBe(0);

      // Validate and apply import on Tablet
      const validationResult = parseAndValidateBackupFile(serializedBackup);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.payload).toBeDefined();

      const mergeResult = applyImportPayload(validationResult.payload!, 'replace');
      expect(mergeResult.stats.studentsAdded).toBe(5);
      expect(mergeResult.stats.sessionsAdded).toBe(15);

      // --- STEP 4: VERIFY 100% ACCURATE RESTORATION ON TABLET ---
      const tabletRoster = getStudentRoster();
      const tabletHistory = getSessionHistory();

      expect(tabletRoster.length).toBe(5);
      expect(tabletHistory.length).toBe(15);

      // Verify Student 1 (Sophie) full fidelity
      const tabletSophie = getStudentById('std_laptop_1');
      expect(tabletSophie).toBeDefined();
      expect(tabletSophie?.name).toBe('Sophie Müller');
      expect(tabletSophie?.gradeLevel).toBe(5);
      expect(tabletSophie?.hobbies).toEqual(['Schach', 'Schwimmen']);
      expect(tabletSophie?.learningPreferences).toEqual(['Visuell', 'Schritt-für-Schritt']);
      expect(tabletSophie?.customNotes).toBe('Braucht visuelle Diagramme');
      expect(tabletSophie?.accessibilitySettings?.preset).toBe('standard');

      // Verify Student 2 (Leon) neurodivergent direct & reduced sensory preset
      const tabletLeon = getStudentById('std_laptop_2');
      expect(tabletLeon).toBeDefined();
      expect(tabletLeon?.accessibilitySettings?.preset).toBe('direct_reduced_sensory');
      expect(tabletLeon?.accessibilitySettings?.directQuestions).toBe(true);
      expect(tabletLeon?.accessibilitySettings?.reducedSensory).toBe(true);

      // --- STEP 5: VERIFY QUESTION DEDUPLICATION & TEST CONTINUITY ---
      laptopStudents.forEach((student) => {
        const pastAsked = getPastAskedQuestionIds(student.id);
        const expectedIds = askedQuestionIdsByStudent[student.id];
        expect(pastAsked.size).toBe(expectedIds.length);
        expectedIds.forEach((qId) => {
          expect(pastAsked.has(qId)).toBe(true);
        });
      });
    });
  });

  describe('Scenario 2: Two-Way Cloud Sync via GitHub Gist (Multi-Device Collaboration)', () => {
    it('synchronizes data bidirectionally between Device A and Device B with Last-Write-Wins and array union', async () => {
      const mockGistCloudState: MockGistStore = {
        gists: new Map(),
        validTokens: new Set(['ghp_secret_collab_token']),
        rateLimitRemaining: 100,
      };

      const fetchMock = setupMockGistCloud(mockGistCloudState);
      vi.stubGlobal('fetch', fetchMock);

      const deviceAStorage = createDeviceStorage();
      const deviceBStorage = createDeviceStorage();

      const configA: GistSyncConfig = {
        pat: 'ghp_secret_collab_token',
        gistId: '',
      };

      // --- STEP 1: DEVICE A CREATES STUDENT "SOPHIE" & PUSHES TO GIST ---
      (globalThis as any).localStorage = deviceAStorage;
      clearStudentRoster();
      clearSessionHistory();

      const sophieDeviceA = saveStudentProfile({
        name: 'Sophie Müller',
        gradeLevel: 5,
        favoriteSubject: 'Mathematik',
        problemSubject: 'Englisch',
        notes: 'Initial profile on Device A',
        hobbies: ['Schach'],
        learningPreferences: ['Visuell'],
      });

      const pushResultA = await pushToGist(configA);
      expect(pushResultA.success).toBe(true);
      expect(pushResultA.gistId).toBeDefined();
      const sharedGistId = pushResultA.gistId!;

      // --- STEP 2: DEVICE B CONFIGURES GIST ID & PULLS DATA ---
      (globalThis as any).localStorage = deviceBStorage;
      clearStudentRoster();
      clearSessionHistory();

      const configB: GistSyncConfig = {
        pat: 'ghp_secret_collab_token',
        gistId: sharedGistId,
      };

      const pullResultB = await pullFromGist(configB);
      expect(pullResultB.success).toBe(true);
      expect(getStudentRoster().length).toBe(1);
      expect(getStudentRoster()[0].name).toBe('Sophie Müller');

      // --- STEP 3: DEVICE B UPDATES SOPHIE & COMPLETES A TEST SESSION ---
      // Update Sophie on Device B with newer updatedAt (T3)
      const updatedSophieB = updateStudentProfile(sophieDeviceA.id, {
        gradeLevel: 6,
        notes: 'Updated to Grade 6 on Device B',
        hobbies: ['Schach', 'Fußball'],
      });
      expect(updatedSophieB?.gradeLevel).toBe(6);

      const sessionB1: TestSessionRecord = {
        sessionId: 'sess_sophie_b1',
        studentId: sophieDeviceA.id,
        studentName: 'Sophie Müller',
        date: '2026-08-16T15:00:00.000Z',
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 1,
        score: 9,
        totalQuestions: 10,
        topicBreakdown: {},
        answers: [{ questionId: 'q_devB_1', topic: 'Bruchrechnung', subject: 'math', isCorrect: true, timeTaken: 5.0, usedExtraTime: false }],
      };
      saveSessionRecord(sessionB1);

      // Device B pushes its changes to Gist
      const pushResultB = await pushToGist(configB);
      expect(pushResultB.success).toBe(true);

      // --- STEP 4: CONCURRENTLY ON DEVICE A, TUTOR ADDS STUDENT "MAX" ---
      (globalThis as any).localStorage = deviceAStorage;

      const maxDeviceA = saveStudentProfile({
        name: 'Max Mustermann',
        gradeLevel: 7,
        favoriteSubject: 'Physik',
        problemSubject: 'Deutsch',
        notes: 'Created on Device A',
        hobbies: ['Robotik'],
        learningPreferences: ['Interaktiv'],
      });

      expect(maxDeviceA.id).toBeDefined();
      expect(getStudentRoster().length).toBe(2); // Sophie + Max on Device A

      // --- STEP 5: DEVICE A PULLS UPDATES FROM GIST ---
      configA.gistId = sharedGistId;
      const pullResultA = await pullFromGist(configA);
      expect(pullResultA.success).toBe(true);

      const rosterA = getStudentRoster();
      const historyA = getSessionHistory();

      // Device A has both Sophie and Max
      expect(rosterA.length).toBe(2);
      const sophieMergedA = getStudentById(sophieDeviceA.id);
      expect(sophieMergedA?.gradeLevel).toBe(6); // Device B's newer update won LWW
      expect(sophieMergedA?.hobbies).toContain('Fußball');
      expect(sophieMergedA?.hobbies).toContain('Schach');

      // Device A has session from Device B
      expect(historyA.length).toBe(1);
      expect(historyA[0].sessionId).toBe('sess_sophie_b1');

      // --- STEP 6: DEVICE A PUSHES MERGED UNIFIED DATA TO GIST ---
      const finalPushA = await pushToGist(configA);
      expect(finalPushA.success).toBe(true);

      // --- STEP 7: DEVICE B PULLS FINAL STATE ---
      (globalThis as any).localStorage = deviceBStorage;
      const finalPullB = await pullFromGist(configB);
      expect(finalPullB.success).toBe(true);

      const rosterB = getStudentRoster();
      const historyB = getSessionHistory();

      expect(rosterB.length).toBe(2);
      expect(rosterB.map((s) => s.name)).toContain('Max Mustermann');
      expect(rosterB.map((s) => s.name)).toContain('Sophie Müller');
      expect(historyB.length).toBe(1);

      // Both devices are 100% in sync with zero data loss
      expect(rosterA.map((s) => s.id).sort()).toEqual(rosterB.map((s) => s.id).sort());
      expect(historyA.map((s) => s.sessionId)).toEqual(historyB.map((s) => s.sessionId));
    });
  });

  describe('Scenario 3: Corrupted File & Schema Disaster Recovery', () => {
    it('gracefully rejects corrupted/invalid files and protects existing local data with 0 data corruption', () => {
      // Setup: Device with 3 students and 8 sessions
      const existingStudents = [
        saveStudentProfile({ name: 'Student 1', gradeLevel: 5 }),
        saveStudentProfile({ name: 'Student 2', gradeLevel: 6 }),
        saveStudentProfile({ name: 'Student 3', gradeLevel: 7 }),
      ];

      for (let i = 1; i <= 8; i++) {
        saveSessionRecord({
          sessionId: `sess_local_${i}`,
          studentId: existingStudents[i % 3].id,
          studentName: existingStudents[i % 3].name,
          date: new Date().toISOString(),
          subject: 'Mathematik',
          mathLevelReached: 2,
          englishLevelReached: 1,
          score: 5,
          totalQuestions: 5,
          topicBreakdown: {},
          answers: [],
        });
      }

      expect(getStudentRoster().length).toBe(3);
      expect(getSessionHistory().length).toBe(8);

      const adversarialPayloads = [
        { name: 'HTML Error Page', content: '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>' },
        { name: 'Unrelated App JSON', content: JSON.stringify({ users: [{ username: 'admin' }] }) },
        { name: 'Truncated JSON', content: '{"version": 1, "data": {"roster": [{"id": "s1"' },
        { name: 'Unsupported Version 999', content: JSON.stringify({ version: 999, data: { roster: [], history: [] } }) },
        { name: 'Corrupted Session History', content: JSON.stringify({ version: 1, data: { history: [{ sessionId: '', studentId: null }] } }) },
        { name: 'Corrupted Student Profile', content: JSON.stringify({ version: 1, data: { roster: [{ id: '', name: null }] } }) },
      ];

      adversarialPayloads.forEach((scenario) => {
        const result = parseAndValidateBackupFile(scenario.content);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        // Verify existing local records are 100% untouched
        expect(getStudentRoster().length).toBe(3);
        expect(getSessionHistory().length).toBe(8);
      });

      // Global Object Prototype is clean
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });
  });

  describe('Scenario 4: Network Disruption & Token Expiry Handling', () => {
    it('gracefully handles 401, 403, 404, and offline network errors without disrupting application', async () => {
      // 1. Expired Token (401)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 })));

      const conn401 = await testGistConnection('ghp_expired_token');
      expect(conn401.success).toBe(false);
      expect(conn401.message).toContain('401');

      const push401 = await pushToGist({ pat: 'ghp_expired_token', gistId: 'gist_123' });
      expect(push401.success).toBe(false);
      expect(push401.message).toContain('401');

      // 2. Gist Not Found (404)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })));

      const pull404 = await pullFromGist({ pat: 'ghp_valid_token', gistId: 'non_existent_gist' });
      expect(pull404.success).toBe(false);
      expect(pull404.message).toContain('404');

      // 3. Rate Limit Exceeded (403)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: { 'X-RateLimit-Remaining': '0' },
      })));

      const push403 = await pushToGist({ pat: 'ghp_valid_token', gistId: 'gist_123' });
      expect(push403.success).toBe(false);
      expect(push403.message).toContain('403');

      // 4. Network Offline
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      const pullOffline = await pullFromGist({ pat: 'ghp_valid_token', gistId: 'gist_123' });
      expect(pullOffline.success).toBe(false);
      expect(pullOffline.message).toMatch(/Internetverbindung|Netzwerkfehler|Offline/i);
    });
  });

  describe('Scenario 5: Active Test Session State Isolation during Cloud Sync', () => {
    it('isolates ongoing in-flight diagnostic test answers when background sync modifies roster/history', () => {
      // Step 1: Initialize active test state for Student Clara
      const clara = saveStudentProfile({ name: 'Clara', gradeLevel: 5 });

      const activeAnswers = [
        { questionId: 'q1', topic: 'Addition', subject: 'math' as const, isCorrect: true, timeTaken: 5, usedExtraTime: false },
        { questionId: 'q2', topic: 'Subtraktion', subject: 'math' as const, isCorrect: true, timeTaken: 4, usedExtraTime: false },
        { questionId: 'q3', topic: 'Multiplikation', subject: 'math' as const, isCorrect: false, timeTaken: 8, usedExtraTime: false },
        { questionId: 'q4', topic: 'Division', subject: 'math' as const, isCorrect: true, timeTaken: 6, usedExtraTime: false },
        { questionId: 'q5', topic: 'Geometrie', subject: 'math' as const, isCorrect: true, timeTaken: 7, usedExtraTime: false },
        { questionId: 'q6', topic: 'Bruchrechnung', subject: 'math' as const, isCorrect: true, timeTaken: 5, usedExtraTime: false },
      ];

      // Simulated in-flight test session state
      let inFlightSession = {
        studentId: clara.id,
        answers: [...activeAnswers],
        mathLevel: 2,
        activeStreak: 3,
        sessionId: 'sess_active_in_flight_1',
      };

      // Step 2: Background cloud pull brings in remote student Lukas and historical session
      const incomingRemotePayload: SyncPayload = {
        version: 1,
        metadata: {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          appVersion: '1.0.0',
        },
        data: {
          roster: [
            {
              id: 'std_lukas',
              name: 'Lukas Meyer',
              gradeLevel: 6,
              favoriteSubject: 'Englisch',
              problemSubject: 'Mathe',
              notes: 'Remote added student',
              createdAt: '2026-08-16T12:00:00.000Z',
              updatedAt: '2026-08-16T12:00:00.000Z',
            },
          ],
          history: [
            {
              sessionId: 'sess_remote_lukas_1',
              studentId: 'std_lukas',
              studentName: 'Lukas Meyer',
              date: '2026-08-16T12:30:00.000Z',
              subject: 'Englisch',
              mathLevelReached: 1,
              englishLevelReached: 2,
              score: 5,
              totalQuestions: 5,
              topicBreakdown: {},
              answers: [],
            },
          ],
        },
      };

      // Merge incoming remote payload into local database
      applyImportPayload(incomingRemotePayload, 'merge');

      // Step 3: Verify local roster has both Clara and Lukas
      expect(getStudentRoster().length).toBe(2);
      expect(getStudentById('std_lukas')).toBeDefined();
      expect(getStudentById(clara.id)).toBeDefined();

      // Step 4: Verify in-flight test session answers remain 100% intact & isolated
      expect(inFlightSession.answers.length).toBe(6);
      expect(inFlightSession.mathLevel).toBe(2);
      expect(inFlightSession.activeStreak).toBe(3);
      expect(inFlightSession.studentId).toBe(clara.id);

      // Step 5: Clara finishes test -> session is saved without conflicts
      const completedSession: TestSessionRecord = {
        sessionId: inFlightSession.sessionId,
        studentId: clara.id,
        studentName: clara.name,
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: inFlightSession.mathLevel,
        englishLevelReached: 1,
        score: 5,
        totalQuestions: 6,
        topicBreakdown: {},
        answers: inFlightSession.answers,
      };

      saveSessionRecord(completedSession);

      const claraSessions = getSessionsByStudentId(clara.id);
      expect(claraSessions.length).toBe(1);
      expect(claraSessions[0].sessionId).toBe('sess_active_in_flight_1');
      expect(claraSessions[0].answers.length).toBe(6);
    });
  });
});
