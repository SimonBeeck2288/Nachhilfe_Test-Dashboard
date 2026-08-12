import React, { useState } from 'react';
import { useTestSession, type AnswerRecord } from '../context/TestSessionContext';
import type { TestSessionRecord } from '../types/history';
import {
  Printer,
  X,
  FileText,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bookmark,
} from 'lucide-react';
import { AiPromptModal } from './AiPromptModal';
import type { AiPromptContext, PromptMode } from '../utils/aiPromptGenerator';

interface DiagnosticReportPrintProps {
  onClose?: () => void;
  sessionRecord?: TestSessionRecord;
}

const DiagnosticReportPrint: React.FC<DiagnosticReportPrintProps> = ({ onClose, sessionRecord }) => {
  const { state } = useTestSession();

  // Determine active answers and profile data
  const answers: AnswerRecord[] = sessionRecord ? sessionRecord.answers || [] : state.answers || [];
  const mathLevel = sessionRecord ? sessionRecord.mathLevelReached : state.mathLevel;
  const englishLevel = sessionRecord ? sessionRecord.englishLevelReached : state.englishLevel;
  const studentName = sessionRecord
    ? sessionRecord.studentName
    : state.studentName || state.currentStudent?.name || 'Schüler/in';
  const favoriteSubject = sessionRecord
    ? sessionRecord.favoriteSubject
    : state.favoriteSubject || state.currentStudent?.favoriteSubject || 'k. A.';
  const problemSubject = sessionRecord
    ? sessionRecord.problemSubject
    : state.problemSubject || state.currentStudent?.problemSubject || 'k. A.';
  const markedQuestionIds = sessionRecord
    ? sessionRecord.markedQuestionIds || []
    : state.markedQuestionIds || [];
  const gradeLevel = state.currentStudent?.gradeLevel || (typeof mathLevel === 'number' ? Math.max(1, Math.min(13, mathLevel + 4)) : 5);

  const formattedDate = sessionRecord
    ? new Date(sessionRecord.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  // Helper functions for subject stats
  const getSubjectStats = (subject: 'math' | 'english' | 'cognition') => {
    const subjectAnswers = answers.filter((a) => a.subject === subject);
    if (subjectAnswers.length === 0) return null;
    const correct = subjectAnswers.filter((a) => a.isCorrect).length;
    const total = subjectAnswers.length;
    const avgTime = subjectAnswers.reduce((acc, curr) => acc + curr.timeTaken, 0) / total;
    return { correct, total, avgTime, answers: subjectAnswers };
  };

  const getTopicBreakdown = (subjectAnswers: AnswerRecord[]) => {
    const topics: Record<string, { correct: number; total: number; time: number }> = {};
    subjectAnswers.forEach((a) => {
      if (!a.topic) return;
      if (!topics[a.topic]) topics[a.topic] = { correct: 0, total: 0, time: 0 };
      topics[a.topic].total += 1;
      if (a.isCorrect) topics[a.topic].correct += 1;
      topics[a.topic].time += a.timeTaken;
    });
    return Object.entries(topics)
      .map(([topic, d]) => ({
        topic,
        correct: d.correct,
        total: d.total,
        accuracy: d.correct / d.total,
        avgTime: d.time / d.total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  };

  const mathStats = getSubjectStats('math');
  const englishStats = getSubjectStats('english');
  const cogStats = getSubjectStats('cognition');

  const mathTopics = mathStats ? getTopicBreakdown(mathStats.answers) : [];
  const englishTopics = englishStats ? getTopicBreakdown(englishStats.answers) : [];

  const allTopics = [
    ...mathTopics.map((t) => ({ ...t, subjectName: 'Mathe' })),
    ...englishTopics.map((t) => ({ ...t, subjectName: 'Englisch' })),
  ];

  const strengths = allTopics.filter((t) => t.accuracy >= 0.7);
  const weaknesses = allTopics.filter((t) => t.accuracy < 0.7);

  // Smart default recommendation notes
  let defaultRecommendation = '';
  if (cogStats) {
    const avgReactionMs = cogStats.answers.reduce((acc, curr) => acc + (curr.reactionTime || 0), 0) / (cogStats.total || 1);
    const cogAcc = cogStats.correct / (cogStats.total || 1);
    if (cogAcc >= 0.8 && avgReactionMs < 1200) {
      defaultRecommendation = 'Sehr gute kognitive Auffassungsgabe. Fachliche Themen gezielt vertiefen und anspruchsvolle Übungsformate anbieten.';
    } else if (cogAcc < 0.7 || avgReactionMs > 1800) {
      defaultRecommendation = 'Konzentration & Arbeitsgedächtnis zeigen leichte Ermüdung. Kurze Lernblöcke (15–20 Min) mit strukturierten Pausen empfehlen.';
    } else {
      defaultRecommendation = 'Solides Gesamtergebnis. Gezielte Wiederholung der identifizierten Entwicklungsbereiche in Mathe und Englisch empfohlen.';
    }
  } else {
    defaultRecommendation = 'Gezielte Nachhilfe in den identifizierten Problemfeldern durchführen. Regelmäßige Lernzielkontrollen empfohlen.';
  }

  const [tutorNotes, setTutorNotes] = useState<string>(defaultRecommendation);

  // AI Prompt Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalContext, setAiModalContext] = useState<AiPromptContext>({ studentProfile: {} });
  const [aiModalMode, setAiModalMode] = useState<PromptMode>('practice_tasks');

  const handleOpenAiModal = (topicName?: string, mode: PromptMode = 'practice_tasks') => {
    const activeStudent = state.currentStudent || {
      name: studentName,
      gradeLevel: typeof mathLevel === 'number' ? Math.max(1, Math.min(13, mathLevel + 4)) : 5,
      favoriteSubject,
      problemSubject,
      customNotes: tutorNotes,
    };

    const topicAccuracyMap: Record<string, number> = {};
    allTopics.forEach((t) => {
      topicAccuracyMap[t.topic] = Math.round(t.accuracy * 100);
    });

    setAiModalContext({
      studentProfile: {
        ...activeStudent,
        name: studentName || activeStudent.name,
        favoriteSubject: favoriteSubject || activeStudent.favoriteSubject,
        problemSubject: problemSubject || activeStudent.problemSubject,
        customNotes: tutorNotes || activeStudent.customNotes,
      },
      performanceData: {
        strengths: strengths.map((s) => `${s.subjectName}: ${s.topic}`),
        weaknesses: weaknesses.map((w) => `${w.subjectName}: ${w.topic}`),
        gradeLevel: activeStudent.gradeLevel || 5,
        topicAccuracy: topicAccuracyMap,
      },
      questionContext: topicName
        ? {
            topic: topicName,
            subject: 'math',
            level: mathLevel,
          }
        : undefined,
    });
    setAiModalMode(mode);
    setIsAiModalOpen(true);
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  return (
    <div className="diagnostic-report-overlay" style={{ marginTop: '1rem' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 10pt !important;
          }
          header, nav, footer, .no-print, button {
            display: none !important;
          }
          .diagnostic-report-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999 !important;
          }
          .diagnostic-report-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
          .tutor-notes-input {
            border: none !important;
            resize: none !important;
            background: transparent !important;
            padding: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            font-family: inherit !important;
            font-size: 9.5pt !important;
          }
        }
      `}</style>

      {/* Action Bar (Screen only) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '850px',
          margin: '0 auto 1rem auto',
          backgroundColor: '#1E293B',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <FileText size={20} color="#38BDF8" />
          <span>Druckvorschau: 1-Seiten A4 Diagnosebericht</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenAiModal(undefined, 'practice_tasks')}
            data-testid="ki-tutor-report-bar-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              backgroundColor: '#2563EB',
              fontWeight: 600,
            }}
          >
            <Sparkles size={18} />
            <span>KI-Tutor Gem Hilfe</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrintTrigger}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}
          >
            <Printer size={18} />
            Drucken / Als PDF speichern
          </button>
          {onClose && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem' }}
            >
              <X size={18} />
              Schließen
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Container */}
      <div
        className="diagnostic-report-card"
        style={{
          maxWidth: '850px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          fontSize: '0.92rem',
          lineHeight: '1.4',
          color: '#1E293B',
        }}
      >
        {/* Header Title */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '3px solid #4F46E5',
            paddingBottom: '0.75rem',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4F46E5', margin: 0, letterSpacing: '-0.5px' }}>
              DIAGNOSEBERICHT & FÖRDEREMPFEHLUNG
            </h1>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Nachhilfe-Diagnose-System • Eltern- & Tutorberatung
            </span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
            <div><strong>Datum:</strong> {formattedDate}</div>
            <div><strong>Status:</strong> Abgeschlossen</div>
          </div>
        </div>

        {/* Student Profile Overview Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem',
            backgroundColor: '#F8FAFC',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Schüler/in
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{studentName}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Klassenstufe
            </span>
            <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{gradeLevel}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Lieblingsfach
            </span>
            <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600 }}>
              {favoriteSubject}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Problemfach
            </span>
            <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600 }}>
              {problemSubject}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Gemerkt
            </span>
            <span style={{ fontSize: '0.88rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Bookmark size={13} fill={markedQuestionIds.length > 0 ? "#F59E0B" : "none"} color="#B45309" />
              {markedQuestionIds.length} {markedQuestionIds.length === 1 ? 'Frage' : 'Fragen'}
            </span>
          </div>
        </div>

        {/* Subject Performance Summary Cards (3 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
          {/* Math Card */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#FAF5FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7E22CE', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
              <BookOpen size={16} /> Mathematik
            </div>
            {mathStats ? (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6B21A8' }}>
                  Level {mathLevel} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7E22CE' }}>/ 7</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#581C87', marginTop: '0.2rem' }}>
                  Richtige: <strong>{mathStats.correct} / {mathStats.total}</strong> ({Math.round((mathStats.correct / mathStats.total) * 100)}%)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#581C87' }}>
                  Ø Antwortzeit: <strong>{mathStats.avgTime.toFixed(1)}s</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#9333EA', fontStyle: 'italic' }}>Keine Testdaten</div>
            )}
          </div>

          {/* English Card */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#F0FDF4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803D', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
              <Award size={16} /> Englisch
            </div>
            {englishStats ? (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>
                  Level {englishLevel} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#15803D' }}>/ 7</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#14532D', marginTop: '0.2rem' }}>
                  Richtige: <strong>{englishStats.correct} / {englishStats.total}</strong> ({Math.round((englishStats.correct / englishStats.total) * 100)}%)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#14532D' }}>
                  Ø Antwortzeit: <strong>{englishStats.avgTime.toFixed(1)}s</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#16A34A', fontStyle: 'italic' }}>Keine Testdaten</div>
            )}
          </div>

          {/* Cognition Card */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#EFF6FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1D4ED8', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
              <Brain size={16} /> Kognition (Stroop)
            </div>
            {cogStats ? (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>
                  {Math.round((cogStats.correct / cogStats.total) * 100)}% <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1D4ED8' }}>Genauigkeit</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1E3A8A', marginTop: '0.2rem' }}>
                  Ø Reaktionszeit: <strong>{(cogStats.answers.reduce((acc, curr) => acc + (curr.reactionTime || 0), 0) / cogStats.total).toFixed(0)} ms</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1E3A8A' }}>
                  Treffer: <strong>{cogStats.correct} / {cogStats.total}</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#2563EB', fontStyle: 'italic' }}>Keine Testdaten</div>
            )}
          </div>
        </div>

        {/* Strengths & Weaknesses Detailed Breakdown (2 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
          {/* Strengths */}
          <div style={{ border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#F6FEF9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.35rem' }}>
              <CheckCircle2 size={16} color="#16A34A" /> Stärken & Beherrschte Themen
            </div>
            {strengths.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#14532D' }}>
                {strengths.map((t, idx) => (
                  <li key={idx} style={{ marginBottom: '0.15rem' }}>
                    <strong>[{t.subjectName}] {t.topic}:</strong> {Math.round(t.accuracy * 100)}% ({t.correct}/{t.total})
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>Keine spezifischen Stärken abgehoben</div>
            )}
          </div>

          {/* Weaknesses */}
          <div style={{ border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#FEF2F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B', fontWeight: 700, fontSize: '0.84rem' }}>
                <AlertCircle size={16} color="#DC2626" /> Entwicklungsfelder & Wissenslücken
              </div>
              <button
                type="button"
                className="no-print"
                onClick={() => handleOpenAiModal(undefined, 'practice_tasks')}
                data-testid="ki-tutor-weakness-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={12} />
                <span>KI-Übungsaufgaben</span>
              </button>
            </div>
            {weaknesses.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#7F1D1D' }}>
                {weaknesses.map((t, idx) => (
                  <li key={idx} style={{ marginBottom: '0.15rem' }}>
                    <strong>[{t.subjectName}] {t.topic}:</strong> {Math.round(t.accuracy * 100)}% ({t.correct}/{t.total})
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>Keine auffälligen Wissenslücken identifiziert!</div>
            )}
          </div>
        </div>

        {/* Interactive Tutor Recommendation & Consultation Notes Field */}
        <div
          style={{
            border: '2px dashed #6366F1',
            borderRadius: '8px',
            padding: '0.75rem',
            backgroundColor: '#F5F3FF',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4338CA', fontWeight: 700, fontSize: '0.85rem' }}>
              <Sparkles size={16} /> Empfehlungen & Notizen für das Elterngespräch (Tutor-Empfehlung)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="no-print"
                onClick={() => handleOpenAiModal(undefined, 'personalized')}
                data-testid="ki-tutor-consultation-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={12} />
                <span>KI-Erklärung</span>
              </button>
              <span className="no-print" style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 500 }}>
                (Anpassbarer Freitext für den Ausdruck)
              </span>
            </div>
          </div>

          <textarea
            className="tutor-notes-input"
            value={tutorNotes}
            onChange={(e) => setTutorNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.45rem',
              borderRadius: '6px',
              border: '1px solid #C7D2FE',
              fontSize: '0.82rem',
              lineHeight: '1.4',
              color: '#1E1B4B',
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: 'white',
              resize: 'vertical',
            }}
            placeholder="Empfehlungen und individuelle Fördermaßnahmen hier eingeben..."
          />
        </div>

        {/* Footer & Signature Line for Consultation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #E2E8F0',
            paddingTop: '0.75rem',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <div>
            <div><strong>Tutor / Lehrkraft:</strong> ___________________________</div>
            <div style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}>Nachhilfe-Diagnose-System v2.0</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><strong>Unterschrift Eltern / Erziehungsberechtigte:</strong></div>
            <div style={{ marginTop: '1.25rem', borderBottom: '1px solid #94A3B8', width: '180px', display: 'inline-block' }}></div>
          </div>
        </div>
      </div>

      {/* AI TUTOR PROMPT MODAL */}
      <AiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        context={aiModalContext}
        initialMode={aiModalMode}
      />
    </div>
  );
};

export default DiagnosticReportPrint;
