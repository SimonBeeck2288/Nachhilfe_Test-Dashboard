import React, { useState, useEffect } from 'react';

interface Bubble {
  id: number;
  x: number;
  size: number;
  color: string;
  speed: number;
  bottom: number;
}

const BUBBLE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const BubblePopper: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState<number>(0);

  // Spawn bubbles periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length >= 15) return prev;
        const newBubble: Bubble = {
          id: Date.now() + Math.random(),
          x: Math.floor(Math.random() * 85) + 5,
          size: Math.floor(Math.random() * 30) + 40,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          speed: Math.random() * 1.5 + 1,
          bottom: 0,
        };
        return [...prev, newBubble];
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // Float bubbles up
  useEffect(() => {
    const animation = setInterval(() => {
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, bottom: b.bottom + b.speed }))
          .filter((b) => b.bottom < 110)
      );
    }, 30);

    return () => clearInterval(animation);
  }, []);

  const handlePop = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setPoppedCount((prev) => prev + 1);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '320px',
        backgroundColor: '#0f172a',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '2px solid #38bdf8',
        boxShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.2)',
        userSelect: 'none',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          zIndex: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          padding: '0.4rem 0.8rem',
          borderRadius: '0.5rem',
          border: '1px solid #38bdf8',
          color: '#38bdf8',
          fontWeight: 700,
          fontSize: '0.9rem',
        }}
      >
        Geplatzt: {poppedCount} 🫧
      </div>

      {/* Floating Bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          role="button"
          tabIndex={0}
          aria-label="Seifenblase platzen"
          onClick={() => handlePop(b.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handlePop(b.id);
            }
          }}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            bottom: `${b.bottom}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${b.color})`,
            boxShadow: `0 0 10px ${b.color}`,
            cursor: 'pointer',
            transition: 'transform 0.1s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.85,
          }}
        >
          {/* Highlight ring */}
          <div
            style={{
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '15%',
              left: '20%',
              opacity: 0.7,
            }}
          />
        </div>
      ))}
    </div>
  );
};
