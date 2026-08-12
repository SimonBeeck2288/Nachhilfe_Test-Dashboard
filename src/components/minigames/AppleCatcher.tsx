import React, { useState, useEffect, useRef } from 'react';

interface Apple {
  id: number;
  x: number;
  top: number;
  speed: number;
  type: 'red' | 'golden';
}

export const AppleCatcher: React.FC = () => {
  const [basketX, setBasketX] = useState<number>(50); // percentage 0-100
  const [apples, setApples] = useState<Apple[]>([]);
  const [caughtCount, setCaughtCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Mouse / Touch movement for basket
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
    setBasketX(percentage);
  };

  // Spawn falling apples
  useEffect(() => {
    const interval = setInterval(() => {
      setApples((prev) => {
        if (prev.length >= 8) return prev;
        const isGolden = Math.random() < 0.2;
        const newApple: Apple = {
          id: Date.now() + Math.random(),
          x: Math.floor(Math.random() * 80) + 10,
          top: 0,
          speed: Math.random() * 1.5 + 1.2,
          type: isGolden ? 'golden' : 'red',
        };
        return [...prev, newApple];
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  // Update apple positions & collision check with basket
  useEffect(() => {
    const animation = setInterval(() => {
      setApples((prev) => {
        const remaining: Apple[] = [];
        let newlyCaught = 0;

        for (const apple of prev) {
          const nextTop = apple.top + apple.speed;
          // Basket collision zone near bottom (~80% - 90% top)
          if (nextTop >= 80 && nextTop <= 90) {
            const distance = Math.abs(apple.x - basketX);
            if (distance < 12) {
              // Caught!
              newlyCaught += apple.type === 'golden' ? 3 : 1;
              continue;
            }
          }

          if (nextTop < 105) {
            remaining.push({ ...apple, top: nextTop });
          }
        }

        if (newlyCaught > 0) {
          setCaughtCount((c) => c + newlyCaught);
        }

        return remaining;
      });
    }, 30);

    return () => clearInterval(animation);
  }, [basketX]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '320px',
        backgroundColor: '#064e3b',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '2px solid #34d399',
        boxShadow: 'inset 0 0 20px rgba(52, 211, 153, 0.2)',
        userSelect: 'none',
        cursor: 'crosshair',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          zIndex: 10,
          backgroundColor: 'rgba(6, 78, 59, 0.85)',
          padding: '0.4rem 0.8rem',
          borderRadius: '0.5rem',
          border: '1px solid #34d399',
          color: '#34d399',
          fontWeight: 700,
          fontSize: '0.9rem',
        }}
      >
        Äpfel gefangen: {caughtCount} 🍎
      </div>

      {/* Falling Apples */}
      {apples.map((apple) => (
        <div
          key={apple.id}
          style={{
            position: 'absolute',
            left: `${apple.x}%`,
            top: `${apple.top}%`,
            fontSize: '1.8rem',
            transform: 'translate(-50%, -50%)',
            transition: 'top 0.03s linear',
          }}
        >
          {apple.type === 'golden' ? '🍏' : '🍎'}
        </div>
      ))}

      {/* Basket */}
      <div
        style={{
          position: 'absolute',
          left: `${basketX}%`,
          bottom: '15px',
          transform: 'translateX(-50%)',
          fontSize: '2.5rem',
          transition: 'left 0.05s ease-out',
        }}
      >
        🧺
      </div>
    </div>
  );
};
