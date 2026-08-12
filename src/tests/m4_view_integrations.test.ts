import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { PracticeSessionView } from '../components/PracticeSessionView';
import Dashboard from '../pages/Dashboard';
import DiagnosticReportPrint from '../components/DiagnosticReportPrint';
import { generateGeminiPrompt, type AiPromptContext } from '../utils/aiPromptGenerator';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

describe('Milestone M4: View Integrations Test Suite', () => {
  let stateStore: Map<number, any>;
  let stateIndex: number;
  let effectQueue: Array<() => void | (() => void)>;
  const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  beforeEach(() => {
    stateStore = new Map();
    stateIndex = 0;
    effectQueue = [];

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.stubGlobal('window', {
      open: vi.fn(),
      print: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const mockDispatcher = {
      useState: (initialValue: any) => {
        const currentIndex = stateIndex++;
        if (!stateStore.has(currentIndex)) {
          const val = typeof initialValue === 'function' ? initialValue() : initialValue;
          stateStore.set(currentIndex, val);
        }
        const setter = (newValue: any) => {
          const currentVal = stateStore.get(currentIndex);
          const computed = typeof newValue === 'function' ? newValue(currentVal) : newValue;
          stateStore.set(currentIndex, computed);
        };
        return [stateStore.get(currentIndex), setter];
      },
      useContext: (_context: any) => ({
        state: {
          currentStudent: { id: 's1', name: 'Maximilian', gradeLevel: 6, favoriteSubject: 'Mathe', problemSubject: 'Englisch' },
          studentName: 'Maximilian',
          answers: [
            { questionId: 'q1', topic: 'Addition', subject: 'math', isCorrect: false, timeTaken: 12, userAnswer: '7', correctAnswer: '8', questionText: '5 + 3?' }
          ],
          mathLevel: 3,
          englishLevel: 4,
          markedQuestionIds: ['q1'],
          avatarConfig: { hatId: 'none', petId: 'none', themeId: 'default' },
          unlockedBadges: [],
        },
        currentStudent: { id: 's1', name: 'Maximilian', gradeLevel: 6, favoriteSubject: 'Mathe', problemSubject: 'Englisch' },
        saveSessionToHistory: vi.fn(),
        clearSession: vi.fn(),
      }),
      useRef: (initialValue: any) => ({ current: initialValue }),
      useCallback: (fn: any) => fn,
      useEffect: (effect: any) => {
        effectQueue.push(effect);
      },
      useMemo: (factory: any) => factory(),
      useLayoutEffect: (effect: any) => {
        effectQueue.push(effect);
      },
    };

    if (ReactInternals) {
      ReactInternals.H = mockDispatcher;
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (ReactInternals) {
      ReactInternals.H = null;
    }
  });

  const findTextInTree = (node: any, search: string): boolean => {
    if (!node) return false;
    if (typeof node === 'string') return node.includes(search);
    if (typeof node === 'number') return node.toString().includes(search);
    if (Array.isArray(node)) return node.some((child) => findTextInTree(child, search));
    if (node.props && node.props.children) return findTextInTree(node.props.children, search);
    return false;
  };

  const findElementByTestId = (node: any, testId: string): any => {
    if (!node) return null;
    if (node.props && node.props['data-testid'] === testId) return node;
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findElementByTestId(child, testId);
        if (found) return found;
      }
    }
    if (node.props && node.props.children) {
      return findElementByTestId(node.props.children, testId);
    }
    return null;
  };

  describe('1. PracticeSessionView KI-Tutor Integration', () => {
    it('renders PracticeSessionView and contains exercise elements', () => {
      stateIndex = 0;
      const sheet = {
        id: 'test_sheet',
        createdAt: new Date().toISOString(),
        config: {
          studentId: 'test_student',
          subjectFilter: 'math' as const,
          topics: [{ topicId: 'Addition', topicName: 'Addition', subject: 'math' as const, selected: true, targetLevel: 2, isWeakSpot: false }],
          questionCount: 1,
          isTimerDisabled: true,
        },
        exercises: [
          {
            id: 'ex_1',
            topicId: 'Addition',
            topicName: 'Addition',
            subject: 'math' as const,
            level: 2,
            questionText: 'Was ist 5 + 3?',
            options: ['6', '7', '8', '9'],
            correctAnswer: '8',
            explanation: '5 + 3 ist 8.',
            mascotTip: 'Zähle weiter!',
          },
        ],
      };

      const jsx = PracticeSessionView({ sheet });
      expect(jsx).not.toBeNull();

      expect(findTextInTree(jsx, 'Was ist 5 + 3?')).toBe(true);
    });

    it('compiles valid Gemini prompt when question context is populated', () => {
      const context: AiPromptContext = {
        studentProfile: { id: 's1', name: 'Maximilian', gradeLevel: 6 },
        questionContext: {
          subject: 'math',
          topic: 'Addition',
          level: 2,
          questionText: 'Was ist 5 + 3?',
          userAnswer: '7',
          correctAnswer: '8',
          explanation: '5 + 3 ist 8.',
        },
      };

      const prompt = generateGeminiPrompt('socratic', context);
      expect(prompt).toContain('Maximilian');
      expect(prompt).toContain('Was ist 5 + 3?');
      expect(prompt).toContain('Addition');
      expect(prompt).toContain('7');
    });
  });

  describe('2. Dashboard KI-Tutor Integration', () => {
    it('renders Dashboard without crashing and contains learning tools', () => {
      stateIndex = 0;
      const jsx = Dashboard({});
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Aktuelle Auswertung')).toBe(true);
    });
  });

  describe('3. DiagnosticReportPrint KI-Tutor Integration', () => {
    it('renders KI-Tutor Gem Hilfe button in action bar and weakness section', () => {
      stateIndex = 0;
      const record = {
        sessionId: 'sess_123',
        studentId: 'std_456',
        studentName: 'Sophie',
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: 3,
        englishLevelReached: 4,
        score: 8,
        totalQuestions: 10,
        topicBreakdown: [
          { topic: 'Geometrie', correct: 4, total: 5, accuracy: 0.8, avgTime: 12 },
          { topic: 'Bruchrechnung', correct: 1, total: 5, accuracy: 0.2, avgTime: 25 },
        ],
        answers: [],
      };

      const jsx = DiagnosticReportPrint({ sessionRecord: record });
      expect(jsx).not.toBeNull();

      const reportBtn = findElementByTestId(jsx, 'ki-tutor-report-bar-btn');
      expect(reportBtn).not.toBeNull();

      const weaknessBtn = findElementByTestId(jsx, 'ki-tutor-weakness-btn');
      expect(weaknessBtn).not.toBeNull();

      const consultationBtn = findElementByTestId(jsx, 'ki-tutor-consultation-btn');
      expect(consultationBtn).not.toBeNull();
    });
  });
});
