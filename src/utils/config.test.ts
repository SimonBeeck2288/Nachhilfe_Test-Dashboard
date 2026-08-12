import { describe, it, expect } from './testRunner';
import type { CustomTestConfig } from '../types/config';
import { defaultConfig } from '../types/config';

describe('Custom Test Configurator suite', () => {
  it('verifies default test configuration values', () => {
    expect(defaultConfig.subject).toBe('all');
    expect(defaultConfig.startingLevel).toBe(1);
    expect(defaultConfig.maxDurationMinutes).toBe(5);
    expect(Array.isArray(defaultConfig.topics)).toBe(true);
    expect(defaultConfig.topics.length).toBe(0);
    expect(defaultConfig.questionTypes.length).toBe(2);
  });

  it('validates custom configuration structure and overrides', () => {
    const customConfig: CustomTestConfig = {
      subject: 'math',
      startingLevel: 4,
      maxDurationMinutes: 10,
      topics: ['Bruchrechnung', 'Geometrie'],
      questionTypes: ['multiple-choice'],
    };

    expect(customConfig.subject).toBe('math');
    expect(customConfig.startingLevel).toBe(4);
    expect(customConfig.maxDurationMinutes).toBe(10);
    expect(customConfig.topics.includes('Bruchrechnung')).toBe(true);
    expect(customConfig.questionTypes.length).toBe(1);
    expect(customConfig.questionTypes[0]).toBe('multiple-choice');
  });
});
