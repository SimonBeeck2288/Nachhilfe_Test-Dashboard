import React, { useState, useEffect, useMemo } from 'react';
import type { Question } from '../data/questions';
import { Send, FastForward, BookOpen, Volume2, VolumeX, Sparkles, Compass, Bookmark, ArrowLeft } from 'lucide-react';
import GeometryDiagram from './GeometryDiagram';
import TimeUpBanner from './TimeUpBanner';
import DragSortQuestion from './DragSortQuestion';
import MatchingQuestion from './MatchingQuestion';
import FractionPieQuestion from './FractionPieQuestion';
import { speakText, stopSpeech, isTTSSupported } from '../utils/tts';
import { shuffleArray } from '../utils/shuffle';
import { useTestSession } from '../context/TestSessionContext';

interface QuestionRendererProps {
  question: Question;
  onAnswerSubmit: (answer: string) => void;
  isTimeUp?: boolean;
  isExceeded?: boolean;
  onStepBack?: () => void;
  canStepBack?: boolean;
  initialAnswer?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onAnswerSubmit,
  isTimeUp,
  isExceeded,
  onStepBack,
  canStepBack,
  initialAnswer,
}) => {
  const { state, toggleBookmarkQuestion } = useTestSession();
  const [inputValue, setInputValue] = useState(initialAnswer || '');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isBookmarked = state.markedQuestionIds?.includes(question.id);
  const targetTimeExceeded = isExceeded || isTimeUp;

  // Memoize option scrambling so option placement is randomized per question, but remains stable across re-renders
  const shuffledOptions = useMemo(() => {
    if (question.type === 'multiple-choice' && question.options) {
      return shuffleArray(question.options);
    }
    return [];
  }, [question.type, question.options]);

  // Reset input and stop audio when question changes or on unmount
  useEffect(() => {
    setInputValue(initialAnswer || '');
    stopSpeech();
    setIsPlayingAudio(false);
    return () => {
      stopSpeech();
    };
  }, [question.id, initialAnswer]);

  const toggleTTS = () => {
    if (!isTTSSupported()) {
      alert('Dein Browser unterstützt leider keine Sprachausgabe.');
      return;
    }

    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    let textToRead = question.text;
    if (question.storyContext) {
      textToRead = `${question.storyContext}. ${textToRead}`;
    }
    if (question.readingPassage) {
      textToRead = `${textToRead}. ${question.readingPassage}`;
    }

    const lang = question.subject === 'english' ? 'en-US' : 'de-DE';

    setIsPlayingAudio(true);
    speakText(textToRead, {
      lang,
      rate: 0.9,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleDirectSubmit = (answer: string) => {
    stopSpeech();
    setIsPlayingAudio(false);
    onAnswerSubmit(answer);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim()) {
      handleDirectSubmit(inputValue.trim());
    }
  };

  const handleOptionClick = (option: string) => {
    handleDirectSubmit(option);
  };

  const handleSkip = () => {
    handleDirectSubmit('');
  };

  const isEnglishGrammarOrVocab =
    question.subject === 'english' && (question.topic === 'Vokabeln' || question.topic === 'Grammatik');

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* QUESTION NAVIGATION & ACTION BAR (ZURÜCK / MARKIEREN) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          {onStepBack && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canStepBack}
              onClick={onStepBack}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: canStepBack ? 1 : 0.5,
                cursor: canStepBack ? 'pointer' : 'not-allowed',
              }}
              title="Zur vorherigen Frage zurückkehren"
            >
              <ArrowLeft size={16} />
              <span>Zurück</span>
            </button>
          )}
        </div>
        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => toggleBookmarkQuestion(question.id)}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: isBookmarked ? '#fef3c7' : undefined,
              color: isBookmarked ? '#b45309' : undefined,
              borderColor: isBookmarked ? '#fde68a' : undefined,
              fontWeight: isBookmarked ? 600 : undefined,
            }}
            title={isBookmarked ? 'Markierung aufheben' : 'Frage markieren'}
          >
            <Bookmark size={16} fill={isBookmarked ? "#f59e0b" : "none"} color={isBookmarked ? "#b45309" : "currentColor"} />
            <span>{isBookmarked ? 'Gemerkt' : 'Markieren'}</span>
          </button>
        </div>
      </div>

      {/* SOFT RECOMMENDATION BADGE WHEN TARGET TIME IS EXCEEDED */}
      {targetTimeExceeded && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <TimeUpBanner />
        </div>
      )}

      {/* STORY CONTEXT PREAMBLE */}
      {question.storyContext && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            borderLeft: '4px solid #3B82F6',
            padding: '1rem 1.25rem',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem',
            textAlign: 'left',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#1D4ED8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Compass size={16} /> Alltags-Szenario / Sachaufgabe
          </div>
          <div style={{ fontSize: '0.98rem', color: '#1E3A8A', lineHeight: '1.5', fontWeight: 500 }}>
            {question.storyContext}
          </div>
        </div>
      )}

      {/* READING PASSAGE */}
      {question.readingPassage && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            borderLeft: '4px solid var(--primary, #4f46e5)',
            padding: '1.25rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            whiteSpace: 'pre-line',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: 'var(--primary, #4f46e5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> Lesetext / Reading Passage
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={toggleTTS}
              title="Lesetext vorlesen lassen"
            >
              {isPlayingAudio ? <VolumeX size={15} color="var(--danger)" /> : <Volume2 size={15} color="var(--primary)" />}
              <span>{isPlayingAudio ? 'Stopp' : 'Vorlesen'}</span>
            </button>
          </div>
          <div style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-main, #1e293b)' }}>
            {question.readingPassage}
          </div>
        </div>
      )}

      {/* GEOMETRY SVG DIAGRAM */}
      {(question.subject === 'math' || question.topic === 'Geometrie' || question.diagramData) && (
        <GeometryDiagram text={question.text} topic={question.topic} diagramData={question.diagramData} />
      )}

      {/* QUESTION TEXT + AUDIO TTS BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', margin: 0, textAlign: 'center' }}>
          {question.text}
        </h3>
        {!question.readingPassage && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.6rem', borderRadius: '50%' }}
            onClick={toggleTTS}
            title="Frage vorlesen lassen"
          >
            {isPlayingAudio ? <VolumeX size={18} color="var(--danger)" /> : <Volume2 size={18} color="var(--primary)" />}
          </button>
        )}
      </div>

      {/* ENGLISH ARTICLE TOLERANCE BADGE */}
      {isEnglishGrammarOrVocab && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: '#4338CA',
              backgroundColor: 'rgba(79, 70, 229, 0.08)',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid rgba(79, 70, 229, 0.15)',
              fontWeight: 500,
            }}
          >
            <Sparkles size={14} />
            <span>Artikel ([a], [an], [the]) & Großschreibung werden automatisch akzeptiert</span>
          </div>
        </div>
      )}

      {/* 1. DRAG SORT QUESTION */}
      {question.type === 'drag-sort' && (
        <DragSortQuestion
          items={question.dragItems || []}
          onAnswerSubmit={handleDirectSubmit}
          onSkip={handleSkip}
        />
      )}

      {/* 2. MATCHING QUESTION */}
      {question.type === 'matching' && (
        <MatchingQuestion
          pairs={question.matchingPairs || []}
          onAnswerSubmit={handleDirectSubmit}
          onSkip={handleSkip}
        />
      )}

      {/* 3. FRACTION PIE QUESTION */}
      {question.type === 'fraction-pie' && (
        <FractionPieQuestion
          targetFraction={question.targetFraction}
          onAnswerSubmit={handleDirectSubmit}
          onSkip={handleSkip}
        />
      )}

      {/* 4. MULTIPLE CHOICE OPTIONS */}
      {question.type === 'multiple-choice' && shuffledOptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
            {shuffledOptions.map((option, idx) => (
              <button
                key={`${question.id}_opt_${idx}`}
                className="btn btn-secondary"
                style={{ padding: '1.25rem', fontSize: '1.05rem', transition: 'all 0.2s ease' }}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
            onClick={handleSkip}
          >
            <FastForward size={16} />
            Frage überspringen
          </button>
        </div>
      )}

      {/* 5. INPUT FIELD */}
      {question.type === 'input' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
            <input
              type="text"
              className="input"
              style={{ maxWidth: '320px', fontSize: '1.05rem' }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Deine Antwort..."
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!inputValue.trim()}>
              <Send size={20} />
              Bestätigen
            </button>
          </form>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
            onClick={handleSkip}
          >
            <FastForward size={16} />
            Frage überspringen
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
