import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, Play } from 'lucide-react';

interface MeditativeIntermissionProps {
  onComplete: () => void;
  nextModuleTitle?: string;
}

export const MeditativeIntermission: React.FC<MeditativeIntermissionProps> = ({
  onComplete,
  nextModuleTitle = 'Nächstes Modul',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep latest onComplete callback in ref to prevent timer re-instantiation
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Ref to guarantee single onComplete invocation
  const hasCompletedRef = useRef(false);

  // Ref to manage interval lifecycle
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Centralized completion handler with single-invocation guard and interval cleanup
  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onCompleteRef.current();
  }, []);

  // Play synthesized meditative gong using Web Audio API
  const playGongSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
      masterGain.connect(ctx.destination);

      // Low fundamental gong frequencies
      const frequencies = [110, 220, 330, 442, 660];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Fundamental vs overtones
        const initialGain = idx === 0 ? 0.6 : 0.3 / (idx + 1);
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(initialGain, now + 0.08); // gentle attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5 + idx * 0.3); // long decay

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn('Could not play gong audio:', e);
    }
  }, []);

  // Play gong on mount
  useEffect(() => {
    playGongSound();
  }, [playGongSound]);

  // Stable countdown timer (mounts ONCE on component mount)
  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = (timeLeft / 90) * 100;

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '1.25rem',
        border: '1px solid #1e293b',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
          <Sparkles size={24} color="#818cf8" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9' }}>
              Pause & Entspannung (90 Sek.)
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Atme tief durch und entspanne deine Augen. Danach geht es weiter mit: <strong>{nextModuleTitle}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={playGongSound}
            title="Gong ertönen lassen"
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
            }}
          >
            <Volume2 size={16} color="#818cf8" />
            <span>Gong 🔔</span>
          </button>

          <button
            onClick={handleComplete}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #6366f1',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <span>Weiter</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Decaying progress bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#1e293b',
          borderRadius: '4px',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: '#818cf8',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Breathing Meditation Circle & Timer Display */}
      <div
        style={{
          margin: '1.5rem 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '200px',
          height: '200px',
          zIndex: 2,
        }}
      >
        {/* Pulsing breathing ring */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid rgba(129, 140, 248, 0.4)',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            animation: 'meditationPulse 4s ease-in-out infinite',
          }}
        />
        <style>
          {`
            @keyframes meditationPulse {
              0% { transform: scale(0.85); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.9; }
              100% { transform: scale(0.85); opacity: 0.5; }
            }
          `}
        </style>

        {/* Center Countdown Display */}
        <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
            {formattedTime}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Pause
          </div>
        </div>
      </div>

      {/* Mindful prompt */}
      <div
        style={{
          fontSize: '0.95rem',
          color: '#cbd5e1',
          fontStyle: 'italic',
          maxWidth: '500px',
          zIndex: 2,
          lineHeight: '1.5',
        }}
      >
        "Tief durchatmen, Schultern locker lassen und für einen kurzen Moment entspannen."
      </div>

      {/* Footer info */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          zIndex: 2,
        }}
      >
        <Play size={14} /> Automatischer Weitergang in <strong>{timeLeft}</strong>s
      </div>
    </div>
  );
};
