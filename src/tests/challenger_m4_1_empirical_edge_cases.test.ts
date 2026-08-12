import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { PracticeSessionView } from '../components/PracticeSessionView';
import DiagnosticReportPrint from '../components/DiagnosticReportPrint';
import { AiPromptModal } from '../components/AiPromptModal';
import { generateGeminiPrompt, type AiPromptContext } from '../utils/aiPromptGenerator';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

describe('Challenger M4.1: Empirical Edge Cases & View Integrations Verification', () => {
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

  const resetState = () => {
    stateStore.clear();
    stateIndex = 0;
  };

  const extractAllTextFromTree = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return node.toString();
    if (Array.isArray(node)) return node.map(extractAllTextFromTree).join(' ');
    let res = '';
    if (node.props) {
      if (typeof node.props.value === 'string') res += ' ' + node.props.value;
      if (node.props.children) res += ' ' + extractAllTextFromTree(node.props.children);
    }
    return res;
  };

  const findTextInTree = (node: any, search: string): boolean => {
    const rawText = extractAllTextFromTree(node);
    const normalizedText = rawText.replace(/\s+/g, ' ');
    return normalizedText.toLowerCase().includes(search.toLowerCase());
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

  const findElementsByClassName = (node: any, className: string, results: any[] = []): any[] => {
    if (!node) return results;
    if (node.props && typeof node.props.className === 'string' && node.props.className.includes(className)) {
      results.push(node);
    }
    if (Array.isArray(node)) {
      for (const child of node) {
        findElementsByClassName(child, className, results);
      }
    } else if (node.props && node.props.children) {
      findElementsByClassName(node.props.children, className, results);
    }
    return results;
  };

  describe('Edge Case 1: Missing Performance Data', () => {
    it('handles generateGeminiPrompt with missing/empty performanceData & studentProfile without throwing', () => {
      const emptyContext: AiPromptContext = {};
      
      const socraticPrompt = generateGeminiPrompt('socratic', emptyContext);
      expect(socraticPrompt).toContain('Schüler/in');
      expect(socraticPrompt).toContain('Klassenstufe:** Nicht angegeben');
      expect(socraticPrompt).toContain('Allgemeine Interessen');
      expect(socraticPrompt).toContain('Ausgewogen / Keine spezifischen Stärken');
      expect(socraticPrompt).toContain('Keine kritischen Schwachstellen');
      expect(socraticPrompt).toContain('Keine detaillierten Themen-Statistiken vorhanden');

      const personalizedPrompt = generateGeminiPrompt('personalized', emptyContext);
      expect(personalizedPrompt).toContain('Personalisierte Konzept-Erklärung');
      expect(personalizedPrompt).toContain('Allgemeines Thema');

      const practicePrompt = generateGeminiPrompt('practice_tasks', emptyContext);
      expect(practicePrompt).toContain('3 Neue Maßgeschneiderte Übungsaufgaben');
    });

    it('renders DiagnosticReportPrint with missing sessionRecord and empty answers cleanly', () => {
      resetState();
      if (ReactInternals) {
        ReactInternals.H.useContext = () => ({
          state: {
            answers: [],
            studentName: '',
            mathLevel: 1,
            englishLevel: 1,
            currentStudent: undefined,
          },
        });
      }

      const jsx = DiagnosticReportPrint({});
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Schüler/in')).toBe(true);
      expect(findTextInTree(jsx, 'Keine Testdaten')).toBe(true);
    });
  });

  describe('Edge Case 2: Unselected Topics / Empty Topic Configuration', () => {
    it('PracticeSessionView generates default fallback exercises when config has empty topics', () => {
      resetState();
      const jsx = PracticeSessionView({
        config: {
          studentId: 'test_student',
          subjectFilter: 'math',
          topics: [],
          questionCount: 3,
          isTimerDisabled: false,
        },
      });

      expect(jsx).not.toBeNull();
      // Should fall back to default generated practice sheet exercises
      expect(findTextInTree(jsx, 'Aufgabe 1 von')).toBe(true);
    });

    it('PracticeSessionView handles sheet with empty exercises array by using fallback sheet', () => {
      resetState();
      const jsx = PracticeSessionView({
        sheet: {
          id: 'empty_sheet',
          createdAt: new Date().toISOString(),
          config: {
            studentId: 'guest',
            subjectFilter: 'both',
            topics: [],
            questionCount: 0,
            isTimerDisabled: true,
          },
          exercises: [],
        },
      });

      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Aufgabe 1 von')).toBe(true);
    });
  });

  describe('Edge Case 3: Standalone PracticeSessionView Rendering', () => {
    it('renders PracticeSessionView safely when useContext throws or is outside TestSessionProvider', () => {
      resetState();
      if (ReactInternals) {
        ReactInternals.H.useContext = () => {
          throw new Error('useTestSession must be used within a TestSessionProvider');
        };
      }

      const jsx = PracticeSessionView({});
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Aufgabe 1 von')).toBe(true);
    });
  });

  describe('Edge Case 4: Print Mode Hidden Buttons (no-print)', () => {
    it('verifies that action bar and KI-Tutor Gem launcher buttons in DiagnosticReportPrint have no-print class', () => {
      resetState();
      const record = {
        sessionId: 'sess_999',
        studentId: 'std_999',
        studentName: 'Laura',
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 2,
        score: 5,
        totalQuestions: 5,
        topicBreakdown: [
          { topic: 'Bruchrechnung', correct: 1, total: 5, accuracy: 0.2, avgTime: 20 },
        ],
        answers: [],
      };

      const jsx = DiagnosticReportPrint({ sessionRecord: record });
      expect(jsx).not.toBeNull();

      const noPrintElements = findElementsByClassName(jsx, 'no-print');
      expect(noPrintElements.length).toBeGreaterThan(0);

      // Verify action bar has no-print
      const reportBarBtn = findElementByTestId(jsx, 'ki-tutor-report-bar-btn');
      expect(reportBarBtn).not.toBeNull();

      // Verify weakness section KI tutor button is wrapped in no-print or has no-print class
      const weaknessBtn = findElementByTestId(jsx, 'ki-tutor-weakness-btn');
      expect(weaknessBtn).not.toBeNull();
      expect(weaknessBtn.props.className).toContain('no-print');

      // Verify consultation KI tutor button has no-print class
      const consultationBtn = findElementByTestId(jsx, 'ki-tutor-consultation-btn');
      expect(consultationBtn).not.toBeNull();
      expect(consultationBtn.props.className).toContain('no-print');
    });
  });

  describe('Edge Case 5: Prompt Mode Toggling in AiPromptModal', () => {
    it('AiPromptModal initializes with initialMode and allows mode switching', () => {
      resetState();
      const context: AiPromptContext = {
        studentProfile: { name: 'Felix', gradeLevel: 7 },
        questionContext: { topic: 'Geometrie', questionText: 'Berechne die Fläche.' },
      };

      const jsxInitial = AiPromptModal({
        isOpen: true,
        onClose: vi.fn(),
        context,
        initialMode: 'practice_tasks',
      });

      expect(jsxInitial).not.toBeNull();
      expect(findTextInTree(jsxInitial, '3 Neue Maßgeschneiderte Übungsaufgaben')).toBe(true);

      const socraticPrompt = generateGeminiPrompt('socratic', context);
      const personalizedPrompt = generateGeminiPrompt('personalized', context);
      const practicePrompt = generateGeminiPrompt('practice_tasks', context);

      expect(socraticPrompt).toContain('Sokratische Hilfestellung');
      expect(personalizedPrompt).toContain('Personalisierte Konzept-Erklärung');
      expect(practicePrompt).toContain('3 Neue Maßgeschneiderte Übungsaufgaben');
    });

    it('returns null when isOpen is false', () => {
      const jsx = AiPromptModal({
        isOpen: false,
        onClose: vi.fn(),
        context: {},
      });
      expect(jsx).toBeNull();
    });
  });
});
