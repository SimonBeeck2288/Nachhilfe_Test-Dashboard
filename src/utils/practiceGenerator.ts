import type { PracticeGeneratorConfig, PracticeSheet, GeneratedExerciseItem, TopicConfig } from '../types/practice';
import { englishQuestions } from '../data/questions';
import { getSessionsByStudentId } from './sessionHistory';

/**
 * Seedable PRNG using Mulberry32 algorithm.
 */
export function createPRNG(seed: number): () => number {
  let s = seed >>> 0;
  return function rng(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function getRandomChoice<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleArray<T>(rng: () => number, arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculates a student's accuracy percentage (0-100) for a given topic
 * based on session history in localStorage/sessionHistory.
 */
export function calculateTopicAccuracy(studentId: string, topicId: string): number {
  if (!studentId || !topicId) return 100;
  const sessions = getSessionsByStudentId(studentId);
  if (sessions.length === 0) return 100;

  const targetTopic = topicId.trim().toLowerCase();
  let total = 0;
  let correct = 0;

  sessions.forEach((session) => {
    let breakdownFound = false;

    if (Array.isArray(session.topicBreakdown) && session.topicBreakdown.length > 0) {
      session.topicBreakdown.forEach((item) => {
        if (item.topic && item.topic.trim().toLowerCase() === targetTopic) {
          total += item.total || 0;
          correct += item.correct || 0;
          breakdownFound = true;
        }
      });
    } else if (session.topicBreakdown && typeof session.topicBreakdown === 'object') {
      Object.values(session.topicBreakdown).forEach((item) => {
        if (item.topic && item.topic.trim().toLowerCase() === targetTopic) {
          total += item.total || 0;
          correct += item.correct || 0;
          breakdownFound = true;
        }
      });
    }

    if (!breakdownFound && session.answers && session.answers.length > 0) {
      session.answers.forEach((ans) => {
        if (ans.topic && ans.topic.trim().toLowerCase() === targetTopic) {
          total += 1;
          if (ans.isCorrect) correct += 1;
        }
      });
    }
  });

  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

// Common pools for Math dynamic story variations
const NAMES = ['Tim', 'Lisa', 'Jonas', 'Sarah', 'Max', 'Emma', 'Felix', 'Mia', 'Lukas', 'Sophie', 'Leon', 'Anna', 'Noah', 'Mia'];
const MATH_ITEMS = ['Murmeln', 'Kekse', 'Äpfel', 'Stifte', 'Bücher', 'Münzen', 'Sticker', 'Bausteine', 'Sammelkarten'];

/**
 * Math Dynamic Variation Engine
 */
function generateMathVariation(
  rng: () => number,
  topicConfig: TopicConfig,
  exerciseIndex: number
): GeneratedExerciseItem {
  const level = Math.min(Math.max(topicConfig.targetLevel || 1, 1), 7);
  const topicName = topicConfig.topicName || topicConfig.topicId;
  const topicId = topicConfig.topicId;
  const id = `ex_math_${topicId}_l${level}_${exerciseIndex}`;

  let questionText = '';
  let directText = '';
  let correctAnswer = '';
  let explanation = '';
  let mascotTip = '';
  let options: string[] | undefined;
  let storyContext = '';
  let diagramData: Record<string, unknown> | undefined;
  let targetFraction: { numerator: number; denominator: number } | undefined;

  const topicLower = topicName.toLowerCase();

  if (topicLower.includes('addition') || (level === 1 && topicLower.includes('zahl'))) {
    const name = getRandomChoice(rng, NAMES);
    const item1 = getRandomChoice(rng, ['rote', 'blaue', 'grüne', 'gelbe']);
    const item2 = getRandomChoice(rng, ['rote', 'blaue', 'grüne', 'gelbe']);
    const maxVal = level === 1 ? 15 : level === 2 ? 50 : 100;
    const a = getRandomInt(rng, 3, maxVal);
    const b = getRandomInt(rng, 3, maxVal);
    storyContext = `${name} sammelt bunte Gegenstände.`;
    questionText = `${name} hat ${a} ${item1} und bekommt ${b} ${item2} dazu. Wie viele hat ${name} insgesamt?`;
    directText = `Berechne: ${a} + ${b} = ?`;
    correctAnswer = String(a + b);
    explanation = `${a} + ${b} = ${a + b}`;
    mascotTip = 'Rechne die beiden Zahlen zusammen.';
  } else if (topicLower.includes('subtraktion')) {
    const name = getRandomChoice(rng, NAMES);
    const item = getRandomChoice(rng, MATH_ITEMS);
    const maxVal = level === 1 ? 20 : level === 2 ? 60 : 100;
    const a = getRandomInt(rng, 10, maxVal);
    const b = getRandomInt(rng, 1, a - 1); // guarantee positive integer
    storyContext = `Teilen und Abgeben von Dingen.`;
    questionText = `${name} hat ${a} ${item}. Davon werden ${b} ${item} abgegeben. Wie viele bleiben übrig?`;
    directText = `Berechne: ${a} - ${b} = ?`;
    correctAnswer = String(a - b);
    explanation = `${a} - ${b} = ${a - b}`;
    mascotTip = 'Ziehe die kleiner Zahl von der größeren Zahl ab.';
  } else if (topicLower.includes('multiplikation')) {
    const name = getRandomChoice(rng, NAMES);
    const maxFactor = level <= 2 ? 10 : 12;
    const a = getRandomInt(rng, 2, maxFactor);
    const b = getRandomInt(rng, 2, maxFactor);
    storyContext = `${name} kauft mehreren Packungen im Geschäft.`;
    questionText = `${name} kauft ${a} Packungen mit jeweils ${b} Stiften. Wie viele Stifte sind das insgesamt?`;
    directText = `Berechne: ${a} × ${b} = ?`;
    correctAnswer = String(a * b);
    explanation = `${a} × ${b} = ${a * b}`;
    mascotTip = 'Nutze das Einmaleins.';
  } else if (topicLower.includes('division')) {
    const name = getRandomChoice(rng, NAMES);
    const divisor = getRandomInt(rng, 2, 10);
    const ans = getRandomInt(rng, 2, 10);
    const total = divisor * ans; // guarantee positive integer result
    storyContext = `${name} verteilt Gewinne gleichmäßig.`;
    questionText = `${total} Kekse werden gleichmäßig auf ${divisor} Kinder verteilt. Wie viele Kekse bekommt jedes Kind?`;
    directText = `Berechne: ${total} ÷ ${divisor} = ?`;
    correctAnswer = String(ans);
    explanation = `${total} ÷ ${divisor} = ${ans}`;
    mascotTip = `Überlege: Welche Zahl mal ${divisor} ergibt ${total}?`;
  } else if (topicLower.includes('bruch')) {
    const denOptions = [2, 4, 5, 8, 10];
    const den = getRandomChoice(rng, denOptions);
    const num = getRandomInt(rng, 1, den - 1);
    if (level >= 3 && getRandomInt(rng, 1, 2) === 1) {
      questionText = `Markiere auf dem Kreis genau ${num} von ${den} Stücken:`;
      directText = `Markiere auf dem Kreis genau ${num} von ${den} Stücken (${num}/${den}):`;
      correctAnswer = `${num}/${den}`;
      targetFraction = { numerator: num, denominator: den };
      explanation = `${num} von ${den} Stücken entspricht dem Bruch ${num}/${den}.`;
      mascotTip = 'Zähle die auszuwählenden Stücke ab.';
    } else {
      const dec = (num / den).toString().replace('.', ',');
      questionText = `Wandle den Bruch ${num}/${den} in eine Dezimalzahl um:`;
      directText = `Wandle den Bruch ${num}/${den} in eine Dezimalzahl um:`;
      correctAnswer = dec;
      explanation = `${num} ÷ ${den} = ${dec}`;
      mascotTip = 'Teile den Zähler durch den Nenner.';
    }
  } else if (topicLower.includes('dezimal')) {
    const a = getRandomInt(rng, 1, 89) / 10;
    const b = getRandomInt(rng, 1, 89) / 10;
    const sum = (a + b).toFixed(1).replace('.', ',');
    questionText = `Berechne: ${a.toFixed(1).replace('.', ',')} € + ${b.toFixed(1).replace('.', ',')} € = ?`;
    directText = `Berechne: ${a.toFixed(1).replace('.', ',')} + ${b.toFixed(1).replace('.', ',')} = ?`;
    correctAnswer = sum;
    explanation = `${a.toFixed(1).replace('.', ',')} + ${b.toFixed(1).replace('.', ',')} = ${sum} €`;
    mascotTip = 'Rechne zuerst die Euros, dann die Cents zusammen.';
  } else if (topicLower.includes('prozent')) {
    const perc = getRandomChoice(rng, [10, 20, 25, 30, 50, 75]);
    const val = getRandomInt(rng, 2, 20) * 10;
    const ans = (perc * val) / 100;
    storyContext = 'Rabatt-Aktion im Ausverkauf.';
    questionText = `Ein Artikel kostet ${val} €. Es gibt ${perc}% Rabatt. Wie viel Euro spart man?`;
    directText = `Berechne ${perc}% von ${val} € (in Euro):`;
    correctAnswer = String(ans);
    explanation = `${perc}% von ${val} € = (${perc} / 100) × ${val} = ${ans} €`;
    mascotTip = `Teile ${val} durch 100 und nimm das Ergebnis mal ${perc}.`;
  } else if (topicLower.includes('gleichung')) {
    if (level <= 4) {
      const a = getRandomInt(rng, 2, 8);
      const x = getRandomInt(rng, 2, 10);
      const c = a * x;
      questionText = `Löse nach x auf: ${a}x = ${c}`;
      directText = `Löse die Gleichung nach x auf: ${a}x = ${c}`;
      correctAnswer = String(x);
      explanation = `Teile beide Seiten durch ${a}: x = ${c} ÷ ${a} = ${x}`;
      mascotTip = 'Isoliere x durch Division.';
    } else {
      const a = getRandomInt(rng, 4, 9);
      const c = getRandomInt(rng, 1, a - 1);
      const x = getRandomInt(rng, 2, 9);
      const b = getRandomInt(rng, 1, 10);
      const d = (a - c) * x - b;
      const signD = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
      questionText = `Löse nach x auf: ${a}x - ${b} = ${c}x ${signD}`;
      directText = `Löse die Gleichung nach x auf: ${a}x - ${b} = ${c}x ${signD}`;
      correctAnswer = String(x);
      explanation = `Bringe alle x-Terme auf eine Seite und Zahlen auf die andere Seite: x = ${x}`;
      mascotTip = 'Ziehe den kleineren x-Term von beiden Seiten ab.';
    }
  } else if (topicLower.includes('negativ')) {
    const a = getRandomInt(rng, 2, 15);
    const b = getRandomInt(rng, 2, 20);
    questionText = `Berechne: (-${a}) + ${b} = ?`;
    directText = `Berechne: (-${a}) + ${b} = ?`;
    correctAnswer = String(-a + b);
    explanation = `(-${a}) + ${b} = ${-a + b}`;
    mascotTip = 'Stelle dir ein Thermometer vor.';
  } else if (topicLower.includes('geometrie')) {
    if (level <= 2) {
      const side = getRandomInt(rng, 2, 12);
      questionText = `Ein quadratisches Beet hat eine Seitenlänge von ${side} cm. Wie groß ist der Umfang in cm?`;
      directText = `Berechne den Umfang eines Quadrats mit Seitenlänge a = ${side} cm in cm:`;
      correctAnswer = String(side * 4);
      explanation = `Umfang = 4 × ${side} cm = ${side * 4} cm`;
      diagramData = { shape: 'rectangle', labels: { a: side, b: side } };
      mascotTip = 'Der Umfang eines Quadrat ist 4-mal die Seitenlänge.';
    } else if (level === 3) {
      const l = getRandomInt(rng, 3, 10);
      const w = getRandomInt(rng, 2, 8);
      questionText = `Ein Rechteck ist ${l} cm lang und ${w} cm breit. Wie groß ist der Flächeninhalt in cm²?`;
      directText = `Berechne den Flächeninhalt eines Rechtecks mit Länge ${l} cm und Breite ${w} cm in cm²:`;
      correctAnswer = String(l * w);
      explanation = `Flächeninhalt = Länge × Breite = ${l} × ${w} = ${l * w} cm²`;
      diagramData = { shape: 'rectangle', labels: { a: l, b: w } };
      mascotTip = 'Multipliziere Länge mit Breite.';
    } else if (level === 4) {
      const g = getRandomInt(rng, 2, 6) * 2; // even
      const h = getRandomInt(rng, 3, 9);
      questionText = `Ein Dreieck hat Grundseite g = ${g} cm und Höhe h = ${h} cm. Wie groß ist der Flächeninhalt in cm²?`;
      directText = `Berechne den Flächeninhalt eines Dreiecks mit Grundseite g = ${g} cm und Höhe h = ${h} cm in cm²:`;
      correctAnswer = String((g * h) / 2);
      explanation = `Flächeninhalt = (g × h) ÷ 2 = (${g} × ${h}) ÷ 2 = ${(g * h) / 2} cm²`;
      diagramData = { shape: 'triangle', labels: { g, h } };
      mascotTip = 'Formel: A = (g × h) ÷ 2';
    } else if (level === 5) {
      const g = getRandomInt(rng, 4, 10);
      const h = getRandomInt(rng, 3, 8);
      questionText = `Ein Parallelogramm hat Grundseite g = ${g} cm und Höhe h = ${h} cm. Wie groß ist der Flächeninhalt in cm²?`;
      directText = `Berechne den Flächeninhalt eines Parallelogramms mit Grundseite g = ${g} cm und Höhe h = ${h} cm in cm²:`;
      correctAnswer = String(g * h);
      explanation = `Flächeninhalt = g × h = ${g} × ${h} = ${g * h} cm²`;
      diagramData = { shape: 'parallelogram', labels: { g, h } };
      mascotTip = 'A = g × h';
    } else if (level === 6) {
      const a = getRandomInt(rng, 2, 10);
      questionText = `Ein Würfel hat Kantenlänge a = ${a} cm. Wie groß ist das Volumen V in cm³?`;
      directText = `Berechne das Volumen eines Würfels mit Kantenlänge a = ${a} cm in cm³:`;
      correctAnswer = String(a * a * a);
      explanation = `Volumen = a³ = ${a} × ${a} × ${a} = ${a * a * a} cm³`;
      diagramData = { shape: 'cube', labels: { a } };
      mascotTip = 'V = a × a × a';
    } else {
      const pythTriples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
      const triple = getRandomChoice(rng, pythTriples);
      questionText = `In einem rechtwinkligen Dreieck sind Katheten a = ${triple[0]} cm und b = ${triple[1]} cm. Wie lang ist die Hypotenuse c in cm?`;
      directText = `Berechne die Hypotenuse c im rechtwinkligen Dreieck mit a = ${triple[0]} cm und b = ${triple[1]} cm in cm:`;
      correctAnswer = String(triple[2]);
      explanation = `c = √(a² + b²) = √(${triple[0]}² + ${triple[1]}²) = ${triple[2]} cm`;
      diagramData = { shape: 'right-triangle', labels: { a: triple[0], b: triple[1], c: triple[2] } };
      mascotTip = 'Wende den Satz des Pythagoras an: a² + b² = c²';
    }
  } else if (topicLower.includes('potenz')) {
    const base = getRandomInt(rng, 2, 12);
    questionText = `Berechne den Wert der Potenz ${base}²:`;
    directText = `Berechne: ${base}² = ?`;
    correctAnswer = String(base * base);
    explanation = `${base}² = ${base} × ${base} = ${base * base}`;
    mascotTip = 'Multipliziere die Zahl mit sich selbst.';
  } else if (topicLower.includes('term')) {
    const a = getRandomInt(rng, 2, 9);
    const b = getRandomInt(rng, 2, 9);
    questionText = `Fasse zusammen: ${a}x + ${b}x`;
    directText = `Fasse zusammen: ${a}x + ${b}x = ?`;
    correctAnswer = `${a + b}x`;
    explanation = `(${a} + ${b})x = ${a + b}x`;
    mascotTip = 'Addiere die Koeffizienten der gleichen Variablen.';
  } else if (topicLower.includes('binom')) {
    const a = getRandomInt(rng, 1, 9);
    const correct = `x² + ${2 * a}x + ${a * a}`;
    const opts = shuffleArray(rng, [
      correct,
      `x² + ${a * a}`,
      `x² + ${a}x + ${a * a}`,
      `2x + ${2 * a}`
    ]);
    questionText = `Wende die 1. Binomische Formel an: (x + ${a})²`;
    directText = `Wende die 1. Binomische Formel an: (x + ${a})²`;
    correctAnswer = correct;
    options = opts;
    explanation = `(a + b)² = a² + 2ab + b² => x² + 2·${a}·x + ${a}² = ${correct}`;
    mascotTip = 'Erste binomische Formel: (a+b)² = a² + 2ab + b²';
  } else if (topicLower.includes('statistik')) {
    const x = getRandomInt(rng, 2, 10);
    const y = getRandomInt(rng, 2, 10);
    const targetAvg = getRandomInt(rng, 5, 12);
    const z = targetAvg * 3 - x - y;
    questionText = `Berechne den Mittelwert (Durchschnitt) von ${x}, ${y} und ${z}:`;
    directText = `Berechne den Mittelwert (Durchschnitt) von ${x}, ${y} und ${z}:`;
    correctAnswer = String(targetAvg);
    explanation = `(${x} + ${y} + ${z}) ÷ 3 = ${targetAvg * 3} ÷ 3 = ${targetAvg}`;
    mascotTip = 'Addiere alle Werte und teile durch deren Anzahl.';
  } else {
    // Default arithmetic fallback scaled for level
    const a = getRandomInt(rng, 2, level * 10);
    const b = getRandomInt(rng, 2, level * 5);
    questionText = `Berechne: ${a} + ${b} = ?`;
    directText = `Berechne: ${a} + ${b} = ?`;
    correctAnswer = String(a + b);
    explanation = `${a} + ${b} = ${a + b}`;
    mascotTip = 'Addiere die beiden Zahlen.';
  }

  return {
    id,
    originalQuestionId: `math_gen_${topicId}_l${level}`,
    subject: 'math',
    topicId,
    topicName,
    level,
    questionText,
    directText: directText || undefined,
    options,
    correctAnswer,
    explanation,
    mascotTip,
    isVariation: true,
    storyContext: storyContext || undefined,
    diagramData,
    targetFraction,
  };
}

/**
 * English Dynamic Variation Engine
 */
function generateEnglishVariation(
  rng: () => number,
  topicConfig: TopicConfig,
  exerciseIndex: number,
  usedStaticIds: Set<string>
): GeneratedExerciseItem {
  const level = Math.min(Math.max(topicConfig.targetLevel || 1, 1), 7);
  const topicName = topicConfig.topicName || topicConfig.topicId;
  const topicId = topicConfig.topicId;
  const topicLower = topicName.toLowerCase();

  // Try to find matching static english question
  const matchingStatic = englishQuestions.filter((q) => {
    const qTopicLower = q.topic.toLowerCase();
    const matchTopic = qTopicLower === topicLower || qTopicLower.includes(topicLower) || topicLower.includes(qTopicLower);
    return matchTopic && q.level === level && !usedStaticIds.has(q.id);
  });

  if (matchingStatic.length > 0) {
    const chosen = getRandomChoice(rng, matchingStatic);
    usedStaticIds.add(chosen.id);

    // Apply light variation (name swap, option shuffle)
    let text = chosen.text;
    let correctAnswer = Array.isArray(chosen.correctAnswer) ? chosen.correctAnswer[0] : chosen.correctAnswer;
    let options = chosen.options ? shuffleArray(rng, chosen.options) : undefined;

    // Proper name substitution if present
    const nameMap: Record<string, string> = {
      'Tom': getRandomChoice(rng, ['Alex', 'Ben', 'David', 'Liam']),
      'Sarah': getRandomChoice(rng, ['Emma', 'Sophia', 'Olivia', 'Mia']),
      'Emma': getRandomChoice(rng, ['Chloe', 'Ella', 'Hannah', 'Grace']),
      'Clara': getRandomChoice(rng, ['Emily', 'Sophie', 'Lucy', 'Zoe']),
      'Tim': getRandomChoice(rng, ['Noah', 'Jacob', 'Oliver', 'Ethan']),
    };

    Object.entries(nameMap).forEach(([oldName, newName]) => {
      if (text.includes(oldName)) {
        text = text.replace(new RegExp(oldName, 'g'), newName);
      }
    });

    return {
      id: `ex_eng_${chosen.id}_${exerciseIndex}`,
      originalQuestionId: chosen.id,
      subject: 'english',
      topicId,
      topicName,
      level: chosen.level,
      questionText: text,
      directText: chosen.directText || text,
      directStoryContext: chosen.directStoryContext,
      options,
      correctAnswer,
      explanation: chosen.explanation || `Die richtige Antwort ist "${correctAnswer}".`,
      mascotTip: chosen.didYouKnowHint || 'Achte auf die Grammatikregeln und Signalwörter.',
      isVariation: false,
      storyContext: chosen.storyContext,
      dragItems: chosen.dragItems ? shuffleArray(rng, chosen.dragItems) : undefined,
      matchingPairs: chosen.matchingPairs,
    };
  }

  // If no static question remains, generate procedural English variation
  const id = `ex_eng_${topicId}_l${level}_var_${exerciseIndex}`;

  let questionText = '';
  let correctAnswer = '';
  let options: string[] | undefined;
  let explanation = '';
  let mascotTip = '';

  if (topicLower.includes('vokabel') || topicLower.includes('zahlen')) {
    const vocabPoolLevel1: [string, string][] = [
      ['dog', 'Hund'], ['cat', 'Katze'], ['apple', 'Apfel'], ['book', 'Buch'],
      ['house', 'Haus'], ['school', 'Schule'], ['water', 'Wasser'], ['car', 'Auto'],
      ['blue', 'blau'], ['red', 'rot'], ['five', '5'], ['ten', '10']
    ];
    const vocabPoolLevel2: [string, string][] = [
      ['breakfast', 'Frühstück'], ['children', 'Kinder'], ['mice', 'Mäuse'],
      ['feet', 'Füße'], ['summer', 'Sommer'], ['garden', 'Garten']
    ];
    const vocabPoolLevel3: [string, string][] = [
      ['journey', 'Reise'], ['decision', 'Entscheidung'], ['dangerous', 'gefährlich'],
      ['weather', 'Wetter'], ['adventure', 'Abenteuer']
    ];
    const vocabPoolLevel4Plus: [string, string][] = [
      ['environment', 'Umwelt'], ['opportunity', 'Gelegenheit'], ['challenge', 'Herausforderung'],
      ['sustainability', 'Nachhaltigkeit'], ['virtue', 'Tugend'], ['equilibrium', 'Gleichgewicht']
    ];

    const pool = level <= 1 ? vocabPoolLevel1 : level === 2 ? vocabPoolLevel2 : level === 3 ? vocabPoolLevel3 : vocabPoolLevel4Plus;
    const pair = getRandomChoice(rng, pool);

    if (getRandomInt(rng, 1, 2) === 1) {
      questionText = `Was heißt "${pair[1]}" auf Englisch?`;
      correctAnswer = pair[0];
    } else {
      questionText = `Was heißt "${pair[0]}" auf Deutsch?`;
      correctAnswer = pair[1];
    }
    explanation = `"${pair[0]}" bedeutet "${pair[1]}".`;
    mascotTip = 'Merke dir diese Vokabel gut.';
  } else if (topicLower.includes('zeit')) {
    const verbIrregulars: [string, string, string][] = [
      ['go', 'went', 'gone'],
      ['see', 'saw', 'seen'],
      ['have', 'had', 'had'],
      ['write', 'wrote', 'written'],
      ['take', 'took', 'taken'],
      ['eat', 'ate', 'eaten'],
    ];
    const v = getRandomChoice(rng, verbIrregulars);
    questionText = `Wie lautet die Vergangenheitsform (Past Simple) von "${v[0]}"?`;
    correctAnswer = v[1];
    const dist1 = `${v[0]}ed`;
    const dist2 = v[2];
    options = shuffleArray(rng, [correctAnswer, dist1, dist2]);
    explanation = `Das Verb "${v[0]}" ist unregelmäßig: ${v[0]} - ${v[1]} - ${v[2]}.`;
    mascotTip = 'Lerne die unregelmäßigen Verben auswendig.';
  } else if (topicLower.includes('präposition')) {
    const prepPool: [string, string, string[]][] = [
      ['The book is ___ the table.', 'on', ['in', 'on', 'at']],
      ['She is sitting ___ the chair.', 'on', ['on', 'under', 'at']],
      ['We meet ___ 5 o\'clock.', 'at', ['in', 'on', 'at']],
      ['He lives ___ Berlin.', 'in', ['in', 'on', 'at']],
      ['The cat is sleeping ___ the bed.', 'under', ['under', 'over', 'on']],
    ];
    const item = getRandomChoice(rng, prepPool);
    questionText = item[0];
    correctAnswer = item[1];
    options = shuffleArray(rng, item[2]);
    explanation = `Die passende Präposition lautet "${correctAnswer}".`;
    mascotTip = 'Achte auf die Präpositionen bei Zeit- und Ortsangaben.';
  } else {
    // Default grammar rule variation
    if (level <= 2) {
      const subject = getRandomChoice(rng, ['He', 'She', 'It']);
      const verb = getRandomChoice(rng, ['reads', 'plays', 'likes', 'runs']);
      questionText = `Ergänze die richtige Form: "${subject} ___ every day."`;
      correctAnswer = verb;
      options = shuffleArray(rng, [verb, verb.replace(/s$/, ''), `${verb}ing`]);
      explanation = 'He/she/it – das "s" muss mit!';
      mascotTip = 'Denke an die Regel: He, she, it, das "s" muss mit!';
    } else {
      const pronouns: [string, string, string[]][] = [
        ['This is Alex. Look at ___.', 'him', ['him', 'he', 'his']],
        ['This is Emma. Look at ___.', 'her', ['her', 'she', 'hers']],
        ['These are my friends. Look at ___.', 'them', ['them', 'they', 'their']],
      ];
      const p = getRandomChoice(rng, pronouns);
      questionText = p[0];
      correctAnswer = p[1];
      options = shuffleArray(rng, p[2]);
      explanation = `Das Objektpronomen ist "${correctAnswer}".`;
      mascotTip = 'Bestimme das passende Objektpronomen.';
    }
  }

  return {
    id,
    originalQuestionId: `eng_gen_${topicId}_l${level}`,
    subject: 'english',
    topicId,
    topicName,
    level,
    questionText,
    directText: questionText,
    options,
    correctAnswer,
    explanation,
    mascotTip,
    isVariation: true,
  };
}

/**
 * Main Generator Function: generatePracticeSheet
 */
export function generatePracticeSheet(config: PracticeGeneratorConfig): PracticeSheet {
  const seed = config.seed !== undefined ? config.seed : Date.now() ^ Math.floor(Math.random() * 1000000);
  const rng = createPRNG(seed);

  // Filter selected topics
  let selectedTopics = (config.topics || []).filter((t) => t.selected);

  // Filter by subjectFilter
  if (config.subjectFilter === 'math') {
    selectedTopics = selectedTopics.filter((t) => t.subject === 'math');
  } else if (config.subjectFilter === 'english') {
    selectedTopics = selectedTopics.filter((t) => t.subject === 'english');
  }

  // Fallback if no topics are selected
  if (selectedTopics.length === 0) {
    if (config.topics && config.topics.length > 0) {
      selectedTopics = config.topics.filter((t) => {
        if (config.subjectFilter === 'math') return t.subject === 'math';
        if (config.subjectFilter === 'english') return t.subject === 'english';
        return true;
      });
    }
  }

  // Default topic fallbacks if still empty
  if (selectedTopics.length === 0) {
    if (config.subjectFilter === 'math' || config.subjectFilter === 'both') {
      selectedTopics.push({
        topicId: 'Addition',
        topicName: 'Addition',
        subject: 'math',
        selected: true,
        targetLevel: 2,
        isWeakSpot: false,
      });
    }
    if (config.subjectFilter === 'english' || config.subjectFilter === 'both') {
      selectedTopics.push({
        topicId: 'Vokabeln',
        topicName: 'Vokabeln',
        subject: 'english',
        selected: true,
        targetLevel: 2,
        isWeakSpot: false,
      });
    }
  }

  const questionCount = config.questionCount || 10;
  const exercises: GeneratedExerciseItem[] = [];
  const usedStaticIds = new Set<string>();

  // Round-robin selection across selected topics
  for (let i = 0; i < questionCount; i++) {
    const topicConfig = selectedTopics[i % selectedTopics.length];
    if (topicConfig.subject === 'math') {
      const exercise = generateMathVariation(rng, topicConfig, i + 1);
      exercises.push(exercise);
    } else {
      const exercise = generateEnglishVariation(rng, topicConfig, i + 1, usedStaticIds);
      exercises.push(exercise);
    }
  }

  const sheetId = `sheet_${seed}_${Math.floor(rng() * 100000)}`;
  const createdAt = config.seed !== undefined ? '2026-08-09T00:00:00.000Z' : new Date().toISOString();

  return {
    id: sheetId,
    createdAt,
    config: {
      ...config,
      seed,
    },
    exercises,
  };
}
