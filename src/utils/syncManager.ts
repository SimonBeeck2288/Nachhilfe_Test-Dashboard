/**
 * src/utils/syncManager.ts
 * Unified sync management facade providing backward-compatible and standard APIs
 */

import {
  createExportPayload,
  downloadBackupFile,
  parseAndValidateBackupFile,
  applySyncPayloadToStorage,
  importJsonString,
} from './syncExportImport';
import {
  getGistConfig,
  saveGistConfig,
  clearGistConfig,
  testGistConnection,
  pushToGist,
  pullFromGist,
} from './gistSync';
import { validateSyncPayload } from './syncValidation';
import type {
  SyncPayload,
  GistSyncConfig,
  SyncResult,
  ImportMode,
} from '../types/sync';

export {
  createExportPayload,
  downloadBackupFile,
  validateSyncPayload,
  getGistConfig,
  saveGistConfig,
  clearGistConfig,
  testGistConnection,
  pushToGist,
  pullFromGist,
};

export const exportSyncPayload = (): SyncPayload => {
  return createExportPayload();
};

export const downloadSyncFile = (customFilename?: string): string => {
  const payload = createExportPayload();
  const json = JSON.stringify(payload, null, 2);
  downloadBackupFile(customFilename);
  return json;
};

export const getGistSyncConfig = (): GistSyncConfig | null => {
  const config = getGistConfig();
  if (!config) return null;
  return {
    token: config.pat,
    gistId: config.gistId,
    autoSync: config.autoSyncOnTestComplete,
    lastSyncAt: config.lastSyncedAt,
    gistUrl: config.gistUrl,
    username: config.username,
  };
};

export const saveGistSyncConfig = (config: GistSyncConfig): void => {
  saveGistConfig({
    pat: config.token,
    gistId: config.gistId,
    autoSyncOnTestComplete: config.autoSync,
    lastSyncedAt: config.lastSyncAt,
    gistUrl: config.gistUrl,
    username: config.username,
  });
};

export const clearGistSyncConfig = (): void => {
  clearGistConfig();
};

export const importSyncPayload = (
  rawOrParsed: string | unknown,
  mode: ImportMode = 'merge'
): SyncResult => {
  if (typeof rawOrParsed === 'string') {
    const res = importJsonString(rawOrParsed, mode);
    return {
      success: res.success,
      message: res.message,
      studentsImported: res.mergeResult?.stats?.studentsAdded,
      studentsUpdated: res.mergeResult?.stats?.studentsUpdated,
      sessionsImported: res.mergeResult?.stats?.sessionsAdded,
      sessionsUpdated: res.mergeResult?.stats?.sessionsUpdated,
      error: res.error,
    };
  }

  const validation = parseAndValidateBackupFile(JSON.stringify(rawOrParsed));
  if (!validation.isValid || !validation.payload) {
    return {
      success: false,
      message: validation.errors[0] || 'Ungültiges Backup-Schema.',
      error: 'SCHEMA_VALIDATION_ERROR',
    };
  }

  const mergeRes = applySyncPayloadToStorage(validation.payload, mode);
  return {
    success: true,
    message: 'Import erfolgreich abgeschlossen.',
    studentsImported: mergeRes.stats.studentsAdded,
    studentsUpdated: mergeRes.stats.studentsUpdated,
    sessionsImported: mergeRes.stats.sessionsAdded,
    sessionsUpdated: mergeRes.stats.sessionsUpdated,
  };
};

export const pushToGitHubGist = async (
  token: string,
  existingGistId?: string
): Promise<SyncResult> => {
  const res = await pushToGist({ pat: token, gistId: existingGistId });
  return {
    success: res.success,
    message: res.message,
    gistId: res.gistId,
    gistUrl: res.gistUrl,
    error: res.error,
  };
};

export const pullFromGitHubGist = async (
  token: string,
  gistId: string,
  mode: ImportMode = 'merge'
): Promise<SyncResult> => {
  const res = await pullFromGist({ pat: token, gistId }, mode);
  return {
    success: res.success,
    message: res.message,
    studentsImported: res.stats?.studentsAdded,
    studentsUpdated: res.stats?.studentsUpdated,
    sessionsImported: res.stats?.sessionsAdded,
    sessionsUpdated: res.stats?.sessionsUpdated,
    error: res.error,
  };
};

export const syncBidirectionalWithGist = async (
  token: string,
  gistId?: string
): Promise<SyncResult> => {
  if (gistId && gistId.trim()) {
    const pullRes = await pullFromGist({ pat: token, gistId }, 'merge');
    if (!pullRes.success) {
      return {
        success: false,
        message: pullRes.message,
        error: pullRes.error,
      };
    }
  }

  const pushRes = await pushToGist({ pat: token, gistId });
  return {
    success: pushRes.success,
    message: pushRes.message,
    gistId: pushRes.gistId,
    gistUrl: pushRes.gistUrl,
    error: pushRes.error,
  };
};
