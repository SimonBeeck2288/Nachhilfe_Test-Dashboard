import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { generateGeminiPrompt, buildGeminiGemUrl, buildChatGPTUrl, buildHuggingChatUrl, type AiPromptContext } from '../utils/aiPromptGenerator';
import { generatePracticeSheet } from '../utils/practiceGenerator';
import { PracticeSessionView } from '../components/PracticeSessionView';
import DiagnosticReportPrint from '../components/DiagnosticReportPrint';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

describe('Challenger M4.2: Empirical Stress & Edge Case Verification Suite', () => {
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
      useContext: (_context: any) => {
        return {
          state: {
            currentStudent: { id: 's1', name: 'Maximilian', gradeLevel: 6 },
            studentName: 'Maximilian',
            answers: [],
            mathLevel: 3,
            englishLevel: 4,
            markedQuestionIds: [],
            avatarConfig: { hatId: 'none', petId: 'none', themeId: 'default' },
            unlockedBadges: [],
          },
          currentStudent: { id: 's1', name: 'Maximilian', gradeLevel: 6 },
          saveSessionToHistory: vi.fn(),
          clearSession: vi.fn(),
        };
      },
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
    if (Array.isArray(node)) return node.map(extractAllTextFromTree).join('');
    let res = '';
    if (node.props) {
      if (typeof node.props.value === 'string') res += node.props.value;
      if (node.props.children) res += extractAllTextFromTree(node.props.children);
    }
    return res;
  };

  const findTextInTree = (node: any, search: string): boolean => {
    const rawText = extractAllTextFromTree(node);
    const normalizedText = rawText.replace(/\s+/g, ' ');
    return normalizedText.toLowerCase().includes(search.toLowerCase());
  };

  const findElementsWithClass = (node: any, className: string, results: any[] = []): any[] => {
    if (!node) return results;
    if (node.props) {
      if (node.props.className && typeof node.props.className === 'string' && node.props.className.includes(className)) {
        results.push(node);
      }
      if (node.props.children) {
        if (Array.isArray(node.props.children)) {
          node.props.children.forEach((child: any) => findElementsWithClass(child, className, results));
        } else {
          findElementsWithClass(node.props.children, className, results);
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((child) => findElementsWithClass(child, className, results));
    }
    return results;
  };

  describe('Edge Case 1: Missing Performance Data & Empty Contexts', () => {
    it('handles completely empty AiPromptContext gracefully without crashing or undefined text', () => {
      const promptSocratic = generateGeminiPrompt('socratic', {});
      const promptPersonalized = generateGeminiPrompt('personalized', {});
      const promptTasks = generateGeminiPrompt('practice_tasks', {});

      expect(promptSocratic).toContain('Schüler/in');
      expect(promptSocratic).toContain('Ausgewogen / Keine spezifischen Stärken hinterlegt');
      expect(promptSocratic).toContain('Keine kritischen Schwachstellen registriert');
      expect(promptSocratic).toContain('Keine detaillierten Themen-Statistiken vorhanden');

      expect(promptPersonalized).not.toContain('undefined');
      expect(promptTasks).not.toContain('undefined');
    });

    it('renders DiagnosticReportPrint with missing performance stats without errors', () => {
      resetState();
      const emptyRecord = {
        sessionId: 'sess_empty',
        studentId: 'std_empty',
        studentName: 'Test Student',
        date: new Date().toISOString(),
        subject: 'Mathematik & Englisch',
        mathLevelReached: 1,
        englishLevelReached: 1,
        score: 0,
        totalQuestions: 0,
        topicBreakdown: [],
        answers: [],
      };

      const jsx = DiagnosticReportPrint({ sessionRecord: emptyRecord });
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Keine Testdaten')).toBe(true);
    });
  });

  describe('Edge Case 2: Unselected Topics & Empty Configs', () => {
    it('falls back to default topics when config has 0 selected topics', () => {
      const sheet = generatePracticeSheet({
        studentId: 'guest',
        subjectFilter: 'both',
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math', selected: false, targetLevel: 2, isWeakSpot: false },
          { topicId: 'Vokabeln', topicName: 'Vokabeln', subject: 'english', selected: false, targetLevel: 2, isWeakSpot: false },
        ],
        questionCount: 4,
      });

      expect(sheet.exercises.length).toBe(4);
      expect(sheet.exercises[0]).toBeDefined();
    });

    it('renders PracticeSessionView smoothly when initialized with unselected topics config', () => {
      resetState();
      const unselectedConfig = {
        studentId: 'guest',
        subjectFilter: 'math' as const,
        topics: [
          { topicId: 'Addition', topicName: 'Addition', subject: 'math' as const, selected: false, targetLevel: 2, isWeakSpot: false },
        ],
        questionCount: 3,
        isTimerDisabled: false,
      };

      const jsx = PracticeSessionView({ config: unselectedConfig });
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Aufgabe 1 von 3')).toBe(true);
    });
  });

  describe('Edge Case 3: Standalone PracticeSessionView Rendering', () => {
    it('renders PracticeSessionView without props using internal guest fallbacks', () => {
      resetState();
      const jsx = PracticeSessionView({});
      expect(jsx).not.toBeNull();
      expect(findTextInTree(jsx, 'Aufgabe 1 von 5')).toBe(true);
    });

    it('safely handles missing TestSessionProvider context when opening AI modal', () => {
      resetState();

      const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      if (ReactInternals && ReactInternals.H) {
        const originalUseContext = ReactInternals.H.useContext;
        ReactInternals.H.useContext = () => undefined;
        try {
          const jsx = PracticeSessionView({});
          expect(jsx).not.toBeNull();
        } finally {
          ReactInternals.H.useContext = originalUseContext;
        }
      }
    });
  });

  describe('Edge Case 4: Print Mode Hidden Buttons (no-print CSS compliance)', () => {
    it('ensures action bars and AI Tutor buttons in DiagnosticReportPrint have no-print class', () => {
      resetState();
      const record = {
        sessionId: 'sess_print',
        studentId: 'std_print',
        studentName: 'Print Test',
        date: new Date().toISOString(),
        subject: 'Mathematik',
        mathLevelReached: 3,
        englishLevelReached: 3,
        score: 5,
        totalQuestions: 10,
        topicBreakdown: [
          { topic: 'Bruchrechnung', correct: 1, total: 5, accuracy: 0.2, avgTime: 15 },
        ],
        answers: [],
      };

      const jsx = DiagnosticReportPrint({ sessionRecord: record });
      const noPrintElements = findElementsWithClass(jsx, 'no-print');
      expect(noPrintElements.length).toBeGreaterThanOrEqual(4);
    });

    it('verifies print CSS rules hide .no-print and button elements', () => {
      resetState();
      const jsx = DiagnosticReportPrint({});
      expect(findTextInTree(jsx, '@media print')).toBe(true);
      expect(findTextInTree(jsx, 'no-print, button')).toBe(true);
    });
  });

  describe('Edge Case 5: Prompt Mode Toggling & External URL Generators', () => {
    it('generates distinct prompt modes for socratic, personalized, and practice_tasks', () => {
      const context: AiPromptContext = {
        studentProfile: { name: 'Hannah', gradeLevel: 7, hobbies: ['Skateboard', 'Malen'] },
        questionContext: { topic: 'Gleichungen', subject: 'math', level: 3, questionText: '2x + 4 = 10', userAnswer: 'x = 2', correctAnswer: 'x = 3' },
      };

      const promptSocratic = generateGeminiPrompt('socratic', context);
      const promptPersonalized = generateGeminiPrompt('personalized', context);
      const promptTasks = generateGeminiPrompt('practice_tasks', context);

      expect(promptSocratic).toContain('Sokratische Hilfestellung');
      expect(promptSocratic).toContain('Schritt-für-Schritt');

      expect(promptPersonalized).toContain('Personalisierte Konzept-Erklärung');
      expect(promptPersonalized).toContain('Skateboard, Malen');

      expect(promptTasks).toContain('3 Neue Maßgeschneiderte Übungsaufgaben');
      expect(promptTasks).toContain('--- LÖSUNGEN & ERKLÄRUNGEN ---');
    });

    it('builds valid URLs for Gemini Gem, ChatGPT, and HuggingChat', () => {
      const gemUrl = buildGeminiGemUrl();
      expect(gemUrl).toContain('gemini.google.com/gem/');

      const testPrompt = 'Erkläre Brüche für Hannah';
      const chatGptUrl = buildChatGPTUrl(testPrompt);
      expect(chatGptUrl).toContain('chatgpt.com/?q=');
      expect(chatGptUrl).toContain(encodeURIComponent(testPrompt));

      const huggingUrl = buildHuggingChatUrl(testPrompt);
      expect(huggingUrl).toContain('huggingchat.co/chat?q=');
      expect(huggingUrl).toContain(encodeURIComponent(testPrompt));
    });
  });
});
