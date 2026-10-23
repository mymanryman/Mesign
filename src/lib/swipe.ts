import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

export type SwipeDirection = 'left' | 'right';

/** Ett svajp räknas när fingret rört sig minst så här långt i sidled, och mer i sidled än i höjdled. */
export const SWIPE_THRESHOLD = 50;

export function classifySwipe(dx: number, dy: number, threshold = SWIPE_THRESHOLD): SwipeDirection | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 'left' : 'right';
}

type Options = {
  onSwipe: (direction: SwipeDirection) => void;
  /** Om ett håll inte går att svajpa åt (t.ex. första tecknet) gör kortet motstånd i stället. */
  canSwipe?: (direction: SwipeDirection) => boolean;
};

/**
 * Låter ett element svajpas i sidled med finger eller mus. Elementet får `touch-action: pan-y`
 * så att sidan fortfarande går att scrolla uppåt och nedåt.
 */
export function useSwipe({ onSwipe, canSwipe = () => true }: Options) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);
  const [offset, setOffset] = useState(0);

  const end = (e: ReactPointerEvent) => {
    const s = start.current;
    start.current = null;
    setOffset(0);
    if (!s || s.id !== e.pointerId) return;
    const direction = classifySwipe(e.clientX - s.x, e.clientY - s.y);
    if (direction && canSwipe(direction)) onSwipe(direction);
  };

  return {
    offset,
    bind: {
      style: { touchAction: 'pan-y' as const, transform: offset ? `translateX(${offset}px)` : undefined, transition: offset ? 'none' : 'transform 150ms ease-out' },
      onPointerDown: (e: ReactPointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        moved.current = false;
      },
      onPointerMove: (e: ReactPointerEvent) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (!moved.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          moved.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        if (!moved.current) return;
        const allowed = canSwipe(dx < 0 ? 'left' : 'right');
        setOffset(allowed ? dx : dx / 4);
      },
      onPointerUp: end,
      onPointerCancel: () => {
        start.current = null;
        setOffset(0);
      },
      // Ett svajp ska inte också räknas som ett tryck, t.ex. "spela igen" på videon.
      onClickCapture: (e: ReactMouseEvent) => {
        if (moved.current) {
          e.stopPropagation();
          e.preventDefault();
          moved.current = false;
        }
      },
    },
  };
}
