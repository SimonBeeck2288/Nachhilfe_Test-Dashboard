/**
 * src/utils/gistSync.ts
 * Higher-level Sync Coordinator for GitHub Gist Synchronization
 */

import { validatePat, createGist, getGist, updateGist, sanitizeToken } from './gistClient';
import { createExportPayload, importJsonString } from './syncExportImport';
import type { ImportMode, MergeResult } from '../types/sync';

export const GIST_CONFIG_STORAGE_KEY = 'diagnostic_gist_config';
export const GIST_BACKUP_FILENAME = 'nachhilfe_sync_data.json';

export interface GistConfig {
  pat: string;
  gistId: string;
  autoSyncOnTestComplete?: boolean;
  lastSyncedAt?: string;
  username?: string;
  gistUrl?: string;
}

export function getGistConfig(): GistConfig | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(GIST_CONFIG_STORAGE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.pat === 'string') {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to read Gist config from storage:', error);
  }
  return null;
}

export function saveGistConfig(config: GistConfig): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(GIST_CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (error) {
    console.error('Failed to save Gist config to storage:', error);
  }
}

export function clearGistConfig(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(GIST_CONFIG_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear Gist config from storage:', error);
  }
}

export async function testGistConnection(
  pat: string,
  gistId?: string
): Promise<{ success: boolean; username?: string; gistId?: string; message: string }> {
  const token = sanitizeToken(pat);
  const valResult = await validatePat(token);
  if (!valResult.valid) {
    return {
      success: false,
      message: valResult.error || 'Ungültiger GitHub Personal Access Token.',
    };
  }

  if (gistId && gistId.trim()) {
    try {
      const gist = await getGist(token, gistId.trim());
      return {
        success: true,
        username: valResult.username,
        gistId: gist.id,
        message: `Erfolgreich mit GitHub und Gist (${gist.id}) verbunden!`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        username: valResult.username,
        message: `GitHub Token gültig, aber Gist nicht gefunden: ${msg}`,
      };
    }
  }

  return {
    success: true,
    username: valResult.username,
    message: `Verbindung zu GitHub erfolgreich (${valResult.username})!`,
  };
}

export async function pushToGist(
  configOverride?: Partial<GistConfig>
): Promise<{ success: boolean; gistId?: string; gistUrl?: string; message: string; error?: string }> {
  const activeConfig = {
    ...getGistConfig(),
    ...configOverride,
  };

  const pat = sanitizeToken(activeConfig.pat);
  if (!pat) {
    return {
      success: false,
      message: 'Kein GitHub Personal Access Token (PAT) konfiguriert.',
      error: 'NO_PAT',
    };
  }

  const payload = createExportPayload();
  const content = JSON.stringify(payload, null, 2);

  try {
    if (activeConfig.gistId && activeConfig.gistId.trim()) {
      const res = await updateGist(pat, activeConfig.gistId.trim(), GIST_BACKUP_FILENAME, content);
      const updatedConfig: GistConfig = {
        pat,
        gistId: res.id,
        autoSyncOnTestComplete: activeConfig.autoSyncOnTestComplete,
        lastSyncedAt: new Date().toISOString(),
        gistUrl: res.htmlUrl,
        username: activeConfig.username,
      };
      saveGistConfig(updatedConfig);
      return {
        success: true,
        gistId: res.id,
        gistUrl: res.htmlUrl,
        message: 'Daten erfolgreich auf GitHub Gist aktualisiert.',
      };
    } else {
      const res = await createGist(pat, GIST_BACKUP_FILENAME, content, 'NachhilfeTest Sync Backup', false);
      const updatedConfig: GistConfig = {
        pat,
        gistId: res.id,
        autoSyncOnTestComplete: activeConfig.autoSyncOnTestComplete,
        lastSyncedAt: new Date().toISOString(),
        gistUrl: res.htmlUrl,
        username: activeConfig.username,
      };
      saveGistConfig(updatedConfig);
      return {
        success: true,
        gistId: res.id,
        gistUrl: res.htmlUrl,
        message: 'Neuer privater Gist erfolgreich erstellt und synchronisiert.',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let userMsg = errorMsg;
    if (errorMsg.includes('401')) {
      userMsg = 'Fehler 401: Ungültiger oder abgelaufener GitHub Token.';
    } else if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('rate')) {
      userMsg = 'Fehler 403: API Rate Limit überschritten.';
    } else if (errorMsg.includes('404')) {
      userMsg = 'Fehler 404: Gist nicht gefunden oder gelöscht.';
    } else if (errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('network')) {
      userMsg = 'Netzwerkfehler beim Verbinden mit GitHub.';
    }
    return {
      success: false,
      message: userMsg,
      error: errorMsg,
    };
  }
}

export async function pullFromGist(
  configOverride?: Partial<GistConfig>,
  mode: ImportMode = 'merge'
): Promise<{ success: boolean; stats?: MergeResult['stats']; message: string; error?: string }> {
  const activeConfig = {
    ...getGistConfig(),
    ...configOverride,
  };

  const pat = sanitizeToken(activeConfig.pat);
  const gistId = activeConfig.gistId?.trim();

  if (!pat) {
    return {
      success: false,
      message: 'Kein GitHub Personal Access Token (PAT) konfiguriert.',
      error: 'NO_PAT',
    };
  }

  if (!gistId) {
    return {
      success: false,
      message: 'Keine Gist-ID konfiguriert.',
      error: 'NO_GIST_ID',
    };
  }

  try {
    const gist = await getGist(pat, gistId);
    const fileObj = gist.files?.[GIST_BACKUP_FILENAME];
    if (!fileObj || !fileObj.content) {
      return {
        success: false,
        message: `Die Gist enthält keine gültige Backup-Datei (${GIST_BACKUP_FILENAME}).`,
        error: 'BACKUP_FILE_NOT_FOUND',
      };
    }

    const importResult = importJsonString(fileObj.content, mode);
    if (!importResult.success) {
      return {
        success: false,
        message: importResult.message || 'Import der Gist-Daten fehlgeschlagen.',
        error: importResult.error,
      };
    }

    const updatedConfig: GistConfig = {
      pat,
      gistId: gist.id,
      autoSyncOnTestComplete: activeConfig.autoSyncOnTestComplete,
      lastSyncedAt: new Date().toISOString(),
      gistUrl: gist.htmlUrl,
      username: activeConfig.username,
    };
    saveGistConfig(updatedConfig);

    return {
      success: true,
      stats: importResult.mergeResult?.stats,
      message: 'Daten erfolgreich aus GitHub Gist geladen und synchronisiert.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let userMsg = errorMsg;
    if (errorMsg.includes('401')) {
      userMsg = 'Fehler 401: Ungültiger oder abgelaufener GitHub Token.';
    } else if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('rate')) {
      userMsg = 'Fehler 403: API Rate Limit überschritten.';
    } else if (errorMsg.includes('404')) {
      userMsg = 'Fehler 404: Gist nicht gefunden oder gelöscht.';
    } else if (errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('network')) {
      userMsg = 'Netzwerkfehler beim Verbinden mit GitHub.';
    }
    return {
      success: false,
      message: userMsg,
      error: errorMsg,
    };
  }
}
