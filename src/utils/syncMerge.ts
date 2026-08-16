/**
 * src/utils/syncMerge.ts
 * Deterministic Merge Engine for Student Profiles and Session Histories
 * Implements Last-Write-Wins (LWW) via ISO updatedAt, Set Union for Array Fields,
 * and Deduplicated Chronological History Ordering.
 */

import type { StudentProfile } from '../types/student';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type {
  MergeResult,
  ConflictRecord,
  StudentMergeResult,
  HistoryMergeResult,
  SyncData,
} from '../types/sync';

/**
 * Merges two string arrays using a case-insensitive set union,
 * preserving original casing and insertion order.
 */
export function mergeStringSets(localArr?: unknown[], remoteArr?: unknown[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const processItem = (item: unknown) => {
    if (typeof item !== 'string') return;
    const trimmed = item.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  };

  if (Array.isArray(localArr)) {
    localArr.forEach(processItem);
  }
  if (Array.isArray(remoteArr)) {
    remoteArr.forEach(processItem);
  }

  return result;
}

/**
 * Merges two versions of a StudentProfile with identical ID using Last-Write-Wins (LWW).
 */
export function mergeStudentProfiles(
  local: StudentProfile,
  remote: StudentProfile
): { merged: StudentProfile; conflict: ConflictRecord; isUpdated: boolean } {
  const localTime = Date.parse(local.updatedAt) || 0;
  const remoteTime = Date.parse(remote.updatedAt) || 0;

  // Union hobbies & learning preferences across both profiles
  const mergedHobbies = mergeStringSets(local.hobbies, remote.hobbies);
  const mergedPrefs = mergeStringSets(local.learningPreferences, remote.learningPreferences);

  // Preserve the earliest creation timestamp for historical integrity
  const localCreatedTime = Date.parse(local.createdAt) || 0;
  const remoteCreatedTime = Date.parse(remote.createdAt) || 0;
  let earliestCreatedAt = local.createdAt || remote.createdAt || new Date().toISOString();
  if (localCreatedTime > 0 && remoteCreatedTime > 0) {
    earliestCreatedAt = localCreatedTime <= remoteCreatedTime ? local.createdAt : remote.createdAt;
  }

  // Remote is strictly newer
  if (remoteTime > localTime) {
    const merged: StudentProfile = {
      ...remote,
      createdAt: earliestCreatedAt,
      hobbies: mergedHobbies,
      learningPreferences: mergedPrefs,
      accessibilitySettings:
        remote.accessibilitySettings || local.accessibilitySettings || { ...DEFAULT_ACCESSIBILITY_SETTINGS },
    };

    return {
      merged,
      conflict: {
        entityType: 'student',
        entityId: local.id,
        resolution: 'remote',
        reason: `Remote updatedAt (${remote.updatedAt}) ist neuer als local (${local.updatedAt}).`,
        timestamp: new Date().toISOString(),
      },
      isUpdated: true,
    };
  }

  // Local is newer or timestamps are identical (deterministic tie-breaker preserves local)
  const isTie = remoteTime === localTime;
  const merged: StudentProfile = {
    ...local,
    createdAt: earliestCreatedAt,
    hobbies: mergedHobbies,
    learningPreferences: mergedPrefs,
    accessibilitySettings:
      local.accessibilitySettings || remote.accessibilitySettings || { ...DEFAULT_ACCESSIBILITY_SETTINGS },
  };

  return {
    merged,
    conflict: {
      entityType: 'student',
      entityId: local.id,
      resolution: isTie ? 'merged' : 'local',
      reason: isTie
        ? `Identische updatedAt-Zeitstempel (${local.updatedAt}); lokale Skalarwerte beibehalten, Listen vereinigt.`
        : `Lokales updatedAt (${local.updatedAt}) ist neuer als remote (${remote.updatedAt}).`,
      timestamp: new Date().toISOString(),
    },
    isUpdated: false,
  };
}

/**
 * Merges two student rosters.
 */
export function mergeStudentRosters(
  localRoster: StudentProfile[] = [],
  remoteRoster: StudentProfile[] = []
): StudentMergeResult {
  const mergedMap = new Map<string, StudentProfile>();
  const conflicts: ConflictRecord[] = [];
  let studentsAdded = 0;
  let studentsUpdated = 0;
  let studentsUnchanged = 0;

  // Populate map with local profiles
  localRoster.forEach((student) => {
    if (student && typeof student.id === 'string' && student.id.trim()) {
      mergedMap.set(student.id.trim(), { ...student });
    }
  });

  // Merge remote profiles
  remoteRoster.forEach((remoteStudent) => {
    if (!remoteStudent || typeof remoteStudent.id !== 'string' || !remoteStudent.id.trim()) {
      return;
    }
    const studentId = remoteStudent.id.trim();
    const existingLocal = mergedMap.get(studentId);

    if (!existingLocal) {
      mergedMap.set(studentId, { ...remoteStudent, id: studentId });
      studentsAdded++;
    } else {
      const { merged, conflict, isUpdated } = mergeStudentProfiles(existingLocal, remoteStudent);
      mergedMap.set(studentId, merged);
      conflicts.push(conflict);
      if (isUpdated) {
        studentsUpdated++;
      } else {
        studentsUnchanged++;
      }
    }
  });

  const mergedRoster = Array.from(mergedMap.values());

  return {
    mergedRoster,
    stats: {
      studentsAdded,
      studentsUpdated,
      studentsUnchanged,
      studentsMerged: mergedRoster.length,
    },
    conflicts,
  };
}

/**
 * Merges two session history arrays by sessionId with descending chronological sorting.
 */
export function mergeSessionHistories(
  localHistory: TestSessionRecord[] = [],
  remoteHistory: TestSessionRecord[] = []
): HistoryMergeResult {
  const sessionMap = new Map<string, TestSessionRecord>();
  let sessionsAdded = 0;
  let sessionsExisting = 0;

  // Insert local sessions
  localHistory.forEach((session) => {
    if (session && typeof session.sessionId === 'string' && session.sessionId.trim()) {
      sessionMap.set(session.sessionId.trim(), { ...session });
    }
  });

  // Insert remote sessions, deduplicating existing sessionIds
  remoteHistory.forEach((remoteSession) => {
    if (!remoteSession || typeof remoteSession.sessionId !== 'string' || !remoteSession.sessionId.trim()) {
      return;
    }
    const sessionId = remoteSession.sessionId.trim();
    if (sessionMap.has(sessionId)) {
      sessionsExisting++;
    } else {
      sessionMap.set(sessionId, { ...remoteSession, sessionId });
      sessionsAdded++;
    }
  });

  // Sort descending by date (newest first)
  const mergedHistory = Array.from(sessionMap.values()).sort((a, b) => {
    const timeA = Date.parse(a.date) || 0;
    const timeB = Date.parse(b.date) || 0;
    return timeB - timeA;
  });

  return {
    mergedHistory,
    stats: {
      sessionsAdded,
      sessionsExisting,
      sessionsSkipped: sessionsExisting,
    },
  };
}

/**
 * Complete merge function operating on SyncData containers
 */
export function mergeSyncData(
  local: Partial<SyncData> = {},
  remote: Partial<SyncData> = {}
): MergeResult {
  const localRoster = local.roster || local.students || local.diagnostic_student_roster || [];
  const remoteRoster = remote.roster || remote.students || remote.diagnostic_student_roster || [];

  const localHistory = local.history || local.sessions || local.diagnostic_session_history || [];
  const remoteHistory = remote.history || remote.sessions || remote.diagnostic_session_history || [];

  const rosterResult = mergeStudentRosters(localRoster, remoteRoster);
  const historyResult = mergeSessionHistories(localHistory, remoteHistory);

  const mergedData: SyncData = {
    roster: rosterResult.mergedRoster,
    history: historyResult.mergedHistory,
    students: rosterResult.mergedRoster,
    sessions: historyResult.mergedHistory,
    diagnostic_student_roster: rosterResult.mergedRoster,
    diagnostic_session_history: historyResult.mergedHistory,
  };

  if (local.appSettings || remote.appSettings) {
    mergedData.appSettings = {
      ...(local.appSettings || {}),
      ...(remote.appSettings || {}),
    };
  }

  return {
    mergedRoster: rosterResult.mergedRoster,
    mergedHistory: historyResult.mergedHistory,
    mergedData,
    stats: {
      studentsAdded: rosterResult.stats.studentsAdded,
      studentsUpdated: rosterResult.stats.studentsUpdated,
      studentsUnchanged: rosterResult.stats.studentsUnchanged,
      studentsMerged: rosterResult.stats.studentsMerged,
      sessionsAdded: historyResult.stats.sessionsAdded,
      sessionsExisting: historyResult.stats.sessionsExisting,
      sessionsSkipped: historyResult.stats.sessionsExisting,
      conflictsResolved: rosterResult.conflicts.length,
    },
    conflicts: rosterResult.conflicts,
  };
}
