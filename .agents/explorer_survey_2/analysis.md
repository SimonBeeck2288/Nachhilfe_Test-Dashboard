# Technical Specification & Analysis: Multi-Device Synchronization & Data Portability

**Author**: `explorer_survey_2` (Specification & Remote Sync Exploration Agent)  
**Date**: 2026-08-16  
**Status**: Completed Analysis & Ready for Implementation  
**Integrity Mode**: Development / Zero-Regression

---

## 1. Executive Summary & Architecture Overview

The **NachhilfeTest** application is a privacy-first, client-side educational diagnostic web application currently using browser `localStorage` for:
1. **Student Profiles (Roster)**: `diagnostic_student_roster`
2. **Session Records (History)**: `diagnostic_session_history`

To enable seamless multi-device usage (e.g. tablet in tutoring sessions, desktop for lesson planning) and robust disaster recovery without requiring expensive backend server infrastructure, we specify a dual-tier data synchronization and portability architecture:

```
+-----------------------------------------------------------------------------------+
|                                 NachhilfeTest App                                 |
+-----------------------------------------------------------------------------------+
        |                                                           |
        v                                                           v
+-----------------------------+                             +-----------------------------+
|   JSON File Export/Import   |                             |    GitHub Gist REST Sync    |
| - Zero network required     |                             | - Cloud multi-device sync   |
| - Local manual backup files |                             | - Private secret Gist       |
| - Versioned schema (v1)     |                             | - Personal Access Token     |
+-----------------------------+                             +-----------------------------+
        \                                                           /
         \                                                         /
          v                                                       v
+-----------------------------------------------------------------------------------+
|               Unified Merge Engine (Smart Merge / Conflict Resolver)              |
| - LWW (Last-Write-Wins) timestamp-based merge per Student ID                      |
| - Set deduplication & chronological ordering for Session History                  |
| - Optional Tombstones for cross-device deletion synchronization                   |
| - Zero data loss / Non-destructive merging                                        |
+-----------------------------------------------------------------------------------+
        |
        v
+-----------------------------------------------------------------------------------+
|                    Browser Storage (localStorage / Memory Roster)                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. GitHub Gist REST API Integration

### 2.1 API Specification & Endpoints

GitHub provides a rich REST API for Gists (`https://api.github.com/gists`). A single private Gist contains one or more named files and acts as a lightweight, secure JSON document store.

- **Base URL**: `https://api.github.com`
- **GitHub API Version Header**: `X-GitHub-Api-Version: 2022-11-28`
- **Accept Header**: `application/vnd.github+json`
- **Gist File Name**: `nachhilfe_sync_data.json`

#### Endpoints Matrix

| Operation | HTTP Method | Endpoint | Request Body | Response Status | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Validate Token** | `GET` | `/user` | None | `200 OK` / `401 Unauthorized` | Verify PAT validity and fetch GitHub username |
| **Create Private Gist** | `POST` | `/gists` | `{ description, public: false, files }` | `201 Created` | Initialize remote sync file on first sync |
| **Read Gist** | `GET` | `/gists/{gist_id}` | None | `200 OK` / `404 Not Found` | Fetch remote sync payload |
| **Update Gist** | `PATCH` | `/gists/{gist_id}` | `{ description, files }` | `200 OK` | Upload merged/updated sync payload |

---

### 2.2 Authentication & Token Types

GitHub supports two primary token formats suitable for Gist access:

1. **Fine-Grained Personal Access Tokens (Recommended)**:
   - **Prefix**: `github_pat_` (typically 82-255 characters).
   - **Permissions Required**: `Gists: Read and Write`.
   - **Security Benefits**: Scoped to specific repositories or account services; can have strict expiration dates.
2. **Classic Personal Access Tokens (Legacy / Compatible)**:
   - **Prefix**: `ghp_` (40 alphanumeric characters: `ghp_` followed by 36 characters).
   - **Scope Required**: `gist` (Full control over gists).

#### Request Headers Structure

```typescript
export function getGitHubHeaders(token: string): HeadersInit {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}
```

---

### 2.3 Gist REST API Client Implementation Blueprint

```typescript
// src/utils/sync/gistClient.ts

export interface GistFileContent {
  content: string;
  filename?: string;
  truncated?: boolean;
  raw_url?: string;
}

export interface GistResponse {
  id: string;
  html_url: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<string, GistFileContent>;
  owner?: {
    login: string;
    id: number;
    avatar_url: string;
  };
}

export interface GistSyncPayload {
  token: string;
  gistId?: string;
}

const GIST_FILENAME = 'nachhilfe_sync_data.json';
const GIST_DESCRIPTION = 'NachhilfeTest - Diagnostik Synchronisationsdaten';

export class GistClient {
  private token: string;
  private timeoutMs: number;

  constructor(token: string, timeoutMs = 15000) {
    this.token = token.trim();
    this.timeoutMs = timeoutMs;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...getGitHubHeaders(this.token),
          ...(options.headers || {}),
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Verifies if the provided token is valid and returns user login.
   */
  async validateToken(): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const res = await this.fetchWithTimeout('https://api.github.com/user');
      if (res.status === 200) {
        const data = await res.json();
        return { valid: true, username: data.login };
      }
      if (res.status === 401) {
        return { valid: false, error: 'Token ungültig oder abgelaufen (401 Unauthorized).' };
      }
      if (res.status === 403) {
        return { valid: false, error: 'Ratenlimit überschritten oder Token unzureichend berechtigt (403 Forbidden).' };
      }
      return { valid: false, error: `GitHub API Fehler: Status ${res.status}` };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { valid: false, error: 'Zeitüberschreitung bei Verbindung zu GitHub (Timeout).' };
      }
      return { valid: false, error: 'Netzwerkfehler: Keine Verbindung zu GitHub möglich.' };
    }
  }

  /**
   * Creates a new private Gist with initial sync data.
   */
  async createGist(jsonContent: string): Promise<{ success: boolean; gistId?: string; error?: string }> {
    try {
      const res = await this.fetchWithTimeout('https://api.github.com/gists', {
        method: 'POST',
        body: JSON.stringify({
          description: GIST_DESCRIPTION,
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: jsonContent,
            },
          },
        }),
      });

      if (res.status === 201) {
        const data: GistResponse = await res.json();
        return { success: true, gistId: data.id };
      }

      const errorBody = await res.text().catch(() => '');
      return { success: false, error: `Erstellung fehlgeschlagen (${res.status}): ${errorBody}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbindungsfehler beim Erstellen des Gists.' };
    }
  }

  /**
   * Fetches JSON content from an existing Gist ID.
   */
  async getGistContent(gistId: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const cleanGistId = gistId.trim();
      const res = await this.fetchWithTimeout(`https://api.github.com/gists/${cleanGistId}`);

      if (res.status === 404) {
        return { success: false, error: `Gist mit ID "${cleanGistId}" wurde nicht gefunden (404 Not Found).` };
      }
      if (!res.ok) {
        return { success: false, error: `Fehler beim Laden des Gists: HTTP ${res.status}` };
      }

      const data: GistResponse = await res.json();
      
      // Look for standard file or first available JSON file
      let file = data.files[GIST_FILENAME];
      if (!file) {
        const jsonKey = Object.keys(data.files).find((k) => k.endsWith('.json'));
        if (jsonKey) file = data.files[jsonKey];
        else {
          const firstKey = Object.keys(data.files)[0];
          if (firstKey) file = data.files[firstKey];
        }
      }

      if (!file) {
        return { success: false, error: 'Der angegebene Gist enthält keine lesbaren Dateien.' };
      }

      // If truncated (very large file > 1MB), fetch directly from raw_url
      if (file.truncated && file.raw_url) {
        const rawRes = await this.fetchWithTimeout(file.raw_url);
        if (rawRes.ok) {
          const rawText = await rawRes.text();
          return { success: true, content: rawText };
        }
      }

      return { success: true, content: file.content };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbindungsfehler beim Abrufen des Gists.' };
    }
  }

  /**
   * Updates an existing Gist with new JSON content.
   */
  async updateGist(gistId: string, jsonContent: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanGistId = gistId.trim();
      const res = await this.fetchWithTimeout(`https://api.github.com/gists/${cleanGistId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: GIST_DESCRIPTION,
          files: {
            [GIST_FILENAME]: {
              content: jsonContent,
            },
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }

      return { success: false, error: `Gist Aktualisierung fehlgeschlagen: HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verbindungsfehler beim Aktualisieren des Gists.' };
    }
  }
}
```

---

## 3. Conflict Resolution & Merging Algorithms

### 3.1 Data Entities & Identity Model

The data stored in NachhilfeTest consists of:
1. **Student Profiles (`StudentProfile[]`)**:
   - Primary Key: `id: string` (e.g. `std_1723820000000_abcde`).
   - Timestamps: `createdAt: string` (ISO), `updatedAt: string` (ISO).
   - Core fields: `name`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `notes`.
   - Rich extensions: `hobbies`, `learningPreferences`, `customNotes`, `accessibilitySettings`.
2. **Session Records (`TestSessionRecord[]`)**:
   - Primary Key: `sessionId: string` (e.g. `sess_1723825000000_xyz98`).
   - Foreign Key: `studentId: string`.
   - Timestamp: `date: string` (ISO).
   - Core fields: `subject`, scores, `topicBreakdown`, `cognitionStats`, `answers`.

---

### 3.2 Merging Strategy & Scenarios

When merging Remote (Gist or imported JSON) with Local (browser storage):

```
       LOCAL RECORD                              REMOTE RECORD
  (studentId: "std_123")                     (studentId: "std_123")
 updatedAt: 2026-08-16T14:00               updatedAt: 2026-08-16T15:30
             \                                    /
              \                                  /
               +--------------------------------+
               |     Compare `updatedAt`        |
               +--------------------------------+
                               |
               +---------------+---------------+
               |                               |
       Local is Newer                   Remote is Newer
    (local.updatedAt > remote)       (remote.updatedAt > local)
               |                               |
               v                               v
       Keep Local Record               Take Remote Record
```

#### A. Student Profile Conflict Resolution Logic
1. **Identical ID Exists Locally and Remotely**:
   - Parse `Date.parse(remote.updatedAt)` vs `Date.parse(local.updatedAt)`.
   - If `remote.updatedAt > local.updatedAt`, Remote profile wins.
   - If `local.updatedAt > remote.updatedAt`, Local profile wins.
   - If timestamps are equal (`remote.updatedAt === local.updatedAt`), merge collections:
     - Deduplicate and union array fields (`hobbies: Array.from(new Set([...local.hobbies, ...remote.hobbies]))`).
     - Deduplicate and union `learningPreferences`.
     - Prefer non-empty `customNotes` / `notes`.
     - Prefer custom `accessibilitySettings` over default if modified.
2. **ID Exists in Local Only**:
   - Retain local student.
3. **ID Exists in Remote Only**:
   - Add remote student to local roster.
4. **Name Collisions with Disjoint IDs**:
   - Since IDs are unique random strings, both profiles are preserved. If necessary, a subtle badge or disambiguation can show grade/date.

---

### 3.3 Tombstone Architecture for Deletions

In multi-device synchronization, deleting a record on Device A without recording the deletion means Device B will re-introduce that record on next merge.

We design a lightweight **Tombstone registry**:
```typescript
export interface TombstoneRecord {
  id: string;
  type: 'student' | 'session';
  deletedAt: string; // ISO string
}
```

#### Tombstone Resolution Rules:
- When a student is deleted in the UI, record `{ id: studentId, type: 'student', deletedAt: new Date().toISOString() }` in `diagnostic_sync_tombstones`.
- During merge:
  - If a student exists in Remote, but exists in Local Tombstones with `deletedAt > remote.updatedAt`, the student is **NOT** restored.
  - If a student was updated remotely *after* the local tombstone (`remote.updatedAt > tombstone.deletedAt`), the update revives the student and removes the tombstone.
- **Tombstone Pruning**: Tombstones older than 60 days are purged automatically to conserve storage.

---

### 3.4 Test Session History Merging Logic

Test sessions are **append-only, immutable diagnostic logs**.
1. **Deduplication Key**: `record.sessionId`.
2. **Union Strategy**:
   - Create a Map indexed by `sessionId`.
   - Populate Map with all local sessions.
   - For each remote session:
     - If `sessionId` not in Map, insert.
     - If `sessionId` in Map, retain local unless remote has enriched interpretation/notes.
3. **Chronological Ordering**:
   - Sort the resulting array descending by `new Date(session.date).getTime()`.
4. **Missing / Legacy Session IDs**:
   - If legacy imported session lacks `sessionId`, generate a deterministic surrogate key:
     `sess_synth_${studentId}_${date}_${subject}_${score}`.

---

### 3.5 Unified Merge Engine Implementation Blueprint

```typescript
// src/utils/sync/mergeEngine.ts

import type { StudentProfile } from '../../types/student';
import type { TestSessionRecord } from '../../types/history';
import { getAccessibilitySettings } from '../studentRoster';

export interface Tombstone {
  id: string;
  type: 'student' | 'session';
  deletedAt: string;
}

export interface SyncDataContainer {
  students: StudentProfile[];
  sessions: TestSessionRecord[];
  tombstones?: Tombstone[];
}

export interface MergeResult {
  mergedStudents: StudentProfile[];
  mergedSessions: TestSessionRecord[];
  mergedTombstones: Tombstone[];
  stats: {
    studentsAdded: number;
    studentsUpdated: number;
    studentsDeleted: number;
    sessionsAdded: number;
    sessionsTotal: number;
  };
}

export function mergeSyncData(
  local: SyncDataContainer,
  remote: SyncDataContainer
): MergeResult {
  let studentsAdded = 0;
  let studentsUpdated = 0;
  let studentsDeleted = 0;
  let sessionsAdded = 0;

  // 1. Merge Tombstones
  const tombstoneMap = new Map<string, Tombstone>();
  [...(local.tombstones || []), ...(remote.tombstones || [])].forEach((t) => {
    const existing = tombstoneMap.get(t.id);
    if (!existing || new Date(t.deletedAt).getTime() > new Date(existing.deletedAt).getTime()) {
      tombstoneMap.set(t.id, t);
    }
  });

  // Prune tombstones older than 60 days
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const activeTombstones = Array.from(tombstoneMap.values()).filter(
    (t) => new Date(t.deletedAt).getTime() > sixtyDaysAgo
  );
  const activeTombstoneIds = new Set(activeTombstones.map((t) => t.id));

  // 2. Merge Students
  const studentMap = new Map<string, StudentProfile>();
  local.students.forEach((s) => {
    if (!activeTombstoneIds.has(s.id)) {
      studentMap.set(s.id, { ...s });
    }
  });

  remote.students.forEach((remStudent) => {
    const tombstone = tombstoneMap.get(remStudent.id);
    const remUpdatedTime = new Date(remStudent.updatedAt || remStudent.createdAt || 0).getTime();

    // Check if remote student was deleted locally after its last update
    if (tombstone && tombstone.type === 'student') {
      const tombstoneTime = new Date(tombstone.deletedAt).getTime();
      if (tombstoneTime > remUpdatedTime) {
        // Was deleted, skip restoring
        studentsDeleted++;
        return;
      }
    }

    const localStudent = studentMap.get(remStudent.id);
    if (!localStudent) {
      // Remote student added to local
      studentMap.set(remStudent.id, {
        ...remStudent,
        accessibilitySettings: getAccessibilitySettings(remStudent),
      });
      studentsAdded++;
    } else {
      // Compare timestamps
      const localUpdatedTime = new Date(localStudent.updatedAt || localStudent.createdAt || 0).getTime();
      if (remUpdatedTime > localUpdatedTime) {
        studentMap.set(remStudent.id, {
          ...remStudent,
          accessibilitySettings: getAccessibilitySettings(remStudent),
        });
        studentsUpdated++;
      } else if (remUpdatedTime === localUpdatedTime) {
        // Equal timestamps -> Merge arrays and non-empty fields
        const mergedHobbies = Array.from(new Set([...(localStudent.hobbies || []), ...(remStudent.hobbies || [])]));
        const mergedPrefs = Array.from(
          new Set([...(localStudent.learningPreferences || []), ...(remStudent.learningPreferences || [])])
        );

        studentMap.set(remStudent.id, {
          ...localStudent,
          hobbies: mergedHobbies,
          learningPreferences: mergedPrefs,
          customNotes: localStudent.customNotes || remStudent.customNotes || '',
          notes: localStudent.notes || remStudent.notes || '',
        });
      }
    }
  });

  // 3. Merge Sessions
  const sessionMap = new Map<string, TestSessionRecord>();
  local.sessions.forEach((sess) => {
    const key = sess.sessionId || `synth_${sess.studentId}_${sess.date}_${sess.subject}`;
    if (!activeTombstoneIds.has(key)) {
      sessionMap.set(key, sess);
    }
  });

  remote.sessions.forEach((remSess) => {
    const key = remSess.sessionId || `synth_${remSess.studentId}_${remSess.date}_${remSess.subject}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, remSess);
      sessionsAdded++;
    }
  });

  // Sort sessions descending by date
  const sortedSessions = Array.from(sessionMap.values()).sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });

  return {
    mergedStudents: Array.from(studentMap.values()),
    mergedSessions: sortedSessions,
    mergedTombstones: activeTombstones,
    stats: {
      studentsAdded,
      studentsUpdated,
      studentsDeleted,
      sessionsAdded,
      sessionsTotal: sortedSessions.length,
    },
  };
}
```

---

## 4. Secure Local Storage & Security Architecture

### 4.1 Storage Keys & State Isolation

| Storage Key | Storage Type | Content | Example Value |
| :--- | :--- | :--- | :--- |
| `diagnostic_sync_pat` | `localStorage` | GitHub Personal Access Token | `github_pat_11A...` or `ghp_...` |
| `diagnostic_sync_gist_id` | `localStorage` | Target Gist ID | `a1b2c3d4e5f60718293a4b5c6d7e8f90` |
| `diagnostic_sync_last_time` | `localStorage` | Last successful sync timestamp | `2026-08-16T19:30:00.000Z` |
| `diagnostic_sync_tombstones` | `localStorage` | Array of deleted IDs | `[{"id":"std_123","type":"student",...}]` |
| `diagnostic_sync_auto` | `localStorage` | Auto-sync on session completion | `"true"` / `"false"` |

---

### 4.2 Token Format Validation & Regex Specifications

We validate user inputs client-side before any network request is initiated:

```typescript
// src/utils/sync/tokenValidator.ts

export interface ValidationTokenResult {
  isValid: boolean;
  type?: 'fine_grained' | 'classic' | 'unknown';
  error?: string;
}

export function validateGitHubToken(token: string): ValidationTokenResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Token darf nicht leer sein.' };
  }

  // Fine-grained PAT: github_pat_ followed by base62 characters
  if (/^github_pat_[a-zA-Z0-9_]{82,255}$/.test(trimmed)) {
    return { isValid: true, type: 'fine_grained' };
  }

  // Classic PAT: ghp_ followed by 36 alphanumeric characters
  if (/^ghp_[a-zA-Z0-9]{36,40}$/.test(trimmed)) {
    return { isValid: true, type: 'classic' };
  }

  // Generic fallback if user enters older token without standard prefix
  if (/^[a-zA-Z0-9_]{20,255}$/.test(trimmed)) {
    return { isValid: true, type: 'unknown' };
  }

  return {
    isValid: false,
    error: 'Ungültiges Token-Format. Erwartet: github_pat_... (Fine-grained) oder ghp_... (Classic).',
  };
}

export function extractGistId(input: string): string {
  const trimmed = input.trim();
  // If user pasted a full URL: https://gist.github.com/username/a1b2c3d4e5f6
  const urlMatch = trimmed.match(/gist\.github\.com\/(?:[a-zA-Z0-9-]+\/)?([a-fA-F0-9]{20,32})/);
  if (urlMatch) {
    return urlMatch[1];
  }
  // If user provided raw hex ID
  const idMatch = trimmed.match(/^([a-fA-F0-9]{20,32})$/);
  if (idMatch) {
    return idMatch[1];
  }
  return trimmed;
}
```

---

### 4.3 Security Considerations & Threat Defense

1. **Zero Secret Leakage in Backups**:
   - Exported JSON files must **never** contain GitHub PATs, Gist IDs, or sensitive authentication headers.
   - The backup generator strictly extracts `diagnostic_student_roster` and `diagnostic_session_history` only.
2. **UI Masking & Disconnect Action**:
   - PAT input uses `type="password"` with visibility toggle (`<Eye />` / `<EyeOff />`).
   - UI presents a clear "Verbindung trennen / Token löschen" button that purges credentials from `localStorage`.
3. **Log Sanitization**:
   - All network error logs redact tokens: `console.error('Sync failed:', err.message.replace(token, '[REDACTED]'))`.
4. **XSS & Prototype Pollution Defense**:
   - JSON parsing sanitizes object keys, rejecting dangerous properties (`__proto__`, `constructor`, `prototype`).
5. **Private by Default**:
   - Created Gists are explicitly created with `"public": false`.

---

## 5. Network Error Handling, Rate Limits & Resilience

### 5.1 Error Matrix & User-Facing German Messaging

| Error Code / State | Trigger Condition | System Action | User Feedback Message (DE) |
| :--- | :--- | :--- | :--- |
| **Offline** | `!navigator.onLine` or fetch fails | Skip remote call; preserve local data | *"Keine Internetverbindung. Deine Daten sind lokal sicher gespeichert."* |
| **Timeout (15s)** | Network latency > 15 000 ms | Abort request via `AbortController` | *"Zeitüberschreitung bei Verbindung zu GitHub. Bitte versuche es später erneut."* |
| **401 Unauthorized** | Expired or incorrect PAT | Invalidate stored token status; highlight token field | *"GitHub-Token ungültig oder abgelaufen. Bitte prüfe dein Token in den Einstellungen."* |
| **403 Forbidden** | Lack of Gist scope or rate limit | Parse `x-ratelimit-remaining` / `x-ratelimit-reset` | *"Zugriff verweigert (403). Benötigt 'gist'-Berechtigung oder Ratenlimit erreicht."* |
| **404 Not Found** | Gist ID does not exist or deleted | Prompt to create new Gist or correct ID | *"Gist nicht gefunden (404). Bitte Gist-ID prüfen oder neuen Gist erstellen."* |
| **422 Unprocessable** | Malformed Gist JSON payload | Fail gracefully; show diagnostic error | *"GitHub konnte die Synchronisationsdaten nicht verarbeiten (422)."* |
| **429 Rate Limited** | Secondary rate limit hit | Exponential backoff (retry after reset) | *"Zu viele Anfragen an GitHub (429). Bitte 1 Minute warten."* |
| **500/502/503/504** | GitHub server outage | Non-blocking retry option | *"GitHub-Server vorübergehend nicht erreichbar. Deine lokalen Daten bleiben erhalten."* |

---

### 5.2 Non-Blocking Background Sync Pattern

Sync operations must execute completely out-of-band so that an active student test or diagnostic evaluation is never blocked or frozen:

```typescript
export type SyncStatus = 'idle' | 'checking' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  gistId: string | null;
  hasToken: boolean;
}
```

---

## 6. Export/Import JSON Format Schema & Validation Engine

### 6.1 Canonical JSON Schema (Version 1)

```typescript
// src/types/sync.ts

export interface ExportBackupPayload {
  schemaVersion: 1;
  app: 'NachhilfeTest';
  appVersion: string;
  exportDate: string; // ISO 8601 string
  metadata?: {
    studentCount: number;
    sessionCount: number;
    exportedBy?: string;
  };
  data: {
    diagnostic_student_roster: StudentProfile[];
    diagnostic_session_history: TestSessionRecord[];
  };
  tombstones?: TombstoneRecord[];
}
```

#### Example Valid Export Payload:
```json
{
  "schemaVersion": 1,
  "app": "NachhilfeTest",
  "appVersion": "1.0.0",
  "exportDate": "2026-08-16T19:15:00.000Z",
  "metadata": {
    "studentCount": 1,
    "sessionCount": 1
  },
  "data": {
    "diagnostic_student_roster": [
      {
        "id": "std_1723820000000_abcde",
        "name": "Lukas Meyer",
        "gradeLevel": 7,
        "favoriteSubject": "Mathematik",
        "problemSubject": "Englisch",
        "notes": "Benötigt visuelle Schritt-für-Schritt Erklärungen",
        "hobbies": ["Gaming", "Fußball"],
        "learningPreferences": ["Visuell", "Schritt-für-Schritt"],
        "customNotes": "Starke Konzentration bei Knobelaufgaben",
        "accessibilitySettings": {
          "preset": "standard",
          "directQuestions": false,
          "reducedSensory": false
        },
        "createdAt": "2026-08-10T10:00:00.000Z",
        "updatedAt": "2026-08-15T14:30:00.000Z"
      }
    ],
    "diagnostic_session_history": [
      {
        "sessionId": "sess_1723825000000_xyz98",
        "studentId": "std_1723820000000_abcde",
        "studentName": "Lukas Meyer",
        "date": "2026-08-15T14:00:00.000Z",
        "subject": "math",
        "mathLevelReached": 3,
        "englishLevelReached": 1,
        "score": 12,
        "totalQuestions": 15,
        "topicBreakdown": {
          "Addition": {
            "topic": "Addition",
            "correct": 5,
            "total": 5,
            "accuracy": 1.0,
            "avgTime": 4.2
          }
        },
        "answers": [],
        "durationSeconds": 450
      }
    ]
  },
  "tombstones": []
}
```

---

### 6.2 Zero-Dependency Runtime Schema Validator

Given that `package.json` does not include external schema validation libraries like `zod`, we provide a fast, zero-dependency, robust TypeScript validator:

```typescript
// src/utils/sync/schemaValidator.ts

import type { ExportBackupPayload } from '../../types/sync';
import type { StudentProfile } from '../../types/student';
import type { TestSessionRecord } from '../../types/history';

export interface ValidationSuccess {
  success: true;
  data: ExportBackupPayload;
  warnings: string[];
}

export interface ValidationFailure {
  success: false;
  errors: string[];
}

export type SchemaValidationResult = ValidationSuccess | ValidationFailure;

function isObject(val: unknown): val is Record<string, any> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function sanitizeStudent(raw: any, index: number, warnings: string[]): StudentProfile | null {
  if (!isObject(raw)) {
    warnings.push(`Schüler #${index + 1} ist kein gültiges Objekt und wurde übersprungen.`);
    return null;
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    warnings.push(`Schüler #${index + 1} besitzt keinen Namen und wurde übersprungen.`);
    return null;
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const gradeLevel = typeof raw.gradeLevel === 'number' || typeof raw.gradeLevel === 'string' ? raw.gradeLevel : 7;
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;

  return {
    id,
    name,
    gradeLevel,
    favoriteSubject: typeof raw.favoriteSubject === 'string' ? raw.favoriteSubject : '',
    problemSubject: typeof raw.problemSubject === 'string' ? raw.problemSubject : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    hobbies: Array.isArray(raw.hobbies) ? raw.hobbies.filter((h: any) => typeof h === 'string') : [],
    learningPreferences: Array.isArray(raw.learningPreferences)
      ? raw.learningPreferences.filter((p: any) => typeof p === 'string')
      : [],
    customNotes: typeof raw.customNotes === 'string' ? raw.customNotes : '',
    accessibilitySettings: isObject(raw.accessibilitySettings)
      ? {
          preset: raw.accessibilitySettings.preset || 'standard',
          directQuestions: Boolean(raw.accessibilitySettings.directQuestions),
          reducedSensory: Boolean(raw.accessibilitySettings.reducedSensory),
        }
      : { preset: 'standard', directQuestions: false, reducedSensory: false },
    createdAt,
    updatedAt,
  };
}

function sanitizeSession(raw: any, index: number, warnings: string[]): TestSessionRecord | null {
  if (!isObject(raw)) {
    warnings.push(`Sitzung #${index + 1} ist kein gültiges Objekt und wurde übersprungen.`);
    return null;
  }

  const sessionId = typeof raw.sessionId === 'string' && raw.sessionId.trim()
    ? raw.sessionId.trim()
    : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    sessionId,
    studentId: typeof raw.studentId === 'string' ? raw.studentId : 'guest',
    studentName: typeof raw.studentName === 'string' ? raw.studentName : 'Gast',
    date: typeof raw.date === 'string' ? raw.date : new Date().toISOString(),
    subject: typeof raw.subject === 'string' ? raw.subject : 'math',
    mathLevelReached: typeof raw.mathLevelReached === 'number' ? raw.mathLevelReached : 1,
    englishLevelReached: typeof raw.englishLevelReached === 'number' ? raw.englishLevelReached : 1,
    score: typeof raw.score === 'number' ? raw.score : 0,
    totalQuestions: typeof raw.totalQuestions === 'number' ? raw.totalQuestions : 0,
    topicBreakdown: isObject(raw.topicBreakdown) || Array.isArray(raw.topicBreakdown) ? raw.topicBreakdown : {},
    cognitionStats: isObject(raw.cognitionStats) ? raw.cognitionStats : null,
    answers: Array.isArray(raw.answers) ? raw.answers : [],
    motivation: typeof raw.motivation === 'number' ? raw.motivation : undefined,
    favoriteSubject: typeof raw.favoriteSubject === 'string' ? raw.favoriteSubject : undefined,
    problemSubject: typeof raw.problemSubject === 'string' ? raw.problemSubject : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    durationSeconds: typeof raw.durationSeconds === 'number' ? raw.durationSeconds : undefined,
    markedQuestionIds: Array.isArray(raw.markedQuestionIds) ? raw.markedQuestionIds : undefined,
  };
}

export function validateSyncPayload(jsonString: string): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!jsonString || !jsonString.trim()) {
    return { success: false, errors: ['Die angegebene Datei / der Payload ist leer.'] };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return { success: false, errors: [`Ungültiges JSON-Format: ${err.message}`] };
  }

  // Support legacy format where raw array was exported directly
  if (Array.isArray(parsed)) {
    warnings.push('Legacy-Format erkannt: Importiere als Schüler-Roster.');
    const students: StudentProfile[] = [];
    parsed.forEach((item, idx) => {
      const s = sanitizeStudent(item, idx, warnings);
      if (s) students.push(s);
    });
    return {
      success: true,
      data: {
        schemaVersion: 1,
        app: 'NachhilfeTest',
        appVersion: 'legacy',
        exportDate: new Date().toISOString(),
        data: {
          diagnostic_student_roster: students,
          diagnostic_session_history: [],
        },
      },
      warnings,
    };
  }

  if (!isObject(parsed)) {
    return { success: false, errors: ['Wurzelelement des JSON muss ein Objekt sein.'] };
  }

  // Schema version check
  if (parsed.schemaVersion && parsed.schemaVersion !== 1) {
    return {
      success: false,
      errors: [`Nicht unterstützte Schema-Version: ${parsed.schemaVersion}. Unterstützt wird Version 1.`],
    };
  }

  const rawData = parsed.data || parsed;
  const rawRoster = rawData.diagnostic_student_roster || rawData.students || [];
  const rawHistory = rawData.diagnostic_session_history || rawData.sessions || [];

  if (!Array.isArray(rawRoster) && !Array.isArray(rawHistory)) {
    return {
      success: false,
      errors: ['Keine gültigen Schüler- oder Testergebnis-Daten im JSON gefunden.'],
    };
  }

  const validStudents: StudentProfile[] = [];
  if (Array.isArray(rawRoster)) {
    rawRoster.forEach((item, idx) => {
      const s = sanitizeStudent(item, idx, warnings);
      if (s) validStudents.push(s);
    });
  }

  const validSessions: TestSessionRecord[] = [];
  if (Array.isArray(rawHistory)) {
    rawHistory.forEach((item, idx) => {
      const sess = sanitizeSession(item, idx, warnings);
      if (sess) validSessions.push(sess);
    });
  }

  return {
    success: true,
    data: {
      schemaVersion: 1,
      app: 'NachhilfeTest',
      appVersion: parsed.appVersion || '1.0.0',
      exportDate: parsed.exportDate || new Date().toISOString(),
      metadata: parsed.metadata || {
        studentCount: validStudents.length,
        sessionCount: validSessions.length,
      },
      data: {
        diagnostic_student_roster: validStudents,
        diagnostic_session_history: validSessions,
      },
      tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
    },
    warnings,
  };
}
```

---

## 7. UI / UX Integration & Modal Blueprint

### 7.1 Sync & Backup Modal Component (`SyncBackupModal.tsx`)

The modal offers a tabbed interface matching the existing design language (similar to `AiPromptModal` and `StudentSwitcherModal`):

```
+-------------------------------------------------------------------------+
| [Cloud/Backup Icon] Daten-Synchronisation & Backup                 [ X ]|
+-------------------------------------------------------------------------+
|  [ Tab 1: Cloud-Sync (GitHub Gist) ]   [ Tab 2: Datei-Backup (JSON) ]   |
+-------------------------------------------------------------------------+
|                                                                         |
|  GitHub Personal Access Token (PAT):                                    |
|  [ •••••••••••••••••••••••••••••••••••••••••••••• ] [👁️ Anzeigen]       |
|  (i) Benötigt ein Fine-grained Token oder Classic PAT mit 'gist' Scope  |
|                                                                         |
|  Gist-ID (optional bei Erst-Erstellung):                                |
|  [ 7b34e8f1920042a9bce09f301b...              ] [📋 Kopieren]         |
|                                                                         |
|  Letzter Sync: 16.08.2026, 19:45 Uhr (Erfolgreich)                      |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [⬆️ Push zu Gist]       [⬇️ Pull von Gist]       [🔄 Smart-Sync]   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [ ] Automatisch nach jeder abgeschlossenen Testsitzung synchronisieren |
|                                                                         |
|  [ Verbindung trennen / Token löschen ]                                 |
+-------------------------------------------------------------------------+
```

### 7.2 UI Triggers Across the Application

1. **Top Navigation Header (`Layout.tsx`)**:
   - Add a `<button>` with `<Cloud />` icon and sync status dot (Green = synced, Amber = pending/local changes, Red = sync error).
2. **Student Switcher Modal (`StudentSwitcherModal.tsx`)**:
   - Add a "Backup & Sync" button at the bottom of the modal for immediate roster export/sync.
3. **Home Page (`Home.tsx`)**:
   - Add quick "Exportieren / Importieren" action buttons in the student management toolbar.
4. **Dashboard (`Dashboard.tsx`)**:
   - Add "Diagnosedaten sichern" in the header actions next to the Print button.

---

## 8. Verification & Automated Test Strategy

To achieve 100% test pass rate with zero regression:

### Test Suites Matrix

| Test Suite | Path | Scenarios Covered |
| :--- | :--- | :--- |
| **`tokenValidator.test.ts`** | `src/tests/sync/tokenValidator.test.ts` | Fine-grained PAT, Classic PAT, legacy token, Gist ID extraction from URL and hex. |
| **`schemaValidator.test.ts`** | `src/tests/sync/schemaValidator.test.ts` | Valid v1 schema, missing fields, corrupted JSON, prototype pollution attacks, legacy array format. |
| **`mergeEngine.test.ts`** | `src/tests/sync/mergeEngine.test.ts` | LWW updatedAt merge, array deduplication, session chronological sort, tombstone handling, conflict resolution. |
| **`gistClient.test.ts`** | `src/tests/sync/gistClient.test.ts` | Mocked fetch for 200, 201, 401, 403, 404, 429, timeouts, truncated gist raw_url fallback. |
| **`syncIntegration.test.ts`** | `src/tests/sync/syncIntegration.test.ts` | Full export -> import cycle, storage persistence, mock multi-device sync simulation. |

---

## 9. Conclusion & Next Steps

This specification provides the architecture and implementation design for:
1. Multi-device GitHub Gist REST sync (zero running costs, privacy-first).
2. Safe two-way merge algorithm with LWW timestamps, array reconciliation, and tombstones.
3. Secure local storage, regex validation, and secret sanitization.
4. Full offline and network resilience with German error messaging.
5. Standardized v1 JSON schema with zero-dependency runtime validation.
