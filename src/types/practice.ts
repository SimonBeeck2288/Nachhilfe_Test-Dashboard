export interface TopicConfig {
  topicId: string;
  topicName: string;
  subject: 'math' | 'english';
  selected: boolean;
  targetLevel: number; // 1-7
  isWeakSpot: boolean; // accuracy < 70%
  accuracyPercentage?: number;
}

export interface PracticeGeneratorConfig {
  studentId: string;
  subjectFilter: 'math' | 'english' | 'both';
  topics: TopicConfig[];
  questionCount: 5 | 10 | 15 | 20;
  isTimerDisabled: boolean;
  seed?: number;
}

export interface GeneratedExerciseItem {
  id: string;
  originalQuestionId: string;
  subject: 'math' | 'english';
  topicId: string;
  topicName: string;
  level: number;
  questionText: string;
  directText?: string;
  directStoryContext?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  mascotTip?: string;
  isVariation: boolean;
  storyContext?: string;
  type?: string;
  diagramData?: Record<string, unknown>;
  targetFraction?: { numerator: number; denominator: number };
  dragItems?: string[];
  matchingPairs?: { left: string; right: string }[];
}

export interface PracticeSheet {
  id: string;
  createdAt: string;
  config: PracticeGeneratorConfig;
  exercises: GeneratedExerciseItem[];
}
