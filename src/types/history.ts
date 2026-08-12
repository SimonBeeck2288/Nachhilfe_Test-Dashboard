import type { AnswerRecord } from '../context/TestSessionContext';

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
  answers: AnswerRecord[];
  motivation?: number;
  favoriteSubject?: string;
  problemSubject?: string;
  notes?: string;
  interpretation?: string;
  durationSeconds?: number;
  markedQuestionIds?: string[];
}
