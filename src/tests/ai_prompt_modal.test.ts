import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AiPromptModal } from '../components/AiPromptModal';
import {
  generateGeminiPrompt,
  buildChatGPTUrl,
  buildHuggingChatUrl,
  type AiPromptContext,
} from '../utils/aiPromptGenerator';

describe('AiPromptModal Component Suite', () => {
  let stateStore: Map<number, any>;
  let stateIndex: number;
  let effectQueue: Array<() => void | (() => void)>;
  const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    stateStore = new Map();
    stateIndex = 0;
    effectQueue = [];

    // Mock navigator.clipboard & window.open
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: mockClipboardWriteText,
      },
    });

    vi.stubGlobal('window', {
      open: mockWindowOpen,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    mockClipboardWriteText.mockClear();
    mockWindowOpen.mockClear();

    // Mock React Dispatcher for shallow element execution testing
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

  const renderModal = (props: {
    isOpen: boolean;
    onClose: () => void;
    context: AiPromptContext;
    initialMode?: 'socratic' | 'personalized' | 'practice_tasks';
  }) => {
    stateIndex = 0;
    const jsx = AiPromptModal(props);
    // Execute pending effects
    const cleanups: Array<void | (() => void)> = [];
    while (effectQueue.length > 0) {
      const eff = effectQueue.shift();
      if (eff) {
        const c = eff();
        cleanups.push(c);
      }
    }
    return jsx;
  };

  const sampleContext: AiPromptContext = {
    studentProfile: {
      id: 'student-1',
      name: 'Lukas',
      gradeLevel: 8,
      hobbies: ['Gaming', 'Fußball'],
      learningPreferences: ['Schritt-für-Schritt', 'Mit Hobbys erklären'],
      customNotes: 'Braucht anschauliche Vergleiche.',
    },
    performanceData: {
      strengths: ['Geometrie'],
      weaknesses: ['Bruchrechnung'],
      topicAccuracy: { Bruchrechnung: 45, Geometrie: 85 },
      gradeLevel: 8,
    },
    questionContext: {
      subject: 'math',
      topic: 'Bruchrechnung',
      level: 3,
      questionText: 'Berechne 3/4 + 1/2',
      userAnswer: '4/6',
      correctAnswer: '5/4 oder 1 1/4',
      explanation: 'Zähler gleichnamig machen: 1/2 = 2/4. Dann 3/4 + 2/4 = 5/4.',
    },
  };

  // Helper tree search functions
  const findTextInTree = (node: any, search: string): boolean => {
    if (!node) return false;
    if (typeof node === 'string') return node.includes(search);
    if (typeof node === 'number') return node.toString().includes(search);
    if (Array.isArray(node)) return node.some((child) => findTextInTree(child, search));
    if (node.props && node.props.children) return findTextInTree(node.props.children, search);
    return false;
  };

  const findElementByTagAndText = (node: any, tag: string, textSubstring: string): any => {
    if (!node) return null;
    if (node.type === tag && findTextInTree(node, textSubstring)) return node;
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findElementByTagAndText(child, tag, textSubstring);
        if (found) return found;
      }
    }
    if (node.props && node.props.children) {
      return findElementByTagAndText(node.props.children, tag, textSubstring);
    }
    return null;
  };

  it('returns null when isOpen is false', () => {
    const jsx = renderModal({
      isOpen: false,
      onClose: vi.fn(),
      context: sampleContext,
    });
    expect(jsx).toBeNull();
  });

  it('renders modal overlay and card dialog when isOpen is true', () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
    });

    expect(jsx).not.toBeNull();
    expect(jsx?.type).toBe('div');
    expect(jsx?.props['role']).toBe('dialog');
    expect(jsx?.props['aria-modal']).toBe('true');
    expect(findTextInTree(jsx, 'KI-Tutor Assistenz (Gemini Gem Sidecar)')).toBe(true);
  });

  it('renders all 3 mode selector tabs and sets initial active mode correctly', () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
      initialMode: 'personalized',
    });

    expect(findTextInTree(jsx, 'Sokratische Hilfestellung')).toBe(true);
    expect(findTextInTree(jsx, 'Personalisierte Erklärung')).toBe(true);
    expect(findTextInTree(jsx, '3 Neue Übungsaufgaben')).toBe(true);

    // Initial state store index 0 should hold activeMode = 'personalized'
    expect(stateStore.get(0)).toBe('personalized');

    // Prompt text state store index 1 should match personalized generated prompt
    const expectedPrompt = generateGeminiPrompt('personalized', sampleContext);
    expect(stateStore.get(1)).toBe(expectedPrompt);
  });

  it('updates mode and regenerates prompt text when switching mode tabs', () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
      initialMode: 'socratic',
    });

    // Find tab button for "3 Neue Übungsaufgaben"
    const exerciseTab = findElementByTagAndText(jsx, 'button', '3 Neue Übungsaufgaben');
    expect(exerciseTab).not.toBeNull();

    // Trigger tab click
    exerciseTab.props.onClick();

    // State 0 (activeMode) should update to 'practice_tasks'
    expect(stateStore.get(0)).toBe('practice_tasks');
    // State 1 (promptText) should equal practice_tasks generated prompt
    const expectedPrompt = generateGeminiPrompt('practice_tasks', sampleContext);
    expect(stateStore.get(1)).toBe(expectedPrompt);
  });

  it('renders live editable prompt preview in textarea and allows custom prompt editing', () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
    });

    const textarea = findElementByAttribute(jsx, 'id', 'ai-prompt-preview');
    expect(textarea).not.toBeNull();
    expect(textarea.props.value).toContain('Sokratische Hilfestellung');

    // Simulate user editing prompt text in textarea
    const customPrompt = 'Hier ist mein angepasster Prompt für Lukas!';
    textarea.props.onChange({ target: { value: customPrompt } });

    expect(stateStore.get(1)).toBe(customPrompt);
  });

  it('executes primary action button "NachhilfeTest Gem öffnen (Sidecar)": copies to clipboard, opens window.open sidecar, and sets toast message', async () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
    });

    const primaryBtn = findElementByTagAndText(jsx, 'button', 'NachhilfeTest Gem öffnen (Sidecar)');
    expect(primaryBtn).not.toBeNull();

    await primaryBtn.props.onClick();

    // 1. Check clipboard copy called with current prompt text
    const expectedPromptText = generateGeminiPrompt('socratic', sampleContext);
    expect(mockClipboardWriteText).toHaveBeenCalledWith(expectedPromptText);

    // 2. Check window.open called with Gemini Gem URL and 480x750 window specs
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing',
      '_blank',
      'width=480,height=750,resizable=yes,scrollbars=yes'
    );

    // 3. Check toast message set in state index 2
    expect(stateStore.get(2)).toBe('Prompt in Zwischenablage kopiert & Gemini Gem geöffnet!');
  });

  it('renders secondary action links for ChatGPT and HuggingChat with correct pre-filled URLs', () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
    });

    const currentPrompt = generateGeminiPrompt('socratic', sampleContext);

    const chatGptLink = findElementByTagAndText(jsx, 'a', 'ChatGPT');
    expect(chatGptLink).not.toBeNull();
    expect(chatGptLink.props.href).toBe(buildChatGPTUrl(currentPrompt));
    expect(chatGptLink.props.target).toBe('_blank');

    const huggingChatLink = findElementByTagAndText(jsx, 'a', 'HuggingChat');
    expect(huggingChatLink).not.toBeNull();
    expect(huggingChatLink.props.href).toBe(buildHuggingChatUrl(currentPrompt));
    expect(huggingChatLink.props.target).toBe('_blank');
  });

  it('handles "Text kopieren" button action independently', async () => {
    const jsx = renderModal({
      isOpen: true,
      onClose: vi.fn(),
      context: sampleContext,
    });

    const copyBtn = findElementByTagAndText(jsx, 'button', 'Text kopieren');
    expect(copyBtn).not.toBeNull();

    await copyBtn.props.onClick();

    const currentPrompt = generateGeminiPrompt('socratic', sampleContext);
    expect(mockClipboardWriteText).toHaveBeenCalledWith(currentPrompt);
    expect(stateStore.get(2)).toBe('Prompt erfolgreich in die Zwischenablage kopiert!');
  });

  const findElementByAttribute = (node: any, attrName: string, attrVal: string): any => {
    if (!node) return null;
    if (node.props && node.props[attrName] === attrVal) return node;
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findElementByAttribute(child, attrName, attrVal);
        if (found) return found;
      }
    }
    if (node.props && node.props.children) {
      return findElementByAttribute(node.props.children, attrName, attrVal);
    }
    return null;
  };

  it('invokes onClose when clicking close button or backdrop overlay', () => {
    const onCloseSpy = vi.fn();
    const jsx = renderModal({
      isOpen: true,
      onClose: onCloseSpy,
      context: sampleContext,
    });

    // Outer overlay click
    expect(typeof jsx.props.onClick).toBe('function');
    jsx.props.onClick();
    expect(onCloseSpy).toHaveBeenCalledTimes(1);

    // Inner card stopPropagation
    const cardDiv = jsx.props.children;
    const stopPropSpy = vi.fn();
    cardDiv.props.onClick({ stopPropagation: stopPropSpy });
    expect(stopPropSpy).toHaveBeenCalledTimes(1);

    // Close button (X) click
    const closeBtn = findElementByAttribute(jsx, 'data-testid', 'modal-close-button');
    expect(closeBtn).not.toBeNull();
    closeBtn.props.onClick();
    expect(onCloseSpy).toHaveBeenCalledTimes(2);
  });
});
