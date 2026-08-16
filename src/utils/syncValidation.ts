/**
 * src/utils/syncValidation.ts
 * Pure TypeScript Runtime Validator & Sanitizer for Multi-Device Sync
 * Zero External Runtime Dependencies — Prototype Pollution & DoS Defenses
 */

import type {
  SyncPayload,
  SyncMetadata,
  SyncData,
  ValidationResult,
  StudentProfile,
  TestSessionRecord,
  TopicBreakdownItem,
  CognitionStatsRecord,
  AnswerRecord,
  AccessibilitySettings,
  AccessibilityPreset,
} from '../types/sync';
import { SYNC_SCHEMA_VERSION } from '../types/sync';

// Maximum payload string size allowed for parsing (15 MB)
export const MAX_PAYLOAD_STRING_BYTES = 15 * 1024 * 1024;
// Maximum allowed recursion depth when inspecting nested objects
export const MAX_RECURSION_DEPTH = 32;
// Maximum array bounds for DoS prevention
export const MAX_ROSTER_ITEMS = 10000;
export const MAX_HISTORY_ITEMS = 25000;
export const MAX_ANSWERS_PER_SESSION = 1000;

// Security: Forbidden property names that could cause prototype pollution
const FORBIDDEN_PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Type guard checking if value is a non-null plain record/object
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for finite numbers
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Strict calendar-accurate ISO 8601 validation
 * Verifies both formatting syntax and real-world calendar validity (e.g. rejecting Feb 30)
 */
export function isValidIsoDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Strict ISO 8601 regex: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ / offset
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|([+-])(\d{2}):?(\d{2}))?)?$/i;
  const match = trimmed.match(isoRegex);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Reasonable year bounds
  if (year < 1970 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Calendar day count check (handles leap years)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonths[month - 1]) return false;

  if (match[4] !== undefined) {
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);
    if (hours < 0 || hours > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    if (seconds < 0 || seconds > 59) return false;
  }

  const parsed = Date.parse(trimmed);
  return !Number.isNaN(parsed);
}

/**
 * Type guard for union/enum values
 */
export function isValidEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/**
 * Safe JSON parser with size guard and prototype-pollution stripping reviver
 */
export function safeJsonParse(jsonString: string): { success: true; data: unknown } | { success: false; error: string } {
  if (typeof jsonString !== 'string') {
    return { success: false, error: 'Ungültiger JSON-Eingabewert: Erwartet wurde ein String.' };
  }

  if (!jsonString.trim()) {
    return { success: false, error: 'Die angegebene JSON-Datei ist leer.' };
  }

  // Pre-parse byte length check (approximate UTF-8 byte count via length or Blob)
  const estimatedBytes = jsonString.length * 2;
  if (estimatedBytes > MAX_PAYLOAD_STRING_BYTES && new Blob([jsonString]).size > MAX_PAYLOAD_STRING_BYTES) {
    return { success: false, error: `Die Datei überschreitet die maximale Dateigröße von 15 MB.` };
  }

  try {
    const data = JSON.parse(jsonString, (key, val) => {
      if (FORBIDDEN_PROTOTYPE_KEYS.has(key)) {
        return undefined; // Strip forbidden prototype keys
      }
      return val;
    });
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Syntaxfehler beim Parsen';
    return { success: false, error: `Ungültiges JSON-Format: ${msg}` };
  }
}

/**
 * In-memory recursive scanner for prototype pollution attempts and excessive nesting depth
 */
export function scanForPrototypePollution(raw: unknown, path = '$', depth = 0): string[] {
  const violations: string[] = [];

  if (depth > MAX_RECURSION_DEPTH) {
    violations.push(`Maximale Objektschachtelungstiefe (${MAX_RECURSION_DEPTH}) an Pfad "${path}" überschritten.`);
    return violations;
  }

  if (raw === null || typeof raw !== 'object') {
    return violations;
  }

  // Check object prototype
  const proto = Object.getPrototypeOf(raw);
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    violations.push(`Sicherheitsverletzung: Verbotener Prototyp an Pfad "${path}" erkannt.`);
  }

  // Inspect all own property names without triggering custom getters or poisoned hasOwnProperty
  const propNames = Object.getOwnPropertyNames(raw);
  for (const key of propNames) {
    if (FORBIDDEN_PROTOTYPE_KEYS.has(key)) {
      violations.push(`Sicherheitsverletzung: Verbotene Eigenschaft "${key}" an Pfad "${path}.${key}" erkannt.`);
      continue;
    }

    try {
      const child = (raw as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        const childViolations = scanForPrototypePollution(child, `${path}.${key}`, depth + 1);
        violations.push(...childViolations);
      }
    } catch {
      violations.push(`Fehler beim Zugriff auf Eigenschaft "${path}.${key}".`);
    }
  }

  return violations;
}

/**
 * Validates and sanitizes AccessibilitySettings
 */
export function validateAccessibilitySettings(
  raw: unknown,
  path: string
): { valid: boolean; errors: string[]; warnings: string[]; settings: AccessibilitySettings } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(raw)) {
    return {
      valid: true,
      errors: [],
      warnings: [`${path}: Ungültige Barrierefreiheits-Einstellungen; Standardwerte verwendet.`],
      settings: { preset: 'standard', directQuestions: false, reducedSensory: false },
    };
  }

  let preset: AccessibilityPreset = 'standard';
  if (isValidEnum(raw.preset, ['standard', 'direct_reduced_sensory', 'custom'] as const)) {
    preset = raw.preset;
  } else if (raw.preset !== undefined) {
    warnings.push(`${path}.preset: Unbekanntes Preset "${String(raw.preset)}"; Standardwert verwendet.`);
  }

  const directQuestions = typeof raw.directQuestions === 'boolean' ? raw.directQuestions : Boolean(raw.directQuestions);
  const reducedSensory = typeof raw.reducedSensory === 'boolean' ? raw.reducedSensory : Boolean(raw.reducedSensory);

  return {
    valid: true,
    errors,
    warnings,
    settings: {
      preset,
      directQuestions,
      reducedSensory,
    },
  };
}

/**
 * Validates metadata section of payload
 */
export function validateMetadata(
  raw: unknown,
  path = 'metadata'
): { valid: boolean; errors: string[]; warnings: string[]; metadata?: SyncMetadata } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(raw)) {
    return {
      valid: false,
      errors: [`${path}: Erforderliches Metadaten-Objekt fehlt oder ist ungültig.`],
      warnings,
    };
  }

  // Schema version validation
  let schemaVersion = 1;
  if ('schemaVersion' in raw) {
    const rawVersion = raw.schemaVersion;
    if (typeof rawVersion === 'number') {
      if (rawVersion < 1) {
        errors.push(`${path}.schemaVersion: Ungültige Schema-Version ${rawVersion}. Version muss mindestens 1 sein.`);
      } else if (rawVersion > SYNC_SCHEMA_VERSION) {
        errors.push(`${path}.schemaVersion: Nicht unterstützte Schema-Version ${rawVersion}. Maximal unterstützte Version ist ${SYNC_SCHEMA_VERSION}.`);
      } else {
        schemaVersion = rawVersion;
      }
    } else if (typeof rawVersion === 'string' && /^\d+$/.test(rawVersion.trim())) {
      const parsedVer = parseInt(rawVersion.trim(), 10);
      if (parsedVer === 1) {
        schemaVersion = parsedVer;
        warnings.push(`${path}.schemaVersion wurde von String zu Zahl 1 konvertiert.`);
      } else {
        errors.push(`${path}.schemaVersion: Nicht unterstützte Version "${rawVersion}".`);
      }
    } else {
      errors.push(`${path}.schemaVersion: Erwartet wurde eine numerische Schema-Version.`);
    }
  } else {
    warnings.push(`${path}.schemaVersion fehlt; Standardwert 1 angenommen.`);
  }

  // exportedAt validation
  let exportedAt = new Date().toISOString();
  if ('exportedAt' in raw && typeof raw.exportedAt === 'string') {
    if (!isValidIsoDateString(raw.exportedAt)) {
      errors.push(`${path}.exportedAt: Ungültiger ISO-8601-Zeitstempel ("${raw.exportedAt}").`);
    } else {
      exportedAt = raw.exportedAt.trim();
    }
  } else if ('exportedAt' in raw && typeof raw.exportedAt === 'number') {
    if (Number.isFinite(raw.exportedAt) && raw.exportedAt > 0) {
      exportedAt = new Date(raw.exportedAt).toISOString();
      warnings.push(`${path}.exportedAt wurde aus Unix-Timestamp konvertiert.`);
    } else {
      errors.push(`${path}.exportedAt: Ungültiger Timestamp.`);
    }
  } else {
    warnings.push(`${path}.exportedAt fehlt; aktueller Zeitstempel wird gesetzt.`);
  }

  // Optional string metadata fields
  const appVersion = typeof raw.appVersion === 'string' ? raw.appVersion.slice(0, 64) : typeof raw.clientVersion === 'string' ? raw.clientVersion.slice(0, 64) : '1.0.0';
  const clientVersion = appVersion;
  const sourceDevice = typeof raw.sourceDevice === 'string' ? raw.sourceDevice.slice(0, 128) : typeof raw.deviceId === 'string' ? raw.deviceId.slice(0, 128) : undefined;
  const deviceId = sourceDevice;

  let itemCount: { students: number; sessions: number; quizResults?: number } | undefined;
  if (isRecord(raw.itemCount)) {
    itemCount = {
      students: typeof raw.itemCount.students === 'number' ? Math.max(0, Math.floor(raw.itemCount.students)) : 0,
      sessions: typeof raw.itemCount.sessions === 'number' ? Math.max(0, Math.floor(raw.itemCount.sessions)) : 0,
      quizResults: typeof raw.itemCount.quizResults === 'number' ? Math.max(0, Math.floor(raw.itemCount.quizResults)) : undefined,
    };
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const metadata: SyncMetadata = {
    schemaVersion,
    exportedAt,
    appVersion,
    clientVersion,
    sourceDevice,
    deviceId,
    itemCount,
  };

  return { valid: true, errors: [], warnings, metadata };
}

/**
 * Validates a single StudentProfile
 */
export function validateStudentProfile(
  raw: unknown,
  index: number,
  path = `data.roster[${index}]`
): { valid: boolean; errors: string[]; warnings: string[]; student?: StudentProfile } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(raw)) {
    return {
      valid: false,
      errors: [`${path}: Schülerprofil muss ein Objekt sein, erhalten wurde ${raw === null ? 'null' : typeof raw}.`],
      warnings,
    };
  }

  // id: required non-empty string
  if (!isNonEmptyString(raw.id)) {
    errors.push(`${path}.id: Erforderliches Identifikationsfeld (id) fehlt oder ist leer.`);
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';

  // name: required non-empty string
  if (!isNonEmptyString(raw.name)) {
    errors.push(`${path}.name: Erforderlicher Schülername fehlt oder ist leer.`);
  }
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 256) : '';

  // gradeLevel: number or non-empty string
  let gradeLevel: number | string = 5;
  if (typeof raw.gradeLevel === 'number' && Number.isFinite(raw.gradeLevel)) {
    gradeLevel = raw.gradeLevel;
  } else if (typeof raw.gradeLevel === 'string' && raw.gradeLevel.trim()) {
    gradeLevel = raw.gradeLevel.trim();
  } else if (raw.gradeLevel !== undefined) {
    errors.push(`${path}.gradeLevel: Ungültige Klassenstufe (erwartet Zahl oder String).`);
  }

  // scalar strings with safe defaults
  const favoriteSubject = typeof raw.favoriteSubject === 'string' ? raw.favoriteSubject.slice(0, 128) : '';
  const problemSubject = typeof raw.problemSubject === 'string' ? raw.problemSubject.slice(0, 128) : '';
  const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 65536) : '';
  const customNotes = typeof raw.customNotes === 'string' ? raw.customNotes.slice(0, 65536) : undefined;

  // array fields: hobbies and learningPreferences (deduplicate and filter strings)
  let hobbies: string[] = [];
  if (Array.isArray(raw.hobbies)) {
    hobbies = raw.hobbies
      .filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
      .map((h) => h.trim().slice(0, 128));
  }

  let learningPreferences: string[] = [];
  if (Array.isArray(raw.learningPreferences)) {
    learningPreferences = raw.learningPreferences
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .map((p) => p.trim().slice(0, 128));
  }

  // accessibilitySettings
  let accessibilitySettings: AccessibilitySettings | undefined;
  if (raw.accessibilitySettings) {
    const accResult = validateAccessibilitySettings(raw.accessibilitySettings, `${path}.accessibilitySettings`);
    warnings.push(...accResult.warnings);
    accessibilitySettings = accResult.settings;
  }

  // timestamps: createdAt and updatedAt
  let createdAt = new Date().toISOString();
  if ('createdAt' in raw) {
    if (typeof raw.createdAt === 'string' && isValidIsoDateString(raw.createdAt)) {
      createdAt = raw.createdAt.trim();
    } else {
      errors.push(`${path}.createdAt: Ungültiger ISO-8601-Zeitstempel ("${String(raw.createdAt)}").`);
    }
  }

  let updatedAt = new Date().toISOString();
  if ('updatedAt' in raw) {
    if (typeof raw.updatedAt === 'string' && isValidIsoDateString(raw.updatedAt)) {
      updatedAt = raw.updatedAt.trim();
    } else {
      errors.push(`${path}.updatedAt: Ungültiger ISO-8601-Zeitstempel ("${String(raw.updatedAt)}").`);
    }
  } else {
    // If updatedAt is absent, default to createdAt
    updatedAt = createdAt;
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const student: StudentProfile = {
    id,
    name,
    gradeLevel,
    favoriteSubject,
    problemSubject,
    notes,
    hobbies,
    learningPreferences,
    customNotes,
    accessibilitySettings,
    createdAt,
    updatedAt,
  };

  return { valid: true, errors: [], warnings, student };
}

/**
 * Validates a single TopicBreakdownItem
 */
export function validateTopicBreakdownItem(
  raw: unknown,
  path: string
): { valid: boolean; errors: string[]; item?: TopicBreakdownItem } {
  if (!isRecord(raw)) {
    return { valid: false, errors: [`${path}: Erwartet wurde ein TopicBreakdown-Objekt.`] };
  }

  const topic = typeof raw.topic === 'string' ? raw.topic.trim() : '';
  const correct = typeof raw.correct === 'number' && Number.isFinite(raw.correct) && raw.correct >= 0 ? raw.correct : 0;
  const total = typeof raw.total === 'number' && Number.isFinite(raw.total) && raw.total >= 0 ? raw.total : 0;
  const accuracy = typeof raw.accuracy === 'number' && Number.isFinite(raw.accuracy) ? Math.min(1, Math.max(0, raw.accuracy)) : total > 0 ? correct / total : 0;
  const avgTime = typeof raw.avgTime === 'number' && Number.isFinite(raw.avgTime) && raw.avgTime >= 0 ? raw.avgTime : 0;

  if (!topic) {
    return { valid: false, errors: [`${path}.topic: Thema darf nicht leer sein.`] };
  }

  return {
    valid: true,
    errors: [],
    item: { topic, correct, total, accuracy, avgTime },
  };
}

/**
 * Validates AnswerRecord
 */
export function validateAnswerRecord(
  raw: unknown,
  index: number,
  path = `answers[${index}]`
): { valid: boolean; errors: string[]; answer?: AnswerRecord } {
  if (!isRecord(raw)) {
    return { valid: false, errors: [`${path}: Antwort-Eintrag muss ein Objekt sein.`] };
  }

  const questionId = typeof raw.questionId === 'string' ? raw.questionId.trim() : '';
  const topic = typeof raw.topic === 'string' ? raw.topic.trim() : '';
  const subject = isValidEnum(raw.subject, ['math', 'english', 'cognition', 'warmup'] as const) ? raw.subject : 'math';
  const isCorrect = typeof raw.isCorrect === 'boolean' ? raw.isCorrect : Boolean(raw.isCorrect);
  const timeTaken = typeof raw.timeTaken === 'number' && Number.isFinite(raw.timeTaken) && raw.timeTaken >= 0 ? raw.timeTaken : 0;
  const usedExtraTime = typeof raw.usedExtraTime === 'boolean' ? raw.usedExtraTime : Boolean(raw.usedExtraTime);

  if (!questionId) {
    return { valid: false, errors: [`${path}.questionId: Erforderliche Frage-ID fehlt.`] };
  }

  const answer: AnswerRecord = {
    questionId,
    topic,
    subject,
    isCorrect,
    timeTaken,
    usedExtraTime,
  };

  if (typeof raw.pointsEarned === 'number' && Number.isFinite(raw.pointsEarned)) answer.pointsEarned = raw.pointsEarned;
  if (typeof raw.difficultyLevel === 'number' && Number.isFinite(raw.difficultyLevel)) answer.difficultyLevel = raw.difficultyLevel;
  if (typeof raw.reactionTime === 'number' && Number.isFinite(raw.reactionTime)) answer.reactionTime = raw.reactionTime;
  if (typeof raw.questionText === 'string') answer.questionText = raw.questionText.slice(0, 2048);
  if (typeof raw.userAnswer === 'string') answer.userAnswer = raw.userAnswer.slice(0, 1024);
  if (typeof raw.correctAnswer === 'string' || Array.isArray(raw.correctAnswer)) answer.correctAnswer = raw.correctAnswer as string | string[];

  return { valid: true, errors: [], answer };
}

/**
 * Validates a single TestSessionRecord
 */
export function validateTestSessionRecord(
  raw: unknown,
  index: number,
  path = `data.history[${index}]`
): { valid: boolean; errors: string[]; warnings: string[]; session?: TestSessionRecord } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(raw)) {
    return {
      valid: false,
      errors: [`${path}: Testergebnis-Eintrag muss ein Objekt sein, erhalten wurde ${raw === null ? 'null' : typeof raw}.`],
      warnings,
    };
  }

  // sessionId: required non-empty string
  if (!isNonEmptyString(raw.sessionId)) {
    errors.push(`${path}.sessionId: Erforderliche Test-ID fehlt oder ist leer.`);
  }
  const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId.trim() : '';

  // studentId: required non-empty string
  if (!isNonEmptyString(raw.studentId)) {
    errors.push(`${path}.studentId: Erforderliche Schüler-ID fehlt oder ist leer.`);
  }
  const studentId = typeof raw.studentId === 'string' ? raw.studentId.trim() : '';

  const studentName = typeof raw.studentName === 'string' ? raw.studentName.trim().slice(0, 256) : '';

  // date: valid ISO 8601 string
  let date = new Date().toISOString();
  if ('date' in raw) {
    if (typeof raw.date === 'string' && isValidIsoDateString(raw.date)) {
      date = raw.date.trim();
    } else if (typeof raw.date === 'number' && Number.isFinite(raw.date) && raw.date > 0) {
      date = new Date(raw.date).toISOString();
      warnings.push(`${path}.date wurde aus Timestamp-Zahl konvertiert.`);
    } else {
      errors.push(`${path}.date: Ungültiger ISO-8601-Zeitstempel ("${String(raw.date)}").`);
    }
  } else {
    errors.push(`${path}.date: Erforderliches Testdatum fehlt.`);
  }

  const subject = typeof raw.subject === 'string' && raw.subject.trim() ? raw.subject.trim() : 'all';
  const mathLevelReached = typeof raw.mathLevelReached === 'number' && Number.isFinite(raw.mathLevelReached) ? raw.mathLevelReached : 0;
  const englishLevelReached = typeof raw.englishLevelReached === 'number' && Number.isFinite(raw.englishLevelReached) ? raw.englishLevelReached : 0;
  const score = typeof raw.score === 'number' && Number.isFinite(raw.score) ? Math.max(0, raw.score) : 0;
  const totalQuestions = typeof raw.totalQuestions === 'number' && Number.isFinite(raw.totalQuestions) ? Math.max(0, raw.totalQuestions) : 0;

  // topicBreakdown: Record or Array
  let topicBreakdown: Record<string, TopicBreakdownItem> | TopicBreakdownItem[] = {};
  if (Array.isArray(raw.topicBreakdown)) {
    const items: TopicBreakdownItem[] = [];
    raw.topicBreakdown.forEach((item, itemIdx) => {
      const res = validateTopicBreakdownItem(item, `${path}.topicBreakdown[${itemIdx}]`);
      if (res.valid && res.item) items.push(res.item);
      else errors.push(...res.errors);
    });
    topicBreakdown = items;
  } else if (isRecord(raw.topicBreakdown)) {
    const map: Record<string, TopicBreakdownItem> = {};
    for (const [k, v] of Object.entries(raw.topicBreakdown)) {
      const res = validateTopicBreakdownItem(v, `${path}.topicBreakdown.${k}`);
      if (res.valid && res.item) map[k] = res.item;
      else errors.push(...res.errors);
    }
    topicBreakdown = map;
  }

  // cognitionStats
  let cognitionStats: CognitionStatsRecord | null | undefined = undefined;
  if (isRecord(raw.cognitionStats)) {
    const rawAcc = typeof raw.cognitionStats.accuracy === 'number' && Number.isFinite(raw.cognitionStats.accuracy) ? raw.cognitionStats.accuracy : 0;
    cognitionStats = {
      correct: typeof raw.cognitionStats.correct === 'number' && Number.isFinite(raw.cognitionStats.correct) ? Math.max(0, raw.cognitionStats.correct) : 0,
      total: typeof raw.cognitionStats.total === 'number' && Number.isFinite(raw.cognitionStats.total) ? Math.max(0, raw.cognitionStats.total) : 0,
      accuracy: Math.max(0, Math.min(1, rawAcc)),
      avgReactionTime: typeof raw.cognitionStats.avgReactionTime === 'number' && Number.isFinite(raw.cognitionStats.avgReactionTime) ? Math.max(0, raw.cognitionStats.avgReactionTime) : 0,
    };
  } else if (raw.cognitionStats === null) {
    cognitionStats = null;
  }

  // answers: Array of AnswerRecord
  const answers: AnswerRecord[] = [];
  if (Array.isArray(raw.answers)) {
    if (raw.answers.length > MAX_ANSWERS_PER_SESSION) {
      warnings.push(`${path}.answers: Überschreitet maximales Limit (${MAX_ANSWERS_PER_SESSION}); Einträge werden gekürzt.`);
    }
    const sliced = raw.answers.slice(0, MAX_ANSWERS_PER_SESSION);
    sliced.forEach((ans, ansIdx) => {
      const ansRes = validateAnswerRecord(ans, ansIdx, `${path}.answers[${ansIdx}]`);
      if (ansRes.valid && ansRes.answer) {
        answers.push(ansRes.answer);
      } else {
        errors.push(...ansRes.errors);
      }
    });
  } else if (raw.answers !== undefined) {
    errors.push(`${path}.answers: Erwartet wurde ein Array von Antwort-Einträgen.`);
  }

  // Qualitative fields
  const motivation = typeof raw.motivation === 'number' && Number.isFinite(raw.motivation) ? raw.motivation : undefined;
  const favoriteSubject = typeof raw.favoriteSubject === 'string' ? raw.favoriteSubject.slice(0, 128) : undefined;
  const problemSubject = typeof raw.problemSubject === 'string' ? raw.problemSubject.slice(0, 128) : undefined;
  const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 65536) : undefined;
  const interpretation = typeof raw.interpretation === 'string' ? raw.interpretation.slice(0, 65536) : undefined;
  const durationSeconds = typeof raw.durationSeconds === 'number' && Number.isFinite(raw.durationSeconds) ? raw.durationSeconds : undefined;
  const markedQuestionIds = Array.isArray(raw.markedQuestionIds) ? raw.markedQuestionIds.filter((id): id is string => typeof id === 'string') : undefined;

  let accessibilitySettings: AccessibilitySettings | undefined;
  if (raw.accessibilitySettings) {
    const accResult = validateAccessibilitySettings(raw.accessibilitySettings, `${path}.accessibilitySettings`);
    warnings.push(...accResult.warnings);
    accessibilitySettings = accResult.settings;
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const session: TestSessionRecord = {
    sessionId,
    studentId,
    studentName,
    date,
    subject,
    mathLevelReached,
    englishLevelReached,
    score,
    totalQuestions,
    topicBreakdown,
    cognitionStats,
    answers,
    motivation,
    favoriteSubject,
    problemSubject,
    notes,
    interpretation,
    durationSeconds,
    markedQuestionIds,
    accessibilitySettings,
  };

  return { valid: true, errors: [], warnings, session };
}

/**
 * Primary validator and sanitizer entry point.
 * Accepts raw parsed JSON or in-memory sync payload object.
 */
export function validateSyncPayload(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      valid: false,
      errors: ['Der Payload-Stamm muss ein gültiges JSON-Objekt sein.'],
      warnings: [],
    };
  }

  // Layer 2: Deep prototype pollution and nesting depth scan
  const securityViolations = scanForPrototypePollution(raw);
  if (securityViolations.length > 0) {
    return {
      isValid: false,
      valid: false,
      errors: securityViolations,
      warnings: [],
    };
  }

  const rawObj = raw as Record<string, unknown>;

  // Top-level schemaVersion or version validation
  let rootSchemaVersion = SYNC_SCHEMA_VERSION;
  const rawVersion = rawObj.schemaVersion !== undefined ? rawObj.schemaVersion : rawObj.version;
  if (rawVersion !== undefined) {
    if (typeof rawVersion === 'number') {
      if (rawVersion < 1) {
        errors.push(`Ungültige Schema-Version ${rawVersion}: Version muss positiv sein.`);
      } else if (rawVersion > SYNC_SCHEMA_VERSION) {
        errors.push(`Nicht unterstützte Schema-Version ${rawVersion}. Maximal unterstützte Version ist ${SYNC_SCHEMA_VERSION}.`);
      } else {
        rootSchemaVersion = rawVersion;
      }
    } else if (typeof rawVersion === 'string') {
      if (rawVersion.trim() !== '1' && rawVersion.trim() !== '1.0') {
        errors.push(`Nicht unterstützte Schema-Version "${rawVersion}".`);
      }
    } else {
      errors.push('Erwartet wurde eine numerische Schema-Version.');
    }
  }

  // Validate metadata
  const rawMeta = isRecord(rawObj.metadata) ? rawObj.metadata : { schemaVersion: rootSchemaVersion, exportedAt: new Date().toISOString() };
  const metaResult = validateMetadata(rawMeta, 'metadata');
  warnings.push(...metaResult.warnings);
  if (!metaResult.valid || !metaResult.metadata) {
    errors.push(...metaResult.errors);
  }

  // Validate data container
  if (!('data' in rawObj) || !isRecord(rawObj.data)) {
    // Check if rawObj itself is formatted as data container directly
    if (Array.isArray(rawObj.roster) || Array.isArray(rawObj.students) || Array.isArray(rawObj.diagnostic_student_roster)) {
      warnings.push("Datensätze wurden auf Stammebene gefunden und in das 'data'-Objekt eingebettet.");
      rawObj.data = {
        roster: rawObj.roster || rawObj.students || rawObj.diagnostic_student_roster,
        history: rawObj.history || rawObj.sessions || rawObj.diagnostic_session_history || [],
      };
    } else {
      errors.push("Erforderliches 'data'-Objekt fehlt oder ist kein gültiges Objekt.");
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      valid: false,
      errors,
      warnings,
    };
  }

  const rawData = rawObj.data as Record<string, unknown>;

  // Extract roster from canonical or aliases
  const rawRoster = rawData.roster || rawData.students || rawData.diagnostic_student_roster || [];
  if (!Array.isArray(rawRoster)) {
    errors.push("data.roster: Erwartet wurde ein Array von Schülerprofilen.");
  } else if (rawRoster.length > MAX_ROSTER_ITEMS) {
    errors.push(`data.roster: Überschreitet das maximale Limit von ${MAX_ROSTER_ITEMS} Einträgen.`);
  }

  // Extract history from canonical or aliases
  const rawHistory = rawData.history || rawData.sessions || rawData.diagnostic_session_history || [];
  if (!Array.isArray(rawHistory)) {
    errors.push("data.history: Erwartet wurde ein Array von Testergebnis-Einträgen.");
  } else if (rawHistory.length > MAX_HISTORY_ITEMS) {
    errors.push(`data.history: Überschreitet das maximale Limit von ${MAX_HISTORY_ITEMS} Einträgen.`);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      valid: false,
      errors,
      warnings,
    };
  }

  // Validate individual student profiles
  const sanitizedRoster: StudentProfile[] = [];
  const seenStudentIds = new Set<string>();
  (rawRoster as unknown[]).forEach((item, idx) => {
    const studentRes = validateStudentProfile(item, idx, `data.roster[${idx}]`);
    warnings.push(...studentRes.warnings);
    if (!studentRes.valid || !studentRes.student) {
      errors.push(...studentRes.errors);
    } else {
      if (seenStudentIds.has(studentRes.student.id)) {
        warnings.push(`data.roster[${idx}]: Duplizierte Schüler-ID "${studentRes.student.id}" gefunden. Letzter Eintrag wird verwendet.`);
        const existingIdx = sanitizedRoster.findIndex((s) => s.id === studentRes.student!.id);
        if (existingIdx !== -1) {
          sanitizedRoster[existingIdx] = studentRes.student;
        }
      } else {
        seenStudentIds.add(studentRes.student.id);
        sanitizedRoster.push(studentRes.student);
      }
    }
  });

  // Validate individual test sessions
  const sanitizedHistory: TestSessionRecord[] = [];
  const seenSessionIds = new Set<string>();
  (rawHistory as unknown[]).forEach((item, idx) => {
    const sessionRes = validateTestSessionRecord(item, idx, `data.history[${idx}]`);
    warnings.push(...sessionRes.warnings);
    if (!sessionRes.valid || !sessionRes.session) {
      errors.push(...sessionRes.errors);
    } else {
      if (seenSessionIds.has(sessionRes.session.sessionId)) {
        warnings.push(`data.history[${idx}]: Duplizierte Sitzungs-ID "${sessionRes.session.sessionId}" gefunden. Eintrag dedupliziert.`);
      } else {
        seenSessionIds.add(sessionRes.session.sessionId);
        sanitizedHistory.push(sessionRes.session);
      }
    }
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      valid: false,
      errors,
      warnings,
    };
  }

  const finalMetadata: SyncMetadata = metaResult.metadata || {
    schemaVersion: SYNC_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    itemCount: {
      students: sanitizedRoster.length,
      sessions: sanitizedHistory.length,
    },
  };

  const finalData: SyncData = {
    roster: sanitizedRoster,
    history: sanitizedHistory,
    students: sanitizedRoster,
    sessions: sanitizedHistory,
    diagnostic_student_roster: sanitizedRoster,
    diagnostic_session_history: sanitizedHistory,
  };

  if (isRecord(rawData.appSettings)) {
    finalData.appSettings = { ...rawData.appSettings };
  }

  const sanitizedPayload: SyncPayload = {
    version: SYNC_SCHEMA_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    metadata: finalMetadata,
    data: finalData,
  };

  return {
    isValid: true,
    valid: true,
    errors: [],
    warnings,
    payload: sanitizedPayload,
    sanitizedPayload,
  };
}

/**
 * Convenience alias for validateSyncPayload
 */
export const validateAndSanitizeSyncPayload = validateSyncPayload;
