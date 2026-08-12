import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestSession } from '../context/TestSessionContext';
import { calculateStroopCalibration } from '../utils/adaptive';

const COLORS = [
  { name: 'ROT', hex: '#EF4444', key: '1' },
  { name: 'BLAU', hex: '#3B82F6', key: '2' },
  { name: 'GRÜN', hex: '#10B981', key: '3' },
  { name: 'GELB', hex: '#F59E0B', key: '4' }
];

const TOTAL_TRIALS = 10;

const ModuleCognition: React.FC = () => {
  const navigate = useNavigate();
  const { recordAnswer, setStroopCalibration } = useTestSession();

  const [hasStarted, setHasStarted] = useState(false);
  const [trial, setTrial] = useState(0);
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [startTime, setStartTime] = useState<number>(0);
  const [trialsData, setTrialsData] = useState<{ isCorrect: boolean; reactionTime: number }[]>([]);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const generateTrial = useCallback(() => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setCurrentWord(word);
    setCurrentColor(color);
    setStartTime(Date.now());
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    generateTrial();
  };

  const handleAnswer = useCallback((colorObj: typeof COLORS[0]) => {
    if (!hasStarted || trial >= TOTAL_TRIALS) return;

    setPressedKey(colorObj.key);
    setTimeout(() => setPressedKey(null), 200);

    const reactionTime = Date.now() - startTime;
    const isCorrect = colorObj.hex === currentColor.hex;

    recordAnswer({
      questionId: `stroop_${trial}`,
      topic: 'Reaktion',
      subject: 'cognition',
      isCorrect,
      timeTaken: reactionTime / 1000,
      usedExtraTime: false,
      reactionTime
    });

    const updatedTrials = [...trialsData, { isCorrect, reactionTime }];
    setTrialsData(updatedTrials);

    if (trial + 1 >= TOTAL_TRIALS) {
      const correctCount = updatedTrials.filter(t => t.isCorrect).length;
      const accuracy = correctCount / TOTAL_TRIALS;
      const avgReactionTimeMs = updatedTrials.reduce((sum, t) => sum + t.reactionTime, 0) / TOTAL_TRIALS;
      const calibration = calculateStroopCalibration({ avgReactionTimeMs, accuracy });

      setStroopCalibration(calibration.proposedLevel, calibration.recommendedTimeMultiplier);
      setTrial(trial + 1);
    } else {
      setTrial(prev => prev + 1);
      generateTrial();
    }
  }, [hasStarted, trial, startTime, currentColor.hex, recordAnswer, generateTrial, trialsData, setStroopCalibration]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const color = COLORS.find(c => c.key === e.key);
      if (color) {
        handleAnswer(color);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer]);

  if (!hasStarted) {
    return (
      <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}>Modul 2: Kognition & Aufmerksamkeit</h2>
        <p style={{ margin: '1rem 0' }}>
          Im nächsten Test geht es um deine Reaktionsgeschwindigkeit und Konzentration.
        </p>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '2rem' }}>
          <h3>Aufgabe (Stroop-Test):</h3>
          <p>
            Du siehst gleich Wörter auf dem Bildschirm. Deine Aufgabe ist es, anzugeben, 
            in welcher <strong>Farbe</strong> das Wort geschrieben ist, <em>nicht</em> was das Wort bedeutet!
          </p>
          <p>Beispiel: Wenn du das Wort <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>ROT</span> siehst, musst du "BLAU" wählen, da die Schriftfarbe Blau ist.</p>
          <p>
            Tipp: Die Farb-Buttons sind horizontal in einer 1x4-Reihe angeordnet. Verwende die Tastatur-Keycaps <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>1</kbd>, <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>2</kbd>, <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>3</kbd>, <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>4</kbd> oder klicke direkt.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleStart}>
          Test Starten
        </button>
      </div>
    );
  }

  if (trial >= TOTAL_TRIALS) {
    return (
      <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}>Kognitionstest Abgeschlossen!</h2>
        <p style={{ margin: '1.5rem 0' }}>
          Super gemacht! Deine Reaktionsgeschwindigkeit und Aufmerksamkeit wurden analysiert, 
          um die optimale Start-Schwierigkeit für deine Mathe- und Englischtests zu bestimmen.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/level-proposal')} style={{ marginTop: '1rem' }}>
          Weiter zur Einstufungs-Empfehlung
        </button>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Durchgang {trial + 1} von {TOTAL_TRIALS}
      </div>

      <div style={{ 
        fontSize: '4rem', 
        fontWeight: 'bold', 
        color: currentColor.hex,
        margin: '3rem 0',
        textTransform: 'uppercase'
      }}>
        {currentWord.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '650px', margin: '0 auto' }}>
        {COLORS.map((color) => {
          const isPressed = pressedKey === color.key;
          return (
            <button 
              key={color.hex}
              className="btn"
              style={{ 
                padding: '1.1rem 0.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.6rem',
                border: `2px solid ${color.hex}`,
                backgroundColor: isPressed ? `${color.hex}22` : 'var(--surface, #ffffff)',
                borderRadius: '0.75rem',
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.15s ease',
                boxShadow: isPressed ? 'none' : `0 4px 10px ${color.hex}25`,
                cursor: 'pointer',
              }}
              onClick={() => handleAnswer(color)}
            >
              <kbd 
                style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 800, 
                  fontFamily: 'monospace',
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '6px', 
                  backgroundColor: isPressed ? color.hex : '#f1f5f9', 
                  color: isPressed ? '#ffffff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  boxShadow: isPressed ? 'none' : '0 2px 0 #cbd5e1',
                  transition: 'all 0.15s ease',
                }}
              >
                {color.key}
              </kbd>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: color.hex }}>{color.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleCognition;
