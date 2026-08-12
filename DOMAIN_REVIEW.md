# Domain Review: Content, Logic & UX Analysis

## Content Gaps
**1. Sinnlose oder triviale Fragen / Fangfragen**
**Problem:** In der Mathematik-Generierung (Level 6, Geometry) existiert eine triviale Frage, bei der die Lösung bereits offensichtlich in der Fragestellung enthalten ist:
- **Datei:** `src/data/questions.ts` (Zeilen 807-813)
- **Code:**
  ```typescript
  storyContext: 'Pakettransport bei der Post.',
  text: `Ein würfelförmiges Paket hat eine Kantenlänge a = ${a} cm. Wie lang ist eine Kante a?`,
  correctAnswer: String(a)
  ```
- **Auswirkung:** Die Frage hat keinen pädagogischen Wert und verwirrt den Nutzer.
- **Änderungsvorschlag:** Die Frage sollte stattdessen das Volumen (oder die Oberfläche) abfragen: `Wie groß ist das Volumen des Pakets in cm³?` -> `correctAnswer: String(a * a * a)`

**2. Formatierungs-Ungleichgewichte in den Antwortoptionen**
**Problem:** Bei vielen englischen Multiple-Choice-Fragen (besonders ab Level 5) ist die richtige Antwort optisch sofort erkennbar. Die korrekte Option enthält oft mehrere Bedeutungen getrennt durch einen Schrägstrich, während die falschen Antworten (Distraktoren) nur aus einzelnen Wörtern bestehen.
- **Betroffene Fragen:** `e5_30`, `e6_33`, `e6_45`, `e7_20`, `e7_33`, `e7_34`, `e7_41`, `e7_42`
- **Änderungsvorschlag:** Optionen ausbalancieren. Entweder richtige Antworten kürzen oder Distraktoren verlängern.

## Domain Logic Flaws
**Problem A: Strikte String-Prüfung bei Dezimalzahlen (Level 3 Mathe)**
- **Code:** `correctAnswer: String((a + b).toFixed(1)).replace('.', ',')`
- **Beschreibung:** Wenn das Ergebnis `1.0` ist, erwartet das System `"1,0"`. Gibt ein Schüler `"1"` ein, wird es falsch gewertet.
- **Änderungsvorschlag:** Bei numerischen Inputs mathematische Äquivalenz prüfen, anstatt strikter String-Vergleiche.

**Problem B: Case-Sensitivity und Satzzeichen bei Text-Inputs**
- **Beschreibung:** Fragen vom Typ `drag-sort` und Eingabefelder erwarten oft exakte Strings. Fehlende Punkte oder Leerzeichen am Ende führen zu Fehlern.
- **Änderungsvorschlag:** `.trim()` und `.toLowerCase()` nutzen, sowie Satzzeichen normieren.

## UX/Usability Friction
- **Timer Anxiety:** The current strict countdown mechanics induce stress without offering pedagogical relief. A lack of pausing or pacing control (before M1 fixes) creates friction for neurodivergent students or those with test anxiety.
- **Binary Feedback:** The app currently offers binary (right/wrong) evaluation, which is pedagogically limiting. Users need intermediate feedback loops.

---

## Actionable Feature Proposals (Pedagogical & Adaptive Brainstorming)

### 1. Dynamic Spaced Repetition (SRS) Mastery Graph
- **Concept:** Moves away from linear tests. It visualizes concepts as interconnected nodes (e.g., Fractions -> Ratios -> Percentages). When a student answers incorrectly, the system decays the mastery score and dynamically schedules a review of the prerequisite node.
- **Target Audience & Value:** Visual learners and students struggling with foundational gaps. Enhances long-term retention via the Ebbinghaus forgetting curve.
- **Architecture:** Use a background Web Worker running a SuperMemo-2 (SM-2) or FSRS algorithm. Integrate a React Force-Directed Graph component (D3 or React Flow) for the student dashboard.

### 2. Socratic AI Micro-Interventions
- **Concept:** An AI chat companion that doesn't give the answer but asks guiding questions based on the specific error made. For example, if a student forgets to divide by 2 for a triangle's area, the AI asks: "I see you multiplied base by height. What's the final step for a triangle?"
- **Target Audience & Value:** All students. Fosters active recall and critical thinking instead of passive correction.
- **Architecture:** LLM (GPT-4o-mini) integration via a serverless function. A floating chat bubble component in `QuestionRenderer` that is injected with the context, correct answer, and student's incorrect input.

### 3. Predictive Cognitive Overload Sensor
- **Concept:** Monitors interaction metrics (time-to-first-keypress, backspace frequency, idle time) to detect frustration. If overload is detected, it temporarily pivots to an easier "confidence-builder" question or triggers a 30-second breathing pause.
- **Target Audience & Value:** Anxious test-takers. Reduces test anxiety, drop-off rates, and cognitive fatigue.
- **Architecture:** Custom React hook (`useCognitiveLoad`) tracking DOM events. Exponential moving average calculation thresholds. `TestSessionContext` intercepts question fetches to pull from a lower difficulty tier dynamically.

### 4. Asynchronous Peer-Calibrated Tournaments
- **Concept:** A shadow-multiplayer mode where students optionally compete against the historical performance "ghosts" of peers of similar ability.
- **Target Audience & Value:** Motivated/competitive students. Introduces healthy gamification without the intense pressure of live multiplayer.
- **Architecture:** Store anonymized completion timestamps per question in the DB. A real-time progress bar UI animates based on historical timestamp diffs using Zustand/Context for synchronization.

### 5. Multimodal Voice & Sketch Diagnostics
- **Concept:** Allows students to solve math problems by drawing on a digital canvas or explaining their reasoning aloud, rather than just clicking multiple choice options.
- **Target Audience & Value:** Kinesthetic and auditory learners. Captures *how* a student thinks, not just the final output.
- **Architecture:** Integrate React Canvas API (Excalidraw) or Web Speech API. Send captured data to a multimodal LLM to evaluate intermediate reasoning steps.

### 6. Metacognitive Confidence Sliders
- **Concept:** Before confirming an answer, students rate their confidence on a slider (1-5). The post-test report categorizes knowledge into 4 quadrants: Mastered (Right, High Conf), Guessing (Right, Low Conf), Blind Spot (Wrong, High Conf), Needs Review (Wrong, Low Conf).
- **Target Audience & Value:** Tutors and older students. Develops metacognition (self-awareness of knowledge gaps), a top predictor of academic success.
- **Architecture:** Add `confidence: number` to the `UserResponse` interface. The `Dashboard` uses a charting library (like Recharts) to plot the 4-quadrant scatter plot for deep diagnostic reporting.
