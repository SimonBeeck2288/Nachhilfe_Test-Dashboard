export type TopicMode = 'off' | 'optional' | 'forced';

export interface CustomTestConfig {
  subject: 'all' | 'math' | 'english' | 'cognition';
  startingLevel: number;
  maxDurationMinutes: number;
  topics: string[];
  topicModes?: Record<string, TopicMode>;
  questionTypes: ('multiple-choice' | 'input')[];
}

export const defaultConfig: CustomTestConfig = {
  subject: 'all',
  startingLevel: 1,
  maxDurationMinutes: 5,
  topics: [],
  topicModes: {},
  questionTypes: ['multiple-choice', 'input'],
};

