import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { QuestionRenderer } from '../components/QuestionRenderer';
import { PracticeSessionView } from '../components/PracticeSessionView';
import { TestSessionProvider } from '../context/TestSessionContext';
import type { Question } from '../data/questions';
import type { PracticeSheet } from '../types/practice';

const sampleInputQuestion1: Question = {
  id: 'test_q1',
  topic: 'Addition',
  subject: 'math',
  level: 1,
  text: 'Was ist 5 + 7?',
  type: 'input',
  correctAnswer: '12',
  timeLimit: 30,
};

const sampleInputQuestion2: Question = {
  id: 'test_q2',
  topic: 'Subtraktion',
  subject: 'math',
  level: 1,
  text: 'Was ist 10 - 4?',
  type: 'input',
  correctAnswer: '6',
  timeLimit: 30,
};

const samplePracticeSheet: PracticeSheet = {
  id: 'sheet_1',
  title: 'Test Sheet',
  createdAt: new Date().toISOString(),
  config: {
    studentId: 's1',
    subjectFilter: 'math',
    topics: [],
    questionCount: 2,
    isTimerDisabled: false,
  },
  exercises: [
    {
      id: 'ex_1',
      originalQuestionId: 'q1',
      subject: 'math',
      topicId: 'Addition',
      topicName: 'Addition',
      level: 1,
      questionText: 'Berechne 10 + 20',
      correctAnswer: '30',
      explanation: '10 + 20 = 30',
      isVariation: false,
    },
    {
      id: 'ex_2',
      originalQuestionId: 'q2',
      subject: 'math',
      topicId: 'Addition',
      topicName: 'Addition',
      level: 1,
      questionText: 'Berechne 15 + 15',
      correctAnswer: '30',
      explanation: '15 + 15 = 30',
      isVariation: false,
    },
  ],
};

describe('Focus Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('QuestionRenderer cursor and focus behavior', () => {
    it('automatically focuses the input field when an input question is rendered', async () => {
      const onAnswerSubmit = vi.fn();
      render(
        <TestSessionProvider>
          <QuestionRenderer
            question={sampleInputQuestion1}
            onAnswerSubmit={onAnswerSubmit}
          />
        </TestSessionProvider>
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const input = screen.getByPlaceholderText('Deine Antwort...');
      expect(document.activeElement).toBe(input);
    });

    it('positions the cursor at the end when initialAnswer is present (e.g. back navigation)', async () => {
      const onAnswerSubmit = vi.fn();
      render(
        <TestSessionProvider>
          <QuestionRenderer
            question={sampleInputQuestion1}
            initialAnswer="12345"
            onAnswerSubmit={onAnswerSubmit}
          />
        </TestSessionProvider>
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const input = screen.getByPlaceholderText('Deine Antwort...') as HTMLInputElement;
      expect(input.value).toBe('12345');
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(5);
      expect(input.selectionEnd).toBe(5);
    });

    it('re-focuses input when question changes', async () => {
      const onAnswerSubmit = vi.fn();
      const { rerender } = render(
        <TestSessionProvider>
          <QuestionRenderer
            question={sampleInputQuestion1}
            onAnswerSubmit={onAnswerSubmit}
          />
        </TestSessionProvider>
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const input1 = screen.getByPlaceholderText('Deine Antwort...');
      expect(document.activeElement).toBe(input1);

      rerender(
        <TestSessionProvider>
          <QuestionRenderer
            question={sampleInputQuestion2}
            onAnswerSubmit={onAnswerSubmit}
          />
        </TestSessionProvider>
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const input2 = screen.getByPlaceholderText('Deine Antwort...');
      expect(document.activeElement).toBe(input2);
    });
  });

  describe('PracticeSessionView cursor and focus behavior', () => {
    it('automatically focuses the practice input field on mount', async () => {
      render(
        <TestSessionProvider>
          <PracticeSessionView sheet={samplePracticeSheet} />
        </TestSessionProvider>
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const input = screen.getByPlaceholderText('Ergebnis eingeben...');
      expect(document.activeElement).toBe(input);
    });
  });
});
