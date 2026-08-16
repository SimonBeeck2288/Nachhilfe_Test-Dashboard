/**
 * src/utils/syncExportImport.ts
 * JSON File Export & Import Utilities for Student Profiles and Session History
 */

import type { StudentProfile } from '../types/student';
import type { TestSessionRecord } from '../types/history';
import type { SyncPayload, MergeResult, ValidationResult, ImportMode, SyncExportOptions } from '../types/sync';
import { SYNC_SCHEMA_VERSION } from '../types/sync';
import { getStudentRoster, clearStudentRoster } from './studentRoster';
import { getSessionHistory, clearSessionHistory } from './sessionHistory';
import { validateSyncPayload, safeJsonParse } from './syncValidation';
import { mergeSyncData } from './syncMerge';

export const APP_VERSION = '1.0.0';

/**
 * Creates a structured SyncPayload from current local storage or custom dataset
 */
export function createExportPayload(
  customData?: {
    roster?: StudentProfile[];
    history?: TestSessionRecord[];
    students?: StudentProfile[];
    sessions?: TestSessionRecord[];
    diagnostic_student_roster?: StudentProfile[];
    diagnostic_session_history?: TestSessionRecord[];
  },
  options?: SyncExportOptions
): SyncPayload {
  const roster: StudentProfile[] =
    customData?.roster ||
    customData?.students ||
    customData?.diagnostic_student_roster ||
    getStudentRoster();

  const history: TestSessionRecord[] =
    customData?.history ||
    customData?.sessions ||
    customData?.diagnostic_session_history ||
    getSessionHistory();

  const appVersion = options?.appVersion || APP_VERSION;
  const sourceDevice = options?.sourceDevice;
  const deviceId = options?.deviceId;

  const payload: SyncPayload = {
    version: SYNC_SCHEMA_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    metadata: {
      schemaVersion: SYNC_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion,
      clientVersion: appVersion,
      sourceDevice,
      deviceId,
      itemCount: {
        students: roster.length,
        sessions: history.length,
      },
    },
    data: {
      roster: [...roster],
      history: [...history],
      students: [...roster],
      sessions: [...history],
      diagnostic_student_roster: [...roster],
      diagnostic_session_history: [...history],
    },
  };

  return payload;
}

/**
 * Serializes payload and triggers a browser file download of nachhilfe-backup-<date>.json
 */
export function downloadBackupFile(
  payload?: SyncPayload,
  filename?: string,
  options?: { pretty?: boolean }
): boolean {
  try {
    const dataToExport = payload || createExportPayload();
    const pretty = options?.pretty ?? true;
    const jsonString = pretty ? JSON.stringify(dataToExport, null, 2) : JSON.stringify(dataToExport);

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const defaultFilename = `nachhilfe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const targetFilename = filename || defaultFilename;

      const url =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(blob)
          : 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);

      const a = document.createElement('a');
      a.href = url;
      a.download = targetFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Fehler beim Herunterladen der Sicherungsdatei:', error);
    return false;
  }
}

/**
 * Asynchronously reads a File or Blob as a UTF-8 text string
 */
export async function readBackupFile(file: File | Blob): Promise<string> {
  if (!file) {
    throw new Error('Keine Datei zum Einlesen übergeben.');
  }

  if (typeof file.text === 'function') {
    return await file.text();
  }

  return new Promise<string>((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader API ist in dieser Umgebung nicht verfügbar.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Sicherungsdatei.'));
    };
    reader.readAsText(file);
  });
}

/**
 * Parses and validates raw JSON string from a backup file
 */
export function parseAndValidateBackupFile(jsonString: string): ValidationResult {
  const parseRes = safeJsonParse(jsonString);
  if (!parseRes.success) {
    return {
      isValid: false,
      valid: false,
      errors: [parseRes.error],
      warnings: [],
    };
  }

  return validateSyncPayload(parseRes.data);
}

/**
 * Applies a validated SyncPayload to local storage using the specified mode
 */
export function applyImportPayload(
  payload: SyncPayload,
  mode: ImportMode = 'merge'
): MergeResult {
  const incomingRoster: StudentProfile[] =
    payload.data?.roster ||
    payload.data?.students ||
    payload.data?.diagnostic_student_roster ||
    [];

  const incomingHistory: TestSessionRecord[] =
    payload.data?.history ||
    payload.data?.sessions ||
    payload.data?.diagnostic_session_history ||
    [];

  if (mode === 'replace') {
    clearStudentRoster();
    clearSessionHistory();

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('diagnostic_student_roster', JSON.stringify(incomingRoster));
        localStorage.setItem('diagnostic_session_history', JSON.stringify(incomingHistory));
      } catch (err) {
        console.error('Fehler beim Speichern der ersetzten Daten in localStorage:', err);
      }
    }

    const mergedData = {
      roster: [...incomingRoster],
      history: [...incomingHistory],
      students: [...incomingRoster],
      sessions: [...incomingHistory],
      diagnostic_student_roster: [...incomingRoster],
      diagnostic_session_history: [...incomingHistory],
    };

    return {
      mergedRoster: [...incomingRoster],
      mergedHistory: [...incomingHistory],
      mergedData,
      stats: {
        studentsAdded: incomingRoster.length,
        studentsUpdated: 0,
        studentsUnchanged: 0,
        studentsMerged: incomingRoster.length,
        sessionsAdded: incomingHistory.length,
        sessionsExisting: 0,
        sessionsSkipped: 0,
        conflictsResolved: 0,
      },
      conflicts: [],
    };
  }

  // mode === 'merge'
  const currentRoster = getStudentRoster();
  const currentHistory = getSessionHistory();

  const mergeResult = mergeSyncData(
    { roster: currentRoster, history: currentHistory },
    { roster: incomingRoster, history: incomingHistory }
  );

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('diagnostic_student_roster', JSON.stringify(mergeResult.mergedRoster));
      localStorage.setItem('diagnostic_session_history', JSON.stringify(mergeResult.mergedHistory));
    } catch (err) {
      console.error('Fehler beim Speichern der zusammengeführten Daten in localStorage:', err);
    }
  }

  return mergeResult;
}

export function importJsonString(jsonString: string, mode: ImportMode = 'merge'): {
  success: boolean;
  message: string;
  mergeResult?: MergeResult;
  error?: string;
} {
  const val = parseAndValidateBackupFile(jsonString);
  if (!val.isValid || !val.payload) {
    return {
      success: false,
      message: val.errors[0] || 'Ungültige Sicherungsdatei.',
      error: val.errors[0],
    };
  }
  const mergeResult = applyImportPayload(val.payload, mode);
  return {
    success: true,
    message: 'Daten erfolgreich importiert.',
    mergeResult,
  };
}

export const applySyncPayloadToStorage = applyImportPayload;
export const exportBackupPayload = createExportPayload;
export const importBackupPayload = applyImportPayload;
export const createSyncPayload = createExportPayload;
export const exportToFile = downloadBackupFile;
export const importFromFile = async (file: File | Blob): Promise<SyncPayload> => {
  const text = await readBackupFile(file);
  const val = parseAndValidateBackupFile(text);
  if (!val.isValid || !val.payload) {
    throw new Error(val.errors.join('; ') || 'Ungültige Sicherungsdatei.');
  }
  return val.payload;
};
export const applyImport = (
  currentData: { roster?: StudentProfile[]; history?: TestSessionRecord[]; students?: StudentProfile[]; sessions?: TestSessionRecord[] },
  importedPayload: SyncPayload,
  mode: ImportMode = 'merge'
): { data: { roster: StudentProfile[]; history: TestSessionRecord[] }; mergeResult: MergeResult } => {
  const incomingRoster = importedPayload.data?.roster || importedPayload.data?.students || [];
  const incomingHistory = importedPayload.data?.history || importedPayload.data?.sessions || [];

  if (mode === 'replace') {
    const res: MergeResult = {
      mergedRoster: incomingRoster,
      mergedHistory: incomingHistory,
      stats: {
        studentsAdded: incomingRoster.length,
        studentsUpdated: 0,
        studentsUnchanged: 0,
        studentsMerged: incomingRoster.length,
        sessionsAdded: incomingHistory.length,
        sessionsExisting: 0,
        conflictsResolved: 0,
      },
      conflicts: [],
    };
    return {
      data: { roster: incomingRoster, history: incomingHistory },
      mergeResult: res,
    };
  }

  const res = mergeSyncData(currentData, { roster: incomingRoster, history: incomingHistory });
  return {
    data: { roster: res.mergedRoster, history: res.mergedHistory },
    mergeResult: res,
  };
};
