import type { AnswerRecord } from '../context/TestSessionContext';
import type { AccessibilitySettings } from './student';

export interface TopicBreakdownItem {
  topic: string;
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgTime: number; // in seconds
}

export interface CognitionStatsRecord {
  correct: number;
  total: number;
  accuracy: number; // 0.0 - 1.0
  avgReactionTime: number; // in ms
}

export interface AbTestVariantStats {
  total: number;
  correct: number;
  accuracy: number; // 0.0 - 1.0
  avgTime: number; // in seconds
}

export interface AbTestComparisonMetrics {
  standard: AbTestVariantStats;
  direct: AbTestVariantStats;
  accuracyGainPercent: number; // percentage points difference: (direct.accuracy - standard.accuracy) * 100
  speedupPercent: number; // ((standard.avgTime - direct.avgTime) / standard.avgTime) * 100
  recommendation: 'recommend_direct' | 'recommend_standard' | 'neutral';
  recommendationReason: string;
}

export interface TestSessionRecord {
  sessionId: string;
  studentId: string;
  studentName: string;
  date: string;
  subject: string;
  mathLevelReached: number;
  englishLevelReached: number;
  score: number; // e.g. total correct answers count
  totalQuestions: number;
  topicBreakdown: Record<string, TopicBreakdownItem> | TopicBreakdownItem[];
  cognitionStats?: CognitionStatsRecord | null;
  abComparisonMetrics?: AbTestComparisonMetrics | null;
  answers: AnswerRecord[];
  motivation?: number;
  favoriteSubject?: string;
  problemSubject?: string;
  notes?: string;
  interpretation?: string;
  durationSeconds?: number;
  markedQuestionIds?: string[];
  accessibilitySettings?: AccessibilitySettings;
}

