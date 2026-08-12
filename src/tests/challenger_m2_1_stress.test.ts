import { describe, it, expect } from 'vitest';
import {
  generateGeminiPrompt,
  buildGeminiGemUrl,
  buildChatGPTUrl,
  buildHuggingChatUrl,
  PromptMode,
  AiPromptContext
} from '../utils/aiPromptGenerator';

describe('Challenger M2.1 Empirical Stress & Edge Case Verification', () => {
  describe('1. Empty Profiles and Missing Fields Boundary Testing', () => {
    it('handles undefined context, empty objects, and blank strings without throwing', () => {
      const modes: PromptMode[] = ['socratic', 'personalized', 'practice_tasks'];

      for (const mode of modes) {
        expect(() => generateGeminiPrompt(mode, {})).not.toThrow();
        const prompt = generateGeminiPrompt(mode, {});
        expect(prompt).not.toContain('undefined');
        expect(prompt).not.toContain('null');
        expect(prompt).toContain('Schüler/in');
        expect(prompt).toContain('Nicht angegeben');
      }
    });

    it('handles student profiles with whitespace-only or empty strings', () => {
      const context: AiPromptContext = {
        studentProfile: {
          name: '   ',
          customNotes: '   ',
          hobbies: ['   ', ''],
          learningPreferences: ['']
        }
      };

      const prompt = generateGeminiPrompt('socratic', context);
      expect(prompt).toContain('- **Name:** Schüler/in');
      expect(prompt).toContain('- **Anmerkungen:** Keine Besonderheiten hinterlegt');
      expect(prompt).not.toContain('undefined');
    });

    it('handles missing gradeLevel gracefully in both profile and performanceData', () => {
      const context: AiPromptContext = {
        studentProfile: { name: 'TestStudent' },
        performanceData: {}
      };
      const prompt = generateGeminiPrompt('practice_tasks', context);
      expect(prompt).toContain('- **Klassenstufe:** Nicht angegeben');
      expect(prompt).toContain('Klasse Nicht angegeben');
    });
  });

  describe('2. Missing / Extremal Performance Metrics Stress Testing', () => {
    it('handles completely missing performance metrics', () => {
      const context: AiPromptContext = {
        performanceData: undefined
      };
      const prompt = generateGeminiPrompt('socratic', context);
      expect(prompt).toContain('- **Stärken:** Ausgewogen / Keine spezifischen Stärken hinterlegt');
      expect(prompt).toContain('- **Schwächen / Ausbaubedarf:** Keine kritischen Schwachstellen registriert');
      expect(prompt).toContain('- **Themen-Genauigkeit:** Keine detaillierten Themen-Statistiken vorhanden');
    });

    it('handles floating point topicAccuracy percentages with proper rounding', () => {
      const context: AiPromptContext = {
        performanceData: {
          topicAccuracy: {
            'Algebra': 33.333333333333336,
            'Geometrie': 66.66666666666667,
            'Bruchrechnen': 0,
            'Statistik': 100
          }
        }
      };
      const prompt = generateGeminiPrompt('socratic', context);
      expect(prompt).toContain('Algebra: 33%');
      expect(prompt).toContain('Geometrie: 67%');
      expect(prompt).toContain('Bruchrechnen: 0%');
      expect(prompt).toContain('Statistik: 100%');
    });

    it('handles empty topicAccuracy map ({})', () => {
      const context: AiPromptContext = {
        performanceData: {
          topicAccuracy: {}
        }
      };
      const prompt = generateGeminiPrompt('personalized', context);
      expect(prompt).toContain('- **Themen-Genauigkeit:** Keine detaillierten Themen-Statistiken vorhanden');
    });
  });

  describe('3. Special Characters, Unicode, HTML/XSS, and Formatting Stress Testing', () => {
    it('handles quotes, newlines, slashes, HTML tags, and mathematical symbols', () => {
      const adversarialContext: AiPromptContext = {
        studentProfile: {
          name: '<script>alert("xss")</script>',
          hobbies: ['Coding & Hacking', 'Math: f(x) = x² + 1/2', 'Reading "Sci-Fi"'],
          learningPreferences: ['Audio/Visual <br/>', 'Step-by-step & examples'],
          customNotes: 'Line 1\nLine 2\r\nLine 3\t"Quoted"'
        },
        performanceData: {
          strengths: ['Geometrie (π * r²)', 'Percentages 100%'],
          weaknesses: ['Limits & Integrals -> ∫ f(x) dx'],
          topicAccuracy: {
            'Pythagoras: a² + b² = c²': 75.5
          }
        },
        questionContext: {
          subject: 'math',
          topic: 'Quadratsumme & Wurzel √x',
          level: 5,
          questionText: 'Berechne: √(a² + b²) für a="3" & b="4"',
          userAnswer: '7 (falsch: 3+4)',
          correctAnswer: '5 (korrekt: √(9+16)=5)',
          explanation: 'Wurzel aus der Summe ≠ Summe der Wurzeln!'
        }
      };

      const modes: PromptMode[] = ['socratic', 'personalized', 'practice_tasks'];

      for (const mode of modes) {
        expect(() => generateGeminiPrompt(mode, adversarialContext)).not.toThrow();
        const prompt = generateGeminiPrompt(mode, adversarialContext);

        expect(prompt).toContain('<script>alert("xss")</script>');
        expect(prompt).toContain('Math: f(x) = x² + 1/2');
        expect(prompt).toContain('Quadratsumme & Wurzel √x');
        expect(prompt).toContain('√(a² + b²) für a="3" & b="4"');
        expect(prompt).toContain('Wurzel aus der Summe ≠ Summe der Wurzeln!');
      }
    });

    it('handles unicode emojis and foreign character sets correctly', () => {
      const unicodeContext: AiPromptContext = {
        studentProfile: {
          name: 'Müller-Mayer ✨',
          hobbies: ['Fußball ⚽', 'Gaming 🎮', '日本語 🇯🇵', 'Math 🧮']
        }
      };

      const prompt = generateGeminiPrompt('personalized', unicodeContext);
      expect(prompt).toContain('Müller-Mayer ✨');
      expect(prompt).toContain('Fußball ⚽, Gaming 🎮, 日本語 🇯🇵, Math 🧮');
    });
  });

  describe('4. URL Encoding Helpers Integrity and Reversibility', () => {
    it('buildGeminiGemUrl returns exact hardcoded Gem URL', () => {
      expect(buildGeminiGemUrl()).toBe('https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing');
    });

    it('buildChatGPTUrl produces a valid URL with fully encoded query parameters', () => {
      const complexPrompt = `Line 1: Hello & Welcome!\nLine 2: 100% + 50% = 150%?\nLine 3: "Special" <Tag> & #Hashtag?`;
      const chatGptUrl = buildChatGPTUrl(complexPrompt);

      expect(chatGptUrl.startsWith('https://chatgpt.com/?q=')).toBe(true);
      
      const paramPart = chatGptUrl.substring('https://chatgpt.com/?q='.length);
      expect(paramPart).not.toContain(' ');
      expect(paramPart).not.toContain('\n');
      expect(paramPart).not.toContain('#');
      expect(paramPart).not.toContain('"');

      // Reversibility check: decoding the parameter recovers the exact original string
      const decoded = decodeURIComponent(paramPart);
      expect(decoded).toBe(complexPrompt);
    });

    it('buildHuggingChatUrl produces a valid URL with fully encoded query parameters', () => {
      const complexPrompt = `Prompt for HuggingChat: 🔥 Emoji & Special Chars: @user/test?arg=1&arg2=2`;
      const huggingUrl = buildHuggingChatUrl(complexPrompt);

      expect(huggingUrl.startsWith('https://huggingchat.co/chat?q=')).toBe(true);
      
      const paramPart = huggingUrl.substring('https://huggingchat.co/chat?q='.length);
      expect(paramPart).not.toContain(' ');
      expect(paramPart).not.toContain('&');

      const decoded = decodeURIComponent(paramPart);
      expect(decoded).toBe(complexPrompt);
    });
  });

  describe('5. Prompt Content Structural Verification Across All Modes', () => {
    it('contains all required sections in socratic mode', () => {
      const prompt = generateGeminiPrompt('socratic', {});
      expect(prompt).toContain('🎓 Sokratische Hilfestellung');
      expect(prompt).toContain('### 👤 Schüler-Profil & Persönlichkeit');
      expect(prompt).toContain('### 📊 Empirische Test-Performance');
      expect(prompt).toContain('### 📚 Kontext der aktuellen Aufgabe');
      expect(prompt).toContain('**Handlungsanweisungen:**');
      expect(prompt).toContain('Verrate NICHT sofort die richtige Lösung!');
    });

    it('contains all required sections in personalized mode', () => {
      const prompt = generateGeminiPrompt('personalized', {});
      expect(prompt).toContain('💡 Personalisierte Konzept-Erklärung');
      expect(prompt).toContain('### 👤 Schüler-Profil & Persönlichkeit');
      expect(prompt).toContain('### 📊 Empirische Test-Performance');
      expect(prompt).toContain('### 📚 Kontext der aktuellen Aufgabe');
      expect(prompt).toContain('**Handlungsanweisungen:**');
    });

    it('contains all required sections in practice_tasks mode', () => {
      const prompt = generateGeminiPrompt('practice_tasks', {});
      expect(prompt).toContain('📝 3 Neue Maßgeschneiderte Übungsaufgaben');
      expect(prompt).toContain('--- LÖSUNGEN & ERKLÄRUNGEN ---');
    });
  });
});
