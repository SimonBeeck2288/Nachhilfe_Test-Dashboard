import { useState, useEffect, useCallback } from 'react';

export const useQuestionTimer = (initialTargetTime: number = 45, isPaused: boolean = false) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [targetTime, setTargetTime] = useState(initialTargetTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((time) => time + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const resetTimer = useCallback((newTargetTime?: number) => {
    setElapsedTime(0);
    if (newTargetTime !== undefined) {
      setTargetTime(newTargetTime);
    }
    setIsActive(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const isExceeded = elapsedTime > targetTime;

  return {
    elapsedTime,
    targetTime,
    isExceeded,
    isActive,
    resetTimer,
    stopTimer,
  };
};

