import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';

const LevelProposal: React.FC = () => {
  const navigate = useNavigate();
  const { state, setMathLevel, setEnglishLevel } = useTestSession();

  const cognAnswers = state.answers.filter((a) => a.subject === 'cognition');
  const totalTrials = cognAnswers.length;
  const correctTrials = cognAnswers.filter((a) => a.isCorrect).length;
  const accuracy = totalTrials > 0 ? (correctTrials / totalTrials) * 100 : 100;
  
  const avgReactionTimeMs =
    totalTrials > 0
      ? Math.round(
          cognAnswers.reduce(
            (acc, a) => acc + (a.reactionTime || a.timeTaken * 1000),
            0
          ) / totalTrials
        )
      : 1200;

  const proposedLevel = state.stroopCalibratedLevel || 1;
  const timeMultiplier = state.recommendedTimeMultiplier || 1.0;

  const [selectedMathLevel, setSelectedMathLevel] = useState<number>(proposedLevel);
  const [selectedEnglishLevel, setSelectedEnglishLevel] = useState<number>(proposedLevel);

  const speedRatingText =
    accuracy >= 80 && avgReactionTimeMs < 1200
      ? 'Sehr schnell & hochkonzentriert'
      : accuracy >= 70 && avgReactionTimeMs < 1800
      ? 'Normale Reaktionszeit & solide Genauigkeit'
      : 'Sorgfältige / bedächtige Bearbeitung';

  const handleStartSubjectTests = () => {
    setMathLevel(selectedMathLevel);
    setEnglishLevel(selectedEnglishLevel);
    navigate('/math');
  };

  return (
    <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
        Kognitive Kalibrierung & Stufen-Empfehlung
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Basierend auf deinen Ergebnissen im Kognitionstest haben wir deine Start-Schwierigkeitsstufe kalibriert.
      </p>

      {/* Summary Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-color, #f8fafc)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)' }}>
          Ergebnis des Stroop-Aufmerksamkeitstests
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reaktionszeit:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{avgReactionTimeMs} ms</div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Genauigkeit:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{Math.round(accuracy)}%</div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bewertung:</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent, #3b82f6)' }}>
              {speedRatingText}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Empfohlene Start-Stufe:
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              Level {proposedLevel}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Zeit-Multiplikator:
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {timeMultiplier}x Richtzeit
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation / Adjustment Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Start-Stufen anpassen / bestätigen</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Du oder deine Nachhilfekraft könnt die Einstiegsstufe für die Fächer vor Beginn des Tests anpassen.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Math Level Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Startlevel Mathematik:
            </label>
            <select
              className="input"
              value={selectedMathLevel}
              onChange={(e) => setSelectedMathLevel(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                <option key={`math_lvl_${lvl}`} value={lvl}>
                  Level {lvl} {lvl === proposedLevel ? '(Empfohlen)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* English Level Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Startlevel Englisch:
            </label>
            <select
              className="input"
              value={selectedEnglishLevel}
              onChange={(e) => setSelectedEnglishLevel(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                <option key={`eng_lvl_${lvl}`} value={lvl}>
                  Level {lvl} {lvl === proposedLevel ? '(Empfohlen)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button className="btn btn-primary" onClick={handleStartSubjectTests}>
          Einstufung bestätigen & Mathe-Test starten
        </button>
      </div>
    </div>
  );
};

export default LevelProposal;
