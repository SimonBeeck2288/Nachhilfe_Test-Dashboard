import { describe, it, expect } from 'vitest';
import {
  generateGeminiPrompt,
  buildGeminiGemUrl,
  buildChatGPTUrl,
  buildHuggingChatUrl,
  PromptMode,
  AiPromptContext
} from '../utils/aiPromptGenerator';

describe('aiPromptGenerator', () => {
  const fullContext: AiPromptContext = {
    studentProfile: {
      id: 'student-1',
      name: 'Felix',
      gradeLevel: 7,
      hobbies: ['Gaming', 'Fußball', 'Minecraft'],
      learningPreferences: ['Mit Hobbys erklären', 'Visuell'],
      customNotes: 'Braucht Aufmunterung bei Mathe',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    performanceData: {
      strengths: ['Geometrie', 'Leseverständnis'],
      weaknesses: ['Bruchrechnung', 'Past Tense'],
      topicAccuracy: {
        'Bruchrechnung': 45,
        'Geometrie': 85
      },
      gradeLevel: 7
    },
    questionContext: {
      subject: 'math',
      topic: 'Bruchrechnung',
      level: 3,
      questionText: 'Was ist 1/4 + 2/4?',
      userAnswer: '3/8',
      correctAnswer: '3/4',
      explanation: 'Bei gleichen Nennern werden nur die Zähler addiert.'
    }
  };

  describe('generateGeminiPrompt - Modes', () => {
    it('generates a valid socratic prompt mode', () => {
      const mode: PromptMode = 'socratic';
      const prompt = generateGeminiPrompt(mode, fullContext);
      expect(prompt).toContain('🎓 Sokratische Hilfestellung');
      expect(prompt).toContain('Verrate NICHT sofort die richtige Lösung!');
      expect(prompt).toContain('Felix');
      expect(prompt).toContain('Bruchrechnung');
      expect(prompt).toContain('3/8');
    });

    it('generates a valid personalized prompt mode', () => {
      const prompt = generateGeminiPrompt('personalized', fullContext);
      expect(prompt).toContain('💡 Personalisierte Konzept-Erklärung');
      expect(prompt).toContain('Gaming, Fußball, Minecraft');
      expect(prompt).toContain('Mit Hobbys erklären, Visuell');
      expect(prompt).toContain('3/4');
    });

    it('generates a valid practice_tasks prompt mode', () => {
      const prompt = generateGeminiPrompt('practice_tasks', fullContext);
      expect(prompt).toContain('📝 3 Neue Maßgeschneiderte Übungsaufgaben');
      expect(prompt).toContain('Erstelle genau 3 neue Übungsaufgaben');
      expect(prompt).toContain('--- LÖSUNGEN & ERKLÄRUNGEN ---');
    });
  });

  describe('Data Source Ingestion', () => {
    it('correctly injects personality data (hobbies, preferences, notes)', () => {
      const prompt = generateGeminiPrompt('socratic', fullContext);
      expect(prompt).toContain('- **Name:** Felix');
      expect(prompt).toContain('- **Klassenstufe:** 7');
      expect(prompt).toContain('- **Hobbys & Interessen:** Gaming, Fußball, Minecraft');
      expect(prompt).toContain('- **Bevorzugte Lernstile:** Mit Hobbys erklären, Visuell');
      expect(prompt).toContain('- **Anmerkungen:** Braucht Aufmunterung bei Mathe');
    });

    it('correctly injects empirical performance data', () => {
      const prompt = generateGeminiPrompt('socratic', fullContext);
      expect(prompt).toContain('- **Stärken:** Geometrie, Leseverständnis');
      expect(prompt).toContain('- **Schwächen / Ausbaubedarf:** Bruchrechnung, Past Tense');
      expect(prompt).toContain('- **Themen-Genauigkeit:** Bruchrechnung: 45%, Geometrie: 85%');
    });

    it('correctly injects question context for English subject', () => {
      const englishContext: AiPromptContext = {
        ...fullContext,
        questionContext: {
          subject: 'english',
          topic: 'Simple Past',
          level: 2,
          questionText: 'Yesterday I ___ (go) to school.',
          userAnswer: 'goed',
          correctAnswer: 'went',
          explanation: 'The past tense of go is went.'
        }
      };
      const prompt = generateGeminiPrompt('socratic', englishContext);
      expect(prompt).toContain('- **Fach:** Englisch');
      expect(prompt).toContain('- **Thema:** Simple Past (Stufe 2)');
      expect(prompt).toContain('Yesterday I ___ (go) to school.');
      expect(prompt).toContain('goed');
      expect(prompt).toContain('went');
    });
  });

  describe('Fallback Handling for Missing / Empty Data', () => {
    it('handles completely empty context object gracefully without throwing', () => {
      const prompt = generateGeminiPrompt('socratic', {});
      expect(prompt).toContain('- **Name:** Schüler/in');
      expect(prompt).toContain('- **Klassenstufe:** Nicht angegeben');
      expect(prompt).toContain('- **Hobbys & Interessen:** Allgemeine Interessen / Keine Hobbys angegeben');
      expect(prompt).toContain('- **Bevorzugte Lernstile:** Schritt-für-Schritt, Anschauliche Erklärungen');
      expect(prompt).toContain('- **Anmerkungen:** Keine Besonderheiten hinterlegt');
      expect(prompt).toContain('- **Stärken:** Ausgewogen / Keine spezifischen Stärken hinterlegt');
      expect(prompt).toContain('- **Schwächen / Ausbaubedarf:** Keine kritischen Schwachstellen registriert');
      expect(prompt).toContain('- **Themen-Genauigkeit:** Keine detaillierten Themen-Statistiken vorhanden');
      expect(prompt).toContain('- **Fach:** Allgemein');
    });

    it('handles partial student profile with empty hobbies array', () => {
      const partialContext: AiPromptContext = {
        studentProfile: {
          name: 'Anna',
          hobbies: []
        }
      };
      const prompt = generateGeminiPrompt('personalized', partialContext);
      expect(prompt).toContain('- **Name:** Anna');
      expect(prompt).toContain('- **Hobbys & Interessen:** Allgemeine Interessen / Keine Hobbys angegeben');
    });

    it('uses performance grade level if profile grade level is missing', () => {
      const context: AiPromptContext = {
        studentProfile: { name: 'Ben' },
        performanceData: { gradeLevel: 5 }
      };
      const prompt = generateGeminiPrompt('socratic', context);
      expect(prompt).toContain('- **Klassenstufe:** 5');
    });
  });

  describe('URL Helper Functions', () => {
    it('buildGeminiGemUrl returns exact Gemini Gem link', () => {
      const url = buildGeminiGemUrl();
      expect(url).toBe('https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing');
    });

    it('buildChatGPTUrl encodes prompt parameter correctly', () => {
      const prompt = 'Erkläre Mathe & Geometrie';
      const url = buildChatGPTUrl(prompt);
      expect(url).toBe(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`);
      expect(url).toContain('Erkl%C3%A4re%20Mathe%20%26%20Geometrie');
    });

    it('buildHuggingChatUrl encodes prompt parameter correctly', () => {
      const prompt = 'Test Prompt 123!';
      const url = buildHuggingChatUrl(prompt);
      expect(url).toBe(`https://huggingchat.co/chat?q=${encodeURIComponent(prompt)}`);
      expect(url).toContain('Test%20Prompt%20123!');
    });
  });
});
