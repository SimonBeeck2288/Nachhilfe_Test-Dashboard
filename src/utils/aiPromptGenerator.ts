import type { StudentProfile } from '../types/student';

export type PromptMode = 'socratic' | 'personalized' | 'practice_tasks';

export interface AiPromptContext {
  studentProfile?: Partial<StudentProfile>;
  performanceData?: {
    strengths?: string[];
    weaknesses?: string[];
    topicAccuracy?: Record<string, number>;
    gradeLevel?: number;
  };
  questionContext?: {
    subject?: 'math' | 'english';
    topic?: string;
    level?: number;
    questionText?: string;
    userAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
  };
}

export function generateGeminiPrompt(mode: PromptMode, context: AiPromptContext = {}): string {
  const profile = context.studentProfile || {};
  const perf = context.performanceData || {};
  const qContext = context.questionContext || {};

  // Data Source A: Personality
  const studentName = profile.name?.trim() || 'Schüler/in';
  const grade = profile.gradeLevel ?? perf.gradeLevel ?? 'Nicht angegeben';
  const isDirectMode = Boolean(profile.accessibilitySettings?.directQuestions);
  const isReducedSensory = Boolean(profile.accessibilitySettings?.reducedSensory);
  const hobbiesList = profile.hobbies && profile.hobbies.length > 0
    ? profile.hobbies.join(', ')
    : 'Allgemeine Interessen / Keine Hobbys angegeben';
  const preferencesList = profile.learningPreferences && profile.learningPreferences.length > 0
    ? profile.learningPreferences.join(', ')
    : 'Schritt-für-Schritt, Anschauliche Erklärungen';
  const customNotes = profile.customNotes?.trim() || 'Keine Besonderheiten hinterlegt';
  const accessibilityNote = isDirectMode || isReducedSensory
    ? `Direkt & Reizarm [D/R] aktiv (${isDirectMode ? 'sachlich-direkte und unmissverständliche Sprache ohne narrative Ausschmückung/Metaphern; ' : ''}${isReducedSensory ? 'reizreduzierte, klare Struktur' : ''})`
    : 'Standard';

  // Data Source B: Empirical Performance
  const strengthsList = perf.strengths && perf.strengths.length > 0
    ? perf.strengths.join(', ')
    : 'Ausgewogen / Keine spezifischen Stärken hinterlegt';
  const weaknessesList = perf.weaknesses && perf.weaknesses.length > 0
    ? perf.weaknesses.join(', ')
    : 'Keine kritischen Schwachstellen registriert';
  
  let topicAccuracyStr = 'Keine detaillierten Themen-Statistiken vorhanden';
  if (perf.topicAccuracy && Object.keys(perf.topicAccuracy).length > 0) {
    topicAccuracyStr = Object.entries(perf.topicAccuracy)
      .map(([topic, acc]) => `${topic}: ${Math.round(acc)}%`)
      .join(', ');
  }

  // Data Source C: Question Context
  const subjectStr = qContext.subject === 'math'
    ? 'Mathematik'
    : qContext.subject === 'english'
    ? 'Englisch'
    : 'Allgemein';
  const topicStr = qContext.topic || 'Allgemeines Thema';
  const levelStr = qContext.level !== undefined ? `Stufe ${qContext.level}` : 'Standard';
  const qText = qContext.questionText || 'Keine konkrete Aufgabenstellung vorhanden';
  const uAnswer = qContext.userAnswer || 'Keine Antwort abgegeben';
  const cAnswer = qContext.correctAnswer || 'Nicht vorgegeben';
  const expl = qContext.explanation || 'Keine zusätzliche Erklärung hinterlegt';

  // Mode Header & Role Instructions
  let modeTitle = '';
  let roleDescription = '';
  let specificInstructions = '';

  switch (mode) {
    case 'socratic':
      modeTitle = '🎓 Sokratische Hilfestellung (Schritt-für-Schritt)';
      roleDescription = 'Du bist ein geduldiger, sokratischer KI-Nachhilfelehrer für NachhilfeTest. Verrate NICHT sofort die richtige Lösung! Führe den Schüler Schritt für Schritt durch gezielte Denkanstöße und verständliche Fragen zur eigenen Erkenntnis.';
      specificInstructions = `**Handlungsanweisungen:**
1. Begrüße ${studentName} freundlich und ermutigend.
2. Analysiere die falsche Antwort ("${uAnswer}") einfühlsam und erkläre, wo der Denkfehler liegt, ohne die Lösung zu verraten.
3. Stelle genau eine überschaubare Leitfrage oder gib einen kleinen Hinweis, um den nächsten Denkschritt einzuleiten.
4. Warte auf die Antwort von ${studentName}, bevor du weiterhilfst.`;
      break;

    case 'personalized':
      modeTitle = '💡 Personalisierte Konzept-Erklärung';
      roleDescription = isDirectMode
        ? `Du bist ein sachlicher und präziser KI-Nachhilfelehrer für NachhilfeTest. Erkläre das Thema "${topicStr}" sachlich-direkt, logisch und ohne metaphorische Ausschmückung, abgestimmt auf den Lernstil (${preferencesList}).`
        : `Du bist ein begeisternder KI-Nachhilfelehrer für NachhilfeTest. Erkläre das Thema "${topicStr}" so anschaulich wie möglich. Nutze dafür bildhafte Metaphern und Beispiele aus den Hobbys des Schülers (${hobbiesList}) sowie seinen bevorzugten Lernstil (${preferencesList}).`;
      specificInstructions = isDirectMode
        ? `**Handlungsanweisungen:**
1. Erkläre die Grundregel/das Konzept hinter der Aufgabe "${qText}" sachlich-direkt und unmissverständlich.
2. Formuliere die Erklärung ohne ausschmückende Metaphern oder narrative Geschichten, sondern klar und logisch strukturiert.
3. Zeige nachvollziehbar auf, warum die Antwort "${uAnswer}" nicht stimmt und wie man systematisch zur richtigen Lösung ("${cAnswer}") gelangt.`
        : `**Handlungsanweisungen:**
1. Erkläre die Grundregel/das Konzept hinter der Aufgabe "${qText}" verständlich und anschaulich.
2. Baue eine konkrete Analogie oder Geschichte ein, die direkt an die Hobbys (${hobbiesList}) anknüpft.
3. Zeige nachvollziehbar auf, warum die Antwort "${uAnswer}" nicht stimmt und wie man systematisch zur richtigen Lösung ("${cAnswer}") gelangt.`;
      break;

    case 'practice_tasks':
      modeTitle = '📝 3 Neue Maßgeschneiderte Übungsaufgaben';
      roleDescription = isDirectMode
        ? `Du bist ein sachlicher KI-Aufgabenersteller für NachhilfeTest. Erstelle genau 3 sachlich-direkte Übungsaufgaben zum Thema "${topicStr}" (${subjectStr}, ${levelStr}) für Klasse ${grade}.`
        : `Du bist ein kreativer KI-Aufgabenersteller für NachhilfeTest. Erstelle genau 3 neue Übungsaufgaben zum Thema "${topicStr}" (${subjectStr}, ${levelStr}) für Klasse ${grade}.`;
      specificInstructions = isDirectMode
        ? `**Handlungsanweisungen:**
1. Erstelle genau 3 abwechslungsreiche Übungsaufgaben (Aufgabe 1: Basisverständnis, Aufgabe 2: Mittlere Schwierigkeit, Aufgabe 3: Anwendungs-/Transferaufgabe).
2. Formuliere die Aufgaben als sachlich-direkte Fragestellungen ohne narrative/metaphorische Einkleidung.
3. Formatiere die 3 Aufgaben übersichtlich.
4. Füge am Ende unter einer deutlichen Überschrift "--- LÖSUNGEN & ERKLÄRUNGEN ---" die vollständigen Musterlösungen inklusive Erklärungen bei.`
        : `**Handlungsanweisungen:**
1. Erstelle genau 3 abwechslungsreiche Übungsaufgaben (Aufgabe 1: Basisverständnis, Aufgabe 2: Mittlere Schwierigkeit, Aufgabe 3: Anwendungs-/Transferaufgabe).
2. Flechte Begriffe, Namen oder Szenarien aus den Hobbys des Schülers (${hobbiesList}) in die Aufgabenstellungen ein.
3. Formatiere die 3 Aufgaben übersichtlich.
4. Füge am Ende unter einer deutlichen Überschrift "--- LÖSUNGEN & ERKLÄRUNGEN ---" die vollständigen Musterlösungen inklusive Erklärungen bei.`;
      break;
  }

  return `### ${modeTitle}

**Rolle:** ${roleDescription}

---

### 👤 Schüler-Profil & Persönlichkeit
- **Name:** ${studentName}
- **Klassenstufe:** ${grade}
- **Lern- & Kommunikationsmodus:** ${accessibilityNote}
- **Hobbys & Interessen:** ${hobbiesList}
- **Bevorzugte Lernstile:** ${preferencesList}
- **Anmerkungen:** ${customNotes}

### 📊 Empirische Test-Performance
- **Stärken:** ${strengthsList}
- **Schwächen / Ausbaubedarf:** ${weaknessesList}
- **Themen-Genauigkeit:** ${topicAccuracyStr}

### 📚 Kontext der aktuellen Aufgabe
- **Fach:** ${subjectStr}
- **Thema:** ${topicStr} (${levelStr})
- **Aufgabenstellung:** ${qText}
- **Falsche Antwort des Schülers:** ${uAnswer}
- **Richtige Lösung:** ${cAnswer}
- **Erklärung / Hinweistext:** ${expl}

---

${specificInstructions}
`;
}

export function buildGeminiGemUrl(): string {
  return 'https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing';
}

export function buildChatGPTUrl(prompt: string): string {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export function buildHuggingChatUrl(prompt: string): string {
  return `https://huggingchat.co/chat?q=${encodeURIComponent(prompt)}`;
}
