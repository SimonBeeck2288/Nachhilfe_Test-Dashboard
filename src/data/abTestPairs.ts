import type { AbTwinPair } from '../types/abTest';

export const AB_TWIN_PAIRS: AbTwinPair[] = [
  // --- MATH PAIRS ---
  // Pair 1: Basic Addition (Level 1)
  {
    pairId: 'ab_math_add_1',
    topic: 'Addition',
    subject: 'math',
    level: 1,
    conceptDescription: 'Addition zweier Zahlen bis 20',
    standard: {
      id: 'ab_m1_std',
      variant: 'standard',
      storyContext: 'Tim und Anna sammeln bunte Murmeln auf dem Schulhof.',
      text: 'Tim hat 7 rote Murmeln. Anna schenkt ihm 6 blaue Murmeln dazu. Wie viele Murmeln hat Tim jetzt insgesamt?',
      type: 'input',
      correctAnswer: '13',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m1_dir',
      variant: 'direct',
      text: 'Berechne: 8 + 5 = ?',
      type: 'input',
      correctAnswer: '13',
      timeLimit: 30,
    },
  },

  // Pair 2: Basic Subtraction (Level 1)
  {
    pairId: 'ab_math_sub_1',
    topic: 'Subtraktion',
    subject: 'math',
    level: 1,
    conceptDescription: 'Subtraktion bis 20',
    standard: {
      id: 'ab_m2_std',
      variant: 'standard',
      storyContext: 'In der Schulbäckerei liegen frische Schokokekse auf einem Tablett.',
      text: 'Auf dem Tablett liegen 18 Kekse. In der Pause kaufen Kinder 9 Kekse. Wie viele Kekse bleiben auf dem Tablett übrig?',
      type: 'input',
      correctAnswer: '9',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m2_dir',
      variant: 'direct',
      text: 'Berechne: 17 - 8 = ?',
      type: 'input',
      correctAnswer: '9',
      timeLimit: 30,
    },
  },

  // Pair 3: Multiplication (Level 2)
  {
    pairId: 'ab_math_mul_1',
    topic: 'Multiplikation',
    subject: 'math',
    level: 2,
    conceptDescription: 'Einmaleins Multiplikation',
    standard: {
      id: 'ab_m3_std',
      variant: 'standard',
      storyContext: 'Lisa betreibt einen kleinen Limonadenstand im Park.',
      text: 'Lisa verkauft 6 große Gläser Limonade für jeweils 4 Euro pro Glas. Wie viel Euro nimmt sie insgesamt ein?',
      type: 'input',
      correctAnswer: '24',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m3_dir',
      variant: 'direct',
      text: 'Berechne: 7 * 4 = ?',
      type: 'input',
      correctAnswer: '28',
      timeLimit: 30,
    },
  },

  // Pair 4: Division (Level 2)
  {
    pairId: 'ab_math_div_1',
    topic: 'Division',
    subject: 'math',
    level: 2,
    conceptDescription: 'Gleichmäßiges Aufteilen / Division',
    standard: {
      id: 'ab_m4_std',
      variant: 'standard',
      storyContext: 'Auf einer Geburtstagsfeier wird eine große Pizza serviert.',
      text: 'Die Pizza ist in 28 gleich große Stücke geschnitten. Es sind 7 Kinder am Tisch. Wie viele Stücke bekommt jedes Kind, wenn alle gleich viele erhalten?',
      type: 'input',
      correctAnswer: '4',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m4_dir',
      variant: 'direct',
      text: 'Berechne: 36 / 9 = ?',
      type: 'input',
      correctAnswer: '4',
      timeLimit: 30,
    },
  },

  // Pair 5: Geometry / Perimeter (Level 2)
  {
    pairId: 'ab_math_geo_1',
    topic: 'Geometrie',
    subject: 'math',
    level: 2,
    conceptDescription: 'Umfang eines Quadrats berechnen',
    standard: {
      id: 'ab_m5_std',
      variant: 'standard',
      storyContext: 'Der Hausmeister baut einen Holzzaun um ein quadratisches Blumenbeet im Schulgarten.',
      text: 'Das quadratische Blumenbeet hat an jeder der vier Seiten eine Länge von 8 Metern. Wie viele Meter Zaun werden für den gesamten Umfang benötigt?',
      type: 'input',
      correctAnswer: '32',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m5_dir',
      variant: 'direct',
      text: 'Berechne den Umfang eines Quadrats mit Seitenlänge a = 6 cm (in cm):',
      type: 'input',
      correctAnswer: '24',
      timeLimit: 30,
    },
  },

  // Pair 6: Fractions to Decimals (Level 3)
  {
    pairId: 'ab_math_frac_1',
    topic: 'Bruchrechnung',
    subject: 'math',
    level: 3,
    conceptDescription: 'Bruch in Dezimalzahl umwandeln',
    standard: {
      id: 'ab_m6_std',
      variant: 'standard',
      storyContext: 'Auf dem Schulfest teilt die Klasse einen Kuchen in 4 gleich große Stücke.',
      text: 'Am Ende sind noch genau 3 dieser 4 Stücke übrig (also 3/4 des Kuchens). Welcher Dezimalzahl entspricht dieser Anteil?',
      type: 'input',
      correctAnswer: ['0,75', '0.75'],
      timeLimit: 45,
    },
    direct: {
      id: 'ab_m6_dir',
      variant: 'direct',
      text: 'Wandle den Bruch 1/4 in eine Dezimalzahl um:',
      type: 'input',
      correctAnswer: ['0,25', '0.25'],
      timeLimit: 30,
    },
  },

  // Pair 7: Percentage Calculation (Level 4)
  {
    pairId: 'ab_math_perc_1',
    topic: 'Prozentrechnung',
    subject: 'math',
    level: 4,
    conceptDescription: 'Prozentwert berechnen',
    standard: {
      id: 'ab_m7_std',
      variant: 'standard',
      storyContext: 'Ein Sportgeschäft veranstaltet einen Sommerschlussverkauf.',
      text: 'Ein Paar Schuhe kostet regulär 80 Euro. Heute gibt es einen Rabatt von 20 Prozent. Wie viel Euro beträgt der Rabatt?',
      type: 'input',
      correctAnswer: '16',
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m7_dir',
      variant: 'direct',
      text: 'Berechne 10% von 90 € (in Euro):',
      type: 'input',
      correctAnswer: '9',
      timeLimit: 35,
    },
  },

  // Pair 8: Linear Equation (Level 4)
  {
    pairId: 'ab_math_eq_1',
    topic: 'Gleichungen',
    subject: 'math',
    level: 4,
    conceptDescription: 'Lineare Gleichung lösen',
    standard: {
      id: 'ab_m8_std',
      variant: 'standard',
      storyContext: 'Fünf identische Packungen Sammelkarten kosten zusammen 35 Euro.',
      text: 'Wenn jede Packung x Euro kostet und fünf Packungen zusammen 35 Euro kosten: Wie viel Euro kostet eine einzelne Packung?',
      type: 'input',
      correctAnswer: '7',
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m8_dir',
      variant: 'direct',
      text: 'Löse die Gleichung nach x auf: 6x = 42',
      type: 'input',
      correctAnswer: '7',
      timeLimit: 35,
    },
  },

  // Pair 9: Triangle Area (Level 5)
  {
    pairId: 'ab_math_area_1',
    topic: 'Flächenberechnung',
    subject: 'math',
    level: 5,
    conceptDescription: 'Dreiecksfläche berechnen (g * h / 2)',
    standard: {
      id: 'ab_m9_std',
      variant: 'standard',
      storyContext: 'Ein Segelboot erhält ein neues dreieckiges Segel.',
      text: 'Das Segel hat eine Grundkante von 10 Metern und eine Höhe von 6 Metern. Wie groß ist die Fläche des Segels in Quadratmetern?',
      type: 'input',
      correctAnswer: '30',
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m9_dir',
      variant: 'direct',
      text: 'Fläche eines Dreiecks mit g = 8 cm und h = 5 cm (in cm²):',
      type: 'input',
      correctAnswer: '20',
      timeLimit: 35,
    },
  },

  // Pair 10: Negative Numbers (Level 5)
  {
    pairId: 'ab_math_neg_1',
    topic: 'Negative Zahlen',
    subject: 'math',
    level: 5,
    conceptDescription: 'Rechnen mit negativen Zahlen',
    standard: {
      id: 'ab_m10_std',
      variant: 'standard',
      storyContext: 'Eine Bergstation misst Temperaturveränderungen.',
      text: 'In der Nacht sinkt das Thermometer auf minus 12 Grad Celsius (-12 °C). Bis zum Mittag erwärmt sich die Luft um 7 Grad. Welche Temperatur in °C wird gemessen?',
      type: 'input',
      correctAnswer: '-5',
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m10_dir',
      variant: 'direct',
      text: 'Berechne: (-15) + 6 = ?',
      type: 'input',
      correctAnswer: '-9',
      timeLimit: 30,
    },
  },

  // Pair 11: Two-Step Addition (Level 2)
  {
    pairId: 'ab_math_twostep_1',
    topic: 'Addition',
    subject: 'math',
    level: 2,
    conceptDescription: 'Mehrstufige Addition',
    standard: {
      id: 'ab_m11_std',
      variant: 'standard',
      storyContext: 'Jonas packt seinen Schulranzen für den Ausflugstag.',
      text: 'Er packt 12 Äpfel, 15 Müsliriegel und 8 Trinkpäckchen ein. Wie viele Snacks hat er insgesamt eingepackt?',
      type: 'input',
      correctAnswer: '35',
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m11_dir',
      variant: 'direct',
      text: 'Berechne: 14 + 16 + 7 = ?',
      type: 'input',
      correctAnswer: '37',
      timeLimit: 30,
    },
  },

  // Pair 12: Money & Change (Level 3)
  {
    pairId: 'ab_math_money_1',
    topic: 'Sachrechnen',
    subject: 'math',
    level: 3,
    conceptDescription: 'Rückgeld berechnen',
    standard: {
      id: 'ab_m12_std',
      variant: 'standard',
      storyContext: 'Maximilian kauft im Schreibwarenladen einen Füller.',
      text: 'Der Füller kostet 13,50 Euro. Maximilian bezahlt mit einem 20-Euro-Schein. Wie viel Euro Rückgeld bekommt er?',
      type: 'input',
      correctAnswer: ['6,50', '6.50', '6,5', '6.5'],
      timeLimit: 50,
    },
    direct: {
      id: 'ab_m12_dir',
      variant: 'direct',
      text: 'Berechne: 20 - 14,50 = ?',
      type: 'input',
      correctAnswer: ['5,50', '5.50', '5,5', '5.5'],
      timeLimit: 30,
    },
  },

  // --- ENGLISH PAIRS ---
  // Pair 13: Vocabulary (Level 1)
  {
    pairId: 'ab_eng_voc_1',
    topic: 'Vokabeln',
    subject: 'english',
    level: 1,
    conceptDescription: 'Englische Vokabeln (Möbel/Klassenzimmer)',
    standard: {
      id: 'ab_e1_std',
      variant: 'standard',
      storyContext: 'In der ersten Englischstunde fragt der Lehrer nach Schulsachen.',
      text: 'Wenn du im Englischunterricht auf deinen Holztisch zeigen möchtest: Was heißt das deutsche Wort "Tisch" auf Englisch?',
      type: 'input',
      correctAnswer: 'table',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e1_dir',
      variant: 'direct',
      text: 'Englisch für: Stuhl',
      type: 'input',
      correctAnswer: 'chair',
      timeLimit: 30,
    },
  },

  // Pair 14: Verb to be (Level 1)
  {
    pairId: 'ab_eng_gram_1',
    topic: 'Grammatik',
    subject: 'english',
    level: 1,
    conceptDescription: 'Formen von "to be" (are / is / am)',
    standard: {
      id: 'ab_e2_std',
      variant: 'standard',
      storyContext: 'Zwei Freunde unterhalten sich über ihre Mitschüler.',
      text: 'Wähle die richtige Form des Verbs "to be" für den Satz: "They ___ pupils."',
      type: 'multiple-choice',
      options: ['are', 'is', 'am'],
      correctAnswer: 'are',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e2_dir',
      variant: 'direct',
      text: 'We ___ happy.',
      type: 'multiple-choice',
      options: ['are', 'is', 'am'],
      correctAnswer: 'are',
      timeLimit: 30,
    },
  },

  // Pair 15: Simple Past Irregular (Level 2)
  {
    pairId: 'ab_eng_past_1',
    topic: 'Zeiten',
    subject: 'english',
    level: 2,
    conceptDescription: 'Simple Past unregelmäßige Verben',
    standard: {
      id: 'ab_e3_std',
      variant: 'standard',
      storyContext: 'Tom erzählt, was er gestern Nachmittag unternommen hat.',
      text: 'Welche Form des unregelmäßigen Verbs "go" muss man im Simple Past verwenden, wenn man sagen möchte, dass man gestern gegangen ist?',
      type: 'multiple-choice',
      options: ['went', 'goed', 'gone'],
      correctAnswer: 'went',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e3_dir',
      variant: 'direct',
      text: 'Simple Past von "see":',
      type: 'multiple-choice',
      options: ['saw', 'seed', 'seen'],
      correctAnswer: 'saw',
      timeLimit: 30,
    },
  },

  // Pair 16: Prepositions (Level 2)
  {
    pairId: 'ab_eng_prep_1',
    topic: 'Präpositionen',
    subject: 'english',
    level: 2,
    conceptDescription: 'Ortspräpositionen on / in / at',
    standard: {
      id: 'ab_e4_std',
      variant: 'standard',
      storyContext: 'Emma sucht ihr Englischbuch im Zimmer.',
      text: 'Welche Präposition passt in die Lücke, wenn das Buch oben auf dem Tisch liegt? "The book is ___ the table."',
      type: 'multiple-choice',
      options: ['on', 'in', 'at'],
      correctAnswer: 'on',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e4_dir',
      variant: 'direct',
      text: 'The cat is ___ the chair. (auf dem Stuhl)',
      type: 'multiple-choice',
      options: ['on', 'in', 'under'],
      correctAnswer: 'on',
      timeLimit: 30,
    },
  },

  // Pair 17: Opposites (Level 3)
  {
    pairId: 'ab_eng_opp_1',
    topic: 'Vokabeln',
    subject: 'english',
    level: 3,
    conceptDescription: 'Gegenteile (Antonyme)',
    standard: {
      id: 'ab_e5_std',
      variant: 'standard',
      storyContext: 'Im Bekleidungsgeschäft vergleicht Sarah zwei Jacken.',
      text: 'Sarah sucht nach einer preiswerten Jacke. Was ist das englische Gegenteil des Wortes "expensive"?',
      type: 'input',
      correctAnswer: 'cheap',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e5_dir',
      variant: 'direct',
      text: 'Gegenteil von "easy":',
      type: 'input',
      correctAnswer: ['difficult', 'hard'],
      timeLimit: 30,
    },
  },

  // Pair 18: Comparison (Level 3)
  {
    pairId: 'ab_eng_comp_1',
    topic: 'Steigerung',
    subject: 'english',
    level: 3,
    conceptDescription: 'Komparativ bilden',
    standard: {
      id: 'ab_e6_std',
      variant: 'standard',
      storyContext: 'Im Sportunterricht vergleichen zwei Läufer ihre Zeiten.',
      text: 'Wie lautet die Steigerungsform (Komparativ) des Adjektivs "fast" in der Reihe: fast -> ___ -> fastest?',
      type: 'input',
      correctAnswer: 'faster',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e6_dir',
      variant: 'direct',
      text: 'Komparativ: big -> ___ -> biggest',
      type: 'input',
      correctAnswer: 'bigger',
      timeLimit: 30,
    },
  },

  // Pair 19: Conditionals Type 1 (Level 4)
  {
    pairId: 'ab_eng_cond_1',
    topic: 'Conditionals',
    subject: 'english',
    level: 4,
    conceptDescription: 'Conditional Clause Type 1',
    standard: {
      id: 'ab_e7_std',
      variant: 'standard',
      storyContext: 'Zwei Schüler planen einen Ausflug am Wochenende.',
      text: 'Wähle die richtige Verbform für den Hauptsatz im Conditional Satz Typ 1: "If it rains tomorrow, we ___ at home."',
      type: 'multiple-choice',
      options: ['will stay', 'stay', 'stayed'],
      correctAnswer: 'will stay',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e7_dir',
      variant: 'direct',
      text: 'If she comes, I ___ happy.',
      type: 'multiple-choice',
      options: ['will be', 'am', 'was'],
      correctAnswer: 'will be',
      timeLimit: 30,
    },
  },

  // Pair 20: Passive Voice (Level 5)
  {
    pairId: 'ab_eng_pass_1',
    topic: 'Passiv',
    subject: 'english',
    level: 5,
    conceptDescription: 'Passiv im Simple Present',
    standard: {
      id: 'ab_e8_std',
      variant: 'standard',
      storyContext: 'Ein Hotelmanager erklärt den Tagesablauf des Reinigungspersonals.',
      text: 'Welches Verb vervollständigt den Passivsatz: "The hotel room ___ every day by our staff."?',
      type: 'multiple-choice',
      options: ['is cleaned', 'was cleaned', 'cleans'],
      correctAnswer: 'is cleaned',
      timeLimit: 45,
    },
    direct: {
      id: 'ab_e8_dir',
      variant: 'direct',
      text: 'The cars ___ (wash) every Saturday.',
      type: 'multiple-choice',
      options: ['are washed', 'is washed', 'was washed'],
      correctAnswer: 'are washed',
      timeLimit: 30,
    },
  },
];

/**
 * Storage helpers for A/B Test Sessions
 */
const AB_STORAGE_KEY = 'nachhilfe_ab_test_sessions';

export function getSavedAbTestSessions(): AbTestSessionRecord[] {
  try {
    const raw = localStorage.getItem(AB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAbTestSession(record: AbTestSessionRecord): void {
  try {
    const list = getSavedAbTestSessions();
    list.unshift(record);
    // Keep last 30
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (err) {
    console.error('Failed to save A/B test session:', err);
  }
}
