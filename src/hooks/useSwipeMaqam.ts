// src/hooks/useSwipeMaqam.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Maqam } from '../theory/maqam';

interface UseSwipeMaqamProps {
  currentMaqam: Maqam;
  allMaqamat: Maqam[];
  onSelectMaqam: (maqam: Maqam) => void;
  enabled?: boolean;
}

export function useSwipeMaqam({
  currentMaqam,
  allMaqamat,
  onSelectMaqam,
  enabled = true
}: UseSwipeMaqamProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const [swipeFeedback, setSwipeFeedback] = useState<{
    direction: 'left' | 'right';
    maqamName: string;
    arabicName: string;
  } | null>(null);

  const navigateMaqam = useCallback(
    (direction: 'next' | 'prev') => {
      const currentIndex = allMaqamat.findIndex(m => m.id === currentMaqam.id);
      if (currentIndex === -1) return;

      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= allMaqamat.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = allMaqamat.length - 1;

      const targetMaqam = allMaqamat[nextIndex];
      onSelectMaqam(targetMaqam);

      setSwipeFeedback({
        direction: direction === 'next' ? 'left' : 'right',
        maqamName: targetMaqam.name,
        arabicName: targetMaqam.arabicName ?? 'N/A'
      });

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // safe
        }
      }

      setTimeout(() => {
        setSwipeFeedback(null);
      }, 1200);
    },
    [allMaqamat, currentMaqam.id, onSelectMaqam]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveTag = target.closest(
        'button, select, input, textarea, canvas, [role="slider"], .no-swipe'
      );
      if (interactiveTag) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;

      touchStartX.current = null;
      touchStartY.current = null;

      if (
        Math.abs(deltaX) > 55 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.6 &&
        deltaTime < 600
      ) {
        if (deltaX < 0) {
          navigateMaqam('next');
        } else {
          navigateMaqam('prev');
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, navigateMaqam]);

  return {
    swipeFeedback,
    navigateMaqam
  };
}
