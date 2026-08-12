export type QuestionType = 
  | 'multiple-choice' 
  | 'input' 
  | 'drag-sort' 
  | 'matching' 
  | 'fraction-pie';

export interface MatchingPair {
  left: string;
  right: string;
}

export interface DiagramData {
  shape: 'right-triangle' | 'triangle' | 'circle' | 'rectangle' | 'parallelogram' | 'trapezoid' | 'cube';
  labels?: Record<string, string | number>;
  unknownVar?: string;
}

export interface Question {
  id: string;
  topic: string; // Das Themengebiet der Frage
  subject: 'math' | 'english';
  level: number; // 1 (Very basic) to 7 (8th Grade advanced level)
  text: string;
  type: QuestionType | any;
  options?: string[]; // only for multiple choice
  correctAnswer: string | string[];
  timeLimit: number; // in seconds
  readingPassage?: string;
  dragItems?: string[]; // Scrambled items for drag-sort
  matchingPairs?: MatchingPair[]; // Left/right pairs for matching
  targetFraction?: { numerator: number; denominator: number }; // For fraction-pie
  diagramData?: DiagramData; // Explicit geometry diagram params
  storyContext?: string; // Micro-story preamble
  explanation?: string; // Step-by-step resolution
  didYouKnowHint?: string; // Mascot tip for mistakes
}

// Reading Passages for Levels 4, 5, 6, and 7
const PASSAGE_L4_ANNOUNCEMENT = `Attention all students!
The annual School Sports Day will take place on Friday, June 12th, on the school sports field. Activities start at 9:00 AM and end at 2:00 PM. Please remember to bring water, sports clothes, and sunscreen. Snacks and fruits will be provided free of charge by the Parents' Association.`;

const PASSAGE_L4_EMAIL = `Hi Sarah,
I'm so excited about our camping trip next weekend! My dad said we can leave on Saturday morning at 8:00 AM. We will stay at Lake Greenview for two nights. Don't forget to pack your sleeping bag and a flashlight. Let me know if you need anything else!
Best,
Emma`;

const PASSAGE_L5_STORY = `Tom and his dog Max love visiting Greenwood Park every afternoon. Yesterday, while Max was chasing a tennis ball near the old oak tree, he found a small, rusted metal box half-buried in the soil. Tom picked it up and opened it carefully. Inside, there was a handwritten note from 1952 and a polished blue marble.`;

const PASSAGE_L5_RULES = `Welcome to Sunshine Summer Camp!
To ensure everyone has a safe and fun experience, please follow these rules:
1. Quiet hours are from 10:00 PM to 7:00 AM.
2. Swimming in the lake is only permitted when a lifeguard is on duty.
3. Mobile phones must be handed in at the main office before breakfast and can be used for one hour after dinner.`;

const PASSAGE_L6_ENERGY = `Renewable energy sources such as wind and solar power have gained tremendous importance over the past decade. Unlike fossil fuels, which emit harmful greenhouse gases, solar panels convert sunlight directly into electricity without air pollution. Many cities are now investing heavily in building solar farms on unused farmland and rooftop installations to achieve carbon neutrality by 2040.`;

const PASSAGE_L6_CLIMB = `After hours of hiking up the steep mountain track, Clara finally reached the peak just as the sun was setting. The horizon turned brilliant shades of orange and purple. She pulled her heavy coat tighter against the freezing wind and took out her camera. Having spent three months planning this expedition, she felt an immense sense of accomplishment.`;

const PASSAGE_L7_PEDESTRIAN = `Dear City Council Members,
I am writing to express my strong support for the proposed expansion of the central pedestrian zone. Recent studies demonstrate that automobile traffic in the inner city not only increases air pollution levels by 35% but also significantly reduces foot traffic for local shop owners. By transforming High Street into a dedicated pedestrian area with expanded green spaces and bicycle lanes, the city can simultaneously boost local commerce and enhance public health.`;

const PASSAGE_L7_AI = `Artificial Intelligence (AI) algorithms have made rapid advancements in medical diagnostics. By analyzing tens of thousands of medical imaging scans in seconds, modern AI systems can assist doctors in identifying early signs of rare diseases with remarkable precision. However, medical experts emphasize that AI should serve as an auxiliary tool to complement professional clinical judgment rather than replace human physicians entirely.`;

export const englishQuestions: Question[] = [
  // Level 1: Very Basic (Vocabulary & Basic A1 Grammar)
  { id: 'e1_1', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Hund" auf Englisch?', type: 'input', correctAnswer: 'dog', timeLimit: 45 },
  { id: 'e1_2', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Apfel" auf Englisch?', type: 'input', correctAnswer: 'apple', timeLimit: 45 },
  { id: 'e1_3', topic: 'Grammatik', subject: 'english', level: 1, text: 'Übersetze: "Ich bin..."', type: 'multiple-choice', options: ['I have', 'I am', 'I do'], correctAnswer: 'I am', timeLimit: 45 },
  { id: 'e1_4', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Buch" auf Englisch?', type: 'input', correctAnswer: 'book', timeLimit: 45 },
  { id: 'e1_5', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "You ___ my friend."', type: 'multiple-choice', options: ['are', 'is', 'am'], correctAnswer: 'are', timeLimit: 45 },
  { id: 'e1_6', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Katze" auf Englisch?', type: 'input', correctAnswer: 'cat', timeLimit: 45 },
  { id: 'e1_7', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Schule" auf Englisch?', type: 'input', correctAnswer: 'school', timeLimit: 45 },
  { id: 'e1_8', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "She ___ happy."', type: 'multiple-choice', options: ['is', 'are', 'am'], correctAnswer: 'is', timeLimit: 45 },
  { id: 'e1_9', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "blue" auf Deutsch?', type: 'input', correctAnswer: 'blau', timeLimit: 45 },
  { id: 'e1_10', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Haus" auf Englisch?', type: 'input', correctAnswer: 'house', timeLimit: 45 },
  { id: 'e1_11', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "5" auf Englisch?', type: 'input', correctAnswer: 'five', timeLimit: 45 },
  { id: 'e1_12', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze den unbestimmten Artikel: "... apple"', type: 'multiple-choice', options: ['a', 'an', 'the'], correctAnswer: 'an', timeLimit: 45 },
  { id: 'e1_13', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Wasser" auf Englisch?', type: 'input', correctAnswer: 'water', timeLimit: 45 },
  { id: 'e1_14', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Tag" auf Englisch?', type: 'input', correctAnswer: 'day', timeLimit: 45 },
  { id: 'e1_15', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze den unbestimmten Artikel: "... car"', type: 'multiple-choice', options: ['a', 'an', 'some'], correctAnswer: 'a', timeLimit: 45 },
  { id: 'e1_16', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Stift" auf Englisch?', type: 'input', correctAnswer: ['pen', 'pencil'], timeLimit: 45 },
  { id: 'e1_17', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "We ___ happy."', type: 'multiple-choice', options: ['are', 'is', 'am'], correctAnswer: 'are', timeLimit: 45 },
  { id: 'e1_18', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "10" auf Englisch?', type: 'input', correctAnswer: 'ten', timeLimit: 45 },
  { id: 'e1_19', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "red" auf Deutsch?', type: 'input', correctAnswer: 'rot', timeLimit: 45 },
  { id: 'e1_20', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze den unbestimmten Artikel: "... elephant"', type: 'multiple-choice', options: ['a', 'an', 'the'], correctAnswer: 'an', timeLimit: 45 },
  { id: 'e1_drag1', topic: 'Satzbau', subject: 'english', level: 1, text: 'Bringe die Wörter in die richtige Reihenfolge:', type: 'drag-sort', dragItems: ['is', 'cat', 'The', 'black'], correctAnswer: 'The cat is black', timeLimit: 45 },

  // Level 2: Basic Grammar & Sentences (A1.2/A2)
  { id: 'e2_1', topic: 'Grammatik', subject: 'english', level: 2, text: 'Wähle das richtige Verb: "He ___ a book."', type: 'multiple-choice', options: ['read', 'reads', 'reading'], correctAnswer: 'reads', timeLimit: 30 },
  { id: 'e2_2', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "child"?', type: 'input', correctAnswer: 'children', timeLimit: 30 },
  { id: 'e2_3', topic: 'Zeiten', subject: 'english', level: 2, text: 'Wie bildet man die Vergangenheit von "go"?', type: 'multiple-choice', options: ['goed', 'went', 'gone'], correctAnswer: 'went', timeLimit: 30 },
  { id: 'e2_4', topic: 'Grammatik', subject: 'english', level: 2, text: 'Mehrzahl von "mouse"?', type: 'input', correctAnswer: 'mice', timeLimit: 30 },
  { id: 'e2_5', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit von "see"?', type: 'multiple-choice', options: ['seed', 'saw', 'seen'], correctAnswer: 'saw', timeLimit: 30 },
  { id: 'e2_6', topic: 'Grammatik', subject: 'english', level: 2, text: 'Ergänze das Pronomen: "This is Tom. Look at ___."', type: 'multiple-choice', options: ['him', 'he', 'his'], correctAnswer: 'him', timeLimit: 30 },
  { id: 'e2_7', topic: 'Grammatik', subject: 'english', level: 2, text: 'Mehrzahl von "foot"?', type: 'input', correctAnswer: 'feet', timeLimit: 30 },
  { id: 'e2_8', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit von "have"?', type: 'multiple-choice', options: ['haded', 'had', 'has'], correctAnswer: 'had', timeLimit: 30 },
  { id: 'e2_9', topic: 'Grammatik', subject: 'english', level: 2, text: 'Wähle die richtige Form: "They ___ playing football now."', type: 'multiple-choice', options: ['are', 'is', 'am'], correctAnswer: 'are', timeLimit: 30 },
  { id: 'e2_10', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Frühstück" auf Englisch?', type: 'input', correctAnswer: 'breakfast', timeLimit: 30 },
  { id: 'e2_11', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "The book is ___ the table." (auf dem Tisch)', type: 'multiple-choice', options: ['in', 'on', 'at'], correctAnswer: 'on', timeLimit: 30 },
  { id: 'e2_12', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit von "make"?', type: 'multiple-choice', options: ['maked', 'made', 'make'], correctAnswer: 'made', timeLimit: 30 },
  { id: 'e2_13', topic: 'Grammatik', subject: 'english', level: 2, text: 'Verneinung: "I ___ like spinach."', type: 'multiple-choice', options: ["don't", "doesn't", "not"], correctAnswer: "don't", timeLimit: 30 },
  { id: 'e2_14', topic: 'Grammatik', subject: 'english', level: 2, text: 'Verneinung: "She ___ like spinach."', type: 'multiple-choice', options: ["don't", "doesn't", "not"], correctAnswer: "doesn't", timeLimit: 30 },
  { id: 'e2_15', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Woche" auf Englisch?', type: 'input', correctAnswer: 'week', timeLimit: 30 },
  { id: 'e2_16', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "man"?', type: 'input', correctAnswer: 'men', timeLimit: 30 },
  { id: 'e2_17', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "run"?', type: 'multiple-choice', options: ['ran', 'runned', 'running'], correctAnswer: 'ran', timeLimit: 30 },
  { id: 'e2_18', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "She is sitting ___ the chair." (auf dem Stuhl)', type: 'multiple-choice', options: ['on', 'in', 'under'], correctAnswer: 'on', timeLimit: 30 },
  { id: 'e2_19', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Abendessen" auf Englisch?', type: 'input', correctAnswer: ['dinner', 'supper'], timeLimit: 30 },
  { id: 'e2_20', topic: 'Grammatik', subject: 'english', level: 2, text: 'Wähle die richtige Form: "He ___ TV every evening."', type: 'multiple-choice', options: ['watches', 'watch', 'watching'], correctAnswer: 'watches', timeLimit: 30 },
  { id: 'e2_match1', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Ordne die englischen Vokabeln den deutschen Übersetzungen zu:', type: 'matching', matchingPairs: [{ left: 'dog', right: 'Hund' }, { left: 'cat', right: 'Katze' }, { left: 'apple', right: 'Apfel' }], correctAnswer: 'apple:Apfel;cat:Katze;dog:Hund', timeLimit: 45 },

  // Level 3: Simple Past, Present Perfect & Comparison (6th/7th Grade)
  { id: 'e3_1', topic: 'Zeiten', subject: 'english', level: 3, text: 'Setze ein: "I ___ to the cinema yesterday."', type: 'multiple-choice', options: ['go', 'gone', 'went'], correctAnswer: 'went', timeLimit: 40 },
  { id: 'e3_2', topic: 'Zeiten', subject: 'english', level: 3, text: 'Present Perfect von "she plays": "She ___ played."', type: 'multiple-choice', options: ['have', 'has', 'is'], correctAnswer: 'has', timeLimit: 30 },
  { id: 'e3_3', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was ist das Gegenteil von "expensive"?', type: 'input', correctAnswer: 'cheap', timeLimit: 30 },
  { id: 'e3_4', topic: 'Zeiten', subject: 'english', level: 3, text: 'Wähle die richtige Form: "They ___ (to watch) TV right now."', type: 'multiple-choice', options: ['watch', 'are watching', 'watched'], correctAnswer: 'are watching', timeLimit: 30 },
  { id: 'e3_5', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Gegenteil von "always"?', type: 'input', correctAnswer: 'never', timeLimit: 30 },
  { id: 'e3_6', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "big": big -> ___ -> biggest', type: 'input', correctAnswer: 'bigger', timeLimit: 30 },
  { id: 'e3_7', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "eat"?', type: 'input', correctAnswer: 'eaten', timeLimit: 30 },
  { id: 'e3_8', topic: 'Grammatik', subject: 'english', level: 3, text: 'Ergänze: "We have lived here ___ 2020."', type: 'multiple-choice', options: ['since', 'for', 'ago'], correctAnswer: 'since', timeLimit: 35 },
  { id: 'e3_9', topic: 'Grammatik', subject: 'english', level: 3, text: 'Ergänze: "We have lived here ___ three years."', type: 'multiple-choice', options: ['for', 'since', 'in'], correctAnswer: 'for', timeLimit: 35 },
  { id: 'e3_10', topic: 'Modalverben', subject: 'english', level: 3, text: 'Übersetze "können" (Fähigkeit) in der Gegenwart: "I ___ swim."', type: 'input', correctAnswer: 'can', timeLimit: 30 },
  { id: 'e3_11', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "good": good -> ___ -> best', type: 'input', correctAnswer: 'better', timeLimit: 30 },
  { id: 'e3_12', topic: 'Zeiten', subject: 'english', level: 3, text: 'Vergangenheit (Simple Past) von "buy"?', type: 'input', correctAnswer: 'bought', timeLimit: 30 },
  { id: 'e3_13', topic: 'Grammatik', subject: 'english', level: 3, text: 'Possessivpronomen: "This hat belongs to me. It is ___."', type: 'multiple-choice', options: ['my', 'mine', 'me'], correctAnswer: 'mine', timeLimit: 35 },
  { id: 'e3_14', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Gegenteil von "difficult"?', type: 'input', correctAnswer: 'easy', timeLimit: 30 },
  { id: 'e3_15', topic: 'Zeiten', subject: 'english', level: 3, text: 'Welche Zeitform signalisiert das Wort "yesterday"?', type: 'multiple-choice', options: ['Present Simple', 'Simple Past', 'Present Perfect'], correctAnswer: 'Simple Past', timeLimit: 35 },
  { id: 'e3_16', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "fast": fast -> ___ -> fastest', type: 'input', correctAnswer: 'faster', timeLimit: 30 },
  { id: 'e3_17', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "write"?', type: 'input', correctAnswer: 'written', timeLimit: 30 },
  { id: 'e3_18', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Gegenteil von "hot"?', type: 'input', correctAnswer: 'cold', timeLimit: 30 },
  { id: 'e3_19', topic: 'Grammatik', subject: 'english', level: 3, text: 'Wähle das richtige Modalverb: "You ___ brush your teeth before bed."', type: 'multiple-choice', options: ['should', 'might', 'could'], correctAnswer: 'should', timeLimit: 35 },
  { id: 'e3_20', topic: 'Zeiten', subject: 'english', level: 3, text: 'Present Perfect von "they clean": "They ___ cleaned."', type: 'multiple-choice', options: ['have', 'has', 'are'], correctAnswer: 'have', timeLimit: 30 },
  { id: 'e3_drag1', topic: 'Satzbau', subject: 'english', level: 3, text: 'Bringe den Satz in die richtige Reihenfolge:', type: 'drag-sort', dragItems: ['school', 'to', 'go', 'I', 'every', 'day'], correctAnswer: 'I go to school every day', timeLimit: 45 },

  // Level 4: Adjectives/Adverbs, Conditionals & Reading Passages (7th Grade)
  { id: 'e4_1', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_ANNOUNCEMENT, text: 'Wann beginnt der School Sports Day?', type: 'multiple-choice', options: ['8:00 AM', '9:00 AM', '12:00 PM', '2:00 PM'], correctAnswer: '9:00 AM', timeLimit: 45 },
  { id: 'e4_2', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_ANNOUNCEMENT, text: 'Wer stellt kostenlose Snacks und Obst zur Verfügung?', type: 'multiple-choice', options: ['Die Lehrer', 'Die Schulleitung', 'Der Elternverein', 'Der Sportverein'], correctAnswer: 'Der Elternverein', timeLimit: 45 },
  { id: 'e4_3', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_EMAIL, text: 'Wie viele Nächte wollen Sarah und Emma am See zelten?', type: 'multiple-choice', options: ['1 Nacht', '2 Nächte', '3 Nächte', '1 Woche'], correctAnswer: '2 Nächte', timeLimit: 45 },
  { id: 'e4_4', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_EMAIL, text: 'Was soll Sarah laut Emmas E-Mail einpacken?', type: 'multiple-choice', options: ['Schlafsack und Taschenlampe', 'Zelt und Kocher', 'Schwimmweste und Handtuch', 'Fahrrad und Helm'], correctAnswer: 'Schlafsack und Taschenlampe', timeLimit: 45 },
  { id: 'e4_5', topic: 'Grammatik', subject: 'english', level: 4, text: 'She speaks English very ___.', type: 'multiple-choice', options: ['good', 'well', 'nice'], correctAnswer: 'well', timeLimit: 40 },
  { id: 'e4_6', topic: 'Grammatik', subject: 'english', level: 4, text: 'If it rains tomorrow, we ___ at home.', type: 'multiple-choice', options: ['stay', 'will stay', 'stayed'], correctAnswer: 'will stay', timeLimit: 45 },
  { id: 'e4_7', topic: 'Zeiten', subject: 'english', level: 4, text: 'Was ist das Past Participle (3. Form) von "write"?', type: 'input', correctAnswer: 'written', timeLimit: 30 },
  { id: 'e4_8', topic: 'Grammatik', subject: 'english', level: 4, text: 'He is ___ (tall) than his brother.', type: 'input', correctAnswer: 'taller', timeLimit: 40 },
  { id: 'e4_9', topic: 'Grammatik', subject: 'english', level: 4, text: 'If I ___ (be) you, I would study more.', type: 'multiple-choice', options: ['am', 'was', 'were'], correctAnswer: 'were', timeLimit: 45 },
  { id: 'e4_10', topic: 'Grammatik', subject: 'english', level: 4, text: 'Adverb bilden: "He is a careful driver. He drives ___."', type: 'input', correctAnswer: 'carefully', timeLimit: 35 },
  { id: 'e4_11', topic: 'Zeiten', subject: 'english', level: 4, text: 'While I was reading, the telephone ___.', type: 'multiple-choice', options: ['rang', 'was ringing', 'ring'], correctAnswer: 'rang', timeLimit: 40 },
  { id: 'e4_12', topic: 'Relativsätze', subject: 'english', level: 4, text: 'The boy ___ won the match is my cousin.', type: 'multiple-choice', options: ['who', 'which', 'whose'], correctAnswer: 'who', timeLimit: 40 },
  { id: 'e4_13', topic: 'Grammatik', subject: 'english', level: 4, text: 'She is the ___ (intelligent) girl in the class.', type: 'multiple-choice', options: ['most intelligent', 'more intelligent', 'intelligenter'], correctAnswer: 'most intelligent', timeLimit: 40 },
  { id: 'e4_14', topic: 'Zeiten', subject: 'english', level: 4, text: 'Past Participle von "speak"?', type: 'input', correctAnswer: 'spoken', timeLimit: 30 },
  { id: 'e4_15', topic: 'Grammatik', subject: 'english', level: 4, text: 'If you work hard, you ___ the test.', type: 'multiple-choice', options: ['pass', 'will pass', 'passed'], correctAnswer: 'will pass', timeLimit: 40 },
  { id: 'e4_16', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_ANNOUNCEMENT, text: 'Um wie viel Uhr endet der School Sports Day?', type: 'multiple-choice', options: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'], correctAnswer: '2:00 PM', timeLimit: 45 },
  { id: 'e4_17', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_EMAIL, text: 'Wohin fahren Emma und Sarah am Wochenende?', type: 'multiple-choice', options: ['Lake Greenview', 'Greenwood Park', 'High Street', 'Sunshine Camp'], correctAnswer: 'Lake Greenview', timeLimit: 45 },
  { id: 'e4_18', topic: 'Grammatik', subject: 'english', level: 4, text: 'Adverb bilden: "She is a quick learner. She learns ___."', type: 'input', correctAnswer: 'quickly', timeLimit: 35 },
  { id: 'e4_19', topic: 'Conditionals', subject: 'english', level: 4, text: 'If I have time, I ___ (help) you.', type: 'multiple-choice', options: ['will help', 'helped', 'would help'], correctAnswer: 'will help', timeLimit: 40 },
  { id: 'e4_20', topic: 'Zeiten', subject: 'english', level: 4, text: 'Setze in das Past Continuous ein: "Yesterday at 5 PM, they ___ (play) tennis."', type: 'multiple-choice', options: ['were playing', 'was playing', 'played'], correctAnswer: 'were playing', timeLimit: 40 },
  { id: 'e4_match1', topic: 'Vokabeln', subject: 'english', level: 4, text: 'Ordne die Adjektive ihren Gegenteilen zu:', type: 'matching', matchingPairs: [{ left: 'always', right: 'never' }, { left: 'cheap', right: 'expensive' }, { left: 'easy', right: 'difficult' }], correctAnswer: 'always:never;cheap:expensive;easy:difficult', timeLimit: 45 },

  // Level 5: Reading Comprehension & Advanced Grammar (8th Grade Level)
  { id: 'e5_1', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_STORY, text: 'Was befand sich in der kleinen Metallkiste?', type: 'multiple-choice', options: ['Eine alte Münze von 1952 und eine Silberkette', 'Ein handgeschriebener Zettel von 1952 und eine blaue Murmel', 'Ein alter Schlüssel von 1952 und ein Tagebuch', 'Ein altes Foto von 1952 und eine Taschenuhr'], correctAnswer: 'Ein handgeschriebener Zettel von 1952 und eine blaue Murmel', timeLimit: 45 },
  { id: 'e5_2', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_STORY, text: 'Wo genau hat der Hund Max die Kiste entdeckt?', type: 'multiple-choice', options: ['Im Fluss', 'Nahe der alten Eiche', 'Auf dem Spielplatz', 'Am Hauseingang'], correctAnswer: 'Nahe der alten Eiche', timeLimit: 45 },
  { id: 'e5_3', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_RULES, text: 'Wann ist das Schwimmen im See erlaubt?', type: 'multiple-choice', options: ['Jederzeit', 'Nur morgens', 'Nur wenn ein Rettungsschwimmer im Dienst ist', 'Nur nach 10:00 Uhr'], correctAnswer: 'Nur wenn ein Rettungsschwimmer im Dienst ist', timeLimit: 45 },
  { id: 'e5_4', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_RULES, text: 'Wann dürfen Handys im Camp genutzt werden?', type: 'multiple-choice', options: ['Den ganzen Tag', 'Gar nicht', 'Eine Stunde nach dem Abendessen', 'Vor dem Frühstück'], correctAnswer: 'Eine Stunde nach dem Abendessen', timeLimit: 45 },
  { id: 'e5_5', topic: 'Grammatik', subject: 'english', level: 5, text: 'The book, ___ was written in 1999, is a bestseller.', type: 'multiple-choice', options: ['who', 'which', 'whose'], correctAnswer: 'which', timeLimit: 45 },
  { id: 'e5_6', topic: 'Zeiten', subject: 'english', level: 5, text: '"I was walking down the street when I ___ my friend." Welches Verb passt?', type: 'multiple-choice', options: ['saw', 'was seeing', 'see'], correctAnswer: 'saw', timeLimit: 45 },
  { id: 'e5_7', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "to procrastinate"?', type: 'multiple-choice', options: ['schnell arbeiten', 'etwas aufschieben', 'professionell sein', 'etwas planen'], correctAnswer: 'etwas aufschieben', timeLimit: 45 },
  { id: 'e5_8', topic: 'Grammatik', subject: 'english', level: 5, text: 'He asked me where I ___ (live).', type: 'multiple-choice', options: ['live', 'lived', 'had lived'], correctAnswer: 'lived', timeLimit: 45 },
  { id: 'e5_9', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "ambiguous"?', type: 'multiple-choice', options: ['eindeutig', 'mehrdeutig', 'ehrgeizig', 'wütend'], correctAnswer: 'mehrdeutig', timeLimit: 45 },
  { id: 'e5_10', topic: 'Passiv', subject: 'english', level: 5, text: 'The room ___ (clean) every day by the staff.', type: 'multiple-choice', options: ['is cleaned', 'was cleaned', 'cleans'], correctAnswer: 'is cleaned', timeLimit: 45 },
  { id: 'e5_11', topic: 'Conditionals', subject: 'english', level: 5, text: 'If I won the lottery, I ___ travel around the world.', type: 'multiple-choice', options: ['would', 'will', 'had'], correctAnswer: 'would', timeLimit: 45 },
  { id: 'e5_12', topic: 'Grammatik', subject: 'english', level: 5, text: 'Relativpronomen: "The teacher ___ taught us history retired last week."', type: 'multiple-choice', options: ['who', 'which', 'whose'], correctAnswer: 'who', timeLimit: 45 },
  { id: 'e5_13', topic: 'Indirekte Rede', subject: 'english', level: 5, text: 'Direct: "I am tired." -> Reported: He said that he ___ tired.', type: 'multiple-choice', options: ['was', 'is', 'had been'], correctAnswer: 'was', timeLimit: 45 },
  { id: 'e5_14', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "environment"?', type: 'multiple-choice', options: ['Umwelt', 'Erfindung', 'Erfahrung', 'Unterhaltung'], correctAnswer: 'Umwelt', timeLimit: 40 },
  { id: 'e5_15', topic: 'Passiv', subject: 'english', level: 5, text: 'English ___ (speak) all over the world.', type: 'multiple-choice', options: ['is spoken', 'speaks', 'was spoken'], correctAnswer: 'is spoken', timeLimit: 40 },
  { id: 'e5_16', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_STORY, text: 'Aus welchem Jahr stammte der handgeschriebene Zettel in der Metallkiste?', type: 'multiple-choice', options: ['1942', '1952', '1962', '1972'], correctAnswer: '1952', timeLimit: 45 },
  { id: 'e5_17', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_RULES, text: 'Wann sind im Summer Camp Ruhezeiten (Quiet hours)?', type: 'multiple-choice', options: ['22:00 bis 07:00 Uhr', '20:00 bis 06:00 Uhr', '23:00 bis 08:00 Uhr', '21:00 bis 07:00 Uhr'], correctAnswer: '22:00 bis 07:00 Uhr', timeLimit: 45 },
  { id: 'e5_18', topic: 'Conditionals', subject: 'english', level: 5, text: 'If she had known the truth, she ___ (tell) us.', type: 'multiple-choice', options: ['would have told', 'will tell', 'would tell', 'had told'], correctAnswer: 'would have told', timeLimit: 45 },
  { id: 'e5_19', topic: 'Passiv', subject: 'english', level: 5, text: 'The letter ___ (send) yesterday.', type: 'multiple-choice', options: ['was sent', 'is sent', 'were sent', 'sends'], correctAnswer: 'was sent', timeLimit: 45 },
  { id: 'e5_20', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "curiosity"?', type: 'multiple-choice', options: ['Neugier', 'Höflichkeit', 'Vorsicht', 'Mut'], correctAnswer: 'Neugier', timeLimit: 40 },

  // Level 6: Advanced Grammar & Passive Voice / Past Perfect / Conditionals
  { id: 'e6_1', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_ENERGY, text: 'Was ist ein Hauptvorteil von Solarenergie im Vergleich zu fossilen Brennstoffen?', type: 'multiple-choice', options: ['Sie ist billiger im Transport', 'Sie erzeugt Strom ohne Luftverschmutzung und Treibhausgase', 'Sie funktioniert nur nachts', 'Sie benötigt keine Installation'], correctAnswer: 'Sie erzeugt Strom ohne Luftverschmutzung und Treibhausgase', timeLimit: 50 },
  { id: 'e6_2', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_ENERGY, text: 'Bis zu welchem Jahr wollen viele Städte laut Text Klimaneutralität (carbon neutrality) erreichen?', type: 'multiple-choice', options: ['2030', '2040', '2050', '2100'], correctAnswer: '2040', timeLimit: 45 },
  { id: 'e6_3', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_CLIMB, text: 'Wie lange hatte Clara diese Expedition geplant?', type: 'multiple-choice', options: ['Drei Wochen', 'Drei Monate', 'Ein Jahr', 'Drei Tage'], correctAnswer: 'Drei Monate', timeLimit: 45 },
  { id: 'e6_4', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_CLIMB, text: 'Zu welcher Tageszeit erreichte Clara den Gipfel?', type: 'multiple-choice', options: ['Sonnenaufgang', 'Mittag', 'Sonnenuntergang', 'Mitternacht'], correctAnswer: 'Sonnenuntergang', timeLimit: 45 },
  { id: 'e6_5', topic: 'Grammatik', subject: 'english', level: 6, text: 'The old house ___ (repair) by the workers last month.', type: 'multiple-choice', options: ['was repaired', 'is repaired', 'were repaired', 'has repaired'], correctAnswer: 'was repaired', timeLimit: 45 },
  { id: 'e6_6', topic: 'Zeiten', subject: 'english', level: 6, text: 'Before she went out, she ___ (finish) her homework.', type: 'multiple-choice', options: ['had finished', 'has finished', 'finished', 'was finishing'], correctAnswer: 'had finished', timeLimit: 45 },
  { id: 'e6_7', topic: 'Grammatik', subject: 'english', level: 6, text: 'If I had enough money, I ___ (buy) a new bicycle.', type: 'multiple-choice', options: ['would buy', 'will buy', 'bought', 'had bought'], correctAnswer: 'would buy', timeLimit: 45 },
  { id: 'e6_8', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was bedeutet das Wort "reluctant"?', type: 'multiple-choice', options: ['widerwillig', 'begeistert', 'vorsichtig', 'zuverlässig'], correctAnswer: 'widerwillig', timeLimit: 40 },
  { id: 'e6_9', topic: 'Grammatik', subject: 'english', level: 6, text: 'You ___ come if you feel tired.', type: 'multiple-choice', options: ["don't have to", 'must not', 'should not', 'cannot'], correctAnswer: "don't have to", timeLimit: 40 },
  { id: 'e6_10', topic: 'Passiv', subject: 'english', level: 6, text: 'The new bridge ___ (construct) when the storm hit.', type: 'multiple-choice', options: ['was being constructed', 'is constructed', 'had constructed', 'was construct'], correctAnswer: 'was being constructed', timeLimit: 50 },
  { id: 'e6_11', topic: 'Past Perfect', subject: 'english', level: 6, text: 'By the time the train arrived, we ___ for two hours.', type: 'multiple-choice', options: ['had been waiting', 'waited', 'have waited', 'were waiting'], correctAnswer: 'had been waiting', timeLimit: 50 },
  { id: 'e6_12', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to give up" mean?', type: 'multiple-choice', options: ['aufgeben', 'verteilen', 'zurückgeben', 'anheben'], correctAnswer: 'aufgeben', timeLimit: 40 },
  { id: 'e6_13', topic: 'Conditionals', subject: 'english', level: 6, text: 'Unless you hurry up, we ___ the bus.', type: 'multiple-choice', options: ['will miss', 'missed', 'would miss', 'had missed'], correctAnswer: 'will miss', timeLimit: 45 },
  { id: 'e6_14', topic: 'Grammatik', subject: 'english', level: 6, text: 'He speaks as if he ___ everything.', type: 'multiple-choice', options: ['knew', 'knows', 'has known', 'is knowing'], correctAnswer: 'knew', timeLimit: 45 },
  { id: 'e6_15', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was ist ein Synonym für "subsequent"?', type: 'multiple-choice', options: ['nachfolgend', 'vorherig', 'gleichzeitig', 'selten'], correctAnswer: 'nachfolgend', timeLimit: 45 },
  { id: 'e6_16', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_ENERGY, text: 'Worin unterscheidet sich Solarenergie hauptsächlich von fossilen Brennstoffen?', type: 'multiple-choice', options: ['Sie stößt keine schädlichen Treibhausgase aus', 'Sie erfordert Verbrennung von Kohle', 'Sie ist schwerer zu speichern', 'Sie funktioniert nur im Winter'], correctAnswer: 'Sie stößt keine schädlichen Treibhausgase aus', timeLimit: 45 },
  { id: 'e6_17', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_CLIMB, text: 'Was zog Clara an, als der eiskalte Wind auf dem Gipfel blies?', type: 'multiple-choice', options: ['Ihre schwere Jacke', 'Ihren Pullover', 'Ihre Mütze', 'Ihre Regenjacke'], correctAnswer: 'Ihre schwere Jacke', timeLimit: 45 },
  { id: 'e6_18', topic: 'Past Perfect', subject: 'english', level: 6, text: "By 8 o'clock, he ___ (finish) all his work.", type: 'multiple-choice', options: ['had finished', 'has finished', 'finished', 'was finishing'], correctAnswer: 'had finished', timeLimit: 45 },
  { id: 'e6_19', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to look forward to" mean?', type: 'multiple-choice', options: ['sich freuen auf', 'nachschlagen', 'aufpassen', 'zurückschauen'], correctAnswer: 'sich freuen auf', timeLimit: 40 },
  { id: 'e6_20', topic: 'Passiv', subject: 'english', level: 6, text: 'A new stadium ___ (build) right now in the city center.', type: 'multiple-choice', options: ['is being built', 'was built', 'has built', 'builds'], correctAnswer: 'is being built', timeLimit: 50 },

  // Level 7: Complex Structures & Advanced Proficiency (Grade 8 Upper Level)
  { id: 'e7_1', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_PEDESTRIAN, text: 'Um wie viel Prozent erhöht der Autoverkehr laut erwähnten Studien die Luftverschmutzung in der Innenstadt?', type: 'multiple-choice', options: ['15%', '25%', '35%', '50%'], correctAnswer: '35%', timeLimit: 50 },
  { id: 'e7_2', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_PEDESTRIAN, text: 'Welche zwei Hauptvorteile verspricht die Umwandlung der High Street laut dem Brief?', type: 'multiple-choice', options: ['Mehr Parkplätze und schnellere Autos', 'Förderung des lokalen Handels und Verbesserung der öffentlichen Gesundheit', 'Günstigere Mieten und neue Schulen', 'Mehr Buslinien und Flughafenanbindung'], correctAnswer: 'Förderung des lokalen Handels und Verbesserung der öffentlichen Gesundheit', timeLimit: 50 },
  { id: 'e7_3', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_AI, text: 'Welche Rolle soll KI (AI) in der medizinischen Diagnostik laut den Experten einnehmen?', type: 'multiple-choice', options: ['Ärzte vollständig ersetzen', 'Als unterstützendes Werkzeug die ärztliche Beurteilung ergänzen', 'Nur für Verwaltung und Abrechnung genutzt werden', 'Medikamente eigenständig verschreiben'], correctAnswer: 'Als unterstützendes Werkzeug die ärztliche Beurteilung ergänzen', timeLimit: 50 },
  { id: 'e7_4', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_AI, text: 'Wie unterstützt KI Ärzte bei der Erkennung seltener Krankheiten?', type: 'multiple-choice', options: ['Durch Analyse von zehntausenden medizinischen Scans in Sekunden', 'Durch automatische Operationen', 'Durch Befragung von Patienten', 'Durch Herstellung von Impfstoffen'], correctAnswer: 'Durch Analyse von zehntausenden medizinischen Scans in Sekunden', timeLimit: 50 },
  { id: 'e7_5', topic: 'Grammatik', subject: 'english', level: 7, text: 'If they had trained harder, they ___ the championship.', type: 'multiple-choice', options: ['would have won', 'will win', 'would win', 'had won'], correctAnswer: 'would have won', timeLimit: 50 },
  { id: 'e7_6', topic: 'Grammatik', subject: 'english', level: 7, text: 'She asked him where he ___ (live) before moving here.', type: 'multiple-choice', options: ['had lived', 'lived', 'lives', 'has lived'], correctAnswer: 'had lived', timeLimit: 45 },
  { id: 'e7_7', topic: 'Grammatik', subject: 'english', level: 7, text: 'The new hospital ___ (build) in our city recently.', type: 'multiple-choice', options: ['has been built', 'was built', 'is built', 'had built'], correctAnswer: 'has been built', timeLimit: 45 },
  { id: 'e7_8', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "inevitable"?', type: 'multiple-choice', options: ['unvermeidbar', 'unwahrscheinlich', 'ungewöhnlich', 'unsicher'], correctAnswer: 'unvermeidbar', timeLimit: 40 },
  { id: 'e7_9', topic: 'Grammatik', subject: 'english', level: 7, text: 'The company ___ she works for is located in Hamburg.', type: 'multiple-choice', options: ['which', 'who', 'whose', 'where'], correctAnswer: 'which', timeLimit: 45 },
  { id: 'e7_10', topic: 'Grammatik', subject: 'english', level: 7, text: 'Had I known about the meeting, I ___ attended it.', type: 'multiple-choice', options: ['would have', 'will have', 'would', 'had'], correctAnswer: 'would have', timeLimit: 50 },
  { id: 'e7_11', topic: 'Inversion', subject: 'english', level: 7, text: 'Seldom ___ such a remarkable performance.', type: 'multiple-choice', options: ['have I seen', 'I have seen', 'saw I', 'I saw'], correctAnswer: 'have I seen', timeLimit: 50 },
  { id: 'e7_12', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "ubiquitous"?', type: 'multiple-choice', options: ['allgegenwärtig', 'selten', 'verwirrend', 'wertvoll'], correctAnswer: 'allgegenwärtig', timeLimit: 45 },
  { id: 'e7_13', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'He stopped ___ (smoke) three years ago.', type: 'multiple-choice', options: ['smoking', 'to smoke', 'smoke', 'smoked'], correctAnswer: 'smoking', timeLimit: 45 },
  { id: 'e7_14', topic: 'Modals in Past', subject: 'english', level: 7, text: 'You ___ (should / bring) an umbrella; it rained all day.', type: 'multiple-choice', options: ['should have brought', 'should bring', 'must bring', 'had brought'], correctAnswer: 'should have brought', timeLimit: 50 },
  { id: 'e7_15', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "meticulous"?', type: 'multiple-choice', options: ['akribisch', 'nachlässig', 'großzügig', 'mutig'], correctAnswer: 'akribisch', timeLimit: 45 },
  { id: 'e7_16', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_PEDESTRIAN, text: 'Welche zwei neuen Elemente sollen bei der Umgestaltung der High Street hinzugefügt werden?', type: 'multiple-choice', options: ['Grünflächen und Fahrradwege', 'Parkhäuser und Tankstellen', 'Flughafenterminals und Busbahnhöfe', 'Einkaufszentren und Fabriken'], correctAnswer: 'Grünflächen und Fahrradwege', timeLimit: 50 },
  { id: 'e7_17', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_AI, text: 'Was analysieren KI-Systeme in der Medizin innerhalb weniger Sekunden?', type: 'multiple-choice', options: ['Zehntausende medizinische Bildgebungs-Scans', 'Blutdruckwerte von Millionen Menschen', 'Krankenhausrechnungen', 'Rezeptformulare'], correctAnswer: 'Zehntausende medizinische Bildgebungs-Scans', timeLimit: 50 },
  { id: 'e7_18', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'He remembered ___ (lock) the door before leaving.', type: 'multiple-choice', options: ['locking', 'to lock', 'lock', 'locked'], correctAnswer: 'locking', timeLimit: 45 },
  { id: 'e7_19', topic: 'Inversion', subject: 'english', level: 7, text: 'Not only ___ the exam, but she also scored the highest mark.', type: 'multiple-choice', options: ['did she pass', 'she passed', 'passed she', 'she did pass'], correctAnswer: 'did she pass', timeLimit: 50 },
  { id: 'e7_20', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "resilient"?', type: 'multiple-choice', options: ['belastbar', 'zerbrechlich', 'zögerlich', 'eifersüchtig'], correctAnswer: 'belastbar', timeLimit: 45 },

  // --- LEVEL 1 EXPANSION (50+ TOTAL) ---
  { id: 'e1_21', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Tisch" auf Englisch?', type: 'input', correctAnswer: 'table', timeLimit: 45 },
  { id: 'e1_22', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Stuhl" auf Englisch?', type: 'input', correctAnswer: 'chair', timeLimit: 45 },
  { id: 'e1_23', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Tür" auf Englisch?', type: 'input', correctAnswer: 'door', timeLimit: 45 },
  { id: 'e1_24', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Fenster" auf Englisch?', type: 'input', correctAnswer: 'window', timeLimit: 45 },
  { id: 'e1_25', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Bleistift" auf Englisch?', type: 'input', correctAnswer: ['pencil', 'pen'], timeLimit: 45 },
  { id: 'e1_26', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "1" auf Englisch?', type: 'input', correctAnswer: 'one', timeLimit: 45 },
  { id: 'e1_27', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "2" auf Englisch?', type: 'input', correctAnswer: 'two', timeLimit: 45 },
  { id: 'e1_28', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "3" auf Englisch?', type: 'input', correctAnswer: 'three', timeLimit: 45 },
  { id: 'e1_29', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "4" auf Englisch?', type: 'input', correctAnswer: 'four', timeLimit: 45 },
  { id: 'e1_30', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "6" auf Englisch?', type: 'input', correctAnswer: 'six', timeLimit: 45 },
  { id: 'e1_31', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "7" auf Englisch?', type: 'input', correctAnswer: 'seven', timeLimit: 45 },
  { id: 'e1_32', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "8" auf Englisch?', type: 'input', correctAnswer: 'eight', timeLimit: 45 },
  { id: 'e1_33', topic: 'Zahlen', subject: 'english', level: 1, text: 'Was heißt die Zahl "9" auf Englisch?', type: 'input', correctAnswer: 'nine', timeLimit: 45 },
  { id: 'e1_34', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "He ___ a boy."', type: 'multiple-choice', options: ['is', 'are', 'am'], correctAnswer: 'is', timeLimit: 45 },
  { id: 'e1_35', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "It ___ cold."', type: 'multiple-choice', options: ['is', 'are', 'am'], correctAnswer: 'is', timeLimit: 45 },
  { id: 'e1_36', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "They ___ pupils."', type: 'multiple-choice', options: ['are', 'is', 'am'], correctAnswer: 'are', timeLimit: 45 },
  { id: 'e1_37', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze: "I ___ ten years old."', type: 'multiple-choice', options: ['am', 'is', 'are'], correctAnswer: 'am', timeLimit: 45 },
  { id: 'e1_38', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "green" auf Deutsch?', type: 'input', correctAnswer: 'grün', timeLimit: 45 },
  { id: 'e1_39', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "yellow" auf Deutsch?', type: 'input', correctAnswer: 'gelb', timeLimit: 45 },
  { id: 'e1_40', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "black" auf Deutsch?', type: 'input', correctAnswer: 'schwarz', timeLimit: 45 },
  { id: 'e1_41', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Welche Farbe ist "white" auf Deutsch?', type: 'input', correctAnswer: 'weiß', timeLimit: 45 },
  { id: 'e1_42', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Mutter" auf Englisch?', type: 'input', correctAnswer: ['mother', 'mom', 'mum'], timeLimit: 45 },
  { id: 'e1_43', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Vater" auf Englisch?', type: 'input', correctAnswer: ['father', 'dad'], timeLimit: 45 },
  { id: 'e1_44', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Bruder" auf Englisch?', type: 'input', correctAnswer: 'brother', timeLimit: 45 },
  { id: 'e1_45', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Schwester" auf Englisch?', type: 'input', correctAnswer: 'sister', timeLimit: 45 },
  { id: 'e1_46', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze den unbestimmten Artikel: "... banana"', type: 'multiple-choice', options: ['a', 'an', 'the'], correctAnswer: 'a', timeLimit: 45 },
  { id: 'e1_47', topic: 'Grammatik', subject: 'english', level: 1, text: 'Ergänze den unbestimmten Artikel: "... orange"', type: 'multiple-choice', options: ['an', 'a', 'the'], correctAnswer: 'an', timeLimit: 45 },
  { id: 'e1_48', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Vogel" auf Englisch?', type: 'input', correctAnswer: 'bird', timeLimit: 45 },
  { id: 'e1_49', topic: 'Vokabeln', subject: 'english', level: 1, text: 'Was heißt "Sonne" auf Englisch?', type: 'input', correctAnswer: 'sun', timeLimit: 45 },
  { id: 'e1_50', topic: 'Satzbau', subject: 'english', level: 1, text: 'Bringe die Wörter in die richtige Reihenfolge:', type: 'drag-sort', dragItems: ['is', 'a', 'dog', 'This'], correctAnswer: 'This is a dog', timeLimit: 45 },

  // --- LEVEL 2 EXPANSION (50+ TOTAL) ---
  { id: 'e2_21', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Klasse" / "Klassenzimmer" auf Englisch?', type: 'input', correctAnswer: ['classroom', 'class'], timeLimit: 30 },
  { id: 'e2_22', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "box"?', type: 'input', correctAnswer: 'boxes', timeLimit: 30 },
  { id: 'e2_23', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "bus"?', type: 'input', correctAnswer: 'buses', timeLimit: 30 },
  { id: 'e2_24', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "city"?', type: 'input', correctAnswer: 'cities', timeLimit: 30 },
  { id: 'e2_25', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "come"?', type: 'multiple-choice', options: ['came', 'comed', 'come'], correctAnswer: 'came', timeLimit: 30 },
  { id: 'e2_26', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "drink"?', type: 'multiple-choice', options: ['drank', 'drinked', 'drunk'], correctAnswer: 'drank', timeLimit: 30 },
  { id: 'e2_27', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "give"?', type: 'multiple-choice', options: ['gave', 'gived', 'given'], correctAnswer: 'gave', timeLimit: 30 },
  { id: 'e2_28', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "take"?', type: 'multiple-choice', options: ['took', 'taked', 'taken'], correctAnswer: 'took', timeLimit: 30 },
  { id: 'e2_29', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "I live ___ Berlin."', type: 'multiple-choice', options: ['in', 'on', 'at'], correctAnswer: 'in', timeLimit: 30 },
  { id: 'e2_30', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "The cat is ___ the bed." (unter dem Bett)', type: 'multiple-choice', options: ['under', 'on', 'over'], correctAnswer: 'under', timeLimit: 30 },
  { id: 'e2_31', topic: 'Grammatik', subject: 'english', level: 2, text: 'Pronomen: "Look at the girls. Look at ___."', type: 'multiple-choice', options: ['them', 'they', 'their'], correctAnswer: 'them', timeLimit: 30 },
  { id: 'e2_32', topic: 'Grammatik', subject: 'english', level: 2, text: 'Pronomen: "This is my bike. It belongs to ___."', type: 'multiple-choice', options: ['me', 'I', 'my'], correctAnswer: 'me', timeLimit: 30 },
  { id: 'e2_33', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Mittagessen" auf Englisch?', type: 'input', correctAnswer: 'lunch', timeLimit: 30 },
  { id: 'e2_34', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Freund" auf Englisch?', type: 'input', correctAnswer: 'friend', timeLimit: 30 },
  { id: 'e2_35', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Zimmer" / "Raum" auf Englisch?', type: 'input', correctAnswer: 'room', timeLimit: 30 },
  { id: 'e2_36', topic: 'Grammatik', subject: 'english', level: 2, text: 'Wähle die richtige Form: "She ___ tennis on Saturdays."', type: 'multiple-choice', options: ['plays', 'play', 'playing'], correctAnswer: 'plays', timeLimit: 30 },
  { id: 'e2_37', topic: 'Grammatik', subject: 'english', level: 2, text: 'Verneinung: "They ___ like homework."', type: 'multiple-choice', options: ["don't", "doesn't", "not"], correctAnswer: "don't", timeLimit: 30 },
  { id: 'e2_38', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "write"?', type: 'multiple-choice', options: ['wrote', 'writed', 'written'], correctAnswer: 'wrote', timeLimit: 30 },
  { id: 'e2_39', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "sing"?', type: 'multiple-choice', options: ['sang', 'singed', 'sung'], correctAnswer: 'sang', timeLimit: 30 },
  { id: 'e2_40', topic: 'Zeiten', subject: 'english', level: 2, text: 'Vergangenheit (Simple Past) von "swim"?', type: 'multiple-choice', options: ['swam', 'swimmed', 'swum'], correctAnswer: 'swam', timeLimit: 30 },
  { id: 'e2_41', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "We get up ___ 7 o\'clock."', type: 'multiple-choice', options: ['at', 'on', 'in'], correctAnswer: 'at', timeLimit: 30 },
  { id: 'e2_42', topic: 'Präpositionen', subject: 'english', level: 2, text: 'Ergänze: "My birthday is ___ Monday."', type: 'multiple-choice', options: ['on', 'in', 'at'], correctAnswer: 'on', timeLimit: 30 },
  { id: 'e2_43', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Lehrer" auf Englisch?', type: 'input', correctAnswer: 'teacher', timeLimit: 30 },
  { id: 'e2_44', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Rucksack" / "Tasche" auf Englisch?', type: 'input', correctAnswer: ['bag', 'backpack'], timeLimit: 30 },
  { id: 'e2_45', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Garten" auf Englisch?', type: 'input', correctAnswer: 'garden', timeLimit: 30 },
  { id: 'e2_46', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "woman"?', type: 'input', correctAnswer: 'women', timeLimit: 30 },
  { id: 'e2_47', topic: 'Grammatik', subject: 'english', level: 2, text: 'Was ist die Mehrzahl von "tooth"?', type: 'input', correctAnswer: 'teeth', timeLimit: 30 },
  { id: 'e2_48', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Sommer" auf Englisch?', type: 'input', correctAnswer: 'summer', timeLimit: 30 },
  { id: 'e2_49', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Was heißt "Winter" auf Englisch?', type: 'input', correctAnswer: 'winter', timeLimit: 30 },
  { id: 'e2_50', topic: 'Vokabeln', subject: 'english', level: 2, text: 'Ordne die englischen Wörter den Übersetzungen zu:', type: 'matching', matchingPairs: [{ left: 'summer', right: 'Sommer' }, { left: 'winter', right: 'Winter' }, { left: 'friend', right: 'Freund' }], correctAnswer: 'friend:Freund;summer:Sommer;winter:Winter', timeLimit: 45 },

  // --- LEVEL 3 EXPANSION (50+ TOTAL) ---
  { id: 'e3_21', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "small": small -> ___ -> smallest', type: 'input', correctAnswer: 'smaller', timeLimit: 30 },
  { id: 'e3_22', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "tall": tall -> ___ -> tallest', type: 'input', correctAnswer: 'taller', timeLimit: 30 },
  { id: 'e3_23', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "bad": bad -> ___ -> worst', type: 'input', correctAnswer: 'worse', timeLimit: 30 },
  { id: 'e3_24', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "go"?', type: 'input', correctAnswer: 'gone', timeLimit: 30 },
  { id: 'e3_25', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "see"?', type: 'input', correctAnswer: 'seen', timeLimit: 30 },
  { id: 'e3_26', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "do"?', type: 'input', correctAnswer: 'done', timeLimit: 30 },
  { id: 'e3_27', topic: 'Zeiten', subject: 'english', level: 3, text: 'Past Participle (3. Form) von "make"?', type: 'input', correctAnswer: 'made', timeLimit: 30 },
  { id: 'e3_28', topic: 'Modalverben', subject: 'english', level: 3, text: 'Übersetze "müssen": "You ___ do your homework."', type: 'multiple-choice', options: ['must', 'can', 'may'], correctAnswer: 'must', timeLimit: 30 },
  { id: 'e3_29', topic: 'Modalverben', subject: 'english', level: 3, text: 'Übersetze "dürfen": "May I leave?"', type: 'multiple-choice', options: ['Darf ich', 'Kann ich', 'Muss ich'], correctAnswer: 'Darf ich', timeLimit: 30 },
  { id: 'e3_30', topic: 'Grammatik', subject: 'english', level: 3, text: 'Ergänze: "I have lived here ___ 2018."', type: 'multiple-choice', options: ['since', 'for', 'in'], correctAnswer: 'since', timeLimit: 35 },
  { id: 'e3_31', topic: 'Grammatik', subject: 'english', level: 3, text: 'Ergänze: "She has studied English ___ five years."', type: 'multiple-choice', options: ['for', 'since', 'at'], correctAnswer: 'for', timeLimit: 35 },
  { id: 'e3_32', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was ist das Gegenteil von "heavy"?', type: 'input', correctAnswer: 'light', timeLimit: 30 },
  { id: 'e3_33', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was ist das Gegenteil von "clean"?', type: 'input', correctAnswer: 'dirty', timeLimit: 30 },
  { id: 'e3_34', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was ist das Gegenteil von "fast"?', type: 'input', correctAnswer: 'slow', timeLimit: 30 },
  { id: 'e3_35', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was ist das Gegenteil von "young"?', type: 'input', correctAnswer: 'old', timeLimit: 30 },
  { id: 'e3_36', topic: 'Zeiten', subject: 'english', level: 3, text: 'Simple Past von "think"?', type: 'input', correctAnswer: 'thought', timeLimit: 30 },
  { id: 'e3_37', topic: 'Zeiten', subject: 'english', level: 3, text: 'Simple Past von "bring"?', type: 'input', correctAnswer: 'brought', timeLimit: 30 },
  { id: 'e3_38', topic: 'Zeiten', subject: 'english', level: 3, text: 'Simple Past von "catch"?', type: 'input', correctAnswer: 'caught', timeLimit: 30 },
  { id: 'e3_39', topic: 'Zeiten', subject: 'english', level: 3, text: 'Simple Past von "teach"?', type: 'input', correctAnswer: 'taught', timeLimit: 30 },
  { id: 'e3_40', topic: 'Grammatik', subject: 'english', level: 3, text: 'Possessivpronomen: "This book belongs to her. It is ___."', type: 'multiple-choice', options: ['hers', 'her', 'she'], correctAnswer: 'hers', timeLimit: 35 },
  { id: 'e3_41', topic: 'Grammatik', subject: 'english', level: 3, text: 'Possessivpronomen: "This car belongs to us. It is ___."', type: 'multiple-choice', options: ['ours', 'our', 'us'], correctAnswer: 'ours', timeLimit: 35 },
  { id: 'e3_42', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "cold": cold -> ___ -> coldest', type: 'input', correctAnswer: 'colder', timeLimit: 30 },
  { id: 'e3_43', topic: 'Steigerung', subject: 'english', level: 3, text: 'Steigerung von "happy": happy -> ___ -> happiest', type: 'input', correctAnswer: 'happier', timeLimit: 30 },
  { id: 'e3_44', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was heißt "Flughafen" auf Englisch?', type: 'input', correctAnswer: 'airport', timeLimit: 30 },
  { id: 'e3_45', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was heißt "Bahnhof" auf Englisch?', type: 'input', correctAnswer: ['station', 'train station'], timeLimit: 30 },
  { id: 'e3_46', topic: 'Grammatik', subject: 'english', level: 3, text: 'Wähle das richtige Signalwort für Present Continuous:', type: 'multiple-choice', options: ['now', 'yesterday', 'always'], correctAnswer: 'now', timeLimit: 35 },
  { id: 'e3_47', topic: 'Grammatik', subject: 'english', level: 3, text: 'Wähle das richtige Signalwort für Simple Past:', type: 'multiple-choice', options: ['yesterday', 'now', 'already'], correctAnswer: 'yesterday', timeLimit: 35 },
  { id: 'e3_48', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was heißt "Wetter" auf Englisch?', type: 'input', correctAnswer: 'weather', timeLimit: 30 },
  { id: 'e3_49', topic: 'Vokabeln', subject: 'english', level: 3, text: 'Was heißt "Urlaub" / "Ferien" auf Englisch?', type: 'input', correctAnswer: ['holiday', 'holidays', 'vacation'], timeLimit: 30 },
  { id: 'e3_50', topic: 'Satzbau', subject: 'english', level: 3, text: 'Bringe den Satz in die richtige Reihenfolge:', type: 'drag-sort', dragItems: ['have', 'already', 'I', 'finished'], correctAnswer: 'I have already finished', timeLimit: 45 },

  // --- LEVEL 4 EXPANSION (50+ TOTAL) ---
  { id: 'e4_21', topic: 'Grammatik', subject: 'english', level: 4, text: 'Adverb von "happy": "She smiled ___."', type: 'input', correctAnswer: 'happily', timeLimit: 35 },
  { id: 'e4_22', topic: 'Grammatik', subject: 'english', level: 4, text: 'Adverb von "easy": "He solved the puzzle ___."', type: 'input', correctAnswer: 'easily', timeLimit: 35 },
  { id: 'e4_23', topic: 'Relativsätze', subject: 'english', level: 4, text: 'The car ___ he drives is red.', type: 'multiple-choice', options: ['which', 'who', 'whose'], correctAnswer: 'which', timeLimit: 40 },
  { id: 'e4_24', topic: 'Relativsätze', subject: 'english', level: 4, text: 'The woman ___ lives next door is a doctor.', type: 'multiple-choice', options: ['who', 'which', 'whose'], correctAnswer: 'who', timeLimit: 40 },
  { id: 'e4_25', topic: 'Relativsätze', subject: 'english', level: 4, text: 'The girl ___ dog ran away was crying.', type: 'multiple-choice', options: ['whose', 'who', 'which'], correctAnswer: 'whose', timeLimit: 40 },
  { id: 'e4_26', topic: 'Conditionals', subject: 'english', level: 4, text: 'Type 1 Conditional: If I see Tom, I ___ (tell) him.', type: 'multiple-choice', options: ['will tell', 'told', 'would tell'], correctAnswer: 'will tell', timeLimit: 40 },
  { id: 'e4_27', topic: 'Conditionals', subject: 'english', level: 4, text: 'Type 1 Conditional: If she ___ (study), she will pass.', type: 'multiple-choice', options: ['studies', 'study', 'studied'], correctAnswer: 'studies', timeLimit: 40 },
  { id: 'e4_28', topic: 'Conditionals', subject: 'english', level: 4, text: 'Type 2 Conditional: If I ___ (have) a million dollars, I would buy a boat.', type: 'multiple-choice', options: ['had', 'have', 'will have'], correctAnswer: 'had', timeLimit: 45 },
  { id: 'e4_29', topic: 'Conditionals', subject: 'english', level: 4, text: 'Type 2 Conditional: If he were rich, he ___ (travel) more.', type: 'multiple-choice', options: ['would travel', 'will travel', 'travelled'], correctAnswer: 'would travel', timeLimit: 45 },
  { id: 'e4_30', topic: 'Zeiten', subject: 'english', level: 4, text: 'Past Continuous: "At 8 PM last night, I ___ (read) a book."', type: 'multiple-choice', options: ['was reading', 'were reading', 'read'], correctAnswer: 'was reading', timeLimit: 40 },
  { id: 'e4_31', topic: 'Zeiten', subject: 'english', level: 4, text: 'Past Continuous vs Simple Past: "I was sleeping when the alarm ___ (go) off."', type: 'multiple-choice', options: ['went', 'was going', 'goes'], correctAnswer: 'went', timeLimit: 40 },
  { id: 'e4_32', topic: 'Steigerung', subject: 'english', level: 4, text: 'Superlativ von "beautiful": "She is the ___ girl."', type: 'multiple-choice', options: ['most beautiful', 'more beautiful', 'beautifullest'], correctAnswer: 'most beautiful', timeLimit: 40 },
  { id: 'e4_33', topic: 'Steigerung', subject: 'english', level: 4, text: 'Komparativ von "dangerous": "Lions are ___ than cats."', type: 'multiple-choice', options: ['more dangerous', 'most dangerous', 'dangerouser'], correctAnswer: 'more dangerous', timeLimit: 40 },
  { id: 'e4_34', topic: 'Vokabeln', subject: 'english', level: 4, text: 'Was bedeutet "to discover"?', type: 'multiple-choice', options: ['entdecken', 'erfinden', 'erklären'], correctAnswer: 'entdecken', timeLimit: 35 },
  { id: 'e4_35', topic: 'Vokabeln', subject: 'english', level: 4, text: 'Was bedeutet "to invent"?', type: 'multiple-choice', options: ['erfinden', 'entdecken', 'einladen'], correctAnswer: 'erfinden', timeLimit: 35 },
  { id: 'e4_36', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_ANNOUNCEMENT, text: 'Welche zwei Dinge sollen Schüler mitbringen?', type: 'multiple-choice', options: ['Wasser und Sportkleidung', 'Bücher und Stifte', 'Geld und Handy'], correctAnswer: 'Wasser und Sportkleidung', timeLimit: 45 },
  { id: 'e4_37', topic: 'Leseverständnis', subject: 'english', level: 4, readingPassage: PASSAGE_L4_EMAIL, text: 'Mit wem fährt Emma am Wochenende zum Zelten?', type: 'multiple-choice', options: ['Mit ihrem Vater', 'Mit ihrer Mutter', 'Mit ihrer Lehrerin'], correctAnswer: 'Mit ihrem Vater', timeLimit: 45 },
  { id: 'e4_38', topic: 'Grammatik', subject: 'english', level: 4, text: 'Wähle das passende Adverb: "He runs very ___."', type: 'multiple-choice', options: ['fast', 'fastly', 'fasterly'], correctAnswer: 'fast', timeLimit: 35 },
  { id: 'e4_39', topic: 'Grammatik', subject: 'english', level: 4, text: 'Wähle die richtige Form: "I haven\'t seen him ___ last month."', type: 'multiple-choice', options: ['since', 'for', 'ago'], correctAnswer: 'since', timeLimit: 35 },
  { id: 'e4_40', topic: 'Grammatik', subject: 'english', level: 4, text: 'Wähle die richtige Form: "She has been working here ___ two years."', type: 'multiple-choice', options: ['for', 'since', 'at'], correctAnswer: 'for', timeLimit: 35 },
  { id: 'e4_41', topic: 'Zeiten', subject: 'english', level: 4, text: 'Vergangenheit (Simple Past) von "fly"?', type: 'input', correctAnswer: 'flew', timeLimit: 30 },
  { id: 'e4_42', topic: 'Zeiten', subject: 'english', level: 4, text: 'Past Participle von "fly"?', type: 'input', correctAnswer: 'flown', timeLimit: 30 },
  { id: 'e4_43', topic: 'Zeiten', subject: 'english', level: 4, text: 'Vergangenheit (Simple Past) von "know"?', type: 'input', correctAnswer: 'knew', timeLimit: 30 },
  { id: 'e4_44', topic: 'Zeiten', subject: 'english', level: 4, text: 'Past Participle von "know"?', type: 'input', correctAnswer: 'known', timeLimit: 30 },
  { id: 'e4_45', topic: 'Vokabeln', subject: 'english', level: 4, text: 'Was heißt "Erfahrung" auf Englisch?', type: 'input', correctAnswer: 'experience', timeLimit: 35 },
  { id: 'e4_46', topic: 'Vokabeln', subject: 'english', level: 4, text: 'Was heißt "Abenteuer" auf Englisch?', type: 'input', correctAnswer: 'adventure', timeLimit: 35 },
  { id: 'e4_47', topic: 'Conditionals', subject: 'english', level: 4, text: 'If we leave now, we ___ (catch) the bus.', type: 'multiple-choice', options: ['will catch', 'caught', 'would catch'], correctAnswer: 'will catch', timeLimit: 40 },
  { id: 'e4_48', topic: 'Relativsätze', subject: 'english', level: 4, text: 'The house ___ roof was damaged has been repaired.', type: 'multiple-choice', options: ['whose', 'which', 'who'], correctAnswer: 'whose', timeLimit: 40 },
  { id: 'e4_49', topic: 'Grammatik', subject: 'english', level: 4, text: 'Adverb von "loud": "He shouted ___."', type: 'input', correctAnswer: 'loudly', timeLimit: 35 },
  { id: 'e4_50', topic: 'Grammatik', subject: 'english', level: 4, text: 'Ordne die Adjektive den Adverbien zu:', type: 'matching', matchingPairs: [{ left: 'quick', right: 'quickly' }, { left: 'careful', right: 'carefully' }, { left: 'good', right: 'well' }], correctAnswer: 'careful:carefully;good:well;quick:quickly', timeLimit: 45 },

  // --- LEVEL 5 EXPANSION (50+ TOTAL) ---
  { id: 'e5_21', topic: 'Passiv', subject: 'english', level: 5, text: 'Active: "Shakespeare wrote Hamlet." -> Passive: "Hamlet ___ by Shakespeare."', type: 'multiple-choice', options: ['was written', 'is written', 'wrote'], correctAnswer: 'was written', timeLimit: 45 },
  { id: 'e5_22', topic: 'Passiv', subject: 'english', level: 5, text: 'Active: "They build houses." -> Passive: "Houses ___ by them."', type: 'multiple-choice', options: ['are built', 'were built', 'have built'], correctAnswer: 'are built', timeLimit: 45 },
  { id: 'e5_23', topic: 'Passiv', subject: 'english', level: 5, text: 'Active: "Somebody stole my bike." -> Passive: "My bike ___."', type: 'multiple-choice', options: ['was stolen', 'is stolen', 'stole'], correctAnswer: 'was stolen', timeLimit: 45 },
  { id: 'e5_24', topic: 'Indirekte Rede', subject: 'english', level: 5, text: 'Direct: "I love pizza." -> Reported: He said that he ___ pizza.', type: 'multiple-choice', options: ['loved', 'loves', 'had loved'], correctAnswer: 'loved', timeLimit: 45 },
  { id: 'e5_25', topic: 'Indirekte Rede', subject: 'english', level: 5, text: 'Direct: "We are going home." -> Reported: They said that they ___ going home.', type: 'multiple-choice', options: ['were', 'are', 'had been'], correctAnswer: 'were', timeLimit: 45 },
  { id: 'e5_26', topic: 'Conditionals', subject: 'english', level: 5, text: 'Type 3 Conditional: If I had studied harder, I ___ (pass) the exam.', type: 'multiple-choice', options: ['would have passed', 'would pass', 'will pass'], correctAnswer: 'would have passed', timeLimit: 45 },
  { id: 'e5_27', topic: 'Conditionals', subject: 'english', level: 5, text: 'Type 3 Conditional: If they had invited us, we ___ (come).', type: 'multiple-choice', options: ['would have come', 'would come', 'came'], correctAnswer: 'would have come', timeLimit: 45 },
  { id: 'e5_28', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "deliberately"?', type: 'multiple-choice', options: ['absichtlich', 'versehentlich', 'langsam'], correctAnswer: 'absichtlich', timeLimit: 40 },
  { id: 'e5_29', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "inevitable"?', type: 'multiple-choice', options: ['unvermeidbar', 'unwahrscheinlich', 'ungewöhnlich'], correctAnswer: 'unvermeidbar', timeLimit: 40 },
  { id: 'e5_30', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "substantial"?', type: 'multiple-choice', options: ['erheblich', 'winzig', 'zufällig'], correctAnswer: 'erheblich', timeLimit: 40 },
  { id: 'e5_31', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_STORY, text: 'Aus welchem Jahr stammte die Notiz in der Metallkiste?', type: 'multiple-choice', options: ['1952', '1942', '1962'], correctAnswer: '1952', timeLimit: 45 },
  { id: 'e5_32', topic: 'Leseverständnis', subject: 'english', level: 5, readingPassage: PASSAGE_L5_RULES, text: 'Wann müssen Handys im Camp abgegeben werden?', type: 'multiple-choice', options: ['Vor dem Frühstück', 'Vor dem Abendessen', 'Um 22:00 Uhr'], correctAnswer: 'Vor dem Frühstück', timeLimit: 45 },
  { id: 'e5_33', topic: 'Grammatik', subject: 'english', level: 5, text: 'Wähle das richtige Pronomen: "The man with ___ I was speaking is a professor."', type: 'multiple-choice', options: ['whom', 'who', 'whose'], correctAnswer: 'whom', timeLimit: 45 },
  { id: 'e5_34', topic: 'Grammatik', subject: 'english', level: 5, text: 'Partizipialkonstruktion: "___ (see) the accident, he called the police."', type: 'multiple-choice', options: ['Seeing', 'Seen', 'Saw'], correctAnswer: 'Seeing', timeLimit: 45 },
  { id: 'e5_35', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Gegenteil von "increase":', type: 'input', correctAnswer: 'decrease', timeLimit: 35 },
  { id: 'e5_36', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Gegenteil von "accept":', type: 'input', correctAnswer: ['refuse', 'reject'], timeLimit: 35 },
  { id: 'e5_37', topic: 'Passiv', subject: 'english', level: 5, text: 'Present Perfect Passive: "The project ___ (finish) already."', type: 'multiple-choice', options: ['has been finished', 'was finished', 'is finished'], correctAnswer: 'has been finished', timeLimit: 45 },
  { id: 'e5_38', topic: 'Indirekte Rede', subject: 'english', level: 5, text: 'Direct: "I will call you." -> Reported: She promised that she ___ call me.', type: 'multiple-choice', options: ['would', 'will', 'had'], correctAnswer: 'would', timeLimit: 45 },
  { id: 'e5_39', topic: 'Conditionals', subject: 'english', level: 5, text: 'If I had seen the sign, I ___ (stop).', type: 'multiple-choice', options: ['would have stopped', 'would stop', 'stopped'], correctAnswer: 'would have stopped', timeLimit: 45 },
  { id: 'e5_40', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "to emphasize"?', type: 'multiple-choice', options: ['betonen', 'enttäuschen', 'empfehlen'], correctAnswer: 'betonen', timeLimit: 40 },
  { id: 'e5_41', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "consequence"?', type: 'multiple-choice', options: ['Folge', 'Ursache', 'Vorteil'], correctAnswer: 'Folge', timeLimit: 40 },
  { id: 'e5_42', topic: 'Grammatik', subject: 'english', level: 5, text: 'Wähle die passende Präposition: "She is good ___ mathematics."', type: 'multiple-choice', options: ['at', 'in', 'on'], correctAnswer: 'at', timeLimit: 40 },
  { id: 'e5_43', topic: 'Grammatik', subject: 'english', level: 5, text: 'Wähle die passende Präposition: "He is interested ___ science."', type: 'multiple-choice', options: ['in', 'at', 'about'], correctAnswer: 'in', timeLimit: 40 },
  { id: 'e5_44', topic: 'Grammatik', subject: 'english', level: 5, text: 'Wähle die passende Präposition: "They are proud ___ their son."', type: 'multiple-choice', options: ['of', 'about', 'on'], correctAnswer: 'of', timeLimit: 40 },
  { id: 'e5_45', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was heißt "Herausforderung" auf Englisch?', type: 'input', correctAnswer: 'challenge', timeLimit: 35 },
  { id: 'e5_46', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was heißt "Lösung" auf Englisch?', type: 'input', correctAnswer: 'solution', timeLimit: 35 },
  { id: 'e5_47', topic: 'Passiv', subject: 'english', level: 5, text: 'Future Passive: "The new school ___ (build) next year."', type: 'multiple-choice', options: ['will be built', 'is built', 'was built'], correctAnswer: 'will be built', timeLimit: 45 },
  { id: 'e5_48', topic: 'Indirekte Rede', subject: 'english', level: 5, text: 'Direct: "Where do you live?" -> Reported: He asked me where I ___.', type: 'multiple-choice', options: ['lived', 'live', 'had lived'], correctAnswer: 'lived', timeLimit: 45 },
  { id: 'e5_49', topic: 'Vokabeln', subject: 'english', level: 5, text: 'Was bedeutet "opportunity"?', type: 'multiple-choice', options: ['Gelegenheit', 'Hindernis', 'Gefahr'], correctAnswer: 'Gelegenheit', timeLimit: 40 },
  { id: 'e5_50', topic: 'Satzbau', subject: 'english', level: 5, text: 'Ordne die Wörter zu einem korrekten Satz:', type: 'drag-sort', dragItems: ['been', 'has', 'The', 'repaired', 'car'], correctAnswer: 'The car has been repaired', timeLimit: 45 },

  // --- LEVEL 6 EXPANSION (50+ TOTAL) ---
  { id: 'e6_21', topic: 'Past Perfect', subject: 'english', level: 6, text: 'By the time we arrived, the show ___ (start).', type: 'multiple-choice', options: ['had started', 'has started', 'started'], correctAnswer: 'had started', timeLimit: 45 },
  { id: 'e6_22', topic: 'Past Perfect', subject: 'english', level: 6, text: 'She was tired because she ___ (work) for 10 hours.', type: 'multiple-choice', options: ['had been working', 'was working', 'worked'], correctAnswer: 'had been working', timeLimit: 45 },
  { id: 'e6_23', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to turn down an offer" mean?', type: 'multiple-choice', options: ['ein Angebot ablehnen', 'ein Angebot annehmen', 'ein Angebot verhandeln'], correctAnswer: 'ein Angebot ablehnen', timeLimit: 40 },
  { id: 'e6_24', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to call off the meeting" mean?', type: 'multiple-choice', options: ['das Treffen absagen', 'das Treffen beginnen', 'das Treffen verschieben'], correctAnswer: 'das Treffen absagen', timeLimit: 40 },
  { id: 'e6_25', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to carry out an experiment" mean?', type: 'multiple-choice', options: ['ein Experiment durchführen', 'ein Experiment abbrechen', 'ein Experiment planen'], correctAnswer: 'ein Experiment durchführen', timeLimit: 40 },
  { id: 'e6_26', topic: 'Conditionals', subject: 'english', level: 6, text: 'Mixed Conditional: If I had worked harder at school, I ___ a better job now.', type: 'multiple-choice', options: ['would have', 'will have', 'had had'], correctAnswer: 'would have', timeLimit: 45 },
  { id: 'e6_27', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_ENERGY, text: 'Was verwandeln Solarmodule direkt in Elektrizität?', type: 'multiple-choice', options: ['Sonnenlicht', 'Wind', 'Wasserkraft'], correctAnswer: 'Sonnenlicht', timeLimit: 45 },
  { id: 'e6_28', topic: 'Leseverständnis', subject: 'english', level: 6, readingPassage: PASSAGE_L6_CLIMB, text: 'Wie fühlte sich Clara auf dem Gipfel?', type: 'multiple-choice', options: ['Ein tiefes Gefühl des Erfolgs', 'Ein Gefühl der Enttäuschung', 'Ein Gefühl der Angst'], correctAnswer: 'Ein tiefes Gefühl des Erfolgs', timeLimit: 45 },
  { id: 'e6_29', topic: 'Passiv', subject: 'english', level: 6, text: 'Modal Passive: "This rule ___ (must / follow) by everyone."', type: 'multiple-choice', options: ['must be followed', 'must follow', 'is followed'], correctAnswer: 'must be followed', timeLimit: 45 },
  { id: 'e6_30', topic: 'Passiv', subject: 'english', level: 6, text: 'Continuous Passive: "The report ___ (prepare) at the moment."', type: 'multiple-choice', options: ['is being prepared', 'was prepared', 'has prepared'], correctAnswer: 'is being prepared', timeLimit: 45 },
  { id: 'e6_31', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was bedeutet "simultaneously"?', type: 'multiple-choice', options: ['gleichzeitig', 'nacheinander', 'selten'], correctAnswer: 'gleichzeitig', timeLimit: 40 },
  { id: 'e6_32', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was bedeutet "predictable"?', type: 'multiple-choice', options: ['vorhersehbar', 'unberechenbar', 'langweilig'], correctAnswer: 'vorhersehbar', timeLimit: 40 },
  { id: 'e6_33', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Synonym für "crucial":', type: 'multiple-choice', options: ['entscheidend', 'unwichtig', 'gefährlich'], correctAnswer: 'entscheidend', timeLimit: 40 },
  { id: 'e6_34', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Synonym für "reluctant":', type: 'multiple-choice', options: ['widerwillig', 'begeistert', 'bereitwillig'], correctAnswer: 'widerwillig', timeLimit: 40 },
  { id: 'e6_35', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to put off" mean?', type: 'multiple-choice', options: ['verschieben', 'anziehen', 'löschen'], correctAnswer: 'verschieben', timeLimit: 40 },
  { id: 'e6_36', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to run out of something" mean?', type: 'multiple-choice', options: ['ausgehen', 'schnell laufen', 'etwas wegwerfen'], correctAnswer: 'ausgehen', timeLimit: 40 },
  { id: 'e6_37', topic: 'Past Perfect', subject: 'english', level: 6, text: 'He realized he ___ (forget) his passport at home.', type: 'multiple-choice', options: ['had forgotten', 'has forgotten', 'forgot'], correctAnswer: 'had forgotten', timeLimit: 45 },
  { id: 'e6_38', topic: 'Conditionals', subject: 'english', level: 6, text: 'Unless it stops raining, we ___ (not go) to the park.', type: 'multiple-choice', options: ["won't go", "wouldn't go", "hadn't gone"], correctAnswer: "won't go", timeLimit: 45 },
  { id: 'e6_39', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was heißt "Umweltverschmutzung" auf Englisch?', type: 'input', correctAnswer: 'pollution', timeLimit: 35 },
  { id: 'e6_40', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was heißt "Erneuerbare Energie" auf Englisch?', type: 'input', correctAnswer: ['renewable energy', 'renewable energies'], timeLimit: 35 },
  { id: 'e6_41', topic: 'Grammatik', subject: 'english', level: 6, text: 'Wähle die richtige Form: "I look forward to ___ (meet) you."', type: 'multiple-choice', options: ['meeting', 'meet', 'to meet'], correctAnswer: 'meeting', timeLimit: 40 },
  { id: 'e6_42', topic: 'Grammatik', subject: 'english', level: 6, text: 'Wähle die richtige Form: "It\'s no use ___ (try) to convince him."', type: 'multiple-choice', options: ['trying', 'to try', 'try'], correctAnswer: 'trying', timeLimit: 40 },
  { id: 'e6_43', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was bedeutet "to accommodate"?', type: 'multiple-choice', options: ['unterbringen', 'ablehnen', 'beschleunigen'], correctAnswer: 'unterbringen', timeLimit: 40 },
  { id: 'e6_44', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was bedeutet "comprehensive"?', type: 'multiple-choice', options: ['umfassend', 'kompliziert', 'unverständlich'], correctAnswer: 'umfassend', timeLimit: 40 },
  { id: 'e6_45', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'What does "to look up to someone" mean?', type: 'multiple-choice', options: ['jemanden bewundern', 'jemanden suchen', 'jemanden ignorieren'], correctAnswer: 'jemanden bewundern', timeLimit: 40 },
  { id: 'e6_46', topic: 'Passiv', subject: 'english', level: 6, text: 'Active: "They are building a wall." -> Passive: "A wall ___."', type: 'multiple-choice', options: ['is being built', 'was built', 'has been built'], correctAnswer: 'is being built', timeLimit: 45 },
  { id: 'e6_47', topic: 'Past Perfect', subject: 'english', level: 6, text: 'Hardly ___ (she / enter) the room when the phone rang.', type: 'multiple-choice', options: ['had she entered', 'she entered', 'has she entered'], correctAnswer: 'had she entered', timeLimit: 45 },
  { id: 'e6_48', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was heißt "Verantwortung" auf Englisch?', type: 'input', correctAnswer: 'responsibility', timeLimit: 35 },
  { id: 'e6_49', topic: 'Vokabeln', subject: 'english', level: 6, text: 'Was heißt "Nachhaltigkeit" auf Englisch?', type: 'input', correctAnswer: 'sustainability', timeLimit: 35 },
  { id: 'e6_50', topic: 'Phrasal Verbs', subject: 'english', level: 6, text: 'Ordne die Phrasal Verbs ihren Bedeutungen zu:', type: 'matching', matchingPairs: [{ left: 'give up', right: 'aufgeben' }, { left: 'carry out', right: 'durchführen' }, { left: 'call off', right: 'absagen' }], correctAnswer: 'call off:absagen;carry out:durchführen;give up:aufgeben', timeLimit: 45 },

  // --- LEVEL 7 EXPANSION (50+ TOTAL) ---
  { id: 'e7_21', topic: 'Inversion', subject: 'english', level: 7, text: 'Rarely ___ such a spectacular sunset.', type: 'multiple-choice', options: ['have I seen', 'I have seen', 'saw I'], correctAnswer: 'have I seen', timeLimit: 50 },
  { id: 'e7_22', topic: 'Inversion', subject: 'english', level: 7, text: 'Under no circumstances ___ leave the building.', type: 'multiple-choice', options: ['should you', 'you should', 'you must'], correctAnswer: 'should you', timeLimit: 50 },
  { id: 'e7_23', topic: 'Inversion', subject: 'english', level: 7, text: 'Little ___ that his life was about to change.', type: 'multiple-choice', options: ['did he know', 'he knew', 'he has known'], correctAnswer: 'did he know', timeLimit: 50 },
  { id: 'e7_24', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'I regret ___ (inform) you that your application was unsuccessful.', type: 'multiple-choice', options: ['to inform', 'informing', 'inform'], correctAnswer: 'to inform', timeLimit: 45 },
  { id: 'e7_25', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'I regret ___ (spend) so much money yesterday.', type: 'multiple-choice', options: ['spending', 'to spend', 'spend'], correctAnswer: 'spending', timeLimit: 45 },
  { id: 'e7_26', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'She avoided ___ (answer) the embarrassing question.', type: 'multiple-choice', options: ['answering', 'to answer', 'answer'], correctAnswer: 'answering', timeLimit: 45 },
  { id: 'e7_27', topic: 'Modals in Past', subject: 'english', level: 7, text: 'He ___ (must / leave) early; his coat is gone.', type: 'multiple-choice', options: ['must have left', 'must leave', 'should leave'], correctAnswer: 'must have left', timeLimit: 50 },
  { id: 'e7_28', topic: 'Modals in Past', subject: 'english', level: 7, text: 'You ___ (need not / buy) milk; we already had plenty.', type: 'multiple-choice', options: ['need not have bought', 'did not need buy', 'should not buy'], correctAnswer: 'need not have bought', timeLimit: 50 },
  { id: 'e7_29', topic: 'Modals in Past', subject: 'english', level: 7, text: 'They ___ (could / win) if they hadn\'t made that mistake.', type: 'multiple-choice', options: ['could have won', 'could win', 'must have won'], correctAnswer: 'could have won', timeLimit: 50 },
  { id: 'e7_30', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_PEDESTRIAN, text: 'Was führt laut Brief zu einer Verringerung der Luftverschmutzung um 35%?', type: 'multiple-choice', options: ['Die Umwandlung in eine Fußgängerzone', 'Mehr Autoverkehr', 'Bau neuer Parkplätze'], correctAnswer: 'Die Umwandlung in eine Fußgängerzone', timeLimit: 50 },
  { id: 'e7_31', topic: 'Leseverständnis', subject: 'english', level: 7, readingPassage: PASSAGE_L7_AI, text: 'Was heben Medizin-Experten bezüglich KI hervor?', type: 'multiple-choice', options: ['KI dient als Hilfsmittel und ersetzt Ärzte nicht', 'KI ersetzt Ärzte vollständig', 'KI sollte verboten werden'], correctAnswer: 'KI dient als Hilfsmittel und ersetzt Ärzte nicht', timeLimit: 50 },
  { id: 'e7_32', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "ubiquitous"?', type: 'multiple-choice', options: ['allgegenwärtig', 'selten', 'wertvoll'], correctAnswer: 'allgegenwärtig', timeLimit: 45 },
  { id: 'e7_33', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "meticulous"?', type: 'multiple-choice', options: ['akribisch', 'nachlässig', 'großzügig'], correctAnswer: 'akribisch', timeLimit: 45 },
  { id: 'e7_34', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "pragmatic"?', type: 'multiple-choice', options: ['pragmatisch', 'theoretisch', 'emotional'], correctAnswer: 'pragmatisch', timeLimit: 45 },
  { id: 'e7_35', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "scrutiny"?', type: 'multiple-choice', options: ['genaue Untersuchung', 'Flucht', 'Begeisterung'], correctAnswer: 'genaue Untersuchung', timeLimit: 45 },
  { id: 'e7_36', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "eloquent"?', type: 'multiple-choice', options: ['redegewandt', 'schweigsam', 'wütend'], correctAnswer: 'redegewandt', timeLimit: 45 },
  { id: 'e7_37', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'He proposed ___ (start) the project immediately.', type: 'multiple-choice', options: ['starting', 'to start', 'start'], correctAnswer: 'starting', timeLimit: 45 },
  { id: 'e7_38', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'They managed ___ (finish) the task on time.', type: 'multiple-choice', options: ['to finish', 'finishing', 'finish'], correctAnswer: 'to finish', timeLimit: 45 },
  { id: 'e7_39', topic: 'Inversion', subject: 'english', level: 7, text: 'No sooner ___ arrived than the power went out.', type: 'multiple-choice', options: ['had he', 'he had', 'did he'], correctAnswer: 'had he', timeLimit: 50 },
  { id: 'e7_40', topic: 'Modals in Past', subject: 'english', level: 7, text: 'She ___ (cannot / see) me; I was hiding behind the wall.', type: 'multiple-choice', options: ['could not have seen', 'cannot see', 'must not see'], correctAnswer: 'could not have seen', timeLimit: 50 },
  { id: 'e7_41', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "compelling"?', type: 'multiple-choice', options: ['überzeugend', 'langweilig', 'kompliziert'], correctAnswer: 'überzeugend', timeLimit: 45 },
  { id: 'e7_42', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "unprecedented"?', type: 'multiple-choice', options: ['präzedenzlos', 'gewöhnlich', 'veraltet'], correctAnswer: 'präzedenzlos', timeLimit: 45 },
  { id: 'e7_43', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was bedeutet "resilient"?', type: 'multiple-choice', options: ['belastbar', 'zerbrechlich', 'nachgiebig'], correctAnswer: 'belastbar', timeLimit: 45 },
  { id: 'e7_44', topic: 'Grammatik', subject: 'english', level: 7, text: 'Subjunctive: "It is essential that he ___ (be) present at the hearing."', type: 'multiple-choice', options: ['be', 'is', 'was'], correctAnswer: 'be', timeLimit: 45 },
  { id: 'e7_45', topic: 'Grammatik', subject: 'english', level: 7, text: 'Subjunctive: "The board recommended that the proposal ___ (be) approved."', type: 'multiple-choice', options: ['be', 'is', 'were'], correctAnswer: 'be', timeLimit: 45 },
  { id: 'e7_46', topic: 'Gerund vs Infinitive', subject: 'english', level: 7, text: 'I look forward to ___ (hear) from you soon.', type: 'multiple-choice', options: ['hearing', 'hear', 'to hear'], correctAnswer: 'hearing', timeLimit: 45 },
  { id: 'e7_47', topic: 'Inversion', subject: 'english', level: 7, text: 'Not until much later ___ the truth.', type: 'multiple-choice', options: ['did we discover', 'we discovered', 'we did discover'], correctAnswer: 'did we discover', timeLimit: 50 },
  { id: 'e7_48', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was heißt "Tugend" auf Englisch?', type: 'input', correctAnswer: 'virtue', timeLimit: 40 },
  { id: 'e7_49', topic: 'Vokabeln', subject: 'english', level: 7, text: 'Was heißt "Gleichgewicht" auf Englisch?', type: 'input', correctAnswer: 'equilibrium', timeLimit: 40 },
  { id: 'e7_50', topic: 'Inversion', subject: 'english', level: 7, text: 'Bringe die Wörter in die Inversions-Reihenfolge:', type: 'drag-sort', dragItems: ['seen', 'have', 'I', 'Seldom', 'such', 'beauty'], correctAnswer: 'Seldom have I seen such beauty', timeLimit: 50 },
];

import { shuffleArray } from '../utils/shuffle';
export { shuffleArray };

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let mathGenCounter = 0;

export function generateMathQuestion(level: number, _askedIds: Set<string>): Question | null {
  mathGenCounter += 1;
  const id = `m_gen_${Date.now()}_${mathGenCounter}_${Math.random().toString(36).substring(2, 9)}`;

  if (level === 1) {
    const type = getRandomInt(1, 3);
    if (type === 1) {
      const a = getRandomInt(1, 10);
      const b = getRandomInt(1, 10);
      return {
        id,
        topic: 'Addition',
        subject: 'math',
        level: 1,
        storyContext: 'Tim sammelt rote und blaue Murmeln auf dem Pausenhof.',
        text: `Tim hat ${a} rote Murmeln und bekommt ${b} blaue Murmeln dazu. Wie viele Murmeln hat er insgesamt?`,
        type: 'input',
        correctAnswer: String(a + b),
        timeLimit: 45,
      };
    } else if (type === 2) {
      const a = getRandomInt(5, 20);
      const b = getRandomInt(1, a);
      return {
        id,
        topic: 'Subtraktion',
        subject: 'math',
        level: 1,
        storyContext: 'In der Schulbäckerei liegen frische Kekse bereit.',
        text: `Auf dem Tablett liegen ${a} Kekse. Die Kinder kaufen ${b} Kekse. Wie viele Kekse bleiben übrig?`,
        type: 'input',
        correctAnswer: String(a - b),
        timeLimit: 45,
      };
    } else {
      const a = getRandomInt(1, 9);
      const b = a * 10 + getRandomInt(1, 9);
      return {
        id,
        topic: 'Zahlenverständnis',
        subject: 'math',
        level: 1,
        storyContext: 'Auf dem Wochenmarkt werden Äpfel in 10er-Kisten verpackt.',
        text: `Der Markthändler hat ${b} Äpfel. Wie viele volle 10er-Kisten (Zehner) sind das?`,
        type: 'input',
        correctAnswer: String(a),
        timeLimit: 45,
      };
    }
  }

  if (level === 2) {
    const type = getRandomInt(1, 3);
    if (type === 1) {
      const a = getRandomInt(3, 10);
      const b = getRandomInt(3, 10);
      return {
        id,
        topic: 'Multiplikation',
        subject: 'math',
        level: 2,
        storyContext: 'Lisa betreibt an einem heißen Sommertag einen Limonadenstand.',
        text: `Lisa verkauft ${a} Gläser Limonade für jeweils ${b} Euro. Wie viel Euro nimmt sie insgesamt ein?`,
        type: 'input',
        correctAnswer: String(a * b),
        timeLimit: 30,
      };
    } else if (type === 2) {
      const b = getRandomInt(2, 9);
      const ans = getRandomInt(2, 10);
      const a = b * ans;
      return {
        id,
        topic: 'Division',
        subject: 'math',
        level: 2,
        storyContext: 'Ein Kindergeburtstag im Park.',
        text: `Eine Blechpizza ist in ${a} Stücke geschnitten und wird gleichmäßig auf ${b} Kinder verteilt. Wie viele Stücke bekommt jedes Kind?`,
        type: 'input',
        correctAnswer: String(ans),
        timeLimit: 30,
      };
    } else {
      const side = getRandomInt(2, 10);
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 2,
        storyContext: 'Schulgarten-Projekt der 3. Klasse.',
        text: `Ein quadratisches Blumenbeet hat eine Seitenlänge von ${side} cm. Wie groß ist der Umfang des Beetes in cm?`,
        type: 'input',
        correctAnswer: String(side * 4),
        timeLimit: 30,
        diagramData: { shape: 'rectangle', labels: { a: side, b: side } },
      };
    }
  }

  if (level === 3) {
    const type = getRandomInt(1, 5);
    if (type === 1) {
      const denominators = [2, 4, 5, 10];
      const b = denominators[getRandomInt(0, denominators.length - 1)];
      const a = getRandomInt(1, b - 1);
      const dec = a / b;
      return {
        id,
        topic: 'Bruchrechnung',
        subject: 'math',
        level: 3,
        storyContext: 'Auf dem Schulfest wird ein Kuchen angeschnitten.',
        text: `Vom Kuchen sind noch ${a}/${b} übrig. Wie lautet diese Zahl als Dezimalzahl?`,
        type: 'input',
        correctAnswer: String(dec).replace('.', ','),
        timeLimit: 40,
      };
    } else if (type === 2) {
      const a = getRandomInt(1, 9) / 10;
      const b = getRandomInt(1, 9) / 10;
      return {
        id,
        topic: 'Dezimalrechnung',
        subject: 'math',
        level: 3,
        storyContext: 'Einkauf im Schreibwarengeschäft.',
        text: `Ein Stift kostet ${(a).toFixed(1).replace('.', ',')} € und ein Radiergummi kostet ${(b).toFixed(1).replace('.', ',')} €. Wie viel Euro kosten beide zusammen?`,
        type: 'input',
        correctAnswer: String((a + b).toFixed(1)).replace('.', ','),
        timeLimit: 40,
      };
    } else if (type === 3) {
      const denOptions = [4, 6, 8];
      const b = denOptions[getRandomInt(0, denOptions.length - 1)];
      const a = getRandomInt(1, b - 1);
      return {
        id,
        topic: 'Bruchrechnung',
        subject: 'math',
        level: 3,
        storyContext: 'Interaktiver Pizza-Verteiler.',
        text: `Markiere auf dem Kreis genau ${a} von ${b} Stücken, um den Bruch ${a}/${b} darzustellen:`,
        type: 'fraction-pie',
        targetFraction: { numerator: a, denominator: b },
        correctAnswer: `${a}/${b}`,
        timeLimit: 45,
      };
    } else if (type === 4) {
      const denOptions = [4, 6, 8, 10];
      const d = denOptions[getRandomInt(0, denOptions.length - 1)];
      const dHalf = d / 2;
      const n1 = 3;
      const n2 = 1;
      return {
        id,
        topic: 'Bruchrechnung',
        subject: 'math',
        level: 3,
        storyContext: 'Saftmischen nach Rezept.',
        text: `Du mischst ${n1}/${d} Liter Apfelsaft mit ${n2}/${dHalf} Liter Orangensaft. Was ergibt ${n1}/${d} + ${n2}/${dHalf}?`,
        type: 'input',
        correctAnswer: `${n1 + n2 * 2}/${d}`,
        timeLimit: 45,
      };
    } else {
      const l = getRandomInt(3, 10);
      const w = getRandomInt(2, 8);
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 3,
        storyContext: 'Renovierung des Kinderzimmers.',
        text: `Ein rechteckiger Teppich ist ${l} cm lang und ${w} cm breit. Wie groß ist der Flächeninhalt in cm²?`,
        type: 'input',
        correctAnswer: String(l * w),
        timeLimit: 35,
        diagramData: { shape: 'rectangle', labels: { a: l, b: w } },
      };
    }
  }

  if (level === 4) {
    const type = getRandomInt(1, 4);
    if (type === 1) {
      const perc = getRandomInt(1, 9) * 10;
      const val = getRandomInt(2, 10) * 10;
      return {
        id,
        topic: 'Prozentrechnung',
        subject: 'math',
        level: 4,
        storyContext: 'Sommerschlussverkauf im Sportgeschäft.',
        text: `Ein Fußball kostet regulär ${val} €. Heute gibt es ${perc}% Rabatt. Wie viel Euro spart man?`,
        type: 'input',
        correctAnswer: String((perc * val) / 100),
        timeLimit: 45,
      };
    } else if (type === 2) {
      const a = getRandomInt(2, 5);
      const ans = getRandomInt(2, 10);
      const c = a * ans;
      return {
        id,
        topic: 'Gleichungen',
        subject: 'math',
        level: 4,
        storyContext: 'Das Spardosen-Rätsel.',
        text: `Michael spart wöchentlich einen festen Betrag x. Nach ${a} Wochen sind genau ${c} € in der Spardose (${a}x = ${c}). Löse nach x auf:`,
        type: 'input',
        correctAnswer: String(ans),
        timeLimit: 45,
      };
    } else if (type === 3) {
      const g = getRandomInt(4, 12);
      const h = getRandomInt(2, 8);
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 4,
        storyContext: 'Das Dreiecksegel eines Ausflugsboots.',
        text: `Das Dreiecksegel hat eine Grundseite g von ${g} cm und eine Höhe h von ${h} cm. Wie groß ist der Flächeninhalt in cm²?`,
        type: 'input',
        correctAnswer: String((g * h) / 2),
        timeLimit: 45,
        diagramData: { shape: 'triangle', labels: { g, h } },
      };
    } else {
      const x = getRandomInt(2, 8);
      const y = getRandomInt(2, 8);
      const z = 30 - x - y;
      return {
        id,
        topic: 'Statistik',
        subject: 'math',
        level: 4,
        storyContext: 'Notendurchschnitt in der Mathe-Klausur.',
        text: `Drei Schüler erzielten in einer Aufgabe ${x}, ${y} und ${z} Punkte. Berechne den Durchschnitt (Mittelwert):`,
        type: 'input',
        correctAnswer: '10',
        timeLimit: 45,
      };
    }
  }

  if (level === 5) {
    const type = getRandomInt(1, 5);
    if (type === 1) {
      const a = getRandomInt(2, 12);
      const b = getRandomInt(2, 12);
      return {
        id,
        topic: 'Negative Zahlen',
        subject: 'math',
        level: 5,
        storyContext: 'Wetterbericht im Wintergebirge.',
        text: `Morgens beträgt die Temperatur (-${a})°C. Bis mittags steigt die Temperatur um ${b}°C. Wie viel °C ist es mittags?`,
        type: 'input',
        correctAnswer: String(-a + b),
        timeLimit: 35,
      };
    } else if (type === 2) {
      const a = getRandomInt(2, 9);
      const b = getRandomInt(2, 9);
      return {
        id,
        topic: 'Negative Zahlen',
        subject: 'math',
        level: 5,
        storyContext: 'Kontoauszug und Bankguthaben.',
        text: `Ein Girokonto weist einen Kontostand von (-${a}) € auf. Durch eine Belastung verdoppelt sich das Minus mit dem Faktor (-${b}). Was ist (-${a}) * (-${b})?`,
        type: 'input',
        correctAnswer: String(a * b),
        timeLimit: 35,
      };
    } else if (type === 3) {
      const g = getRandomInt(4, 12);
      const h = getRandomInt(3, 9);
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 5,
        storyContext: 'Vermessung eines Stadtpark-Beetes.',
        text: `Ein Parallelogramm-Blumenbeet hat eine Grundseite g von ${g} cm und eine Höhe h von ${h} cm. Wie groß ist der Flächeninhalt in cm²?`,
        type: 'input',
        correctAnswer: String(g * h),
        timeLimit: 40,
        diagramData: { shape: 'parallelogram', labels: { g, h } },
      };
    } else if (type === 4) {
      const g = getRandomInt(4, 10);
      const h = getRandomInt(3, 8);
      const c = g + 4;
      const area = ((g + c) * h) / 2;
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 5,
        storyContext: 'Dachkonstruktion einer Scheune.',
        text: `Ein Trapez hat eine obere Seite a = ${g} cm, eine untere Seite c = ${c} cm und eine Höhe h = ${h} cm. Wie groß ist der Flächeninhalt in cm²?`,
        type: 'input',
        correctAnswer: String(area),
        timeLimit: 45,
        diagramData: { shape: 'trapezoid', labels: { a: g, c, h } },
      };
    } else {
      const alpha = getRandomInt(30, 80);
      const beta = getRandomInt(30, 80);
      const gamma = 180 - alpha - beta;
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 5,
        storyContext: 'Winkelberechnung bei einer Holzkonstruktion.',
        text: `Zwei Winkel eines dreieckigen Holzrahmens betragen ${alpha}° und ${beta}°. Wie groß ist der dritte Winkel in Grad?`,
        type: 'input',
        correctAnswer: String(gamma),
        timeLimit: 40,
        diagramData: { shape: 'triangle', labels: { a: alpha, b: beta } },
      };
    }
  }

  if (level === 6) {
    const type = getRandomInt(1, 4);
    if (type === 1) {
      const a = getRandomInt(3, 15);
      return {
        id,
        topic: 'Potenzen',
        subject: 'math',
        level: 6,
        storyContext: 'Pflasterung eines quadratischen Schulhofs.',
        text: `Ein quadratischer Vorplatz hat eine Seitenlänge von ${a} m. Berechne die Fläche (${a}²):`,
        type: 'input',
        correctAnswer: String(a * a),
        timeLimit: 30,
      };
    } else if (type === 2) {
      const a = getRandomInt(3, 15);
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 6,
        storyContext: 'Pakettransport bei der Post.',
        text: `Ein würfelförmiges Paket hat eine Kantenlänge a = ${a} cm. Wie groß ist das Volumen V des Pakets in cm³?`,
        type: 'input',
        correctAnswer: String(a * a * a),
        timeLimit: 35,
        diagramData: { shape: 'cube', labels: { a } },
      };
    } else if (type === 3) {
      const a = getRandomInt(2, 9);
      const b = getRandomInt(2, 9);
      return {
        id,
        topic: 'Terme',
        subject: 'math',
        level: 6,
        storyContext: 'Bauernhof-Ernte.',
        text: `Ein Landwirt erntet ${a} Säcke Weizen (x) und noch einmal ${b} Säcke Weizen (x). Fasse zusammen: ${a}x + ${b}x`,
        type: 'input',
        correctAnswer: `${a + b}x`,
        timeLimit: 35,
      };
    } else {
      const a = getRandomInt(2, 9);
      const b = getRandomInt(2, 9);
      return {
        id,
        topic: 'Terme',
        subject: 'math',
        level: 6,
        storyContext: 'Verpackung von Geschenksets.',
        text: `Ausmultiplizieren von Produktpaketen: ${a}(x + ${b})`,
        type: 'input',
        correctAnswer: `${a}x + ${a * b}`,
        timeLimit: 40,
      };
    }
  }

  if (level === 7) {
    const type = getRandomInt(1, 4);
    if (type === 1) {
      const a = getRandomInt(1, 9);
      const correct = `x² + ${2 * a}x + ${a * a}`;
      const options = shuffleArray([
        correct,
        `x² + ${a * a}`,
        `x² + ${a}x + ${a * a}`,
        `2x + ${2 * a}`
      ]);
      return {
        id,
        topic: 'Binomische Formeln',
        subject: 'math',
        level: 7,
        storyContext: 'Flächenberechnung bei variablen Grundstücksgrenzen.',
        text: `Wende die 1. Binomische Formel an: (x + ${a})²`,
        type: 'multiple-choice',
        options,
        correctAnswer: correct,
        timeLimit: 45,
      };
    } else if (type === 2) {
      const pythTriples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
      const triple = pythTriples[getRandomInt(0, pythTriples.length - 1)];
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 7,
        storyContext: 'Einsatz der Feuerwehr an einem Gebäude.',
        text: `Eine Feuerwehrleiter (Hypotenuse c) lehnt an der Hauswand. Die Katheten betragen a = ${triple[0]} cm und b = ${triple[1]} cm. Wie lang ist die Hypotenuse c in cm?`,
        type: 'input',
        correctAnswer: String(triple[2]),
        timeLimit: 45,
        diagramData: { shape: 'right-triangle', labels: { a: triple[0], b: triple[1], c: triple[2] } },
      };
    } else if (type === 3) {
      const r = getRandomInt(2, 10);
      const U = 2 * 3 * r;
      return {
        id,
        topic: 'Geometrie',
        subject: 'math',
        level: 7,
        storyContext: 'Bau eines kreisförmigen Garten-Swimmingpools.',
        text: `Ein kreisförmiger Pool hat den Radius r = ${r} cm. Wie groß ist der Umfang in cm? (Rechne mit π = 3)`,
        type: 'input',
        correctAnswer: String(U),
        timeLimit: 40,
        diagramData: { shape: 'circle', labels: { r } },
      };
    } else {
      const x = getRandomInt(2, 9);
      const c = getRandomInt(1, 4);
      const diff = getRandomInt(1, 4);
      const a = c + diff;
      const b = getRandomInt(1, 10);
      const d = diff * x - b;
      const signD = d > 0 ? ` + ${d}` : d < 0 ? ` - ${Math.abs(d)}` : '';
      return {
        id,
        topic: 'Gleichungen',
        subject: 'math',
        level: 7,
        storyContext: 'Vergleich zweier Stromtarife.',
        text: `Beim Vergleich zweier Stromtarife ergibt sich für die monatlichen Kosten bei x kWh die Gleichung ${a}x - ${b} = ${c}x${signD}. Löse nach x auf:`,
        type: 'input',
        correctAnswer: String(x),
        timeLimit: 50,
      };
    }
  }

  return null;
}
