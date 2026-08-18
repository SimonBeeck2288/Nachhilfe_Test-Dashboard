export interface AbTwinQuestion {
  id: string;
  variant: 'standard' | 'direct';
  text: string;
  storyContext?: string;
  type: 'input' | 'multiple-choice';
  options?: string[];
  correctAnswer: string | string[];
  timeLimit: number;
}

export interface AbTwinPair {
  pairId: string;
  topic: string;
  subject: 'math' | 'english';
  level: number;
  conceptDescription: string;
  standard: AbTwinQuestion;
  direct: AbTwinQuestion;
}

export interface AbQuestionResult {
  questionId: string;
  pairId: string;
  topic: string;
  subject: 'math' | 'english';
  variant: 'standard' | 'direct';
  text: string;
  userAnswer: string;
  correctAnswer: string | string[];
  isCorrect: boolean;
  timeTaken: number;
  answeredAtTimestamp: number; // For attention span & fatigue tracking
}

export interface AbPairResult {
  pairId: string;
  topic: string;
  subject: 'math' | 'english';
  level: number;
  conceptDescription: string;
  standard?: AbQuestionResult;
  direct?: AbQuestionResult;
}

export interface AttentionAnalysis {
  firstHalfAccuracy: number; // Accuracy in 1st half of test duration
  firstHalfAvgTime: number;
  secondHalfAccuracy: number; // Accuracy in 2nd half of test duration
  secondHalfAvgTime: number;
  accuracyDeltaPercent: number; // secondHalf - firstHalf
  textFatigueObservation: string; // e.g. "Konzentration blieb stabil" or "Bei Textaufgaben stieg die Fehlerquote gegen Ende"
}

export interface AbTestSummary {
  standardTotal: number;
  standardCorrect: number;
  standardAccuracy: number;
  standardAvgTime: number;

  directTotal: number;
  directCorrect: number;
  directAccuracy: number;
  directAvgTime: number;

  accuracyGainPercent: number; // e.g. +25%
  speedupSeconds: number; // e.g. 4.2s faster
  speedupPercent: number; // e.g. 35% faster

  attentionAnalysis?: AttentionAnalysis;

  verdict: 'recommend_direct' | 'recommend_standard' | 'neutral';
  verdictTitle: string;
  verdictDescription: string;
}

export interface AbTestSessionRecord {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  durationMinutes: number;
  actualDurationSeconds: number;
  subject: 'math' | 'english' | 'all';
  pairResults: AbPairResult[];
  summary: AbTestSummary;
}
