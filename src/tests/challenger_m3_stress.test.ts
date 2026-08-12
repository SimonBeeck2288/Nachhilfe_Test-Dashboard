import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AiPromptModal } from '../components/AiPromptModal';
import {
  buildGeminiGemUrl,
  buildChatGPTUrl,
  buildHuggingChatUrl,
  type AiPromptContext,
} from '../utils/aiPromptGenerator';

describe('Challenger M3 — Sidecar Window & Integration Stress & Empirical Verification', () => {
  let stateStore: Map<number, any>;
  let stateIndex: number;
  let effectQueue: Array<() => void | (() => void)>;
  const ReactInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  const mockClipboardWriteText = vi.fn();
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    stateStore = new Map();
    stateIndex = 0;
    effectQueue = [];
    mockClipboardWriteText.mockReset().mockResolvedValue(undefined);
    mockWindowOpen.mockReset();

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
    while (effectQueue.length > 0) {
      const eff = effectQueue.shift();
      if (eff) eff();
    }
    return jsx;
  };

  const sampleContext: AiPromptContext = {
    studentProfile: {
      id: 'student-stress-1',
      name: 'Mäxchen Müller & Co.',
      gradeLevel: 7,
      hobbies: ['Fußball ⚽', 'Gaming 🎮', 'Kochen & Backen 🍰'],
      learningPreferences: ['Schritt-für-Schritt', 'Mit Hobbys erklären'],
      customNotes: 'Benötigt klare Struktur & Humor.',
    },
    performanceData: {
      strengths: ['Geometrie'],
      weaknesses: ['Prozentrechnung'],
      topicAccuracy: { Prozentrechnung: 50, Geometrie: 90 },
      gradeLevel: 7,
    },
    questionContext: {
      subject: 'math',
      topic: 'Prozentrechnung',
      level: 4,
      questionText: 'Berechne 15% von 200 €.',
      userAnswer: '15 €',
      correctAnswer: '30 €',
      explanation: '15% = 15/100. 200 * 15 / 100 = 30 €.',
    },
  };

  const findElementByTagAndText = (node: any, tag: string, textSubstring: string): any => {
    if (!node) return null;
    const matchesText = (val: any): boolean => {
      if (typeof val === 'string') return val.includes(textSubstring);
      if (typeof val === 'number') return val.toString().includes(textSubstring);
      if (Array.isArray(val)) return val.some(matchesText);
      if (val?.props?.children) return matchesText(val.props.children);
      return false;
    };
    if (node.type === tag && matchesText(node)) return node;
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findElementByTagAndText(child, tag, textSubstring);
        if (found) return found;
      }
    }
    if (node.props?.children) {
      return findElementByTagAndText(node.props.children, tag, textSubstring);
    }
    return null;
  };

  describe('Requirement 1: Clipboard Copy Fallback Resilience', () => {
    it('gracefully handles missing navigator.clipboard without throwing', async () => {
      vi.stubGlobal('navigator', {}); // no clipboard property

      const jsx = renderModal({
        isOpen: true,
        onClose: vi.fn(),
        context: sampleContext,
      });

      const primaryBtn = findElementByTagAndText(jsx, 'button', 'NachhilfeTest Gem öffnen (Sidecar)');
      expect(primaryBtn).not.toBeNull();

      // Should not throw even when navigator.clipboard is undefined
      await expect(primaryBtn.props.onClick()).resolves.toBeUndefined();

      // window.open should still be called
      expect(mockWindowOpen).toHaveBeenCalledWith(
        buildGeminiGemUrl(),
        '_blank',
        'width=480,height=750,resizable=yes,scrollbars=yes'
      );
    });

    it('gracefully handles writeText rejection/error (e.g. permission denied)', async () => {
      mockClipboardWriteText.mockRejectedValue(new Error('Permission denied'));

      const jsx = renderModal({
        isOpen: true,
        onClose: vi.fn(),
        context: sampleContext,
      });

      const primaryBtn = findElementByTagAndText(jsx, 'button', 'NachhilfeTest Gem öffnen (Sidecar)');
      expect(primaryBtn).not.toBeNull();

      // Should handle rejection safely and continue to open sidecar window
      await expect(primaryBtn.props.onClick()).resolves.toBeUndefined();

      expect(mockWindowOpen).toHaveBeenCalledWith(
        buildGeminiGemUrl(),
        '_blank',
        'width=480,height=750,resizable=yes,scrollbars=yes'
      );
    });
  });

  describe('Requirement 2: Window.open 480x750 Features Parameter', () => {
    it('passes exact 480x750 window specifications and resizable/scrollbars flags to window.open', async () => {
      const jsx = renderModal({
        isOpen: true,
        onClose: vi.fn(),
        context: sampleContext,
      });

      const primaryBtn = findElementByTagAndText(jsx, 'button', 'NachhilfeTest Gem öffnen (Sidecar)');
      await primaryBtn.props.onClick();

      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const [url, target, features] = mockWindowOpen.mock.calls[0];

      expect(url).toBe('https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing');
      expect(target).toBe('_blank');
      expect(features).toBe('width=480,height=750,resizable=yes,scrollbars=yes');
    });
  });

  describe('Requirement 3: URL Encoding & AI Pre-filled Links', () => {
    it('correctly encodes special characters, German umlauts, newlines, and emojis in ChatGPT URL', () => {
      const complexPrompt = `### 🎓 Sokratische Hilfestellung
Name: Mäxchen Müller & Co.
Hobbys: Fußball ⚽ & Gaming 🎮
Frage: Was ist 15% von 200 €? Äpfel, Öle & Übermut!`;

      const url = buildChatGPTUrl(complexPrompt);
      expect(url).toBe(`https://chatgpt.com/?q=${encodeURIComponent(complexPrompt)}`);
      expect(url).toContain('%20');
      expect(url).toContain('%C3%84pfel'); // Äpfel
      expect(url).toContain('%E2%9A%BD'); // ⚽
    });

    it('correctly encodes special characters in HuggingChat URL', () => {
      const complexPrompt = `Prompt mit 100% Umlauten: ÄÖÜäöüß & "Quotes"`;
      const url = buildHuggingChatUrl(complexPrompt);
      expect(url).toBe(`https://huggingchat.co/chat?q=${encodeURIComponent(complexPrompt)}`);
      expect(decodeURIComponent(url.replace('https://huggingchat.co/chat?q=', ''))).toBe(complexPrompt);
    });

    it('returns exact static Gemini Gem URL', () => {
      expect(buildGeminiGemUrl()).toBe(
        'https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing'
      );
    });
  });

  describe('Requirement 4: Toast Display & Visual Feedback', () => {
    it('sets toast message state on Gemini Gem button click', async () => {
      const jsx = renderModal({
        isOpen: true,
        onClose: vi.fn(),
        context: sampleContext,
      });

      const primaryBtn = findElementByTagAndText(jsx, 'button', 'NachhilfeTest Gem öffnen (Sidecar)');
      await primaryBtn.props.onClick();

      // State index 2 is toastMessage
      expect(stateStore.get(2)).toBe('Prompt in Zwischenablage kopiert & Gemini Gem geöffnet!');
    });

    it('sets toast message state on standalone Copy button click', async () => {
      const jsx = renderModal({
        isOpen: true,
        onClose: vi.fn(),
        context: sampleContext,
      });

      const copyBtn = findElementByTagAndText(jsx, 'button', 'Text kopieren');
      await copyBtn.props.onClick();

      expect(stateStore.get(2)).toBe('Prompt erfolgreich in die Zwischenablage kopiert!');
    });
  });
});
