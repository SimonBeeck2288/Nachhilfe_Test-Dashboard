import type { StudentProfile, AccessibilitySettings, AccessibilityPreset } from './student';
import type { TestSessionRecord, TopicBreakdownItem, CognitionStatsRecord } from './history';
import type { AnswerRecord } from '../context/TestSessionContext';

export {
  StudentProfile,
  AccessibilitySettings,
  AccessibilityPreset,
  TestSessionRecord,
  TopicBreakdownItem,
  CognitionStatsRecord,
  AnswerRecord,
};

export const SYNC_SCHEMA_VERSION = 1;

export interface SyncMetadata {
  schemaVersion: number;
  exportedAt: string;
  appVersion?: string;
  clientVersion?: string;
  sourceDevice?: string;
  deviceId?: string;
  itemCount: {
    students: number;
    sessions: number;
  };
}

export interface SyncData {
  roster: StudentProfile[];
  history: TestSessionRecord[];
}

export interface SyncPayload {
  version?: number;
  schemaVersion: number;
  metadata: SyncMetadata;
  data: SyncData;
}

export interface ValidationResult {
  isValid: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  payload?: SyncPayload;
  sanitizedPayload?: SyncPayload;
}

export type ConflictResolution = 'local_kept' | 'remote_applied' | 'merged' | 'skipped';

export interface ConflictRecord {
  entityType: 'student' | 'session';
  entityId: string;
  entityName?: string;
  resolution: ConflictResolution;
  fieldDifferences?: string[];
  reason?: string;
}

export interface StudentMergeResult {
  totalIncoming: number;
  added: number;
  updated: number;
  unchanged: number;
  conflicts: ConflictRecord[];
  mergedRoster: StudentProfile[];
}

export interface HistoryMergeResult {
  totalIncoming: number;
  added: number;
  updated: number;
  unchanged: number;
  conflicts: ConflictRecord[];
  mergedHistory: TestSessionRecord[];
}

export interface MergeResult {
  success: boolean;
  strategy: string;
  students: StudentMergeResult;
  history: HistoryMergeResult;
  stats: {
    studentsAdded: number;
    studentsUpdated: number;
    studentsUnchanged: number;
    sessionsAdded: number;
    sessionsUpdated: number;
    sessionsUnchanged: number;
  };
  mergedData: SyncData;
}

export type ImportMode = 'merge' | 'replace';

export interface SyncExportOptions {
  appVersion?: string;
  sourceDevice?: string;
  deviceId?: string;
}

export interface GistSyncConfig {
  token: string;
  gistId: string;
  autoSync?: boolean;
  lastSyncAt?: string;
  gistUrl?: string;
  username?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  studentsImported?: number;
  studentsUpdated?: number;
  sessionsImported?: number;
  sessionsUpdated?: number;
  gistId?: string;
  gistUrl?: string;
  error?: string;
}
