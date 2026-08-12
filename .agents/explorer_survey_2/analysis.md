# Analysis: View Integration Explorer (`explorer_survey_2`)

## Executive Summary
This analysis details the exact UI placement points, data availability, and state/prop wiring required to integrate the **"KI-Tutor Gem Hilfe"** button into three primary views of **NachhilfeTest**:
1. **`PracticeSessionView.tsx`**: Interactive practice session & answer feedback.
2. **`Dashboard.tsx`**: Main student dashboard, weak topic accordions, bookmarked questions, and session review modal.
3. **`DiagnosticReportPrint.tsx`**: Printable diagnostic report & consultation summary.

Every view has distinct context requirements (question metadata, student performance, student profile data) that must be passed cleanly into `AiPromptModal.tsx`.

---

## 1. Component Data Audit & Context Inspection

### 1.1 `PracticeSessionView.tsx`
* **File Location**: `src/components/PracticeSessionView.tsx`
* **Available Data Sources**:
  * `currentExercise` (`GeneratedExerciseItem`):
    * `id`: Unique exercise ID
    * `subject`: `'math'` | `'english'`
    * `topicId` & `topicName`: E.g. `'Addition'`, `'Vokabeln'`, etc.
    * `level`: Target level (1–7)
    * `questionText`: Problem statement
    * `options`: Optional array of multiple choice strings
    * `correctAnswer`: Correct answer text
    * `explanation`: Detailed solution explanation
    * `mascotTip`: Optional owl mascot hint text
    * `storyContext`: Optional story text
  * **Student Answer & Evaluation State**:
    * `selectedOption` or `customInput`: Student's input (`answerToValidate`)
    * `isAnswerSubmitted`: Boolean state
    * `isCorrect`: Instant evaluation result (`true`/`false`)
    * `userAnswers`: Record of all exercise attempts in active session (`Record<string, { answer: string; isCorrect: boolean }>`)
  * **Student Profile & Global Context**:
    * Accessible via `useTestSession()` hook -> `state.currentStudent` (`StudentProfile`).
    * Computed session metrics via `summaryResults` (`totalQuestions`, `correctAnswers`, `percentage`, `topicBreakdown`).

### 1.2 `Dashboard.tsx`
* **File Location**: `src/pages/Dashboard.tsx`
* **Available Data Sources**:
  * **Student Profile**: `state.currentStudent` from `useTestSession()` (name, gradeLevel, favoriteSubject, problemSubject, hobbies, learningPreferences, customNotes).
  * **Performance Metrics & Topic Breakdowns**:
    * `state.answers`: Array of `AnswerRecord` items (`questionId`, `topic`, `subject`, `isCorrect`, `timeTaken`, `questionText`, `userAnswer`, `correctAnswer`).
    * `mathTopics`: Sorted array of Math `TopicItem`s (`topic`, `correct`, `total`, `accuracy`, `avgTime`, `records`).
    * `englishTopics`: Sorted array of English `TopicItem`s.
    * `state.markedQuestionIds`: Array of bookmarked question IDs.
  * **Session History & Drilldown Review**:
    * `historyList`: Archived `TestSessionRecord`s from `localStorage`.
    * `reviewingSession`: Active `TestSessionRecord` when opening the drilldown modal (`Review`).

### 1.3 `DiagnosticReportPrint.tsx`
* **File Location**: `src/components/DiagnosticReportPrint.tsx`
* **Available Data Sources**:
  * **Student Meta**: `studentName`, `gradeLevel`, `favoriteSubject`, `problemSubject`, `markedQuestionIds`.
  * **Empirical Diagnostics**:
    * `mathStats` (`correct`, `total`, `avgTime`, `answers`), `mathLevel`.
    * `englishStats` (`correct`, `total`, `avgTime`, `answers`), `englishLevel`.
    * `cogStats` (`correct`, `total`, `avgReactionMs`).
    * `strengths`: Topic items with accuracy >= 70%.
    * `weaknesses`: Topic items with accuracy < 70%.
    * `tutorNotes`: Freely editable recommendation textarea for parent consultation.

---

## 2. Exact UI Placement Points for "KI-Tutor Gem Hilfe" Buttons

### 2.1 Placement Points in `PracticeSessionView.tsx`

| Placement Location | UI Anchor Point | Context Triggered | Visual Styling Recommendation |
|---|---|---|---|
| **Primary Placement: Instant Answer Feedback Box** | Inside feedback banner (`isAnswerSubmitted`, lines 777–831), directly below `💡 Explanation` (line 817) and alongside `Nächste Aufgabe` button. | Triggers prompt modal loaded with `currentExercise` + student's wrong/correct answer. | Secondary AI styled button with `<Sparkles size={16} />` icon and text `"KI-Tutor Gem Hilfe"`. |
| **Secondary Placement: Mascot Tip Area** | Inside mascot tip expandable panel (lines 751–774). | Triggers Socratic help for current exercise before submitting. | Subtle pill button: `"🦉 KI-Tutor nach Erklärungs-Tipp fragen"`. |
| **Tertiary Placement: Summary Screen** | In the summary screen (`isCompleted`, lines 356–411) beside topic breakdown items with accuracy < 70%. | Triggers 3 new practice problems mode for the weak topic. | Button: `"KI-Aufgaben zu [Thema] generieren"`. |

### 2.2 Placement Points in `Dashboard.tsx`

| Placement Location | UI Anchor Point | Context Triggered | Visual Styling Recommendation |
|---|---|---|---|
| **Placement Point A: Weak Topics Accordion** | In `TopicAccordionList` (lines 47–216), in header/body when `t.accuracy < 0.7`. | Passes weak topic name, subject, and student accuracy. Opens mode 3 (3 neue Übungsaufgaben) or mode 2 (Personalisierte Erklärung). | Small gradient badge/button: `<Sparkles size={14} /> KI-Tutor Hilfe`. |
| **Placement Point B: Bookmarked & Wrong Questions Cards** | Inside individual `AnswerRecord` items (lines 130–206 and lines 873–920 in Review Modal). | Passes exact `questionText`, `userAnswer`, `correctAnswer`, and topic. | Icon button or link: `<Sparkles size={14} /> KI-Erklärung`. |
| **Placement Point C: Profile & Gamification Header** | Next to `"Avatar Anpassen"` and `"Diagnosebericht als PDF"` buttons (lines 460–477). | Passes overall student profile (hobbies, strengths, weaknesses) without a specific question. | Primary/Gradient action button: `<Sparkles size={18} /> KI-Tutor Gem Launch`. |

### 2.3 Placement Points in `DiagnosticReportPrint.tsx`

| Placement Location | UI Anchor Point | Context Triggered | Visual Styling Recommendation |
|---|---|---|---|
| **Screen Action Bar** | Top dark bar (`className="no-print"`, lines 170–211), next to `"Drucken / Als PDF speichern"`. | Passes complete diagnostic summary (strengths, weaknesses, tutor notes, math/eng levels). | Blue gradient button: `<Sparkles size={18} /> KI-Tutor Gem Prompt erstellen`. |
| **Weaknesses Section (Screen View)** | Next to `"Entwicklungsfelder & Wissenslücken"` header (lines 397–413), with `className="no-print"`. | Passes list of identified weak topics. | Compact action link: `className="no-print"` -> `"KI-Förder-Prompt"`. |
| **Tutor Notes Area** | Beside recommendation textarea (lines 416–454), with `className="no-print"`. | Auto-generates structured prompt for parent counseling based on freetext notes. | Secondary button: `"Freitext in KI-Prompt umwandeln"`. |

---

## 3. Data & State Wiring to `AiPromptModal.tsx`

### 3.1 Proposed Data Contract (`AiPromptContext` & `AiPromptModalProps`)

```typescript
export interface AiPromptContext {
  questionContext?: {
    subject?: 'math' | 'english' | 'cognition' | string;
    topic?: string;
    level?: number;
    questionText?: string;
    userAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
    options?: string[];
  };
  studentProfile?: StudentProfile | null;
  performanceData?: {
    mathLevel?: number;
    englishLevel?: number;
    accuracyPercentage?: number;
    strengths?: string[];
    weaknesses?: string[];
    tutorNotes?: string;
    [key: string]: unknown;
  };
}

export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: AiPromptContext;
  initialMode?: 'socratic' | 'analogy' | 'exercises';
}
```

### 3.2 View-Specific Wiring Examples

#### PracticeSessionView Wiring:
```typescript
const [isAiModalOpen, setIsAiModalOpen] = useState(false);

const handleOpenAiHelp = () => {
  setIsAiModalOpen(true);
};

// Pass context to modal:
<AiPromptModal
  isOpen={isAiModalOpen}
  onClose={() => setIsAiModalOpen(false)}
  initialMode={isCorrect ? 'exercises' : 'socratic'}
  context={{
    questionContext: {
      subject: currentExercise.subject,
      topic: currentExercise.topicName,
      level: currentExercise.level,
      questionText: currentExercise.questionText,
      userAnswer: selectedOption || customInput,
      correctAnswer: currentExercise.correctAnswer,
      explanation: currentExercise.explanation,
      options: currentExercise.options,
    },
    studentProfile: state.currentStudent,
    performanceData: {
      accuracyPercentage: summaryResults.percentage,
    },
  }}
/>
```

#### Dashboard Weak Topic Wiring:
```typescript
const [aiModalState, setAiModalState] = useState<{ isOpen: boolean; context?: AiPromptContext }>({ isOpen: false });

const handleOpenAiForTopic = (topicItem: TopicItem, subject: 'math' | 'english') => {
  const wrongRec = topicItem.records.find((r) => !r.isCorrect) || topicItem.records[0];
  setAiModalState({
    isOpen: true,
    context: {
      questionContext: {
        subject,
        topic: topicItem.topic,
        level: state[`${subject}Level`] || 1,
        questionText: wrongRec?.questionText || `Themenbereich: ${topicItem.topic}`,
        userAnswer: wrongRec?.userAnswer || '',
        correctAnswer: typeof wrongRec?.correctAnswer === 'string' ? wrongRec?.correctAnswer : wrongRec?.correctAnswer?.join(', ') || '',
      },
      studentProfile: state.currentStudent,
      performanceData: {
        weakTopics: [topicItem.topic],
        accuracyPercentage: Math.round(topicItem.accuracy * 100),
      },
    },
  });
};
```

#### DiagnosticReportPrint Wiring:
```typescript
const [isAiModalOpen, setIsAiModalOpen] = useState(false);

<AiPromptModal
  isOpen={isAiModalOpen}
  onClose={() => setIsAiModalOpen(false)}
  initialMode="analogy"
  context={{
    questionContext: {
      subject: 'math',
      topic: weaknesses[0]?.topic || 'Allgemeine Diagnose',
      level: mathLevel,
      questionText: `Diagnoseschwachstellen: ${weaknesses.map(w => w.topic).join(', ')}`,
    },
    studentProfile: state.currentStudent || {
      id: 'guest',
      name: studentName,
      gradeLevel,
      favoriteSubject,
      problemSubject,
      hobbies: [],
      learningPreferences: [],
      customNotes: tutorNotes,
      createdAt: '',
      updatedAt: '',
    },
    performanceData: {
      mathLevel,
      englishLevel,
      strengths: strengths.map((s) => s.topic),
      weaknesses: weaknesses.map((w) => w.topic),
      tutorNotes,
    },
  }}
/>
```

---

## 4. Summary & Implementation Recommendations
1. All three views already have rich data structures (`GeneratedExerciseItem`, `AnswerRecord`, `StudentProfile`, `TopicItem`, `TestSessionRecord`) which map 1-to-1 onto `AiPromptContext`.
2. All UI additions in `DiagnosticReportPrint.tsx` must use `className="no-print"` to ensure print output remains clean and standard A4 format.
3. Adding the "KI-Tutor Gem Hilfe" buttons provides seamless UX flow directly into the picture-in-picture sidecar Gemini Gem launcher (`https://gemini.google.com/gem/1m2yWdldrntHGejlraHYZGiLS80ixxq45?usp=sharing`).
